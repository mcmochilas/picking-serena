-- Nível Financeiro: cadastra pedidos na colmeia (insere/atualiza pedidos)
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert with check (app_roles() && array['admin','supervisor','comercial','separador','conferente','compras','financeiro']);
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update using (app_roles() && array['admin','supervisor','comercial','separador','conferente','compras','estoque','financeiro']) with check (app_roles() && array['admin','supervisor','comercial','separador','conferente','compras','estoque','financeiro']);
