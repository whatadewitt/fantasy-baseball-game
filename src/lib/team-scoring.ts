import type { SupabaseClient } from '@supabase/supabase-js'
import { isHitter, calculateHitterPoints, calculatePitcherPoints } from './scoring'

export interface RosterRef {
  user_id: string
  player_id: string
  mlb_id: number
  position: string
}

export interface ScoringBucket {
  hits: number
  home_runs: number
  runs: number
  rbis: number
  stolen_bases: number
  strikeouts: number
  wins: number
  saves: number
  innings_pitched: number
}

export interface RosterScore extends RosterRef {
  stats: ScoringBucket | null
  last_night_stats: ScoringBucket | null
  last_week_stats: ScoringBucket | null
  points: number
  last_night_points: number
  last_week_points: number
}

interface StatRow {
  mlb_id: number
  date: string
  stat_group: string | null
  hits: number | null
  home_runs: number | null
  runs: number | null
  rbis: number | null
  stolen_bases: number | null
  strikeouts: number | null
  wins: number | null
  saves: number | null
  innings_pitched: number | null
}

const empty = (): ScoringBucket => ({
  hits: 0, home_runs: 0, runs: 0, rbis: 0, stolen_bases: 0,
  strikeouts: 0, wins: 0, saves: 0, innings_pitched: 0,
})

function add(b: ScoringBucket, s: StatRow) {
  b.hits += s.hits || 0
  b.home_runs += s.home_runs || 0
  b.runs += s.runs || 0
  b.rbis += s.rbis || 0
  b.stolen_bases += s.stolen_bases || 0
  b.strikeouts += s.strikeouts || 0
  b.wins += s.wins || 0
  b.saves += s.saves || 0
  b.innings_pitched += s.innings_pitched || 0
}

// Pull stat rows for a set of mlb_ids, paginating past Supabase's 1000-row cap.
// The .order('id') is load-bearing: without a stable sort, OFFSET/LIMIT can
// return the same row on multiple pages (or skip rows), which silently
// inflates totals once the result set crosses the page boundary.
async function fetchStats(supabase: SupabaseClient, mlbIds: number[]): Promise<StatRow[]> {
  if (mlbIds.length === 0) return []
  const rows: StatRow[] = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('player_stats')
      .select('mlb_id, date, stat_group, hits, home_runs, runs, rbis, stolen_bases, strikeouts, wins, saves, innings_pitched')
      .in('mlb_id', mlbIds)
      .neq('date', '2025-12-31')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (!data || data.length === 0) break
    rows.push(...(data as StatRow[]))
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

// Single source of truth for "how many points has each rostered player scored?"
// Both the leaderboard and the team page must call this — divergence between
// them in the past was caused by drift between two near-identical aggregations.
export async function scoreRosters(
  supabase: SupabaseClient,
  rosters: RosterRef[],
): Promise<RosterScore[]> {
  const mlbIds = [...new Set(rosters.map(r => r.mlb_id).filter(Boolean))]
  const stats = await fetchStats(supabase, mlbIds)

  const allDates = [...new Set(stats.map(s => s.date))].sort()
  const lastDate = allDates[allDates.length - 1] || null
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const season: Record<string, ScoringBucket> = {}
  const lastNight: Record<string, ScoringBucket> = {}
  const lastWeek: Record<string, ScoringBucket> = {}

  for (const s of stats) {
    const key = `${s.mlb_id}-${s.stat_group || 'hitting'}`
    if (!season[key]) season[key] = empty()
    add(season[key], s)
    if (lastDate && s.date === lastDate) {
      if (!lastNight[key]) lastNight[key] = empty()
      add(lastNight[key], s)
    }
    if (s.date >= weekAgoStr) {
      if (!lastWeek[key]) lastWeek[key] = empty()
      add(lastWeek[key], s)
    }
  }

  return rosters.map(r => {
    const hitter = isHitter(r.position)
    const key = `${r.mlb_id}-${hitter ? 'hitting' : 'pitching'}`
    const calc = (b: ScoringBucket | null) => {
      if (!b) return 0
      return hitter ? calculateHitterPoints(b) : calculatePitcherPoints(b)
    }
    const stats_ = season[key] || null
    const ln = lastNight[key] || null
    const lw = lastWeek[key] || null
    return {
      ...r,
      stats: stats_,
      last_night_stats: ln,
      last_week_stats: lw,
      points: calc(stats_),
      last_night_points: calc(ln),
      last_week_points: calc(lw),
    }
  })
}
