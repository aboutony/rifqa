create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  message text not null,
  prompt_version text,
  safety_level text,
  crisis_safe_mode boolean not null default false,
  context_sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint chat_messages_role_check check (role in ('user', 'assistant')),
  constraint chat_messages_safety_check check (safety_level is null or safety_level in ('normal', 'watch', 'urgent'))
);

create table if not exists public.ai_prompt_configs (
  id uuid primary key default gen_random_uuid(),
  prompt_version text not null unique,
  label text not null,
  active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
alter table public.ai_prompt_configs enable row level security;

drop policy if exists "users manage own chat messages" on public.chat_messages;
create policy "users manage own chat messages" on public.chat_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "public can read active prompt configs" on public.ai_prompt_configs;
create policy "public can read active prompt configs" on public.ai_prompt_configs
for select using (active = true);

create index if not exists chat_messages_user_created_idx on public.chat_messages (user_id, created_at desc);
create index if not exists ai_prompt_configs_active_idx on public.ai_prompt_configs (active, created_at desc);
