// Run with: npx tsx scripts/seed-standings.ts
// Inserts dummy teams with fake scores so you can preview the standings UI.
// Safe to run multiple times — uses unique emails.

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEAMS = [
  { team_name: 'The Sluggers', email: 'demo-sluggers@test.com', points: 247 },
  { team_name: 'Fastball Frenzy', email: 'demo-fastball@test.com', points: 231 },
  { team_name: 'Diamond Dogs', email: 'demo-diamond@test.com', points: 198 },
  { team_name: 'Steal City', email: 'demo-steal@test.com', points: 185 },
  { team_name: 'Mound Monsters', email: 'demo-mound@test.com', points: 172 },
  { team_name: 'Rally Caps', email: 'demo-rally@test.com', points: 156 },
  { team_name: 'Grand Slammers', email: 'demo-grand@test.com', points: 143 },
  { team_name: 'Curve Ballers', email: 'demo-curve@test.com', points: 128 },
]

async function seed() {
  console.log('Seeding dummy standings data...\n')

  for (const team of TEAMS) {
    // Create user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .upsert({ email: team.email, team_name: team.team_name }, { onConflict: 'email' })
      .select('id')
      .single()

    if (userErr) {
      console.error(`  ✗ ${team.team_name}: ${userErr.message}`)
      continue
    }

    // Insert scores across a few dates to simulate a season start
    const dates = ['2026-03-27', '2026-03-28', '2026-03-29']
    const perDay = Math.round(team.points / dates.length)

    for (let i = 0; i < dates.length; i++) {
      const dayPts = i === dates.length - 1
        ? team.points - perDay * (dates.length - 1)  // remainder on last day
        : perDay

      await supabase.from('scores').upsert({
        user_id: user.id,
        player_id: user.id, // dummy player_id, just for display
        date: dates[i],
        hitter_points: Math.round(dayPts * 0.6),
        pitcher_points: Math.round(dayPts * 0.4),
        total_points: dayPts,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,player_id,date' })
    }

    console.log(`  ✓ ${team.team_name} — ${team.points} pts`)
  }

  console.log('\nDone! Check your standings page.')
}

seed().catch(console.error)
