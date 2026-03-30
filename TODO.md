# Kids Fantasy Baseball - Implementation Checklist

## PHASE 0: MANUAL SETUP (You Do This First)

- [ ] **🔧 Create Supabase project**
  - Go to supabase.com, create free project
  - Save project URL and anon/service role keys
  - Add to `.env.local`
  
- [ ] **🔧 Create GitHub repo** (optional but recommended for Vercel deploy)
  - Initialize repo, push to GitHub

- [ ] **🔧 Create Vercel project** (optional, for easy deployment)
  - Connect GitHub repo
  - Add env vars (Supabase keys, MLB API endpoint)

- [ ] **📊 Prepare FanGraphs exports**
  - Export top 12 at each position + DH (C, 1B, 2B, 3B, SS, 36-48 OF, 2 DH)
  - Export top 18-32 SP and 24 RP
  - Save as CSV files with columns: Player Name, MLB ID, Position, Team
  - Keep these files handy for import step below

---

## PHASE 1: DATABASE SETUP (Claude Code)

- [ ] Run `npx supabase init` locally (if using local Supabase dev mode)
  - OR just create tables directly in Supabase dashboard
  
- [ ] **Create tables in Supabase**:
  - `players` table (mlb_id, name, position, position_box, team, image_url)
  - `users` table (email, team_name, created_at)
  - `rosters` table (user_id, player_id, position, picked_at, swapped_out)
  - `player_stats` table (mlb_id, date, hits, runs, rbis, sb, k, w, sv, qs)
  - `scores` table (user_id, player_id, date, hitter_points, pitcher_points, total_points)
  - `season_config` table (season_year, all_star_break_date, selection dates)

- [ ] Set up Row-Level Security (RLS) policies:
  - Users can only view/edit their own roster
  - Public read on standings and team pages
  - Admin/service role can write stats

- [ ] Create database indexes on:
  - `players(position, position_box)` for fast box queries
  - `rosters(user_id)` for roster lookups
  - `player_stats(mlb_id, date)` for stat queries

---

## PHASE 2: CORE FUNCTIONALITY (Claude Code)

- [ ] **Set up Next.js project structure**
  - `/app` directory structure (pages, api routes)
  - Tailwind CSS configured
  - Supabase client initialized

- [ ] **Implement auth system**
  - `POST /api/auth/signup` — Create user with email, generate token, send email
  - `POST /api/auth/verify` — Verify token, create session
  - `GET /api/auth/me` — Return current user
  - Create email template (simple text-based link)
  - Middleware to check auth on protected routes

- [ ] **Implement player pool system**
  - `GET /api/players/boxes` — Return all positions with available players grouped by box
  - Add real-time filtering (hide claimed players)
  - Include player image URLs from MLB or placeholder

- [x] **Implement roster selection**
  - `POST /api/roster/pick` — Validate position+box availability, add to roster, broadcast via Realtime
  - `GET /api/roster/:userId` — Return user's current roster with live stats
  - Multiple teams can pick the same player (no exclusive claims)
  - Prevent duplicate position+box picks per user (DB constraint)
  - Track pick order/timestamp

- [ ] **Implement scoring engine**
  - Function to calculate hitter_points: hits(1) + runs(1) + rbis(1) + sb(2)
  - Function to calculate pitcher_points: k(1) + wins(4) + saves(5) + qs(3)
  - Store daily scores in `scores` table
  - Aggregate for season totals

- [ ] **Implement standings**
  - `GET /api/standings` — Return all users ranked by total season points
  - Sort by points desc, tiebreaker by signup date
  - Include team name, player count, current score

- [ ] **Implement team view page**
  - `GET /api/team/:userId` — Return full roster with stats breakdown by position
  - Show hitter vs pitcher score split
  - Display last updated timestamp

- [ ] **Implement roster swap**
  - `POST /api/roster/swap` — Only available after All-Star break date
  - Allow swapping exactly 1 hitter + 1 pitcher
  - Validate availability of new players
  - Log swap in `rosters.swapped_at` and `swapped_out`
  - `POST /api/roster/swap-modal` — Return list of available hitters/pitchers for user to pick from

