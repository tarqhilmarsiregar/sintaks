'use client';

import React, { useState, useMemo } from 'react';
import { Game, Question, CreateQuestionDTO, UpdateQuestionDTO, ICPC_PROBLEMS_DEF } from '@/types/arena';
import { Problem, TestCase } from '@/types';
import { ArenaStore } from '@/lib/arena-store';
import ModalPortal from '@/components/common/ModalPortal';
import MathText from '@/components/common/MathText';
import {
  BookOpen,
  Key,
  Lightbulb,
  Trophy,
  Code2,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Terminal,
  Clock,
  Cpu,
  Layers,
  HelpCircle,
  Sliders,
} from 'lucide-react';

interface AdminQuestionBankTabProps {
  games: Game[];
  questions: Question[];
  onRefresh?: () => void;
  onAlert?: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminQuestionBankTab({
  games,
  questions,
  onRefresh,
  onAlert,
}: AdminQuestionBankTabProps) {
  // 1. Selector Game Terpilih
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id_game || 'G1');

  // 2. Sub-Tab Switcher: 'QUIZ' (Pilihan Ganda) vs 'CODING' (Online Judge & Testcase)
  const [subTab, setSubTab] = useState<'QUIZ' | 'CODING'>('QUIZ');

  // Data game & ICPC meta
  const selectedGame = games.find(g => g.id_game === selectedGameId);
  const icpcMeta = ICPC_PROBLEMS_DEF.find(p => p.gameId === selectedGameId);

  // Filter butir soal kuis untuk game terpilih
  const gameQuestions = useMemo(() => {
    return questions.filter(q => q.id_game === selectedGameId);
  }, [questions, selectedGameId]);

  // Coding Problem terkait dari ArenaStore
  const codingProblem: Problem | undefined = useMemo(() => {
    return ArenaStore.getCodingProblemForGame(selectedGameId);
  }, [selectedGameId, questions]);

  // -------------------------------------------------------------
  // STATE MODAL: SOAL KUIS (MCQ)
  // -------------------------------------------------------------
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [quizJudul, setQuizJudul] = useState('');
  const [quizNarasi, setQuizNarasi] = useState('');
  const [quizKode, setQuizKode] = useState('');
  const [quizOpsiA, setQuizOpsiA] = useState('');
  const [quizOpsiB, setQuizOpsiB] = useState('');
  const [quizOpsiC, setQuizOpsiC] = useState('');
  const [quizOpsiD, setQuizOpsiD] = useState('');
  const [quizKunci, setQuizKunci] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [quizHint, setQuizHint] = useState('');
  const [quizEditorial, setQuizEditorial] = useState('');
  const [quizPoin, setQuizPoin] = useState(50);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [editingQuiz, setEditingQuiz] = useState<Question | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<Question | null>(null);

  // Buka Modal Tambah Soal Kuis
  const handleOpenAddQuiz = () => {
    setQuizJudul('');
    setQuizNarasi('');
    setQuizKode('');
    setQuizOpsiA('');
    setQuizOpsiB('');
    setQuizOpsiC('');
    setQuizOpsiD('');
    setQuizKunci('A');
    setQuizHint('');
    setQuizEditorial('');
    setQuizPoin(50);
    setQuizError(null);
    setShowAddQuizModal(true);
  };

