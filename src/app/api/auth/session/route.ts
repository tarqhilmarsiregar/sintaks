import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/security/session';

/**
 * Memeriksa keabsahan sesi HttpOnly aktif di sisi server.
 * GET /api/auth/session
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, session: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    session,
  });
}
