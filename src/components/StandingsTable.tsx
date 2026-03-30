import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { isHitter, calculateHitterPoints, calculatePitcherPoints } from '@/lib/scoring'

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

    const [{ data: users, error }, { data: rosters }, { data: scores }] = await Promise.all([
      supabase.from('users').select('id, team_name, created_at').order('created_at'),
      supabase.from('rosters').select('user_id, player_id, players(mlb_id, position)').eq('swapped_out', false),
      supabase.from('scores').select('user_id, date, total_points'),
    ])

    if (error || !users) return []

    // Get all rostered mlb_ids for stat lookup
    type RosterRow = { user_id: string; player_id: string; players: { mlb_id: number; position: string } }
    const typedRosters = (rosters || []) as unknown as RosterRow[]
    const mlbIds = [...new Set(typedRosters.map(r => r.players?.mlb_id).filter(Boolean))]

    const { data: allStats } = mlbIds.length > 0
      ? await supabase.from('player_stats').select('mlb_id, stat_group, hits, home_runs, runs, rbis, stolen_bases, strikeouts, wins, saves, innings_pitched').in('mlb_id', mlbIds).neq('date', '2025-12-31')
      : { data: [] }

    // Aggregate stats per mlb_id + stat_group
    const statsByKey: Record<string, { hits: number, home_runs: number, runs: number, rbis: number, stolen_bases: number, strikeouts: number, wins: number, saves: number, innings_pitched: number }> = {}
    for (const stat of allStats || []) {
      const key = `${stat.mlb_id}-${stat.stat_group || 'hitting'}`
      if (!statsByKey[key]) {
        statsByKey[key] = { hits: 0, home_runs: 0, runs: 0, rbis: 0, stolen_bases: 0, strikeouts: 0, wins: 0, saves: 0, innings_pitched: 0 }
      }
      const s = statsByKey[key]
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

    // Calculate total points per user from player_stats (same as TeamView)
    const totalByUser: Record<string, number> = {}
    const rosterCounts: Record<string, number> = {}
    for (const r of typedRosters) {
      rosterCounts[r.user_id] = (rosterCounts[r.user_id] || 0) + 1
      if (!r.players?.mlb_id) continue

      const hitter = isHitter(r.players.position)
      const group = hitter ? 'hitting' : 'pitching'
      const stats = statsByKey[`${r.players.mlb_id}-${group}`]
      if (!stats) continue

      const points = hitter ? calculateHitterPoints(stats) : calculatePitcherPoints(stats)
      totalByUser[r.user_id] = (totalByUser[r.user_id] || 0) + points
    }

    // Use scores table only for "last night" change column
    const allDates = new Set((scores || []).map(s => s.date))
    const lastDate = Array.from(allDates).sort().reverse()[0] || null
    const lastNightByUser: Record<string, number> = {}
    for (const score of scores || []) {
      if (score.date === lastDate) {
        lastNightByUser[score.user_id] = (lastNightByUser[score.user_id] || 0) + score.total_points
      }
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
                  <img src={`/api/avatar/${entry.user_id}?name=${encodeURIComponent(entry.team_name)}`} alt="" width={28} height={28} className="w-7 h-7 shrink-0" />
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
