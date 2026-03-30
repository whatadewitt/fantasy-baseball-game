'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PlayerCard from './PlayerCard'

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
  mlb_id: number
  name: string
  position: string
  position_box: number
  team: string
  image_url: string | null
  headshot_url: string | null
  stats: PlayerStats | null
  is_hitter: boolean
}

interface PositionBox {
  box_number: number
  players: Player[]
}

interface PositionGroup {
  position: string
  boxes: PositionBox[]
}

const POSITION_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'SP', 'RP']

const POSITION_LABELS: Record<string, string> = {
  C: 'Catcher', '1B': 'First Base', '2B': 'Second Base', '3B': 'Third Base',
  SS: 'Shortstop', OF: 'Outfield', DH: 'Designated Hitter', SP: 'Starting Pitcher', RP: 'Relief Pitcher',
}

export default function SelectionBoard() {
  const router = useRouter()
  const [positions, setPositions] = useState<PositionGroup[]>([])
  // Picks already saved to DB from a previous session
  const [savedPicks, setSavedPicks] = useState<Map<string, string>>(new Map()) // boxKey -> playerId
  // Local pending selections (not yet submitted)
  const [pendingPicks, setPendingPicks] = useState<Map<string, string>>(new Map()) // boxKey -> playerId
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const positionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const loadPlayers = useCallback(async () => {
    try {
      const [playersRes, meRes] = await Promise.all([
        fetch('/api/players/boxes'),
        fetch('/api/auth/me'),
      ])

      if (!playersRes.ok) {
        setError('Failed to load players. Please refresh the page.')
        setLoading(false)
        return
      }

      const playersData = await playersRes.json()

      if (playersData.positions) {
        const sorted = [...playersData.positions].sort(
          (a: PositionGroup, b: PositionGroup) =>
            POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
        )
        setPositions(sorted)
      }

      if (meRes.ok) {
        const meData = await meRes.json()
        if (meData.user) {
          setUserId(meData.user.id)
          const rosterRes = await fetch(`/api/roster/${meData.user.id}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            const saved = new Map<string, string>()
            for (const r of rosterData.roster || []) {
              if (r.players?.position && r.players?.position_box != null) {
                saved.set(`${r.players.position}-${r.players.position_box}`, r.player_id)
              }
            }
            setSavedPicks(saved)
          }
        }
      }

      setLoading(false)
    } catch {
      setError('Unable to connect. Check your internet connection and try again.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlayers()

    const channel = supabase
      .channel('rosters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rosters' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => loadPlayers(), 500)
      })
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [loadPlayers])

  const togglePlayer = useCallback((player: Player) => {
    const boxKey = `${player.position}-${player.position_box}`
    // Can't change a saved pick
    if (savedPicks.has(boxKey)) return

    setPendingPicks(prev => {
      const next = new Map(prev)
      if (next.get(boxKey) === player.id) {
        next.delete(boxKey) // deselect
      } else {
        next.set(boxKey, player.id) // select (replaces any previous pick in this box)
      }
      return next
    })
  }, [savedPicks])

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const handleSubmit = useCallback(async () => {
    // Check all groups have a pick (saved or pending)
    const allPicks = new Map([...savedPicks, ...pendingPicks])
    const missing: { position: string; boxNumber: number }[] = []
    for (const posGroup of positions) {
      for (const box of posGroup.boxes) {
        if (!allPicks.has(`${posGroup.position}-${box.box_number}`)) {
          missing.push({ position: posGroup.position, boxNumber: box.box_number })
        }
      }
    }

    if (missing.length > 0) {
      const el = positionRefs.current.get(missing[0].position)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (pendingPicks.size === 0) {
      // All picks were already saved
      if (userId) router.push(`/team/${userId}`)
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/roster/pick-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_ids: [...pendingPicks.values()] }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || 'Failed to submit picks')
      return
    }

    showToast('Roster saved!')
    if (userId) router.push(`/team/${userId}`)
  }, [savedPicks, pendingPicks, positions, userId, router, showToast])

  if (loading) return (
    <div className="animate-pulse" role="status">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="mb-10 sm:mb-12">
          <div className="py-3 border-b border-navy/8 flex items-baseline gap-3 mb-4">
            <div className="h-5 w-8 bg-navy/10 rounded" />
            <div className="h-3 w-20 bg-navy/10 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(2)].map((_, j) => (
              <div key={j}>
                <div className="h-2.5 w-14 bg-navy/10 rounded mb-2" />
                <div className="space-y-1.5">
                  {[...Array(4)].map((_, k) => (
                    <div key={k} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface">
                      <div className="w-11 h-11 bg-navy/10 rounded-full shrink-0" />
                      <div className="flex-1">
                        <div className="h-3.5 w-28 bg-navy/10 rounded mb-1.5" />
                        <div className="h-2.5 w-16 bg-navy/10 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // Merge saved + pending to determine state per box
  const allPicks = new Map([...savedPicks, ...pendingPicks])

  // Build list of missing groups (every group needs a pick)
  const missingGroups: { position: string; boxNumber: number }[] = []
  for (const posGroup of positions) {
    for (const box of posGroup.boxes) {
      const boxKey = `${posGroup.position}-${box.box_number}`
      if (!allPicks.has(boxKey)) {
        missingGroups.push({ position: posGroup.position, boxNumber: box.box_number })
      }
    }
  }

  // A position is fully picked when all its groups have a pick
  const positionsWithMissing = new Set(missingGroups.map(g => g.position))

  return (
    <div>
      {error && (
        <div className="mb-6 p-3 bg-error-pale border-l-3 border-crimson text-error text-sm flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(null); setLoading(true); loadPlayers() }}
            className="ml-4 px-3 py-1.5 text-sm font-medium text-crimson hover:text-crimson-light underline transition-colors focus-ring"
          >
            Retry
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-navy text-white text-sm rounded-lg shadow-lg animate-fade-in max-w-md text-center" role="status">
          {toast}
        </div>
      )}

      {POSITION_ORDER.map(pos => {
        const posGroup = positions.find(p => p.position === pos)
        if (!posGroup) return null
        const hasPickedPosition = !positionsWithMissing.has(pos)

        return (
          <div key={pos} className="mb-10 sm:mb-12" ref={el => { if (el) positionRefs.current.set(pos, el) }}>
            <div className="sticky top-0 z-10 bg-bg py-3 -mx-4 px-4 border-b border-navy/8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-lg sm:text-xl font-semibold text-crimson">{pos}</span>
                <span className="text-xs sm:text-sm text-ink-muted">{POSITION_LABELS[pos]}</span>
                {hasPickedPosition && <span className="text-success text-xs font-semibold">&#10003;</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4">
              {posGroup.boxes.sort((a, b) => a.box_number - b.box_number).map(box => {
                const boxKey = `${pos}-${box.box_number}`
                const savedPickId = savedPicks.get(boxKey)
                const pendingPickId = pendingPicks.get(boxKey)
                const hasPickFromBox = savedPickId != null || pendingPickId != null

                return (
                  <div key={box.box_number}>
                    <p className="text-[10px] uppercase tracking-widest text-ink-muted font-medium mb-2">Group {box.box_number}</p>
                    <div className="space-y-1.5">
                      {box.players.map(player => {
                        const isSaved = savedPickId === player.id
                        const isPending = pendingPickId === player.id
                        const isMyPick = isSaved || isPending
                        const canPick = !savedPickId // can't change saved picks

                        return (
                          <div key={player.id} className={hasPickFromBox && !isMyPick ? 'opacity-60' : ''}>
                            <PlayerCard
                              player={player}
                              isMyPick={isMyPick}
                              isPending={isPending}
                              canPick={canPick}
                              picking={false}
                              onPick={() => togglePlayer(player)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {userId && (
        <div className="mt-8 mb-4">
          {missingGroups.length > 0 && (
            <div className="mb-4 text-sm text-ink-secondary space-y-1">
              <p className="font-medium text-ink">Still need a pick for:</p>
              <ul className="list-none space-y-0.5">
                {missingGroups.map(({ position, boxNumber }) => (
                  <li key={`${position}-${boxNumber}`}>
                    <button
                      type="button"
                      className="text-crimson hover:underline focus-ring rounded"
                      onClick={() => {
                        const el = positionRefs.current.get(position)
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    >
                      {POSITION_LABELS[position]} ({position}) — Group {boxNumber}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all focus-ring ${
                missingGroups.length === 0
                  ? 'bg-navy text-white hover:bg-navy-light cursor-pointer'
                  : 'bg-navy/40 text-white/70 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Saving...' : 'Submit Roster'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
