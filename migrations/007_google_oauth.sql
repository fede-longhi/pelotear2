-- Google OAuth subject for linked / Google-only accounts
alter table users
  add column if not exists google_sub text;

create unique index if not exists idx_users_google_sub_unique
  on users (google_sub)
  where google_sub is not null;
