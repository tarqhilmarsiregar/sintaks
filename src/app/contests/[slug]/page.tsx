import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Trophy, Award, FileText, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { MOCK_CONTESTS, MOCK_PROBLEMS } from '@/lib/mock-data';
import CountdownTimer from '@/components/CountdownTimer';

export default function ContestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 15 params promise
  const resolvedParams = React.use(params);
  const contest = MOCK_CONTESTS.find((c) => c.slug === resolvedParams.slug);

  if (!contest) {
    notFound();
  }

  const contestProblems = MOCK_PROBLEMS.filter(
    (p) => p.contest_id === contest.id || (!p.contest_id && contest.slug === 'pam-2026')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Contest Banner */}
      <div className="bg-arena-card border border-arena-border rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                ICPC CONTEST FORMAT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Penalti: {contest.penalty_minutes} Menit
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {contest.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {contest.description}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <CountdownTimer
              startTime={contest.start_time}
              endTime={contest.end_time}
              freezeMinutes={contest.freeze_minutes}
            />

            <div className="flex items-center gap-3">
              <Link
                href={`/contests/${contest.slug}/scoreboard`}
                className="px-4 py-2 rounded-xl bg-blue-600/15 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Lihat Scoreboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-arena-card border border-arena-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#0e1422] border-b border-arena-border flex items-center justify-between">
          <h3 className="font-bold text-white text-sm sm:text-base">
            Daftar Soal Kontes ({contestProblems.length} Soal)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Pilih soal untuk masuk ke editor kode
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b0f19] text-slate-400 border-b border-arena-border">
              <tr>
                <th className="py-3 px-4 text-center w-16 font-bold">#</th>
                <th className="py-3 px-4 font-bold font-sans">Judul Soal</th>
                <th className="py-3 px-4 font-bold">Tingkat Kesulitan</th>
                <th className="py-3 px-4 font-bold font-sans">Topik & Algoritma</th>
                <th className="py-3 px-4 text-center w-28 font-bold">Batas Waktu</th>
                <th className="py-3 px-4 text-right w-36 font-bold font-sans">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {contestProblems.map((prob) => (
                <tr key={prob.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Problem Letter */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-400 font-bold border border-blue-500/40">
                      {prob.order_letter}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-4 font-sans">
                    <Link
                      href={`/contests/${contest.slug}/arena/${prob.slug}`}
                      className="font-bold text-slate-100 hover:text-blue-400 text-sm transition-colors block"
                    >
                      {prob.title}
                    </Link>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Slug: {prob.slug}
                    </span>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        prob.difficulty === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : prob.difficulty === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </td>

                  {/* Tags */}
                  <td className="py-3 px-4 font-sans">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {prob.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono bg-arena-dark text-slate-400 px-2 py-0.5 rounded border border-arena-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Time limit */}
                  <td className="py-3 px-4 text-center text-slate-300">
                    {prob.time_limit_ms} ms
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/contests/${contest.slug}/arena/${prob.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all font-sans"
                    >
                      <span>Kerjakan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
