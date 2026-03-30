import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isHitter } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const mlbBase = process.env.MLB_API_BASE_URL || 'https://statsapi.mlb.com/api/v1'

  // Get all players with mlb_id
  const allPlayers = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('mlb_id, position')
      .range(from, from + 999)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allPlayers.push(...data)
    if (data.length < 1000) break
    from += 1000
  }

  // Build unique (mlb_id, group) pairs — a two-way player needs both hitting + pitching
  const playerEntries: { mlb_id: number; group: 'hitting' | 'pitching' }[] = []
  const seen = new Set<string>()
  for (const p of allPlayers) {
    if (!p.mlb_id) continue
    const group = isHitter(p.position) ? 'hitting' : 'pitching'
    const key = `${p.mlb_id}-${group}`
    if (!seen.has(key)) {
      seen.add(key)
      playerEntries.push({ mlb_id: p.mlb_id, group })
    }
  }

  const DATE_KEY = '2025-12-31'
  let updatedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // Process in batches of 20
  for (let i = 0; i < playerEntries.length; i += 20) {
    const batch = playerEntries.slice(i, i + 20)
    const results = await Promise.allSettled(
      batch.map(async (entry) => {
        const res = await fetch(
          `${mlbBase}/people/${entry.mlb_id}/stats?stats=season&season=2025&group=${entry.group}`
        )
        if (!res.ok) return null

        const json = await res.json()
        const stat = json.stats?.[0]?.splits?.[0]?.stat
        if (!stat) return null

        const row = {
          mlb_id: entry.mlb_id,
          date: DATE_KEY,
          stat_group: entry.group,
          games_played: stat.gamesPlayed || stat.gamesPitched || 0,
          hits: stat.hits || 0,
          home_runs: stat.homeRuns || 0,
          runs: stat.runs || 0,
          rbis: stat.rbi || 0,
          stolen_bases: stat.stolenBases || 0,
          strikeouts: stat.strikeOuts || 0,
          wins: stat.wins || 0,
          saves: stat.saves || 0,
          quality_starts: stat.qualityStarts || 0,
          innings_pitched: parseFloat(stat.inningsPitched || '0'),
          earned_runs: stat.earnedRuns || 0,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('player_stats')
          .upsert(row, { onConflict: 'mlb_id,date,stat_group' })

        if (error) throw new Error(error.message)
        return true
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) updatedCount++
      else if (r.status === 'fulfilled' && !r.value) skippedCount++
      else if (r.status === 'rejected') errors.push(String(r.reason))
    }
  }

  return NextResponse.json({
    success: true,
    players_updated: updatedCount,
    players_skipped: skippedCount,
    players_total: playerEntries.length,
    errors: errors.length ? errors.slice(0, 20) : undefined,
  })
}
