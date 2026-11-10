-- Jugador del partido (MOTM): one vote per authenticated member per match.
create table if not exists match_motm_votes (
  match_id text not null references matches(id) on delete cascade,
  voter_id text not null references users(id) on delete cascade,
  nominee_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, voter_id)
);

create index if not exists idx_motm_match on match_motm_votes(match_id);
create index if not exists idx_motm_nominee on match_motm_votes(match_id, nominee_id);
