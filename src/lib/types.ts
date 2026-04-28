export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'OF' | 'DH' | 'SP' | 'RP'

export interface Player {
  id: string
  mlb_id: number
  name: string
  position: Position
  position_box: number
  team: string
  image_url: string | null
  il_status: number | null
  created_at: string
}

export interface User {
  id: string
  email: string
  team_name: string
  created_at: string
  updated_at: string
}

export interface RosterEntry {
  id: string
  user_id: string
  player_id: string
  position: string
  picked_at: string
  swapped_out: boolean
  swapped_at: string | null
  player?: Player
}

export interface PlayerStats {
  id: string
  mlb_id: number
  date: string
  hits: number
  runs: number
  rbis: number
  stolen_bases: number
  strikeouts: number
  wins: number
  saves: number
  quality_starts: number
  innings_pitched: number
  earned_runs: number
  updated_at: string
}

export interface Score {
  id: string
  user_id: string
  player_id: string
  date: string
  hitter_points: number
  pitcher_points: number
  total_points: number
  updated_at: string
}

export interface SeasonConfig {
  id: string
  season_year: number
  all_star_break_date: string
  selection_open_date: string
  selection_close_date: string
  override_date: string | null
}

export interface StandingsEntry {
  user_id: string
  team_name: string
  email: string
  total_points: number
  player_count: number
}

export interface TeamRosterPlayer {
  roster_id: string
  position: string
  player: Player
  stats: PlayerStats | null
  points: number
}
