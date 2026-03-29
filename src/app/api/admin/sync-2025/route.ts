import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isHitter } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY) {
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

  // Deduplicate by mlb_id (same player can appear at multiple positions)
  const uniquePlayers = new Map<number, { mlb_id: number; position: string }>()
  for (const p of allPlayers) {
    if (p.mlb_id && !uniquePlayers.has(p.mlb_id)) {
      uniquePlayers.set(p.mlb_id, p)
    }
  }

  const DATE_KEY = '2025-12-31'
  let updatedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // Process in batches of 5 to avoid hammering the API
  const entries = Array.from(uniquePlayers.values())
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(async (player) => {
        const group = isHitter(player.position) ? 'hitting' : 'pitching'
        const res = await fetch(
          `${mlbBase}/people/${player.mlb_id}/stats?stats=season&season=2025&group=${group}`
        )
        if (!res.ok) return null

        const json = await res.json()
        const stat = json.stats?.[0]?.splits?.[0]?.stat
        if (!stat) return null

        const row = {
          mlb_id: player.mlb_id,
          date: DATE_KEY,
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
          .upsert(row, { onConflict: 'mlb_id,date' })

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
    players_total: uniquePlayers.size,
    errors: errors.length ? errors.slice(0, 20) : undefined,
  })
}
