'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Clock, HardDrive, Copy, Check } from 'lucide-react';
import { MOCK_PROBLEMS } from '@/lib/mock-data';
import CodeEditor from '@/components/CodeEditor';

export default function ProblemPracticePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const problem = MOCK_PROBLEMS.find((p) => p.slug === slug);

  const [copiedInputIndex, setCopiedInputIndex] = useState<number | null>(null);

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Soal tidak ditemukan.</h2>
        <Link href="/problems" className="text-blue-400 underline text-sm">
          Kembali ke Bank Soal
        </Link>
      </div>
    );
  }

  const handleCopyInput = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedInputIndex(index);
    setTimeout(() => setCopiedInputIndex(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-arena-dark overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-[#0a0f1d] border-b border-arena-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/problems"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Bank Soal</span>
          </Link>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {problem.order_letter}. {problem.title}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                problem.difficulty === 'Easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : problem.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {problem.difficulty}
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Mode Latihan Bebas
            </span>
          </div>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Pane: Problem Description */}
        <div className="lg:col-span-5 h-full overflow-y-auto border-r border-arena-border p-6 space-y-6 bg-[#080c16]">
          <div className="space-y-3 pb-4 border-b border-arena-border">
            <h1 className="text-2xl font-extrabold text-white">
              {problem.order_letter}. {problem.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5 bg-arena-card px-2.5 py-1 rounded-md border border-arena-border">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Batas Waktu: <strong>{problem.time_limit_ms} ms</strong></span>
              </div>

              <div className="flex items-center gap-1.5 bg-arena-card px-2.5 py-1 rounded-md border border-arena-border">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Batas Memori: <strong>{problem.memory_limit_mb} MB</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono text-slate-400 bg-arena-dark px-2 py-0.5 rounded border border-arena-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Deskripsi Soal
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line font-sans">
              {problem.statement_md}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Format Masukan
            </h3>
            <div className="p-3 bg-arena-card rounded-xl border border-arena-border text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {problem.input_format}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Format Keluaran
            </h3>
            <div className="p-3 bg-arena-card rounded-xl border border-arena-border text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {problem.output_format}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Batasan (Constraints)
            </h3>
            <div className="p-3 bg-arena-dark rounded-xl border border-arena-border text-xs font-mono text-amber-300 leading-relaxed whitespace-pre-line">
              {problem.constraints}
            </div>
          </div>

          {problem.sample_test_cases && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contoh Kasus Uji (Sample Test Cases)
              </h3>

              {problem.sample_test_cases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="bg-arena-card border border-arena-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Contoh #{index + 1}</span>
                    <button
                      onClick={() => handleCopyInput(tc.input_data, index)}
                      className="flex items-center gap-1 text-[11px] font-normal text-slate-400 hover:text-white"
                    >
                      {copiedInputIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Input</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[11px] text-slate-500 font-sans block mb-1">
                        Contoh Masukan:
                      </span>
                      <pre className="p-2.5 bg-arena-dark rounded-lg border border-arena-border text-slate-200 overflow-x-auto whitespace-pre">
                        {tc.input_data}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-sans block mb-1">
                        Contoh Keluaran:
                      </span>
                      <pre className="p-2.5 bg-arena-dark rounded-lg border border-arena-border text-emerald-400 overflow-x-auto whitespace-pre">
                        {tc.expected_output}
                      </pre>
                    </div>
                  </div>

                  {tc.explanation && (
                    <div className="pt-1 text-[11px] text-slate-400 font-sans italic border-t border-slate-800">
                      <strong>Penjelasan:</strong> {tc.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor */}
        <div className="lg:col-span-7 h-full p-3 sm:p-4 bg-[#060911] overflow-hidden flex flex-col">
          <CodeEditor
            problemSlug={problem.slug}
            problemTitle={problem.title}
            sampleTestCases={problem.sample_test_cases || []}
            timeLimitMs={problem.time_limit_ms}
          />
        </div>
      </div>
    </div>
  );
}

