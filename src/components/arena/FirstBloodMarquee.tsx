'use client';

import React from 'react';
import { FirstBloodAnnouncement } from '@/types/arena';

interface FirstBloodMarqueeProps {
  announcements: FirstBloodAnnouncement[];
}

export default function FirstBloodMarquee({ announcements }: FirstBloodMarqueeProps) {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-[#13071f] border-b border-rose-900/40 py-1.5 px-4 text-xs font-mono select-none">
      <div className="flex w-max animate-marquee space-x-8 whitespace-nowrap">
        {announcements.map((item, idx) => (
          <span key={`fb-1-${idx}`} className="flex items-center gap-2 text-rose-300">
            <span className="text-amber-400 font-bold">✦ FIRST BLOOD!</span>
            <span className="text-white font-bold">{item.first_blood_by}</span>
            <span className="text-slate-300">memecahkan</span>
            <span className="text-rose-200 font-semibold">[{item.judul_soal}]</span>
            <span className="text-emerald-400 font-extrabold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 text-[10px]">
              (+25 XP!)
            </span>
          </span>
        ))}
        {/* Repeat for seamless infinite looping */}
        {announcements.map((item, idx) => (
          <span key={`fb-2-${idx}`} className="flex items-center gap-2 text-rose-300">
            <span className="text-amber-400 font-bold">✦ FIRST BLOOD!</span>
            <span className="text-white font-bold">{item.first_blood_by}</span>
            <span className="text-slate-300">memecahkan</span>
            <span className="text-rose-200 font-semibold">[{item.judul_soal}]</span>
            <span className="text-emerald-400 font-extrabold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 text-[10px]">
              (+25 XP!)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

