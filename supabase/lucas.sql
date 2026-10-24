-- Assistente Lucas: base de conhecimento (manual) e registro de uso. Só o servidor (edge function) acessa.
create table if not exists public.assistant_kb (id text primary key, content text not null, updated_at timestamptz not null default now());
alter table public.assistant_kb enable row level security;
create table if not exists public.assistant_log (id bigserial primary key, user_id uuid not null, at timestamptz not null default now(),
  question text, answer text, screen text, images int not null default 0, input_tokens int, output_tokens int);
alter table public.assistant_log enable row level security;
create index if not exists assistant_log_user_at on public.assistant_log (user_id, at desc);
