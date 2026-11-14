'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MahasiswaRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mahasiswa/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center font-mono text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Mengarahkan ke Dashboard Mahasiswa...</p>
      </div>
    </div>
  );
}
