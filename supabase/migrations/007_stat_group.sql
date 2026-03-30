-- Add stat_group column to support two-way players (e.g. Ohtani)
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS stat_group text NOT NULL DEFAULT 'hitting';

-- Drop old unique constraint and index
ALTER TABLE player_stats DROP CONSTRAINT IF EXISTS player_stats_mlb_id_date_key;
DROP INDEX IF EXISTS idx_player_stats_mlb_id_date;

-- Create new unique constraint and index including stat_group
ALTER TABLE player_stats ADD CONSTRAINT player_stats_mlb_id_date_group_key UNIQUE(mlb_id, date, stat_group);
CREATE INDEX idx_player_stats_mlb_id_date_group ON player_stats(mlb_id, date, stat_group);
