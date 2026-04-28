import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { calculateHitterPoints, calculatePitcherPoints, isHitter, inningsPitchedToOuts } from '@/lib/scoring'

// Convert outs back to baseball IP notation (17 outs → 5.2)
function outsToInningsPitched(outs: number): number {
  return Math.floor(outs / 3) + (outs % 3) / 10
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
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

  if (playerEntries.length === 0) {
    return NextResponse.json({ message: 'No players found', updated: 0 })
  }

  let updatedCount = 0
  let gamesStored = 0
  const errors: string[] = []

  // --- Sync IL status from MLB roster endpoints ---
  // We pull every team's full roster, read the `status.code`, and map D7/D10/D15/D60
  // to a day-count. The MLB API still emits the legacy "Disabled List" D-prefix even
  // though the public name is "Injured List". Anything else becomes NULL.
  let ilUpdated = 0
  try {
    const teamsRes = await fetch(`${mlbBase}/teams?sportId=1`)
    if (teamsRes.ok) {
      const teamsJson = await teamsRes.json()
      const teamIds: number[] = (teamsJson.teams || []).map((t: { id: number }) => t.id)

      const ilByMlbId: Record<number, number> = {}
      const rosterResults = await Promise.allSettled(
        teamIds.map(async (teamId) => {
          const res = await fetch(`${mlbBase}/teams/${teamId}/roster?rosterType=fullRoster`)
          if (!res.ok) return
          const json = await res.json()
          for (const entry of json.roster || []) {
            const code: string | undefined = entry.status?.code
            const personId: number | undefined = entry.person?.id
            if (!code || !personId) continue
            const match = code.match(/^D(\d+)$/)
            if (match) ilByMlbId[personId] = parseInt(match[1], 10)
          }
        })
      )
      for (const r of rosterResults) {
        if (r.status === 'rejected') errors.push(`roster: ${String(r.reason)}`)
      }

      // Clear stale IL flags first, then set the current ones.
      await supabase.from('players').update({ il_status: null }).not('il_status', 'is', null)

      const ilEntries = Object.entries(ilByMlbId)
      const byDays: Record<number, number[]> = {}
      for (const [mlbId, days] of ilEntries) {
        if (!byDays[days]) byDays[days] = []
        byDays[days].push(parseInt(mlbId, 10))
      }
      for (const [days, ids] of Object.entries(byDays)) {
        const { error } = await supabase
          .from('players')
          .update({ il_status: parseInt(days, 10) })
          .in('mlb_id', ids)
        if (error) errors.push(`il update: ${error.message}`)
        else ilUpdated += ids.length
      }
    }
  } catch (e) {
    errors.push(`il sync: ${String(e)}`)
  }

  // Process in batches of 20
  for (let i = 0; i < playerEntries.length; i += 20) {
    const batch = playerEntries.slice(i, i + 20)
    const results = await Promise.allSettled(
      batch.map(async (entry) => {
        const res = await fetch(
          `${mlbBase}/people/${entry.mlb_id}/stats?stats=gameLog&season=2026&group=${entry.group}`
        )
        if (!res.ok) return { updated: false, games: 0 }

        const json = await res.json()
        const splits = json.stats?.[0]?.splits || []
        if (splits.length === 0) return { updated: false, games: 0 }

        // Aggregate splits by date — MLB returns one row per game, so doubleheaders
        // produce two splits with the same date. The unique constraint on
        // (mlb_id, date, stat_group) only allows one row, and Postgres rejects an
        // upsert that touches the same conflict target twice in one statement.
        type AggRow = {
          mlb_id: number; date: string; stat_group: 'hitting' | 'pitching';
          games_played: number; hits: number; home_runs: number; runs: number;
          rbis: number; stolen_bases: number; strikeouts: number; wins: number;
          saves: number; quality_starts: number; outs: number;
          earned_runs: number; updated_at: string;
        }
        const now = new Date().toISOString()
        const byDate: Record<string, AggRow> = {}
        for (const split of splits as { date: string; stat: Record<string, number | string> }[]) {
          const s = split.stat
          const date = split.date
          if (!byDate[date]) {
            byDate[date] = {
              mlb_id: entry.mlb_id, date, stat_group: entry.group,
              games_played: 0, hits: 0, home_runs: 0, runs: 0, rbis: 0,
              stolen_bases: 0, strikeouts: 0, wins: 0, saves: 0,
              quality_starts: 0, outs: 0, earned_runs: 0, updated_at: now,
            }
          }
          const r = byDate[date]
          r.games_played += 1
          r.hits += Number(s.hits || 0)
          r.home_runs += Number(s.homeRuns || 0)
          r.runs += Number(s.runs || 0)
          r.rbis += Number(s.rbi || 0)
          r.stolen_bases += Number(s.stolenBases || 0)
          r.strikeouts += Number(s.strikeOuts || 0)
          r.wins += Number(s.wins || 0)
          r.saves += Number(s.saves || 0)
          r.quality_starts += Number(s.qualityStarts || 0)
          r.outs += inningsPitchedToOuts(parseFloat(String(s.inningsPitched || '0')))
          r.earned_runs += Number(s.earnedRuns || 0)
        }
        const rows = Object.values(byDate).map(({ outs, ...rest }) => ({
          ...rest, innings_pitched: outsToInningsPitched(outs),
        }))

        const { error } = await supabase
          .from('player_stats')
          .upsert(rows, { onConflict: 'mlb_id,date,stat_group' })

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

  // Get all 2026 stats (not just today), with stat_group for correct matching
  const { data: allStats } = await supabase
    .from('player_stats')
    .select('mlb_id, date, stat_group, hits, home_runs, runs, rbis, stolen_bases, strikeouts, wins, saves, innings_pitched')
    .neq('date', '2025-12-31')

  // Build score rows — match roster position to correct stat_group
  const scoreRows: {
    user_id: string; player_id: string; date: string;
    hitter_points: number; pitcher_points: number; total_points: number;
    updated_at: string;
  }[] = []

  for (const roster of rosters || []) {
    const player = (roster as unknown as { players: { mlb_id: number; position: string } }).players
    if (!player?.mlb_id) continue

    const hitter = isHitter(player.position)
    const expectedGroup = hitter ? 'hitting' : 'pitching'

    for (const s of allStats || []) {
      if (s.mlb_id !== player.mlb_id) continue
      if (s.stat_group !== expectedGroup) continue

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
    il_updated: ilUpdated,
    errors: errors.length ? errors.slice(0, 20) : undefined,
  })
}
