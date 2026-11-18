'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Game, Question, Submission, User } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { seededShuffle } from '@/lib/shuffle';
import MathText from '@/components/common/MathText';
import { Clock, AlertTriangle, Lightbulb, Send, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import { fireConfetti } from '@/lib/confetti';

interface QuizArenaModalProps {
  isOpen: boolean;
  game: Game;
  currentUser: User;
  onFinishGame: (submission: Submission) => void;
  onCancel: () => void;
}

export default function QuizArenaModal({
  isOpen,
  game,
  currentUser,
  onFinishGame,
  onCancel
}: QuizArenaModalProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Dual Timers
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(game.durasi_total_menit * 60);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(game.durasi_per_soal_detik);

  // Form input & Hint states
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [openedHints, setOpenedHints] = useState<{ [qId: string]: boolean }>({});
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References for timers & race-free latest state
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const submissionRef = useRef<Submission | null>(null);
  const isFinishingRef = useRef(false);
  const handleAnswerRef = useRef<(isTimeout?: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    submissionRef.current = submission;
  }, [submission]);

  // 1. Initialize Sesi Submisi & Questions (Sinkron dengan Server Supabase sebelum Soal #1)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    isFinishingRef.current = false;

    const applySessionState = (sub: Submission) => {
      if (cancelled) return;
      submissionRef.current = sub;
      setSubmission(sub);

      // Ambil soal dengan urutan deterministik unik per peserta (Anti-Cheat Shuffling)
      const gameQs = ArenaStore.getQuestionsForUser(currentUser, game.id_game, sub);
      setQuestions(gameQs);

      // Hitung sisa waktu total berdasarkan timestamp_mulai
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(sub.timestamp_mulai).getTime()) / 1000
      );
      const maxTotalSec = game.durasi_total_menit * 60;
      const remainingTotal = Math.max(0, maxTotalSec - elapsedSeconds);
      setTotalSecondsLeft(remainingTotal);

      // Cari soal pertama yang belum dijawab
      const answeredIds = new Set(sub.detail_jawaban_json.map(d => d.id_soal));
      const firstUnanswered = gameQs.findIndex(q => !answeredIds.has(q.id_soal));
      setCurrentQIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
      setQuestionSecondsLeft(game.durasi_per_soal_detik);
    };

    const localSub = ArenaStore.startQuizSession(currentUser, game);
    applySessionState(localSub);

    // Pastikan sesi ACTIVE tercatat otoritatif di Supabase sebelum mahasiswa menjawab soal pertama
    fetch('/api/submissions/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'start',
        idGame: game.id_game,
        submissionId: localSub.id_submission,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.mode === 'supabase' && data?.submission) {
          ArenaStore.syncLocalSubmissionOnly(data.submission);
          applySessionState(data.submission);
        }
      })
      .catch(() => {
        // Mode offline / lokal tetap berjalan mulus dengan localSub
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, game, currentUser]);

  // 2. Anti-Cheat Visibility API Detection
  useEffect(() => {
    if (!isOpen || !submission || submission.status_sesi !== 'ACTIVE') return;

    const handleVisibilityChange = async () => {
      const activeSub = submissionRef.current;
      if (document.hidden && activeSub && activeSub.status_sesi === 'ACTIVE') {
        setAntiCheatWarning(
          `⚠️ PERINGATAN CURANG: Terdeteksi pindah tab! Nilai Akhir & Skor XP dipotong -5.`
        );
        setTimeout(() => setAntiCheatWarning(null), 6000);

        // Server-side audit sync terlebih dahulu di mode Supabase agar tidak menimpa DB dengan cache lokal
        try {
          const res = await fetch('/api/submissions/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              action: 'tab-switch',
              submissionId: activeSub.id_submission,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.mode === 'supabase' && data?.submission) {
              ArenaStore.syncLocalSubmissionOnly(data.submission);
              submissionRef.current = data.submission;
              setSubmission(data.submission);
              return;
            }
          }
        } catch {
          // Graceful offline fallback
        }

        const updated = ArenaStore.recordTabSwitch(activeSub.id_submission);
        if (updated) {
          submissionRef.current = updated;
          setSubmission(updated);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, submission?.id_submission, submission?.status_sesi]);

  // 3. Selesaikan Game Otomatis (Auto-Finish — Server-Authoritative di Mode Supabase)
  const completeGame = useCallback(async (overrideSub?: Submission) => {
    const targetSub = overrideSub || submissionRef.current;
    if (!targetSub || isFinishingRef.current) return;
    isFinishingRef.current = true;

    // Bersihkan timers
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    let finalSub: Submission | null = null;

    // 1. Prioritaskan penilaian otoritatif server Supabase (MENCEGAH skor tertimpa 0 oleh cache lokal!)
    try {
      const res = await fetch('/api/submissions/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'finish',
          submissionId: targetSub.id_submission,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.mode === 'supabase' && data?.submission) {
          finalSub = data.submission;
          ArenaStore.syncLocalSubmissionOnly(data.submission);
          // Tarik ulang XP & Level terbaru dari Supabase tanpa memicu write-through balik
          await ArenaStore.hydrateFromServer({
            role: currentUser.role,
            nim: currentUser.nim,
          });
        }
      }
    } catch {
      // Graceful offline fallback di bawah
    }

    // 2. Fallback lokal hanya jika mode lokal/offline (bukan Supabase live)
    if (!finalSub) {
      finalSub = ArenaStore.finishQuizSession(targetSub.id_submission);
    }

    submissionRef.current = finalSub;
    setSubmission(finalSub);

    // Confetti effect jika nilai >= batas kelulusan
    if (finalSub.nilai_akademik >= game.min_nilai_lulus) {
      fireConfetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    onFinishGame(finalSub);
  }, [game, currentUser, onFinishGame]);

  // 4. Timer 1: Total Game Timer
  useEffect(() => {
    if (!isOpen || !submission || submission.status_sesi !== 'ACTIVE') return;

    totalTimerRef.current = setInterval(() => {
      setTotalSecondsLeft(prev => {
        if (prev <= 1) {
          if (totalTimerRef.current) clearInterval(totalTimerRef.current);
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [isOpen, submission?.id_submission, submission?.status_sesi, completeGame]);

  // 5. Timer 2: Anti-AI Per-Soal Timer (menggunakan handleAnswerRef agar bebas stale closure)
  useEffect(() => {
    if (!isOpen || !submission || submission.status_sesi !== 'ACTIVE') return;

    questionTimerRef.current = setInterval(() => {
      setQuestionSecondsLeft(prev => {
        if (prev <= 1) {
          // Timeout tercapai -> Kunci soal saat ini & lompat
          handleAnswerRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [isOpen, submission?.id_submission, submission?.status_sesi, currentQIndex, questions.length]);

  // Reset timer per-soal saat berganti soal
  useEffect(() => {
    setSelectedOption('');
    setQuestionSecondsLeft(game.durasi_per_soal_detik);
  }, [currentQIndex, game.durasi_per_soal_detik]);

  // 6. Handle Kirim Jawaban Soal (One-Shot Lock & Auto-Jump)
  const handleAnswer = async (isTimeout: boolean = false) => {
    const activeSub = submissionRef.current;
    if (!activeSub || questions.length === 0 || isSubmitting || isFinishingRef.current) return;

    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    // Pastikan belum pernah dijawab
    const isAnswered = activeSub.detail_jawaban_json.some(d => d.id_soal === currentQ.id_soal);
    if (isAnswered) return;

    setIsSubmitting(true);
    const hasOpenedHint = !!openedHints[currentQ.id_soal];
    const jawabanValue = isTimeout ? '(TIMEOUT)' : selectedOption;

    let updatedSub = activeSub;
    try {
      const res = await fetch('/api/submissions/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: 'answer',
          submissionId: activeSub.id_submission,
          idSoal: currentQ.id_soal,
          jawaban: jawabanValue,
          isTimeout,
          openedHint: hasOpenedHint,
          sisaDetik: questionSecondsLeft,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.mode === 'supabase' && data?.submission) {
          updatedSub = data.submission;
          ArenaStore.syncLocalSubmissionOnly(data.submission);
        } else if (data?.submission) {
          updatedSub = data.submission;
        } else {
          const localRes = ArenaStore.answerQuestion({
            submissionId: activeSub.id_submission,
            idSoal: currentQ.id_soal,
            jawaban: jawabanValue,
            isTimeout,
            openedHint: hasOpenedHint,
            sisaDetik: questionSecondsLeft,
          });
          updatedSub = localRes.submission;
        }
      } else {
        const localRes = ArenaStore.answerQuestion({
          submissionId: activeSub.id_submission,
          idSoal: currentQ.id_soal,
          jawaban: jawabanValue,
          isTimeout,
          openedHint: hasOpenedHint,
          sisaDetik: questionSecondsLeft,
        });
        updatedSub = localRes.submission;
      }
    } catch {
      const localRes = ArenaStore.answerQuestion({
        submissionId: activeSub.id_submission,
        idSoal: currentQ.id_soal,
        jawaban: jawabanValue,
        isTimeout,
        openedHint: hasOpenedHint,
        sisaDetik: questionSecondsLeft,
      });
      updatedSub = localRes.submission;
    }

    submissionRef.current = updatedSub;
    setSubmission(updatedSub);
    setIsSubmitting(false);

    // Cari soal berikutnya yang belum dijawab
    const answeredIds = new Set(updatedSub.detail_jawaban_json.map(d => d.id_soal));
    const nextUnanswered = questions.findIndex(q => !answeredIds.has(q.id_soal));

    if (nextUnanswered !== -1) {
      // Ada soal lain yang belum dijawab -> Lompat otomatis
      setCurrentQIndex(nextUnanswered);
    } else {
      // Seluruh soal selesai terjawab -> Auto-Finish sesi dengan state terbaru
      completeGame(updatedSub);
    }
  };

  handleAnswerRef.current = handleAnswer;

  // Seluruh hooks wajib dipanggil sebelum conditional return (React Rules of Hooks)
  const currentQ = questions[currentQIndex];

  // Opsi pilihan ganda diacak deterministik per peserta & butir soal
  const parsedOptions = useMemo(() => {
    if (!currentQ?.opsi_jawaban) return [];
    const raw = currentQ.opsi_jawaban.split('|');
    if (raw.length <= 1 || !currentUser) return raw;
    return seededShuffle(raw, `${currentUser.nim}_${currentQ.id_soal}_OPTIONS`);
  }, [currentQ, currentUser]);

  if (!isOpen || !submission) return null;

  const isCurrentAnswered = currentQ
    ? submission.detail_jawaban_json.some(d => d.id_soal === currentQ.id_soal)
    : false;

  // Format menit:detik
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#090d16]/95 backdrop-blur-md select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-[#0b1120] border border-[#1f293d] rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Arena Kuis */}
        <div className="p-3 sm:p-4 bg-[#0f172a] border-b border-[#1f293d] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <span>{game.id_game} • {game.ref_pertemuan}</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400">Arena Ujian Ketat</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate max-w-md">
              {game.judul_game}
            </h3>
          </div>

          {/* Dual Timers Widget */}
          <div className="flex items-center gap-2 sm:gap-3 font-mono">
            {/* Timer 1: Total Game */}
            <div className="flex items-center gap-1.5 bg-[#162238] border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">Total:</span>
              <span className="font-extrabold text-blue-300">{formatTime(totalSecondsLeft)}</span>
            </div>

            {/* Timer 2: Anti-AI Per-Soal */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border font-extrabold transition-colors ${
                questionSecondsLeft <= 10
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-[#1a2333] border-amber-500/40 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Soal: {questionSecondsLeft}s</span>
            </div>
          </div>
        </div>

        {/* Anti-Cheat Notification Bar (Jika Terjadi Pelanggaran) */}
        {antiCheatWarning && (
          <div className="bg-rose-950/90 border-b border-rose-500 text-rose-200 px-4 py-2 text-xs font-mono flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{antiCheatWarning}</span>
          </div>
        )}

        {/* Question Selector Navigator (Number Tabs) */}
        <div className="p-3 bg-[#0d1424] border-b border-[#1f293d] flex items-center gap-2 overflow-x-auto">
          {questions.map((q, idx) => {
            const isAnswered = submission.detail_jawaban_json.some(d => d.id_soal === q.id_soal);
            const isCurrent = idx === currentQIndex;

            return (
              <button
                key={q.id_soal}
                onClick={() => {
                  if (!isAnswered) setCurrentQIndex(idx);
                }}
                disabled={isAnswered}
                className={`flex items-center justify-center min-w-[36px] h-9 rounded-lg text-xs font-mono font-bold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : isAnswered
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                    : 'bg-[#162238] text-slate-300 hover:bg-[#1f2e4a] border border-[#1f293d]'
                }`}
                title={isAnswered ? `Soal #${idx + 1} Terkunci (Sudah Dijawab)` : `Buka Soal #${idx + 1}`}
              >
                {isAnswered ? <Lock className="w-3 h-3" /> : `#${idx + 1}`}
              </button>
            );
          })}
        </div>

        {/* Question Body */}
        {currentQ ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-bold">
                  Soal {currentQIndex + 1} dari {questions.length}
                </span>
                <span
                  className="text-[10px] font-mono text-slate-400 bg-[#0e1626] border border-slate-700/60 px-1.5 py-0.5 rounded"
                  title="ID Soal Internal untuk Pengawas & Dosen"
                >
                  Ref: {currentQ.id_soal}
                </span>
              </div>
              <span className="text-xs font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                {currentQ.poin_dasar} Poin Dasar
              </span>
            </div>

            <h4 className="text-base font-bold text-white">
              <MathText content={currentQ.judul} inline />
            </h4>
            <MathText
              content={currentQ.narasi_soal}
              className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans"
            />

            {/* Code Snippet Box */}
            {currentQ.cuplikan_kode && (
              <pre className="p-3.5 bg-[#080d17] border border-[#1f293d] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre selection:bg-none">
                {currentQ.cuplikan_kode}
              </pre>
            )}

            {/* Hint Box & Button */}
            {currentQ.teks_hint && (
              <div className="pt-1">
                {openedHints[currentQ.id_soal] ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-xs text-amber-200 font-mono flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Petunjuk (Hint):</strong>{' '}
                      <MathText content={currentQ.teks_hint} inline />
                      <div className="text-[10px] text-amber-400/80 mt-1">
                        * Poin dasar dipotong -25 XP. Nilai akademik tetap utuh!
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenedHints(prev => ({ ...prev, [currentQ.id_soal]: true }))
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500/40 text-amber-400 text-xs font-mono transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Buka Hint (-25 XP dari Poin Dasar)</span>
                  </button>
                )}
              </div>
            )}

            {/* Options List (Multiple Choice) or Text Input (Short Answer) */}
            <div className="pt-2">
              <label className="block text-xs font-mono text-slate-400 mb-2 font-semibold">
                Pilih atau Masukkan Jawaban:
              </label>

              {parsedOptions.length > 0 ? (
                <div className="space-y-2">
                  {parsedOptions.map((opt, i) => (
                    <button
                      type="button"
                      key={i}
                      disabled={isCurrentAnswered}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full text-left p-3 rounded-lg text-xs sm:text-sm font-mono border transition-all flex items-center justify-between ${
                        selectedOption === opt
                          ? 'bg-blue-600/30 border-blue-400 text-white font-bold'
                          : 'bg-[#111827] border-[#1f293d] text-slate-300 hover:bg-[#162238]'
                      }`}
                    >
                      <MathText content={opt} inline />
                      <span>{opt}</span>
                      {selectedOption === opt && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  disabled={isCurrentAnswered}
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder="Ketik jawaban singkat di sini..."
                  className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            Tidak ada soal tersedia.
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="p-4 bg-[#0f172a] border-t border-[#1f293d] flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            * One-Shot Lock: Jawaban dikunci permanen begitu dikirim.
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleAnswer(false)}
              disabled={!selectedOption.trim() || isCurrentAnswered || isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs font-mono shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kunci & Kirim Jawaban (One-Shot)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

