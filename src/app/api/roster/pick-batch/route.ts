import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { player_ids } = await req.json()
  if (!Array.isArray(player_ids) || player_ids.length === 0) {
    return NextResponse.json({ error: 'player_ids array required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Get all selected players
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .in('id', player_ids)

  if (playersError || !players || players.length !== player_ids.length) {
    return NextResponse.json({ error: 'One or more players not found' }, { status: 404 })
  }

  // Check for duplicate position+box in the batch itself
  const seen = new Set<string>()
  for (const p of players) {
    const key = `${p.position}-${p.position_box}`
    if (seen.has(key)) {
      return NextResponse.json({ error: `Duplicate pick for ${p.position} Group ${p.position_box}` }, { status: 400 })
    }
    seen.add(key)
  }

  // Check user doesn't already have players from these position+boxes
  const { data: userRoster } = await supabase
    .from('rosters')
    .select('*, players(*)')
    .eq('user_id', user.id)
    .eq('swapped_out', false)

  const existingKeys = new Set(
    (userRoster || []).map(
      (r: { players: { position: string; position_box: number } }) =>
        `${r.players?.position}-${r.players?.position_box}`
    )
  )

  const conflicts = players.filter(p => existingKeys.has(`${p.position}-${p.position_box}`))
  if (conflicts.length > 0) {
    return NextResponse.json({
      error: `You already picked from: ${conflicts.map(p => `${p.position} Group ${p.position_box}`).join(', ')}`,
    }, { status: 409 })
  }

  // Insert all picks
  const rows = players.map(p => ({
    user_id: user.id,
    player_id: p.id,
    position: p.position,
  }))

  const { error: insertError } = await supabase
    .from('rosters')
    .insert(rows)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: rows.length })
}
