'use client';

import React from 'react';
import { Team, KlubHari } from '@/types/arena';
import { Users, Crown, KeyRound, AlertCircle } from 'lucide-react';

interface AdminTeamDraftTabProps {
  teams: Team[];
  onGenerateTeams: (klubHari: KlubHari) => void;
  onDisbandTeams: (klubHari: KlubHari) => void;
}

export default function AdminTeamDraftTab({
  teams,
  onGenerateTeams,
  onDisbandTeams,
}: AdminTeamDraftTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Header & Actions (Clean, Solid, Anti-AI Slop) */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Generator Tim Berimbang (Snake-Draft Algorithm)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
            Membagi mahasiswa secara zig-zag (1 &rarr; 2 &rarr; 3 &rarr; 3 &rarr; 2 &rarr; 1) berdasarkan ranking XP untuk pemerataan kemampuan teknis antar-squad (Maksimal 3 Mahasiswa per Tim).
          </p>
        </div>

        {/* Action Draft Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono text-xs">
          <button
            onClick={() => onGenerateTeams('KAMIS')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5 text-blue-200" />
            <span>Draft Tim KAMIS (15 SI)</span>
          </button>

          <button
            onClick={() => onGenerateTeams('JUMAT')}
            className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-white font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span>Draft Tim JUMAT (13 TI/SI)</span>
          </button>

          <button
            onClick={() => onGenerateTeams('LOMBA')}
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5 text-amber-200" />
            <span>Draft Tim LOMBA</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Daftar Tim per Kelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
        {(['KAMIS', 'JUMAT', 'LOMBA'] as const).map(klub => {
          const teamsInClass = teams.filter(t => t.klub_hari === klub);

          return (
            <div key={klub} className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <h3 className="font-bold text-white text-base">
                    Squad Kelas {klub}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#111827] text-slate-300 border border-[#1e293b] font-bold">
                    {teamsInClass.length} Tim
                  </span>
                </div>

                {teamsInClass.length > 0 && (
                  <button
                    onClick={() => onDisbandTeams(klub)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                  >
                    Bubarkan Tim
                  </button>
                )}
              </div>

              {teamsInClass.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-[#1e293b] rounded-lg p-6">
                  <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p>Belum ada tim terbentuk di Kelas {klub}.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Gunakan tombol <strong>Draft Tim {klub}</strong> di atas untuk membagi tim.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamsInClass.map((t, idx) => (
                    <div
                      key={t.id_tim}
                      className="bg-[#080d18] border border-[#1e293b] rounded-lg p-4 space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      {/* Team Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-black text-sm">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {t.nama_tim}
                          </span>
                          {t.kode_gabung && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25 text-xs font-bold flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-blue-400" />
                              <span>[{t.kode_gabung}]</span>
                            </span>
                          )}
                        </div>
                        <span className="text-amber-400 font-bold text-xs">
                          {t.total_skor_tim} XP
                        </span>
                      </div>

                      {/* Members Roster */}
                      <div className="space-y-1.5 pt-1">
                        {t.daftar_nama_json?.map((name, i) => {
                          const nim = t.daftar_nim_json[i];
                          const isLeader = nim === t.leader_nim;

                          return (
                            <div
                              key={nim || i}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                                isLeader
                                  ? 'bg-[#111827] border border-blue-500/30 text-white font-semibold'
                                  : 'bg-[#0b1120] border border-[#1e293b] text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isLeader && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                <span className="truncate">{name}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-normal shrink-0">
                                NIM: {nim} {isLeader && '• Leader'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