  // Submit Tambah Soal Kuis
  const handleAddQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizJudul.trim()) return setQuizError('Judul butir soal wajib diisi!');
    if (!quizNarasi.trim()) return setQuizError('Narasi butir soal wajib diisi!');
    if (!quizOpsiA.trim() || !quizOpsiB.trim()) {
      return setQuizError('Minimal Opsi A dan Opsi B wajib diisi!');
    }

    const opsiList = [quizOpsiA.trim(), quizOpsiB.trim()];
    if (quizOpsiC.trim()) opsiList.push(quizOpsiC.trim());
    if (quizOpsiD.trim()) opsiList.push(quizOpsiD.trim());

    const keyIdx = quizKunci === 'A' ? 0 : quizKunci === 'B' ? 1 : quizKunci === 'C' ? 2 : 3;
    const targetKunci = opsiList[keyIdx] || opsiList[0];

    const dto: CreateQuestionDTO = {
      id_game: selectedGameId,
      judul: quizJudul.trim(),
      narasi_soal: quizNarasi.trim(),
      cuplikan_kode: quizKode.trim() || undefined,
      opsi_jawaban: opsiList,
      kunci_jawaban: targetKunci,
      teks_hint: quizHint.trim() || undefined,
      editorial: quizEditorial.trim() || undefined,
      poin_dasar: Number(quizPoin) || 50,
    };

    const res = ArenaStore.createQuestion(dto);
    if (res.success) {
      setShowAddQuizModal(false);
      onAlert?.(res.message, 'success');
      onRefresh?.();
    } else {
      setQuizError(res.message);
    }
  };

  // Buka Modal Edit Soal Kuis
  const handleOpenEditQuiz = (q: Question) => {
    setEditingQuiz(q);
    setQuizJudul(q.judul);
    setQuizNarasi(q.narasi_soal);
    setQuizKode(q.cuplikan_kode || '');

    const opsis = (q.opsi_jawaban || '').split('|');
    setQuizOpsiA(opsis[0] || '');
    setQuizOpsiB(opsis[1] || '');
    setQuizOpsiC(opsis[2] || '');
    setQuizOpsiD(opsis[3] || '');

    if (q.kunci_jawaban === opsis[1]) setQuizKunci('B');
    else if (q.kunci_jawaban === opsis[2]) setQuizKunci('C');
    else if (q.kunci_jawaban === opsis[3]) setQuizKunci('D');
    else setQuizKunci('A');

    setQuizHint(q.teks_hint || '');
    setQuizEditorial(q.editorial || '');
    setQuizPoin(q.poin_dasar || 50);
    setQuizError(null);
  };

  // Submit Edit Soal Kuis
  const handleEditQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;
    if (!quizJudul.trim()) return setQuizError('Judul butir soal wajib diisi!');
    if (!quizNarasi.trim()) return setQuizError('Narasi butir soal wajib diisi!');

    const opsiList = [quizOpsiA.trim(), quizOpsiB.trim()];
    if (quizOpsiC.trim()) opsiList.push(quizOpsiC.trim());
    if (quizOpsiD.trim()) opsiList.push(quizOpsiD.trim());

    const keyIdx = quizKunci === 'A' ? 0 : quizKunci === 'B' ? 1 : quizKunci === 'C' ? 2 : 3;
    const targetKunci = opsiList[keyIdx] || opsiList[0];

    const updates: UpdateQuestionDTO = {
      judul: quizJudul.trim(),
      narasi_soal: quizNarasi.trim(),
      cuplikan_kode: quizKode.trim() || undefined,
      opsi_jawaban: opsiList,
      kunci_jawaban: targetKunci,
      teks_hint: quizHint.trim() || undefined,
      editorial: quizEditorial.trim() || undefined,
      poin_dasar: Number(quizPoin) || 50,
    };

    const res = ArenaStore.updateQuestion(editingQuiz.id_soal, updates);
    if (res.success) {
      setEditingQuiz(null);
      onAlert?.(res.message, 'success');
      onRefresh?.();
    } else {
      setQuizError(res.message);
    }
  };

  // Konfirmasi Hapus Soal Kuis
  const handleConfirmDeleteQuiz = () => {
    if (!deletingQuiz) return;
    const res = ArenaStore.deleteQuestion(deletingQuiz.id_soal);
    if (res.success) {
      setDeletingQuiz(null);
      onAlert?.(res.message, 'success');
      onRefresh?.();
    } else {
      onAlert?.(res.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // STATE MODAL: SOAL CODING (ONLINE JUDGE & TESTCASE)
  // -------------------------------------------------------------
  const [showCodingModal, setShowCodingModal] = useState(false);
  const [codeTitle, setCodeTitle] = useState('');
  const [codeSlug, setCodeSlug] = useState('');
  const [codeDifficulty, setCodeDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [codeTimeLimit, setCodeTimeLimit] = useState(1000);
  const [codeMemoryLimit, setCodeMemoryLimit] = useState(256);
  const [codeStatement, setCodeStatement] = useState('');
  const [codeInputFormat, setCodeInputFormat] = useState('');
  const [codeOutputFormat, setCodeOutputFormat] = useState('');
  const [codeConstraints, setCodeConstraints] = useState('');
  const [codeTags, setCodeTags] = useState('Algorithm, Online Judge');
  const [codeError, setCodeError] = useState<string | null>(null);

  // State Testcase Modal
  const [showTestcaseModal, setShowTestcaseModal] = useState(false);
  const [editingTestcaseIdx, setEditingTestcaseIdx] = useState<number | null>(null);
  const [tcInput, setTcInput] = useState('');
  const [tcOutput, setTcOutput] = useState('');
  const [tcExplanation, setTcExplanation] = useState('');
  const [tcIsSample, setTcIsSample] = useState(true);
  const [tcPoints, setTcPoints] = useState(25);
  const [deletingTestcaseIdx, setDeletingTestcaseIdx] = useState<number | null>(null);

  // Buka Modal Edit Coding Problem
  const handleOpenEditCoding = () => {
    if (!codingProblem) return;
    setCodeTitle(codingProblem.title);
    setCodeSlug(codingProblem.slug);
    setCodeDifficulty(codingProblem.difficulty);
    setCodeTimeLimit(codingProblem.time_limit_ms);
    setCodeMemoryLimit(codingProblem.memory_limit_mb);
    setCodeStatement(codingProblem.statement_md);
    setCodeInputFormat(codingProblem.input_format);
    setCodeOutputFormat(codingProblem.output_format);
    setCodeConstraints(codingProblem.constraints);
    setCodeTags(codingProblem.tags.join(', '));
    setCodeError(null);
    setShowCodingModal(true);
  };

  // Submit Simpan Coding Problem
  const handleCodingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeTitle.trim()) return setCodeError('Judul tantangan koding wajib diisi!');

    const tagsArr = codeTags.split(',').map(t => t.trim()).filter(Boolean);
    const updates = {
      game_id: selectedGameId,
      title: codeTitle.trim(),
      slug: codeSlug.trim() || undefined,
      difficulty: codeDifficulty,
      time_limit_ms: Number(codeTimeLimit) || 1000,
      memory_limit_mb: Number(codeMemoryLimit) || 256,
      statement_md: codeStatement.trim(),
      input_format: codeInputFormat.trim(),
      output_format: codeOutputFormat.trim(),
      constraints: codeConstraints.trim(),
      tags: tagsArr,
    };

    if (codingProblem) {
      const res = ArenaStore.updateCodingProblem(codingProblem.id, updates);
      if (res.success) {
        setShowCodingModal(false);
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        setCodeError(res.message);
      }
    } else {
      const res = ArenaStore.createCodingProblem(updates);
      if (res.success) {
        setShowCodingModal(false);
        onAlert?.(res.message, 'success');
        onRefresh?.();
      } else {
        setCodeError(res.message);
      }
    }
  };

  // Buka Modal Tambah Testcase Baru
  const handleOpenAddTestcase = () => {
    setEditingTestcaseIdx(null);
    setTcInput('');
    setTcOutput('');
    setTcExplanation('');
    setTcIsSample(true);
    setTcPoints(25);
    setShowTestcaseModal(true);
  };

  // Buka Modal Edit Testcase
  const handleOpenEditTestcase = (tc: TestCase, idx: number) => {
    setEditingTestcaseIdx(idx);
    setTcInput(tc.input_data);
    setTcOutput(tc.expected_output);
    setTcExplanation(tc.explanation || '');
    setTcIsSample(tc.is_sample);
    setTcPoints(tc.points || 25);
    setShowTestcaseModal(true);
  };

  // Submit Testcase
  const handleSaveTestcase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codingProblem) return;

    const currentTCs = [...(codingProblem.sample_test_cases || [])];
    const newTC: TestCase = {
      id: editingTestcaseIdx !== null ? currentTCs[editingTestcaseIdx].id : `tc-${Date.now().toString(36)}`,
      problem_id: codingProblem.id,
      input_data: tcInput,
      expected_output: tcOutput,
      explanation: tcExplanation.trim() || undefined,
      is_sample: tcIsSample,
      points: Number(tcPoints) || 25,
      order_index: editingTestcaseIdx !== null ? currentTCs[editingTestcaseIdx].order_index : currentTCs.length + 1,
    };

    if (editingTestcaseIdx !== null) {
      currentTCs[editingTestcaseIdx] = newTC;
    } else {
      currentTCs.push(newTC);
    }

    ArenaStore.updateCodingProblem(codingProblem.id, {
      sample_test_cases: currentTCs,
    });

    setShowTestcaseModal(false);
    onAlert?.(`Testcase berhasil ${editingTestcaseIdx !== null ? 'diperbarui' : 'ditambahkan'}!`, 'success');
    onRefresh?.();
  };

  // Hapus Testcase
  const handleConfirmDeleteTestcase = () => {
    if (!codingProblem || deletingTestcaseIdx === null) return;
    const currentTCs = [...(codingProblem.sample_test_cases || [])];
    currentTCs.splice(deletingTestcaseIdx, 1);

    ArenaStore.updateCodingProblem(codingProblem.id, {
      sample_test_cases: currentTCs,
    });

    setDeletingTestcaseIdx(null);
    onAlert?.('Testcase berhasil dihapus!', 'success');
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Selector Game */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bank Soal &amp; Kurikulum Kompetisi
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
            Pusat manajemen kurikulum: Butir soal kuis logika pilihan ganda terstruktur &amp; tantangan algoritma Problem Solving Online Judge terintegrasi testcase.
          </p>
        </div>

        {/* Dropdown Selector Game Paket */}
        {games.length > 0 && (
          <div className="flex items-center gap-2.5 shrink-0 font-mono">
            <span className="text-xs text-slate-400 font-bold">Pilih Paket:</span>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="bg-[#111827] border border-[#1e293b] rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {games.map((g, idx) => {
                const meta = ICPC_PROBLEMS_DEF.find(p => p.gameId === g.id_game);
                const letter = meta?.letter || String.fromCharCode(65 + (idx % 26));
                return (
                  <option key={g.id_game} value={g.id_game}>
                    Problem {letter} • {g.id_game} - {g.judul_game}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {games.length === 0 ? (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-12 text-center font-mono space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Belum Ada Paket Kontes Terdaftar</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Bank soal dikaitkan langsung dengan paket kontes dinamis. Silakan buat paket kontes terlebih dahulu di menu &quot;Kontrol Kontes &amp; Saklar&quot; sebelum menambahkan butir soal kuis atau tantangan koding.
            </p>
          </div>
          <a
            href="/admin/contests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Sliders className="w-4 h-4" />
            <span>+ Buat Paket Kontes di Kontrol Kontes &rarr;</span>
          </a>
        </div>
      ) : (
        <>

      {/* 2. Sub-Tab Switcher (Quiz vs Coding) */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 font-mono text-xs">
        <button
          onClick={() => setSubTab('QUIZ')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            subTab === 'QUIZ'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kuis Teori &amp; Logika ({gameQuestions.length} Soal)</span>
        </button>

        <button
          onClick={() => setSubTab('CODING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            subTab === 'CODING'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Tantangan Koding Online Judge ({codingProblem?.sample_test_cases?.length || 0} Testcases)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. SUB-TAB 1: KUIS TEORI & LOGIKA (MCQ CRUD)              */}
      {/* ========================================================= */}
      {subTab === 'QUIZ' && (
        <div className="space-y-4">
          {/* Action Bar Kuis */}
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              {icpcMeta && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#111827] text-white border border-[#1e293b]">
                  {icpcMeta.balloonEmoji} Problem {icpcMeta.letter}
                </span>
              )}
              <span className="font-bold text-white text-sm">{selectedGame?.judul_game}</span>
              <span className="text-slate-400">•</span>
              <span className="text-blue-400">{selectedGame?.kategori_materi}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-400 font-bold">Lulus ≥{selectedGame?.min_nilai_lulus}</span>
            </div>

            <button
              onClick={handleOpenAddQuiz}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Butir Soal Kuis</span>
            </button>
          </div>

          {/* Daftar Butir Soal Kuis */}
          {gameQuestions.length === 0 ? (
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-12 text-center text-slate-500 font-mono text-xs space-y-3">
              <p>Belum ada butir soal kuis pilihan ganda yang dibuat untuk paket {selectedGameId}.</p>
              <button
                onClick={handleOpenAddQuiz}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Soal Kuis Pertama</span>
              </button>
            </div>
          ) : (
            gameQuestions.map((q, idx) => {
              const opsis = (q.opsi_jawaban || '').split('|');

              return (
                <div
                  key={q.id_soal}
                  className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm space-y-3.5 font-mono text-xs"
                >
                  {/* Soal Header & Action Controls */}
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold text-xs">
                        #{idx + 1} ({q.id_soal})
                      </span>
                      <span className="font-bold text-white text-sm">
                        <MathText content={q.judul} inline />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                        {q.poin_dasar} XP
                      </span>
                      <button
                        onClick={() => handleOpenEditQuiz(q)}
                        className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white transition-colors"
                        title="Edit Butir Soal Kuis"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingQuiz(q)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-colors"
                        title="Hapus Butir Soal Kuis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Narasi Soal */}
                  <div className="text-slate-300 bg-[#080d18] p-3 rounded-lg border border-[#1e293b] leading-relaxed whitespace-pre-wrap">
                    <MathText content={q.narasi_soal} />
                  </div>

                  {/* Cuplikan Kode Jika Ada */}
                  {q.cuplikan_kode && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Cuplikan Kode Implementasi:</span>
                      </div>
                      <pre className="p-3.5 rounded-lg bg-[#060a14] text-emerald-400 text-xs overflow-x-auto border border-[#1e293b] leading-relaxed">
                        <code>{q.cuplikan_kode}</code>
                      </pre>
                    </div>
                  )}

                  {/* Pilihan Jawaban Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Pilihan Jawaban:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {opsis.map((opsi, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrect = opsi === q.kunci_jawaban;

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold shadow-sm'
                                : 'bg-[#111827] border-[#1e293b] text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                                isCorrect ? 'bg-emerald-500 text-black' : 'bg-[#1e293b] text-slate-400'
                              }`}>
                                {letter}
                              </span>
                              <span><MathText content={opsi} inline /></span>
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hint & Editorial Footer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#1e293b] text-[11px]">
                    {q.teks_hint && (
                      <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-300 flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <strong className="block text-amber-400">Petunjuk Hint:</strong>
                          <span><MathText content={q.teks_hint} inline /></span>
                        </div>
                      </div>
                    )}
                    {q.editorial && (
                      <div className="p-2 rounded bg-blue-950/20 border border-blue-500/20 text-blue-300 flex items-start gap-1.5">
                        <Key className="w-3.5 h-3.5 shrink-0 text-blue-400 mt-0.5" />
                        <div>
                          <strong className="block text-blue-400">Pembahasan Editorial:</strong>
                          <span><MathText content={q.editorial} inline /></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SUB-TAB 2: TANTANGAN KODING (ONLINE JUDGE & TESTCASES) */}
      {/* ========================================================= */}
      {subTab === 'CODING' && (
        <div className="space-y-4 font-mono text-xs">
          {codingProblem ? (
            <div className="space-y-5">
              {/* Problem Metadata Header Card */}
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#111827] text-white border border-[#1e293b]">
                        Problem {icpcMeta?.letter || 'Algoritma'}
                      </span>
                      <h3 className="font-bold text-white text-base">{codingProblem.title}</h3>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      Slug: <span className="text-blue-400 font-bold">{codingProblem.slug}</span> • Terhubung ke paket <strong>{selectedGameId}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenEditCoding}
                      className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Detail Soal</span>
                    </button>
                  </div>
                </div>

                {/* Spec Badges */}
                <div className="flex flex-wrap items-center gap-3 text-slate-300">
                  <span className="flex items-center gap-1 bg-[#080d18] px-2.5 py-1 rounded border border-[#1e293b]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Time Limit: <strong>{codingProblem.time_limit_ms}ms</strong></span>
                  </span>
                  <span className="flex items-center gap-1 bg-[#080d18] px-2.5 py-1 rounded border border-[#1e293b]">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>Memory: <strong>{codingProblem.memory_limit_mb}MB</strong></span>
                  </span>
                  <span className="flex items-center gap-1 bg-[#080d18] px-2.5 py-1 rounded border border-[#1e293b]">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Kesulitan: <strong>{codingProblem.difficulty}</strong></span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {codingProblem.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Deskripsi Problem Preview */}
                <div className="bg-[#080d18] p-4 rounded-lg border border-[#1e293b] space-y-3">
                  <div className="text-white font-bold text-xs uppercase tracking-wider text-slate-400">
                    Narasi Soal (Problem Statement):
                  </div>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <MathText content={codingProblem.statement_md} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1e293b]">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Format Masukan:</span>
                      <MathText content={codingProblem.input_format} className="text-slate-300 text-[11px]" />
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Format Keluaran:</span>
                      <MathText content={codingProblem.output_format} className="text-slate-300 text-[11px]" />
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Batasan (Constraints):</span>
                      <MathText content={codingProblem.constraints} inline className="text-emerald-400 text-[11px] font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Testcase Management Container */}
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#1e293b] bg-[#080d1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Manajemen Testcase Judge ({codingProblem.sample_test_cases?.length || 0} Testcases)
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Sample testcase ditampilkan kepada mahasiswa di editor, sedangkan hidden evaluation testcase digunakan judge untuk verifikasi AC/WA/TLE.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenAddTestcase}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Testcase Baru</span>
                  </button>
                </div>

                {/* Table of Testcases */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Tipe &amp; Poin</th>
                        <th className="p-3">Input Data</th>
                        <th className="p-3">Expected Output</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {!codingProblem.sample_test_cases || codingProblem.sample_test_cases.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Belum ada testcase untuk tantangan koding ini.
                          </td>
                        </tr>
                      ) : (
                        codingProblem.sample_test_cases.map((tc, idx) => (
                          <tr key={tc.id || idx} className="hover:bg-[#111827]/60 transition-colors">
                            <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                tc.is_sample
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/25'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                              }`}>
                                {tc.is_sample ? 'Sample Input' : 'Hidden Evaluation'}
                              </span>
                              <div className="text-[11px] text-slate-400 mt-0.5 font-bold">
                                {tc.points || 25} Poin
                              </div>
                            </td>
                            <td className="p-3 max-w-xs">
                              <pre className="p-2 rounded bg-[#060a14] border border-[#1e293b] text-slate-200 text-[11px] max-h-20 overflow-y-auto whitespace-pre-wrap">
                                {tc.input_data}
                              </pre>
                            </td>
                            <td className="p-3 max-w-xs">
                              <pre className="p-2 rounded bg-[#060a14] border border-[#1e293b] text-emerald-400 text-[11px] max-h-20 overflow-y-auto whitespace-pre-wrap">
                                {tc.expected_output}
                              </pre>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                              {tc.explanation || '-'}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditTestcase(tc, idx)}
                                  className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white transition-colors"
                                  title="Edit Testcase"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingTestcaseIdx(idx)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-colors"
                                  title="Hapus Testcase"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-12 text-center text-slate-500 space-y-3">
              <p>Belum ada tantangan koding Online Judge yang dihubungkan ke paket {selectedGameId}.</p>
              <button
                onClick={() => {
                  setCodeTitle(`Tantangan Algoritma ${selectedGame?.judul_game || selectedGameId}`);
                  setCodeSlug('');
                  setCodeDifficulty('Medium');
                  setCodeTimeLimit(1000);
                  setCodeMemoryLimit(256);
                  setCodeStatement('Diberikan array bilangan bulat...');
                  setCodeInputFormat('Baris pertama berisi integer N.');
                  setCodeOutputFormat('Cetak hasil perhitungan.');
                  setCodeConstraints('1 <= N <= 10^5');
                  setCodeTags('Algorithm, Ad-Hoc');
                  setCodeError(null);
                  setShowCodingModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat &amp; Hubungkan Tantangan Koding</span>
              </button>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* ========================================================= */}
      {/* 5. MODALS AREA (ALL WRAPPED IN MODALPORTAL LEVEL Z-[100]) */}
      {/* ========================================================= */}

      {/* MODAL 1: TAMBAH / EDIT BUTIR SOAL KUIS */}
      {(showAddQuizModal || editingQuiz) && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-xl w-full shadow-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-base">
                    {editingQuiz ? `Edit Butir Soal ${editingQuiz.id_soal}` : `Tambah Soal Kuis (${selectedGameId})`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddQuizModal(false);
                    setEditingQuiz(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={editingQuiz ? handleEditQuizSubmit : handleAddQuizSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                {quizError && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{quizError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Judul Soal *</label>
                    <input
                      type="text"
                      required
                      value={quizJudul}
                      onChange={(e) => setQuizJudul(e.target.value)}
                      placeholder="Contoh: Kompleksitas Waktu Nested Loop"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Poin Dasar (XP)</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={quizPoin}
                      onChange={(e) => setQuizPoin(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-amber-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Narasi Pertanyaan Soal *</label>
                  <textarea
                    rows={3}
                    required
                    value={quizNarasi}
                    onChange={(e) => setQuizNarasi(e.target.value)}
                    placeholder="Tuliskan pertanyaan konsep atau analisis logika..."
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cuplikan Kode Algoritma (Opsional)</label>
                  <textarea
                    rows={2}
                    value={quizKode}
                    onChange={(e) => setQuizKode(e.target.value)}
                    placeholder="for i in range(n):&#10;    for j in range(i, n): ..."
                    className="w-full bg-[#060a14] border border-[#1e293b] rounded-lg p-2.5 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 4 Opsi Jawaban + Radio Kunci Jawaban */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">Pilihan Jawaban (Tandai Kunci Benar):</span>
                    <span className="text-[11px] text-emerald-400 font-bold">Kunci: Opsi {quizKunci}</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'A' as const, val: quizOpsiA, setter: setQuizOpsiA },
                      { key: 'B' as const, val: quizOpsiB, setter: setQuizOpsiB },
                      { key: 'C' as const, val: quizOpsiC, setter: setQuizOpsiC },
                      { key: 'D' as const, val: quizOpsiD, setter: setQuizOpsiD },
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="quizKunciGroup"
                            checked={quizKunci === item.key}
                            onChange={() => setQuizKunci(item.key)}
                            className="text-emerald-500 focus:ring-0"
                          />
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                            quizKunci === item.key ? 'bg-emerald-500 text-black' : 'bg-[#111827] text-slate-400 border border-[#1e293b]'
                          }`}>
                            {item.key}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={item.val}
                          onChange={(e) => item.setter(e.target.value)}
                          placeholder={`Jawaban Pilihan ${item.key}...`}
                          className={`flex-1 bg-[#111827] border rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none ${
                            quizKunci === item.key ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-[#1e293b] focus:border-blue-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1e293b]">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Petunjuk Hint (Opsional)</label>
                    <textarea
                      rows={2}
                      value={quizHint}
                      onChange={(e) => setQuizHint(e.target.value)}
                      placeholder="Hint untuk mahasiswa (mengurangi 25 XP jika dibuka)..."
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2 text-amber-300 text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pembahasan Editorial</label>
                    <textarea
                      rows={2}
                      value={quizEditorial}
                      onChange={(e) => setQuizEditorial(e.target.value)}
                      placeholder="Penjelasan detail yang muncul setelah kuis selesai..."
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2 text-blue-300 text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddQuizModal(false);
                      setEditingQuiz(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                  >
                    {editingQuiz ? 'Simpan Perubahan' : 'Tambahkan Butir Soal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS SOAL KUIS */}
      {deletingQuiz && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setDeletingQuiz(null)}
          >
            <div
              className="bg-[#0c1222] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 pb-4 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Hapus Butir Soal {deletingQuiz.id_soal}?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">
                    {deletingQuiz.judul}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingQuiz(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151f33] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 p-3 rounded-lg bg-rose-950/25 border border-rose-500/25 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>
                  Butir soal ini akan dihapus dari paket kuis. Total butir soal untuk paket <strong>{deletingQuiz.id_game}</strong> akan disinkronkan secara otomatis.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setDeletingQuiz(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteQuiz}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Butir Soal</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 3: TAMBAH / EDIT CODING PROBLEM */}
      {showCodingModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-xl w-full shadow-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-base">
                    Konfigurasi Tantangan Koding Online Judge ({selectedGameId})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodingModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCodingSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                {codeError && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{codeError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Judul Tantangan *</label>
                    <input
                      type="text"
                      required
                      value={codeTitle}
                      onChange={(e) => setCodeTitle(e.target.value)}
                      placeholder="Contoh: Rotasi Matriks Spiral"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Slug URL (Opsional)</label>
                    <input
                      type="text"
                      value={codeSlug}
                      onChange={(e) => setCodeSlug(e.target.value)}
                      placeholder="rotasi-matriks-spiral (otomatis)"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tingkat Kesulitan</label>
                    <select
                      value={codeDifficulty}
                      onChange={(e) => setCodeDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Time Limit (ms)</label>
                    <input
                      type="number"
                      min={100}
                      max={10000}
                      step={100}
                      value={codeTimeLimit}
                      onChange={(e) => setCodeTimeLimit(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Memory (MB)</label>
                    <input
                      type="number"
                      min={64}
                      max={1024}
                      value={codeMemoryLimit}
                      onChange={(e) => setCodeMemoryLimit(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deskripsi Soal (Markdown Problem Statement)</label>
                  <textarea
                    rows={4}
                    required
                    value={codeStatement}
                    onChange={(e) => setCodeStatement(e.target.value)}
                    placeholder="Jelaskan skenario masalah algoritma..."
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Format Masukan</label>
                    <textarea
                      rows={2}
                      value={codeInputFormat}
                      onChange={(e) => setCodeInputFormat(e.target.value)}
                      placeholder="Baris pertama berisi integer T..."
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Format Keluaran</label>
                    <textarea
                      rows={2}
                      value={codeOutputFormat}
                      onChange={(e) => setCodeOutputFormat(e.target.value)}
                      placeholder="Cetak string jawaban per baris..."
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Batasan (Constraints)</label>
                    <input
                      type="text"
                      value={codeConstraints}
                      onChange={(e) => setCodeConstraints(e.target.value)}
                      placeholder="1 <= N <= 10^5, -10^9 <= Ai <= 10^9"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tags (Pisahkan Koma)</label>
                    <input
                      type="text"
                      value={codeTags}
                      onChange={(e) => setCodeTags(e.target.value)}
                      placeholder="Graph, Dijkstra, Shortest Path"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-blue-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setShowCodingModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                  >
                    Simpan Tantangan Koding
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 4: TAMBAH / EDIT TESTCASE JUDGE */}
      {showTestcaseModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-lg w-full shadow-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">
                    {editingTestcaseIdx !== null ? `Edit Testcase #${editingTestcaseIdx + 1}` : 'Tambah Testcase Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTestcaseModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTestcase} className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080d18] border border-[#1e293b]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={tcIsSample}
                      onChange={(e) => setTcIsSample(e.target.checked)}
                      className="rounded bg-[#111827] border-[#1e293b] text-blue-600 focus:ring-0"
                    />
                    <span>Sample Testcase (Tampil di Editor Mahasiswa)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Poin:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={tcPoints}
                      onChange={(e) => setTcPoints(Number(e.target.value))}
                      className="w-16 bg-[#111827] border border-[#1e293b] rounded px-2 py-1 text-amber-400 font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Input Data (Standard Input) *</label>
                  <textarea
                    rows={3}
                    required
                    value={tcInput}
                    onChange={(e) => setTcInput(e.target.value)}
                    placeholder="Contoh:&#10;5&#10;1 2 3 4 5"
                    className="w-full bg-[#060a14] border border-[#1e293b] rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500 whitespace-pre"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Output (Standard Output) *</label>
                  <textarea
                    rows={3}
                    required
                    value={tcOutput}
                    onChange={(e) => setTcOutput(e.target.value)}
                    placeholder="Contoh:&#10;15"
                    className="w-full bg-[#060a14] border border-[#1e293b] rounded-lg p-2.5 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-emerald-500 whitespace-pre"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Penjelasan Kasus Uji (Opsional)</label>
                  <textarea
                    rows={2}
                    value={tcExplanation}
                    onChange={(e) => setTcExplanation(e.target.value)}
                    placeholder="Penjelasan kenapa output tersebut dihasilkan..."
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg p-2 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setShowTestcaseModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-sm"
                  >
                    Simpan Testcase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 5: KONFIRMASI HAPUS TESTCASE */}
      {deletingTestcaseIdx !== null && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setDeletingTestcaseIdx(null)}
          >
            <div
              className="bg-[#0c1222] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 pb-4 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Hapus Testcase #{deletingTestcaseIdx + 1}?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Testcase ini tidak akan lagi diuji oleh Online Judge.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setDeletingTestcaseIdx(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTestcase}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Testcase</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
