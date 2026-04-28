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

create table public.relaxation_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  playlist_url text,
  playlist_type text not null default 'personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relaxation_playlists_type_check check (playlist_type in ('personal', 'recitation', 'prayer', 'music', 'breathing'))
);

create table public.exercise_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  title text not null,
  instructions text not null,
  restrictions text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_plans_source_check check (source in ('doctor', 'ai_rules'))
);

create table public.wellness_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  priority text not null default 'low',
  source text not null,
  title text not null,
  body text not null,
  trigger text not null,
  delivered_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint wellness_recommendations_kind_check check (kind in ('relaxation_audio', 'exercise')),
  constraint wellness_recommendations_priority_check check (priority in ('low', 'medium', 'high')),
  constraint wellness_recommendations_source_check check (source in ('doctor', 'ai_rules'))
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

create table public.reviewer_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  constraint reviewer_roles_role_check check (role in ('clinical_reviewer', 'admin'))
);

create table public.review_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint review_audit_events_target_check check (target_type in ('reviewed_content', 'reviewer_role')),
  constraint review_audit_events_action_check check (action in ('approve', 'renew', 'expire', 'retire', 'assign', 'request_changes', 'grant_role', 'revoke_role', 'sync_seed'))
);

create table public.reviewed_content (
  id text primary key,
  stage text not null,
  locale text not null default 'SA',
  title text not null,
  summary text not null,
  reviewer_name text not null,
  reviewer_specialty text not null,
  citations text[] not null default '{}',
    approval_date date not null,
    expiry_date date not null,
    status text not null default 'approved',
    workflow_status text not null default 'approved',
    assigned_reviewer text,
    review_comments text,
    rejection_reason text,
    version_number integer not null default 1,
    reviewed_by uuid references auth.users(id),
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviewed_content_stage_check check (stage in ('pregnancy', 'postpartum', 'baby_0_3', 'ramadan', 'islamic')),
  constraint reviewed_content_status_check check (status in ('draft', 'pending_review', 'approved', 'expired', 'retired')),
  constraint reviewed_content_workflow_check check (workflow_status in ('unassigned', 'assigned', 'in_review', 'changes_requested', 'approved'))
);

create table public.reviewed_content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  version_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id),
  change_action text not null,
  created_at timestamptz not null default now()
);

create table public.care_resources (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'SA',
  resource_type text not null,
  label text not null,
  url text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_resources_type_check check (resource_type in ('moh', 'hospital', 'telehealth', 'mental_health', 'trusted_contact'))
);

create table public.postpartum_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bleeding text not null,
  pain_level integer not null,
  mood text not null,
  feeding_stress integer not null,
  note text,
  safety_level text not null default 'normal',
  created_at timestamptz not null default now(),
  constraint postpartum_logs_pain_check check (pain_level between 1 and 5),
  constraint postpartum_logs_feeding_check check (feeding_stress between 1 and 5),
  constraint postpartum_logs_safety_check check (safety_level in ('normal', 'watch', 'urgent'))
);

create table public.baby_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_type text not null,
  amount numeric(8,2),
  unit text,
  note text,
  created_at timestamptz not null default now(),
  constraint baby_logs_type_check check (log_type in ('feeding', 'pumping', 'sleep', 'diaper', 'medication', 'growth_note'))
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_month integer not null,
  title text not null,
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint milestones_month_check check (child_month between 0 and 36)
);

create table public.vaccine_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vaccine_name text not null,
  due_age_month integer not null,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  constraint vaccine_records_due_age_check check (due_age_month between 0 and 36)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  media_url text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_visibility_check check (visibility in ('private', 'partner_shared'))
);

create table public.partner_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_name text not null,
  permissions jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '08:00',
  stage_milestones boolean not null default true,
  safety_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_user_channel_unique unique (user_id, channel),
  constraint notification_preferences_channel_check check (channel in ('push', 'whatsapp', 'email'))
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null unique,
  source text not null,
  clinic_code text,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  source text not null default 'direct',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint entitlements_plan_check check (plan in ('free', 'premium', 'sponsored')),
  constraint entitlements_source_check check (source in ('direct', 'clinic', 'employer', 'insurer'))
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger pregnancies_set_updated_at
before update on public.pregnancies
for each row execute function public.set_updated_at();

create trigger relaxation_playlists_set_updated_at
before update on public.relaxation_playlists
for each row execute function public.set_updated_at();

create trigger exercise_plans_set_updated_at
before update on public.exercise_plans
for each row execute function public.set_updated_at();

create trigger reviewed_content_set_updated_at
before update on public.reviewed_content
for each row execute function public.set_updated_at();

create trigger care_resources_set_updated_at
before update on public.care_resources
for each row execute function public.set_updated_at();

create trigger journal_entries_set_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

