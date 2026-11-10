'use client';

import React, { useState, useEffect } from 'react';
import { Play, Send, Copy, Check, Terminal, Settings2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SupportedLanguage, TestCase, Verdict } from '@/types';
import { CODE_STARTERS } from '@/lib/mock-data';
import { evaluateCode, EvaluationResult } from '@/lib/judge/evaluator';
import VerdictBadge from './VerdictBadge';
import confetti from 'canvas-confetti';

interface CodeEditorProps {
  problemSlug: string;
  problemTitle: string;
  sampleTestCases: TestCase[];
  timeLimitMs?: number;
  contestId?: string;
  onSubmissionComplete?: (result: EvaluationResult, code: string, lang: SupportedLanguage) => void;
}

export default function CodeEditor({
  problemSlug,
  problemTitle,
  sampleTestCases,
  timeLimitMs = 1000,
  contestId,
  onSubmissionComplete,
}: CodeEditorProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('cpp');
  const [fontSize, setFontSize] = useState<number>(14);
  const [code, setCode] = useState<string>(CODE_STARTERS.cpp.default);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sample' | 'custom' | 'result'>('sample');
  const [customInput, setCustomInput] = useState<string>('');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Switch template code when language changes
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    if (CODE_STARTERS[newLang]) {
      setCode(CODE_STARTERS[newLang].default);
    }
  };

  // Reset to default template
  const handleResetTemplate = () => {
    if (confirm('Kembalikan kode ke template awal? Kode saat ini akan ditimpa.')) {
      setCode(CODE_STARTERS[language].default);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Tab key in code textarea to insert 4 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      // Ctrl+Enter / Cmd+Enter runs submission
      e.preventDefault();
      handleSubmit();
    }
  };

  // Run against sample tests
  const handleRunSample = () => {
    setIsEvaluating(true);
    setActiveTab('result');

    setTimeout(() => {
      const result = evaluateCode(language, code, sampleTestCases, timeLimitMs);
      setEvaluationResult(result);
      setIsEvaluating(false);

      if (result.verdict === 'AC') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    }, 400);
  };

  // Submit to judge
  const handleSubmit = () => {
    setIsEvaluating(true);
    setActiveTab('result');

    setTimeout(() => {
      const result = evaluateCode(language, code, sampleTestCases, timeLimitMs);
      setEvaluationResult(result);
      setIsEvaluating(false);

      if (result.verdict === 'AC') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      if (onSubmissionComplete) {
        onSubmissionComplete(result, code, language);
      }
    }, 700);
  };

  // Compute line numbers
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-arena-border rounded-xl overflow-hidden shadow-2xl">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0e1422] border-b border-arena-border">
        {/* Language & Settings */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Bahasa:</span>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-arena-card border border-arena-border text-slate-200 text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="cpp">C++ (g++ 17, -O3)</option>
              <option value="python">Python 3 (PyPy 3.10)</option>
              <option value="java">Java 21 (OpenJDK)</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className="text-xs text-slate-400">Ukuran Font:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-arena-card border border-arena-border text-slate-200 text-xs font-mono rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            title="Salin Kode"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleResetTemplate}
            title="Reset ke Template Awal"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRunSample}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Run Test</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
          >
            {isEvaluating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Code Textarea Area with Line Numbers */}
      <div className="relative flex-1 min-h-[360px] flex overflow-hidden bg-[#070a12]">
        {/* Line Numbers */}
        <div
          className="select-none py-3 px-3 bg-[#090d16] border-r border-arena-border text-slate-600 font-mono text-right"
          style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px`, minWidth: '42px' }}
        >
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 w-full h-full p-3 bg-transparent text-slate-200 font-mono resize-none focus:outline-none border-none code-font whitespace-pre overflow-auto"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize * 1.5}px`,
            tabSize: 4,
          }}
          placeholder="// Tulis kode pemrograman Anda di sini..."
        />
      </div>

      {/* Drawer / Test Cases & Execution Console */}
      <div className="bg-[#0b0f19] border-t border-arena-border">
        {/* Tab Header */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#0e1422] border-b border-arena-border text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('sample')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'sample'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sample Tests ({sampleTestCases.length})
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Input
            </button>

            <button
              onClick={() => setActiveTab('result')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'result'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Verdict & Log</span>
              {evaluationResult && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    evaluationResult.verdict === 'AC' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
              )}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Ctrl</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Enter</kbd> untuk submit
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-3 max-h-56 overflow-y-auto">
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {sampleTestCases.map((tc, idx) => (
                  <button
                    key={tc.id}
                    onClick={() => setSelectedSampleIndex(idx)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${
                      selectedSampleIndex === idx
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : 'bg-arena-card text-slate-400 border-arena-border hover:text-slate-200'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {sampleTestCases[selectedSampleIndex] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[11px] text-slate-400 font-sans block mb-1">Input Data:</span>
                    <pre className="p-2.5 bg-arena-dark rounded-lg border border-arena-border text-slate-200 overflow-x-auto whitespace-pre">
                      {sampleTestCases[selectedSampleIndex].input_data}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-sans block mb-1">Expected Output:</span>
                    <pre className="p-2.5 bg-arena-dark rounded-lg border border-arena-border text-emerald-400 overflow-x-auto whitespace-pre">
                      {sampleTestCases[selectedSampleIndex].expected_output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-2">
              <span className="text-xs text-slate-400">Masukkan data masukan khusus untuk pengujian:</span>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Contoh: 10&#10;16"
                className="w-full h-24 p-2.5 bg-arena-dark border border-arena-border rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {activeTab === 'result' && (
            <div>
              {isEvaluating ? (
                <div className="flex items-center gap-3 py-6 justify-center text-slate-400 text-xs font-mono">
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  <span>Mengeksekusi kode di sandbox judge... Menguji seluruh kasus uji.</span>
                </div>
              ) : evaluationResult ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-arena-dark rounded-lg border border-arena-border">
                    <div className="flex items-center gap-3">
                      <VerdictBadge verdict={evaluationResult.verdict} />
                      <span className="text-xs font-mono text-slate-300">
                        Skor: <strong className="text-white">{evaluationResult.score}/100</strong>
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Kasus Lolos:{' '}
                        <span className="text-emerald-400 font-bold">
                          {evaluationResult.passed_cases}
                        </span>
                        /{evaluationResult.total_cases}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span>Waktu: <strong>{evaluationResult.execution_time_ms} ms</strong></span>
                      <span>Memori: <strong>{evaluationResult.memory_kb} KB</strong></span>
                    </div>
                  </div>

                  {evaluationResult.error_message && (
                    <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>{evaluationResult.error_message}</div>
                    </div>
                  )}

                  {evaluationResult.details && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        Rincian Kasus Uji:
                      </span>
                      <div className="space-y-1.5">
                        {evaluationResult.details.map((d) => (
                          <div
                            key={d.case_index}
                            className="flex items-center justify-between p-2 rounded bg-arena-card border border-arena-border text-xs font-mono"
                          >
                            <div className="flex items-center gap-2">
                              {d.verdict === 'AC' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400" />
                              )}
                              <span>Test Case #{d.case_index} {d.is_sample ? '(Sample)' : '(Hidden)'}</span>
                            </div>
                            <VerdictBadge verdict={d.verdict} showIcon={false} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  Belum ada hasil eksekusi. Klik "Run Test" atau "Submit" untuk mengevaluasi kode.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

