'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MahasiswaArenaContainer from '@/components/arena/MahasiswaArenaContainer';
import { StudentActiveMenu } from '@/components/arena/StudentSidebar';

const VALID_MENUS: StudentActiveMenu[] = [
  'dashboard',
  'katalog',
  'team',
  'leaderboard',
  'submisi',
  'capaian',
  'profil',
];

// Semantic Aliases untuk URL fleksibel ala DOMjudge
const MENU_ALIASES: Record<string, StudentActiveMenu> = {
  kontes: 'katalog',
  scoreboard: 'leaderboard',
  tim: 'team',
  evaluasi: 'capaian',
};

export default function MahasiswaDynamicMenuPage() {
  const params = useParams();
  const router = useRouter();

  const rawParam = (params?.menu as string) || 'dashboard';
  const resolvedMenu: StudentActiveMenu = MENU_ALIASES[rawParam] || (rawParam as StudentActiveMenu);
  const isValid = VALID_MENUS.includes(resolvedMenu);

  useEffect(() => {
    if (!isValid) {
      router.replace('/mahasiswa/dashboard');
    }
  }, [isValid, router]);

  const activeMenu: StudentActiveMenu = isValid ? resolvedMenu : 'dashboard';

  return <MahasiswaArenaContainer activeMenu={activeMenu} />;
}
