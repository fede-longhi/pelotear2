alter table users add column if not exists email_verified_at timestamptz;

-- Existing accounts stay usable; new signups verify via token.
update users
set email_verified_at = coalesce(email_verified_at, now())
where password_hash is not null
  and email_verified_at is null;

create table if not exists email_verification_tokens (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verify_user
  on email_verification_tokens(user_id);
