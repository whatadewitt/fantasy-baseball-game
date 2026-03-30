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

  // Get 2025 stats for all players, keyed by mlb_id + stat_group
  const mlbIds = players.map(p => p.mlb_id).filter(Boolean)

  const { data: allStats } = mlbIds.length > 0
    ? await supabase.from('player_stats').select('mlb_id, stat_group, games_played, hits, home_runs, runs, rbis, stolen_bases, strikeouts, wins, saves, innings_pitched').in('mlb_id', mlbIds).eq('date', '2025-12-31')
    : { data: [] }

  // Index stats by mlb_id + stat_group
  type StatRow = NonNullable<typeof allStats>[number]
  const statsByKey: Record<string, StatRow> = {}
  for (const stat of allStats || []) {
    statsByKey[`${stat.mlb_id}-${stat.stat_group}`] = stat
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
        stats: statsByKey[`${p.mlb_id}-${isHitter(position) ? 'hitting' : 'pitching'}`] || null,
        headshot_url: p.mlb_id
          ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${p.mlb_id}/headshot/silo/current`
          : null,
        is_hitter: isHitter(position),
      })),
    })),
  }))

  return NextResponse.json({ positions: result })
}
