@AGENTS.md

# Rookie Fantasy Ball

Kids' fantasy baseball league app for the 2026 MLB season.

## Tech Stack
- Next.js 16.2, React 19, Tailwind CSS 4
- Supabase (Postgres + Realtime)
- Resend (email delivery from noreply@whatadewitt.com)
- Deploying to Vercel

## Key Architecture Decisions
- Shared player pool (multiple teams can pick same player)
- One pick per position GROUP (not per position — each position has multiple groups)
- Batch roster submission (local selection, single POST)
- Magic link auth (no passwords) — same email can have multiple teams
- 2025 stats on pick page (sentinel date 2025-12-31), 2026 stats for scoring
- stat_group column handles two-way players (Ohtani)
- Standings calculate fresh from player_stats (same as team page)
- Admin page restricted server-side via ADMIN_USER_ID env var

## Environment Variables
See .env.local for required vars. ADMIN_USER_ID must NOT be NEXT_PUBLIC_.

## Important Files
- `src/lib/scoring.ts` — Point calculation formulas
- `src/lib/auth.ts` — getCurrentUser reads cookie, generateToken for magic links
- `src/lib/supabase.ts` — Client (anon for Realtime) and service client (for API routes)
- `supabase/migrations/` — Database schema and migrations
- `TODO.md` — Feature checklist and status
