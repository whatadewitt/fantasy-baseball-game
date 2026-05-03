import { isHitter } from '@/lib/scoring'
import { scoreRosters, type RosterRef } from '@/lib/team-scoring'
import { AVATAR_VERSION } from '@/lib/cap-colors'
import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import { IlMark, IlLabel } from './IlBadge'

async function getTeam(userId: string) {
  try {
    const supabase = createServiceClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) return null

    const { data: roster } = await supabase
      .from('rosters')
      .select('*, players(*)')
      .eq('user_id', userId)
      .eq('swapped_out', false)

    type RosterRow = {
      id: string
      user_id: string
      player_id: string
      position: string
      players: { mlb_id: number; position: string; il_status: number | null; name: string; team: string } | null
    }
    const typedRoster = (roster || []) as unknown as RosterRow[]

    const refs: RosterRef[] = typedRoster
      .filter(r => r.players?.mlb_id)
      .map(r => ({
        user_id: r.user_id,
        player_id: r.player_id,
        mlb_id: r.players!.mlb_id,
        position: r.players!.position,
      }))

    const scored = await scoreRosters(supabase, refs)
    const scoreByPlayerId = new Map(scored.map(s => [s.player_id, s]))

    let totalPoints = 0
    const rosterWithPoints = typedRoster.map(r => {
      const s = scoreByPlayerId.get(r.player_id)
      const points = s?.points ?? 0
      totalPoints += points
      return {
        ...r,
        stats: s?.stats ?? null,
        points,
        lastNightPts: s?.last_night_points ?? 0,
        lastWeekPts: s?.last_week_points ?? 0,
      }
    })

    const { data: config } = await supabase
      .from('season_config')
      .select('*')
      .order('season_year', { ascending: false })
      .limit(1)
      .single()

    const configDate = config?.current_date || new Date().toISOString().split('T')[0]
    const swapsOpen = config?.all_star_break_date ? configDate >= config.all_star_break_date : false

    return {
      user,
      roster: rosterWithPoints,
      total_points: totalPoints,
      swaps_open: swapsOpen,
    }
  } catch {
    return null
  }
}

