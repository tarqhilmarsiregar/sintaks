'use client';

import React from 'react';
import { User, AdminActiveTab } from '@/types/arena';
import UserAvatar from '@/components/arena/UserAvatar';
import {
  Sliders,
  BookOpen,
  ListChecks,
  Users,
  GraduationCap,
  FileSpreadsheet,
  LogOut,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  currentUser: User | null;
  activeTab: AdminActiveTab;
  onTabChange: (tab: AdminActiveTab) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AdminSidebar({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  // Navigation Items - Kategori 1: Kontrol Kontes & Penjurian
  const contestMenuItems = [
    {
      id: 'contests' as AdminActiveTab,
      label: 'Kontrol Kontes & Saklar',
      sublabel: 'Status Game, Freeze & PIN',
      icon: Sliders,
    },
    {
      id: 'problems' as AdminActiveTab,
      label: 'Bank Soal & Editorial',
      sublabel: 'Narasi, Testcase & Hint',
      icon: BookOpen,
    },
    {
      id: 'submissions' as AdminActiveTab,
      label: 'Antrean Submisi & Judge',
      sublabel: 'Live Verdicts & Log Submisi',
      icon: ListChecks,
    },
  ];

  // Navigation Items - Kategori 2: Akademik & Data Kampus
  const academicMenuItems = [
    {
      id: 'teams' as AdminActiveTab,
      label: 'Snake-Draft & Tim',
      sublabel: 'Pembagian Berimbang & Kode',
      icon: Users,
    },
    {
      id: 'students' as AdminActiveTab,
      label: 'Data & Progres Mahasiswa',
      sublabel: 'Akun, Nilai & Reset Progres',
      icon: GraduationCap,
    },
    {
      id: 'export' as AdminActiveTab,
      label: 'Rekap Nilai & Ekspor',
      sublabel: 'Multi-Sheet XLSX & Backup',
      icon: FileSpreadsheet,
    },
  ];

  const dosenName = currentUser?.nama_lengkap || 'Tarq Hilmar Siregar, S.Kom';

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

      {/* Main Sidebar Aside (Fixed Left Docked - Identik dengan StudentSidebar) */}
      <aside
        className={`w-72 sm:w-80 md:w-72 lg:w-80 xl:w-[328px] shrink-0 bg-[#090e1a] border-r border-[#1e293b] flex flex-col font-sans select-none z-50 md:z-30 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0 flex'
            : 'fixed top-[61px] bottom-0 left-0 -translate-x-full md:translate-x-0 hidden md:flex'
        }`}
      >
        {/* 1. Header Profil Admin Terintegrasi (Clean & Industrial) */}
        <div className="p-3.5 sm:p-4 border-b border-[#1e293b] bg-[#0c1222]/90 shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <UserAvatar user={currentUser} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm tracking-tight truncate" title={dosenName}>
                  {dosenName}
                </h3>
              </div>
            </div>

            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#151f33] active:scale-95 border border-[#1e293b] transition-all shrink-0"
                aria-label="Tutup menu navigasi"
              >
                <X className="w-4 h-4 text-slate-300" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Menu Navigasi Berkelompok (Grouped Flat Navigation) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Kategori 1: KONTROL KONTES & PENJURIAN */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              Kontrol Kontes &amp; Penjurian
            </div>
            <nav className="flex flex-col gap-1">
              {contestMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'contests' && activeTab === 'games') ||
                  (item.id === 'problems' && activeTab === 'questions');

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                    }`}
                  >
                    {/* Active Indicator Bar Vertikal di Kiri */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                    )}

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#111827] border border-[#1e293b] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold tracking-tight truncate leading-snug">
                        {item.label}
                      </div>
                      <div
                        className={`text-[11px] font-mono truncate leading-none mt-0.5 ${
                          isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'
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

          {/* Kategori 2: AKADEMIK & DATA KAMPUS */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              Akademik &amp; Data Kampus
            </div>
            <nav className="flex flex-col gap-1">
              {academicMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                    }`}
                  >
                    {/* Active Indicator Bar Vertikal di Kiri */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                    )}

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#111827] border border-[#1e293b] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold tracking-tight truncate leading-snug">
                        {item.label}
                      </div>
                      <div
                        className={`text-[11px] font-mono truncate leading-none mt-0.5 ${
                          isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'
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
        </div>

        {/* 3. Action Footer di Bagian Bawah Sidebar (Identik 1:1 dengan StudentSidebar) */}
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
