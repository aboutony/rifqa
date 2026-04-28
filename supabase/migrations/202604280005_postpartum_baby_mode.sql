alter table public.postpartum_logs
  add column if not exists recovery_day integer,
  add column if not exists c_section boolean not null default false,
  add column if not exists sleep_hours numeric(4,2),
  add column if not exists feeding_method text;

alter table public.postpartum_logs
  drop constraint if exists postpartum_logs_recovery_day_check,
  add constraint postpartum_logs_recovery_day_check check (recovery_day is null or recovery_day between 1 and 40);

alter table public.postpartum_logs
  drop constraint if exists postpartum_logs_sleep_hours_check,
  add constraint postpartum_logs_sleep_hours_check check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24));

alter table public.postpartum_logs
  drop constraint if exists postpartum_logs_feeding_method_check,
  add constraint postpartum_logs_feeding_method_check check (feeding_method is null or feeding_method in ('breastfeeding', 'formula', 'mixed', 'pumping'));

alter table public.profiles
  add column if not exists journey_stage text not null default 'pregnancy',
  add column if not exists birth_date date;

alter table public.profiles
  drop constraint if exists profiles_journey_stage_check,
  add constraint profiles_journey_stage_check check (journey_stage in ('pregnancy', 'postpartum', 'child_0_3'));

create index if not exists postpartum_logs_user_recovery_idx on public.postpartum_logs (user_id, recovery_day desc, created_at desc);
create index if not exists profiles_journey_stage_idx on public.profiles (journey_stage);
