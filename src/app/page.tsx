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
          <p className="text-ink-secondary mt-2 text-sm sm:text-base">Rookie Fantasy Ball 2026</p>
        </div>
        <div className="reveal" style={{ '--delay': 1 } as React.CSSProperties}>
          <Suspense fallback={
            <div className="scorecard bg-surface overflow-x-auto animate-pulse">
              <table className="w-full min-w-[340px]">
                <thead>
                  <tr className="border-b-2 border-navy/10 text-xs uppercase tracking-widest text-ink-muted">
                    <th className="px-3 sm:px-4 py-3 text-left w-10 font-medium">#</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-medium">Team</th>
                    <th className="px-3 sm:px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-navy/5 last:border-b-0">
                      <td className="px-3 sm:px-4 py-3"><div className="h-4 w-4 bg-navy/10 rounded" /></td>
                      <td className="px-3 sm:px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-7 h-7 bg-navy/10 rounded-full shrink-0" /><div className="h-4 bg-navy/10 rounded w-28 sm:w-36" /></div></td>
                      <td className="px-3 sm:px-4 py-3 text-right"><div className="h-4 w-8 bg-navy/10 rounded ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }>
            <StandingsTable />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