export default async function TeamView({ userId }: { userId: string }) {
  const data = await getTeam(userId)

  if (!data) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl text-ink-secondary">Team not found</p>
        <Link href="/" className="text-crimson text-sm hover:underline mt-2 inline-block focus-ring rounded">Back to standings</Link>
      </div>
    )
  }

  const { user, roster, total_points, swaps_open } = data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hitters = roster.filter((r: any) => isHitter(r.players?.position))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pitchers = roster.filter((r: any) => !isHitter(r.players?.position))

  return (
    <div>
      <div className="mb-10 reveal" style={{ '--delay': 0 } as React.CSSProperties}>
        <Link href="/" className="text-xs uppercase tracking-widest text-ink-muted hover:text-crimson transition-colors focus-ring rounded mb-4 inline-block">
          ← Standings
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <img src={`/api/avatar/${user.id}?name=${encodeURIComponent(user.team_name)}&v=${AVATAR_VERSION}`} alt="" width={56} height={56} className="w-14 h-14 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy tracking-tight truncate">{user.team_name}</h1>
              {user.name && <p className="text-ink-muted text-sm mt-1">Manager: {user.name}</p>}
            </div>
          </div>
          <div className="shrink-0">
            <p className="font-display text-4xl sm:text-5xl font-semibold text-crimson leading-none">{total_points}</p>
            <p className="text-ink-muted text-xs uppercase tracking-widest mt-1">total points</p>
          </div>
        </div>
      </div>

      {swaps_open && (
        <div className="mb-8 p-3 bg-gold-pale border-l-3 border-gold text-ink text-sm reveal" style={{ '--delay': 1 } as React.CSSProperties}>
          All-Star break swap period is open &mdash; you have 4 swaps
        </div>
      )}

      <div className="mb-10 reveal" style={{ '--delay': 1 } as React.CSSProperties}>
        <h2 className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-3">Hitters</h2>
        {hitters.length === 0 ? (
          <p className="text-ink-muted text-sm py-4">No hitters selected. <Link href="/select" className="text-crimson hover:underline focus-ring rounded">Pick players</Link> to get started.</p>
        ) : (
          <div className="scorecard bg-surface overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead>
                <tr className="border-b-2 border-navy/10 text-[10px] sm:text-xs uppercase tracking-widest text-ink-muted">
                  <th className="px-2 sm:px-4 py-2.5 text-left font-medium" scope="col">Player</th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Hits">H</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Home Runs">HR</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Runs">R</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Runs Batted In">RBI</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Stolen Bases">SB</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium border-l border-navy/10" scope="col"><abbr title="Last Night Points">LN</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Last 7 Days Points">L7</abbr></th>
                  <th className="px-2 sm:px-4 py-2.5 text-right font-medium border-l border-navy/10" scope="col">Pts</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {hitters.map((r: any) => (
                  <tr key={r.id} className="border-b border-navy/5 last:border-b-0">
                    <td className="px-2 sm:px-4 py-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={r.players?.mlb_id ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${r.players.mlb_id}/headshot/silo/current` : ''}
                            alt=""
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover bg-navy/5"
                          />
                          {r.players?.il_status != null && <IlMark days={r.players.il_status} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate max-w-[120px] sm:max-w-[180px] leading-5">
                            {r.players?.name}
                            {r.players?.il_status != null && <IlLabel days={r.players.il_status} className="ml-1.5" />}
                          </p>
                          <p className="text-[10px] sm:text-xs text-ink-muted">{r.position} · {r.players?.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.hits ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.home_runs ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.runs ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.rbis ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.stolen_bases ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-muted border-l border-navy/10">{r.lastNightPts || '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-muted">{r.lastWeekPts || '—'}</td>
                    <td className="px-2 sm:px-4 py-2.5 text-right font-display font-semibold text-crimson border-l border-navy/10">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-10 reveal" style={{ '--delay': 2 } as React.CSSProperties}>
        <h2 className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-3">Pitchers</h2>
        {pitchers.length === 0 ? (
          <p className="text-ink-muted text-sm py-4">No pitchers selected. <Link href="/select" className="text-crimson hover:underline focus-ring rounded">Pick players</Link> to get started.</p>
        ) : (
          <div className="scorecard bg-surface overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead>
                <tr className="border-b-2 border-navy/10 text-[10px] sm:text-xs uppercase tracking-widest text-ink-muted">
                  <th className="px-2 sm:px-4 py-2.5 text-left font-medium" scope="col">Player</th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Outs Recorded">Outs</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Strikeouts">K</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Wins">W</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Saves">SV</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium border-l border-navy/10" scope="col"><abbr title="Last Night Points">LN</abbr></th>
                  <th className="px-1 sm:px-2 py-2.5 text-center font-medium" scope="col"><abbr title="Last 7 Days Points">L7</abbr></th>
                  <th className="px-2 sm:px-4 py-2.5 text-right font-medium border-l border-navy/10" scope="col">Pts</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pitchers.map((r: any) => {
                  const outs = r.stats ? Math.floor(r.stats.innings_pitched) * 3 + Math.round((r.stats.innings_pitched % 1) * 10) : null
                  return (
                  <tr key={r.id} className="border-b border-navy/5 last:border-b-0">
                    <td className="px-2 sm:px-4 py-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={r.players?.mlb_id ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${r.players.mlb_id}/headshot/silo/current` : ''}
                            alt=""
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover bg-navy/5"
                          />
                          {r.players?.il_status != null && <IlMark days={r.players.il_status} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate max-w-[120px] sm:max-w-[180px] leading-5">
                            {r.players?.name}
                            {r.players?.il_status != null && <IlLabel days={r.players.il_status} className="ml-1.5" />}
                          </p>
                          <p className="text-[10px] sm:text-xs text-ink-muted">{r.position} · {r.players?.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{outs ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.strikeouts ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.wins ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-secondary">{r.stats?.saves ?? '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-muted border-l border-navy/10">{r.lastNightPts || '—'}</td>
                    <td className="px-1 sm:px-2 py-2.5 text-center text-ink-muted">{r.lastWeekPts || '—'}</td>
                    <td className="px-2 sm:px-4 py-2.5 text-right font-display font-semibold text-crimson border-l border-navy/10">{r.points}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
