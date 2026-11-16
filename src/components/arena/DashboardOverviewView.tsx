'use client';

import React, { useMemo } from 'react';
import { Game, Submission, User, LeaderboardPlayer, Team } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { StudentActiveMenu } from './StudentSidebar';
import StatCardsGrid, { ArenaUserStats } from './StatCardsGrid';
import UserAvatar from './UserAvatar';
import { SITE_CONFIG } from '@/config/site';
import {
  Code2,
  Terminal,
  Trophy,
  Users,
  ArrowRight,
  Play,
  CheckCircle2,
  Flame,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface DashboardOverviewViewProps {
  stats: ArenaUserStats;
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
  // Ambil tim user saat ini (memoized)
  const myTeam = useMemo(() => {
    return teams.find(
      (t) =>
        t.id_tim === currentUser.id_tim ||
        (t.daftar_nim_json && t.daftar_nim_json.includes(currentUser.nim))
    );
  }, [teams, currentUser]);

  // Status game untuk user (dinamis sesuai kohort/kelas)
  const getGameStatus = (g: Game) => {
    return ArenaStore.getGameStatusForUser(g, currentUser);
  };

  // Top 5 pemain kelas (memoized)
  const topPlayers = useMemo(() => {
    return leaderboardPlayers.slice(0, 5);
  }, [leaderboardPlayers]);

  // Indikator target rival/peringkat berikutnya
  type RankMotivationState =
    | { isLeader: true }
    | { isLeader: false; rivalRank: number; rivalCodename: string; xpDiff: number }
    | null;

  const rankMotivation = useMemo<RankMotivationState>(() => {
    const myIndex = leaderboardPlayers.findIndex((p) => p.nim === currentUser.nim);
    if (myIndex === 0) {
      return { isLeader: true };
    }
    if (myIndex > 0) {
      const rival = leaderboardPlayers[myIndex - 1];
      const xpDiff = Math.max(0, (rival.total_xp || 0) - (currentUser.total_xp || 0));
      return {
        isLeader: false,
        rivalRank: myIndex,
        rivalCodename: rival.codename,
        xpDiff,
      };
    }
    return null;
  }, [leaderboardPlayers, currentUser]);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Mission Card (Industrial Monochrome) */}
      <div className="rounded-xl bg-[#0b1120] border border-[#1e293b] p-5 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131d33] border border-[#223354] text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>{SITE_CONFIG.fullName}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat datang kembali,{' '}
              <span className="text-white font-mono">{currentUser.codename}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Sesi aktif terdaftar pada <strong className="text-slate-200 font-semibold">Kelas {currentUser.klub_hari}</strong>{currentUser.periode ? ` • ${currentUser.periode}` : ''}.
              Selesaikan problem set algoritma mingguan, pelajari editorial pembahasan dosen, dan kumpulkan poin XP untuk meningkatkan peringkat klasemen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('katalog')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              <span>Buka Arsip Soal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Kartu Statistik Utama dengan Micro-Progress Indicators */}
      <StatCardsGrid stats={stats} />

      {/* 3. Grid 2 Kolom: Paket Soal Algoritma & Leaderboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tantangan Soal & Status Tim (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Paket Soal Algoritma */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-4 border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Paket Soal Algoritma
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('katalog')}
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 transition-colors"
              >
                <span>Semua Soal ({games.length})</span>
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
                    className="p-3.5 rounded-lg bg-[#080d1a] border border-[#1e293b] hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-slate-300 font-semibold px-2 py-0.5 rounded bg-[#131d33] border border-[#223354]">
                          {game.id_game} • {game.ref_pertemuan}
                        </span>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                            game.kesulitan === 'Easy'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : game.kesulitan === 'Medium'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {game.kesulitan}
                        </span>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                            isDone
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                              : status === 'OPEN'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : status === 'ENDED'
                              ? 'bg-[#0f172a] text-slate-400 border border-[#1e293b]'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isDone ? 'AC / SELESAI' : status === 'OPEN' ? 'AKTIF' : status}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                        {game.judul_game}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                        Materi: {game.kategori_materi} • Mode {game.mode_game}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isDone && userSub ? (
                        <button
                          onClick={() => onViewEditorial(game, userSub)}
                          className="px-3 py-1.5 rounded-lg bg-[#131d33] hover:bg-[#1a2744] border border-[#223354] text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>Editorial</span>
                        </button>
                      ) : status === 'OPEN' ? (
                        <button
                          onClick={() => onOpenGame(game)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Kerjakan</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono px-2 py-1">
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
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-[#1e293b] pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Status Squad Tim (Snake-Draft)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('team')}
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 transition-colors"
              >
                <span>Arena Tim →</span>
              </button>
            </div>

            {myTeam ? (
              <div className="p-3.5 rounded-lg bg-[#080d1a] border border-[#1e293b] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>⚔️ {myTeam.nama_tim}</span>
                    <span className="text-[11px] font-mono text-slate-300 px-2 py-0.5 rounded bg-[#131d33] border border-[#223354]">
                      Kelas {myTeam.klub_hari}
                    </span>
                  </div>
                  <div className="font-extrabold text-amber-400 font-mono text-sm">
                    {myTeam.total_skor_tim.toLocaleString()} XP
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
                          ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 font-bold'
                          : 'bg-[#111827] border-[#1e293b] text-slate-300'
                      }`}
                    >
                      {nim === currentUser.nim ? `★ Anda (${nim})` : (myTeam.daftar_nama_json?.[i] || nim)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#080d1a] border border-[#1e293b] text-center text-xs text-slate-400 font-mono">
                Belum ada pembagian tim untuk kelas ini. Tim akan di-generate oleh Dosen Pembina.
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Top 5 Leaderboard Preview (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3 border-b border-[#1e293b] pb-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-wide">
                  Top 5 Klasemen Mahasiswa
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#131d33] border border-[#223354] text-slate-300">
                Kelas {currentUser.klub_hari}
              </span>
            </div>

            <div className="space-y-2">
              {topPlayers.map((player, idx) => {
                const isMe = player.nim === currentUser.nim;
                const medal =
                  idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                const formattedNilai =
                  typeof player.rata_nilai === 'number'
                    ? player.rata_nilai.toFixed(1)
                    : player.rata_nilai;

                return (
                  <div
                    key={player.nim}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-colors ${
                      isMe
                        ? 'bg-blue-950/30 border-blue-500/50 shadow-sm'
                        : 'bg-[#080d1a] border-[#1e293b] hover:bg-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 text-center font-bold text-sm shrink-0">
                        {medal}
                      </span>
                      <UserAvatar user={{ codename: player.codename, nim: player.nim }} size="xs" />
                      <div className="truncate">
                        <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                          <span>{player.codename}</span>
                          {isMe && (
                            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                              ANDA
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Lv.{player.level} • Nilai: {formattedNilai}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="font-extrabold text-amber-400 text-xs">
                        {(player.total_xp || 0).toLocaleString()} <span className="text-[11px] text-amber-500/80 font-normal">XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Micro-Motivation Widget: Gap to next rank */}
            {rankMotivation && rankMotivation.isLeader && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Anda memimpin peringkat #1 di Kelas {currentUser.klub_hari}!</span>
              </div>
            )}

            {rankMotivation && !rankMotivation.isLeader && (
              <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-[#080d1a] border border-[#1e293b] text-xs font-mono text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Peringkat:</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-bold">+{rankMotivation.xpDiff.toLocaleString()} XP</span>
                  <span className="text-slate-400 text-[11px] ml-1">menuju #{rankMotivation.rivalRank}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="w-full mt-3.5 py-2.5 rounded-lg bg-[#0f172a] hover:bg-[#162238] border border-[#1e293b] text-blue-400 hover:text-blue-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
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
