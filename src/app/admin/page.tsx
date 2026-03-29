'use client'

import { useState, useEffect } from 'react'
import AdminPlayerManager from '@/components/AdminPlayerManager'

export default function AdminPage() {
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('admin_api_key')
    if (saved) setApiKey(saved)
  }, [])

  function handleApiKeyChange(val: string) {
    setApiKey(val)
    localStorage.setItem('admin_api_key', val)
  }
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncing2025, setSyncing2025] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [sync2025Result, setSync2025Result] = useState<string | null>(null)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const file = (form.querySelector('input[type=file]') as HTMLInputElement).files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/import-players', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData,
    })
    const data = await res.json()
    setImporting(false)
    setImportResult(res.ok
      ? `✅ Imported ${data.players_imported} players: ${JSON.stringify(data.positions)}`
      : `❌ ${data.error}`
    )
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/admin/sync-stats', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
    })
    const data = await res.json()
    setSyncing(false)
    setSyncResult(res.ok
      ? `✅ Updated ${data.players_updated} players`
      : `❌ ${data.error}`
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">⚙️ Admin Panel</h1>

        <div className="mb-6">
          <label htmlFor="admin-api-key" className="block text-sm font-medium mb-1 text-gray-300">Admin API Key</label>
          <input
            id="admin-api-key"
            type="password"
            value={apiKey}
            onChange={e => handleApiKeyChange(e.target.value)}
            placeholder="Enter ADMIN_API_KEY"
            autoComplete="off"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
          />
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Import Players (CSV)</h2>
          <form onSubmit={handleImport} className="space-y-3">
            <input type="file" accept=".csv" className="text-gray-300" required />
            <button
              type="submit"
              disabled={importing}
              className="w-full bg-navy hover:bg-navy-light text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </form>
          {importResult && <p className="mt-3 text-sm">{importResult}</p>}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1">Manage Player Pool</h2>
          <p className="text-gray-400 text-sm mb-4">Assign players to draft boxes. Players with no box won&apos;t appear in the draft.</p>
          {apiKey ? (
            <AdminPlayerManager apiKey={apiKey} />
          ) : (
            <p className="text-yellow-500 text-sm">Enter your API key above to manage players.</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pull 2025 Season Stats</h2>
          <p className="text-gray-400 text-sm mb-3">Fetches 2025 season totals from MLB API for all players. Shows on player cards during draft.</p>
          <button
            onClick={async () => {
              setSyncing2025(true)
              setSync2025Result(null)
              const res = await fetch('/api/admin/sync-2025', { method: 'POST', headers: { 'x-api-key': apiKey } })
              const data = await res.json()
              setSyncing2025(false)
              setSync2025Result(res.ok
                ? `✅ Updated ${data.players_updated}/${data.players_total} players (${data.players_skipped} skipped)`
                : `❌ ${data.error}`)
            }}
            disabled={syncing2025}
            className="w-full bg-navy hover:bg-navy-light text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
          >
            {syncing2025 ? 'Pulling 2025 stats...' : 'Pull 2025 Stats'}
          </button>
          {sync2025Result && <p className="mt-3 text-sm">{sync2025Result}</p>}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Sync 2026 Stats from MLB</h2>
          <p className="text-gray-400 text-sm mb-3">Fetches today&apos;s 2026 stats from MLB API and recalculates all scores.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
          >
            {syncing ? 'Syncing...' : 'Sync Stats Now'}
          </button>
          {syncResult && <p className="mt-3 text-sm">{syncResult}</p>}
        </div>
      </div>
    </main>
  )
}
