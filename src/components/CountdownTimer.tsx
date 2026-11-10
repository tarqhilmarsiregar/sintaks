'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CountdownTimerProps {
  startTime: string;
  endTime: string;
  freezeMinutes?: number;
  onContestEnd?: () => void;
}

export default function CountdownTimer({
  startTime,
  endTime,
  freezeMinutes = 60,
  onContestEnd,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    status: 'upcoming' | 'running' | 'ended';
    isFrozen: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: 'running',
    isFrozen: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, status: 'upcoming', isFrozen: false });
      } else if (now >= start && now <= end) {
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const remainingMinutes = diff / (1000 * 60);
        const isFrozen = freezeMinutes > 0 && remainingMinutes <= freezeMinutes;
        setTimeLeft({ hours, minutes, seconds, status: 'running', isFrozen });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, status: 'ended', isFrozen: false });
        if (onContestEnd) onContestEnd();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, freezeMinutes, onContestEnd]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex flex-wrap items-center gap-3 bg-arena-card border border-arena-border px-4 py-2.5 rounded-xl shadow-md">
      <div className="flex items-center gap-2">
        {timeLeft.status === 'running' ? (
          <Clock className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
        ) : timeLeft.status === 'upcoming' ? (
          <Clock className="w-4 h-4 text-blue-400" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-slate-400" />
        )}
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {timeLeft.status === 'running'
            ? 'Sisa Waktu Kontes'
            : timeLeft.status === 'upcoming'
            ? 'Dimulai Dalam'
            : 'Kontes Telah Selesai'}
        </span>
      </div>

      <div className="flex items-center gap-1 font-mono text-base font-bold text-slate-100">
        <span className="bg-arena-dark px-2 py-0.5 rounded border border-arena-border">
          {pad(timeLeft.hours)}
        </span>
        <span className="text-slate-500">:</span>
        <span className="bg-arena-dark px-2 py-0.5 rounded border border-arena-border">
          {pad(timeLeft.minutes)}
        </span>
        <span className="text-slate-500">:</span>
        <span className="bg-arena-dark px-2 py-0.5 rounded border border-arena-border text-emerald-400">
          {pad(timeLeft.seconds)}
        </span>
      </div>

      {timeLeft.isFrozen && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-md border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-medium">Scoreboard Freeze Active</span>
        </div>
      )}
    </div>
  );
}
