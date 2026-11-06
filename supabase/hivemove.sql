-- Permissão por usuário para mudar pedidos de colmeia
alter table public.profiles add column if not exists hivemove boolean not null default false;
