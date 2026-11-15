'use client';

import React from 'react';
import { User, Submission, Game } from '@/types/arena';
import { calculateLevelInfo } from '@/lib/gamification';
import UserAvatar from './UserAvatar';
import { Award, Zap, Flame, Target, BookOpen, AlertCircle, Droplets } from 'lucide-react';

interface CapaianTabProps {
  currentUser: User | null;
  submissions: Submission[];
  games: Game[];
}

export default function CapaianTab({ currentUser, submissions, games }: CapaianTabProps) {
  if (!currentUser) return null;

  const levelInfo = calculateLevelInfo(currentUser.total_xp);
  const userSubs = submissions.filter(s => s.nim === currentUser.nim && s.status_sesi === 'DONE');

  const milestones = [
    {
      id: 'FIRST_BLOOD',
      title: 'First Blood',
      desc: 'Pemain pertama yang memecahkan soal di seluruh kelas (+25 XP)',
      icon: <Droplets className="w-6 h-6 text-rose-400" />,
      unlocked: currentUser.milestones_json.includes('FIRST_BLOOD')
    },
    {
      id: 'PERFECT_100',
      title: 'Sniper 100',
      desc: 'Meraih nilai akademik murni 100/100 tanpa penalti pindah tab',
      icon: <Target className="w-6 h-6 text-emerald-400" />,
      unlocked: currentUser.milestones_json.includes('PERFECT_100')
    },
    {
      id: 'SPEED_DEMON',
      title: 'Speed Demon',
      desc: 'Menjawab benar soal kuis dengan sisa waktu > 25 detik',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      unlocked: currentUser.milestones_json.includes('SPEED_DEMON')
    },
    {
      id: 'STREAK_3X',
      title: '3x On Fire',
      desc: 'Menjawab 3 soal benar secara berturut-turut (+50 XP)',
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      unlocked: currentUser.milestones_json.includes('STREAK_3X')
    }
  ];

  // Hitung diagnostik per kategori materi
  const categoryStats: { [cat: string]: { total: number; sumNilai: number; count: number } } = {};
  games.forEach(g => {
    if (!categoryStats[g.kategori_materi]) {
      categoryStats[g.kategori_materi] = { total: 0, sumNilai: 0, count: 0 };
    }
    categoryStats[g.kategori_materi].total += 1;
  });

  userSubs.forEach(s => {
    const g = games.find(item => item.id_game === s.id_game);
    if (g && categoryStats[g.kategori_materi]) {
      categoryStats[g.kategori_materi].sumNilai += s.nilai_akademik;
      categoryStats[g.kategori_materi].count += 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* 1. Level Progress Banner */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <UserAvatar user={currentUser} size="md" />
              <h3 className="font-extrabold text-white text-lg sm:text-xl font-mono">
                {currentUser.codename}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {currentUser.tier_badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Akumulasi: <strong className="text-white font-mono">{currentUser.total_xp} XP</strong> | Sistem Leveling (setiap 250 XP naik 1 Level).
            </p>
          </div>

          <div className="text-right font-mono">
            <span className="text-3xl font-black text-amber-400">Level {levelInfo.level}</span>
            <div className="text-[11px] text-slate-400">
              {levelInfo.xpNeededForNext > 0
                ? `${levelInfo.xpNeededForNext} XP lagi menuju Level ${levelInfo.level + 1}`
                : 'Maksimum Level'}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>Progress Level {levelInfo.level}</span>
            <span className="text-amber-400 font-bold">{levelInfo.progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#162238] overflow-hidden p-0.5 border border-[#1f293d]">
            <div
              className="h-full rounded-full bg-amber-400 shadow-sm transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. 4 Milestone Badges */}
      <div>
        <h4 className="font-bold text-white text-base mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Lencana Capaian & Milestone</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {milestones.map((ms) => (
            <div
              key={ms.id}
              className={`p-4 rounded-lg border transition-all ${
                ms.unlocked
                  ? 'bg-[#0f172a] border-amber-500/40 shadow-sm'
                  : 'bg-[#080d17]/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#111827] border border-[#1e293b] flex items-center justify-center mb-3">
                {ms.icon}
              </div>
              <div className="font-bold text-white text-sm flex items-center justify-between">
                <span>{ms.title}</span>
                {ms.unlocked ? (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                    TERBUKA
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">TERKUNCI</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{ms.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Diagnostik Ketuntasan Materi & Rekomendasi Modul */}
      <div>
        <h4 className="font-bold text-white text-base mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          <span>Diagnostik Ketuntasan &amp; Rekomendasi Modul</span>
        </h4>

        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#1f293d]">
                <tr>
                  <th className="py-3 px-4">Kategori Materi</th>
                  <th className="py-3 px-4">Game Selesai</th>
                  <th className="py-3 px-4">Rata-Rata Nilai</th>
                  <th className="py-3 px-4">Status Penguasaan</th>
                  <th className="py-3 px-4">Rekomendasi Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {Object.entries(categoryStats).map(([cat, stat]) => {
                  const avg = stat.count > 0 ? Math.round(stat.sumNilai / stat.count) : 0;
                  const isMastered = avg >= 80;
                  const isModerate = avg >= 50 && avg < 80;

                  return (
                    <tr key={cat} className="hover:bg-[#0f172a]">
                      <td className="py-3 px-4 font-bold text-white">{cat}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {stat.count} / {stat.total} Game
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={isMastered ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'}>
                          {stat.count > 0 ? `${avg}/100` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {stat.count === 0 ? (
                          <span className="text-slate-500">Belum Ada Submisi</span>
                        ) : isMastered ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🟢 Sangat Menguasai
                          </span>
                        ) : isModerate ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🟡 Cukup (Perlu Latihan)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            🔴 Butuh Pengayaan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {avg < 80 ? (
                          <div className="flex items-center gap-1.5 text-blue-300">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>Buka Modul &amp; Colab Pertemuan 1</span>
                          </div>
                        ) : (
                          <span className="text-emerald-400">✓ Siap Tantangan Hard / Team</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

