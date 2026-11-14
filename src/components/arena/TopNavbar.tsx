'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types/arena';
import { LogOut, Shield, Zap } from 'lucide-react';

interface TopNavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export default function TopNavbar({ user, onLogout }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-[#1f293d] px-4 lg:px-6 py-2.5">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link
          href={user?.role === 'ADMIN' ? '/admin' : '/mahasiswa'}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <img
            src="/logo-stmik-time.png"
            alt="Logo STMIK TIME"
            className="w-10 h-10 object-contain drop-shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-wide font-sans">
                STMIK TIME — CP ARENA
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v2.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Klub Akademik Programming (Problem Solving)
            </p>
          </div>
        </Link>

        {/* User Identity Chip & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Command Center Dosen</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2 bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-base select-none">{user.avatar || '⚡'}</span>
                <span className="font-bold text-white text-xs sm:text-sm font-mono">
                  {user.codename} <span className="text-slate-400 font-normal">({user.nim})</span>
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-300 border-l border-slate-700 pl-2.5">
                <span className="text-amber-400 font-semibold">Lv.{user.level}</span>
                <span className="text-slate-400">✦</span>
                <span className="text-cyan-400">{user.tier_badge}</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-400 font-bold">{user.total_xp} XP</span>
              </div>

              <button
                onClick={onLogout}
                className="ml-1 sm:ml-2 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center gap-1 font-sans"
                title="Keluar dari sesi"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
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

