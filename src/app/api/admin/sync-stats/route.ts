import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { calculateHitterPoints, calculatePitcherPoints, isHitter, inningsPitchedToOuts } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const mlbBase = process.env.MLB_API_BASE_URL || 'https://statsapi.mlb.com/api/v1'

  // Get all players, deduplicate by mlb_id
  const allPlayers = []
  let from = 0
  while (true) {
    const { data, error } = await supabase.from('players').select('mlb_id, position').range(from, from + 999)
    if (error || !data || data.length === 0) break
    allPlayers.push(...data)
    if (data.length < 1000) break
    from += 1000
  }

  const uniquePlayers = new Map<number, { mlb_id: number; position: string }>()
  for (const p of allPlayers) {
    if (p.mlb_id && !uniquePlayers.has(p.mlb_id)) {
      uniquePlayers.set(p.mlb_id, p)
    }
  }

  if (uniquePlayers.size === 0) {
    return NextResponse.json({ message: 'No players found', updated: 0 })
  }

  let updatedCount = 0
  let gamesStored = 0
  const errors: string[] = []

  // Process in batches of 5
  const entries = Array.from(uniquePlayers.values())
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(async (player) => {
        const group = isHitter(player.position) ? 'hitting' : 'pitching'
        const res = await fetch(
          `${mlbBase}/people/${player.mlb_id}/stats?stats=gameLog&season=2026&group=${group}`
        )
        if (!res.ok) return { updated: false, games: 0 }

        const json = await res.json()
        const splits = json.stats?.[0]?.splits || []
        if (splits.length === 0) return { updated: false, games: 0 }

        // Store one row per game date
        const rows = splits.map((split: { date: string; stat: Record<string, number | string> }) => {
          const s = split.stat
          const ip = parseFloat(String(s.inningsPitched || '0'))
          return {
            mlb_id: player.mlb_id,
            date: split.date,
            games_played: 1,
            hits: s.hits || 0,
            home_runs: s.homeRuns || 0,
            runs: s.runs || 0,
            rbis: s.rbi || 0,
            stolen_bases: s.stolenBases || 0,
            strikeouts: s.strikeOuts || 0,
            wins: s.wins || 0,
            saves: s.saves || 0,
            quality_starts: s.qualityStarts || 0,
            innings_pitched: ip,
            earned_runs: s.earnedRuns || 0,
            updated_at: new Date().toISOString(),
          }
        })

        const { error } = await supabase
          .from('player_stats')
          .upsert(rows, { onConflict: 'mlb_id,date' })

        if (error) throw new Error(error.message)
        return { updated: true, games: rows.length }
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.updated) {
        updatedCount++
        gamesStored += r.value.games
      } else if (r.status === 'rejected') {
        errors.push(String(r.reason))
      }
    }
  }

  // Recalculate scores — one row per user per player per game date
  const { data: rosters } = await supabase
    .from('rosters')
    .select('id, user_id, player_id, players(mlb_id, position)')
    .eq('swapped_out', false)

  // Get all 2026 stats (not just today)
  const { data: allStats } = await supabase
    .from('player_stats')
    .select('mlb_id, date, hits, home_runs, runs, rbis, stolen_bases, strikeouts, wins, saves, innings_pitched')
    .neq('date', '2025-12-31')

  // Group stats by mlb_id and date
  const statsByMlbIdDate: Record<string, typeof allStats extends (infer T)[] | null ? T : never> = {}
  for (const s of allStats || []) {
    statsByMlbIdDate[`${s.mlb_id}-${s.date}`] = s
  }

  // Build score rows
  const scoreRows: {
    user_id: string; player_id: string; date: string;
    hitter_points: number; pitcher_points: number; total_points: number;
    updated_at: string;
  }[] = []

  for (const roster of rosters || []) {
    const player = (roster as unknown as { players: { mlb_id: number; position: string } }).players
    if (!player?.mlb_id) continue

    const hitter = isHitter(player.position)

    for (const s of allStats || []) {
      if (s.mlb_id !== player.mlb_id) continue

      const hitter_points = hitter ? calculateHitterPoints(s) : 0
      const pitcher_points = hitter ? 0 : calculatePitcherPoints(s)

      scoreRows.push({
        user_id: roster.user_id,
        player_id: roster.player_id,
        date: s.date,
        hitter_points,
        pitcher_points,
        total_points: hitter_points + pitcher_points,
        updated_at: new Date().toISOString(),
      })
    }
  }

  // Upsert scores in batches
  for (let i = 0; i < scoreRows.length; i += 500) {
    const batch = scoreRows.slice(i, i + 500)
    await supabase.from('scores').upsert(batch, { onConflict: 'user_id,player_id,date' })
  }

  return NextResponse.json({
    success: true,
    players_updated: updatedCount,
    games_stored: gamesStored,
    scores_calculated: scoreRows.length,
    errors: errors.length ? errors.slice(0, 20) : undefined,
  })
}
