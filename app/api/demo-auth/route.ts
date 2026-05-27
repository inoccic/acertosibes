import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'demo_session'

export async function GET() {
  // Return current session user ID from cookie
  return NextResponse.json({ userId: null })
}

export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE, userId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE)
  return response
}
