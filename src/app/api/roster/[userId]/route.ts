import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = createServiceClient()

  const { data: roster, error } = await supabase
    .from('rosters')
    .select('*, players(*)')
    .eq('user_id', userId)
    .eq('swapped_out', false)
    .order('picked_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get stats for each player
  const mlbIds = (roster || []).map((r: { players: { mlb_id: number } }) => r.players?.mlb_id).filter(Boolean)

  const { data: stats } = await supabase
    .from('player_stats')
    .select('*')
    .in('mlb_id', mlbIds)

  const statsByMlbId = Object.fromEntries(
    (stats || []).map((s: { mlb_id: number }) => [s.mlb_id, s])
  )

  const rosterWithStats = (roster || []).map((r: { players: { mlb_id: number; position: string } }) => ({
    ...r,
    stats: statsByMlbId[r.players?.mlb_id] || null,
  }))

  return NextResponse.json({ roster: rosterWithStats })
}
