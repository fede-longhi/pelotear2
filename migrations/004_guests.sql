-- Guest / proxy players: real group members act on their behalf.
-- Stored as users with is_guest=true so match_players + W/L/D stay unchanged.
alter table users add column if not exists is_guest boolean not null default false;

create index if not exists idx_users_guests on users(is_guest) where is_guest;
