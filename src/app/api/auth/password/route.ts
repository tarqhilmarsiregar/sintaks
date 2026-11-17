import { NextRequest, NextResponse } from 'next/server';
import { ArenaStore } from '@/lib/arena-store';

/**
 * Server-Side Student Password Change & Onboarding API
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

    // 1. ACTION: REGULAR PASSWORD CHANGE
    if (action === 'change') {
      if (!oldPassword || !newPassword) {
        return NextResponse.json(
          { error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' },
          { status: 400 }
        );
      }

      const res = ArenaStore.changePassword(nim, oldPassword, newPassword);
      if (!res.success) {
        return NextResponse.json(
          { error: res.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: res.message,
        user: {
          nim: res.user?.nim,
          nama_lengkap: res.user?.nama_lengkap,
          codename: res.user?.codename,
          role: res.user?.role,
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

      const res = ArenaStore.completeOnboarding({
        nim,
        newPassword,
        codename,
        avatar,
      });

      if (!res.success) {
        return NextResponse.json(
          { error: res.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
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

    return NextResponse.json(
      { error: `Aksi "${action}" tidak didukung. Pilihan: change | onboarding` },
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
