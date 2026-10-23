-- Saída da colmeia pelo celular sem login (link de uso único gerado por quem está logado)
create table if not exists public.hive_tokens (
  token text primary key,
  oid text not null,
  how text not null check (how in ('retirou','enviado')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_colmeia text
);
alter table public.hive_tokens enable row level security; -- sem políticas: acesso só pelas funções abaixo

create or replace function public.create_hive_token(p_oid text, p_how text)
returns text language plpgsql security definer set search_path = public as $$
declare r text; cm text;
begin
  if coalesce(app_role(),'') not in ('admin','supervisor','comercial','compras','estoque','separador','conferente') then
    raise exception 'Sem permissão para liberar colmeias';
  end if;
  if p_how not in ('retirou','enviado') then raise exception 'Ação inválida'; end if;
  select data->>'colmeia' into cm from orders where id = p_oid;
  if cm is null then raise exception 'O pedido não está em uma colmeia'; end if;
  delete from hive_tokens where expires_at < now() - interval '7 days';
  r := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  insert into hive_tokens(token, oid, how, created_by, expires_at) values (r, p_oid, p_how, auth.uid(), now() + interval '2 hours');
  return r;
end $$;

-- dados mínimos para a tela do celular (sem preços)
create or replace function public.hive_token_info(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t hive_tokens; o jsonb; nm text;
begin
  select * into t from hive_tokens where token = p_token;
  if not found then return jsonb_build_object('error','Link inválido.'); end if;
  if t.used_at is not null then return jsonb_build_object('error','Este link já foi usado.', 'used', true); end if;
  if t.expires_at < now() then return jsonb_build_object('error','Este link expirou. Gere um novo QR code no computador.'); end if;
  select data into o from orders where id = t.oid;
  if o is null then return jsonb_build_object('error','Pedido não encontrado.'); end if;
  if o->>'colmeia' is null then return jsonb_build_object('error','Este pedido não está mais na colmeia.'); end if;
  select coalesce(nullif(name,''), email) into nm from profiles where id = t.created_by;
  return jsonb_build_object('how', t.how, 'by', nm, 'order', jsonb_build_object(
    'id', o->'id', 'num', o->'num', 'client', o->'client', 'colmeia', o->'colmeia', 'status', o->'status', 'mode', o->'mode',
    'remessa', o->'remessa', 'arrivedAt', o->'arrivedAt', 'retira', o->'retira', 'obs', o->'obs', 'hiveManual', o->'hiveManual',
    'items', coalesce((select jsonb_agg(jsonb_build_object('code', i->'code', 'name', i->'name', 'ean', i->'ean', 'qty', i->'qty',
      'qtyEnc', coalesce(i->'qtyEnc','0'::jsonb), 'eta', i->'eta', 'compra', i->'compra')) from jsonb_array_elements(coalesce(o->'items','[]'::jsonb)) i), '[]'::jsonb)));
end $$;

-- confirma a saída: mesma regra do app (colmeiaSaida); fica registrado em nome de quem gerou o link
create or replace function public.hive_token_confirm(p_token text, p_colmeia text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t hive_tokens; o jsonb; now_ms bigint := (extract(epoch from now())*1000)::bigint; has_enc boolean; arrived boolean; patch jsonb; res text;
begin
  select * into t from hive_tokens where token = p_token for update;
  if not found then return jsonb_build_object('error','Link inválido.'); end if;
  if t.used_at is not null then return jsonb_build_object('error','Este link já foi usado.'); end if;
  if t.expires_at < now() then return jsonb_build_object('error','Este link expirou.'); end if;
  select data into o from orders where id = t.oid for update;
  if o is null or o->>'colmeia' is null then return jsonb_build_object('error','Este pedido não está mais na colmeia.'); end if;
  if upper(o->>'colmeia') <> upper(p_colmeia) then return jsonb_build_object('error','Colmeia errada.'); end if;
  has_enc := exists(select 1 from jsonb_array_elements(coalesce(o->'items','[]'::jsonb)) i where coalesce((i->>'qtyEnc')::numeric,0) > 0);
  arrived := (o->'arrivedAt') is not null and o->'arrivedAt' <> 'null'::jsonb or (o->>'mode' = 'parcial' and o->>'remessa' = '2');
  if coalesce(o->>'remessa','1') <> '2' and has_enc and not arrived then
    patch := jsonb_build_object('status','enc_pendente','colmeia',null,'sentAt1',now_ms,'saida1',t.how,'saida1By',t.created_by::text,'saidaVia','qr');
    if coalesce(o->>'mode','') <> 'parcial' then patch := patch || jsonb_build_object('mode','parcial','modeOrig',o->'mode'); end if;
    res := 'parcial';
  else
    patch := jsonb_build_object('status','enviado','sentAt',now_ms,'saida',t.how,'saidaBy',t.created_by::text,'saidaVia','qr');
    res := 'final';
  end if;
  update orders set data = data || patch, updated_at = now() where id = t.oid;
  update hive_tokens set used_at = now(), used_colmeia = p_colmeia where token = p_token;
  return jsonb_build_object('ok', true, 'result', res, 'num', o->'num', 'colmeia', o->'colmeia');
end $$;

revoke all on function public.create_hive_token(text,text) from public, anon;
grant execute on function public.create_hive_token(text,text) to authenticated;
revoke all on function public.hive_token_info(text) from public;
revoke all on function public.hive_token_confirm(text,text) from public;
grant execute on function public.hive_token_info(text) to anon, authenticated;
grant execute on function public.hive_token_confirm(text,text) to anon, authenticated;
