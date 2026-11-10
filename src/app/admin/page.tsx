'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Plus, Users, Trophy, Code2, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { MOCK_USERS, MOCK_PROBLEMS, MOCK_CONTESTS } from '@/lib/mock-data';

export default function AdminLecturerPortal() {
  const [activeTab, setActiveTab] = useState<'students' | 'contests' | 'problems'>('students');
  const [nimInputBatch, setNimInputBatch] = useState<string>(
    '230101010, Andika Pratama, TI-2024-A\n230101011, Bella Safitri, TI-2024-A\n230101012, Calvin Wijaya, TI-2024-B'
  );
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // New Problem Form State
  const [newProblem, setNewProblem] = useState({
    title: '',
    difficulty: 'Medium',
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    tags: 'Data Structures, Dynamic Programming',
    statement: '',
    input_format: '',
    output_format: '',
    constraints: '',
  });
  const [problemSuccess, setProblemSuccess] = useState(false);

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = nimInputBatch.trim().split('\n').filter((l) => l.trim().length > 0);
    setBatchSuccessMessage(`Berhasil mendaftarkan ${lines.length} akun mahasiswa baru dengan Default Password = NIM.`);
    setTimeout(() => setBatchSuccessMessage(null), 5000);
  };

  const handleCreateProblem = (e: React.FormEvent) => {
    e.preventDefault();
    setProblemSuccess(true);
    setTimeout(() => {
      setProblemSuccess(false);
      setNewProblem({
        title: '',
        difficulty: 'Medium',
        time_limit_ms: 1000,
        memory_limit_mb: 256,
        tags: '',
        statement: '',
        input_format: '',
        output_format: '',
        constraints: '',
      });
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Panel Dosen & Administrator</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Kelola akun mahasiswa, susun bank soal berstandar CP, dan atur jadwal kontes universitas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Dosen Pembina: Dr. Ir. Alan Turing, M.Kom.
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-arena-card border border-arena-border p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mahasiswa Terdaftar</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">128 Peserta</div>
          <p className="text-[10px] text-slate-500">Login aktif menggunakan NIM</p>
        </div>

        <div className="bg-arena-card border border-arena-border p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Kontes Aktif & Terjadwal</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{MOCK_CONTESTS.length} Kontes</div>
          <p className="text-[10px] text-slate-500">Format ICPC dengan penalti 20 menit</p>
        </div>

        <div className="bg-arena-card border border-arena-border p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Bank Soal Terverifikasi</span>
            <Code2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{MOCK_PROBLEMS.length} Soal</div>
          <p className="text-[10px] text-slate-500">Dilengkapi test case & solusi acuan</p>
        </div>

        <div className="bg-arena-card border border-arena-border p-5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Kapasitas Sandboxed Judge</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">Optimal</div>
          <p className="text-[10px] text-slate-500">Dockerized sandbox / Edge Runner</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-arena-border pb-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'students'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Akun Mahasiswa (NIM)</span>
        </button>

        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'problems'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Buat Soal Baru</span>
        </button>

        <button
          onClick={() => setActiveTab('contests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'contests'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Jadwal Kontes</span>
        </button>
      </div>

      {/* Tab 1: Students NIM Batch Management */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-arena-card border border-arena-border rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>Registrasi Massal Mahasiswa via NIM</span>
              </h3>
              <p className="text-xs text-slate-400">
                Dosen dapat memasukkan daftar NIM mahasiswa per kelas. Akun akan dibuat otomatis dengan{' '}
                <strong>Password Default = NIM</strong>.
              </p>
            </div>

            {batchSuccessMessage && (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{batchSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleBatchImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Format Input: <span className="text-cyan-400 font-mono">NIM, Nama Mahasiswa, Kelas</span> (Satu baris per mahasiswa)
                </label>
                <textarea
                  rows={6}
                  value={nimInputBatch}
                  onChange={(e) => setNimInputBatch(e.target.value)}
                  className="w-full bg-arena-dark border border-arena-border rounded-xl p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-[11px] text-slate-500 font-mono">
                  * Password akan otomatis diinisialisasi sama dengan nomor NIM masing-masing mahasiswa.
                </span>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Proses & Terbitkan Akun Mahasiswa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Students Table */}
          <div className="bg-arena-card border border-arena-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0e1422] border-b border-arena-border flex items-center justify-between">
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Mahasiswa Terdaftar Saat Ini ({MOCK_USERS.length})
              </h4>
              <span className="text-xs text-slate-400 font-mono">Status: Aktif</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b0f19] text-slate-400 border-b border-arena-border">
                  <tr>
                    <th className="py-3 px-4 font-sans font-bold">NIM (Identitas Login)</th>
                    <th className="py-3 px-4 font-sans font-bold">Nama Lengkap</th>
                    <th className="py-3 px-4 font-sans font-bold">Kelas / Kelompok</th>
                    <th className="py-3 px-4 font-bold text-center">Rating CP</th>
                    <th className="py-3 px-4 font-bold text-center">Solved</th>
                    <th className="py-3 px-4 font-bold text-right">Status Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arena-border">
                  {MOCK_USERS.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-400">{usr.nim}</td>
                      <td className="py-3 px-4 font-sans text-slate-200">{usr.full_name}</td>
                      <td className="py-3 px-4 font-sans text-slate-400">{usr.class_group}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">{usr.rating}</td>
                      <td className="py-3 px-4 text-center text-emerald-400">{usr.solved_count}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-sans">
                          Tersedia (NIM)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Create New Problem */}
      {activeTab === 'problems' && (
        <div className="bg-arena-card border border-arena-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>Tambah Soal Algoritma Baru (Standar CP)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Soal wajib memuat deskripsi matematis formal, batasan waktu/memori, dan contoh masukan/keluaran.
            </p>
          </div>

          {problemSuccess && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Soal berhasil ditambahkan ke bank soal dan siap digunakan untuk kontes!</span>
            </div>
          )}

          <form onSubmit={handleCreateProblem} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Judul Soal</label>
                <input
                  type="text"
                  required
                  value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                  placeholder="Contoh: Jalur Terpendek Labirin Kampus"
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tingkat Kesulitan</label>
                <select
                  value={newProblem.difficulty}
                  onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Easy">Easy (Mudah - Rating 800 - 1200)</option>
                  <option value="Medium">Medium (Sedang - Rating 1300 - 1700)</option>
                  <option value="Hard">Hard (Sulit - Rating 1800 - 2400)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              <div>
                <label className="block text-slate-300 font-sans font-semibold mb-1">
                  Batas Waktu (ms)
                </label>
                <input
                  type="number"
                  value={newProblem.time_limit_ms}
                  onChange={(e) => setNewProblem({ ...newProblem, time_limit_ms: Number(e.target.value) })}
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-sans font-semibold mb-1">
                  Batas Memori (MB)
                </label>
                <input
                  type="number"
                  value={newProblem.memory_limit_mb}
                  onChange={(e) => setNewProblem({ ...newProblem, memory_limit_mb: Number(e.target.value) })}
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-sans font-semibold mb-1">
                  Tags & Algoritma
                </label>
                <input
                  type="text"
                  value={newProblem.tags}
                  onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                  placeholder="Graph, Dijkstra, BFS"
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Deskripsi Soal (Markdown / Formula)
              </label>
              <textarea
                rows={4}
                required
                value={newProblem.statement}
                onChange={(e) => setNewProblem({ ...newProblem, statement: e.target.value })}
                placeholder="Jelaskan cerita masalah komputasional..."
                className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Format Masukan</label>
                <textarea
                  rows={3}
                  value={newProblem.input_format}
                  onChange={(e) => setNewProblem({ ...newProblem, input_format: e.target.value })}
                  placeholder="Baris pertama berisi N..."
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Format Keluaran</label>
                <textarea
                  rows={3}
                  value={newProblem.output_format}
                  onChange={(e) => setNewProblem({ ...newProblem, output_format: e.target.value })}
                  placeholder="Cetak satu bilangan bulat..."
                  className="w-full bg-arena-dark border border-arena-border rounded-lg p-2.5 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 transition-all"
              >
                Simpan & Publikasikan Soal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Contests Management */}
      {activeTab === 'contests' && (
        <div className="bg-arena-card border border-arena-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Jadwal Kontes Universitas</h3>
              <p className="text-xs text-slate-400">
                Atur jadwal mulai, durasi, dan waktu freeze scoreboard untuk ujian atau kompetisi.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {MOCK_CONTESTS.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-arena-dark rounded-xl border border-arena-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{c.description}</p>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 mt-2">
                    <span>Mulai: {new Date(c.start_time).toLocaleString('id-ID')}</span>
                    <span>Selesai: {new Date(c.end_time).toLocaleString('id-ID')}</span>
                    <span>Freeze: {c.freeze_minutes} menit</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/contests/${c.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold"
                  >
                    Buka Kontes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
