'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Code, Eye, X, Filter } from 'lucide-react';
import { MOCK_SUBMISSIONS } from '@/lib/mock-data';
import { Submission, Verdict } from '@/types';
import VerdictBadge from '@/components/VerdictBadge';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = submissions.filter((sub) => {
    const matchesVerdict = verdictFilter === 'ALL' || sub.verdict === verdictFilter;
    const matchesLang = languageFilter === 'ALL' || sub.language === languageFilter;
    const matchesSearch =
      (sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (sub.user_nim?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (sub.problem_title?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesVerdict && matchesLang && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Status Submisi</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Daftar riwayat submisi kode solusi oleh mahasiswa ke sistem juri otomatis.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIM, Nama Mahasiswa, atau Judul Soal..."
            className="w-full bg-arena-dark border border-arena-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-arena-dark border border-arena-border text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">Semua Verdict</option>
            <option value="AC">AC (Accepted)</option>
            <option value="WA">WA (Wrong Answer)</option>
            <option value="TLE">TLE (Time Limit Exceeded)</option>
            <option value="CE">CE (Compilation Error)</option>
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-arena-dark border border-arena-border text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">Semua Bahasa</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-arena-card border border-arena-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b0f19] text-slate-400 border-b border-arena-border">
              <tr>
                <th className="py-3 px-4 w-24">ID</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4 font-sans">Mahasiswa</th>
                <th className="py-3 px-4 font-sans">Soal</th>
                <th className="py-3 px-3">Bahasa</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-3 text-center">Waktu</th>
                <th className="py-3 px-3 text-center">Memori</th>
                <th className="py-3 px-3 text-right">Kode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-500 text-[11px]">#{sub.id}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(sub.created_at).toLocaleTimeString('id-ID')}
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-slate-200">{sub.user_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">NIM: {sub.user_nim}</div>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <span className="font-bold text-cyan-400 mr-1.5 font-mono">
                      {sub.problem_letter}
                    </span>
                    <span className="text-slate-200 font-medium">{sub.problem_title}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-300 font-mono uppercase">
                    {sub.language}
                  </td>

                  <td className="py-3 px-4">
                    <VerdictBadge verdict={sub.verdict} />
                  </td>

                  <td className="py-3 px-3 text-center text-slate-400 font-mono">
                    {sub.execution_time_ms} ms
                  </td>

                  <td className="py-3 px-3 text-center text-slate-400 font-mono">
                    {sub.memory_kb} KB
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="p-1.5 rounded-lg bg-arena-dark hover:bg-slate-700 text-slate-400 hover:text-white border border-arena-border transition-colors"
                      title="Lihat Source Code"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source Code Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-arena-card border border-arena-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#0e1422] border-b border-arena-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  Submisi #{selectedSubmission.id} — {selectedSubmission.problem_letter}. {selectedSubmission.problem_title}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedSubmission.user_name} (NIM: {selectedSubmission.user_nim}) • Bahasa: {selectedSubmission.language.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 flex items-center gap-3">
              <VerdictBadge verdict={selectedSubmission.verdict} />
              <span className="text-xs font-mono text-slate-400">
                Waktu: <strong>{selectedSubmission.execution_time_ms} ms</strong> | Memori:{' '}
                <strong>{selectedSubmission.memory_kb} KB</strong>
              </span>
            </div>

            <div className="px-4 flex-1 overflow-auto">
              <pre className="p-4 bg-arena-dark rounded-xl border border-arena-border text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre">
                {selectedSubmission.source_code}
              </pre>
            </div>

            <div className="p-4 border-t border-arena-border flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

