-- Soft deletes for groups, memberships, matches, and match roster rows
alter table groups
  add column if not exists deleted_at timestamptz;

alter table group_members
  add column if not exists deleted_at timestamptz;

alter table matches
  add column if not exists deleted_at timestamptz;

alter table match_players
  add column if not exists deleted_at timestamptz;

create index if not exists idx_groups_not_deleted
  on groups (id) where deleted_at is null;

create index if not exists idx_group_members_active
  on group_members (group_id) where deleted_at is null;

create index if not exists idx_matches_group_active
  on matches (group_id, played_on desc) where deleted_at is null;
