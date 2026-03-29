-- Enable RLS
alter table players enable row level security;
alter table users enable row level security;
alter table rosters enable row level security;
alter table player_stats enable row level security;
alter table scores enable row level security;
alter table season_config enable row level security;
alter table auth_tokens enable row level security;

-- Players: public read
create policy "Public read players" on players for select using (true);

-- Users: public read (for standings), service role can write
create policy "Public read users" on users for select using (true);

-- Rosters: public read, anyone can insert (auth checked in API)
create policy "Public read rosters" on rosters for select using (true);
create policy "Anyone can insert rosters" on rosters for insert with check (true);
create policy "Anyone can update rosters" on rosters for update using (true);

-- Player stats: public read
create policy "Public read player_stats" on player_stats for select using (true);

-- Scores: public read
create policy "Public read scores" on scores for select using (true);

-- Season config: public read
create policy "Public read season_config" on season_config for select using (true);

-- Auth tokens: service role only (no public access)
