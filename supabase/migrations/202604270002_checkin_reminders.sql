alter table public.notification_preferences
add column if not exists daily_checkin_time text not null default '20:00',
add column if not exists checkin_reminders boolean not null default true;
