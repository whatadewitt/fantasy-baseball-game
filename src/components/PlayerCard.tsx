'use client'

import { memo } from 'react'

interface PlayerStats {
  games_played: number
  hits: number
  home_runs: number
  runs: number
  rbis: number
  stolen_bases: number
  strikeouts: number
  wins: number
  saves: number
  innings_pitched: number
}

interface Player {
  id: string
  name: string
  team: string
  image_url: string | null
  headshot_url: string | null
  stats: PlayerStats | null
  is_hitter: boolean
}

interface Props {
  player: Player
  isMyPick: boolean
  isPending?: boolean
  canPick: boolean
  picking: boolean
  onPick: () => void
}

function formatStatLine(player: Player): string | null {
  const s = player.stats
  if (!s) return null

  if (player.is_hitter) {
    return `${s.games_played} G, ${s.hits} H, ${s.home_runs} HR, ${s.runs} R, ${s.rbis} RBI, ${s.stolen_bases} SB`
  }
  return `${s.games_played} GP, ${s.strikeouts} K, ${s.wins} W, ${s.saves} SV`
}

export default memo(function PlayerCard({ player, isMyPick, isPending, canPick, picking, onPick }: Props) {
  const isInteractive = (canPick || isPending) && !picking

  const styles = isMyPick
    ? isPending
      ? 'bg-crimson/8 border-crimson/30'
      : 'bg-success-pale border-success/30'
    : 'bg-surface border-navy/8'

  const interactiveStyles = isInteractive
    ? 'hover:border-crimson/40 hover:shadow-sm cursor-pointer focus-ring'
    : ''

  const statusLabel = isMyPick
    ? isPending ? 'Selected (unsaved)' : 'On your roster'
    : 'Available — click to pick'

  const statLine = formatStatLine(player)
  const headshotSrc = player.headshot_url || player.image_url

  return (
    <button
      type="button"
      className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-all w-full text-left ${styles} ${interactiveStyles}`}
      onClick={isInteractive ? onPick : undefined}
      disabled={!isInteractive}
      aria-label={`${player.name}, ${player.team}. ${statusLabel}`}
      aria-pressed={isMyPick}
    >
      {headshotSrc ? (
        <img
          src={headshotSrc}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          className="w-11 h-11 rounded-full object-cover shrink-0 bg-navy/5"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-navy/8 flex items-center justify-center text-ink-muted text-sm font-medium shrink-0">
          {player.name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate text-ink">
          {player.name}
        </p>
        <p className="text-xs text-ink-muted truncate">
          {player.team}
          {statLine ? <span className="text-ink-muted/70"> · {statLine}</span> : <span className="text-ink-muted/50"> · No 2025 MLB data</span>}
        </p>
      </div>
      <div className="shrink-0 text-xs" aria-hidden="true">
        {isMyPick && !isPending && <span className="text-success font-semibold">Saved</span>}
        {isPending && <span className="text-crimson font-semibold">Selected</span>}
      </div>
    </button>
  )
})
