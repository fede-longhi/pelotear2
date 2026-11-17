-- Custom team names + delayed MOTM reveal
alter table matches
  add column if not exists team_a_name text not null default 'Equipo A';

alter table matches
  add column if not exists team_b_name text not null default 'Equipo B';

alter table matches
  add column if not exists motm_revealed_at timestamptz;
