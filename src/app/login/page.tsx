'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArenaStore } from '@/lib/arena-store';
import { SITE_CONFIG } from '@/config/site';
import {
  Lock,
  Contact,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

declare global {
  interface Window {
    grecaptcha?: {
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      ready?: (callback: () => void) => void;
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Jika sudah ada sesi aktif, langsung arahkan ke portal masing-masing
    const user = ArenaStore.getCurrentUser();
    if (user) {
      if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/mahasiswa');
      }
      return;
    }

    const siteKey =
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      '6Le4QR8uAAAAAJbAO6RYJuVmyABJO-HJFZHeWUsn';

    // Bersihkan script v2 atau elemen iframe lama jika ada
    const oldV2Script = document.getElementById('google-recaptcha-v2-script');
    if (oldV2Script) {
      oldV2Script.remove();
    }

    const scriptId = 'google-recaptcha-v3-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsRecaptchaReady(true);
      };
      document.head.appendChild(script);
    } else {
      setIsRecaptchaReady(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nim.trim()) {
      setError('Harap masukkan Nomor Induk Mahasiswa (NIM).');
      return;
    }

    if (!password.trim()) {
      setError('Harap masukkan kata sandi Anda.');
      return;
    }

    setLoading(true);

    const siteKey =
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      '6Le4QR8uAAAAAJbAO6RYJuVmyABJO-HJFZHeWUsn';

    let token: string | null = null;

    // Ambil token eksekusi reCAPTCHA v3
    if (!token) {
      try {
        token = await new Promise<string>((resolve, reject) => {
          if (typeof window !== 'undefined' && window.grecaptcha?.ready) {
            window.grecaptcha.ready(async () => {
              try {
                if (typeof window.grecaptcha?.execute === 'function') {
                  const t = await window.grecaptcha.execute(siteKey, { action: 'login' });
                  resolve(t);
                } else {
                  reject(new Error('Layanan grecaptcha.execute belum siap'));
                }
              } catch (e) {
                reject(e);
              }
            });
          } else {
            reject(new Error('reCAPTCHA v3 belum terinisialisasi'));
          }
        });
      } catch (err: any) {
        console.warn('Peringatan eksekusi reCAPTCHA v3:', err);
        // Fallback untuk pengujian offline
        token = 'demo-bypass-token';
      }
    }

    // Verifikasi token reCAPTCHA ke endpoint backend
    try {
      const verifyRes = await fetch('/api/auth/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setError(verifyData.error || 'Verifikasi reCAPTCHA v3 gagal. Terindikasi bot atau token tidak valid.');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Peringatan verifikasi server reCAPTCHA:', err);
    }

    const res = ArenaStore.login(nim, password);
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/mahasiswa');
      }
    } else {
      setError(res.message || 'Login gagal. Periksa kembali NIM dan Password Anda.');
    }
  };

  return (
    <div className="min-h-dvh bg-[#070b14] text-[#f1f5f9] font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* 1. Header Brand */}
      <header className="px-4 sm:px-8 lg:px-12 py-4 sm:py-6 shrink-0">
        <div className="flex items-center gap-3.5">
          {/* STMIK TIME Official Shield Logo */}
          <img
            src="/logo-stmik-time.png"
            alt="Logo STMIK TIME"
            className="w-10 h-10 object-contain drop-shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-lg tracking-tight font-mono">
                {SITE_CONFIG.brandMark}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#131d33] border border-[#223354] text-blue-400 uppercase tracking-wider">
                {SITE_CONFIG.subname}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">
              {SITE_CONFIG.institution.club}
            </p>
          </div>
        </div>
      </header>

      {/* 2. Main Content: 2 Columns */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 w-full flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">
          {/* Kolom Kiri: Hero & Code Window (Desktop / Large Screens) */}
          <div className="hidden lg:block lg:col-span-7 space-y-6">
            {/* Title & Subtitle */}
            <div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Competitive{' '}
                <span className="text-[#38bdf8] block">Execution Matrix</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mt-3 max-w-xl font-normal">
                High-concurrency compilation sandbox with microsecond isolation, strict POSIX runtime barriers, and deterministic memory sandboxing for university algorithmic matches.
              </p>
            </div>

            {/* Code Window Mockup */}
            <div className="rounded-2xl bg-[#0b101f] border border-[#1e293b] shadow-2xl overflow-hidden font-mono text-xs">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0d1527] border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  </div>
                  <span className="text-slate-300 text-xs font-mono ml-2">solution_twosum.py</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="px-2.5 py-0.5 rounded bg-[#162238] border border-blue-500/30 text-blue-400 font-semibold">
                    Python 3.12 (CPython)
                  </span>
                  <span className="text-slate-400 hidden sm:inline">O(n) Optimal</span>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="p-4 sm:p-5 text-xs font-mono leading-relaxed overflow-x-auto text-slate-300 select-none">
                <span className="text-slate-500 italic"># Two Sum Problem (STMIK TIME Judge)</span>
                <br />
                <span className="text-slate-500 italic"># Time Complexity: O(n) | Space: O(n)</span>
                <br />
                <br />
                <span className="text-rose-400">def</span>{' '}
                <span className="text-[#38bdf8] font-bold">find_target_pair</span>(
                <span className="text-slate-200">nums</span>:{' '}
                <span className="text-purple-400">list</span>[
                <span className="text-purple-400">int</span>],{' '}
                <span className="text-slate-200">target</span>:{' '}
                <span className="text-purple-400">int</span>) -&gt;{' '}
                <span className="text-purple-400">tuple</span>[
                <span className="text-purple-400">int</span>,{' '}
                <span className="text-purple-400">int</span>]:
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-slate-200">seen</span> = &#123;&#125;
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-rose-400">for</span>{' '}
                <span className="text-slate-200">idx, val</span>{' '}
                <span className="text-rose-400">in</span>{' '}
                <span className="text-amber-300">enumerate</span>(
                <span className="text-slate-200">nums</span>):
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-slate-200">diff</span> ={' '}
                <span className="text-slate-200">target</span> -{' '}
                <span className="text-slate-200">val</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-rose-400">if</span>{' '}
                <span className="text-slate-200">diff</span>{' '}
                <span className="text-rose-400">in</span>{' '}
                <span className="text-slate-200">seen</span>:
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-rose-400">return</span>{' '}
                <span className="text-slate-200">seen</span>[
                <span className="text-slate-200">diff</span>],{' '}
                <span className="text-slate-200">idx</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-slate-200">seen</span>[
                <span className="text-slate-200">val</span>] ={' '}
                <span className="text-slate-200">idx</span>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-rose-400">return</span>{' '}
                <span className="text-amber-400">-1, -1</span>
                <br />
                <br />
                <span className="text-slate-500 italic"># Sample execution for sandbox test</span>
                <br />
                <span className="text-slate-200">n, target</span> ={' '}
                <span className="text-amber-400">5, 9</span>
                <br />
                <span className="text-slate-200">arr</span> = [
                <span className="text-amber-400">2, 7, 11, 15, 3</span>]
                <br />
                <span className="text-slate-200">result</span> ={' '}
                <span className="text-[#38bdf8]">find_target_pair</span>(
                <span className="text-slate-200">arr, target</span>)
                <br />
                <span className="text-amber-300">print</span>(
                <span className="text-emerald-400">f&quot;Optimal indices: &#123;result&#125;&quot;</span>)
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#090e1a] border-t border-[#1e293b] text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> AC
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> WA
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> TLE
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> RTE
                  </span>
                </div>
                <div className="font-mono text-slate-400">Sandboxed Python v3.12</div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Login Card */}
          <div className="w-full lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-[#0d1424] border border-[#1e293b] rounded-2xl p-5 sm:p-8 shadow-2xl backdrop-blur-sm max-w-md w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Masuk ke {SITE_CONFIG.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
                Gunakan Nomor Induk Mahasiswa (NIM) dan kata sandi Anda.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Field 1: NIM */}
                <div>
                  <label htmlFor="nim" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nomor Induk Mahasiswa (NIM) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Contact className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="nim"
                      name="nim"
                      type="text"
                      required
                      autoComplete="username"
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="next"
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      placeholder="Masukkan NIM Anda"
                      className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="go"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full bg-[#080d1a] border border-[#1e293b] rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button (Clean Solid Industrial) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99] touch-manipulation disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Memverifikasi Keamanan & Masuk...' : `Masuk ke ${SITE_CONFIG.name} Arena`}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                {/* Google reCAPTCHA v3 Discrete Legal Attribution (ToS Compliant) */}
                <p className="text-[11px] text-slate-500 text-center font-sans pt-1">
                  Dilindungi oleh reCAPTCHA •{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-400 underline transition-colors"
                  >
                    Privasi
                  </a>{' '}
                  &amp;{' '}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-400 underline transition-colors"
                  >
                    Persyaratan
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="text-center py-4 sm:py-6 px-4 text-xs text-slate-500 font-sans shrink-0">
        {SITE_CONFIG.copyright}
      </footer>
    </div>
  );
}
