'use client';

import React, { useState } from 'react';
import { LeaderboardPlayer, Team, KlubHari } from '@/types/arena';
import UserAvatar from './UserAvatar';
import { Trophy, Swords } from 'lucide-react';

interface LeaderboardSidebarProps {
  players: LeaderboardPlayer[];
  teams: Team[];
  initialFilter?: KlubHari;
  onFilterChange: (klub: 'KAMIS' | 'JUMAT' | 'ALL') => void;
}

export default function LeaderboardSidebar({
  players,
  teams,
  initialFilter = 'KAMIS',
  onFilterChange
}: LeaderboardSidebarProps) {
  const [selectedFilter, setSelectedFilter] = useState<'KAMIS' | 'JUMAT' | 'ALL'>(
    initialFilter === 'ALL' ? 'KAMIS' : initialFilter
  );

  const handleFilter = (val: 'KAMIS' | 'JUMAT' | 'ALL') => {
    setSelectedFilter(val);
    onFilterChange(val);
  };

  const filteredTeams = teams.filter(t => selectedFilter === 'ALL' || t.klub_hari === selectedFilter);

  return (
    <div className="space-y-4">
      {/* 1. Leaderboard Pemain Card */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3 border-b border-[#1f293d] pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-white text-xs sm:text-sm tracking-wide">
              Leaderboard Pemain
            </h4>
          </div>

          {/* Filter Dropdown */}
          <select
            value={selectedFilter}
            onChange={(e) => handleFilter(e.target.value as any)}
            className="bg-[#111827] border border-[#1f293d] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="KAMIS">Kelas KAMIS</option>
            <option value="JUMAT">Kelas JUMAT</option>
            <option value="ALL">Semua Kelas</option>
          </select>
        </div>

        {/* Players List */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {players.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada data pemain.
            </div>
          ) : (
            players.map((p, idx) => {
              const rank = idx + 1;
              const rankBadge =
                rank === 1
                  ? '🥇'
                  : rank === 2
                  ? '🥈'
                  : rank === 3
                  ? '🥉'
                  : `${rank}`;

              return (
                <div
                  key={p.nim}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0f172a] hover:bg-[#162238] border border-transparent hover:border-slate-700/60 transition-colors text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-bold text-slate-300 shrink-0">
                      {rankBadge}
                    </span>
                    <UserAvatar user={{ codename: p.codename, nim: p.nim }} size="xs" />
                    <div className="truncate">
                      <div className="font-bold text-white truncate text-[11px]">
                        {p.codename}{' '}
                        <span className="text-slate-400 font-normal text-[10px]">({p.klub_hari})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Lv.{p.level} • Nilai Rata: {p.rata_nilai}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="font-extrabold text-amber-400 text-xs">
                      {p.total_xp} <span className="text-[10px] font-normal text-amber-500/70">XP</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Leaderboard Team Battle Card */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-[#1f293d] pb-2.5">
          <Swords className="w-4 h-4 text-blue-400" />
          <h4 className="font-bold text-white text-xs sm:text-sm tracking-wide">
            Leaderboard Team Battle
          </h4>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            Belum ada tim terbentuk di kelas ini.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTeams
              .sort((a, b) => b.total_skor_tim - a.total_skor_tim)
              .map((team, idx) => (
                <div
                  key={team.id_tim}
                  className="p-2.5 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white text-xs">
                      #{idx + 1} {team.nama_tim}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {team.daftar_nim_json.length} Anggota • {team.klub_hari}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold">{team.total_skor_tim} XP</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

