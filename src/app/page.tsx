import React from 'react';
import Link from 'next/link';
import { Trophy, Code2, Award, Zap, ShieldCheck, ArrowRight, Clock, Users, BookOpen, Terminal } from 'lucide-react';
import { MOCK_CONTESTS, MOCK_PROBLEMS, MOCK_SCOREBOARD } from '@/lib/mock-data';
import CountdownTimer from '@/components/CountdownTimer';

export default function HomePage() {
  const activeContest = MOCK_CONTESTS[0];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 border-b border-arena-border">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-medium shadow-inner">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Official Campus Competitive Programming Arena</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Arena Asah Algoritma & Struktur Data{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                Mahasiswa
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Platform kompetisi pemrograman berstandar <strong>ACM-ICPC</strong>. Selesaikan soal
              komputasional kompleks, raih balon penalti terendah, dan ukur peringkat Anda di antara
              rekan mahasiswa secara real-time.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
              >
                <Terminal className="w-4 h-4" />
                <span>Masuk Menggunakan NIM</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/contests/${activeContest.slug}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-arena-card hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-arena-border transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Buka Kontes Aktif</span>
              </Link>
            </div>

            {/* Notice for NIM login */}
            <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                Default Login Mahasiswa: <strong>NIM</strong> dan Password <strong>NIM</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Active Contest Banner Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-950/40 via-arena-card to-indigo-950/40 border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  KONTES SEDANG BERLANGSUNG
                </span>
                <span className="text-xs text-slate-400 font-mono">Format ACM-ICPC</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {activeContest.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {activeContest.description}
              </p>

              {/* Problem Letters in Contest */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-slate-400 font-mono">Soal Tersedia:</span>
                {activeContest.problems?.map((prob) => (
                  <Link
                    key={prob.id}
                    href={`/contests/${activeContest.slug}/arena/${prob.slug}`}
                    className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600 hover:text-white flex items-center justify-center text-xs font-mono font-bold text-blue-300 transition-colors"
                  >
                    {prob.order_letter}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-4 shrink-0">
              <CountdownTimer
                startTime={activeContest.start_time}
                endTime={activeContest.end_time}
                freezeMinutes={activeContest.freeze_minutes}
              />

              <div className="flex items-center gap-3">
                <Link
                  href={`/contests/${activeContest.slug}/scoreboard`}
                  className="px-4 py-2 rounded-xl bg-arena-card hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-arena-border flex items-center gap-1.5 transition-colors"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Lihat Scoreboard</span>
                </Link>

                <Link
                  href={`/contests/${activeContest.slug}`}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 flex items-center gap-1.5 transition-all"
                >
                  <span>Masuk Arena Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Problems Archive & Live Leaderboard Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Problem Archive Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Soal Latihan Terpopuler</h3>
            </div>
            <Link
              href="/problems"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Semua Soal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {MOCK_PROBLEMS.map((prob) => (
              <div
                key={prob.id}
                className="bg-arena-card border border-arena-border hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center border border-slate-700">
                      {prob.order_letter}
                    </span>
                    <Link
                      href={`/problems/${prob.slug}`}
                      className="font-semibold text-sm text-slate-100 hover:text-blue-400 transition-colors"
                    >
                      {prob.title}
                    </Link>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                        prob.difficulty === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : prob.difficulty === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {prob.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-slate-400 bg-arena-dark px-2 py-0.5 rounded border border-arena-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right text-[11px] font-mono text-slate-500 hidden sm:block">
                    <div>Limit: {prob.time_limit_ms}ms</div>
                    <div>Memori: {prob.memory_limit_mb}MB</div>
                  </div>
                  <Link
                    href={`/problems/${prob.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all"
                  >
                    Selesaikan Soal
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top Mahasiswa Leaderboard Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Top Mahasiswa</h3>
            </div>
            <Link
              href={`/contests/${activeContest.slug}/scoreboard`}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Scoreboard Penuh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-arena-card border border-arena-border rounded-xl divide-y divide-arena-border overflow-hidden">
            {MOCK_SCOREBOARD.slice(0, 4).map((p) => (
              <div key={p.user_id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      p.rank === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : p.rank === 2
                        ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40'
                        : 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                    }`}
                  >
                    #{p.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-200">{p.full_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">NIM: {p.nim}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {p.solved_count} Solved
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {p.total_penalty}m penalti
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Info Box */}
          <div className="bg-arena-dark border border-arena-border rounded-xl p-4 text-xs space-y-2 text-slate-400">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Kalkulasi Skor Standar ICPC:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Peserta diperingkatkan berdasarkan jumlah soal yang terselesaikan (Accepted). Jika seri,
              peserta dengan akumulasi penalti waktu paling sedikit menempati peringkat lebih tinggi.
            </p>
          </div>
        </div>
      </section>

      {/* Pedagogical Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white">Dirancang Khusus untuk Pembelajaran Kampus</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Menggabungkan atmosfer kompetisi internasional dengan kurikulum Struktur Data & Algoritma universitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-arena-card border border-arena-border p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-white">Autentikasi Otomatis via NIM</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mahasiswa langsung masuk menggunakan NIM dan Password default NIM. Tidak ada hambatan verifikasi email manual.
            </p>
          </div>

          <div className="bg-arena-card border border-arena-border p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-white">Multi-Language Code Runner</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dukungan C++17 (g++), Python 3, dan Java 21 dengan template standar competitive programming siap pakai.
            </p>
          </div>

          <div className="bg-arena-card border border-arena-border p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-white">Scoreboard ICPC & Balloon</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Penghitungan penalti waktu otomatis, first-to-solve badge, dan mode pembekuan (freeze) scoreboard di jam terakhir.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
