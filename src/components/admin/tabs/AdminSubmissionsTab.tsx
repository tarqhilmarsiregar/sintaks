'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Submission, Game, User, Cohort, ICPC_PROBLEMS_DEF } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import ModalPortal from '@/components/common/ModalPortal';
import {
  ListChecks,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Trash2,
  X,
  Filter,
} from 'lucide-react';

interface AdminSubmissionsTabProps {
  submissions: Submission[];
  games: Game[];
  users: User[];
  cohorts?: Cohort[];
  onRefresh: () => void;
  onAlert?: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminSubmissionsTab({
  submissions,
  games,
  users,
  cohorts = [],
  onRefresh,
  onAlert,
}: AdminSubmissionsTabProps) {
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterGame, setFilterGame] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // State Modal Hapus
  const [deletingSubmission, setDeletingSubmission] = useState<Submission | null>(null);
  const [deletingForProblem, setDeletingForProblem] = useState<string | null>(null);

  // Daftar kelas / kohort dinamis (100% murni dari store / input manual admin)
  const dynamicCohorts: Cohort[] = useMemo(() => {
    if (cohorts && cohorts.length > 0) return cohorts;
    return ArenaStore.getCohorts();
  }, [cohorts]);

  // Reset filter jika kelas terpilih sudah tidak ada di dynamicCohorts
  useEffect(() => {
    if (
      filterClass !== 'ALL' &&
      !dynamicCohorts.some((c) => c.id_cohort === filterClass || c.kode_kelas === filterClass)
    ) {
      setFilterClass('ALL');
    }
  }, [filterClass, dynamicCohorts]);

  // Saring submisi berdasarkan filter kelas, paket game, dan kata kunci pencarian
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // Cari user pemilik submisi untuk tahu kelasnya
      const owner = users.find((u) => u.nim === s.nim);
      const userClass = owner?.id_cohort || owner?.klub_hari || s.klub_hari || '';

      if (filterClass !== 'ALL') {
        const targetCohort = dynamicCohorts.find(
          (c) => c.id_cohort === filterClass || c.kode_kelas === filterClass
        );
        const matches = targetCohort
          ? userClass === targetCohort.id_cohort || userClass === targetCohort.kode_kelas
          : userClass === filterClass;
        if (!matches) return false;
      }

