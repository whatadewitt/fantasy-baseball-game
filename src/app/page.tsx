import { Suspense } from 'react'
import StandingsTable from '@/components/StandingsTable'

export default function StandingsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16 pb-12">
        <div className="mb-10 reveal" style={{ '--delay': 0 } as React.CSSProperties}>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold text-navy tracking-tight">
            Season Standings
          </h1>
          <p className="text-ink-secondary mt-2 text-sm sm:text-base">Fantasy Baseball 2026</p>
        </div>
        <div className="reveal" style={{ '--delay': 1 } as React.CSSProperties}>
          <Suspense fallback={<div className="py-12 text-ink-muted text-sm">Loading standings...</div>}>
            <StandingsTable />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
