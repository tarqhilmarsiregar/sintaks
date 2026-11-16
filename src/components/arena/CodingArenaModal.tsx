'use client';

import React, { useState } from 'react';
import { Problem, TestCase, SupportedLanguage } from '@/types';
import { Game } from '@/types/arena';
import CodeEditor from '@/components/CodeEditor';
import { EvaluationResult } from '@/lib/judge/evaluator';
import MathText from '@/components/common/MathText';
import {
  X,
  Clock,
  HardDrive,
  Tag,
  Copy,
  Check,
  Code2,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CodingArenaModalProps {
  isOpen: boolean;
  problem: Problem;
  sourceGame?: Game | null;
  onClose: () => void;
}

export default function CodingArenaModal({
  isOpen,
  problem,
  sourceGame,
  onClose,
}: CodingArenaModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen || !problem) return null;

  const copyToClipboard = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmissionComplete = (result: EvaluationResult) => {
    // Evaluation completed, verdict is shown in the CodeEditor console
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070b14] text-slate-100 overflow-hidden animate-fade-in font-sans">
      {/* 1. Top Bar */}
      <header className="h-14 bg-[#0b1120] border-b border-[#1e293b] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
              {problem.order_letter || 'A'}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {problem.title}
            </h2>
          </div>

          {sourceGame && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#131d33] border border-[#223354] text-slate-300 shrink-0">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Topik: {sourceGame.judul_game}</span>
            </span>
          )}
        </div>

        {/* Specs & Close */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400 border-r border-[#1e293b] pr-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{problem.time_limit_ms} ms</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>{problem.memory_limit_mb} MB</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${problem.difficulty === 'Easy'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : problem.difficulty === 'Medium'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                }`}
            >
              {problem.difficulty}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1e293b] text-slate-300 hover:text-white text-xs font-mono transition-colors"
          >
            <span>Kembali</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main 2-Column Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Kolom Kiri: Deskripsi Soal (5 Kolom) */}
        <div className="lg:col-span-5 h-full overflow-y-auto p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#1e293b] bg-[#0b1120] space-y-6">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#111827] border border-[#1e293b] text-slate-400"
              >
                <Tag className="w-3 h-3 text-slate-500" />
                <span>{tag}</span>
              </span>
            ))}
          </div>

          {/* Deskripsi Masalah */}
          <section className="space-y-2">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Deskripsi Masalah
            </h3>
            <MathText
              content={problem.statement_md}
              className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans"
            />
          </section>

          {/* Format Masukan */}
          <section className="space-y-2">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Format Masukan
            </h3>
            <MathText
              content={problem.input_format}
              className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-[#080d1a] border border-[#1e293b] p-3 rounded-lg"
            />
          </section>

          {/* Format Keluaran */}
          <section className="space-y-2">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Format Keluaran
            </h3>
            <MathText
              content={problem.output_format}
              className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-[#080d1a] border border-[#1e293b] p-3 rounded-lg"
            />
          </section>

          {/* Batasan (Constraints) */}
          <section className="space-y-2">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Batasan (Constraints)
            </h3>
            <MathText
              content={problem.constraints}
              className="text-xs font-mono text-amber-300/90 leading-relaxed bg-[#080d1a] border border-[#1e293b] p-3 rounded-lg"
            />
          </section>

          {/* Contoh Kasus Uji (Sample Testcases) */}
          <section className="space-y-3">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Contoh Kasus Uji
            </h3>

            {(problem.sample_test_cases || []).map((tc, idx) => (
              <div
                key={tc.id || idx}
                className="bg-[#080d1a] border border-[#1e293b] rounded-lg p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Contoh #{idx + 1}</span>
                  <button
                    onClick={() => copyToClipboard(tc.input_data, idx)}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Masukan</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">Masukan (Input):</div>
                    <pre className="p-2.5 rounded-lg bg-[#050811] border border-[#192437] text-slate-200 overflow-x-auto whitespace-pre">
                      {tc.input_data}
                    </pre>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">Keluaran (Output):</div>
                    <pre className="p-2.5 rounded-lg bg-[#050811] border border-[#192437] text-emerald-400 overflow-x-auto whitespace-pre">
                      {tc.expected_output}
                    </pre>
                  </div>
                </div>

                {tc.explanation && (
                  <div className="text-[11px] text-slate-400 font-sans pt-1 border-t border-[#1e293b]/50">
                    <strong className="text-slate-300">Penjelasan:</strong> {tc.explanation}
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>

        {/* Kolom Kanan: Code Editor & Execution Console (7 Kolom) */}
        <div className="lg:col-span-7 h-full flex flex-col bg-[#070a12] overflow-hidden">
          <CodeEditor
            problemSlug={problem.slug}
            problemTitle={problem.title}
            sampleTestCases={problem.sample_test_cases || []}
            timeLimitMs={problem.time_limit_ms}
            onSubmissionComplete={handleSubmissionComplete}
          />
        </div>
      </div>
    </div>
  );
}
