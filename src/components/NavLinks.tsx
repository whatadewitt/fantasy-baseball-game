'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function NavLinks() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user?.id) setUserId(data.user.id) })
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
        <Link href="/signup" className="px-3 py-2 rounded-lg text-white/80 hover:text-white transition-colors focus-ring-invert">Sign Up</Link>
      )}
      <Link href="/select" className="px-3 py-2 rounded-lg bg-crimson hover:bg-crimson-light text-white transition-colors focus-ring-invert">Pick Players</Link>
    </div>
  )
}
