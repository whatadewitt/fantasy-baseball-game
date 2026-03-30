import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: authToken, error } = await supabase
    .from('auth_tokens')
    .select('*, users(*)')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !authToken) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Mark token as used
  await supabase
    .from('auth_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', authToken.id)

  // Check if user has a roster — redirect to team page if so, otherwise selection
  const { data: roster } = await supabase
    .from('rosters')
    .select('id')
    .eq('user_id', authToken.user_id)
    .limit(1)

  const destination = roster && roster.length > 0
    ? `/team/${authToken.user_id}`
    : '/select'

  const response = NextResponse.redirect(new URL(destination, req.url))
  response.cookies.set('user_id', authToken.user_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return response
}
