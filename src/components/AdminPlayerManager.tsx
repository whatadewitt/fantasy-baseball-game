'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'SP', 'RP']

const BOX_SIZE = 6

function maxBoxesForPosition(players: { position: string }[], position: string) {
  const count = players.filter(p => p.position === position).length
  return Math.max(Math.ceil(count / BOX_SIZE), 1)
}

interface Player {
  id: string
  mlb_id: number
  name: string
  position: string
  position_box: number | null
  team: string
}

interface Props {
  apiKey: string
}

export default function AdminPlayerManager({ apiKey }: Props) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('C')
  const [saving, setSaving] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [search, setSearch] = useState('')

  const loadPlayers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/players', { headers: { 'x-api-key': apiKey } })
    const data = await res.json()
    setPlayers(data.players || [])
    setLoading(false)
  }, [apiKey])

  useEffect(() => { loadPlayers() }, [loadPlayers])

  async function duplicatePlayer(player: Player, asPosition: string) {
    setSaving(player.id)
    const res = await fetch('/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        mlb_id: player.mlb_id,
        name: player.name,
        team: player.team,
        position: asPosition,
        position_box: null,
      }),
    })
    const data = await res.json()
    if (data.player) setPlayers(prev => [...prev, data.player])
    setSaving(null)
  }

  async function updatePlayer(id: string, field: 'position' | 'position_box', value: string | number | null) {
    setSaving(id)
    await fetch('/api/admin/players', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ id, [field]: value }),
    })
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setSaving(null)
  }

  const searchTerm = search.toLowerCase().trim()

  const tabPlayers = useMemo(() => players
    .filter(p => searchTerm
      ? p.name.toLowerCase().includes(searchTerm) || p.team.toLowerCase().includes(searchTerm)
      : p.position === activeTab)
    .filter(p => {
      if (filter === 'assigned') return p.position_box !== null
      if (filter === 'unassigned') return p.position_box === null
      return true
    })
    .sort((a, b) => {
      if (a.position_box === null && b.position_box !== null) return 1
      if (a.position_box !== null && b.position_box === null) return -1
      if (a.position_box !== b.position_box) return (a.position_box ?? 99) - (b.position_box ?? 99)
      return a.name.localeCompare(b.name)
    }), [players, searchTerm, activeTab, filter])

  const { countsByPosition, assignedByPosition } = useMemo(() => {
    const counts: Record<string, number> = {}
    const assigned: Record<string, number> = {}
    for (const pos of POSITIONS) { counts[pos] = 0; assigned[pos] = 0 }
    for (const p of players) {
      counts[p.position] = (counts[p.position] || 0) + 1
      if (p.position_box !== null) assigned[p.position] = (assigned[p.position] || 0) + 1
    }
    return { countsByPosition: counts, assignedByPosition: assigned }
  }, [players])

  const boxSummary = useMemo(() => {
    const summary: Record<number, number> = {}
    for (const p of players) {
      if (p.position === activeTab && p.position_box !== null) {
        summary[p.position_box] = (summary[p.position_box] || 0) + 1
      }
    }
    return summary
  }, [players, activeTab])

  if (loading) return <div className="text-gray-400 py-4">Loading players...</div>

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="admin-player-search" className="sr-only">Search players</label>
        <input
          id="admin-player-search"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by player name or team..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-3 text-white placeholder-gray-400 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
        />
      </div>

      <div role="tablist" aria-label="Position filter" className={`flex flex-wrap gap-1 mb-4 ${searchTerm ? 'opacity-40' : ''}`}>
        {POSITIONS.map(pos => (
          <button
            key={pos}
            role="tab"
            aria-selected={activeTab === pos}
            disabled={!!searchTerm}
            onClick={() => setActiveTab(pos)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:cursor-not-allowed ${
              activeTab === pos
                ? 'bg-navy text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {pos}
            <span className="ml-1 text-xs opacity-70">
              {assignedByPosition[pos]}/{countsByPosition[pos]}
            </span>
          </button>
        ))}
      </div>

      {Object.keys(boxSummary).length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(boxSummary).sort(([a], [b]) => Number(a) - Number(b)).map(([box, count]) => (
            <span key={box} className="px-2 py-1 bg-gray-700 rounded-lg text-xs text-gray-300">
              Box {box}: {count} players
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4" role="group" aria-label="Assignment filter">
        {(['all', 'assigned', 'unassigned'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson ${
              filter === f ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-gray-500 text-xs ml-auto self-center" aria-live="polite">{tabPlayers.length} players</span>
      </div>

      <div className="rounded-xl overflow-x-auto border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-4 py-2 text-left" scope="col">Player</th>
              <th className="px-3 py-2 text-left" scope="col">Team</th>
              <th className="px-3 py-2 text-left" scope="col">Position</th>
              <th className="px-3 py-2 text-left" scope="col">Box</th>
              <th className="px-3 py-2 text-center w-16" scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {tabPlayers.map((player, i) => (
              <tr key={player.id} className={i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/60'}>
                <td className="px-4 py-2 font-medium text-white">{player.name}</td>
                <td className="px-3 py-2 text-gray-400">{player.team}</td>
                <td className="px-3 py-2">
                  <select
                    value={player.position}
                    onChange={e => updatePlayer(player.id, 'position', e.target.value)}
                    aria-label={`Position for ${player.name}`}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-xs"
                  >
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={player.position_box ?? ''}
                    onChange={e => updatePlayer(player.id, 'position_box', e.target.value === '' ? null : parseInt(e.target.value))}
                    aria-label={`Box assignment for ${player.name}`}
                    className={`bg-gray-700 border rounded-lg px-2 py-1 text-xs ${
                      player.position_box === null
                        ? 'border-yellow-600 text-yellow-400'
                        : 'border-gray-600 text-white'
                    }`}
                  >
                    <option value="">— No box —</option>
                    {Array.from({ length: maxBoxesForPosition(players, player.position) }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>Box {n}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  {saving === player.id
                    ? <span className="text-crimson-light text-xs">saving...</span>
                    : <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) duplicatePlayer(player, e.target.value); e.target.value = '' }}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-1 py-0.5 text-gray-400 text-xs"
                        aria-label={`Duplicate ${player.name} as another position`}
                      >
                        <option value="">+ pos</option>
                        {POSITIONS.filter(p => p !== player.position).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                  }
                </td>
              </tr>
            ))}
            {tabPlayers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No {activeTab} players imported yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
