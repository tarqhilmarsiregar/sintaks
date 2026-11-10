'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Trophy, ArrowLeft, RefreshCw, Award, Clock } from 'lucide-react';
import { MOCK_CONTESTS, MOCK_SCOREBOARD } from '@/lib/mock-data';
import ScoreboardTable from '@/components/ScoreboardTable';
import CountdownTimer from '@/components/CountdownTimer';

export default function ContestScoreboardPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const contest = MOCK_CONTESTS.find((c) => c.slug === slug);

  const [refreshing, setRefreshing] = useState(false);

  if (!contest) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <h2 className="text-xl font-bold text-white">Kontes tidak ditemukan.</h2>
        <Link href="/contests" className="text-blue-400 underline text-sm mt-2 inline-block">
          Kembali ke Daftar Kontes
        </Link>
      </div>
    );
  }

  const problemLetters = contest.problems?.map((p) => p.order_letter || 'A') || ['A', 'B', 'C'];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/contests/${contest.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Detail Kontes</span>
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Scoreboard — {contest.title}
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Peringkat resmi peserta mahasiswa berdasarkan format ICPC (Accepted count & Penalty).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-arena-card hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-arena-border transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Segarkan Data</span>
          </button>

          <CountdownTimer
            startTime={contest.start_time}
            endTime={contest.end_time}
            freezeMinutes={contest.freeze_minutes}
          />
        </div>
      </div>

      {/* Scoreboard Table Component */}
      <ScoreboardTable
        participants={MOCK_SCOREBOARD}
        problemLetters={problemLetters}
        isFrozen={false}
      />
    </div>
  );
}

