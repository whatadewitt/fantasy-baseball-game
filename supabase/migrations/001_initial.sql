-- Players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  mlb_id integer unique not null,
  name text not null,
  position text not null check (position in ('C','1B','2B','3B','SS','OF','DH','SP','RP')),
  position_box integer not null,
  team text not null,
  image_url text,
  created_at timestamptz default now()
);

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  team_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auth tokens table
create table if not exists auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- Rosters table
create table if not exists rosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  position text not null,
  picked_at timestamptz default now(),
  swapped_out boolean default false,
  swapped_at timestamptz,
  unique(player_id)
);

-- Player stats table
create table if not exists player_stats (
  id uuid primary key default gen_random_uuid(),
  mlb_id integer not null,
  date date not null,
  hits integer default 0,
  runs integer default 0,
  rbis integer default 0,
  stolen_bases integer default 0,
  strikeouts integer default 0,
  wins integer default 0,
  saves integer default 0,
  quality_starts integer default 0,
  innings_pitched decimal default 0,
  earned_runs integer default 0,
  updated_at timestamptz default now(),
  unique(mlb_id, date)
);

-- Scores table
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  date date not null,
  hitter_points integer default 0,
  pitcher_points integer default 0,
  total_points integer default 0,
  updated_at timestamptz default now(),
  unique(user_id, player_id, date)
);

-- Season config table
create table if not exists season_config (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null,
  all_star_break_date date,
  selection_open_date date,
  selection_close_date date,
  override_date date
);

-- Indexes
create index if not exists idx_players_position_box on players(position, position_box);
create index if not exists idx_rosters_user_id on rosters(user_id);
create index if not exists idx_player_stats_mlb_id_date on player_stats(mlb_id, date);
create index if not exists idx_scores_user_id on scores(user_id);

-- Insert default season config for 2026
insert into season_config (season_year, all_star_break_date, selection_open_date, selection_close_date)
values (2026, '2026-07-14', '2026-03-24', '2026-04-07')
on conflict do nothing;
