'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  team: string
  image_url: string | null
  headshot_url: string | null
  claimed: boolean
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
  const [positions, setPositions] = useState<PositionGroup[]>([])
  const [myRoster, setMyRoster] = useState<Set<string>>(new Set())
  const [pickedBoxes, setPickedBoxes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
          const rosterRes = await fetch(`/api/roster/${meData.user.id}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            const myPlayerIds = new Set<string>((rosterData.roster || []).map((r: { player_id: string }) => r.player_id))
            setMyRoster(myPlayerIds)

            const picked = new Set<string>()
            for (const r of rosterData.roster || []) {
              picked.add(`${r.players?.position}-${r.players?.position_box}`)
            }
            setPickedBoxes(picked)
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

  const pickPlayer = useCallback(async (playerId: string) => {
    setPicking(playerId)
    setError(null)

    const res = await fetch('/api/roster/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })

    const data = await res.json()
    setPicking(null)

    if (!res.ok) {
      setError(data.error || 'Failed to pick player')
      return
    }

    await loadPlayers()
  }, [loadPlayers])

  const pickCallbacksRef = useRef<Map<string, () => void>>(new Map())
  const getPickCallback = useCallback((playerId: string) => {
    let cb = pickCallbacksRef.current.get(playerId)
    if (!cb) {
      cb = () => pickPlayer(playerId)
      pickCallbacksRef.current.set(playerId, cb)
    }
    return cb
  }, [pickPlayer])

  if (loading) return <div className="py-12 text-ink-muted text-sm" role="status">Loading players...</div>

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

      {POSITION_ORDER.map(pos => {
        const posGroup = positions.find(p => p.position === pos)
        if (!posGroup) return null

        return (
          <div key={pos} className="mb-10 sm:mb-12">
            <div className="sticky top-0 z-10 bg-bg py-3 -mx-4 px-4 border-b border-navy/8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-lg sm:text-xl font-semibold text-crimson">{pos}</span>
                <span className="text-xs sm:text-sm text-ink-muted">{POSITION_LABELS[pos]}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4">
              {posGroup.boxes.sort((a, b) => a.box_number - b.box_number).map(box => {
                const boxKey = `${pos}-${box.box_number}`
                const hasPickedFromBox = pickedBoxes.has(boxKey)

                return (
                  <div key={box.box_number} className={`${hasPickedFromBox ? 'opacity-60' : ''}`}>
                    <p className="text-[10px] uppercase tracking-widest text-ink-muted font-medium mb-2">Group {box.box_number}</p>
                    <div className="space-y-1.5">
                      {box.players.map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          isMyPick={myRoster.has(player.id)}
                          canPick={!hasPickedFromBox && !player.claimed}
                          picking={picking === player.id}
                          onPick={getPickCallback(player.id)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
