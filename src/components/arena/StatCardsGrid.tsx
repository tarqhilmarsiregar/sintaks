'use client';

import React from 'react';

interface StatCardsGridProps {
  stats: {
    totalGamesSelesai: number;
    totalGamesKelas: number;
    jadwalKlubLabel: string;
    rataRataNilaiAkhir: number;
    nilaiTerbaik: number;
    totalXP: number;
    level: number;
    xpNeededForNext: number;
    diagnostikStatus: string;
    diagnostikSubtitle: string;
  };
}

export default function StatCardsGrid({ stats }: StatCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Card 1: Kelas & Game Selesai */}
      <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-blue-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          KELAS & GAME SELESAI
        </div>
        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-mono">
          {stats.totalGamesSelesai} / {stats.totalGamesKelas}{' '}
          <span className="text-base font-normal text-slate-400">Game</span>
        </div>
        <div className="mt-1.5 text-xs text-blue-400 font-medium">
          Jadwal Klub: <strong className="text-blue-300 font-semibold">{stats.jadwalKlubLabel}</strong>
        </div>
      </div>

      {/* Card 2: Rata-Rata Nilai Akhir */}
      <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-emerald-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          RATA-RATA NILAI AKHIR
        </div>
        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
          {stats.rataRataNilaiAkhir}
        </div>
        <div className="mt-1.5 text-xs text-slate-400">
          Nilai Terbaik: <span className="text-slate-200 font-semibold">{stats.nilaiTerbaik}</span>
        </div>
      </div>

      {/* Card 3: Total Skor XP & Level */}
      <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          TOTAL SKOR XP & LEVEL
        </div>
        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
          {stats.totalXP} <span className="text-base font-semibold text-amber-500/80">XP</span>
        </div>
        <div className="mt-1.5 text-xs text-slate-400 font-mono">
          Level {stats.level} <span className="text-slate-500">(Kurang {stats.xpNeededForNext} XP ke Lv.{stats.level + 1})</span>
        </div>
      </div>

      {/* Card 4: Status Diagnostik */}
      <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-rose-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          STATUS DIAGNOSTIK
        </div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <span>{stats.diagnostikStatus}</span>
        </div>
        <div className="mt-1.5 text-xs text-slate-400">
          {stats.diagnostikSubtitle}
        </div>
      </div>
    </div>
  );
}