---

## PHASE 3: PAGES & UI (Claude Code)

- [ ] **Create `/` (Standings page)**
  - Fetch standings, display leaderboard
  - Link to team pages
  - Show last updated time for stats
  - Mobile responsive

- [ ] **Create `/signup` (Registration page)**
  - Email input form
  - Team name input
  - Submit button, show "check your email" message
  - Simple clean UI

- [ ] **Create `/select` (Player selection page)**
  - Show all position boxes
  - Real-time availability (Supabase Realtime)
  - Click player → adds to roster
  - Show user's current roster as they pick
  - Disable boxes when user has picked from them
  - Success message when all positions filled
  - Redirect to `/team/[userId]` when done

- [ ] **Create `/team/[userId]` (Team detail page)**
  - Show team name, owner email (first letter hidden)
  - Display roster by position
  - Show stats for each player (H/R/RBI/SB for hitters, K/W/SV/QS for pitchers)
  - Display team total score
  - Show "Swap Players" button (only after All-Star break)
  - Show last stat update time

- [ ] **Create swap modal component**
  - Shows current hitter/pitcher options for swap
  - Dropdown to select replacement
  - Confirm button
  - Show success message

---

## PHASE 4: STATS INTEGRATION (Claude Code)

- [ ] **Create MLB stats sync function**
  - `POST /api/admin/sync-stats` (manual trigger for now)
  - Query all active player MLB IDs
  - Fetch stats from MLB statsapi.mlb.com for today/yesterday
  - Parse response (handle different player types: hitter vs pitcher)
  - Upsert into `player_stats` table (date as key)
  - Recalculate all user scores for affected players
  - Return summary (X players updated, Y scores recalculated)

- [ ] **Create player image fetching**
  - Query MLB API for headshot URLs
  - Store in `players.image_url`
  - Fallback to generic player icon if not found

- [ ] **Set up scheduled stats sync** (Vercel Cron or external scheduler)
  - Run nightly at 11 PM ET (or after games end)
  - Call the sync function automatically
  - Log results for admin visibility

---

## PHASE 5: PLAYER IMPORT & ADMIN TOOLS (Claude Code)

- [ ] **Create player import endpoint**
  - `POST /api/admin/import-players` — Accepts CSV file upload
  - Parse CSV (name, mlb_id, position, team)
  - Validate MLB IDs exist in MLB API
  - Group players by position
  - Assign to position boxes (6 per box, with logic for larger pools like OF)
  - Insert into `players` table
  - Return summary (X players loaded, Y boxes created)

- [ ] **Create admin import page** (simple form)
  - File upload input
  - Display import results
  - Show player pool summary (X players in Y boxes)
  - One-time use (or allow re-import with clear warning)

- [ ] **Create admin league status page**
  - Show signup count / selected count
  - Show all position boxes and claimed players
  - Show stat sync status
  - Link to manually trigger sync

---

## PHASE 6: POLISH & TESTING (Claude Code)

- [ ] **Set up Supabase Realtime**
  - Subscribe to `players` table changes on `/select` page
  - Show live availability updates as kids pick
  - Show real-time score updates on standings/team pages

- [ ] **Error handling**
  - Duplicate pick attempts → show error, don't insert
  - Invalid email → form validation
  - Network errors during stats sync → log and retry
  - Missing MLB ID in stats → skip silently, log

- [ ] **Email templates**
  - Signup confirmation with verification link
  - Welcome email with link to team page
  - (Optional) Daily score update emails

- [ ] **Testing checklist**
  - Sign up 2+ test users, verify emails work
  - Test pick flow: claim players, see availability update in realtime
  - Test swap: change date to post-ASB, verify swap button appears
  - Test stats sync: manually add test stats, verify scores calculate correctly
  - Test leaderboard: verify rankings update as scores change
  - Test on mobile
  - Load test: simulate 30 concurrent users picking

- [ ] **Security audit**
  - RLS policies prevent cross-user data access
  - Email verification required before roster access
  - Swap only available post-ASB (check season_config.all_star_break_date)
  - Admin endpoints require auth (add simple API key check)

