'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [debugUrl, setDebugUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, team_name: teamName }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    setSubmitted(true)
    if (data.debug_verify_url) {
      setDebugUrl(data.debug_verify_url)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full reveal">
          <div className="scorecard bg-surface p-8 text-center">
            <p className="font-display text-2xl font-semibold text-navy mb-2">Check your email</p>
            <p className="text-ink-secondary text-sm">We sent a login link to <strong className="break-all text-ink">{email}</strong></p>
            {debugUrl && (
              <div className="mt-6 p-3 bg-warning-pale border-l-3 border-gold text-sm text-left">
                <p className="font-medium text-ink mb-1">Dev mode</p>
                <a href={debugUrl} className="text-crimson break-all underline focus-ring">{debugUrl}</a>
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
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy tracking-tight">Join the league</h1>
          <p className="text-ink-secondary mt-2 text-sm">Sign up to pick your team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 reveal" style={{ '--delay': 1 } as React.CSSProperties} noValidate>
          <div>
            <label htmlFor="signup-email" className="block text-xs uppercase tracking-widest text-ink-muted font-medium mb-2">Email</label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'signup-error' : undefined}
              className="w-full border-b-2 border-navy/15 bg-transparent px-0 py-3 text-base text-ink placeholder:text-ink-muted/50 focus:border-crimson focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="signup-name" className="block text-xs uppercase tracking-widest text-ink-muted font-medium mb-2">Your Name</label>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jamie"
              maxLength={50}
              className="w-full border-b-2 border-navy/15 bg-transparent px-0 py-3 text-base text-ink placeholder:text-ink-muted/50 focus:border-crimson focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="signup-team" className="block text-xs uppercase tracking-widest text-ink-muted font-medium mb-2">Team Name</label>
            <input
              id="signup-team"
              type="text"
              required
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="The Sluggers"
              maxLength={40}
              aria-describedby="team-name-hint"
              className="w-full border-b-2 border-navy/15 bg-transparent px-0 py-3 text-base text-ink placeholder:text-ink-muted/50 focus:border-crimson focus:outline-none transition-colors"
            />
            <p id="team-name-hint" className="text-xs text-ink-muted mt-1.5">Up to 40 characters</p>
          </div>

          {error && (
            <div id="signup-error" role="alert" className="text-error text-sm p-3 bg-error-pale border-l-3 border-crimson">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-medium py-3 rounded-lg hover:bg-navy-light disabled:opacity-50 transition-colors focus-ring"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  )
}
