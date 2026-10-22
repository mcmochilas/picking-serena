-- =====================================================================
-- Picking Serena · estrutura do banco no Supabase
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).
-- =====================================================================

-- ---------- Perfis (usuários do sistema e nível de acesso) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  role        text check (role in ('admin','supervisor','comercial','estoque','separador','conferente','painel')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Nível de acesso de quem está logado (null = sem acesso liberado)
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

-- Ao criar uma conta: cria o perfil. A primeira conta do sistema vira Administrador.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when not exists (select 1 from public.profiles where role = 'admin') then 'admin' else null end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Tabelas de documentos (cada linha guarda um JSON) ----------
create table if not exists public.orders   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.products (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.blocks   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.config   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());

-- Atualização parcial (mescla campos no JSON), respeitando as regras de acesso
create or replace function public.merge_doc(t text, doc_id text, patch jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if t not in ('orders','products','blocks','config') then
    raise exception 'tabela inválida: %', t;
  end if;
  execute format('update public.%I set data = data || $1, updated_at = now() where id = $2', t)
    using patch, doc_id;
end $$;
grant execute on function public.merge_doc(text, text, jsonb) to authenticated;

-- ---------- Segurança por nível de acesso (RLS) ----------
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;
alter table public.products enable row level security;
alter table public.blocks   enable row level security;
alter table public.config   enable row level security;

-- Perfis: cada um vê o próprio; quem tem acesso vê os demais (para mostrar nomes);
-- só o Administrador altera nível e ativo.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.app_role() is not null);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- Pedidos: todos com acesso leem; os setores operacionais gravam.
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select using (public.app_role() is not null);
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert
  with check (public.app_role() in ('admin','supervisor','comercial','separador','conferente'));
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update
  using (public.app_role() in ('admin','supervisor','comercial','separador','conferente'))
  with check (public.app_role() in ('admin','supervisor','comercial','separador','conferente'));
drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders for delete using (public.app_role() in ('admin','supervisor'));

-- Produtos: Estoque cadastra; o Comercial também grava (produtos novos que chegam pela pré-venda).
drop policy if exists products_select on public.products;
create policy products_select on public.products for select using (public.app_role() is not null);
drop policy if exists products_write on public.products;
create policy products_write on public.products for all
  using (public.app_role() in ('admin','supervisor','estoque','comercial'))
  with check (public.app_role() in ('admin','supervisor','estoque','comercial'));

-- Estruturas de locais: Estoque e gestão.
drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks for select using (public.app_role() is not null);
drop policy if exists blocks_write on public.blocks;
create policy blocks_write on public.blocks for all
  using (public.app_role() in ('admin','supervisor','estoque'))
  with check (public.app_role() in ('admin','supervisor','estoque'));

-- Configurações: só Administrador altera.
drop policy if exists config_select on public.config;
create policy config_select on public.config for select using (public.app_role() is not null);
drop policy if exists config_write on public.config;
create policy config_write on public.config for all
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- Funções internas não ficam expostas pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.app_role() from public, anon;
grant execute on function public.app_role() to authenticated;
revoke execute on function public.merge_doc(text, text, jsonb) from public, anon;

-- ---------- Tempo real (celulares e computadores atualizam sozinhos) ----------
do $$
declare t text;
begin
  foreach t in array array['orders','products','blocks','config','profiles'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
