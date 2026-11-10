alter table users add column if not exists password_hash text;
alter table users add column if not exists first_name text not null default '';
alter table users add column if not exists last_name text not null default '';
alter table users add column if not exists nickname text not null default '';
alter table users add column if not exists phone text not null default '';
alter table users add column if not exists birth_date date;
alter table users add column if not exists photo_url text not null default '';

create unique index if not exists idx_users_email_unique
  on users (lower(email))
  where email <> '';

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_sessions_expires on sessions(expires_at);
