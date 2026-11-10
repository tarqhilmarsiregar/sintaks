'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Code2, Search, ArrowRight, Filter } from 'lucide-react';
import { MOCK_PROBLEMS } from '@/lib/mock-data';

export default function ProblemsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');

  // Collect all unique tags
  const allTags = Array.from(new Set(MOCK_PROBLEMS.flatMap((p) => p.tags)));

  const filtered = MOCK_PROBLEMS.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = difficulty === 'ALL' || p.difficulty === difficulty;
    const matchesTag = selectedTag === 'ALL' || p.tags.includes(selectedTag);
    return matchesSearch && matchesDiff && matchesTag;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Bank Soal Algoritma & DSA</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Kumpulan soal pemrograman kompetitif untuk latihan mandiri dan persiapan olimpiade / perkuliahan.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-arena-card border border-arena-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul soal atau topik..."
            className="w-full bg-arena-dark border border-arena-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-arena-dark border border-arena-border text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">Semua Kesulitan</option>
            <option value="Easy">Easy (Mudah)</option>
            <option value="Medium">Medium (Sedang)</option>
            <option value="Hard">Hard (Sulit)</option>
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-arena-dark border border-arena-border text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">Semua Topik Algoritma</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems List */}
      <div className="bg-arena-card border border-arena-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b0f19] text-slate-400 border-b border-arena-border">
              <tr>
                <th className="py-3 px-4 text-center w-16 font-bold">#</th>
                <th className="py-3 px-4 font-bold font-sans">Judul Soal</th>
                <th className="py-3 px-4 font-bold">Tingkat Kesulitan</th>
                <th className="py-3 px-4 font-bold font-sans">Topik & Algoritma</th>
                <th className="py-3 px-4 text-center w-28 font-bold">Batas Waktu</th>
                <th className="py-3 px-4 text-right w-36 font-bold font-sans">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {filtered.map((prob) => (
                <tr key={prob.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-400 font-bold border border-blue-500/40">
                      {prob.order_letter}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <Link
                      href={`/problems/${prob.slug}`}
                      className="font-bold text-slate-100 hover:text-blue-400 text-sm transition-colors block"
                    >
                      {prob.title}
                    </Link>
                    <span className="text-[11px] text-slate-500 font-mono">Slug: {prob.slug}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        prob.difficulty === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : prob.difficulty === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {prob.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono bg-arena-dark text-slate-400 px-2 py-0.5 rounded border border-arena-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center text-slate-300">
                    {prob.time_limit_ms} ms
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/problems/${prob.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all font-sans"
                    >
                      <span>Latihan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
