-- Permissão por usuário para os botões de simulação de leitura (bip)
alter table public.profiles add column if not exists sim boolean not null default false;
