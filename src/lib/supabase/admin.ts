import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Membersihkan trailing slash maupun suffix "/rest/v1" yang sering ikut tersalin dari dashboard Supabase.
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  return (rawUrl || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

/**
 * Memeriksa apakah kredensial Supabase produksi/staging telah dikonfigurasi
 * (bukan nilai placeholder default).
 */
export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!url || !key) return false;
  if (!url.startsWith('https://')) return false;
  if (
    url.includes('your-project-id') ||
    url.includes('placeholder.supabase.co') ||
    key.includes('your-service-role-key') ||
    key.includes('your-anon-key') ||
    key === 'placeholder-anon-key'
  ) {
    return false;
  }

  return true;
}

/**
 * Mengembalikan instance Supabase server-side client (service_role).
 * Mengembalikan null jika environment belum dikonfigurasi.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (cachedAdminClient) return cachedAdminClient;

  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )!.trim();

  cachedAdminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}
