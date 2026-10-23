-- Mais de um nível de acesso por usuário: profiles.roles guarda todos; profiles.role continua sendo o principal
alter table public.profiles add column if not exists roles text[] not null default '{}';
update public.profiles set roles = array[role] where role is not null and (roles is null or roles = '{}');

create or replace function public.app_roles()
returns text[] language sql stable security definer set search_path to 'public' as $$
  select coalesce((select array_remove(array[role], null) || coalesce(roles, '{}') from public.profiles where id = auth.uid() and active), '{}')
$$;
grant execute on function public.app_roles() to authenticated;

drop policy if exists blocks_write on public.blocks;
create policy blocks_write on public.blocks for all using (app_roles() && array['admin','supervisor','estoque']) with check (app_roles() && array['admin','supervisor','estoque']);
drop policy if exists config_transportadoras_write on public.config;
create policy config_transportadoras_write on public.config for all using (id = 'transportadoras' and app_roles() && array['admin','supervisor','estoque']) with check (id = 'transportadoras' and app_roles() && array['admin','supervisor','estoque']);
drop policy if exists config_mesas_write on public.config;
create policy config_mesas_write on public.config for all using (id = 'mesas' and app_roles() && array['admin','supervisor','estoque']) with check (id = 'mesas' and app_roles() && array['admin','supervisor','estoque']);
drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices for all using (app_roles() && array['admin','supervisor','compras','estoque']) with check (app_roles() && array['admin','supervisor','compras','estoque']);
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert with check (app_roles() && array['admin','supervisor','comercial','separador','conferente','compras']);
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update using (app_roles() && array['admin','supervisor','comercial','separador','conferente','compras','estoque']) with check (app_roles() && array['admin','supervisor','comercial','separador','conferente','compras','estoque']);
drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders for delete using (app_roles() && array['admin','supervisor']);
drop policy if exists products_write on public.products;
create policy products_write on public.products for all using (app_roles() && array['admin','supervisor','estoque','comercial','compras']) with check (app_roles() && array['admin','supervisor','estoque','comercial','compras']);
drop policy if exists purchases_write on public.purchases;
create policy purchases_write on public.purchases for all using (app_roles() && array['admin','supervisor','compras']) with check (app_roles() && array['admin','supervisor','compras']);

create or replace function public.create_hive_token(p_oid text, p_how text)
returns text language plpgsql security definer set search_path = public as $$
declare r text; cm text;
begin
  if not (app_roles() && array['admin','supervisor','comercial','compras','estoque','separador','conferente']) then
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
