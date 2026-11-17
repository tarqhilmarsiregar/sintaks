'use client';

import React, { useState } from 'react';
import { User, Submission, Game, Cohort } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import ModalPortal from '@/components/common/ModalPortal';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Info,
  Layers,
  Users,
  CheckCircle2,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface AdminExportTabProps {
  users: User[];
  submissions: Submission[];
  games: Game[];
  cohorts?: Cohort[];
  onExportExcel: (cohortIdOrCode: string, cohortName?: string) => void;
  onResetGlobal: () => void;
  onCreateCohortClick?: () => void;
}

export default function AdminExportTab({
  users,
  submissions,
  games,
  cohorts: propsCohorts,
  onExportExcel,
  onResetGlobal,
  onCreateCohortClick,
}: AdminExportTabProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [resetError, setResetError] = useState('');

  // Fallback ke store jika props cohorts belum ter-pass
  const cohorts: Cohort[] = propsCohorts && propsCohorts.length > 0
    ? propsCohorts
    : ArenaStore.getCohorts();

  const handleConfirmReset = () => {
    if (confirmationInput.trim() !== 'RESET-TIME') {
      setResetError('Teks konfirmasi tidak sesuai! Ketik "RESET-TIME" dengan huruf besar.');
      return;
    }
    setResetError('');
    setShowResetModal(false);
    setConfirmationInput('');
    onResetGlobal();
  };

  const totalStudents = users.filter(u => u.role === 'PESERTA').length;
  const totalDoneSubmissions = submissions.filter(s => s.status_sesi === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Rekapitulasi Nilai &amp; Ekspor Laporan Resmi
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ekspor rekapitulasi data akademik multi-sheet Microsoft Excel (.xlsx 3-Sheet) resmi untuk keperluan administrasi dan evaluasi pangkalan data STMIK TIME Medan.
          </p>
        </div>
      </div>

      {/* 2. Master Summary Card (Seluruh Kelas & Kohort) */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 sm:p-6 shadow-sm font-mono space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/25">
                Master Report (ALL)
              </span>
              <span className="text-slate-400">
                Arsip Gabungan Seluruh Kelas &amp; Kohort
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Laporan Rekap Total (Seluruh Kelas &amp; Kohort)
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Memuat 3-Sheet komprehensif: Rekapitulasi Nilai Seluruh Mahasiswa, Diagnostik Materi Topik, dan Log Detail Submisi Lengkap.
            </p>
          </div>

          <button
            onClick={() => onExportExcel('ALL', 'Seluruh Kelas & Kohort')}
            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Rekap Total (.xlsx)</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1e293b] text-xs">
          <div className="bg-[#080d18] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">Total Mahasiswa:</span>
            <span className="text-base font-bold text-white mt-0.5 block">
              {totalStudents} <span className="text-xs font-normal text-slate-500">Akun</span>
            </span>
          </div>

          <div className="bg-[#080d18] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">Submisi Selesai:</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">
              {totalDoneSubmissions} <span className="text-xs font-normal text-slate-500">Log</span>
            </span>
          </div>

          <div className="bg-[#080d18] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">Paket Kontes Aktif:</span>
            <span className="text-base font-bold text-blue-400 mt-0.5 block">
              {games.length} <span className="text-xs font-normal text-slate-500">Paket</span>
            </span>
          </div>

          <div className="bg-[#080d18] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">Total Kelas / Kohort:</span>
            <span className="text-base font-bold text-amber-400 mt-0.5 block">
              {cohorts.length} <span className="text-xs font-normal text-slate-500">Kelas</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Cohort Export Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Laporan Spesifik Per-Kelas &amp; Kohort</span>
          </div>
          <span className="text-slate-400">
            {cohorts.length} Kelas Terdaftar
          </span>
        </div>

        {cohorts.length === 0 ? (
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-8 sm:p-10 text-center font-mono shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#111827] border border-[#1e293b] flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5">
              Belum Ada Kelas / Kohort Terdaftar
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
              Direktori kelas masih kosong. Buat kelas / kohort pembelajaran terlebih dahulu di menu Pemantauan Mahasiswa untuk menghasilkan laporan terpisah per-kelas.
            </p>
            {onCreateCohortClick && (
              <button
                onClick={onCreateCohortClick}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>+ Buat Kelas / Kohort Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            {cohorts.map((cohort) => {
              const cohortStudents = users.filter(u => u.role === 'PESERTA' && (u.id_cohort === cohort.id_cohort || u.klub_hari === cohort.kode_kelas));
              const studentNims = new Set(cohortStudents.map(u => u.nim));
              const cohortSubmissions = submissions.filter(s => studentNims.has(s.nim) && s.status_sesi === 'DONE');

              return (
                <div
                  key={cohort.id_cohort}
                  className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-blue-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/25">
                        {cohort.kode_kelas}
                      </span>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{cohort.periode}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1" title={cohort.nama_kelas}>
                        {cohort.nama_kelas}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {cohort.deskripsi || `Laporan akademik resmi 3-Sheet untuk kelas ${cohort.nama_kelas}.`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#080d18] border border-[#1e293b] text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Mahasiswa:</span>
                        <span className="text-white font-bold">{cohortStudents.length} Peserta</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Submisi:</span>
                        <span className="text-emerald-400 font-bold">{cohortSubmissions.length} Log Selesai</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onExportExcel(cohort.id_cohort, cohort.nama_kelas)}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] hover:border-blue-500/40 text-blue-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Unduh Excel {cohort.kode_kelas}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Struktur Format File 3-Sheet */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 font-mono text-xs space-y-3 shadow-sm">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Struktur Laporan Excel (.xlsx 3-Sheet) Resmi</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-lg bg-[#080d18] border border-[#1e293b] space-y-1">
            <span className="text-emerald-400 font-bold block">Sheet 1: Rekap_Nilai</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              NIM, Nama Lengkap, Kelas Kohort, Periode, Prodi, Rata-rata Nilai Murni (0–100), Total Akumulasi XP, Level, dan Status Ketuntasan.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#080d18] border border-[#1e293b] space-y-1">
            <span className="text-blue-400 font-bold block">Sheet 2: Diagnostik_Materi</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pemetaan daya serap kompetensi mahasiswa, akumulasi level teknis, indikasi akademik, dan rekomendasi modul pengayaan.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#080d18] border border-[#1e293b] space-y-1">
            <span className="text-slate-300 font-bold block">Sheet 3: Log_Detail</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ID Submisi, timestamp presisi detik, detail penalti tab switch (-5 poin per switch), skor XP yang didapat, dan status kelulusan.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Danger Zone (Destructive Actions) */}
      <div className="bg-[#0b1120] border border-rose-500/30 rounded-xl p-5 font-mono space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base text-white">Zona Bahaya (Sistem &amp; Database Reset)</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Mengembalikan seluruh database lokal (Game, Bank Soal, Akun Mahasiswa, Skor XP, Submisi, dan Tim) ke kondisi awal pabrik.
        </p>

        <div>
          <button
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database ke Pengaturan Awal Pabrik</span>
          </button>
        </div>
      </div>

      {/* 6. Safe Confirmation Modal */}
      {showResetModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 max-w-md w-full shadow-2xl font-mono space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-white text-base">Konfirmasi Reset Global</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Seluruh riwayat submisi, skor XP mahasiswa, pembagian tim, dan saklar status akan dihapus dan dikembalikan ke kondisi awal pabrik STMIK TIME.
              </p>

              <div className="bg-[#080d18] p-3 rounded-lg border border-[#1e293b] space-y-2">
                <label className="text-xs text-slate-400 block font-semibold">
                  Ketik <strong className="text-rose-400">RESET-TIME</strong> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="RESET-TIME"
                  className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white font-bold tracking-wider focus:outline-none focus:border-rose-500"
                />
              </div>

              {resetError && (
                <div className="text-xs text-rose-400 font-semibold">
                  {resetError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setConfirmationInput('');
                    setResetError('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Ya, Reset Database
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
