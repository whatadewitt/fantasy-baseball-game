'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NavLinks() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [hasRoster, setHasRoster] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user?.id) {
          setUserId(data.user.id)
          fetch(`/api/roster/${data.user.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(rosterData => {
              if (rosterData?.roster?.length > 0) setHasRoster(true)
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex gap-1 text-sm font-medium">
      <Link href="/" className="px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus-ring-invert">Standings</Link>
      {userId && (
        <Link href={`/team/${userId}`} className="px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus-ring-invert">My Team</Link>
      )}
      <Link href="/rules" className="px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus-ring-invert">Rules</Link>
      {!userId && (
        <Link href="/login" className="px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus-ring-invert">Log In</Link>
      )}
      {!userId && (
        <Link href="/signup" className="px-3 py-2 rounded-lg bg-crimson hover:bg-crimson-light text-white transition-colors focus-ring-invert">Sign Up</Link>
      )}
      {userId && !hasRoster && (
        <Link href="/select" className="px-3 py-2 rounded-lg bg-crimson hover:bg-crimson-light text-white transition-colors focus-ring-invert">Pick Players</Link>
      )}
      {userId && (
        <button
          type="button"
          onClick={() => {
            fetch('/api/auth/logout', { method: 'POST' })
              .then(() => { setUserId(null); setHasRoster(false); router.push('/'); router.refresh() })
          }}
          className="px-3 py-2 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer focus-ring-invert"
        >
          Log Out
        </button>
      )}
    </div>
  )
}