---

## PHASE 7: LAUNCH PREP (You Do This)

- [ ] **🔧 Prepare player data**
  - Export FanGraphs CSVs (position groups + pitcher groups)
  - Test import with small subset (6-12 players)
  - Full import once confirmed working

- [ ] **🔧 Set All-Star break date in Supabase**
  - Update `season_config.all_star_break_date`
  - Set selection open/close dates

- [ ] **🔧 Test signup flow as a parent/kid**
  - Sign up with real email
  - Verify email delivery (might go to spam!)
  - Go through full selection flow
  - Verify stats update the next day

- [ ] **🔧 Share links with kids**
  - Send signup link (yoursite.com/signup)
  - Set deadline for selection
  - Provide link to standings (yoursite.com)

- [ ] **🔧 Monitor first week**
  - Check that stats sync is working (watch /api/admin/league-status)
  - Manually trigger sync if not auto-running
  - Fix any data issues (bad MLB IDs, missing stats)
  - Watch for spam/duplicate accounts, block as needed

---

## PHASE 8: ONGOING (You Do This)

- [ ] **Daily**: Check standings, watch for stat sync completion
- [ ] **Weekly**: Send optional recap email (top scorer, biggest moves)
- [ ] **All-Star break**: Announce swap period is open
- [ ] **End of season**: Declare winner, reset for next year

---

## Claude Code Entry Point

When you're ready, give Claude Code this repo structure + CLAUDE.md + this TODO, and point it to:
1. Start with PHASE 1 (database tables)
2. Move through PHASES 2-6 in order
3. Test each phase before moving to next
4. Report blockers or clarifications needed

You'll handle PHASE 0 (Supabase setup, FanGraphs export) and PHASE 7 (launch prep).

---

## Notes & Tips

- **Email delivery**: Check spam folders, add your domain to sender list if deploying
- **MLB stats lag**: Games usually final by 11 PM ET, so schedule sync for midnight ET
- **Position box sizing**: OK to have 5-7 per box instead of exactly 6, just be consistent
- **Kids signing up**: Have them use their parent's email if under 13 (email verification step ensures adult)
- **Realtime tips**: Keep subscriptions scoped (only subscribe to visible players, not all 200+)
- **Images**: MLB API headshots sometimes 404; fallback to generic player icon gracefully

---

## Up Next: Email Setup (You Do This)

- [ ] **Set up Resend for email delivery**
  1. Sign up at resend.com (free tier: 100 emails/day)
  2. Add your domain in Resend dashboard → Domains
  3. Add the DNS records Resend gives you (DKIM, SPF) at your registrar
  4. Wait for domain verification (usually a few minutes)
  5. Create API key in Resend → API Keys
  6. Add `RESEND_API_KEY=re_xxxxx` to `.env.local`
  7. Tell Claude Code your "from" address (e.g. `noreply@yourdomain.com`)
  8. Claude Code will wire up email sending in the signup route

---

## Done (Polish)

- [x] **Shared player pool** — Removed exclusive player claiming. Multiple teams can now pick the same player. Only restriction is one pick per position+box per user.
- [x] **Favicon** — Replaced default Next.js favicon with baseball cap SVG (`src/app/icon.svg`)
- [x] **Luke TODOs** — Better cap SVG, "My Team" nav ordering, hide emails/show names on team page
- [x] **Batch roster submission** — Players selected locally, submitted all at once. Shows missing groups, scrolls to them.
- [x] **Nav polish** — "Pick Players" hidden when not logged in or roster complete. Added logout link.
- [x] **2025 vs 2026 stats** — Pick page shows 2025 stats, team page/scoring uses 2026 only. "No 2025 MLB data" for missing players.
- [x] **Two-way player support** — Added `stat_group` column to handle Ohtani-type players correctly across hitting/pitching.
- [x] **Consistent scoring** — Standings now calculate fresh from `player_stats` (same as team page) instead of stale `scores` table.
- [x] **Removed dummy teams** — SQL to clean up users with no roster.
