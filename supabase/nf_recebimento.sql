-- Notas fiscais (Compras importa, Recebimento confere) + Estoque pode atualizar pedidos (recebimento / colmeias)
create table if not exists public.invoices (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
alter table public.invoices enable row level security;
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select using (app_role() is not null);
drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices for all using (app_role() = any (array['admin','supervisor','compras','estoque'])) with check (app_role() = any (array['admin','supervisor','compras','estoque']));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='invoices') then
    alter publication supabase_realtime add table public.invoices; end if; end $$;

create or replace function public.merge_doc(t text, doc_id text, patch jsonb)
returns void language plpgsql set search_path to 'public' as $function$
begin
  if t not in ('orders','products','blocks','config','purchases','invoices') then raise exception 'tabela inválida: %', t; end if;
  execute format('update public.%I set data = data || $1, updated_at = now() where id = $2', t) using patch, doc_id;
end $function$;

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update
  using (app_role() = any (array['admin','supervisor','comercial','separador','conferente','compras','estoque']))
  with check (app_role() = any (array['admin','supervisor','comercial','separador','conferente','compras','estoque']));

-- push: além da fila de separação, avisa Compras quando chega encomenda (para decidir ou envio parcial)
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path to 'public', 'extensions' as $function$
declare hdr jsonb; enc int;
begin
  hdr := jsonb_build_object('Content-Type','application/json', 'x-push-secret', (select value from public.app_secrets where name = 'push_webhook'));
  if new.data->>'status' = 'aguardando'
     and (tg_op = 'INSERT'
          or (old.data->>'createdAt') is distinct from (new.data->>'createdAt')
          or (old.data->>'queuedAt') is distinct from (new.data->>'queuedAt')) then
    begin
      perform net.http_post(
        url     := 'https://dtrfujxhfcyefbipkcwz.supabase.co/functions/v1/push',
        headers := hdr,
        body    := jsonb_build_object('order', jsonb_build_object(
                     'id', new.id, 'num', new.data->>'num', 'client', new.data->>'client',
                     'mode', new.data->>'mode', 'createdBy', coalesce(new.data->>'decidedBy', new.data->>'createdBy'),
                     'canal', coalesce(new.data->>'canal','consultiva'), 'origem', new.data->>'origem',
                     'transportadora', new.data->>'transportadora',
                     'refs', jsonb_array_length(coalesce(new.data->'items','[]'::jsonb))))
      );
    exception when others then raise warning 'push não enviado: %', sqlerrm; end;
  end if;
  -- Compras: pedido "Tem encomenda" para decidir, ou envio parcial com itens sob encomenda
  enc := (select count(*) from jsonb_array_elements(coalesce(new.data->'items','[]'::jsonb)) i where coalesce((i->>'qtyEnc')::numeric,0) > 0);
  if (new.data->>'status' = 'analise_compras' and (tg_op = 'INSERT' or (old.data->>'status') is distinct from 'analise_compras'))
     or (new.data->>'mode' = 'parcial' and enc > 0 and new.data->>'status' = 'aguardando' and coalesce(new.data->>'fase2','false') <> 'true'
         and (tg_op = 'INSERT' or (old.data->>'createdAt') is distinct from (new.data->>'createdAt'))) then
    begin
      perform net.http_post(
        url     := 'https://dtrfujxhfcyefbipkcwz.supabase.co/functions/v1/push',
        headers := hdr,
        body    := jsonb_build_object('compras', jsonb_build_object(
                     'id', new.id, 'num', new.data->>'num', 'client', new.data->>'client', 'createdBy', new.data->>'createdBy',
                     'kind', case when new.data->>'status' = 'analise_compras' then 'decidir' else 'parcial' end, 'refs', enc))
      );
    exception when others then raise warning 'push compras não enviado: %', sqlerrm; end;
  end if;
  return new;
end $function$;