      if (filterGame !== 'ALL' && s.id_game !== filterGame) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNim = s.nim.toLowerCase().includes(q);
        const matchName = (s.codename || owner?.codename || '').toLowerCase().includes(q);
        const matchFullName = (owner?.nama_lengkap || '').toLowerCase().includes(q);
        const matchGame = s.id_game.toLowerCase().includes(q);
        const matchSubId = s.id_submission.toLowerCase().includes(q);
        if (!matchNim && !matchName && !matchFullName && !matchGame && !matchSubId) return false;
      }
      return true;
    });
  }, [submissions, users, filterClass, filterGame, searchQuery, dynamicCohorts]);

  const totalAccepted = filteredSubmissions.filter((s) => s.status_lulus === 'LULUS').length;
  const totalRejected = filteredSubmissions.filter((s) => s.status_lulus === 'BELUM LULUS').length;

  // Eksekusi Hapus 1 Submisi
  const handleConfirmDeleteSubmission = () => {
    if (!deletingSubmission) return;
    const res = ArenaStore.deleteSubmission(deletingSubmission.id_submission);
    if (res.success) {
      onAlert?.(res.message, 'success');
      setDeletingSubmission(null);
      onRefresh();
    } else {
      onAlert?.(res.message, 'error');
    }
  };

  // Eksekusi Hapus Seluruh Submisi untuk Problem Tertentu
  const handleConfirmDeleteForProblem = () => {
    if (!deletingForProblem) return;
    const res = ArenaStore.deleteSubmissionsForGame(deletingForProblem);
    if (res.success) {
      onAlert?.(res.message, 'success');
      setDeletingForProblem(null);
      onRefresh();
    } else {
      onAlert?.(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Metrics */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Antrean Submisi &amp; Live Judge Verdicts
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Log penjurian otomatis real-time. Memantau akurasi jawaban, penalti pindah tab (-5 per pelanggaran), dan status kelulusan.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white font-mono text-xs font-bold transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* 2. Filter Bar Dinamis */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Pills Filter Kelas Dinamis */}
          <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-lg border border-[#1e293b] flex-wrap">
            <button
              onClick={() => setFilterClass('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                filterClass === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Kelas ({submissions.length})
            </button>
            {dynamicCohorts.map((cohort) => {
              const count = submissions.filter((s) => {
                const owner = users.find((u) => u.nim === s.nim);
                const uClass = owner?.id_cohort || owner?.klub_hari || s.klub_hari;
                return uClass === cohort.kode_kelas || uClass === cohort.id_cohort;
              }).length;

              return (
                <button
                  key={cohort.id_cohort}
                  onClick={() => setFilterClass(cohort.id_cohort)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    filterClass === cohort.id_cohort
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cohort.nama_kelas} ({count})
                </button>
              );
            })}
          </div>

          {/* Filter Game / Problem */}
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">Semua Paket Soal ({games.length} Paket)</option>
            {games.map((g, idx) => {
              const meta = ICPC_PROBLEMS_DEF.find((p) => p.gameId === g.id_game);
              const letter = meta?.letter || String.fromCharCode(65 + (idx % 26));
              return (
                <option key={g.id_game} value={g.id_game}>
                  Problem {letter} • {g.id_game} - {g.judul_game}
                </option>
              );
            })}
          </select>

          {/* Tombol Hapus per Problem (Muncul saat filter paket dipilih) */}
          {filterGame !== 'ALL' && (
            <button
              type="button"
              onClick={() => setDeletingForProblem(filterGame)}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-rose-100 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title={`Hapus semua submisi untuk paket ${filterGame}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Submisi {filterGame}</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIM, Codename, ID..."
            className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 3. Submissions Table & Empty State */}
      {submissions.length === 0 ? (
        /* Empty State Utama: Belum Ada Submisi Sama Sekali */
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
            Belum Ada Submisi Masuk
          </h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto leading-relaxed">
            Antrean penjurian masih kosong. Log submisi mahasiswa akan muncul secara otomatis dan real-time saat peserta mengerjakan kuis atau tantangan problem solving.
          </p>
        </div>
      ) : (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white">
              Menampilkan {filteredSubmissions.length} dari {submissions.length} Submisi Masuk
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">● {totalAccepted} Lulus (AC)</span>
              <span className="text-rose-400 font-bold">● {totalRejected} Belum Lulus</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b]">
                <tr>
                  <th className="p-3.5">ID &amp; Waktu</th>
                  <th className="p-3.5">Mahasiswa</th>
                  <th className="p-3.5">Problem / Game</th>
                  <th className="p-3.5">Akurasi &amp; Poin</th>
                  <th className="p-3.5">Penalti Tab</th>
                  <th className="p-3.5">Verdict Penjurian</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      Tidak ada data submisi yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((s) => {
                    const owner = users.find((u) => u.nim === s.nim);
                    const icpcMeta = ICPC_PROBLEMS_DEF.find((p) => p.gameId === s.id_game);
                    const isAccepted = s.status_lulus === 'LULUS';
                    const tabPenalty = (s.tab_switch_count || 0) * 5;

                    return (
                      <tr key={s.id_submission} className="hover:bg-[#111827]/60 transition-colors">
                        {/* ID & Timestamp */}
                        <td className="p-3.5">
                          <span className="font-bold text-white">{s.id_submission}</span>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(s.timestamp_mulai).toLocaleTimeString('id-ID')}</span>
                          </div>
                        </td>

                        {/* Mahasiswa Info */}
                        <td className="p-3.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{s.codename || owner?.codename}</span>
                            {(() => {
                              const cohortObj = dynamicCohorts.find(
                                (c) => c.id_cohort === owner?.id_cohort || c.kode_kelas === owner?.id_cohort
                              );
                              const label = cohortObj?.kode_kelas || cohortObj?.nama_kelas || owner?.klub_hari || s.klub_hari;
                              if (!label || label === 'ALL') return null;
                              return (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/25">
                                  {label}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-slate-400 font-normal">
                            NIM: {s.nim} • {owner?.nama_lengkap || '-'}
                          </div>
                        </td>

                        {/* Problem & Balloon */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {icpcMeta && (
                              <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-[#111827] text-white border border-[#1e293b]">
                                Problem {icpcMeta.letter}
                              </span>
                            )}
                            <span className="font-bold text-white">{s.id_game}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {icpcMeta?.balloonEmoji || '⚪'} {icpcMeta?.title || 'Tantangan Algoritma'}
                          </div>
                        </td>

                        {/* Akurasi & Nilai */}
                        <td className="p-3.5">
                          <div className="font-bold text-white">
                            Nilai: <span className={s.nilai_akademik >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{s.nilai_akademik}</span> / 100
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {s.jumlah_benar}/{s.total_soal} Soal Benar • +{s.skor_xp} XP
                          </div>
                        </td>

                        {/* Penalti Tab Switch */}
                        <td className="p-3.5">
                          {tabPenalty > 0 ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25 text-xs font-bold">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>-{tabPenalty} Poin ({s.tab_switch_count}x Tab)</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">0 (Bersih)</span>
                          )}
                        </td>

                        {/* Verdict Penjurian */}
                        <td className="p-3.5">
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>LULUS (AC)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-xs">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>BELUM LULUS</span>
                            </span>
                          )}
                        </td>

                        {/* Tombol Aksi Hapus */}
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setDeletingSubmission(s)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 hover:text-rose-100 transition-colors"
                            title={`Hapus submisi ${s.id_submission}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI: HAPUS 1 SUBMISI (Zero AI Slop) */}
      {deletingSubmission && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Hapus Submisi Siswa?</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Tindakan ini akan menghapus rekaman submisi dan menyinkronkan total XP mahasiswa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeletingSubmission(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detail Submisi Target */}
              <div className="bg-[#060a14] p-3.5 rounded-lg border border-[#1e293b] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Submisi:</span>
                  <span className="font-bold text-white">{deletingSubmission.id_submission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mahasiswa:</span>
                  <span className="font-bold text-white">
                    {deletingSubmission.codename} ({deletingSubmission.nim})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paket Soal:</span>
                  <span className="font-bold text-white">{deletingSubmission.id_game}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nilai / XP Didapat:</span>
                  <span className="font-bold text-amber-400">
                    {deletingSubmission.nilai_akademik}/100 • +{deletingSubmission.skor_xp} XP
                  </span>
                </div>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-lg text-[11px] text-rose-300 leading-relaxed font-sans flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Skor XP mahasiswa akan otomatis dikurangi sebesar {deletingSubmission.skor_xp} XP dan levelnya akan dikalkulasi ulang.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingSubmission(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSubmission}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Submisi</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 5. MODAL KONFIRMASI: HAPUS SELURUH SUBMISI PER PROBLEM */}
      {deletingForProblem && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Hapus Seluruh Submisi {deletingForProblem}?
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Menghapus massal seluruh riwayat submisi untuk paket kontes ini.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeletingForProblem(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#060a14] p-3.5 rounded-lg border border-[#1e293b] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Paket Soal:</span>
                  <span className="font-bold text-white">{deletingForProblem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jumlah Submisi Terdampak:</span>
                  <span className="font-bold text-rose-400">
                    {submissions.filter((s) => s.id_game === deletingForProblem).length} Submisi
                  </span>
                </div>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-lg text-[11px] text-rose-300 leading-relaxed font-sans flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Seluruh riwayat pengerjaan mahasiswa untuk paket ini akan dihapus dan mahasiswa dapat mengerjakan kembali dari awal. Total XP mereka akan disinkronkan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingForProblem(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteForProblem}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Semua Submisi Problem Ini</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
