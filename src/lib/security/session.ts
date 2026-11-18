import { UserRole } from '@/types/arena';

export const SESSION_COOKIE_NAME = 'cp_arena_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export interface SessionPayload {
  nim: string;
  role: UserRole;
  codename: string;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RECAPTCHA_SECRET_KEY ||
    'cp-arena-stmik-time-dev-session-secret-2026'
  ).trim();
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + '='.repeat(padLen);

  if (typeof atob === 'function') {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Menandatangani payload sesi menjadi token HMAC-SHA256 (format: <payloadB64Url>.<sigB64Url>).
 * Kompatibel penuh dengan Next.js Edge Runtime (middleware) dan Node.js Runtime (API routes).
 */
export async function signSessionToken(input: {
  nim: string;
  role: UserRole;
  codename: string;
  ttlSeconds?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    nim: input.nim.trim().toUpperCase(),
    role: input.role,
    codename: input.codename || input.nim,
    iat: now,
    exp: now + (input.ttlSeconds ?? SESSION_TTL_SECONDS),
  };

  const encoder = new TextEncoder();
  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(getSessionSecret());
  const sigBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadB64)
  );
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Memverifikasi tanda tangan kriptografis dan masa berlaku token sesi.
 * Mengembalikan null jika token tidak valid, dimanipulasi, atau kedaluwarsa.
 */
export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const encoder = new TextEncoder();
    const key = await importHmacKey(getSessionSecret());
    const sigBytes = base64UrlToBytes(sigB64);

    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as ArrayBuffer,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const decoder = new TextDecoder();
    const parsed = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64))) as SessionPayload;

    if (!parsed?.nim || (parsed.role !== 'ADMIN' && parsed.role !== 'PESERTA')) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== 'number' || parsed.exp < now) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Membaca dan memverifikasi cookie sesi dari NextRequest atau Request biasa.
 */
export async function getSessionFromCookieHeader(
  cookieValue?: string | null
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  return verifySessionToken(cookieValue);
}

/**
 * Opsi standar HttpOnly Cookie untuk produksi & development.
 */
export function getSessionCookieOptions(maxAge: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
