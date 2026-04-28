alter table public.referrals
  add column if not exists campaign text,
  add column if not exists medium text,
  add column if not exists landing_path text,
  add column if not exists due_date_cohort text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.milestone_share_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_key text not null,
  title text not null,
  body text not null,
  share_url text not null,
  whatsapp_url text not null,
  referral_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_qr_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  clinic_code text not null,
  campaign text,
  source text not null default 'clinic_qr',
  landing_path text,
  referral_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.due_date_cohorts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cohort_key text not null,
  due_month date not null,
  stage text not null default 'pregnancy',
  created_at timestamptz not null default now(),
  constraint due_date_cohorts_user_unique unique (user_id),
  constraint due_date_cohorts_stage_check check (stage in ('pregnancy', 'postpartum', 'child_0_3'))
);

create table if not exists public.community_readiness (
  id uuid primary key default gen_random_uuid(),
  gate_key text not null unique,
  enabled boolean not null default false,
  moderation_required boolean not null default true,
  status text not null default 'delayed',
  reason text not null default 'Community is delayed until moderation tooling, reviewer workflows, and safety escalation are ready.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_readiness_status_check check (status in ('delayed', 'pilot', 'enabled'))
);

insert into public.community_readiness (gate_key, enabled, moderation_required, status, reason)
values ('in_app_community', false, true, 'delayed', 'Community is delayed until moderation tooling, reviewer workflows, and safety escalation are ready.')
on conflict (gate_key) do nothing;

alter table public.milestone_share_cards enable row level security;
alter table public.clinic_qr_attributions enable row level security;
alter table public.due_date_cohorts enable row level security;
alter table public.community_readiness enable row level security;

drop policy if exists "users manage own milestone share cards" on public.milestone_share_cards;
create policy "users manage own milestone share cards" on public.milestone_share_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users read own clinic qr attribution" on public.clinic_qr_attributions;
create policy "users read own clinic qr attribution" on public.clinic_qr_attributions
  for select using (auth.uid() = user_id);

drop policy if exists "users insert own clinic qr attribution" on public.clinic_qr_attributions;
create policy "users insert own clinic qr attribution" on public.clinic_qr_attributions
  for insert with check (auth.uid() = user_id);

drop policy if exists "users manage own due date cohort" on public.due_date_cohorts;
create policy "users manage own due date cohort" on public.due_date_cohorts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "everyone reads community readiness gate" on public.community_readiness;
create policy "everyone reads community readiness gate" on public.community_readiness
  for select using (true);

drop trigger if exists community_readiness_set_updated_at on public.community_readiness;
create trigger community_readiness_set_updated_at
before update on public.community_readiness
for each row execute function public.set_updated_at();

create index if not exists referrals_campaign_idx on public.referrals (source, campaign, created_at desc);
create index if not exists milestone_share_cards_user_idx on public.milestone_share_cards (user_id, created_at desc);
create index if not exists clinic_qr_attributions_clinic_idx on public.clinic_qr_attributions (clinic_code, created_at desc);
create index if not exists due_date_cohorts_key_idx on public.due_date_cohorts (cohort_key);

