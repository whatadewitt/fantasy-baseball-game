import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getCapColors, getCapFont, getTeamInitial, AVATAR_VERSION } from '@/lib/cap-colors'

export const dynamic = 'force-dynamic'

const svgCache = new Map<string, string>()
let cacheVersion = 0

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  // Use ?name= query param if provided (avoids DB call), otherwise look up
  const nameParam = req.nextUrl.searchParams.get('name')
  let teamName: string = nameParam || ''

  if (!teamName) {
    const supabase = createServiceClient()
    const { data: user } = await supabase
      .from('users')
      .select('team_name')
      .eq('id', teamId)
      .single()
    teamName = user?.team_name || 'T'
  }
  if (cacheVersion !== AVATAR_VERSION) {
    svgCache.clear()
    cacheVersion = AVATAR_VERSION
  }
  const cacheKey = `${teamId}:${teamName}`
  const cached = svgCache.get(cacheKey)
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  const colors = getCapColors(teamId, teamName)
  const font = getCapFont(teamId, teamName)
  const initial = getTeamInitial(teamName)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="128" height="128">
  <!-- Brim -->
  <path d="M878.56 766.24C872 737.36 852.08 694.88 832 648c0 0-124.88-40-320-40s-320 40-320 40c-20.08 46.88-40 89.36-46.56 118.24a40 40 0 0 0 46.56 48.48 1572 1572 0 0 1 320-34.72 1572 1572 0 0 1 320 34.72 40 40 0 0 0 46.56-48.48z" fill="${colors.brim}"/>
  <!-- Crown -->
  <path d="M512 256c-192 0-360 152-320 392 0 0 124.88-40 320-40s320 40 320 40c40-240-128-392-320-392z" fill="${colors.cap}"/>
  <!-- Front panel -->
  <path d="M313.52 622.32a1383.28 1383.28 0 0 1 396.96 0C725.36 397.2 625.52 256 512 256S298.64 397.2 313.52 622.32z" fill="${colors.cap}" opacity="0.85"/>
  <!-- Top band -->
  <path d="M560 240v19.36a344.56 344.56 0 0 0-96 0V240a32 32 0 0 1 32-32h32a32 32 0 0 1 32 32z" fill="${colors.brim}"/>
  <!-- Shine -->
  <path d="M400 340 C430 300, 490 270, 512 268 C480 280, 440 320, 420 380 Z" fill="white" opacity="0.06"/>
  <!-- Team letter -->
  <text x="512" y="490" text-anchor="middle" dominant-baseline="central"
    font-family="${font.family}" font-weight="${font.weight}" font-style="${font.style}"
    font-size="${font.size}" fill="${colors.letter}" opacity="0.95">${escapeXml(initial)}</text>
</svg>`

  svgCache.set(cacheKey, svg)

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
