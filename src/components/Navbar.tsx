'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, Code2, Award, FileText, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { UserProfile } from '@/types';
import { getClientSession, clearClientSession } from '@/lib/auth/student-auth';
import { SITE_CONFIG } from '@/config/site';

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial session
    const current = getClientSession();
    setUser(current);

    // Listen for storage changes if multiple tabs
    const handleStorage = () => {
      setUser(getClientSession());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    clearClientSession();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-arena-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-[#111827] border border-[#1f293d] flex items-center justify-center shadow-sm group-hover:border-blue-500/50 transition-colors">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight font-mono text-white">
                {SITE_CONFIG.brandMark}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131d33] text-blue-400 border border-[#223354] uppercase font-semibold">
                {SITE_CONFIG.subname}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{SITE_CONFIG.institution.name}</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/contests"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Kontes</span>
          </Link>

          <Link
            href="/problems"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Bank Soal</span>
          </Link>

          <Link
            href="/contests/pam-2026/scoreboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Scoreboard ICPC</span>
          </Link>

          <Link
            href="/submissions"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Submisi</span>
          </Link>

          {user && (user.role === 'lecturer' || user.role === 'admin') && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Panel Dosen</span>
            </Link>
          )}
        </nav>

        {/* User Account / NIM Login Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-arena-card border border-arena-border hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-bold text-blue-400">
                  {user.nim.substring(0, 2)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>{user.full_name}</span>
                    {user.role === 'lecturer' && (
                      <span className="text-[9px] px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded">
                        Dosen
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">NIM: {user.nim}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-arena-card border border-arena-border rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-arena-border mb-1">
                    <p className="text-xs font-semibold text-white">{user.full_name}</p>
                    <p className="text-[11px] font-mono text-slate-400">NIM: {user.nim}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{user.class_group}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] bg-arena-dark p-1.5 rounded border border-arena-border">
                      <span className="text-slate-400">Rating CP:</span>
                      <span className="font-mono font-bold text-amber-400">{user.rating}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30"
            >
              <User className="w-4 h-4" />
              <span>Masuk dengan NIM</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
