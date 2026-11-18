'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { calculateLevelInfo } from '@/lib/gamification';
import {
  LayoutDashboard,
  Trophy,
  Users,
  FileText,
  Award,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Flame,
  Code2,
  X,
} from 'lucide-react';

export type StudentActiveMenu =
  | 'dashboard'
  | 'katalog'
  | 'team'
  | 'leaderboard'
  | 'submisi'
  | 'capaian'
  | 'profil';

interface StudentSidebarProps {
  currentUser: User;
  activeMenu: StudentActiveMenu;
  onMenuChange: (menu: StudentActiveMenu) => void;
  onLogout: () => void;
  totalGamesCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function StudentSidebar({
  currentUser,
  activeMenu,
  onMenuChange,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}: StudentSidebarProps) {
  const router = useRouter();
  const levelInfo = calculateLevelInfo(currentUser.total_xp || 0);

  // Menghitung persentase progress XP level saat ini
  const currentLevelBaseXP = (levelInfo.level - 1) * 250;
  const xpInCurrentLevel = Math.max(0, currentUser.total_xp - currentLevelBaseXP);
  const progressPercent = Math.min(100, Math.max(8, Math.round((xpInCurrentLevel / 250) * 100)));

  // Kategori 1: Kompetisi DOMjudge (Live Arena)
  const arenaMenuItems = [
    {
      id: 'dashboard' as StudentActiveMenu,
      label: 'Overview Kontes',
      sublabel: 'Status, Timer & Quick Access',
      icon: LayoutDashboard,
    },
    {
      id: 'katalog' as StudentActiveMenu,
      label: 'Arena Kontes',
      sublabel: 'Daftar Soal A–Z & Pengerjaan',
      icon: Code2,
    },
    {
      id: 'team' as StudentActiveMenu,
      label: 'Tim & Kode Gabung',
      sublabel: 'Squad Roster & Join Code',
      icon: Users,
    },
    {
      id: 'leaderboard' as StudentActiveMenu,
      label: 'Scoreboard ICPC',
      sublabel: 'Live Matrix Board & Freeze',
      icon: Trophy,
    },
    {
      id: 'submisi' as StudentActiveMenu,
      label: 'Riwayat Submisi',
      sublabel: 'Live Judge Verdict & Log',
      icon: FileText,
    },
  ];

  // Kategori 2: Latihan & Evaluasi Akademik Kampus
  const academicMenuItems = [
    {
      id: 'capaian' as StudentActiveMenu,
      label: 'Evaluasi Akademik',
      sublabel: 'Nilai Dosen & Diagnostik',
      icon: Award,
    },
    {
      id: 'profil' as StudentActiveMenu,
      label: 'Profil Mahasiswa',
      sublabel: 'Akun & Kredensial NIM',
      icon: UserIcon,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`w-72 sm:w-80 md:w-72 lg:w-80 xl:w-[328px] shrink-0 bg-[#090e1a] border-r border-[#1e293b] flex flex-col font-sans select-none z-50 md:z-30 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0 flex'
            : 'fixed top-[61px] bottom-0 left-0 -translate-x-full md:translate-x-0 hidden md:flex'
        }`}
      >
        {/* 1. Header Profil Mahasiswa Terintegrasi */}
        <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#0c1222]/90 shrink-0">
          <div className="space-y-1.5">
            {/* Header Row: Codename, Badge Kelas, & Mobile Close Button */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-white text-base tracking-tight truncate">
                {currentUser.codename}
              </h3>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-mono text-blue-300 font-semibold shadow-sm max-w-[140px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="truncate">{ArenaStore.resolveUserCohortName(currentUser)}</span>
                </div>

                {onCloseMobile && (
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#151f33] active:scale-95 border border-[#1e293b] transition-all ml-1"
                    aria-label="Tutup menu navigasi"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                  </button>
                )}
              </div>
            </div>

          {/* Academic Identifier */}
          <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
            <span className="font-mono text-slate-300 font-medium bg-[#111827] px-1.5 py-0.5 rounded border border-[#1e293b] text-[11px]">
              {currentUser.nim}
            </span>
            <span className="truncate">
              {currentUser.prodi || 'Sistem Informasi'} {currentUser.angkatan ? `'${String(currentUser.angkatan).slice(-2)}` : ''}
            </span>
          </div>
        </div>

        {/* Level & XP Mini Progress Bar */}
        <div className="mt-3.5 pt-3 border-t border-[#1e293b]/70 relative z-10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
              <span>Level {levelInfo.level}</span>
            </span>
            <span className="text-xs font-mono text-slate-300 font-semibold">
              <span className="text-white font-bold">{currentUser.total_xp}</span>
              <span className="text-slate-500 font-normal"> / {levelInfo.nextLevelXP} XP</span>
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2 bg-[#060a14] rounded-full overflow-hidden border border-[#1e293b] p-0.5 relative">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Bottom Gamification Row: Micro Rank Badge & Goal XP */}
          <div className="flex items-center justify-between text-xs font-mono mt-2 gap-2">
            {/* Rank Chip */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111827] border border-blue-500/30 text-blue-300 font-semibold text-[11px] truncate max-w-[145px] shadow-sm">
              <span className="truncate">{levelInfo.tierBadge}</span>
            </div>

            {/* Motivation Countdown with Highlighted XP */}
            <div className="text-slate-400 text-right shrink-0">
              Butuh <span className="text-amber-400 font-bold font-mono">{levelInfo.xpNeededForNext} XP</span> ke Lv.{levelInfo.level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Menu Navigasi Berkelompok (Grouped Flat Navigation - Standar DOMjudge Internal) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Kategori A: KOMPETISI DOMJUDGE (LIVE ARENA) */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Kompetisi DOMjudge
          </div>
          <nav className="flex flex-col gap-1">
            {arenaMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onMenuChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                    }`}
                >
                  {/* Active Indicator Bar Vertikal Halus di Kiri */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                  )}

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#111827] border border-[#1e293b] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-xs sm:text-sm leading-tight font-semibold tracking-wide ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400 font-mono'
                        }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Kategori B: LATIHAN & EVALUASI KAMPUS */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Latihan &amp; Evaluasi Kampus
          </div>
          <nav className="flex flex-col gap-1">
            {academicMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onMenuChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                    }`}
                >
                  {/* Active Indicator Bar Vertikal Halus di Kiri */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                  )}

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#111827] border border-[#1e293b] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-xs sm:text-sm leading-tight font-semibold tracking-wide ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400 font-mono'
                        }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Kategori C: PANEL DOSEN PEMBINA (jika role ADMIN) */}
        {currentUser.role === 'ADMIN' && (
          <div className="space-y-1 pt-1">
            <div className="px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-amber-500/80 uppercase">
              Panel Pembina
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/30 text-amber-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight truncate">Command Center Dosen</div>
                <div className="text-[11px] text-amber-400/70 font-mono truncate">Panel Tarq Hilmar S, S.Kom</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3. Action Footer di Bagian Bawah Sidebar (Tombol Logout Akun) */}
      <div className="p-3.5 border-t border-[#1e293b] bg-[#070b16]/95 shrink-0 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-white text-xs font-mono font-semibold shadow-sm transition-all active:scale-[0.98] group"
          title="Keluar dari akun Anda"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
      </aside>
    </>
  );
}
