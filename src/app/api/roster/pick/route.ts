import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { player_id } = await req.json()
  if (!player_id) {
    return NextResponse.json({ error: 'player_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Get player info
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', player_id)
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  // Check user doesn't already have a player from this position+box
  const { data: userRoster } = await supabase
    .from('rosters')
    .select('*, players(*)')
    .eq('user_id', user.id)
    .eq('swapped_out', false)

  const alreadyHasPosition = (userRoster || []).some(
    (r: { players: { position: string; position_box: number } }) =>
      r.players?.position === player.position &&
      r.players?.position_box === player.position_box
  )

  if (alreadyHasPosition) {
    return NextResponse.json({ error: 'You already picked from this box' }, { status: 409 })
  }

  // Add to roster
  const { data: roster, error: insertError } = await supabase
    .from('rosters')
    .insert({
      user_id: user.id,
      player_id,
      position: player.position,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, roster })
}
