create table if not exists users (
  id text primary key,
  email text not null default '',
  name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  created_by text not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id text not null references groups(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists matches (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  played_on date not null,
  kickoff_time text not null,
  location text not null,
  status text not null default 'programado' check (status in ('programado', 'jugado', 'cancelado')),
  goals_a integer,
  goals_b integer,
  created_by text not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists match_players (
  match_id text not null references matches(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  team text check (team is null or team in ('A', 'B')),
  attendance text not null default 'pending' check (attendance in ('pending', 'confirmed', 'declined')),
  primary key (match_id, user_id)
);

create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_matches_group on matches(group_id, played_on desc);
create index if not exists idx_match_players_user on match_players(user_id);
create index if not exists idx_groups_invite on groups(invite_code);
