alter table public.notification_preferences
  add column if not exists pregnancy_week_notifications boolean not null default true,
  add column if not exists appointment_reminders boolean not null default true,
  add column if not exists vaccination_reminders boolean not null default true,
  add column if not exists content_review_expiry_reminders boolean not null default true,
  add column if not exists notification_language text not null default 'ar',
  add column if not exists appointment_reminder_time text not null default '09:00',
  add column if not exists vaccination_reminder_time text not null default '09:00';

alter table public.notification_preferences
  drop constraint if exists notification_preferences_language_check;

alter table public.notification_preferences
  add constraint notification_preferences_language_check
  check (notification_language in ('ar', 'en'));

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  channel text not null default 'push',
  title text not null,
  body text not null,
  scheduled_for timestamptz,
  status text not null default 'scheduled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_events_type_check check (event_type in (
    'pregnancy_week',
    'daily_checkin',
    'content_review_expiry',
    'appointment',
    'vaccination',
    'quiet_hours'
  )),
  constraint notification_events_channel_check check (channel in ('push', 'whatsapp', 'email')),
  constraint notification_events_status_check check (status in ('scheduled', 'sent', 'cancelled', 'suppressed'))
);

alter table public.notification_events enable row level security;

drop policy if exists "users manage own notification events" on public.notification_events;
create policy "users manage own notification events" on public.notification_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists notification_events_set_updated_at on public.notification_events;
create trigger notification_events_set_updated_at
before update on public.notification_events
for each row execute function public.set_updated_at();

create index if not exists notification_events_user_schedule_idx
  on public.notification_events (user_id, scheduled_for, status);

