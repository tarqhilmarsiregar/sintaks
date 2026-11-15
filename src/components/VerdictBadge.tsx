import React from 'react';
import { Verdict } from '@/types';

interface VerdictBadgeProps {
  verdict: Verdict;
  showIcon?: boolean;
  className?: string;
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  AC: 'Accepted',
  WA: 'Wrong Answer',
  TLE: 'Time Limit Exceeded',
  MLE: 'Memory Limit Exceeded',
  CE: 'Compilation Error',
  RE: 'Runtime Error',
  PENDING: 'In Queue',
  RUNNING: 'Judging...',
};

export default function VerdictBadge({ verdict, showIcon = true, className = '' }: VerdictBadgeProps) {
  const getVerdictStyles = (v: Verdict) => {
    switch (v) {
      case 'AC':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'WA':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'TLE':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MLE':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'CE':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      case 'RE':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'PENDING':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse';
      case 'RUNNING':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse';
      default:
        return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${getVerdictStyles(
        verdict
      )} ${className}`}
    >
      {showIcon && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            verdict === 'AC'
              ? 'bg-emerald-400'
              : verdict === 'WA' || verdict === 'RE'
              ? 'bg-rose-400'
              : verdict === 'TLE'
              ? 'bg-amber-400'
              : verdict === 'RUNNING' || verdict === 'PENDING'
              ? 'bg-blue-400 animate-ping'
              : 'bg-slate-400'
          }`}
        />
      )}
      <span>{verdict}</span>
      <span className="opacity-75 hidden sm:inline font-normal font-sans">
        ({VERDICT_LABELS[verdict]})
      </span>
    </span>
  );
}

