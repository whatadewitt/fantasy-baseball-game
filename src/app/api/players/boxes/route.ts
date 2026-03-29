import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isHitter } from '@/lib/scoring'

export async function GET() {
  const supabase = createServiceClient()

  // Get only players assigned to a box, paginating past the 1000-row limit
  const allPlayers = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .not('position_box', 'is', null)
      .order('position')
      .order('position_box')
      .order('name')
      .range(from, from + pageSize - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allPlayers.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  const players = allPlayers

  // Get claimed player IDs and aggregated stats in parallel
  const mlbIds = players.map(p => p.mlb_id).filter(Boolean)

  const [{ data: rosters }, { data: allStats }] = await Promise.all([
    supabase.from('rosters').select('player_id').eq('swapped_out', false),
    mlbIds.length > 0
      ? supabase.from('player_stats').select('mlb_id, games_played, hits, home_runs, runs, rbis, stolen_bases, strikeouts, wins, saves, innings_pitched').in('mlb_id', mlbIds)
      : Promise.resolve({ data: [] }),
  ])

  const claimedIds = new Set((rosters || []).map((r: { player_id: string }) => r.player_id))

  // Aggregate stats per mlb_id
  const statsByMlbId: Record<number, {
    games_played: number, hits: number, home_runs: number, runs: number, rbis: number, stolen_bases: number,
    strikeouts: number, wins: number, saves: number, innings_pitched: number,
  }> = {}

  for (const stat of allStats || []) {
    if (!statsByMlbId[stat.mlb_id]) {
      statsByMlbId[stat.mlb_id] = { games_played: 0, hits: 0, home_runs: 0, runs: 0, rbis: 0, stolen_bases: 0, strikeouts: 0, wins: 0, saves: 0, innings_pitched: 0 }
    }
    const s = statsByMlbId[stat.mlb_id]
    s.games_played += stat.games_played || 0
    s.hits += stat.hits || 0
    s.home_runs += stat.home_runs || 0
    s.runs += stat.runs || 0
    s.rbis += stat.rbis || 0
    s.stolen_bases += stat.stolen_bases || 0
    s.strikeouts += stat.strikeouts || 0
    s.wins += stat.wins || 0
    s.saves += stat.saves || 0
    s.innings_pitched += stat.innings_pitched || 0
  }

  // Group by position and box
  const boxes: Record<string, Record<number, typeof players>> = {}

  for (const player of players || []) {
    if (!boxes[player.position]) boxes[player.position] = {}
    if (!boxes[player.position][player.position_box]) {
      boxes[player.position][player.position_box] = []
    }
    boxes[player.position][player.position_box].push(player)
  }

  // Format response
  const result = Object.entries(boxes).map(([position, boxMap]) => ({
    position,
    boxes: Object.entries(boxMap).map(([boxNum, boxPlayers]) => ({
      box_number: parseInt(boxNum),
      players: boxPlayers.map(p => ({
        ...p,
        claimed: claimedIds.has(p.id),
        stats: statsByMlbId[p.mlb_id] || null,
        headshot_url: p.mlb_id
          ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${p.mlb_id}/headshot/silo/current`
          : null,
        is_hitter: isHitter(position),
      })),
    })),
  }))

  return NextResponse.json({ positions: result })
}
