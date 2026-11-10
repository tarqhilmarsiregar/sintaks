import React from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MOCK_CONTESTS } from '@/lib/mock-data';
import CountdownTimer from '@/components/CountdownTimer';

export default function ContestsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Daftar Kontes Pemrograman</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Ikuti kontes resmi kampus atau latihan mandiri dengan format penilaian standar ACM-ICPC.
        </p>
      </div>

      {/* Contests List */}
      <div className="space-y-6">
        {MOCK_CONTESTS.map((contest) => {
          const isOngoing = new Date(contest.end_time) > new Date() && new Date(contest.start_time) <= new Date();

          return (
            <div
              key={contest.id}
              className={`bg-arena-card border rounded-2xl p-6 sm:p-8 transition-all relative overflow-hidden ${
                isOngoing
                  ? 'border-blue-500/40 shadow-xl shadow-blue-500/10'
                  : 'border-arena-border'
              }`}
            >
              {isOngoing && (
                <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl text-white">
                  LIVE CONTEST
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-semibold border ${
                        isOngoing
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-700/30 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isOngoing ? 'Sedang Berlangsung' : 'Kontes Arsip'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Penalti: {contest.penalty_minutes} menit / wrong submission
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {contest.title}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {contest.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mulai: {new Date(contest.start_time).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Selesai: {new Date(contest.end_time).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  {isOngoing && (
                    <CountdownTimer
                      startTime={contest.start_time}
                      endTime={contest.end_time}
                      freezeMinutes={contest.freeze_minutes}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/contests/${contest.slug}/scoreboard`}
                      className="px-4 py-2 rounded-xl bg-arena-dark hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-arena-border flex items-center gap-1.5 transition-colors"
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Scoreboard</span>
                    </Link>

                    <Link
                      href={`/contests/${contest.slug}`}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition-all"
                    >
                      <span>Masuk Arena</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

