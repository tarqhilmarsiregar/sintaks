import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { SupabaseArenaRepo } from '@/lib/supabase/repository';
import { ArenaStore } from '@/lib/arena-store';
import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from '@/lib/security/session';

/**
 * Unified Hardened Login Endpoint
 * - Verifies scrypt hashed password (with automatic lazy migration for legacy plain-text rows)
 * - Issues HMAC-SHA256 Signed HttpOnly Session Cookie (cp_arena_session)
 * - Never returns password/hash in response payload
 * POST /api/auth/login
 */
export async function POST(req: NextRequest) {
  try {
    const { nim, password } = await req.json();

    if (!nim || !password) {
      return NextResponse.json(
        { error: 'NIM dan Kata Sandi wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Live Supabase PostgreSQL Authentication
    if (isSupabaseConfigured()) {
      const dbResult = await SupabaseArenaRepo.authenticateUser(nim, password);
      if (dbResult) {
        if (!dbResult.success || !dbResult.user) {
          return NextResponse.json(
            { error: dbResult.message || 'Autentikasi gagal.', mode: 'supabase' },
            { status: 401 }
          );
        }

        const token = await signSessionToken({
          nim: dbResult.user.nim,
          role: dbResult.user.role,
          codename: dbResult.user.codename,
        });

        const response = NextResponse.json({
          success: true,
          mode: 'supabase',
          user: { ...dbResult.user, password: undefined },
          requiresOnboarding: dbResult.requiresOnboarding ?? false,
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
        response.cookies.set('cp_arena_user', '', { path: '/', maxAge: 0 });
        return response;
      }
    }

    // 2. Fallback: Local ArenaStore (mode dev offline / belum dikonfigurasi)
    const localRes = ArenaStore.login(nim, password);
    if (!localRes.success || !localRes.user) {
      return NextResponse.json(
        { error: localRes.message || 'Autentikasi gagal.', mode: 'local' },
        { status: 401 }
      );
    }

    const safeUser = { ...localRes.user, password: undefined };
    const token = await signSessionToken({
      nim: safeUser.nim,
      role: safeUser.role,
      codename: safeUser.codename,
    });

    const response = NextResponse.json({
      success: true,
      mode: 'local',
      user: safeUser,
      requiresOnboarding: localRes.requiresOnboarding ?? false,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    response.cookies.set('cp_arena_user', '', { path: '/', maxAge: 0 });
    return response;
  } catch (error: any) {
    console.error('Error pada /api/auth/login:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
