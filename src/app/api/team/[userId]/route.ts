import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { calculateHitterPoints, calculatePitcherPoints, isHitter } from '@/lib/scoring'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = createServiceClient()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: roster } = await supabase
    .from('rosters')
    .select('*, players(*)')
    .eq('user_id', userId)
    .eq('swapped_out', false)

  const mlbIds = (roster || []).map((r: { players: { mlb_id: number } }) => r.players?.mlb_id).filter(Boolean)

  const { data: allStats } = await supabase
    .from('player_stats')
    .select('*')
    .in('mlb_id', mlbIds)

  // Aggregate stats per mlb_id (season totals)
  const statsByMlbId: Record<number, {
    hits: number, home_runs: number, runs: number, rbis: number, stolen_bases: number,
    strikeouts: number, wins: number, saves: number,
    innings_pitched: number, earned_runs: number, updated_at: string
  }> = {}

  for (const stat of allStats || []) {
    if (!statsByMlbId[stat.mlb_id]) {
      statsByMlbId[stat.mlb_id] = {
        hits: 0, home_runs: 0, runs: 0, rbis: 0, stolen_bases: 0,
        strikeouts: 0, wins: 0, saves: 0,
        innings_pitched: 0, earned_runs: 0, updated_at: stat.updated_at
      }
    }
    const s = statsByMlbId[stat.mlb_id]
    s.hits += stat.hits || 0
    s.home_runs += stat.home_runs || 0
    s.runs += stat.runs || 0
    s.rbis += stat.rbis || 0
    s.stolen_bases += stat.stolen_bases || 0
    s.strikeouts += stat.strikeouts || 0
    s.wins += stat.wins || 0
    s.saves += stat.saves || 0
    s.innings_pitched += stat.innings_pitched || 0
    s.earned_runs += stat.earned_runs || 0
    if (stat.updated_at > s.updated_at) s.updated_at = stat.updated_at
  }

  let totalPoints = 0
  const rosterWithPoints = (roster || []).map((r: { players: { mlb_id: number; position: string; name: string; team: string; image_url: string | null } & Record<string, unknown>; position: string } & Record<string, unknown>) => {
    const stats = statsByMlbId[r.players?.mlb_id] || null
    let points = 0
    if (stats) {
      if (isHitter(r.players?.position)) {
        points = calculateHitterPoints(stats)
      } else {
        points = calculatePitcherPoints(stats)
      }
    }
    totalPoints += points
    return { ...r, stats, points }
  })

  // Get season config to check if swaps are open
  const { data: config } = await supabase
    .from('season_config')
    .select('*')
    .order('season_year', { ascending: false })
    .limit(1)
    .single()

  const today = config?.current_date || new Date().toISOString().split('T')[0]
  const swapsOpen = config?.all_star_break_date ? today >= config.all_star_break_date : false

  return NextResponse.json({
    user: { ...user, email: user.email.replace(/^(.)/, '*') },
    roster: rosterWithPoints,
    total_points: totalPoints,
    swaps_open: swapsOpen,
    last_updated: allStats?.[0]?.updated_at || null,
  })
}
