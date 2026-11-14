'use client';

import React, { useState } from 'react';
import { Game, Submission, User } from '@/types/arena';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Code2,
  Filter,
} from 'lucide-react';

interface SubmissionsHistoryTabProps {
  currentUser: User;
  submissions: Submission[];
  games: Game[];
  onViewEditorial: (game: Game, sub: Submission) => void;
}

export default function SubmissionsHistoryTab({
  currentUser,
  submissions,
  games,
  onViewEditorial,
}: SubmissionsHistoryTabProps) {
  const [filterMode, setFilterMode] = useState<'MY' | 'CLASS'>('MY');

  // Filter submisi sesuai mode
  const filteredSubs = submissions.filter((sub) => {
    if (filterMode === 'MY') {
      return sub.nim === currentUser.nim;
    }
    return sub.klub_hari === currentUser.klub_hari;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              DOMjudge Live Verdict Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Riwayat Submisi &amp; Live Judge Log
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Log pengiriman kode, hasil evaluasi compiler test cases, dan rincian penalti integritas akademik.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 bg-[#060a14] p-1 rounded-xl border border-[#1e293b] self-start sm:self-auto shrink-0 font-mono text-xs">
          <button
            onClick={() => setFilterMode('MY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterMode === 'MY'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Submisi Saya ({submissions.filter((s) => s.nim === currentUser.nim).length})
          </button>
          <button
            onClick={() => setFilterMode('CLASS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterMode === 'CLASS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Kelas {currentUser.klub_hari}
          </button>
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070b14] text-slate-400 border-b border-[#1e293b]">
              <tr>
                <th className="p-3.5">ID Submisi</th>
                <th className="p-3.5">Peserta / Tim</th>
                <th className="p-3.5">Paket Soal / Kontes</th>
                <th className="p-3.5">Waktu Submit</th>
                <th className="p-3.5 text-center">Hasil Test Case</th>
                <th className="p-3.5 text-center">Nilai Akhir</th>
                <th className="p-3.5 text-center">Status Verdict</th>
                <th className="p-3.5 text-right">Editorial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono text-xs">
                    Belum ada submisi yang tercatat untuk filter ini. Silakan kerjakan tantangan di Arena Kontes!
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const game = games.find((g) => g.id_game === sub.id_game);
                  const isAccepted = sub.nilai_akademik >= 70;
                  const isClean = sub.tab_switch_count === 0;

                  return (
                    <tr
                      key={sub.id_submission}
                      className="hover:bg-[#11192e] transition-colors"
                    >
                      {/* 1. ID Submisi */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-300 font-mono">
                          #{sub.id_submission.slice(-6)}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {sub.klub_hari}
                        </div>
                      </td>

                      {/* 2. Peserta / Tim */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs">
                          {sub.codename}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sub.nim}
                        </div>
                      </td>

                      {/* 3. Paket Soal / Kontes */}
                      <td className="p-3.5">
                        <div className="font-semibold text-cyan-300 text-xs">
                          {game ? game.judul_game : sub.id_game}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {game?.kategori_materi || 'Big-O & Algorithm'}
                        </div>
                      </td>

                      {/* 4. Waktu Submit */}
                      <td className="p-3.5 text-slate-400">
                        {new Date(sub.timestamp_mulai).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>

                      {/* 5. Hasil Test Case */}
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-white">
                          {sub.jumlah_benar} / {sub.total_soal}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Benar</span>
                      </td>

                      {/* 6. Nilai Akhir & Penalti */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-extrabold text-sm ${
                            isAccepted ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {sub.nilai_akademik}
                        </span>
                        <div className="text-[10px]">
                          {isClean ? (
                            <span className="text-emerald-400/80">0 Pindah Tab</span>
                          ) : (
                            <span className="text-rose-400">-{sub.tab_switch_count * 5} Tab</span>
                          )}
                        </div>
                      </td>

                      {/* 7. Status Verdict */}
                      <td className="p-3.5 text-center">
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>ACCEPTED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/60 border border-rose-500/30 text-rose-300 font-bold text-[10px]">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>NOT PASSED</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Action: Buka Editorial */}
                      <td className="p-3.5 text-right">
                        {game ? (
                          <button
                            onClick={() => onViewEditorial(game, sub)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#162238] hover:bg-blue-600 hover:text-white border border-[#1e293b] hover:border-blue-500 text-cyan-300 font-medium text-xs transition-all shadow-sm"
                            title="Buka Pembahasan & Editorial"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editorial</span>
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

