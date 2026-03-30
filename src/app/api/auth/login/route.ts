import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateToken } from '@/lib/auth'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const supabase = createServiceClient()

  // Find all teams for this email
  const { data: users, error } = await supabase
    .from('users')
    .select('id, team_name')
    .eq('email', normalizedEmail)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
  }

  // Generate a token for each team
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const teams: { team_name: string; verify_url: string }[] = []

  for (const user of users) {
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('auth_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    })

    teams.push({
      team_name: user.team_name,
      verify_url: `${appUrl}/api/auth/verify?token=${token}`,
    })
  }

  // Send email
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const teamLinksHtml = teams.map(t => `
      <a href="${t.verify_url}" style="display: block; background: #1a2744; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0; text-align: center;">
        Log in as ${t.team_name} →
      </a>
    `).join('')

    const { error: emailError } = await resend.emails.send({
      from: 'Rookie Fantasy Ball <noreply@whatadewitt.com>',
      to: normalizedEmail,
      subject: `Your Rookie Fantasy Ball login link`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; color: #1a2744; margin-bottom: 8px;">Log in to Rookie Fantasy Ball</h1>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            ${teams.length === 1
              ? 'Click below to log in to your team.'
              : `You have ${teams.length} teams. Choose which one to log in to:`
            }
          </p>
          ${teamLinksHtml}
          <p style="color: #999; font-size: 13px; margin-top: 24px;">These links expire in 24 hours.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Failed to send login email:', emailError)
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Check your email for a login link',
    // Show debug URLs only when Resend is not configured
    ...(!process.env.RESEND_API_KEY && { debug_teams: teams }),
  })
}
