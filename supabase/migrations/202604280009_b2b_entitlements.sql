create table if not exists public.b2b_sponsors (
  id uuid primary key default gen_random_uuid(),
  sponsor_code text not null unique,
  sponsor_name text not null,
  sponsor_type text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint b2b_sponsors_type_check check (sponsor_type in ('employer', 'insurer', 'clinic', 'corporate'))
);

alter table public.entitlements
  add column if not exists sponsor_id uuid references public.b2b_sponsors(id) on delete set null,
  add column if not exists sponsor_code text,
  add column if not exists policy_group text,
  add column if not exists firewall_acknowledged boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.b2b_admin_reports (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references public.b2b_sponsors(id) on delete set null,
  report_period date not null,
  metric text not null,
  stage text not null default 'mixed',
  locale text not null default 'SA',
  user_count integer not null,
  value numeric(12,2) not null,
  dimensions jsonb not null default '{}'::jsonb,
  generated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint b2b_admin_reports_min_threshold_check check (user_count >= 10),
  constraint b2b_admin_reports_stage_check check (stage in ('pregnancy', 'postpartum', 'child_0_3', 'mixed')),
  constraint b2b_admin_reports_no_individual_data_check check (
    not dimensions ? 'user_id'
    and not dimensions ? 'email'
    and not dimensions ? 'phone'
    and not dimensions ? 'name'
    and not dimensions ? 'chat_text'
    and not dimensions ? 'note'
    and not dimensions ? 'symptom'
    and not dimensions ? 'journal'
  )
);

comment on table public.b2b_sponsors is
  'Sponsors fund access only. Sponsor records must not be joined into individual health, mood, journal, symptom, pregnancy, or chat exports for B2B reporting.';

comment on table public.b2b_admin_reports is
  'Aggregate-only B2B reporting. Rows under 10 users are rejected and dimensions cannot contain individual identifiers or raw sensitive fields.';

alter table public.b2b_sponsors enable row level security;
alter table public.b2b_admin_reports enable row level security;

drop policy if exists "reviewers read b2b sponsors" on public.b2b_sponsors;
create policy "reviewers read b2b sponsors" on public.b2b_sponsors
  for select using (public.is_content_reviewer());

drop policy if exists "admins manage b2b sponsors" on public.b2b_sponsors;
create policy "admins manage b2b sponsors" on public.b2b_sponsors
  for all using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "reviewers read aggregate b2b reports" on public.b2b_admin_reports;
create policy "reviewers read aggregate b2b reports" on public.b2b_admin_reports
  for select using (public.is_content_reviewer());

drop policy if exists "admins manage aggregate b2b reports" on public.b2b_admin_reports;
create policy "admins manage aggregate b2b reports" on public.b2b_admin_reports
  for all using (public.is_content_admin()) with check (public.is_content_admin());

insert into public.b2b_sponsors (sponsor_code, sponsor_name, sponsor_type)
values
  ('RIFQA-INSURER-DEMO', 'RIFQA Insurer Demo', 'insurer'),
  ('RIFQA-CORP-DEMO', 'RIFQA Corporate Demo', 'corporate'),
  ('RIFQA-CLINIC-DEMO', 'RIFQA Clinic Demo', 'clinic')
on conflict (sponsor_code) do nothing;

drop trigger if exists b2b_sponsors_set_updated_at on public.b2b_sponsors;
create trigger b2b_sponsors_set_updated_at
before update on public.b2b_sponsors
for each row execute function public.set_updated_at();

create index if not exists entitlements_sponsor_idx on public.entitlements (sponsor_id, source, created_at desc);
create index if not exists b2b_admin_reports_period_idx on public.b2b_admin_reports (report_period desc, locale, stage, metric);

