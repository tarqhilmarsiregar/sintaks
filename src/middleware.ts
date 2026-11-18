import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/security/session';

function isLiveSupabaseMode(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (!url || !url.startsWith('https://')) return false;
  if (url.includes('your-project-id') || url.includes('placeholder.supabase.co')) {
    return false;
  }
  return true;
}

/**
 * Server-Side RBAC & Session Middleware (Edge Runtime)
 * Melindungi rute /admin/* dan /mahasiswa/* sebelum halaman dirender di server.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // 1. Jika cookie sesi valid, tegakkan RBAC secara mutlak di level server
  if (session) {
    if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
      const target = req.nextUrl.clone();
      target.pathname = '/mahasiswa/dashboard';
      target.search = '';
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  // 2. Jika tidak ada cookie sesi valid pada mode Supabase Live -> wajib login
  if (isLiveSupabaseMode()) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('reason', 'auth_required');
    return NextResponse.redirect(loginUrl);
  }

  // 3. Mode lokal/offline dev tanpa Supabase -> serahkan fallback guard ke client
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/mahasiswa/:path*'],
};
