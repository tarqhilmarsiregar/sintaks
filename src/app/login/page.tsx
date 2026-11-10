'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, KeyRound, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authenticateStudent } from '@/lib/auth/student-auth';

export default function LoginPage() {
  const router = useRouter();
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authenticateStudent(nim, password);
      if (res.success && res.user) {
        if (res.user.role === 'lecturer' || res.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/contests');
        }
      } else {
        setError(res.error || 'Login gagal. Periksa kembali NIM dan Password Anda.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem saat autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoNim: string, demoPass: string) => {
    setNim(demoNim);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-arena-card border border-arena-border p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-xl shadow-blue-500/20 mb-4">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
              <Trophy className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Masuk ke CP Arena
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Portal Pemrograman Kompetitif & Ujian Algoritma Mahasiswa
          </p>
        </div>

        {/* Notice default credential */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-300 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Default Mahasiswa:</span> Gunakan{' '}
            <strong>NIM</strong> Anda dan masukkan Password yang sama dengan <strong>NIM</strong>.
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Contoh: 230101001"
                className="w-full bg-arena-dark border border-arena-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password (Default: NIM)
              </label>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full bg-arena-dark border border-arena-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none shadow-lg shadow-blue-500/25 transition-all"
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk ke Arena</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Credentials */}
        <div className="pt-4 border-t border-arena-border">
          <p className="text-[11px] font-medium text-slate-400 mb-2">
            Uji coba cepat dengan akun contoh:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => handleFillDemo('230101001', '230101001')}
              className="p-2 rounded-lg bg-arena-dark border border-arena-border hover:border-slate-600 text-left transition-colors"
            >
              <div className="text-slate-300 font-sans font-semibold text-[11px]">Mahasiswa A</div>
              <div className="text-slate-500 text-[10px]">NIM: 230101001</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('230101004', '230101004')}
              className="p-2 rounded-lg bg-arena-dark border border-arena-border hover:border-slate-600 text-left transition-colors"
            >
              <div className="text-slate-300 font-sans font-semibold text-[11px]">Mahasiswa B</div>
              <div className="text-slate-500 text-[10px]">NIM: 230101004</div>
            </button>
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => handleFillDemo('DOSEN001', 'dosen123')}
              className="w-full p-2 rounded-lg bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/50 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-purple-300 font-sans font-semibold text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Akun Dosen Pembina (Lecturer)</span>
                </div>
                <div className="text-purple-400/70 text-[10px] font-mono">
                  NIM: DOSEN001 • Pass: dosen123
                </div>
              </div>
              <span className="text-[10px] text-purple-400 font-sans">Isi Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
