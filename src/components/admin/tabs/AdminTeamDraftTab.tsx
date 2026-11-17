'use client';

import React, { useState, useMemo } from 'react';
import { Team, User, Cohort, KlubHari } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { calculateTeamFairnessMetrics } from '@/lib/gamification';
import ModalPortal from '@/components/common/ModalPortal';
import {
  Users,
  Shuffle,
  Shield,
  KeyRound,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Edit2,
  ArrowRightLeft,
  X,
  AlertTriangle,
  BarChart3,
  ArrowUpDown,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface AdminTeamDraftTabProps {
  teams: Team[];
  users?: User[];
  cohorts?: Cohort[];
  onGenerateTeams?: (klubHari: KlubHari) => void;
  onDisbandTeams?: (klubHari: KlubHari) => void;
  onGenerateCohortTeams?: (cohortId: string, teamSize: number) => { success: boolean; message: string };
  onDisbandCohortTeams?: (cohortId: string) => { success: boolean; message: string };
  onDisbandSingleTeam?: (teamId: string) => { success: boolean; message: string };
  onUpdateTeam?: (teamId: string, updates: { nama_tim?: string; leader_nim?: string }) => { success: boolean; message: string };
  onMoveMember?: (nim: string, targetTeamId: string) => { success: boolean; message: string };
  onRefresh?: () => void;
  onAlert?: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminTeamDraftTab({
  teams,
  users = [],
  cohorts = [],
  onGenerateTeams,
  onDisbandTeams,
  onGenerateCohortTeams,
  onDisbandCohortTeams,
  onDisbandSingleTeam,
  onUpdateTeam,
  onMoveMember,
  onRefresh,
  onAlert,
}: AdminTeamDraftTabProps) {
  // 1. State Filter Kelas Aktif & Pencarian
  const [selectedCohortId, setSelectedCohortId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 2. State Modal-Modal Interaktif (Strictly Zero AI Slop via ModalPortal)
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftTargetCohort, setDraftTargetCohort] = useState<string>('');
  const [draftTeamSize, setDraftTeamSize] = useState<number>(3);

  const [disbandCohortTarget, setDisbandCohortTarget] = useState<string | null>(null);
  const [disbandSingleTeamTarget, setDisbandSingleTeamTarget] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamLeader, setEditTeamLeader] = useState('');

  const [movingMember, setMovingMember] = useState<{ nim: string; name: string; currentTeamId: string } | null>(null);
  const [targetMoveTeamId, setTargetMoveTeamId] = useState('');

  // 3. Resolusi Daftar Kohort / Kelas (100% Murni Dinamis dari Input Admin, Zero Dummy Fallback)
  const availableCohorts = useMemo(() => {
    const dynamicList = cohorts && cohorts.length > 0 ? cohorts : ArenaStore.getCohorts();
    return dynamicList.map((c) => {
      const studentCount = users.filter(
        (u) => u.role === 'PESERTA' && (u.id_cohort === c.id_cohort || u.id_cohort === c.kode_kelas)
      ).length;
      return {
        id: c.id_cohort,
        name: c.nama_kelas,
        code: c.kode_kelas,
        studentCount,
      };
    });
  }, [cohorts, users]);

  // Set default modal cohort target saat modal dibuka
  const handleOpenDraftModal = (defaultCohortId?: string) => {
    const target = defaultCohortId || (selectedCohortId !== 'ALL' ? selectedCohortId : availableCohorts[0]?.id || '');
    setDraftTargetCohort(target);
    setDraftTeamSize(3);
    setIsDraftModalOpen(true);
  };

  // 4. Saring Tim Berdasarkan Kohort & Search
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (selectedCohortId !== 'ALL') {
        const matchesCohort = t.id_cohort === selectedCohortId;
        const matchesKlub = t.klub_hari === selectedCohortId;
        const targetCohortObj = availableCohorts.find((c) => c.id === selectedCohortId);
        const matchesCode = targetCohortObj && (t.klub_hari === targetCohortObj.code || t.id_cohort === targetCohortObj.id);
        if (!matchesCohort && !matchesKlub && !matchesCode) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.nama_tim.toLowerCase().includes(q);
        const matchCode = (t.kode_gabung || '').toLowerCase().includes(q);
        const matchMember = (t.daftar_nama_json || []).some((m) => m.toLowerCase().includes(q));
        const matchNim = (t.daftar_nim_json || []).some((nim) => nim.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchMember && !matchNim) return false;
      }

      return true;
    });
  }, [teams, selectedCohortId, searchQuery, availableCohorts]);

  // 5. Perhitungan Metrik Keseimbangan & Fairness (Analytics Card)
  const fairnessMetrics = useMemo(() => {
    return calculateTeamFairnessMetrics(filteredTeams);
  }, [filteredTeams]);

  // Handle Copy Join Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Eksekusi Generate Tim
  const handleExecuteDraft = () => {
    if (!draftTargetCohort) return;
    setIsDraftModalOpen(false);

    if (onGenerateCohortTeams) {
      const res = onGenerateCohortTeams(draftTargetCohort, draftTeamSize);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    } else if (['KAMIS', 'JUMAT', 'LOMBA'].includes(draftTargetCohort) && onGenerateTeams) {
      onGenerateTeams(draftTargetCohort as KlubHari);
      onAlert?.(`Tim berimbang untuk ${draftTargetCohort} berhasil dibuat!`, 'success');
      onRefresh?.();
    } else {
      const res = ArenaStore.generateTeamsForCohort(draftTargetCohort, draftTeamSize);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    }
  };

  // Eksekusi Bubarkan Tim Kelas
  const handleExecuteDisbandCohort = () => {
    if (!disbandCohortTarget) return;
    const target = disbandCohortTarget;
    setDisbandCohortTarget(null);

    if (onDisbandCohortTeams) {
      const res = onDisbandCohortTeams(target);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    } else if (['KAMIS', 'JUMAT', 'LOMBA'].includes(target) && onDisbandTeams) {
      onDisbandTeams(target as KlubHari);
      onAlert?.(`Seluruh tim Kelas ${target} berhasil dibubarkan.`, 'success');
      onRefresh?.();
    } else {
      const res = ArenaStore.disbandTeamsForCohort(target);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    }
  };

  // Eksekusi Bubarkan 1 Tim
  const handleExecuteDisbandSingleTeam = () => {
    if (!disbandSingleTeamTarget) return;
    const team = disbandSingleTeamTarget;
    setDisbandSingleTeamTarget(null);

    if (onDisbandSingleTeam) {
      const res = onDisbandSingleTeam(team.id_tim);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    } else {
      const res = ArenaStore.disbandTeam(team.id_tim, 'ADMIN');
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    }
  };

  // Eksekusi Update Nama / Leader Tim
  const handleExecuteUpdateTeam = () => {
    if (!editingTeam) return;
    const teamId = editingTeam.id_tim;
    const updates = {
      nama_tim: editTeamName,
      leader_nim: editTeamLeader,
    };
    setEditingTeam(null);

    if (onUpdateTeam) {
      const res = onUpdateTeam(teamId, updates);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    } else {
      const res = ArenaStore.updateTeamDetails(teamId, updates);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    }
  };

  // Eksekusi Pindahkan Anggota
  const handleExecuteMoveMember = () => {
    if (!movingMember || !targetMoveTeamId) return;
    const { nim } = movingMember;
    setMovingMember(null);

    if (onMoveMember) {
      const res = onMoveMember(nim, targetMoveTeamId);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    } else {
      const res = ArenaStore.moveTeamMember(nim, targetMoveTeamId);
      if (res.success) {
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        onAlert?.(res.message, 'error');
      }
    }
  };

  // Buka Modal Edit Tim
  const openEditModal = (t: Team) => {
    setEditingTeam(t);
    setEditTeamName(t.nama_tim);
    setEditTeamLeader(t.leader_nim || (t.daftar_nim_json && t.daftar_nim_json[0]) || '');
  };

  // Buka Modal Pindah Anggota
  const openMoveModal = (nim: string, name: string, currentTeamId: string) => {
    setMovingMember({ nim, name, currentTeamId });
    const availableTargets = filteredTeams.filter((t) => t.id_tim !== currentTeamId);
    setTargetMoveTeamId(availableTargets[0]?.id_tim || '');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions (Clean Industrial Aesthetic) */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Manajemen Tim &amp; Snake-Draft
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Distribusi skuad kompetitif berbasis algoritma Snake-Draft zig-zag (1 &rarr; 2 &rarr; 3 &rarr; 3 &rarr; 2 &rarr; 1) berdasarkan ranking XP untuk pemerataan kemampuan teknis.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => handleOpenDraftModal()}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Generate Snake-Draft</span>
          </button>

          {selectedCohortId !== 'ALL' && filteredTeams.length > 0 && (
            <button
              type="button"
              onClick={() => setDisbandCohortTarget(selectedCohortId)}
              className="px-3.5 py-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bubarkan Tim Kelas</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Kartu Analitik Keseimbangan & Fairness (Clean Utilitarian KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Tim */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Skuad</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {fairnessMetrics.totalTeams}
            <span className="text-xs text-slate-400 font-sans font-normal ml-1.5">
              ({fairnessMetrics.totalStudents} Mahasiswa)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedCohortId === 'ALL' ? 'Akumulasi seluruh kelas' : 'Kelas terpilih'}
          </div>
        </div>

        {/* KPI 2: Rata-rata Skor Skuad */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Rata-rata Skor Skuad</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {fairnessMetrics.averageXP.toLocaleString()}
            <span className="text-xs text-slate-400 font-sans font-normal ml-1">XP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Benchmark target antar-tim
          </div>
        </div>

        {/* KPI 3: Disparitas Max-Min (Delta XP) */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Disparitas Max - Min</span>
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {fairnessMetrics.deltaXP.toLocaleString()}
            <span className="text-xs text-slate-400 font-sans font-normal ml-1">XP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            Min: {fairnessMetrics.minXP} &bull; Max: {fairnessMetrics.maxXP} XP
          </div>
        </div>

        {/* KPI 4: Status Keseimbangan Algoritma */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Keseimbangan Algoritma</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-semibold mt-1">
            {fairnessMetrics.totalTeams === 0 ? (
              <span className="text-slate-500 font-normal">Belum ada tim</span>
            ) : fairnessMetrics.balanceRating === 'OPTIMAL' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Optimal (Deviasi &plusmn;{fairnessMetrics.deviationPercent}%)</span>
              </span>
            ) : fairnessMetrics.balanceRating === 'GOOD' ? (
              <span className="inline-flex items-center gap-1.5 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Seimbang (Deviasi &plusmn;{fairnessMetrics.deviationPercent}%)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Deviasi Cukup Tinggi (&plusmn;{fairnessMetrics.deviationPercent}%)</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Metode Snake-Draft Zig-Zag
          </div>
        </div>
      </div>

      {/* 3. Filter Bar Dinamis & Pencarian */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Pills Filter Kohort Dinamis */}
          <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-lg border border-[#1e293b] flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCohortId('ALL')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                selectedCohortId === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Kelas ({teams.length} Tim)
            </button>

            {availableCohorts.map((cohort) => {
              const teamCount = teams.filter(
                (t) => t.id_cohort === cohort.id || t.klub_hari === cohort.code || t.id_cohort === cohort.code
              ).length;

              return (
                <button
                  key={cohort.id}
                  type="button"
                  onClick={() => setSelectedCohortId(cohort.id)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    selectedCohortId === cohort.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cohort.name} ({teamCount} Tim)
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Pencarian Tim / Anggota */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tim, kode, NIM, nama..."
            className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. Grid Tim yang Terbentuk */}
      {filteredTeams.length === 0 ? (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-[#1e293b] text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Belum Ada Skuad Terbentuk
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
            {selectedCohortId === 'ALL'
              ? 'Belum ada tim yang dibentuk di kelas manapun. Tekan tombol di bawah untuk menjalankan algoritma Snake-Draft.'
              : `Belum ada tim di kelas ini. Jalankan Snake-Draft untuk membagi mahasiswa secara berimbang.`}
          </p>
          <button
            type="button"
            onClick={() => handleOpenDraftModal(selectedCohortId !== 'ALL' ? selectedCohortId : undefined)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Mulai Snake-Draft</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team, idx) => {
            const avgDiff = team.total_skor_tim - fairnessMetrics.averageXP;
            const avgDiffPercent = fairnessMetrics.averageXP > 0 ? Math.round((avgDiff / fairnessMetrics.averageXP) * 100) : 0;

            return (
              <div
                key={team.id_tim}
                className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Team Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#1e293b] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#1e293b] text-blue-300 font-mono">
                          #{idx + 1}
                        </span>
                        <h3 className="font-semibold text-white text-sm tracking-tight truncate">
                          {team.nama_tim}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {team.kode_gabung && (
                          <button
                            type="button"
                            onClick={() => handleCopyCode(team.kode_gabung!)}
                            className="px-2 py-0.5 rounded bg-[#111827] text-slate-300 border border-[#1e293b] text-[11px] font-mono flex items-center gap-1 hover:border-slate-600 transition-colors"
                            title="Salin kode gabung tim"
                          >
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span>[{team.kode_gabung}]</span>
                            {copiedCode === team.kode_gabung ? (
                              <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500 ml-0.5" />
                            )}
                          </button>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {team.klub_hari}
                        </span>
                      </div>
                    </div>

                    {/* Team Total Score & Disparity Indicator */}
                    <div className="text-right shrink-0">
                      <div className="text-amber-400 font-bold text-sm font-mono">
                        {team.total_skor_tim.toLocaleString()} XP
                      </div>
                      <div
                        className={`text-[10px] font-mono ${
                          avgDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {avgDiff >= 0 ? `+${avgDiffPercent}% vs avg` : `${avgDiffPercent}% vs avg`}
                      </div>
                    </div>
                  </div>

                  {/* Members Roster */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                      Anggota Skuad ({team.daftar_nim_json?.length || 0})
                    </div>

                    {team.daftar_nama_json?.map((nameWithCodename, i) => {
                      const nim = team.daftar_nim_json[i];
                      const isLeader = nim === team.leader_nim;
                      const memberUser = users.find((u) => u.nim === nim);

                      return (
                        <div
                          key={nim || i}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                            isLeader
                              ? 'bg-[#111827] border border-blue-500/30 text-white'
                              : 'bg-[#080d18] border border-[#1e293b] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            {isLeader ? (
                              <span title="Ketua Tim">
                                <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[10px] font-mono">#{i + 1}</span>
                            )}
                            <div className="truncate">
                              <div className="font-medium text-white truncate text-xs flex items-center gap-1.5">
                                <span>{memberUser?.codename || nameWithCodename}</span>
                                {isLeader && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/25">
                                    Ketua
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                <span className="font-mono">NIM: {nim}</span> &bull; {memberUser?.nama_lengkap || '-'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-amber-400 font-mono text-xs">
                              {memberUser?.total_xp || 0} XP
                            </span>
                            <button
                              type="button"
                              onClick={() => openMoveModal(nim, memberUser?.nama_lengkap || nameWithCodename, team.id_tim)}
                              className="p-1 rounded bg-[#111827] hover:bg-[#1e293b] text-slate-400 hover:text-white transition-colors"
                              title="Pindahkan anggota ke tim lain"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team Card Actions Footer */}
                <div className="border-t border-[#1e293b] pt-3 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => openEditModal(team)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    <span>Ubah Skuad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisbandSingleTeamTarget(team)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white font-medium transition-colors flex items-center gap-1.5"
                    title="Bubarkan skuad ini"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bubarkan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL-MODAL INTERAKTIF (Clean Utilitarian via ModalPortal) */}
      {/* ======================================================== */}

      {/* Modal 1: Generate Snake-Draft Tim */}
      {isDraftModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-lg w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Generate Tim Snake-Draft</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Membagi mahasiswa secara zig-zag Snake-Draft berdasarkan ranking total XP.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Konfigurasi */}
              {availableCohorts.length === 0 ? (
                <div className="py-6 px-4 rounded-xl bg-[#080d1a] border border-[#1e293b] text-center space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Belum Ada Kelas Terdaftar</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Sistem beroperasi dengan data murni dinamis. Silakan buat kelas terlebih dahulu di menu <strong>Kohort &amp; Kelas</strong> (/admin/classes) sebelum melakukan pembagian tim.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {/* Target Kelas */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Kelas / Kohort:
                    </label>
                    <select
                      value={draftTargetCohort}
                      onChange={(e) => setDraftTargetCohort(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      {availableCohorts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.studentCount} Mahasiswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ukuran Tim (Target Team Size) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ukuran Tim (Jumlah Mahasiswa per Skuad):
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 3, 4, 5].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setDraftTeamSize(size)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                            draftTeamSize === size
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                              : 'bg-[#111827] border-[#1e293b] text-slate-300 hover:text-white'
                          }`}
                        >
                          {size} Orang
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Simulation Preview */}
                  {(() => {
                    const targetObj = availableCohorts.find((c) => c.id === draftTargetCohort);
                    const count = targetObj?.studentCount || 0;
                    const estimatedTeams = Math.max(1, Math.ceil(count / draftTeamSize));

                    return (
                      <div className="bg-[#060a14] p-3.5 rounded-lg border border-[#1e293b] text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Mahasiswa:</span>
                          <span className="font-semibold text-white font-mono">{count} Orang</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Estimasi Skuad:</span>
                          <span className="font-semibold text-emerald-400 font-mono">{estimatedTeams} Tim</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          Mahasiswa rank #1 di tiap tim otomatis ditunjuk sebagai <strong>Ketua Tim</strong>. Susunan draft sebelumnya di kelas ini akan digantikan.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={availableCohorts.length === 0 || !draftTargetCohort}
                  onClick={handleExecuteDraft}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Jalankan Snake-Draft</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal 2: Konfirmasi Bubarkan Seluruh Tim Kelas */}
      {disbandCohortTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Bubarkan Seluruh Tim?</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Menghapus seluruh skuad yang terbentuk di kelas ini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisbandCohortTarget(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-lg text-xs text-rose-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Mahasiswa di kelas ini akan dilepaskan status timnya dan dapat dibagikan kembali ke tim baru kapan saja.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDisbandCohortTarget(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDisbandCohort}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Bubarkan Tim Kelas</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal 3: Konfirmasi Bubarkan 1 Tim Spesifik */}
      {disbandSingleTeamTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Bubarkan Skuad?</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Menghapus tim &quot;{disbandSingleTeamTarget.nama_tim}&quot; secara permanen.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisbandSingleTeamTarget(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#060a14] p-3 rounded-lg border border-[#1e293b] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Tim:</span>
                  <span className="font-semibold text-white">{disbandSingleTeamTarget.nama_tim}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kode Gabung:</span>
                  <span className="font-mono text-blue-400">{disbandSingleTeamTarget.kode_gabung || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jumlah Anggota:</span>
                  <span className="font-mono text-amber-400">{disbandSingleTeamTarget.daftar_nim_json?.length || 0} Mahasiswa</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDisbandSingleTeamTarget(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDisbandSingleTeam}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bubarkan Tim Ini</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal 4: Edit Tim (Ubah Nama & Tunjuk Leader Baru) */}
      {editingTeam && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Ubah Pengaturan Skuad</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sesuaikan nama tim atau tunjuk ketua tim baru.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Tim:
                  </label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tunjuk Ketua Tim:
                  </label>
                  <select
                    value={editTeamLeader}
                    onChange={(e) => setEditTeamLeader(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    {editingTeam.daftar_nim_json?.map((nim, i) => {
                      const u = users.find((usr) => usr.nim === nim);
                      return (
                        <option key={nim} value={nim}>
                          {u?.nama_lengkap || editingTeam.daftar_nama_json[i]} (NIM: {nim})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteUpdateTeam}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal 5: Pindahkan Anggota ke Tim Lain */}
      {movingMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Pindahkan Anggota Skuad</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pindahkan mahasiswa ke tim lain dan kalkulasi ulang skor tim.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMovingMember(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#060a14] p-3 rounded-lg border border-[#1e293b] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mahasiswa:</span>
                  <span className="font-semibold text-white">{movingMember.name} (<span className="font-mono">{movingMember.nim}</span>)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Skuad Tujuan:
                </label>
                <select
                  value={targetMoveTeamId}
                  onChange={(e) => setTargetMoveTeamId(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {filteredTeams
                    .filter((t) => t.id_tim !== movingMember.currentTeamId)
                    .map((t) => (
                      <option key={t.id_tim} value={t.id_tim}>
                        {t.nama_tim} ({t.daftar_nim_json?.length || 0} Anggota &bull; {t.total_skor_tim} XP)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setMovingMember(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-xs text-slate-300 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMoveMember}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Pindahkan Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
