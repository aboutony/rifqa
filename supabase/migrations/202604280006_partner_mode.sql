alter table public.partner_permissions
  add column if not exists partner_contact text,
  add column if not exists invite_code text,
  add column if not exists invited_at timestamptz not null default now(),
  add column if not exists revoked_at timestamptz;

create unique index if not exists partner_permissions_invite_code_idx
  on public.partner_permissions (invite_code)
  where invite_code is not null;

create index if not exists partner_permissions_user_invited_idx
  on public.partner_permissions (user_id, invited_at desc);
