-- Recebimento pelo celular sem login: link de uso único para conferir UMA nota fiscal
create table if not exists public.nf_tokens (
  token text primary key, nf_id text not null, created_by uuid not null,
  created_at timestamptz not null default now(), expires_at timestamptz not null);
alter table public.nf_tokens enable row level security; -- sem políticas: acesso só pelas funções

create or replace function public.create_nf_token(p_nf text)
returns text language plpgsql security definer set search_path = public as $$
declare r text; n jsonb;
begin
  if not (app_roles() && array['admin','supervisor','compras','estoque']) then raise exception 'Sem permissão para receber notas'; end if;
  select data into n from invoices where id = p_nf;
  if n is null then raise exception 'Nota não encontrada'; end if;
  if n->'received' is not null and n->'received' <> 'null'::jsonb then raise exception 'Esta nota já foi recebida'; end if;
  delete from nf_tokens where expires_at < now() - interval '7 days';
  r := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  insert into nf_tokens(token, nf_id, created_by, expires_at) values (r, p_nf, auth.uid(), now() + interval '4 hours');
  return r;
end $$;

-- pedidos amarrados à nota
create or replace function public.nf_token_oids(n jsonb)
returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct a->>'oid'), '{}') from jsonb_array_elements(coalesce(n->'lines','[]'::jsonb)) l, jsonb_array_elements(coalesce(l->'alloc','[]'::jsonb)) a
$$;

create or replace function public.nf_token_info(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t nf_tokens; n jsonb; nm text;
begin
  select * into t from nf_tokens where token = p_token;
  if not found then return jsonb_build_object('error','Link inválido.'); end if;
  if t.expires_at < now() then return jsonb_build_object('error','Este link expirou. Gere um novo QR code no computador.'); end if;
  select data into n from invoices where id = t.nf_id;
  if n is null then return jsonb_build_object('error','Nota não encontrada.'); end if;
  if n->'received' is not null and n->'received' <> 'null'::jsonb then return jsonb_build_object('error','Esta nota já foi recebida.', 'done', true); end if;
  select coalesce(nullif(name,''), email) into nm from profiles where id = t.created_by;
  return jsonb_build_object('by', nm, 'byId', t.created_by, 'nf', n,
    'orders', coalesce((select jsonb_agg(data) from orders where id = any(nf_token_oids(n))), '[]'::jsonb),
    'hive', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'colmeia', data->'colmeia', 'status', data->'status', 'mode', data->'mode', 'retira', data->'retira', 'naLoja', data->'naLoja', 'canal', data->'canal', 'stub', true))
                      from orders where data->>'colmeia' is not null and data->>'status' not in ('enviado','excluido') and not (id = any(nf_token_oids(n)))), '[]'::jsonb),
    'hiveDim', (select data->'colmeias' from config where id = 'mesas'));
end $$;

-- gravações feitas pelo celular: só a própria nota (enquanto não recebida) e os pedidos amarrados a ela, com campos limitados
create or replace function public.nf_token_write(p_token text, p_table text, p_id text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t nf_tokens; n jsonb; clean jsonb;
begin
  select * into t from nf_tokens where token = p_token;
  if not found or t.expires_at < now() then return jsonb_build_object('error','Link expirado.'); end if;
  select data into n from invoices where id = t.nf_id;
  if p_table = 'invoices' then
    if p_id <> t.nf_id or coalesce(p_data->>'id', p_id) <> t.nf_id then return jsonb_build_object('error','Nota inválida.'); end if;
    if n->'received' is not null and n->'received' <> 'null'::jsonb then return jsonb_build_object('error','Esta nota já foi recebida.'); end if;
    update invoices set data = p_data, updated_at = now() where id = t.nf_id;
    return jsonb_build_object('ok', true);
  elsif p_table = 'orders' then
    if not (p_id = any(nf_token_oids(n))) then return jsonb_build_object('error','Pedido não pertence a esta nota.'); end if;
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into clean from jsonb_each(p_data)
      where key in ('items','fase2','res1','res','status','queuedAt','arrivedAt','arrivedBy','nfRecebida','tray','trayStatus','startedAt','pickedAt','atMesaAt','mode','colmeia');
    update orders set data = data || clean, updated_at = now() where id = p_id;
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('error','Tabela inválida.');
end $$;

revoke all on function public.create_nf_token(text) from public, anon;
grant execute on function public.create_nf_token(text) to authenticated;
revoke all on function public.nf_token_info(text) from public;
revoke all on function public.nf_token_write(text,text,text,jsonb) from public;
grant execute on function public.nf_token_info(text) to anon, authenticated;
grant execute on function public.nf_token_write(text,text,text,jsonb) to anon, authenticated;
