'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/arena';
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
}

export default function StudentSidebar({
  currentUser,
  activeMenu,
  onMenuChange,
  onLogout,
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
    <aside className="w-full md:w-72 lg:w-80 xl:w-[328px] shrink-0 bg-[#090e1a] border-b md:border-b-0 md:border-r border-[#1e293b] flex flex-col md:fixed md:top-[61px] md:bottom-0 md:left-0 font-sans select-none z-30">
      {/* 1. Header Profil Mahasiswa Terintegrasi (Clean & Minimalist Typography) */}
      <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#0c1222]/90 backdrop-blur-md relative overflow-hidden shrink-0">
        {/* Glow ambient background effect */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          {/* Header Row: Codename & Badge Kelas */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-white text-[15px] sm:text-base tracking-tight truncate">
              {currentUser.codename}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10.5px] font-mono text-cyan-300 font-semibold shrink-0 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Kelas {currentUser.klub_hari}</span>
            </div>
          </div>

          {/* Academic Identifier */}
          <div className="text-[11.5px] text-slate-400 flex items-center gap-2 truncate">
            <span className="font-mono text-slate-300 font-medium bg-[#111827] px-1.5 py-0.5 rounded border border-[#1e293b] text-[10px]">
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
            <span className="text-[11px] font-mono text-slate-300 font-semibold">
              <span className="text-white font-bold">{currentUser.total_xp}</span>
              <span className="text-slate-500 font-normal"> / {levelInfo.nextLevelXP} XP</span>
            </span>
          </div>

          {/* Progress Bar Container with subtle glow */}
          <div className="w-full h-2.5 bg-[#060a14] rounded-full overflow-hidden border border-[#1e293b] p-0.5 relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Subtle shimmer tip at the end of progress */}
              <span className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full blur-[1px]" />
            </div>
          </div>

          {/* Bottom Gamification Row: Micro Rank Badge & Glowing Goal XP */}
          <div className="flex items-center justify-between text-[10.5px] font-mono mt-2 gap-2">
            {/* Rank Chip */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111827] border border-cyan-500/20 text-cyan-300 font-semibold text-[10px] truncate max-w-[145px] shadow-sm">
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
          <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Kompetisi DOMjudge
          </div>
          <nav className="flex flex-col gap-1">
            {arenaMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onMenuChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-600/20 font-semibold'
                      : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                  }`}
                >
                  {/* Active Indicator Bar Vertikal Halus di Kiri */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-sm" />
                  )}

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#111827] border border-[#1e293b] text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-xs sm:text-[13px] leading-tight font-semibold tracking-wide ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400 font-mono'
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
          <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Latihan &amp; Evaluasi Kampus
          </div>
          <nav className="flex flex-col gap-1">
            {academicMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onMenuChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-600/20 font-semibold'
                      : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                  }`}
                >
                  {/* Active Indicator Bar Vertikal Halus di Kiri */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-sm" />
                  )}

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#111827] border border-[#1e293b] text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-xs sm:text-[13px] leading-tight font-semibold tracking-wide ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400 font-mono'
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
            <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-amber-500/80 uppercase">
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
      <div className="p-3.5 border-t border-[#1e293b] bg-[#070b16]/95 shrink-0 space-y-2 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-white text-xs font-mono font-semibold shadow-sm transition-all active:scale-[0.98] group"
          title="Keluar dari akun Anda"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          <span>Keluar (Logout)</span>
        </button>

        <div className="px-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>STMIK TIME • CP Arena</span>
          <span className="text-emerald-400/90 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            v2.1 Connected
          </span>
        </div>
      </div>
    </aside>
  );
}
