'use client';

import React, { useState, useMemo } from 'react';
import { LeaderboardPlayer, Team, KlubHari, User, ICPC_PROBLEMS_DEF } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import UserAvatar from './UserAvatar';
import {
  Trophy,
  Swords,
  Medal,
  Flame,
  Star,
  Shield,
  Snowflake,
  CheckCircle2,
  Clock,
  HelpCircle,
  Table,
  LayoutGrid,
  Tag,
  Users,
  Info
} from 'lucide-react';

interface LeaderboardViewProps {
  players: LeaderboardPlayer[];
  teams: Team[];
  currentUser: User;
  initialFilter?: KlubHari;
  onFilterChange: (klub: 'KAMIS' | 'JUMAT' | 'ALL') => void;
}

export default function LeaderboardView({
  players,
  teams,
  currentUser,
  initialFilter = 'KAMIS',
  onFilterChange,
}: LeaderboardViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'KAMIS' | 'JUMAT' | 'ALL'>(
    initialFilter === 'ALL' ? 'KAMIS' : initialFilter
  );
  const [activeTab, setActiveTab] = useState<'matrix' | 'podium'>('matrix');
  const [isFrozen, setIsFrozen] = useState(false);

  const handleFilter = (val: 'KAMIS' | 'JUMAT' | 'ALL') => {
    setSelectedFilter(val);
    onFilterChange(val);
  };

  const filteredTeams = teams.filter(
    (t) => selectedFilter === 'ALL' || t.klub_hari === selectedFilter
  );

  // Dapatkan data matriks ICPC DOMjudge
  const { rows: icpcRows, problemStats } = useMemo(() => {
    return ArenaStore.getICPCScoreboard(selectedFilter, isFrozen);
  }, [selectedFilter, isFrozen]);

  // Top 3 Podium
  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];

  return (
    <div className="space-y-6">
      {/* 1. Header & Filter Bar */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>SCOREBOARD ICPC &amp; MATRIKS PENJURIAN DOMJUDGE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Scoreboard Kompetisi Internal Kampus
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Papan matriks resmi sistem ICPC: Problem A–G, Balon Warna, Waktu Penalti, dan Status Scoreboard Freeze.
          </p>
        </div>

        {/* View Mode & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Freeze Simulator */}
          <button
            onClick={() => setIsFrozen(!isFrozen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              isFrozen
                ? 'bg-sky-950/60 border-sky-400 text-sky-200'
                : 'bg-[#080d1a] border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Klik untuk mengaktifkan atau menonaktifkan simulasi Scoreboard Freeze"
          >
            <Snowflake className={`w-3.5 h-3.5 ${isFrozen ? 'animate-spin text-sky-300' : 'text-slate-400'}`} />
            <span>{isFrozen ? 'Scoreboard FROZEN' : 'Scoreboard LIVE'}</span>
          </button>

          {/* View Tab Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#080d1a] border border-[#1e293b]">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks ICPC</span>
            </button>
            <button
              onClick={() => setActiveTab('podium')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'podium'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Podium &amp; Tim</span>
            </button>
          </div>

          {/* Filter Buttons Kelas */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#080d1a] border border-[#1e293b]">
            {(['KAMIS', 'JUMAT', 'ALL'] as const).map((filterVal) => (
              <button
                key={filterVal}
                onClick={() => handleFilter(filterVal)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                  selectedFilter === filterVal
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filterVal === 'KAMIS' ? 'Kelas KAMIS' : filterVal === 'JUMAT' ? 'Kelas JUMAT' : 'Semua'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Freeze Status Banner */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono transition-all ${
          isFrozen
            ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {isFrozen ? (
            <Snowflake className="w-4 h-4 text-sky-300 animate-pulse" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          )}
          <span>
            {isFrozen ? (
              <>
                <strong className="text-sky-300">SCOREBOARD FROZEN (15 Menit Terakhir Dikunci):</strong> Submisi terbaru ditandai pending (<strong>?</strong>) hingga upacara pengumuman pemenang!
              </>
            ) : (
              <>
                <strong className="text-emerald-300">SCOREBOARD LIVE:</strong> Hasil penjurian diperbarui secara waktu nyata (real-time) setiap submisi masuk ke judge engine.
              </>
            )}
          </span>
        </div>

        <span className="text-[11px] text-slate-400 font-normal">
          {icpcRows.length} Peserta Terdaftar
        </span>
      </div>

      {/* 2. Problem Balloon Legend Bar */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-3.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Legenda Balon Problem Set A–Z (Standar DOMjudge):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ICPC_PROBLEMS_DEF.map((prob) => (
            <div
              key={prob.letter}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080d1a] border border-[#1e293b] text-xs font-mono"
            >
              <span className="text-sm">{prob.balloonEmoji}</span>
              <strong className="text-white">Prob {prob.letter}:</strong>
              <span className="text-slate-400 text-[11px] truncate max-w-[140px] sm:max-w-none">
                {prob.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODE 1: MATRIKS SCOREBOARD ICPC (DOMjudge Standard Table)            */}
      {/* ==================================================================== */}
      {activeTab === 'matrix' && (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#080d1a] border-b border-[#1e293b] text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-3 text-center w-12 font-bold">Rank</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Peserta / Tim</th>
                  <th className="py-3.5 px-3 text-center w-20 font-bold text-white bg-slate-900/60">Solved</th>
                  <th className="py-3.5 px-3 text-center w-24">Waktu (Penalti)</th>
                  <th className="py-3.5 px-3 text-center w-20">Total XP</th>
                  {/* Kolom Balon Problem A-G */}
                  {ICPC_PROBLEMS_DEF.map((prob) => (
                    <th
                      key={prob.letter}
                      className="py-3 px-2.5 text-center min-w-[64px] border-l border-[#1e293b]"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{prob.balloonEmoji}</span>
                        <span className="font-black text-white text-[11px] mt-0.5">{prob.letter}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162136]">
                {icpcRows.length === 0 ? (
                  <tr>
                    <td colSpan={5 + ICPC_PROBLEMS_DEF.length} className="py-12 text-center text-slate-500">
                      Tidak ada peserta terdaftar untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  icpcRows.map((row) => {
                    const isCurrentUser = row.nim === currentUser.nim;
                    const isCurrentTeam = Boolean(currentUser.id_tim && row.id_tim === currentUser.id_tim);
                    const isMyRow = isCurrentUser || isCurrentTeam;

                    return (
                      <tr
                        key={row.nim}
                        className={`transition-colors ${
                          isMyRow
                            ? 'bg-blue-950/30 hover:bg-blue-950/40 border-l-4 border-l-blue-500'
                            : 'hover:bg-[#0e1628]'
                        }`}
                      >
                        {/* 1. Rank */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              row.rank === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : row.rank === 2
                                ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                                : row.rank === 3
                                ? 'bg-amber-800/20 text-amber-400 border border-amber-700/40'
                                : 'text-slate-400'
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>

                        {/* 2. Peserta / Tim */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={{ nim: row.nim, codename: row.displayName }} size="xs" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-white text-xs truncate">
                                  {row.displayName}
                                </span>
                                {isMyRow && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                                    ANDA
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {row.nim} • {row.nama_tim ? `Squad: ${row.nama_tim}` : row.realName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Solved Count */}
                        <td className="py-3 px-3 text-center bg-slate-900/40 font-black text-sm text-emerald-400">
                          {row.solvedCount}
                        </td>

                        {/* 4. Total Penalty Time (Minutes) */}
                        <td className="py-3 px-3 text-center text-slate-300 font-mono">
                          {row.totalPenaltyTime} <span className="text-[10px] text-slate-500">min</span>
                        </td>

                        {/* 5. Total XP */}
                        <td className="py-3 px-3 text-center font-bold text-amber-400">
                          {row.totalXP}
                        </td>

                        {/* 6. Problem Cells (A through G) */}
                        {ICPC_PROBLEMS_DEF.map((prob) => {
                          const status = row.problems[prob.letter];

                          if (!status || status.attempts === 0) {
                            return (
                              <td
                                key={prob.letter}
                                className="py-2.5 px-2 text-center border-l border-[#1e293b] text-slate-600"
                              >
                                •
                              </td>
                            );
                          }

                          // Pending Freeze State (?)
                          if (status.isPendingFreeze) {
                            return (
                              <td
                                key={prob.letter}
                                className="py-2 px-1 text-center border-l border-[#1e293b]"
                              >
                                <div
                                  className="mx-auto w-12 py-1 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 font-bold flex flex-col items-center justify-center shadow-inner animate-pulse"
                                  title="Submisi diterima selama masa Scoreboard Freeze"
                                >
                                  <span className="text-xs">?</span>
                                  <span className="text-[9px] text-blue-400/80 font-normal">
                                    +{status.attempts}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          // Solved State (Accepted)
                          if (status.isSolved) {
                            const isFirst = status.isFirstSolve;

                            return (
                              <td
                                key={prob.letter}
                                className="py-2 px-1 text-center border-l border-[#1e293b]"
                              >
                                <div
                                  className={`mx-auto w-12 py-1 rounded flex flex-col items-center justify-center shadow-md ${
                                    isFirst
                                      ? 'bg-emerald-600 border-2 border-emerald-300 text-white shadow-emerald-600/30'
                                      : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                                  }`}
                                  title={
                                    isFirst
                                      ? `First to Solve! Menit ke-${status.solveTimeMinutes} (${status.attempts} percobaan)`
                                      : `Solved di menit ke-${status.solveTimeMinutes} (${status.attempts} percobaan)`
                                  }
                                >
                                  <div className="flex items-center gap-0.5 text-xs font-black">
                                    <span>{status.solveTimeMinutes}</span>
                                    {isFirst && <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />}
                                  </div>
                                  <span
                                    className={`text-[9px] font-mono ${
                                      isFirst ? 'text-emerald-100 font-bold' : 'text-emerald-400/80'
                                    }`}
                                  >
                                    {status.attempts} {status.attempts === 1 ? 'try' : 'tries'}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          // Failed State (Not passed yet)
                          return (
                            <td
                              key={prob.letter}
                              className="py-2 px-1 text-center border-l border-[#1e293b]"
                            >
                              <div
                                className="mx-auto w-12 py-1 rounded bg-rose-950/40 border border-rose-500/30 text-rose-400 font-semibold flex flex-col items-center justify-center"
                                title={`${status.attempts} percobaan gagal`}
                              >
                                <span className="text-xs font-bold">-{status.attempts}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Problem Summary Statistics */}
              <tfoot>
                <tr className="bg-[#080d1a] border-t-2 border-[#1e293b] text-slate-400 font-bold text-[10px]">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-slate-300">
                    Total Peserta Berhasil Solve (AC per Problem):
                  </td>
                  {ICPC_PROBLEMS_DEF.map((prob) => {
                    const stats = problemStats[prob.letter] || { solvedCount: 0, totalAttempts: 0 };
                    return (
                      <td
                        key={prob.letter}
                        className="py-3 px-2 text-center border-l border-[#1e293b] text-emerald-400 font-mono text-xs"
                      >
                        <span className="font-extrabold">{stats.solvedCount}</span>
                        <div className="text-[9px] text-slate-500 font-normal">
                          {stats.totalAttempts} att
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 2: PODIUM & KLASEMEN TIM                                        */}
      {/* ==================================================================== */}
      {activeTab === 'podium' && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {players.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Juara 2 (Perak) */}
              {top2 && (
                <div className="rounded-xl bg-[#0b1120] border border-slate-700/50 p-5 shadow-xl text-center relative overflow-hidden flex flex-col items-center justify-center order-2 md:order-1">
                  <span className="text-3xl mb-1">🥈</span>
                  <div className="w-16 h-16 rounded-xl bg-slate-700/20 border border-slate-600/40 flex items-center justify-center text-3xl shadow-md my-2">
                    {top2.avatar || '⚡'}
                  </div>
                  <div className="font-extrabold text-white text-sm truncate max-w-full">
                    {top2.codename}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {top2.nim} • Kelas {top2.klub_hari}
                  </div>
                  <div className="mt-3 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-200 font-bold">
                    {top2.total_xp} XP
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Lv.{top2.level} • Nilai: {top2.rata_nilai}
                  </div>
                </div>
              )}

              {/* Juara 1 (Emas - Center, Highlighted) */}
              {top1 && (
                <div className="rounded-xl bg-[#0d1527] border-2 border-amber-500/50 p-6 shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center order-1 md:order-2 md:-translate-y-2">
                  <span className="text-4xl mb-1">👑</span>
                  <div className="w-20 h-20 rounded-xl bg-amber-500/15 border-2 border-amber-400/40 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/10 my-2">
                    {top1.avatar || '👑'}
                  </div>
                  <div className="font-black text-amber-300 text-base tracking-wide truncate max-w-full">
                    {top1.codename}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {top1.nim} • Kelas {top1.klub_hari}
                  </div>
                  <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-sm font-mono text-amber-300 font-black shadow-lg">
                    {top1.total_xp} XP
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono mt-1 font-semibold">
                    Lv.{top1.level} Champion • Nilai Rata: {top1.rata_nilai}
                  </div>
                </div>
              )}

              {/* Juara 3 (Perunggu) */}
              {top3 && (
                <div className="rounded-xl bg-[#0b1120] border border-amber-700/40 p-5 shadow-xl text-center relative overflow-hidden flex flex-col items-center justify-center order-3">
                  <span className="text-3xl mb-1">🥉</span>
                  <div className="w-16 h-16 rounded-xl bg-amber-900/20 border border-amber-700/40 flex items-center justify-center text-3xl shadow-md my-2">
                    {top3.avatar || '⚡'}
                  </div>
                  <div className="font-extrabold text-white text-sm truncate max-w-full">
                    {top3.codename}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {top3.nim} • Kelas {top3.klub_hari}
                  </div>
                  <div className="mt-3 px-3 py-1 rounded-full bg-amber-900/40 border border-amber-800/40 text-xs font-mono text-amber-300 font-bold">
                    {top3.total_xp} XP
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Lv.{top3.level} • Nilai: {top3.rata_nilai}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grid Dua Kolom: Peringkat Individu + Klasemen Tim */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Peringkat Individu */}
            <div className="lg:col-span-8 bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm tracking-wide">
                    Peringkat Individu Mahasiswa
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {players.length} Mahasiswa
                </span>
              </div>

              <div className="divide-y divide-[#162136]">
                {players.map((p, idx) => {
                  const isMe = p.nim === currentUser.nim;
                  return (
                    <div
                      key={p.nim}
                      className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors font-mono ${
                        isMe
                          ? 'bg-blue-950/40 border border-blue-500/30'
                          : 'hover:bg-[#0e1628]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-[#111827] border border-[#1f293d] flex items-center justify-center text-lg">
                          {p.avatar || '⚡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white text-xs">
                              {p.codename}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({p.nim})
                            </span>
                            {isMe && (
                              <span className="text-[9px] bg-blue-500 text-white px-2 py-0.2 rounded font-bold">
                                ANDA
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Kelas {p.klub_hari} • Lv. {p.level} • Rata-rata Nilai:{' '}
                            <span className="text-emerald-400 font-bold">{p.rata_nilai}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <div className="font-extrabold text-amber-400 text-xs sm:text-sm">
                          {p.total_xp} <span className="text-[10px] text-amber-500/80 font-normal">XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kolom Kanan: Klasemen Team Battle */}
            <div className="lg:col-span-4 bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
                <Swords className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Klasemen Team Battle
                </h3>
              </div>

              {filteredTeams.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  Belum ada tim terbentuk pada kelas ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTeams
                    .sort((a, b) => b.total_skor_tim - a.total_skor_tim)
                    .map((team, idx) => {
                      const isMyTeam = Boolean(
                        currentUser && (
                          currentUser.id_tim === team.id_tim || 
                          team.daftar_nim_json.includes(currentUser.nim)
                        )
                      );

                      return (
                        <div
                          key={team.id_tim}
                          className={`p-3 rounded-xl border transition-colors text-xs font-mono ${
                            isMyTeam
                              ? 'bg-[#0f1b33] border-blue-500/50 shadow-sm'
                              : 'bg-[#080d1a] border-[#1e293b] hover:border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              <span>#{idx + 1} {team.nama_tim}</span>
                              {isMyTeam && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                                  TIM ANDA
                                </span>
                              )}
                            </div>
                            <div className="text-blue-400 font-extrabold shrink-0">
                              {team.total_skor_tim} XP
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Kelas {team.klub_hari} • {team.daftar_nim_json.length}/3 Anggota</span>
                            {team.kode_gabung && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                [{team.kode_gabung}]
                              </span>
                            )}
                          </div>
                          {team.daftar_nama_json.length > 0 && (
                            <div className="text-[10px] text-slate-400 truncate mt-1 pt-1 border-t border-slate-800/60 flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{team.daftar_nama_json.map(n => n.split(' (')[0]).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
