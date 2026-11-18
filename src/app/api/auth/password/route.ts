import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { SupabaseArenaRepo } from '@/lib/supabase/repository';
import { ArenaStore } from '@/lib/arena-store';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/security/session';

/**
 * Server-Side Student Password Change & Onboarding API
 * Persists directly to Supabase PostgreSQL when configured, with local fallback.
 * Enforces signed HttpOnly session ownership verification.
 * POST /api/auth/password
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, nim, oldPassword, newPassword, codename, avatar } = body;

    if (!nim || typeof nim !== 'string') {
      return NextResponse.json(
        { error: 'NIM wajib disertakan.' },
        { status: 400 }
      );
    }

    // Verifikasi kepemilikan sesi di mode live Supabase (cegah eskalasi horizontal antar mahasiswa)
    if (isSupabaseConfigured()) {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = await verifySessionToken(token);
      if (!session) {
        return NextResponse.json(
          { success: false, mode: 'supabase', error: 'Akses ditolak (401): Sesi login tidak valid. Silakan login ulang.' },
          { status: 401 }
        );
      }
      if (session.role !== 'ADMIN' && session.nim.toUpperCase() !== nim.trim().toUpperCase()) {
        return NextResponse.json(
          { success: false, mode: 'supabase', error: 'Akses ditolak (403): Anda tidak berwenang mengubah kata sandi akun mahasiswa lain.' },
          { status: 403 }
        );
      }
    }

    // 1. ACTION: REGULAR PASSWORD CHANGE
    if (action === 'change') {
      if (!oldPassword || !newPassword) {
        return NextResponse.json(
          { error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' },
          { status: 400 }
        );
      }

      if (isSupabaseConfigured()) {
        const dbRes = await SupabaseArenaRepo.updateUserCredentials({
          nim,
          oldPassword,
          newPassword,
          verifyOldPassword: true,
        });

        if (dbRes) {
          if (!dbRes.success) {
            return NextResponse.json({ success: false, mode: 'supabase', error: dbRes.message }, { status: 400 });
          }
          return NextResponse.json({
            success: true,
            mode: 'supabase',
            message: dbRes.message,
            user: dbRes.user,
          });
        }
      }

      const res = ArenaStore.changePassword(nim, oldPassword, newPassword);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mode: 'local',
        message: res.message,
        user: {
          nim: res.user?.nim,
          nama_lengkap: res.user?.nama_lengkap,
          codename: res.user?.codename,
          role: res.user?.role,
          is_first_login: res.user?.is_first_login,
          password_changed_at: res.user?.password_changed_at,
        },
      });
    }

    // 2. ACTION: FIRST-LOGIN ONBOARDING
    if (action === 'onboarding') {
      if (!newPassword) {
        return NextResponse.json(
          { error: 'Kata sandi baru wajib diisi untuk menyelesaikan onboarding.' },
          { status: 400 }
        );
      }

      if (isSupabaseConfigured()) {
        const dbRes = await SupabaseArenaRepo.updateUserCredentials({
          nim,
          newPassword,
          codename,
          avatar,
          verifyOldPassword: false,
        });

        if (dbRes) {
          if (!dbRes.success) {
            return NextResponse.json({ success: false, mode: 'supabase', error: dbRes.message }, { status: 400 });
          }
          return NextResponse.json({
            success: true,
            mode: 'supabase',
            message: dbRes.message,
            user: dbRes.user,
          });
        }
      }

      const res = ArenaStore.completeOnboarding({
        nim,
        newPassword,
        codename,
        avatar,
      });

      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mode: 'local',
        message: res.message,
        user: {
          nim: res.user?.nim,
          nama_lengkap: res.user?.nama_lengkap,
          codename: res.user?.codename,
          avatar: res.user?.avatar,
          role: res.user?.role,
          is_first_login: res.user?.is_first_login,
          password_changed_at: res.user?.password_changed_at,
        },
      });
    }

    // 3. ACTION: ADMIN RESET STUDENT PASSWORD TO NIM (ADMIN ONLY)
    if (action === 'admin-reset') {
      if (isSupabaseConfigured()) {
        const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        const session = await verifySessionToken(token);
        if (!session || session.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Akses ditolak (403): Hanya ADMIN yang berwenang mereset kata sandi mahasiswa.' },
            { status: 403 }
          );
        }

        const dbRes = await SupabaseArenaRepo.adminResetUserPassword(nim);
        if (dbRes) {
          if (!dbRes.success) {
            return NextResponse.json({ success: false, mode: 'supabase', error: dbRes.message }, { status: 400 });
          }
          return NextResponse.json({
            success: true,
            mode: 'supabase',
            message: dbRes.message,
            user: dbRes.user,
          });
        }
      }

      const localRes = ArenaStore.adminResetPassword(nim);
      if (!localRes.success) {
        return NextResponse.json({ error: localRes.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mode: 'local',
        message: localRes.message,
        user: localRes.user ? { ...localRes.user, password: undefined } : undefined,
      });
    }

    return NextResponse.json(
      { error: `Aksi "${action}" tidak didukung. Pilihan: change | onboarding | admin-reset` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error pada endpoint manajemen kata sandi:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan internal pada server keamanan.' },
      { status: 500 }
    );
  }
}
