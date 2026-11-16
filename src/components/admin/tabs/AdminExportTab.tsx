'use client';

import React, { useState } from 'react';
import { User, Submission, Game } from '@/types/arena';
import ModalPortal from '@/components/common/ModalPortal';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface AdminExportTabProps {
  users: User[];
  submissions: Submission[];
  games: Game[];
  onExportExcel: (klubHari: 'KAMIS' | 'JUMAT' | 'LOMBA' | 'ALL') => void;
  onResetGlobal: () => void;
}

export default function AdminExportTab({
  users,
  submissions,
  games,
  onExportExcel,
  onResetGlobal,
}: AdminExportTabProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [resetError, setResetError] = useState('');

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

  const countLomba = users.filter(u => u.role === 'PESERTA' && u.klub_hari === 'LOMBA').length;

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
            Ekspor rekapitulasi data akademik multi-sheet Microsoft Excel (.xlsx) resmi untuk keperluan administrasi dan rekap dosen pembina STMIK TIME Medan.
          </p>
        </div>
      </div>

      {/* 2. Export Cards (Solid, Anti-AI Slop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Card 1: Kelas KAMIS */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/25">
                Kelas KAMIS
              </span>
              <span className="text-slate-400">15 SI</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Laporan Kelas Kamis
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Memuat 3-Sheet: Rekapitulasi Nilai, Diagnostik Materi Topik, dan Log Detail Submisi Kelas Kamis SI 2025.
            </p>
          </div>

          <button
            onClick={() => onExportExcel('KAMIS')}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel Kamis</span>
          </button>
        </div>

        {/* Card 2: Kelas JUMAT */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="px-2 py-0.5 rounded bg-[#111827] text-slate-300 font-bold border border-[#1e293b]">
                Kelas JUMAT
              </span>
              <span className="text-slate-400">13 TI/SI</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Laporan Kelas Jumat
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Memuat 3-Sheet: Rekapitulasi Nilai, Diagnostik Materi Topik, dan Log Detail Submisi Kelas Jumat TI/SI 2024–2025.
            </p>
          </div>

          <button
            onClick={() => onExportExcel('JUMAT')}
            className="w-full py-2.5 px-4 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Unduh Excel Jumat</span>
          </button>
        </div>

        {/* Card 3: Kelas LOMBA */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                Kelas LOMBA
              </span>
              <span className="text-slate-400">{countLomba} Mahasiswa</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Laporan Kelas Lomba
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Memuat 3-Sheet khusus peserta kompetisi pemrograman &amp; seleksi tim ICPC internal STMIK TIME.
            </p>
          </div>

          <button
            onClick={() => onExportExcel('LOMBA')}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel Lomba</span>
          </button>
        </div>

        {/* Card 4: Gabungan Total */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/25">
                Semua Kelas (ALL)
              </span>
              <span className="text-slate-400">{users.filter(u => u.role === 'PESERTA').length} Total</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Laporan Lengkap
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Arsip komprehensif seluruh kohort praktikum &amp; lomba Competitive Programming STMIK TIME Medan.
            </p>
          </div>

          <button
            onClick={() => onExportExcel('ALL')}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Rekap Total</span>
          </button>
        </div>
      </div>

      {/* 3. Struktur Format File 3-Sheet */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 font-mono text-xs space-y-3 shadow-sm">
        <h4 className="font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Struktur Laporan Excel (.xlsx 3-Sheet) Resmi</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#080d18] border border-[#1e293b]">
            <span className="text-emerald-400 font-bold block mb-1">Sheet 1: Rekap_Nilai</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              NIM, Nama Lengkap, Kelas, Jumlah Game Selesai, Rata-rata Nilai Murni (0–100), Total Akumulasi XP, dan Status Tuntas Akademik.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#080d18] border border-[#1e293b]">
            <span className="text-blue-400 font-bold block mb-1">Sheet 2: Diagnostik_Materi</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Pemetaan daya serap mahasiswa pada materi Greedy, Dynamic Programming, Graph/BFS, String Hashing, dan Game Theory.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#080d18] border border-[#1e293b]">
            <span className="text-slate-300 font-bold block mb-1">Sheet 3: Log_Detail</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Timestamp submisi presisi detik, pelanggaran penalti tab switch (-5 poin per switch), dan status verdict kelulusan.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone (Destructive Actions) */}
      <div className="bg-[#0b1120] border border-rose-500/30 rounded-xl p-5 font-mono space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base text-white">Zona Bahaya (Sistem &amp; Database Reset)</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
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

      {/* 5. Safe Confirmation Modal */}
      {showResetModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 max-w-md w-full shadow-2xl font-mono space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-white text-base">Konfirmasi Reset Global</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Seluruh riwayat submisi, skor XP mahasiswa, pembagian tim, dan saklar status akan dihapus dan dikembalikan ke seed data awal STMIK TIME.
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
