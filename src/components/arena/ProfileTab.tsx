'use client';

import React, { useState } from 'react';
import { User, Team, Submission, Game } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { calculateLevelInfo } from '@/lib/gamification';
import UserAvatar from './UserAvatar';
import {
  UserCheck,
  ShieldCheck,
  Flame,
  Users,
  Trophy,
  CheckCircle2,
  Terminal,
  ArrowRight,
  AtSign,
  GraduationCap,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface ProfileTabProps {
  currentUser: User | null;
  onUpdateProfile: (newCodename: string, newAvatar: string) => boolean;
  teams?: Team[];
  submissions?: Submission[];
  games?: Game[];
}

export default function ProfileTab({
  currentUser,
  onUpdateProfile,
  teams,
  submissions,
  games
}: ProfileTabProps) {
  if (!currentUser) return null;

  const [codename, setCodename] = useState(currentUser.codename);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State Ganti Kata Sandi
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Fallback data resolver
  const allTeams = teams || ArenaStore.getTeams();
  const allSubs = submissions || ArenaStore.getSubmissions();
  const allGames = games || ArenaStore.getGames();

  // Temukan squad user jika ada
  const userTeam = allTeams.find(t =>
    t.id_tim === currentUser.id_tim ||
    t.daftar_nim_json.includes(currentUser.nim)
  );

  // Hitung metrik akademik mahasiswa
  const userSubs = allSubs.filter(s => s.nim === currentUser.nim && s.status_sesi === 'DONE');
  const totalNilai = userSubs.reduce((acc, s) => acc + s.nilai_akademik, 0);
  const rataNilai = userSubs.length > 0 ? Math.round(totalNilai / userSubs.length) : 0;
  const solvedCount = userSubs.filter(s => s.status_lulus === 'LULUS' || s.nilai_akademik >= 50).length;
  const levelInfo = calculateLevelInfo(currentUser.total_xp);

  // Buat inisial Monogram (contoh: Indra Setiawan -> "IS")
  const getInitials = (nama: string) => {
    const parts = nama.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const monogram = getInitials(currentUser.nama_lengkap);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCodename = codename.trim();
    if (!cleanCodename) {
      setErrorMsg('Codename tidak boleh kosong!');
      return;
    }
    if (cleanCodename.length < 3) {
      setErrorMsg('Codename minimal 3 karakter!');
      return;
    }

    // Gunakan monogram sebagai avatar standar profesional
    const ok = onUpdateProfile(cleanCodename, monogram);
    if (ok) {
      setErrorMsg('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } else {
      setErrorMsg('Gagal memperbarui profil di sistem.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword.trim()) {
      setPassError('Kata sandi saat ini wajib diisi.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setPassError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword.trim().toUpperCase() === currentUser.nim.toUpperCase()) {
      setPassError('Kata sandi baru tidak boleh sama dengan NIM Anda demi keamanan.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsChangingPass(true);
    try {
      let handledViaSupabase = false;
      try {
        const res = await fetch('/api/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'change',
            nim: currentUser.nim,
            oldPassword: oldPassword.trim(),
            newPassword: newPassword.trim(),
          }),
        });

        const data = await res.json();
        if (data?.mode === 'supabase') {
          handledViaSupabase = true;
          if (!res.ok || !data.success) {
            setPassError(data.error || 'Gagal memperbarui kata sandi di database.');
            return;
          }
          setPassSuccess('Kata sandi berhasil diperbarui dengan aman di database!');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => setPassSuccess(''), 4000);
        }
      } catch {
        // Fallback ke penyimpanan lokal
      }

      if (!handledViaSupabase) {
        const localRes = ArenaStore.changePassword(currentUser.nim, oldPassword, newPassword);
        if (localRes.success) {
          setPassSuccess('Kata sandi berhasil diperbarui dengan aman!');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => setPassSuccess(''), 4000);
        } else {
          setPassError(localRes.message);
        }
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ==================================================================== */}
      {/* 1. HERO ACADEMIC PROFILE BANNER (Industrial Monochrome / Clean)     */}
      {/* ==================================================================== */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Monogram Initial Avatar (Industrial Monochrome) */}
            <UserAvatar user={currentUser} size="xl" />

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-xl sm:text-2xl tracking-tight truncate">
                  {currentUser.nama_lengkap}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Kelas {currentUser.klub_hari}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Terverifikasi
                </span>
              </div>

              <div className="text-xs font-mono text-blue-400 mt-1 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold">{currentUser.codename}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">NIM: {currentUser.nim}</span>
              </div>

              <p className="text-xs font-mono text-slate-400 mt-1">
                {currentUser.prodi} ({currentUser.angkatan}) • Kelas Reguler: {currentUser.kelas_reguler} • STMIK TIME
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. THREE QUICK METRIC CARDS (XP, SQUAD ICPC, & ACADEMIC PERFORMANCE)  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        {/* Card 1: Akumulasi XP & Level */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase text-[11px] tracking-wider">Reputasi Algoritma</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl font-black text-white">
              {currentUser.total_xp} <span className="text-xs font-normal text-amber-400">XP</span>
            </div>
            <div className="text-xs text-blue-400 font-bold mt-0.5">
              Level {levelInfo.level} • {levelInfo.tierBadge}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Butuh <strong className="text-amber-400">{levelInfo.xpNeededForNext} XP</strong> ke Lv.{levelInfo.level + 1}
          </div>
        </div>

        {/* Card 2: Status Squad ICPC */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase text-[11px] tracking-wider">Squad ICPC DOMjudge</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white truncate">
              {userTeam ? userTeam.nama_tim : 'Belum Memiliki Tim'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {userTeam ? (
                <span className="text-cyan-300 font-bold">
                  Kode: [{userTeam.kode_gabung || userTeam.id_tim}]
                </span>
              ) : (
                <span className="text-amber-400/90">Bisa daftar di menu Tim</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            {userTeam ? (
              <span className="text-emerald-400 font-semibold">
                ● {userTeam.daftar_nim_json.length}/3 Anggota Terdaftar
              </span>
            ) : (
              <span>Kapasitas tim maksimal 3 mahasiswa</span>
            )}
          </div>
        </div>

        {/* Card 3: Kinerja Akademik & Solved */}
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase text-[11px] tracking-wider font-mono">Performa Kampus</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-black text-white">
              {rataNilai} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-xs text-emerald-400 font-bold mt-0.5">
              {solvedCount} Problem Solved (AC)
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Status: <strong className="text-slate-200">{rataNilai >= 70 ? '🟢 Tuntas Akademik' : '🟡 Perlu Peningkatan'}</strong>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. INFORMASI IDENTITAS AKADEMIK TERDAFTAR                            */}
      {/* ==================================================================== */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-sm">
        <h4 className="font-bold text-white text-base mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-400" />
          <span>Kredensial Akademik Mahasiswa (Terdaftar Resmi)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
          <div className="bg-[#080d1a] p-3.5 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] uppercase block mb-1">Nomor Induk Mahasiswa (NIM)</span>
            <div className="text-sm font-bold text-white">{currentUser.nim}</div>
          </div>

          <div className="bg-[#080d1a] p-3.5 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] uppercase block mb-1">Nama Lengkap Mahasiswa</span>
            <div className="text-sm font-bold text-white">{currentUser.nama_lengkap}</div>
          </div>

          <div className="bg-[#080d1a] p-3.5 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] uppercase block mb-1">Program Studi &amp; Angkatan</span>
            <div className="text-sm font-bold text-white">
              {currentUser.prodi} ({currentUser.angkatan})
            </div>
          </div>

          <div className="bg-[#080d1a] p-3.5 rounded-lg border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] uppercase block mb-1">Kelas Reguler &amp; Jadwal Lab</span>
            <div className="text-sm font-bold text-blue-400">
              {currentUser.kelas_reguler} • Hari {currentUser.klub_hari}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
          <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Kredensial login default Anda adalah NIM terdaftar. Data disinkronkan langsung dari basis data STMIK TIME.</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. FORM IDENTITAS KOMPETISI (DOMJUDGE CONTEST HANDLE)                */}
      {/* ==================================================================== */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-sm">
        <h4 className="font-bold text-white text-base mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>Identitas Kompetisi (DOMjudge Contest Handle)</span>
        </h4>
        <p className="text-xs text-slate-400 font-mono mb-4">
          Atur nama samaran teknis (handle) yang akan dipajang pada Scoreboard ICPC Matrix, Riwayat Submisi, dan pengumuman First Blood.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
              Contest Codename / Handle
            </label>
            <div className="relative max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
              <input
                type="text"
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                className="w-full bg-[#080d1a] border border-[#1e293b] rounded-lg pl-8 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Contoh: AlgoValkyrie atau SpeedCoder"
                maxLength={30}
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Gunakan karakter alfanumerik, underscore, atau tanda hubung (3–30 karakter).
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Contest Handle berhasil diperbarui dan aktif di Scoreboard ICPC!</span>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Simpan Perubahan Handle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* 5. KEAMANAN AKUN & PERBARUI KATA SANDI (Zero AI Slop)                */}
      {/* ==================================================================== */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-6 shadow-sm">
        <h4 className="font-bold text-white text-base mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Keamanan Akun &amp; Perbarui Kata Sandi</span>
        </h4>
        <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed">
          Ubah kata sandi akun Anda secara berkala. Pastikan kata sandi baru tidak menggunakan NIM dan memenuhi standar keamanan (minimal 6 karakter).
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
              Kata Sandi Saat Ini <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi saat ini"
                className="w-full bg-[#080d1a] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
                Kata Sandi Baru <span className="text-rose-400">*</span>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 karakter"
                className="w-full bg-[#080d1a] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
                Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full bg-[#080d1a] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {passError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isChangingPass}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a2333] disabled:text-slate-500 text-white font-bold text-xs font-mono shadow-sm transition-colors flex items-center gap-2"
          >
            <span>{isChangingPass ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
            <Lock className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
