'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import ModalPortal from '@/components/common/ModalPortal';
import UserAvatar from '@/components/arena/UserAvatar';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Terminal,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface FirstLoginOnboardingModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onComplete: (updatedUser: User) => void;
}

export default function FirstLoginOnboardingModal({
  isOpen,
  currentUser,
  onComplete,
}: FirstLoginOnboardingModalProps) {
  if (!isOpen || !currentUser) return null;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codename, setCodename] = useState(currentUser.codename || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validasi Kata Sandi Real-time (Industrial Checklist)
  const isLengthValid = newPassword.trim().length >= 6;
  const isDifferentFromNim = newPassword.trim().toUpperCase() !== currentUser.nim.toUpperCase();
  const isMatch = newPassword.trim().length > 0 && newPassword === confirmPassword;
  const isFormValid = isLengthValid && isDifferentFromNim && isMatch && codename.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isLengthValid) {
      setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
      return;
    }
    if (!isDifferentFromNim) {
      setErrorMessage('Kata sandi baru tidak boleh sama dengan NIM Anda demi keamanan.');
      return;
    }
    if (!isMatch) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (codename.trim().length < 3) {
      setErrorMessage('Codename handle kompetisi minimal 3 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Call server API (Supabase live persistence)
      let syncedViaSupabase = false;
      try {
        const res = await fetch('/api/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            action: 'onboarding',
            nim: currentUser.nim,
            newPassword: newPassword.trim(),
            codename: codename.trim(),
            avatar: currentUser.avatar,
          }),
        });

        const data = await res.json();
        if (data?.mode === 'supabase') {
          if (!res.ok || !data.success) {
            setErrorMessage(data.error || 'Gagal menyimpan pembaruan akun ke database.');
            return;
          }
          syncedViaSupabase = true;
          const updatedUser: User = {
            ...currentUser,
            ...(data.user || {}),
            codename: codename.trim(),
            is_first_login: false,
            password_changed_at: data.user?.password_changed_at || new Date().toISOString(),
          };
          // Perbarui cache lokal (currentUser + users) secara sinkron bebas race-condition
          ArenaStore.markLocalUserOnboarded(updatedUser);
          onComplete(updatedUser);
          return;
        }
      } catch {
        // Fallback ke local store bila offline
      }

      // 2. Local ArenaStore persistence (mode lokal / offline)
      if (!syncedViaSupabase) {
        const localRes = ArenaStore.completeOnboarding({
          nim: currentUser.nim,
          newPassword: newPassword.trim(),
          codename: codename.trim(),
          avatar: currentUser.avatar,
        });

        if (!localRes.success || !localRes.user) {
          setErrorMessage(localRes.message || 'Gagal menyimpan pembaruan akun.');
          return;
        }

        onComplete(localRes.user);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi gangguan jaringan saat memperbarui akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col font-sans">
          {/* 1. Header Banner */}
          <div className="p-5 sm:p-6 bg-[#0e1629] border-b border-[#1e293b]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/25 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Prosedur Keamanan Wajib</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Inisialisasi Akun &amp; Pembaruan Kata Sandi
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Kredensial awal akun Anda saat ini masih menggunakan NIM bawaan. Demi keamanan nilai akademik dan privasi submisi, Anda wajib menetapkan kata sandi baru.
            </p>
          </div>

          {/* 2. Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Identity Summary Card */}
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#1e293b] flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <UserAvatar user={currentUser} size="md" />
                <div>
                  <div className="font-bold text-white text-sm">{currentUser.nama_lengkap}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    NIM: <span className="text-blue-300 font-semibold">{currentUser.nim}</span> &bull; {ArenaStore.resolveUserCohortName(currentUser)}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#111827] text-slate-400 border border-[#1e293b] shrink-0">
                STMIK TIME
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Password Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Kata Sandi Baru <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Security Requirement Checklist (Clean Utilitarian) */}
              <div className="p-3 rounded-lg bg-[#070b14] border border-[#1e293b] space-y-1.5 text-[11px] font-mono">
                <div className={`flex items-center gap-2 ${isLengthValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isLengthValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                    {isLengthValid ? '✓' : '•'}
                  </div>
                  <span>Minimal 6 karakter</span>
                </div>
                <div className={`flex items-center gap-2 ${isDifferentFromNim && newPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isDifferentFromNim && newPassword ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                    {isDifferentFromNim && newPassword ? '✓' : '•'}
                  </div>
                  <span>Tidak sama dengan NIM Anda</span>
                </div>
                <div className={`flex items-center gap-2 ${isMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                    {isMatch ? '✓' : '•'}
                  </div>
                  <span>Konfirmasi kata sandi cocok</span>
                </div>
              </div>
            </div>

            {/* Codename Handle Customization */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 font-mono">
                  Contest Handle / Codename
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Nama di Scoreboard</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="text"
                  value={codename}
                  onChange={(e) => setCodename(e.target.value)}
                  placeholder="Contoh: AlgoStar"
                  maxLength={30}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg pl-7 pr-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a2333] disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-xs font-mono shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Menyimpan Kredensial...</span>
                ) : (
                  <>
                    <span>Simpan &amp; Masuk ke Arena Pembelajaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-2 font-mono">
                Pembaruan ini tersimpan aman di sistem pangkalan data STMIK TIME.
              </p>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
