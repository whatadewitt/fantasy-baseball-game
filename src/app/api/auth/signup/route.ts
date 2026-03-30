import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { containsProfanity } from '@/lib/profanity'
import { Resend } from 'resend'

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

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`

  // Send email
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: emailError } = await resend.emails.send({
      from: 'Rookie Fantasy Ball <noreply@whatadewitt.com>',
      to: normalizedEmail,
      subject: `Welcome to Rookie Fantasy Ball, ${name}!`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; color: #1a2744; margin-bottom: 8px;">Welcome to the league!</h1>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            Your team <strong>${team_name}</strong> has been created. Click the link below to log in and pick your players.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background: #1a2744; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0;">
            Pick Your Team →
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 24px;">This link expires in 24 hours.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Failed to send signup email:', emailError)
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Check your email for a login link',
    // Show debug URL only when Resend is not configured
    ...(!process.env.RESEND_API_KEY && { debug_verify_url: verifyUrl }),
  })
}
