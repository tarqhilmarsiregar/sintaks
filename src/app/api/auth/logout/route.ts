import { NextResponse } from 'next/server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/security/session';

/**
 * Menghapus cookie sesi HttpOnly di sisi server.
 * POST /api/auth/logout
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesi berhasil diakhiri dengan aman.',
  });

  response.cookies.set(SESSION_COOKIE_NAME, '', getSessionCookieOptions(0));
  // Bersihkan juga cookie legacy non-HttpOnly bila masih ada
  response.cookies.set('cp_arena_user', '', { path: '/', maxAge: 0 });

  return response;
}
