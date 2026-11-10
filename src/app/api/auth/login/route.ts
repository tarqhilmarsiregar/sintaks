import { NextRequest, NextResponse } from 'next/server';
import { authenticateStudent } from '@/lib/auth/student-auth';

export async function POST(req: NextRequest) {
  try {
    const { nim, password } = await req.json();

    if (!nim || !password) {
      return NextResponse.json(
        { error: 'NIM dan Password wajib diisi.' },
        { status: 400 }
      );
    }

    const authResult = await authenticateStudent(nim, password);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Autentikasi gagal.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    });

    // Set auth cookie
    response.cookies.set('cp_arena_user', JSON.stringify(authResult.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
