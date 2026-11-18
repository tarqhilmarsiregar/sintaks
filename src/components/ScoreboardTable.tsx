'use client';

import React, { useState } from 'react';
import { ScoreboardParticipant } from '@/types';
import { Trophy, Award, Search, Zap } from 'lucide-react';

interface ScoreboardTableProps {
  participants: ScoreboardParticipant[];
  problemLetters: string[];
  isFrozen?: boolean;
}

export default function ScoreboardTable({
  participants,
  problemLetters,
  isFrozen = false,
}: ScoreboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Filter participants
  const classes = Array.from(new Set(participants.map((p) => p.class_group)));

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || p.class_group === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="bg-arena-card border border-arena-border rounded-xl overflow-hidden shadow-2xl">
      {/* Search & Filter Bar */}
      <div className="p-4 bg-[#0e1422] border-b border-arena-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-sm sm:text-base">
            ICPC Official Live Scoreboard
          </h3>
          {isFrozen && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Scoreboard Beku (Frozen)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-arena-dark border border-arena-border text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Kelas / Angkatan</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIM atau Nama..."
              className="w-full bg-arena-dark border border-arena-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Scoreboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#0b0f19] text-slate-400 border-b border-arena-border">
            <tr>
              <th className="py-3 px-3 text-center w-12 font-bold">#</th>
              <th className="py-3 px-4 font-bold font-sans">Peserta (Mahasiswa)</th>
              <th className="py-3 px-3 text-center w-20 font-bold text-emerald-400">Solved</th>
              <th className="py-3 px-3 text-center w-24 font-bold text-amber-400">Penalti</th>
              {problemLetters.map((letter) => (
                <th key={letter} className="py-3 px-2 text-center w-16 font-bold text-cyan-400">
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-arena-border">
            {filtered.map((p, index) => {
              const isTop3 = p.rank <= 3;

              return (
                <tr
                  key={p.user_id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isTop3 ? 'bg-blue-950/10' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-bold">
                    {p.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        1
                      </span>
                    ) : p.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40">
                        2
                      </span>
                    ) : p.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-500">{p.rank}</span>
                    )}
                  </td>

                  {/* Participant Info */}
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>{p.full_name}</span>
                      {p.rank === 1 && (
                        <Zap className="w-3.5 h-3.5 text-amber-400 inline" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                      <span>NIM: {p.nim}</span>
                      <span>•</span>
                      <span className="text-slate-500">{p.class_group}</span>
                    </div>
                  </td>

                  {/* Solved Count */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      {p.solved_count}
                    </span>
                  </td>

                  {/* Penalty */}
                  <td className="py-3 px-3 text-center text-slate-300 font-semibold">
                    {p.total_penalty} m
                  </td>

                  {/* Problem cells */}
                  {problemLetters.map((letter) => {
                    const prob = p.problems[letter];
                    if (!prob) {
                      return (
                        <td key={letter} className="py-3 px-2 text-center text-slate-700">
                          -
                        </td>
                      );
                    }

                    if (prob.solved) {
                      return (
                        <td key={letter} className="py-2 px-1 text-center">
                          <div
                            className={`p-1 rounded text-[11px] font-bold ${
                              prob.is_first_to_solve
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            <div>+{prob.attempts > 1 ? prob.attempts - 1 : ''}</div>
                            {prob.solved_at_minute !== undefined && (
                              <div className="text-[9px] opacity-80">{prob.solved_at_minute}m</div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    if (prob.attempts > 0) {
                      return (
                        <td key={letter} className="py-2 px-1 text-center">
                          <div className="p-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                            -{prob.attempts}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={letter} className="py-3 px-2 text-center text-slate-700">
                        .
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-[#0b0f19] border-t border-arena-border flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>First to Solve (Balon Pertama)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50 inline-block" />
            <span>Solved (Accepted)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50 inline-block" />
            <span>Rejected Attempt</span>
          </div>
        </div>

        <div className="text-slate-500">Standar Penalti ICPC: 20 menit per kesalahan submit</div>
      </div>
    </div>
  );
}

