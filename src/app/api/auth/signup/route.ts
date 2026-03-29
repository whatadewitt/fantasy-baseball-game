import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { containsProfanity } from '@/lib/profanity'

export async function POST(req: NextRequest) {
  const { email, name, team_name } = await req.json()

  if (!email || !name || !team_name) {
    return NextResponse.json({ error: 'Email, name, and team name required' }, { status: 400 })
  }

  const SIGNUP_DEADLINE = '2026-04-21'
  if (new Date().toISOString().split('T')[0] > SIGNUP_DEADLINE) {
    return NextResponse.json({ error: 'Sign-ups are closed for the 2026 season' }, { status: 403 })
  }

  if (containsProfanity(name) || containsProfanity(team_name)) {
    return NextResponse.json({ error: 'Please choose a more appropriate name' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const supabase = createServiceClient()

  // Always create a new team — same email can have multiple teams
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ email: normalizedEmail, name: name.trim(), team_name })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const userId = newUser.id

  // Create auth token (expires in 24 hours)
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('auth_tokens').insert({
    user_id: userId,
    token,
    expires_at: expiresAt,
  })

  // In production, email the token. For now, return it directly.
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`

  return NextResponse.json({
    success: true,
    message: 'Check your email for a login link',
    // Remove this in production:
    debug_verify_url: verifyUrl
  })
}
