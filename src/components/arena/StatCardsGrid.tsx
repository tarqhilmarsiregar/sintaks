'use client';

import React from 'react';

export interface ArenaUserStats {
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
}

interface StatCardsGridProps {
  stats: ArenaUserStats;
}

export default function StatCardsGrid({ stats }: StatCardsGridProps) {
  // Format rata-rata nilai secara aman (maksimal 1 desimal)
  const formattedAverage =
    typeof stats.rataRataNilaiAkhir === 'number'
      ? stats.rataRataNilaiAkhir.toFixed(1)
      : stats.rataRataNilaiAkhir;

  // Persentase penyelesaian paket soal
  const solvePercentage = Math.min(
    100,
    Math.round((stats.totalGamesSelesai / Math.max(1, stats.totalGamesKelas)) * 100)
  );

  // Persentase XP menuju level berikutnya (berdasarkan estimasi interval 1000 XP)
  const xpProgressPercent = Math.min(
    100,
    Math.max(8, 100 - Math.round(((stats.xpNeededForNext || 0) / 1000) * 100))
  );

  // Bersihkan karakter emoji ganda pada status diagnostik jika ada
  const cleanDiagnostic = stats.diagnostikStatus.replace(/^[^\w\s]+/, '').trim() || stats.diagnostikStatus;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Card 1: Soal Selesai */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-blue-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          SOAL TERSELESAIKAN
        </div>
        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-mono">
          {stats.totalGamesSelesai} / {stats.totalGamesKelas}{' '}
          <span className="text-sm font-normal text-slate-400">Soal</span>
        </div>
        <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${solvePercentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Jadwal: <strong className="text-slate-200 font-medium">{stats.jadwalKlubLabel}</strong></span>
          <span className="font-mono text-[11px] text-blue-400 font-semibold">{solvePercentage}%</span>
        </div>
      </div>

      {/* Card 2: Rata-Rata Nilai Akhir */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-emerald-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          RATA-RATA NILAI AKHIR
        </div>
        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
          {formattedAverage}
        </div>
        <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, Number(formattedAverage)))}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Nilai Terbaik: <strong className="text-slate-200 font-medium">{stats.nilaiTerbaik}</strong></span>
          <span className="font-mono text-[11px] text-emerald-400 font-semibold">Skala 100</span>
        </div>
      </div>

      {/* Card 3: Total Skor XP & Level */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          TOTAL SKOR XP & LEVEL
        </div>
        <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
          {(stats.totalXP || 0).toLocaleString()}{' '}
          <span className="text-sm font-semibold text-amber-500/80">XP</span>
        </div>
        <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${xpProgressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="text-slate-300 font-semibold">Level {stats.level}</span>
          <span className="text-[11px] text-amber-400/90">
            {stats.xpNeededForNext ? `${stats.xpNeededForNext} XP ke Lv.${stats.level + 1}` : 'Max Tier'}
          </span>
        </div>
      </div>

      {/* Card 4: Status Diagnostik */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          STATUS DIAGNOSTIK
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#131d33] border border-[#223354] text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{cleanDiagnostic}</span>
          </span>
        </div>
        <div className="mt-3.5 pt-2 border-t border-[#1e293b] text-xs text-slate-400 truncate">
          {stats.diagnostikSubtitle}
        </div>
      </div>
    </div>
  );
}

