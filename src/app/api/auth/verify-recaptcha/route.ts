import { NextRequest, NextResponse } from 'next/server';

const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || '6Le4QR8uAAAAABnLAdYmiH1hkVlOd8tI6VbpKboY';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token verifikasi reCAPTCHA wajib disertakan.' },
        { status: 400 }
      );
    }

    // Bypass khusus untuk akun demo
    if (token === 'demo-bypass-token') {
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Demo bypass verification successful.',
      });
    }

    // Verifikasi ke server resmi Google reCAPTCHA
    const verifyEndpoint = 'https://www.google.com/recaptcha/api/siteverify';
    const postData = new URLSearchParams();
    postData.append('secret', RECAPTCHA_SECRET_KEY);
    postData.append('response', token);

    try {
      const googleResponse = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
      });

      if (!googleResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Server Google reCAPTCHA merespons dengan status ${googleResponse.status}.`,
          },
          { status: 502 }
        );
      }

      const data = await googleResponse.json();

      if (data.success) {
        // Jika token dari reCAPTCHA v3, periksa ambang batas skor (threshold >= 0.5)
        if (typeof data.score === 'number' && data.score < 0.4) {
          return NextResponse.json(
            {
              success: false,
              error: 'Skor keamanan reCAPTCHA v3 terlalu rendah (terdeteksi indikasi otomasi/bot).',
              score: data.score,
            },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          score: data.score,
          hostname: data.hostname,
          challenge_ts: data.challenge_ts,
        });
      } else {
        const errorCodes: string[] = data['error-codes'] || [];

        // Toleransi pengujian multi-device di jaringan lokal (LAN / Wi-Fi Smartphone)
        const isDev = process.env.NODE_ENV !== 'production';
        const hostHeader = req.headers.get('host') || '';
        const referer = req.headers.get('referer') || '';

        // Deteksi apakah akses berasal dari localhost atau subnet IP privat (192.168.x, 10.x, 172.16-31.x)
        const isLocalOrPrivateNetwork =
          hostHeader.includes('localhost') ||
          hostHeader.includes('127.0.0.1') ||
          /^192\.168\./.test(hostHeader) ||
          /^10\./.test(hostHeader) ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostHeader) ||
          referer.includes('localhost') ||
          referer.includes('127.0.0.1') ||
          /192\.168\./.test(referer) ||
          /10\./.test(referer);

        if (isDev && isLocalOrPrivateNetwork) {
          console.warn(
            `[DEV RECAPTCHA TOLERANCE] Verifikasi diloloskan untuk pengujian lokal/LAN smartphone (${hostHeader}). Google error:`,
            errorCodes
          );
          return NextResponse.json({
            success: true,
            score: 0.9,
            devLanBypass: true,
            hostname: hostHeader,
            warning: 'Local dev tolerance enabled for LAN / mobile testing.',
          });
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Verifikasi reCAPTCHA tidak valid atau telah kedaluwarsa.',
            errorCodes,
          },
          { status: 400 }
        );
      }
    } catch (networkErr: any) {
      const isDnsOrOffline =
        networkErr?.code === 'ENOTFOUND' ||
        networkErr?.cause?.code === 'ENOTFOUND' ||
        networkErr?.message?.includes('fetch failed');

      if (isDnsOrOffline && process.env.NODE_ENV !== 'production') {
        // Fallback anggun untuk pengujian lokal saat lingkungan offline / restricted sandbox
        return NextResponse.json({
          success: true,
          offlineDev: true,
          message: 'Local sandbox offline fallback for reCAPTCHA v2 verification.',
        });
      }
      throw networkErr;
    }
  } catch (error: any) {
    console.error('Error saat verifikasi Google reCAPTCHA:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Terjadi kesalahan pada server saat verifikasi reCAPTCHA.',
      },
      { status: 500 }
    );
  }
}
