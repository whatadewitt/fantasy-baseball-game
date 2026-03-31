import { Suspense } from 'react'
import TeamView from '@/components/TeamView'

export const dynamic = 'force-dynamic'

export default async function TeamPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16 pb-12">
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="mb-10">
              <div className="h-3 w-16 bg-navy/10 rounded mb-4" />
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-navy/10 rounded-full shrink-0" />
                  <div>
                    <div className="h-8 w-48 bg-navy/10 rounded mb-2" />
                    <div className="h-3 w-28 bg-navy/10 rounded" />
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="h-10 w-16 bg-navy/10 rounded mb-1" />
                  <div className="h-3 w-20 bg-navy/10 rounded" />
                </div>
              </div>
            </div>
            {['Hitters', 'Pitchers'].map(label => (
              <div key={label} className="mb-10">
                <div className="h-3 w-12 bg-navy/10 rounded mb-3" />
                <div className="scorecard bg-surface">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-navy/10">
                        <th className="px-2 sm:px-4 py-2.5 text-left"><div className="h-3 w-12 bg-navy/10 rounded" /></th>
                        {[...Array(label === 'Hitters' ? 5 : 4)].map((_, i) => (
                          <th key={i} className="px-1 sm:px-2 py-2.5"><div className="h-3 w-6 bg-navy/10 rounded mx-auto" /></th>
                        ))}
                        <th className="px-2 sm:px-4 py-2.5 text-right"><div className="h-3 w-6 bg-navy/10 rounded ml-auto" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(4)].map((_, i) => (
                        <tr key={i} className="border-b border-navy/5 last:border-b-0">
                          <td className="px-2 sm:px-4 py-2.5">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-navy/10 rounded-full shrink-0" />
                              <div>
                                <div className="h-3.5 w-24 sm:w-32 bg-navy/10 rounded mb-1.5" />
                                <div className="h-2.5 w-14 bg-navy/10 rounded" />
                              </div>
                            </div>
                          </td>
                          {[...Array(label === 'Hitters' ? 5 : 4)].map((_, j) => (
                            <td key={j} className="px-1 sm:px-2 py-2.5"><div className="h-3 w-6 bg-navy/10 rounded mx-auto" /></td>
                          ))}
                          <td className="px-2 sm:px-4 py-2.5 text-right"><div className="h-3 w-6 bg-navy/10 rounded ml-auto" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        }>
          <TeamView userId={userId} />
        </Suspense>
      </div>
    </main>
  )
}
