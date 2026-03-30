import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

  const nameIdx = headers.findIndex(h => h.includes('name'))
  const mlbIdIdx = headers.findIndex(h => h.includes('mlbamid') || h.includes('mlbid') || h.includes('mlb_id') || h.includes('idfangraphs'))
  const positionIdx = headers.findIndex(h => h.includes('pos'))
  const teamIdx = headers.findIndex(h => h.includes('team'))

  if (nameIdx === -1 || mlbIdIdx === -1 || positionIdx === -1) {
    return NextResponse.json({
      error: 'CSV must have columns: name, mlb_id (or mlbid/idfangraphs), position, team'
    }, { status: 400 })
  }

  const players: { name: string; mlb_id: number; position: string; team: string }[] = []

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const mlbId = parseInt(cols[mlbIdIdx])
    if (isNaN(mlbId)) continue

    players.push({
      name: cols[nameIdx],
      mlb_id: mlbId,
      position: cols[positionIdx]?.toUpperCase().split('/')[0].trim(),
      team: teamIdx >= 0 ? cols[teamIdx] : '',
    })
  }

  // Group by position, assign position_box numbers
  const byPosition: Record<string, typeof players> = {}
  for (const p of players) {
    if (!byPosition[p.position]) byPosition[p.position] = []
    byPosition[p.position].push(p)
  }

  const supabase = createServiceClient()
  let inserted = 0

  // Upsert one position at a time to stay well under Supabase's row limit
  for (const [position, posPlayers] of Object.entries(byPosition)) {
    const rows = posPlayers.map((p, i) => ({
      mlb_id: p.mlb_id,
      name: p.name,
      position,
      position_box: null,
      team: p.team,
    }))

    const { error, data } = await supabase
      .from('players')
      .upsert(rows, { onConflict: 'mlb_id,position', ignoreDuplicates: true })
      .select('id')

    if (error) return NextResponse.json({ error: `${position}: ${error.message}` }, { status: 500 })
    inserted += data?.length ?? 0
  }

  return NextResponse.json({
    success: true,
    players_imported: inserted,
    positions: Object.fromEntries(
      Object.entries(byPosition).map(([pos, arr]) => [pos, arr.length])
    ),
  })
}
