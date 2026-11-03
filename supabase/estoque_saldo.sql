-- Consulta de estoque sob demanda (Picking Serena ↔ extensão do Chrome ↔ AdSomos)
-- Fluxo: o separador toca no (i) → o app cria um pedido de consulta → a extensão, no computador
-- com o AdSomos aberto, vê o pedido, consulta só aquele produto e devolve físico e reservado.
-- Cria 2 tabelas novas e 5 funções. Não altera nenhuma tabela existente.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.estoque_consultas (
  id uuid primary key default gen_random_uuid(),
  produto_id text not null,
  status text not null default 'pendente' check (status in ('pendente','processando','ok','erro')),
  fisico numeric,
  reservado numeric,
  erro text,
  pedido_por uuid default auth.uid(),
  pedido_em timestamptz not null default now(),
  respondido_em timestamptz
);
create index if not exists estoque_consultas_pend on public.estoque_consultas (pedido_em) where status = 'pendente';
alter table public.estoque_consultas enable row level security;
drop policy if exists estoque_consultas_select on public.estoque_consultas;
create policy estoque_consultas_select on public.estoque_consultas for select using (public.app_role() is not null);
-- sem insert/update direto: tudo passa pelas funções abaixo

create schema if not exists private;
create table if not exists private.sync_keys (nome text primary key, hash text not null);
insert into private.sync_keys(nome, hash)
values ('saldo_adsomos', 'f7ceb3ed10ebb2e63ae38feaf873404b58f7c036e5517d2acb255fbb6bb9dd16')
on conflict (nome) do update set hash = excluded.hash;

-- Sinal de vida da extensão (atualizado a cada busca de pedidos)
create table if not exists private.extensao_status (
  id int primary key default 1 check (id = 1),
  visto_em timestamptz,
  adsomos_aberto boolean default false
);
insert into private.extensao_status(id) values (1) on conflict do nothing;

create or replace function private.check_sync_key(p_key text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  select hash into v_hash from private.sync_keys where nome = 'saldo_adsomos';
  if v_hash is null or encode(extensions.digest(coalesce(p_key,''), 'sha256'), 'hex') <> v_hash then
    raise exception 'chave invalida' using errcode = '28000';
  end if;
end $$;

-- APP: pede a consulta de um produto. Falha na hora se a extensão ou o AdSomos não estiverem disponíveis.
create or replace function public.estoque_solicitar(p_produto text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_st record;
begin
  if public.app_role() is null then raise exception 'sem acesso' using errcode = '42501'; end if;
  if coalesce(trim(p_produto),'') = '' then raise exception 'produto vazio'; end if;
  select visto_em, adsomos_aberto into v_st from private.extensao_status where id = 1;
  if v_st.visto_em is null or v_st.visto_em < now() - interval '20 seconds' then
    raise exception 'EXTENSAO_OFFLINE';
  end if;
  if not v_st.adsomos_aberto then raise exception 'ADSOMOS_FECHADO'; end if;
  insert into public.estoque_consultas(produto_id) values (trim(p_produto)) returning id into v_id;
  return v_id;
end $$;

-- EXTENSÃO: registra sinal de vida e pega os pedidos pendentes (marca como processando)
create or replace function public.estoque_pendentes(p_key text, p_adsomos_aberto boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  perform private.check_sync_key(p_key);
  update private.extensao_status set visto_em = now(), adsomos_aberto = coalesce(p_adsomos_aberto,false) where id = 1;
  -- pedidos velhos que ninguém atendeu viram erro
  update public.estoque_consultas set status = 'erro', erro = 'Tempo esgotado', respondido_em = now()
   where status in ('pendente','processando') and pedido_em < now() - interval '30 seconds';
  with p as (
    update public.estoque_consultas set status = 'processando'
     where id in (select id from public.estoque_consultas where status = 'pendente' order by pedido_em limit 10 for update skip locked)
    returning id, produto_id
  ) select coalesce(jsonb_agg(jsonb_build_object('id', id, 'p', produto_id)), '[]'::jsonb) into v from p;
  return v;
end $$;

-- EXTENSÃO: devolve o resultado de um pedido
create or replace function public.estoque_responder(p_key text, p_id uuid, p_fisico numeric, p_reservado numeric, p_erro text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.check_sync_key(p_key);
  update public.estoque_consultas
     set status = case when p_erro is null then 'ok' else 'erro' end,
         fisico = p_fisico, reservado = p_reservado, erro = left(p_erro, 300), respondido_em = now()
   where id = p_id and status in ('pendente','processando');
  delete from public.estoque_consultas where pedido_em < now() - interval '7 days';
end $$;

revoke all on function private.check_sync_key(text) from public;
revoke all on function public.estoque_solicitar(text) from public;
grant execute on function public.estoque_solicitar(text) to authenticated;
revoke all on function public.estoque_pendentes(text, boolean) from public;
grant execute on function public.estoque_pendentes(text, boolean) to anon, authenticated;
revoke all on function public.estoque_responder(text, uuid, numeric, numeric, text) from public;
grant execute on function public.estoque_responder(text, uuid, numeric, numeric, text) to anon, authenticated;
