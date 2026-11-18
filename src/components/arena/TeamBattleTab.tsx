'use client';

import React, { useState } from 'react';
import { User, Team, Game, TeamMemberInfo } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import UserAvatar from './UserAvatar';
import {
  Swords,
  KeyRound,
  Users,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  UserPlus,
  LogOut,
  Trash2,
  Crown,
  Shield,
  Info,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface TeamBattleTabProps {
  currentUser: User | null;
  teams: Team[];
  teamGames: Game[];
  onUnlockTeamGame: (gameId: string, pin: string) => boolean;
  onTeamUpdated?: () => void;
}

export default function TeamBattleTab({
  currentUser,
  teams,
  teamGames,
  onUnlockTeamGame,
  onTeamUpdated
}: TeamBattleTabProps) {
  // State Input & Form
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State PIN Game mode team
  const [pinInputs, setPinInputs] = useState<{ [gameId: string]: string }>({});
  const [feedback, setFeedback] = useState<{ [gameId: string]: { success?: boolean; msg?: string } }>({});

  // Temukan tim user saat ini
  const userTeam = teams.find(t =>
    t.id_tim === currentUser?.id_tim ||
    (currentUser && t.daftar_nim_json.includes(currentUser.nim))
  );

  const teamMembers: TeamMemberInfo[] = userTeam ? ArenaStore.getTeamMembers(userTeam) : [];
  const isLeader = Boolean(userTeam && currentUser && (userTeam.leader_nim === currentUser.nim || teamMembers[0]?.nim === currentUser.nim));

  // Copy kode tim ke clipboard
  const handleCopyCode = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  // 1. Gabung Tim dengan Kode (Si B atau Si C join ke Si A)
  const handleJoinWithCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    if (!joinCodeInput.trim()) {
      setActionAlert({ type: 'error', message: 'Masukkan Kode Tim 6-Karakter terlebih dahulu!' });
      return;
    }

    const res = ArenaStore.joinTeamWithCode(currentUser, joinCodeInput);
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      setJoinCodeInput('');
      if (onTeamUpdated) onTeamUpdated();
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
  };

  // 2. Buat Tim Baru (Si A mendirikan squad dan mendapat kode tim 6-karakter)
  const handleCreateNewTeam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    if (!newTeamNameInput.trim()) {
      setActionAlert({ type: 'error', message: 'Tuliskan Nama Tim Anda (minimal 3 karakter)!' });
      return;
    }

    const res = ArenaStore.createTeam(currentUser, newTeamNameInput);
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      setNewTeamNameInput('');
      if (onTeamUpdated) onTeamUpdated();
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
  };

  // 3. Keluar dari Tim (Leave Team)
  const handleLeaveTeam = () => {
    if (!currentUser) return;
    if (!confirm('Apakah Anda yakin ingin keluar dari squad ini? Anda dapat bergabung kembali atau membuat tim baru.')) return;

    const res = ArenaStore.leaveTeam(currentUser);
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      if (onTeamUpdated) onTeamUpdated();
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
  };

  // 4. Bubarkan Tim (Disband Team - Khusus Leader)
  const handleDisbandTeam = () => {
    if (!userTeam || !currentUser) return;
    if (!confirm(`PERINGATAN: Bubarkan tim "${userTeam.nama_tim}"? Semua anggota akan kembali menjadi peserta solo tanpa tim.`)) return;

    const res = ArenaStore.disbandTeam(userTeam.id_tim, currentUser.nim);
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      if (onTeamUpdated) onTeamUpdated();
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
  };

  // 5. Verifikasi PIN Game Kolaboratif
  const handleVerifyPin = (gameId: string) => {
    const pin = pinInputs[gameId] || '';
    if (!pin) {
      setFeedback(prev => ({ ...prev, [gameId]: { success: false, msg: 'Masukkan Kode PIN Game!' } }));
      return;
    }

    const ok = onUnlockTeamGame(gameId, pin);
    if (ok) {
      setFeedback(prev => ({ ...prev, [gameId]: { success: true, msg: 'PIN Valid! Game Terbuka untuk Squad.' } }));
    } else {
      setFeedback(prev => ({ ...prev, [gameId]: { success: false, msg: 'Kode PIN salah!' } }));
    }
  };

  const userCohortLabel = ArenaStore.resolveUserCohortName(currentUser);

  // Tim terbuka di kelas user yang masih punya slot kosong (< 3 anggota)
  const openTeamsInClass = teams.filter(t => {
    const sameClass = currentUser?.id_cohort
      ? t.id_cohort === currentUser.id_cohort
      : t.klub_hari === currentUser?.klub_hari;
    return sameClass && t.daftar_nim_json.length < 3 && t.id_tim !== userTeam?.id_tim;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi Aksi */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all duration-300 ${actionAlert.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* KONDISI A: MAHASISWA SUDAH TERGABUNG DALAM TIM                       */}
      {/* ==================================================================== */}
      {userTeam ? (
        <div className="space-y-6">
          {/* Hero Squad Card (Industrial Monochrome / Clean) */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-lg">

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Info Utama Tim */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/10 shrink-0">
                  ⚔️
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-white text-xl sm:text-2xl tracking-tight">
                      {userTeam.nama_tim}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {userCohortLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {userTeam.daftar_nim_json.length}/3 Anggota
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Squad resmi terdaftar untuk kompetisi internal pemrograman kompetitif ala DOMjudge / ICPC.
                  </p>
                </div>
              </div>

              {/* Spotlight Kode Gabung Tim (Hero Join Code) */}
              <div className="bg-[#080d1a] border border-[#223354] rounded-xl p-4 shadow-xl flex flex-col items-center sm:items-end w-full lg:w-auto">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kode Gabung Tim (Share ke Rekan)</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="px-4 py-2 rounded-lg bg-[#0d1527] border border-[#223354] font-mono text-xl sm:text-2xl font-black text-white tracking-widest select-all">
                    {userTeam.kode_gabung || userTeam.id_tim}
                  </div>
                  <button
                    onClick={() => handleCopyCode(userTeam.kode_gabung || userTeam.id_tim)}
                    className="px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                    title="Salin Kode Tim"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-2 text-center sm:text-right">
                  Akumulasi Tim: <span className="text-cyan-300 font-extrabold">{userTeam.total_skor_tim} XP</span>
                </div>
              </div>
            </div>

            {/* Roster 3 Anggota Tim (ICPC 3-Member Standard) */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <Users className="w-4 h-4" />
                  Roster Anggota Squad (Maksimal 3 Mahasiswa)
                </span>
                <span className="text-[11px] text-slate-400">
                  {userTeam.daftar_nim_json.length === 3 ? (
                    <span className="text-emerald-400 font-bold">● Roster Lengkap (Trio)</span>
                  ) : (
                    <span className="text-amber-400 font-bold">○ Masih Tersedia {3 - userTeam.daftar_nim_json.length} Slot</span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Slot 1: Ketua Tim / Member 1 */}
                {teamMembers[0] ? (
                  <div className="p-4 rounded-xl bg-[#080d1a] border border-blue-500/30 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={teamMembers[0]} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs truncate">
                            {teamMembers[0].codename}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            LEADER
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {teamMembers[0].nim} • {teamMembers[0].nama_lengkap}
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                          Lv.{teamMembers[0].level} • {teamMembers[0].total_xp} XP
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Slot 2: Anggota 2 (Si B) */}
                {teamMembers[1] ? (
                  <div className="p-4 rounded-xl bg-[#080d1a] border border-blue-500/30 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={teamMembers[1]} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs truncate">
                            {teamMembers[1].codename}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-mono font-bold">
                            MEMBER #2
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {teamMembers[1].nim} • {teamMembers[1].nama_lengkap}
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                          Lv.{teamMembers[1].level} • {teamMembers[1].total_xp} XP
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/20 flex flex-col items-center justify-center text-center py-5">
                    <UserPlus className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-mono font-semibold text-slate-300">Slot Anggota #2 Kosong</span>
                    <span className="text-xs font-mono text-slate-400 mt-0.5">
                      Bagikan Kode: <strong className="text-blue-400">{userTeam.kode_gabung || userTeam.id_tim}</strong>
                    </span>
                  </div>
                )}

                {/* Slot 3: Anggota 3 (Si C) */}
                {teamMembers[2] ? (
                  <div className="p-4 rounded-xl bg-[#080d1a] border border-blue-500/30 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={teamMembers[2]} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs truncate">
                            {teamMembers[2].codename}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-mono font-bold">
                            MEMBER #3
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {teamMembers[2].nim} • {teamMembers[2].nama_lengkap}
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                          Lv.{teamMembers[2].level} • {teamMembers[2].total_xp} XP
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/20 flex flex-col items-center justify-center text-center py-5">
                    <UserPlus className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-mono font-semibold text-slate-300">Slot Anggota #3 Kosong</span>
                    <span className="text-xs font-mono text-slate-400 mt-0.5">
                      Batas maksimal 3 mahasiswa ICPC
                    </span>
                  </div>
                )}
              </div>

              {/* Tombol Aksi Tim (Leave atau Disband) */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Status Tim: <strong className="text-white">Aktif &amp; Terdaftar di Scoreboard</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLeaveTeam}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Keluar dari Tim</span>
                  </button>

                  {isLeader && (
                    <button
                      onClick={handleDisbandTeam}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Bubarkan Tim</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* KONDISI B: MAHASISWA BELUM MEMILIKI TIM (JOIN OR CREATE SQUAD)       */
        /* ==================================================================== */
        <div className="space-y-6">
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-xl">
            <div className="max-w-2xl">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-[#131d33] border border-[#223354] px-2.5 py-1 rounded-md inline-block mb-2">
                DOMjudge Internal ICPC Registration
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Registrasi Squad &amp; Kode Gabung Tim
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Anda belum terdaftar dalam squad. Bergabunglah dengan rekan tim Anda menggunakan kode 6-karakter atau bentuk tim baru dan undang rekan Anda.
              </p>
            </div>

            {/* Dua Kartu Aksi Utama: Join vs Create */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {/* OPSI 1: GABUNG DENGAN KODE (Si B & Si C) */}
              <div className="bg-[#080d1a] border border-blue-500/30 rounded-lg p-5 flex flex-col justify-between hover:border-blue-400/50 transition-all shadow-lg">
                <div>
                  <div className="flex items-center gap-2.5 text-blue-400 mb-2">
                    <UserCheck className="w-5 h-5" />
                    <h4 className="font-extrabold text-white text-base">
                      1. Gabung Tim dengan Kode
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Minta <strong>Kode Tim 6-karakter</strong> dari ketua tim Anda (rekan tim Si A) untuk otomatis tergabung ke dalam squad mereka.
                  </p>

                  <form onSubmit={handleJoinWithCode} className="mt-4 space-y-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Masukkan Kode Tim (e.g. CP882A / TIMK01)
                      </label>
                      <input
                        type="text"
                        placeholder="KODE TIM (6 KARAKTER)"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        maxLength={12}
                        className="w-full bg-[#0d1527] border border-blue-500/30 rounded-lg px-3.5 py-2.5 text-base text-white uppercase tracking-widest font-mono font-bold focus:outline-none focus:border-blue-400 text-center"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Gabung ke Squad Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Kapasitas tim maksimal 3 mahasiswa per tim.</span>
                </div>
              </div>

              {/* OPSI 2: BUAT TIM BARU (Si A mendirikan squad) */}
              <div className="bg-[#080d1a] border border-emerald-500/30 rounded-lg p-5 flex flex-col justify-between hover:border-emerald-400/50 transition-all shadow-lg">
                <div>
                  <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h4 className="font-extrabold text-white text-base">
                      2. Bentuk Tim Baru (Buat Kode)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Bentuk tim baru, jadilah <strong>Ketua Tim</strong>, dan sistem akan otomatis menerbitkan kode tim untuk dibagikan ke rekan satu tim.
                  </p>

                  <form onSubmit={handleCreateNewTeam} className="mt-4 space-y-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Nama Tim / Squad Baru
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: AlgoKnights atau ByteBusters"
                        value={newTeamNameInput}
                        onChange={(e) => setNewTeamNameInput(e.target.value)}
                        maxLength={35}
                        className="w-full bg-[#0d1527] border border-emerald-500/30 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono font-semibold focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>Bentuk Tim &amp; Dapatkan Kode</span>
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tim akan terdaftar resmi di {userCohortLabel}.</span>
                </div>
              </div>
            </div>

            {/* DAFTAR TIM TERBUKA DI KELAS SAAT INI (JIKA ADA) */}
            {openTeamsInClass.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="text-xs font-mono font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Tim Terbuka di {userCohortLabel} (Slot Masih Tersedia):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {openTeamsInClass.map(team => (
                    <div
                      key={team.id_tim}
                      className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e293b] hover:border-blue-500/40 transition-colors flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-white truncate">{team.nama_tim}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {team.daftar_nim_json.length}/3 Anggota • {team.total_skor_tim} XP
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (team.kode_gabung) {
                            setJoinCodeInput(team.kode_gabung);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#131d33] border border-[#223354] text-blue-300 hover:text-white hover:bg-blue-900/60 text-[11px] font-bold shrink-0 transition-colors"
                      >
                        Pilih
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TEAM BATTLE ARENAS WITH PIN UNLOCKER (TANTANGAN KOLABORATIF)      */}
      {/* ==================================================================== */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Tantangan Kolaboratif Mode TEAM (PIN Terkunci Dosen)</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            {teamGames.length} Game Tersedia
          </span>
        </div>

        {teamGames.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#0b1120] rounded-xl border border-[#1e293b] font-mono">
            Tidak ada game mode TEAM yang aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamGames.map((game) => {
              const fb = feedback[game.id_game];

              return (
                <div
                  key={game.id_game}
                  className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-blue-400 mb-2">
                      <span>{game.id_game} • {game.ref_pertemuan}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        MODE TEAM
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-sm">{game.judul_game}</h5>
                    <p className="text-xs text-slate-400 mt-1">Kategori: {game.kategori_materi}</p>

                    <div className="mt-3 bg-[#111827] p-3 rounded-lg border border-[#1f293d] space-y-2">
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Akses PIN Terproteksi Dosen</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Masukkan PIN (e.g. TIME-882)"
                          value={pinInputs[game.id_game] || ''}
                          onChange={(e) =>
                            setPinInputs(prev => ({ ...prev, [game.id_game]: e.target.value }))
                          }
                          className="bg-[#090d16] border border-[#1f293d] rounded-lg px-3 py-1.5 text-xs text-white uppercase tracking-wider font-mono focus:outline-none focus:border-amber-500 flex-1"
                        />
                        <button
                          onClick={() => handleVerifyPin(game.id_game)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono shadow-sm transition-colors"
                        >
                          Buka
                        </button>
                      </div>

                      {fb && (
                        <div
                          className={`text-[11px] flex items-center gap-1.5 font-mono ${fb.success ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                          {fb.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          )}
                          <span>{fb.msg}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
