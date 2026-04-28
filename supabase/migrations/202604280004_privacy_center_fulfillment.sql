create table if not exists public.user_privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_context_enabled boolean not null default true,
  low_pii_mode boolean not null default true,
  raw_chat_analytics boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.privacy_requests
  add column if not exists fulfillment_metadata jsonb not null default '{}'::jsonb;

drop trigger if exists user_privacy_settings_set_updated_at on public.user_privacy_settings;
create trigger user_privacy_settings_set_updated_at
before update on public.user_privacy_settings
for each row execute function public.set_updated_at();

alter table public.user_privacy_settings enable row level security;

drop policy if exists "users manage own privacy settings" on public.user_privacy_settings;
create policy "users manage own privacy settings" on public.user_privacy_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.privacy_safe_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  cohort_date date not null,
  locale text not null default 'SA',
  stage text not null,
  metric text not null,
  user_count integer not null,
  value numeric(12,2) not null,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint privacy_safe_analytics_min_cohort_check check (user_count >= 10),
  constraint privacy_safe_analytics_stage_check check (stage in ('pregnancy', 'postpartum', 'child_0_3', 'mixed')),
  constraint privacy_safe_analytics_no_user_dimension_check check (
    not dimensions ? 'user_id'
    and not dimensions ? 'email'
    and not dimensions ? 'phone'
    and not dimensions ? 'name'
    and not dimensions ? 'chat_text'
    and not dimensions ? 'note'
  )
);

comment on table public.privacy_safe_analytics_daily is
  'Aggregate-only analytics. No user_id, raw chat text, notes, symptoms, or individual B2B sponsor visibility. Cohorts under 10 users are rejected.';

alter table public.privacy_safe_analytics_daily enable row level security;

drop policy if exists "reviewers read privacy safe analytics" on public.privacy_safe_analytics_daily;
create policy "reviewers read privacy safe analytics" on public.privacy_safe_analytics_daily
  for select using (public.is_content_reviewer());

drop policy if exists "admins manage privacy safe analytics" on public.privacy_safe_analytics_daily;
create policy "admins manage privacy safe analytics" on public.privacy_safe_analytics_daily
  for all using (public.is_content_admin()) with check (public.is_content_admin());

create index if not exists user_privacy_settings_updated_idx on public.user_privacy_settings (updated_at desc);
create index if not exists privacy_requests_user_requested_idx on public.privacy_requests (user_id, requested_at desc);
create index if not exists privacy_safe_analytics_daily_idx on public.privacy_safe_analytics_daily (cohort_date desc, locale, stage, metric);
