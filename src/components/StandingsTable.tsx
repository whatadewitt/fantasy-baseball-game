import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { scoreRosters, type RosterRef } from '@/lib/team-scoring'
import { AVATAR_VERSION } from '@/lib/cap-colors'

interface StandingsEntry {
  user_id: string
  team_name: string
  total_points: number
  last_night_points: number
  player_count: number
  created_at: string
}

async function getStandings(): Promise<StandingsEntry[]> {
  try {
    const supabase = createServiceClient()

    const [{ data: users, error }, { data: rosters }] = await Promise.all([
      supabase.from('users').select('id, team_name, created_at').order('created_at'),
      supabase.from('rosters').select('user_id, player_id, players(mlb_id, position)').eq('swapped_out', false),
    ])

    if (error || !users) return []

    type RosterRow = { user_id: string; player_id: string; players: { mlb_id: number; position: string } | null }
    const typedRosters = (rosters || []) as unknown as RosterRow[]
    const refs: RosterRef[] = typedRosters
      .filter(r => r.players?.mlb_id)
      .map(r => ({
        user_id: r.user_id,
        player_id: r.player_id,
        mlb_id: r.players!.mlb_id,
        position: r.players!.position,
      }))

    const scored = await scoreRosters(supabase, refs)

    const totalByUser: Record<string, number> = {}
    const lastNightByUser: Record<string, number> = {}
    const rosterCounts: Record<string, number> = {}
    for (const r of typedRosters) rosterCounts[r.user_id] = (rosterCounts[r.user_id] || 0) + 1
    for (const s of scored) {
      totalByUser[s.user_id] = (totalByUser[s.user_id] || 0) + s.points
      lastNightByUser[s.user_id] = (lastNightByUser[s.user_id] || 0) + s.last_night_points
    }

    return users
      .map(u => ({
        user_id: u.id,
        team_name: u.team_name,
        total_points: totalByUser[u.id] || 0,
        last_night_points: lastNightByUser[u.id] || 0,
        player_count: rosterCounts[u.id] || 0,
        created_at: u.created_at,
      }))
      .sort((a, b) => b.total_points - a.total_points || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  } catch {
    return []
  }
}

export default async function StandingsTable() {
  const [standings, currentUser] = await Promise.all([getStandings(), getCurrentUser()])

  if (standings.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl text-ink-secondary mb-1">No teams yet</p>
        <p className="text-ink-muted text-sm mb-6">Be the first to join the league.</p>
        <Link href="/signup" className="inline-block bg-crimson text-white font-medium px-5 py-2.5 rounded-lg hover:bg-crimson-light transition-colors focus-ring">
          Sign up now
        </Link>
      </div>
    )
  }

  const hasLastNight = standings.some(e => e.last_night_points > 0)

  return (
    <div className="scorecard bg-surface overflow-x-auto">
      <table className="w-full min-w-[340px]">
        <thead>
          <tr className="border-b-2 border-navy/10 text-xs uppercase tracking-widest text-ink-muted">
            <th className="px-3 sm:px-4 py-3 text-left w-10 font-medium" scope="col">#</th>
            <th className="px-3 sm:px-4 py-3 text-left font-medium" scope="col">Team</th>
            {hasLastNight && (
              <th className="px-3 sm:px-4 py-3 text-right font-medium" scope="col"><span className="hidden sm:inline">Change</span><span className="sm:hidden">Chg</span></th>
            )}
            <th className="px-3 sm:px-4 py-3 text-right font-medium" scope="col">Total</th>
          </tr>
        </thead>
        <tbody className="text-sm sm:text-base">
          {standings.map((entry, i) => {
            const isMe = currentUser?.id === entry.user_id
            return (
            <tr key={entry.user_id} className={`border-b border-navy/5 last:border-b-0 transition-colors ${isMe ? 'bg-crimson/5 border-l-3 border-l-crimson' : 'hover:bg-surface-alt'}`}>
              <td className="px-3 sm:px-4 py-3 text-ink-muted font-medium">{i + 1}</td>
              <td className="px-3 sm:px-4 py-3">
                <Link href={`/team/${entry.user_id}`} className="inline-flex items-center gap-2.5 font-medium text-navy hover:text-crimson transition-colors rounded focus-ring">
                  <img src={`/api/avatar/${entry.user_id}?name=${encodeURIComponent(entry.team_name)}&v=${AVATAR_VERSION}`} alt="" width={28} height={28} className="w-7 h-7 shrink-0" />
                  {entry.team_name}
                </Link>
              </td>
              {hasLastNight && (
                <td className="px-3 sm:px-4 py-3 text-right text-ink-muted">
                  {entry.last_night_points > 0 && (
                    <span className="text-success font-medium">+{entry.last_night_points}</span>
                  )}
                  {entry.last_night_points === 0 && '—'}
                </td>
              )}
              <td className="px-3 sm:px-4 py-3 text-right font-display font-semibold text-crimson">{entry.total_points}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
