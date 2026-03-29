import { Suspense } from 'react'
import TeamView from '@/components/TeamView'

export default async function TeamPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-16 pb-12">
        <Suspense fallback={<div className="py-12 text-ink-muted text-sm">Loading team...</div>}>
          <TeamView userId={userId} />
        </Suspense>
      </div>
    </main>
  )
}
