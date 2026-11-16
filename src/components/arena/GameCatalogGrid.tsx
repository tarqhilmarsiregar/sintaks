'use client';

import React, { useState, useMemo } from 'react';
import { Game, Submission, User, ICPC_PROBLEMS_DEF } from '@/types/arena';
import { Problem } from '@/types';
import { getCodingProblemForGame } from '@/lib/problem-mapping';
import { ArenaStore } from '@/lib/arena-store';
import { Search, Clock, Target, CheckCircle2, Lock, BookOpen, Play, Code2 } from 'lucide-react';

interface GameCatalogGridProps {
  games: Game[];
  submissions: Submission[];
  currentUser: User | null;
  onOpenGame: (game: Game) => void;
  onViewEditorial: (game: Game, submission: Submission) => void;
  onStartCoding?: (problem: Problem, game: Game) => void;
}

export default function GameCatalogGrid({
  games,
  submissions,
  currentUser,
  onOpenGame,
  onViewEditorial,
  onStartCoding,
}: GameCatalogGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterMeeting, setFilterMeeting] = useState('ALL');

  // Helper untuk menentukan status game untuk user yang sedang aktif secara dinamis
  const getGameStatusForUser = (game: Game): 'UPCOMING' | 'OPEN' | 'FROZEN' | 'ENDED' => {
    return ArenaStore.getGameStatusForUser(game, currentUser);
  };

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Search
      const matchesSearch =
        game.judul_game.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.kategori_materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.id_game.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status
      const statusUser = getGameStatusForUser(game);
      const userSub = submissions.find(s => s.id_game === game.id_game && s.nim === currentUser?.nim);
      const isDone = userSub?.status_sesi === 'DONE';

      if (filterStatus === 'DONE' && !isDone) return false;
      if (filterStatus === 'OPEN' && (statusUser !== 'OPEN' || isDone)) return false;
      if (filterStatus === 'UPCOMING' && statusUser !== 'UPCOMING') return false;
      if (filterStatus === 'ENDED' && statusUser !== 'ENDED') return false;

      // Kesulitan
      if (filterDifficulty !== 'ALL' && game.kesulitan !== filterDifficulty) return false;

      // Pertemuan
      if (filterMeeting !== 'ALL' && game.ref_pertemuan !== filterMeeting) return false;

      return true;
    });
  }, [games, submissions, currentUser, searchQuery, filterStatus, filterDifficulty, filterMeeting]);

  const uniqueMeetings = useMemo(() => {
    const list = Array.from(new Set(games.map(g => g.ref_pertemuan)));
    return list;
  }, [games]);

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-[#0f172a]/80 p-3 rounded-xl border border-[#1e293b]">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama/kategori game"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1f293d] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Dropdown Status */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="OPEN">Status: OPEN</option>
            <option value="UPCOMING">Status: UPCOMING</option>
            <option value="ENDED">Status: ENDED</option>
            <option value="DONE">Sudah Selesai (DONE)</option>
          </select>
        </div>

        {/* Dropdown Kesulitan */}
        <div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Kesulitan</option>
            <option value="Easy">Kesulitan: Easy</option>
            <option value="Medium">Kesulitan: Medium</option>
            <option value="Hard">Kesulitan: Hard</option>
          </select>
        </div>

        {/* Dropdown Pertemuan */}
        <div>
          <select
            value={filterMeeting}
            onChange={(e) => setFilterMeeting(e.target.value)}
            className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Pertemuan</option>
            {uniqueMeetings.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Game Cards Grid (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGames.map((game) => {
          const userStatus = getGameStatusForUser(game);
          const sub = submissions.find(
            s => s.id_game === game.id_game && s.nim === currentUser?.nim && s.status_sesi === 'DONE'
          );

          // Warna badge kesulitan
          const diffBadge =
            game.kesulitan === 'Easy'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : game.kesulitan === 'Medium'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

          // Status Izin Akses Sesuai Kohort
          const isAllowed = ArenaStore.isGameAllowedForUser(currentUser, game.id_game);

          // Warna badge status
          const statusBadge =
            !isAllowed
              ? 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              : userStatus === 'OPEN'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : userStatus === 'UPCOMING'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : userStatus === 'FROZEN'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-slate-700/40 text-slate-400 border-slate-600/40';

          const totalSoal = game.total_soal || 4;

          return (
            <div
              key={game.id_game}
              className="bg-[#0b1120] border border-[#1e293b] hover:border-slate-600/60 rounded-xl p-4 flex flex-col justify-between shadow-md transition-all relative overflow-hidden"
            >
              <div>
                {/* Header Card: ID, Ref Pertemuan, Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const icpcProb = ICPC_PROBLEMS_DEF.find(p => p.gameId === game.id_game);
                      return icpcProb ? (
                        <span className="px-2 py-0.5 rounded bg-[#162032] border border-[#1f293d] font-mono font-black text-white text-[11px] flex items-center gap-1 shadow-sm">
                          <span>{icpcProb.balloonEmoji}</span>
                          <span>Prob {icpcProb.letter}</span>
                        </span>
                      ) : null;
                    })()}
                    <span className="text-xs font-mono text-blue-400 font-semibold">
                      {game.id_game} • {game.ref_pertemuan} ({game.mode_game})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded border font-semibold ${diffBadge}`}>
                      {game.kesulitan}
                    </span>
                    <span className={`px-2 py-0.5 rounded border font-semibold ${statusBadge}`}>
                      {!isAllowed ? 'TERKUNCI KELAS' : userStatus}
                    </span>
                  </div>
                </div>

                {/* Judul Game */}
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug tracking-tight">
                  {game.judul_game}
                </h3>

                {/* Kategori */}
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Kategori: <span className="text-slate-300">{game.kategori_materi}</span>
                </p>

                {/* Pills Spesifikasi */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono text-slate-300">
                  <span className="flex items-center gap-1 bg-[#162032] px-2 py-1 rounded border border-[#1f293d]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {totalSoal} Soal
                  </span>
                  <span className="flex items-center gap-1 bg-[#162032] px-2 py-1 rounded border border-[#1f293d]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {game.durasi_total_menit}m ({game.durasi_per_soal_detik}s/soal)
                  </span>
                  <span className="flex items-center gap-1 bg-[#162032] px-2 py-1 rounded border border-[#1f293d]">
                    <Target className="w-3 h-3 text-emerald-400" />
                    Lulus ≥{game.min_nilai_lulus}
                  </span>
                </div>

                {/* Target Problem Solving Terkait */}
                {(() => {
                  const prob = getCodingProblemForGame(game.id_game);
                  if (!prob) return null;
                  return (
                    <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d1424] border border-[#1e293b] text-[11px] font-mono text-slate-300">
                      <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-400">Target Coding:</span>
                      <span className="text-white font-medium truncate" title={prob.title}>{prob.title}</span>
                    </div>
                  );
                })()}

                {/* Ketuntasan Soal Text */}
                <div className="mt-3.5 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">Ketuntasan Soal:</span>
                  <span className="text-slate-200 font-semibold">
                    {sub ? `${sub.jumlah_benar}/${sub.total_soal} Soal Benar` : `0/${totalSoal} Soal`}
                  </span>
                </div>

                {/* Hasil Pengerjaan (Jika Submisi Selesai) */}
                {sub && (
                  <div className="mt-3 bg-[#0d1626] border border-blue-900/40 rounded-lg p-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">
                        Nilai Akhir:{' '}
                        <strong className={sub.nilai_akademik >= game.min_nilai_lulus ? 'text-emerald-400' : 'text-rose-400'}>
                          {sub.nilai_akademik}/100 ({sub.status_lulus})
                        </strong>
                      </span>
                      <span className="text-amber-400 font-bold">{sub.skor_xp} XP</span>
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>
                        {sub.tab_switch_count === 0
                          ? '✓ Bersih Tanpa Pindah Tab (0 Penalti)'
                          : `⚠️ Terdeteksi ${sub.tab_switch_count}x Pindah Tab (-${sub.tab_switch_count * 5} Penalti)`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2">
                {sub ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => onViewEditorial(game, sub)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#131d33] hover:bg-[#1a2942] border border-[#223354] text-slate-200 hover:text-white font-mono font-semibold text-xs shadow-sm transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Hasil &amp; Pembahasan Kuis</span>
                    </button>

                    {getCodingProblemForGame(game.id_game) && onStartCoding && (
                      <button
                        onClick={() => {
                          const prob = getCodingProblemForGame(game.id_game);
                          if (prob) onStartCoding(prob, game);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 hover:text-white font-mono font-semibold text-xs shadow-sm transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Tantangan Koding Online Judge</span>
                      </button>
                    )}
                  </div>
                ) : !isAllowed ? (
                  <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#0f172a] border border-[#1e293b] text-slate-500 font-semibold text-xs select-none">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Terkunci (Di Luar Akses Kelas)</span>
                  </div>
                ) : userStatus === 'OPEN' ? (
                  <button
                    onClick={() => onOpenGame(game)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Kerjakan Paket Kuis</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#0f172a] border border-[#1e293b] text-slate-500 font-semibold text-xs select-none">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Status: {userStatus}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

