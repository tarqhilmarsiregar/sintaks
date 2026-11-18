import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { SupabaseArenaRepo } from '@/lib/supabase/repository';
import { ArenaStore } from '@/lib/arena-store';
import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from '@/lib/security/session';

// Sliding-window in-memory brute-force rate limiter (maks 15 percobaan gagal per 5 menit per IP+NIM)
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_FAILED_ATTEMPTS = 15;
const failedLoginBuckets = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'local';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (failedLoginBuckets.get(key) || []).filter(
    (t) => now - t < LOGIN_RATE_WINDOW_MS
  );
  if (timestamps.length === 0) {
    failedLoginBuckets.delete(key);
    return false;
  }
  failedLoginBuckets.set(key, timestamps);
  return timestamps.length >= LOGIN_MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const timestamps = (failedLoginBuckets.get(key) || []).filter(
    (t) => now - t < LOGIN_RATE_WINDOW_MS
  );
  timestamps.push(now);
  failedLoginBuckets.set(key, timestamps);
}

function clearFailedAttempts(key: string): void {
  failedLoginBuckets.delete(key);
}

/**
 * Unified Hardened Login Endpoint
 * - Sliding-window brute-force rate limiting
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

    const rateKey = `${getClientIp(req)}::${String(nim).trim().toUpperCase()}`;
    if (isRateLimited(rateKey)) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak percobaan login gagal. Silakan tunggu 5 menit sebelum mencoba kembali.',
          mode: isSupabaseConfigured() ? 'supabase' : 'local',
        },
        { status: 429 }
      );
    }

    // 1. Live Supabase PostgreSQL Authentication
    if (isSupabaseConfigured()) {
      const dbResult = await SupabaseArenaRepo.authenticateUser(nim, password);
      if (dbResult) {
        if (!dbResult.success || !dbResult.user) {
          recordFailedAttempt(rateKey);
          return NextResponse.json(
            { error: dbResult.message || 'Autentikasi gagal.', mode: 'supabase' },
            { status: 401 }
          );
        }

        clearFailedAttempts(rateKey);
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
      recordFailedAttempt(rateKey);
      return NextResponse.json(
        { error: localRes.message || 'Autentikasi gagal.', mode: 'local' },
        { status: 401 }
      );
    }

    clearFailedAttempts(rateKey);

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
