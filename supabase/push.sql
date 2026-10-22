-- =====================================================================
-- Picking Serena · notificações push de novo pedido
-- Celulares inscritos + gatilho que chama a função "push" quando entra
-- um pedido para separar.
-- =====================================================================
create extension if not exists pg_net with schema extensions;

-- Celulares/navegadores inscritos para receber notificações
create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  ua          text,
  created_at  timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Segredos internos (chaves do push). Sem políticas: só o servidor lê.
create table if not exists public.app_secrets (name text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
insert into public.app_secrets (name, value)
  values ('push_webhook', encode(extensions.gen_random_bytes(24), 'hex'))
  on conflict (name) do nothing;

-- Quando entra um pedido para separar, chama a função de envio
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.data->>'status' = 'aguardando'
     and (tg_op = 'INSERT' or (old.data->>'createdAt') is distinct from (new.data->>'createdAt')) then
    begin
      perform net.http_post(
        url     := 'https://dtrfujxhfcyefbipkcwz.supabase.co/functions/v1/push',
        headers := jsonb_build_object('Content-Type','application/json',
                     'x-push-secret', (select value from public.app_secrets where name = 'push_webhook')),
        body    := jsonb_build_object('order', jsonb_build_object(
                     'id', new.id, 'num', new.data->>'num', 'client', new.data->>'client',
                     'mode', new.data->>'mode', 'createdBy', new.data->>'createdBy',
                     'refs', jsonb_array_length(coalesce(new.data->'items','[]'::jsonb))))
      );
    exception when others then
      raise warning 'push não enviado: %', sqlerrm; -- nunca impede o pedido de ser gravado
    end;
  end if;
  return new;
end $$;
revoke execute on function public.notify_new_order() from public, anon, authenticated;

drop trigger if exists on_new_order_push on public.orders;
create trigger on_new_order_push after insert or update on public.orders
  for each row execute function public.notify_new_order();

-- ---------- Mesas (locais para itens grandes) ----------
-- Estoque e gestão cadastram as mesas no documento config/mesas
create policy config_mesas_write on public.config for all
  using (id = 'mesas' and public.app_role() in ('admin','supervisor','estoque'))
  with check (id = 'mesas' and public.app_role() in ('admin','supervisor','estoque'));
insert into public.config (id, data) values ('mesas', '{"list":[{"code":"MESA-001","desc":"Itens grandes / sem bandeja"}]}'::jsonb)
  on conflict (id) do nothing;

-- ---------- E-commerce (Magazord) ----------
alter table public.profiles add column if not exists ecommerce boolean not null default false; -- quem separa e-commerce
insert into public.config (id, data) values ('magazord_sync', '{}'::jsonb) on conflict (id) do nothing;
create extension if not exists pg_cron;
-- importação automática a cada 2 minutos (função supabase/functions/magazord)
select cron.schedule('magazord-sync', '*/2 * * * *', $$
  select net.http_post(
    url := 'https://dtrfujxhfcyefbipkcwz.supabase.co/functions/v1/magazord',
    headers := jsonb_build_object('Content-Type','application/json',
                 'x-push-secret', (select value from public.app_secrets where name = 'push_webhook')),
    body := '{"action":"sync"}'::jsonb,
    timeout_milliseconds := 120000);
$$);
