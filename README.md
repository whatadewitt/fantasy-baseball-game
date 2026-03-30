# Rookie Fantasy Ball

A kids' fantasy baseball league app for the 2026 MLB season.

**Live at [rfb.whatadewitt.com](https://rfb.whatadewitt.com)**

## How It Works

- Sign up with your email and create a team name
- Pick one player from each position group (shared player pool — multiple teams can pick the same player)
- Watch your points accumulate as the 2026 season plays out
- Check standings to see how your team stacks up

## Scoring

| Category | Points |
|----------|--------|
| Hits, Home Runs, Runs, RBIs | 1 pt each |
| Stolen Bases | 2 pts |
| Outs Recorded, Strikeouts (pitchers) | 1 pt each |
| Wins | 4 pts |
| Saves | 5 pts |

## Tech Stack

- **Framework:** Next.js 16.2, React 19
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres + Realtime)
- **Auth:** Magic link emails via Resend
- **Hosting:** Vercel

## Local Development

```bash
npm install
npm run dev
```

Requires a `.env.local` with Supabase, Resend, and JWT credentials. See `CLAUDE.md` for the full list of required environment variables.
