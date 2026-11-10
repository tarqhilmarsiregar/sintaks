import React from 'react';
import Link from 'next/link';
import { Trophy, Code2, Terminal, BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#070a12] border-t border-arena-border py-10 mt-auto text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-slate-100 tracking-wide text-base">CP ARENA</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Platform Pemrograman Kompetitif (Competitive Programming) resmi universitas.
              Dirancang untuk mengasah kemampuan mahasiswa dalam Struktur Data, Algoritma,
              dan penyelesaian masalah komputasional berstandar ACM-ICPC.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Login default mahasiswa: <strong>NIM & Password (NIM)</strong></span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Kategori Kontes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/contests" className="hover:text-cyan-400 transition-colors">
                  ICPC Annual Contest
                </Link>
              </li>
              <li>
                <Link href="/problems" className="hover:text-cyan-400 transition-colors">
                  Arsip Soal Algoritma
                </Link>
              </li>
              <li>
                <Link href="/contests/pam-2026/scoreboard" className="hover:text-cyan-400 transition-colors">
                  Live Scoreboard & Balloon
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Pedoman & Kurikulum
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Struktur Data & Algoritma</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>C++17, Python 3, Java 21</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Hosting: Vercel • DB: Supabase
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CP Arena. All Rights Reserved. Engineered with SDLC Principles.</p>
          <div className="flex items-center gap-4">
            <span className="bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60 text-slate-300 font-mono">
              v1.0.0-PROD
            </span>
            <span>Vercel + Supabase SSR Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
