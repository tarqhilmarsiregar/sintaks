'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@/types/arena';
import { calculateLevelInfo } from '@/lib/gamification';
import UserAvatar from '@/components/arena/UserAvatar';
import { SITE_CONFIG } from '@/config/site';
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  Award,
  Zap,
  Menu,
  X,
} from 'lucide-react';

interface TopNavbarProps {
  user: User | null;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function TopNavbar({
  user,
  onLogout,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}: TopNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const levelInfo = user ? calculateLevelInfo(user.total_xp || 0) : null;

  // Handle click outside & escape key to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-[#1f293d] px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-[#111827] border border-[#1f293d] text-slate-300 hover:text-white hover:bg-[#151f33] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 shrink-0 shadow-sm"
              aria-label={isMobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-200" />
              ) : (
                <Menu className="w-5 h-5 text-slate-200" />
              )}
            </button>
          )}

          {/* Brand Logo & Name */}
          <Link
            href={user?.role === 'ADMIN' ? '/admin' : '/mahasiswa'}
            className="flex items-center gap-2 sm:gap-3 min-w-0 shrink hover:opacity-90 transition-opacity"
          >
            <img
              src="/logo-stmik-time.png"
              alt="Logo STMIK TIME"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md shrink-0"
            />
            <div className="min-w-0 shrink">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight font-mono shrink-0">
                  {SITE_CONFIG.brandMark}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#131d33] border border-[#223354] text-blue-400 uppercase tracking-wider shrink-0">
                  {SITE_CONFIG.subname}
                </span>
              </div>
              <p
                className="text-[11px] text-slate-400 font-normal hidden md:block truncate"
                title={SITE_CONFIG.institution.club}
              >
                {SITE_CONFIG.institution.club}
              </p>
            </div>
          </Link>
        </div>

        {/* User Identity & Dropdown Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <div className="relative shrink-0" ref={dropdownRef}>
              {/* Profile Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 sm:gap-2.5 bg-[#111827] hover:bg-[#151f33] border rounded-lg p-1.5 sm:px-3 sm:py-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 shrink-0 ${isDropdownOpen
                    ? 'border-blue-500/60 bg-[#131d31] ring-2 ring-blue-500/20'
                    : 'border-[#1f293d] hover:border-slate-700'
                  }`}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                aria-label="Buka menu profil mahasiswa"
              >
                {/* Monogram Professional Avatar */}
                <UserAvatar user={user} size="sm" />

                {/* Identity & Mini Level / Role Badge (Collapsed on mobile, fully visible on sm+) */}
                <div className="hidden sm:flex items-center gap-2 min-w-0 text-left">
                  <span
                    className="font-bold text-white text-xs sm:text-sm font-mono truncate max-w-[120px] md:max-w-[170px]"
                    title={user.role === 'ADMIN' ? (user.nama_lengkap || user.codename) : user.codename}
                  >
                    {user.role === 'ADMIN' ? (user.nama_lengkap || user.codename) : user.codename}
                  </span>
                  {user.role === 'ADMIN' ? (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold text-[11px] font-mono select-none shrink-0">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px] font-mono select-none shrink-0">
                      Lv.{levelInfo?.level || user.level}
                    </span>
                  )}
                </div>

                {/* Chevron Arrow */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Menu Panel */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#0d1424] border border-[#1f293d] rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                  aria-label="Menu pengguna"
                >
                  {/* Section 1: User Identity Summary */}
                  <div className="p-3.5 bg-[#101827] border-b border-[#1f293d]/80">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white text-sm font-mono truncate" title={user.role === 'ADMIN' ? (user.nama_lengkap || user.codename) : user.codename}>
                            {user.role === 'ADMIN' ? (user.nama_lengkap || user.codename) : user.codename}
                          </h4>
                          <span className="text-[11px] px-1.5 py-0.2 rounded font-sans font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25 shrink-0">
                            {user.role === 'ADMIN' ? 'Admin' : 'Mhs'}
                          </span>
                        </div>
                        {user.role !== 'ADMIN' && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            NIM: <span className="text-slate-300 font-semibold">{user.nim}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Gamification Progress Card (HANYA UNTUK MAHASISWA) */}
                    {user.role !== 'ADMIN' && (
                      <div className="mt-3 bg-[#080d18] border border-[#1a2333] rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-medium truncate max-w-[170px]">
                            {user.tier_badge || levelInfo?.tierBadge}
                          </span>
                          <span className="text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px]">
                            Lv.{levelInfo?.level || user.level}
                          </span>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${levelInfo?.progressPercent || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                            <span className="text-emerald-400 font-semibold">
                              {(user.total_xp || 0).toLocaleString()} XP
                            </span>
                            <span>
                              {levelInfo?.xpNeededForNext ? `${levelInfo.xpNeededForNext} XP lagi ke Lv.${(levelInfo.level || user.level) + 1}` : 'Max Level'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Navigation Menu Links (HANYA UNTUK MAHASISWA) */}
                  {user.role !== 'ADMIN' && (
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/mahasiswa/profil"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        role="menuitem"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 flex items-center justify-center flex-shrink-0 transition-colors">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                            Pengaturan Profil
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Ganti codename, avatar & identitas
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/mahasiswa/capaian"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors group"
                        role="menuitem"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                            Capaian & Evaluasi
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Badge tier & riwayat perolehan XP
                          </p>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Section 4: Divider & Logout Action */}
                  <div className="p-1.5 pt-1 border-t border-[#1f293d]/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors text-left group"
                      role="menuitem"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:text-rose-300 flex items-center justify-center flex-shrink-0 transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-xs font-semibold text-rose-400 group-hover:text-rose-300">
                          Keluar dari Sesi
                        </div>
                        <p className="text-[11px] text-rose-400/70">
                          Akhiri sesi akun Anda saat ini
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Masuk dengan NIM</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
