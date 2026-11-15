'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArenaStore } from '@/lib/arena-store';
import { SITE_CONFIG } from '@/config/site';

/**
 * Root Gateway & Session Dispatcher:
 * - Mengarahkan peserta (PESERTA) langsung ke /mahasiswa
 * - Mengarahkan pembina/dosen (ADMIN) langsung ke /admin
 * - Mengarahkan pengunjung belum login ke /login
 */
export default function RootPageDispatcher() {
  const router = useRouter();

  useEffect(() => {
    const user = ArenaStore.getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/mahasiswa');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center font-mono text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Menghubungkan ke Portal {SITE_CONFIG.name}...</p>
      </div>
    </div>
  );
}
