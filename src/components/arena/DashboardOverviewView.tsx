'use client';

import React from 'react';
import { Game, Submission, User, LeaderboardPlayer, Team } from '@/types/arena';
import { StudentActiveMenu } from './StudentSidebar';
import StatCardsGrid from './StatCardsGrid';
import {
  Gamepad2,
  Trophy,
  Swords,
  ArrowRight,
  Clock,
  Play,
  CheckCircle2,
  Flame,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface DashboardOverviewViewProps {
  stats: any;
  currentUser: User;
  games: Game[];
  submissions: Submission[];
  leaderboardPlayers: LeaderboardPlayer[];
  teams: Team[];
  onOpenGame: (game: Game) => void;
  onViewEditorial: (game: Game, sub: Submission) => void;
  onNavigateTab: (tab: StudentActiveMenu) => void;
}

export default function DashboardOverviewView({
  stats,
  currentUser,
  games,
  submissions,
  leaderboardPlayers,
  teams,
  onOpenGame,
  onViewEditorial,
  onNavigateTab,
}: DashboardOverviewViewProps) {
  // Ambil tim user saat ini
  const myTeam = teams.find(
    (t) =>
      t.id_tim === currentUser.id_tim ||
      (t.daftar_nim_json && t.daftar_nim_json.includes(currentUser.nim))
  );

  // Status game untuk user
  const getGameStatus = (g: Game) => {
    return currentUser.klub_hari === 'JUMAT' ? g.status_jumat : g.status_kamis;
  };

  // Game yang siap dimainkan atau sedang berlangsung
  const actionableGames = games.filter((g) => {
    const status = getGameStatus(g);
    const sub = submissions.find((s) => s.id_game === g.id_game && s.nim === currentUser.nim);
    return status === 'OPEN' || (sub && sub.status_sesi === 'DONE');
  });

  // Top 5 pemain kelas
  const topPlayers = leaderboardPlayers.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#0d1629] to-[#0b101e] border border-[#1e293b] p-5 sm:p-7 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Glow ornament */}
        <div className="absolute top-0 right-0 w-80 h-full bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STMIK TIME — Competitive Programming Arena</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat datang kembali,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {currentUser.codename}
              </span>
              ! ⚡
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Jadwal Anda terdaftar pada <strong className="text-white">Kelas {currentUser.klub_hari}</strong>.
              Selesaikan paket game mingguan, evaluasi pembahasan dosen, dan kumpulkan poin XP untuk naik peringkat klasemen!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('katalog')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Buka Katalog Game</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Kartu Statistik Utama (Tetap Sesuai Screenshot Asli) */}
      <StatCardsGrid stats={stats} />

      {/* 3. Grid 2 Kolom: Aktivitas & Leaderboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tantangan Game & Submisi Terkini (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Tantangan Game Siap Main */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-4 border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Tantangan Game Pilihan
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('katalog')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua ({games.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {games.slice(0, 3).map((game) => {
                const status = getGameStatus(game);
                const userSub = submissions.find(
                  (s) => s.id_game === game.id_game && s.nim === currentUser.nim
                );
                const isDone = userSub?.status_sesi === 'DONE';

                return (
                  <div
                    key={game.id_game}
                    className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e293b] hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30">
                          {game.id_game} • {game.ref_pertemuan}
                        </span>
                        <span
                          className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-semibold ${
                            game.kesulitan === 'Easy'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : game.kesulitan === 'Medium'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {game.kesulitan}
                        </span>
                        <span
                          className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-semibold ${
                            isDone
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                              : status === 'OPEN'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 animate-pulse'
                              : status === 'ENDED'
                              ? 'bg-slate-900 text-slate-400 border border-slate-700/50'
                              : 'bg-amber-950/70 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isDone ? 'SELESAI' : status}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                        {game.judul_game}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        Kategori: {game.kategori_materi} • Mode {game.mode_game}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isDone && userSub ? (
                        <button
                          onClick={() => onViewEditorial(game, userSub)}
                          className="px-3 py-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Editorial</span>
                        </button>
                      ) : status === 'OPEN' ? (
                        <button
                          onClick={() => onOpenGame(game)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Mainkan</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono px-2 py-1">
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Status Squad Tim Snake-Draft */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-[#1e293b] pb-2.5">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Status Tim Mahasiswa (Snake-Draft)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('team')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                <span>Arena Tim →</span>
              </button>
            </div>

            {myTeam ? (
              <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>⚔️ {myTeam.nama_tim}</span>
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                      Kelas {myTeam.klub_hari}
                    </span>
                  </div>
                  <div className="font-extrabold text-cyan-400 font-mono text-sm">
                    {myTeam.total_skor_tim} XP
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Anggota Squad ({myTeam.daftar_nim_json.length} orang):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {myTeam.daftar_nim_json.map((nim, i) => (
                    <span
                      key={nim}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                        nim === currentUser.nim
                          ? 'bg-blue-600/30 border-blue-500/60 text-blue-200 font-bold'
                          : 'bg-[#111827] border-[#1e293b] text-slate-300'
                      }`}
                    >
                      {nim === currentUser.nim ? `★ Anda (${nim})` : (myTeam.daftar_nama_json?.[i] || nim)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e293b] text-center text-xs text-slate-400 font-mono">
                Belum ada pembagian tim untuk kelas ini. Tim akan di-generate oleh Dosen Pembina.
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Top 5 Leaderboard Preview (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-[#1e293b] pb-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Top 5 Leaderboard Pemain
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111827] border border-[#1e293b] text-slate-400">
                Kelas {currentUser.klub_hari}
              </span>
            </div>

            <div className="space-y-2">
              {topPlayers.map((player, idx) => {
                const isMe = player.nim === currentUser.nim;
                const medal =
                  idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                return (
                  <div
                    key={player.nim}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-colors ${
                      isMe
                        ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                        : 'bg-[#080d1a] border-[#1e293b] hover:bg-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 text-center font-bold text-sm shrink-0">
                        {medal}
                      </span>
                      <span className="text-base shrink-0">{player.avatar || '⚡'}</span>
                      <div className="truncate">
                        <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                          <span>{player.codename}</span>
                          {isMe && (
                            <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold">
                              ANDA
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lv.{player.level} • Nilai Rata: {player.rata_nilai}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="font-extrabold text-amber-400 text-xs">
                        {player.total_xp} <span className="text-[10px] text-amber-500/70 font-normal">XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="w-full mt-3.5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#162238] border border-[#1e293b] text-cyan-400 hover:text-cyan-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Lihat Klasemen Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

