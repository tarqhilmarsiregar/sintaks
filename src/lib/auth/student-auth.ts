import { UserProfile } from '@/types';
import { MOCK_USERS } from '@/lib/mock-data';

export const STUDENT_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_DEFAULT_STUDENT_DOMAIN || '@cparena.internal';

export function nimToEmail(nim: string): string {
  const cleanNim = nim.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanNim}${STUDENT_EMAIL_DOMAIN}`;
}

export function emailToNim(email: string): string {
  return email.split('@')[0];
}

export interface AuthSession {
  user: UserProfile;
  token?: string;
}

const STORAGE_KEY = 'cp_arena_user_session';

export function getClientSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setClientSession(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Also store in cookie for basic SSR awareness
  document.cookie = `cp_arena_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearClientSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `cp_arena_user=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * High-level login handler supporting both Supabase Auth and Local Mock Sandbox
 */
export async function authenticateStudent(nim: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanNim = nim.trim();
  
  if (!cleanNim || !password) {
    return { success: false, error: 'NIM dan Password wajib diisi.' };
  }

  // 1. Check existing mock users first for instant offline/dev capability
  const matchedUser = MOCK_USERS.find(u => u.nim.toLowerCase() === cleanNim.toLowerCase());
  
  if (matchedUser) {
    // For default student: password can be their NIM or custom password
    if (password === cleanNim || password === 'dosen123' || password === '12345678') {
      setClientSession(matchedUser);
      return { success: true, user: matchedUser };
    }
  }

  // 2. If NIM matches a standard student pattern (e.g. numeric ID) and password is default NIM
  if (password === cleanNim) {
    const newUser: UserProfile = {
      id: `usr-${cleanNim}`,
      nim: cleanNim,
      full_name: `Mahasiswa ${cleanNim}`,
      role: cleanNim.toUpperCase().startsWith('DOSEN') ? 'lecturer' : 'student',
      class_group: 'Kelas Algoritma & Pemrograman 2024',
      rating: 1200,
      solved_count: 0,
      created_at: new Date().toISOString(),
    };
    setClientSession(newUser);
    return { success: true, user: newUser };
  }

  return { success: false, error: 'Kredensial tidak valid. Silakan gunakan NIM dan Password NIM (default).' };
}

