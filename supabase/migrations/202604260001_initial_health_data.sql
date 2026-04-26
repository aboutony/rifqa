create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'SA',
  privacy_mode text not null default 'low_pii',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_unique unique (user_id),
  constraint profiles_privacy_mode_check check (privacy_mode in ('low_pii', 'standard'))
);

create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  due_date date,
  current_week integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pregnancies_week_check check (current_week is null or current_week between 1 and 42),
  constraint pregnancies_status_check check (status in ('active', 'completed', 'archived')),
  constraint pregnancies_single_status unique (user_id, status)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  granted boolean not null,
  version text not null,
  created_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null,
  sleep_quality integer not null,
  symptoms text[] not null default '{}',
  note text,
  safety_level text not null default 'normal',
  safety_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint checkins_sleep_quality_check check (sleep_quality between 1 and 5),
  constraint checkins_safety_level_check check (safety_level in ('normal', 'watch', 'urgent'))
);

create table public.kick_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kick_count integer not null default 0,
  duration_minutes integer not null default 0,
  safety_level text not null default 'normal',
  guidance text,
  created_at timestamptz not null default now(),
  constraint kick_sessions_count_check check (kick_count >= 0),
  constraint kick_sessions_duration_check check (duration_minutes >= 0),
  constraint kick_sessions_safety_level_check check (safety_level in ('normal', 'watch', 'urgent'))
);

create table public.kick_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.kick_sessions(id) on delete cascade,
  occurred_at timestamptz not null default now()
);

create table public.contraction_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contraction_count integer not null default 0,
  average_frequency_minutes numeric(5,2),
  average_duration_seconds integer,
  safety_level text not null default 'watch',
  guidance text,
  created_at timestamptz not null default now(),
  constraint contraction_sessions_count_check check (contraction_count >= 0),
  constraint contraction_sessions_frequency_check check (average_frequency_minutes is null or average_frequency_minutes >= 0),
  constraint contraction_sessions_duration_check check (average_duration_seconds is null or average_duration_seconds >= 0),
  constraint contraction_sessions_safety_level_check check (safety_level in ('normal', 'watch', 'urgent'))
);

create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptom text not null,
  severity integer not null,
  note text,
  created_at timestamptz not null default now(),
  constraint symptom_logs_severity_check check (severity between 1 and 5)
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null,
  note text,
  created_at timestamptz not null default now(),
  constraint weight_logs_weight_check check (weight_kg > 0 and weight_kg < 300)
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint privacy_requests_type_check check (request_type in ('export', 'delete')),
  constraint privacy_requests_status_check check (status in ('requested', 'processing', 'completed', 'rejected'))
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger pregnancies_set_updated_at
before update on public.pregnancies
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.pregnancies enable row level security;
alter table public.consents enable row level security;
alter table public.checkins enable row level security;
alter table public.kick_sessions enable row level security;
alter table public.kick_events enable row level security;
alter table public.contraction_sessions enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.privacy_requests enable row level security;

create policy "users manage own profiles" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own pregnancies" on public.pregnancies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own consents" on public.consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own checkins" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own kick sessions" on public.kick_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own kick events" on public.kick_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own contraction sessions" on public.contraction_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own symptom logs" on public.symptom_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own weight logs" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own privacy requests" on public.privacy_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index checkins_user_created_idx on public.checkins (user_id, created_at desc);
create index kick_sessions_user_created_idx on public.kick_sessions (user_id, created_at desc);
create index contraction_sessions_user_created_idx on public.contraction_sessions (user_id, created_at desc);
create index symptom_logs_user_created_idx on public.symptom_logs (user_id, created_at desc);
create index weight_logs_user_created_idx on public.weight_logs (user_id, created_at desc);

