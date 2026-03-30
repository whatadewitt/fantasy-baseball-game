'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TeamLink {
  team_name: string
  verify_url: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [debugTeams, setDebugTeams] = useState<TeamLink[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user?.id) router.replace(`/team/${data.user.id}`) })
      .catch(() => {})
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    setSubmitted(true)
    if (data.debug_teams) {
      setDebugTeams(data.debug_teams)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full reveal">
          <div className="scorecard bg-surface p-8 text-center">
            <p className="font-display text-2xl font-semibold text-navy mb-2">Check your email</p>
            <p className="text-ink-secondary text-sm">We sent a login link to <strong className="break-all text-ink">{email}</strong></p>
            {debugTeams.length > 0 && (
              <div className="mt-6 p-3 bg-warning-pale border-l-3 border-gold text-sm text-left space-y-2">
                <p className="font-medium text-ink">Dev mode</p>
                {debugTeams.map(t => (
                  <div key={t.verify_url}>
                    <p className="text-ink-secondary text-xs mb-0.5">{t.team_name}</p>
                    <a href={t.verify_url} className="text-crimson break-all underline text-xs focus-ring">{t.verify_url}</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        <div className="mb-8 reveal" style={{ '--delay': 0 } as React.CSSProperties}>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy tracking-tight">Log in</h1>
          <p className="text-ink-secondary mt-2 text-sm">We&rsquo;ll send a link to your email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 reveal" style={{ '--delay': 1 } as React.CSSProperties} noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs uppercase tracking-widest text-ink-muted font-medium mb-2">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'login-error' : undefined}
              className="w-full border-b-2 border-navy/15 bg-transparent px-0 py-3 text-base text-ink placeholder:text-ink-muted/50 focus:border-crimson focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div id="login-error" role="alert" className="text-error text-sm p-3 bg-error-pale border-l-3 border-crimson">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-medium py-3 rounded-lg hover:bg-navy-light disabled:opacity-50 transition-colors focus-ring cursor-pointer"
          >
            {loading ? 'Sending link...' : 'Send login link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted reveal" style={{ '--delay': 2 } as React.CSSProperties}>
          Don&rsquo;t have an account? <Link href="/signup" className="text-crimson hover:underline focus-ring rounded">Sign up</Link>
        </p>
      </div>
    </main>
  )
}
