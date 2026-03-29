import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()

  // Get all users with their total scores
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, team_name, created_at')
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get total scores per user
  const { data: scores } = await supabase
    .from('scores')
    .select('user_id, total_points')

  const scoresByUser: Record<string, number> = {}
  for (const score of scores || []) {
    scoresByUser[score.user_id] = (scoresByUser[score.user_id] || 0) + score.total_points
  }

  // Get roster counts
  const { data: rosters } = await supabase
    .from('rosters')
    .select('user_id')
    .eq('swapped_out', false)

  const rosterCounts: Record<string, number> = {}
  for (const r of rosters || []) {
    rosterCounts[r.user_id] = (rosterCounts[r.user_id] || 0) + 1
  }

  const standings = (users || [])
    .map(u => ({
      user_id: u.id,
      team_name: u.team_name,
      email: u.email,
      total_points: scoresByUser[u.id] || 0,
      player_count: rosterCounts[u.id] || 0,
      created_at: u.created_at,
    }))
    .sort((a, b) => b.total_points - a.total_points || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json({ standings })
}
