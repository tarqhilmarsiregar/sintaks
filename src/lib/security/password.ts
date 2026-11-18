import crypto from 'crypto';

const SCRYPT_PREFIX = 'scrypt$';
const KEY_LENGTH = 64;

/**
 * Memeriksa apakah string kata sandi sudah dalam format hash scrypt yang valid.
 * Format: scrypt$<saltHex>$<derivedKeyHex>
 */
export function isPasswordHashed(stored: string): boolean {
  if (!stored || !stored.startsWith(SCRYPT_PREFIX)) return false;
  const parts = stored.split('$');
  return parts.length === 3 && parts[1].length >= 16 && parts[2].length === KEY_LENGTH * 2;
}

/**
 * Menghasilkan salted hash kriptografis menggunakan Node.js crypto.scryptSync.
 */
export function hashPassword(plainPassword: string): string {
  const clean = plainPassword.trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(clean, salt, KEY_LENGTH).toString('hex');
  return `${SCRYPT_PREFIX}${salt}$${derivedKey}`;
}

/**
 * Pembandingan konstan waktu (timing-safe) untuk mencegah timing side-channel attack.
 */
function safeEqualString(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Memverifikasi kata sandi terhadap hash scrypt atau kata sandi legacy plain-text.
 * Jika cocok dengan legacy plain-text, mengembalikan needsRehash: true agar
 * server langsung meng-upgrade baris database ke hash scrypt (lazy migration).
 */
export function verifyPassword(
  plainPassword: string,
  storedPassword: string
): { valid: boolean; needsRehash: boolean } {
  const cleanPlain = (plainPassword || '').trim();
  const cleanStored = (storedPassword || '').trim();

  if (!cleanPlain || !cleanStored) {
    return { valid: false, needsRehash: false };
  }

  if (isPasswordHashed(cleanStored)) {
    const [, salt, keyHex] = cleanStored.split('$');
    try {
      const derived = crypto.scryptSync(cleanPlain, salt, KEY_LENGTH);
      const expected = Buffer.from(keyHex, 'hex');
      if (derived.length !== expected.length) {
        return { valid: false, needsRehash: false };
      }
      const valid = crypto.timingSafeEqual(derived, expected);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy plain-text verification (untuk migrasi otomatis akun eksisting/default NIM)
  const valid = safeEqualString(cleanPlain, cleanStored);
  return { valid, needsRehash: valid };
}