create trigger partner_permissions_set_updated_at
before update on public.partner_permissions
for each row execute function public.set_updated_at();

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create or replace function public.is_content_reviewer()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviewer_roles rr
    where rr.user_id = auth.uid()
    and rr.role in ('clinical_reviewer', 'admin')
  );
$$;

create or replace function public.is_content_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviewer_roles rr
    where rr.user_id = auth.uid()
    and rr.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.pregnancies enable row level security;
alter table public.consents enable row level security;
alter table public.checkins enable row level security;
alter table public.kick_sessions enable row level security;
alter table public.kick_events enable row level security;
alter table public.contraction_sessions enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.relaxation_playlists enable row level security;
alter table public.exercise_plans enable row level security;
alter table public.wellness_recommendations enable row level security;
  alter table public.privacy_requests enable row level security;
  alter table public.reviewer_roles enable row level security;
  alter table public.review_audit_events enable row level security;
  alter table public.reviewed_content enable row level security;
  alter table public.reviewed_content_versions enable row level security;
alter table public.care_resources enable row level security;
alter table public.postpartum_logs enable row level security;
alter table public.baby_logs enable row level security;
alter table public.milestones enable row level security;
alter table public.vaccine_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.partner_permissions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.referrals enable row level security;
alter table public.entitlements enable row level security;

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

create policy "users manage own relaxation playlists" on public.relaxation_playlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own exercise plans" on public.exercise_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own wellness recommendations" on public.wellness_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  create policy "users manage own privacy requests" on public.privacy_requests
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  create policy "reviewers read reviewer roles" on public.reviewer_roles
    for select using (
      user_id = auth.uid()
      or public.is_content_reviewer()
    );

  create policy "admins manage reviewer roles" on public.reviewer_roles
    for all using (public.is_content_admin())
    with check (public.is_content_admin());

  create policy "reviewers read review audit events" on public.review_audit_events
    for select using (public.is_content_reviewer());

  create policy "reviewers insert review audit events" on public.review_audit_events
    for insert with check (public.is_content_reviewer());

  create policy "everyone reads approved content" on public.reviewed_content
    for select using (status in ('approved', 'expired'));

  create policy "reviewers read all reviewed content" on public.reviewed_content
    for select using (public.is_content_reviewer());

  create policy "reviewers manage reviewed content" on public.reviewed_content
    for all using (public.is_content_reviewer())
    with check (public.is_content_reviewer());

  create policy "reviewers read reviewed content versions" on public.reviewed_content_versions
    for select using (public.is_content_reviewer());

  create policy "reviewers insert reviewed content versions" on public.reviewed_content_versions
    for insert with check (public.is_content_reviewer());

create policy "everyone reads active care resources" on public.care_resources
  for select using (active = true);

create policy "users manage own postpartum logs" on public.postpartum_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own baby logs" on public.baby_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own milestones" on public.milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own vaccine records" on public.vaccine_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own journal entries" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own partner permissions" on public.partner_permissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own notification preferences" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own referrals" on public.referrals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own entitlements" on public.entitlements
  for select using (auth.uid() = user_id);

create index checkins_user_created_idx on public.checkins (user_id, created_at desc);
create index kick_sessions_user_created_idx on public.kick_sessions (user_id, created_at desc);
create index contraction_sessions_user_created_idx on public.contraction_sessions (user_id, created_at desc);
create index symptom_logs_user_created_idx on public.symptom_logs (user_id, created_at desc);
create index weight_logs_user_created_idx on public.weight_logs (user_id, created_at desc);
create index relaxation_playlists_user_created_idx on public.relaxation_playlists (user_id, created_at desc);
create index exercise_plans_user_active_idx on public.exercise_plans (user_id, active, created_at desc);
create index wellness_recommendations_user_created_idx on public.wellness_recommendations (user_id, created_at desc);
create index postpartum_logs_user_created_idx on public.postpartum_logs (user_id, created_at desc);
create index baby_logs_user_created_idx on public.baby_logs (user_id, created_at desc);
create index milestones_user_month_idx on public.milestones (user_id, child_month);
create index vaccine_records_user_due_idx on public.vaccine_records (user_id, due_age_month);
create index journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);
create index partner_permissions_user_active_idx on public.partner_permissions (user_id, active);
create index referrals_user_created_idx on public.referrals (user_id, created_at desc);
create index review_audit_events_created_idx on public.review_audit_events (created_at desc);
create index review_audit_events_actor_idx on public.review_audit_events (actor_user_id);
create index review_audit_events_target_idx on public.review_audit_events (target_id);
create index reviewed_content_expiry_idx on public.reviewed_content (expiry_date, status);
create index reviewed_content_versions_content_idx on public.reviewed_content_versions (content_id, version_number desc);
