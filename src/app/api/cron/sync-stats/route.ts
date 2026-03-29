import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Call the existing sync endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/sync-stats`, {
    method: 'POST',
    headers: { 'x-api-key': process.env.ADMIN_API_KEY || '' },
  })

  const data = await res.json()

  return NextResponse.json({
    synced_at: new Date().toISOString(),
    ...data,
  })
}
