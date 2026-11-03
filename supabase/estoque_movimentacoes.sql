-- Consulta de movimentações (entradas e devoluções dos últimos 45 dias) pelo mesmo canal da consulta de estoque.
-- Depende de supabase/estoque_saldo.sql.
alter table public.estoque_consultas add column if not exists tipo text not null default 'saldo';
alter table public.estoque_consultas add column if not exists dados jsonb;
alter table public.estoque_consultas drop constraint if exists estoque_consultas_tipo_check;
alter table public.estoque_consultas add constraint estoque_consultas_tipo_check check (tipo in ('saldo','mov'));

drop function if exists public.estoque_solicitar(text);
create or replace function public.estoque_solicitar(p_produto text, p_tipo text default 'saldo')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_st record;
begin
  if public.app_role() is null then raise exception 'sem acesso' using errcode = '42501'; end if;
  if coalesce(trim(p_produto),'') = '' then raise exception 'produto vazio'; end if;
  if coalesce(p_tipo,'saldo') not in ('saldo','mov') then raise exception 'tipo invalido'; end if;
  select visto_em, adsomos_aberto into v_st from private.extensao_status where id = 1;
  if v_st.visto_em is null or v_st.visto_em < now() - interval '20 seconds' then
    raise exception 'EXTENSAO_OFFLINE';
  end if;
  if not v_st.adsomos_aberto then raise exception 'ADSOMOS_FECHADO'; end if;
  insert into public.estoque_consultas(produto_id, tipo) values (trim(p_produto), coalesce(p_tipo,'saldo')) returning id into v_id;
  return v_id;
end $$;

create or replace function public.estoque_pendentes(p_key text, p_adsomos_aberto boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  perform private.check_sync_key(p_key);
  update private.extensao_status set visto_em = now(), adsomos_aberto = coalesce(p_adsomos_aberto,false) where id = 1;
  update public.estoque_consultas set status = 'erro', erro = 'Tempo esgotado', respondido_em = now()
   where status in ('pendente','processando') and pedido_em < now() - interval '30 seconds';
  with p as (
    update public.estoque_consultas set status = 'processando'
     where id in (select id from public.estoque_consultas where status = 'pendente' order by pedido_em limit 10 for update skip locked)
    returning id, produto_id, tipo
  ) select coalesce(jsonb_agg(jsonb_build_object('id', id, 'p', produto_id, 't', tipo)), '[]'::jsonb) into v from p;
  return v;
end $$;

drop function if exists public.estoque_responder(text, uuid, numeric, numeric, text);
create or replace function public.estoque_responder(p_key text, p_id uuid, p_fisico numeric, p_reservado numeric, p_erro text, p_dados jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.check_sync_key(p_key);
  update public.estoque_consultas
     set status = case when p_erro is null then 'ok' else 'erro' end,
         fisico = p_fisico, reservado = p_reservado, erro = left(p_erro, 300), dados = p_dados, respondido_em = now()
   where id = p_id and status in ('pendente','processando');
  delete from public.estoque_consultas where pedido_em < now() - interval '7 days';
end $$;

revoke all on function public.estoque_solicitar(text, text) from public, anon;
grant execute on function public.estoque_solicitar(text, text) to authenticated;
revoke all on function public.estoque_pendentes(text, boolean) from public;
grant execute on function public.estoque_pendentes(text, boolean) to anon, authenticated;
revoke all on function public.estoque_responder(text, uuid, numeric, numeric, text, jsonb) from public;
grant execute on function public.estoque_responder(text, uuid, numeric, numeric, text, jsonb) to anon, authenticated;
