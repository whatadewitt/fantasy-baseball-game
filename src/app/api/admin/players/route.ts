import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function checkAuth(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  return !!process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const allPlayers = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('position')
      .order('name')
      .range(from, from + pageSize - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allPlayers.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  return NextResponse.json({ players: allPlayers })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mlb_id, name, team, position, position_box } = await req.json()
  if (!mlb_id || !name || !position) return NextResponse.json({ error: 'mlb_id, name, position required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('players')
    .insert({ mlb_id, name, team, position, position_box: position_box ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ player: data })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, position, position_box } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServiceClient()
  const update: Record<string, unknown> = {}
  if (position !== undefined) update.position = position
  if (position_box !== undefined) update.position_box = position_box === '' ? null : position_box

  const { error } = await supabase.from('players').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
