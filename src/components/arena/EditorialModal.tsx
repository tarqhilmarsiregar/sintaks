'use client';

import React, { useMemo } from 'react';
import { Game, Submission, Question } from '@/types/arena';
import { Problem } from '@/types';
import { getCodingProblemForGame } from '@/lib/problem-mapping';
import MathText from '@/components/common/MathText';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Clock,
  Code2,
  ArrowRight,
  Terminal,
  Lightbulb,
} from 'lucide-react';

interface EditorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  submission: Submission | null;
  questions: Question[];
  onStartCoding?: (problem: Problem, game: Game) => void;
}

export default function EditorialModal({
  isOpen,
  onClose,
  game,
  submission,
  questions,
  onStartCoding,
}: EditorialModalProps) {
  if (!isOpen || !game || !submission) return null;

  // Anti-Cheat Guard: Editorial hanya dapat diakses setelah sesi selesai (DONE)
  if (submission.status_sesi !== 'DONE') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#0b1120] border border-amber-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl font-mono text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Editorial Masih Terkunci</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pembahasan soal dan editorial hanya dapat diakses setelah sesi pengerjaan kuis selesai (Status: Selesai).
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-white text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const gameQuestions = useMemo(() => {
    if (!game) return [];
    const raw = questions.filter((q) => q.id_game === game.id_game);
    if (!submission?.shuffled_question_ids || submission.shuffled_question_ids.length === 0) {
      return raw;
    }
    const qMap = new Map(raw.map((q) => [q.id_soal, q]));
    const ordered: Question[] = [];
    for (const qId of submission.shuffled_question_ids) {
      const found = qMap.get(qId);
      if (found) ordered.push(found);
    }
    for (const q of raw) {
      if (!submission.shuffled_question_ids.includes(q.id_soal)) {
        ordered.push(q);
      }
    }
    return ordered.length === raw.length ? ordered : raw;
  }, [questions, game, submission]);
  const matchingProblem = getCodingProblemForGame(game.id_game);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1e293b] bg-[#0d1424]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <span>{game.id_game} • {game.ref_pertemuan}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 font-semibold">Hasil &amp; Pembahasan Editorial</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {game.judul_game}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2744] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Summary Score Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080d1a] p-4 rounded-lg border border-[#1e293b] font-mono text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Nilai Murni</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {Math.round((submission.jumlah_benar / submission.total_soal) * 100)}/100
              </div>
              <div className="text-[10px] text-slate-400">
                {submission.jumlah_benar} dari {submission.total_soal} Benar
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Penalti Tab</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">
                -{submission.tab_switch_count * 5}
              </div>
              <div className="text-[10px] text-slate-400">
                {submission.tab_switch_count}x Pindah Tab
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Nilai Akhir Bersih</div>
              <div
                className={`text-xl font-black mt-0.5 ${
                  submission.nilai_akademik >= game.min_nilai_lulus
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {submission.nilai_akademik}/100
              </div>
              <div className="text-[10px] font-bold text-slate-300">
                {submission.status_lulus} (Min {game.min_nilai_lulus})
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Total XP Diperoleh</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                +{submission.skor_xp} XP
              </div>
              <div className="text-[10px] text-slate-400">Gamifikasi Sesi</div>
            </div>
          </div>

          {/* Seamless Next-Step: Tantangan Online Judge Terkait */}
          {matchingProblem && onStartCoding && (
            <div className="p-4 sm:p-5 rounded-lg bg-[#080d1a] border border-blue-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600/20 border border-blue-500/40 text-blue-400 uppercase tracking-wider">
                    Tantangan Coding Lanjutan
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Berdasarkan Topik {game.ref_pertemuan}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>[Soal {matchingProblem.order_letter}] {matchingProblem.title}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#131d33] border border-[#223354] text-amber-400">
                    {matchingProblem.difficulty}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xl">
                  Implementasikan solusi kode algoritma utuh di editor pemrograman (C++, Python 3, Java). Diuji otomatis oleh Online Judge terhadap batasan waktu &amp; memori riil.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCoding(matchingProblem, game);
                }}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm font-mono flex items-center justify-center gap-2 shrink-0 transition-all shadow-sm"
              >
                <Code2 className="w-4 h-4" />
                <span>Mulai Ngoding Soal Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Questions Editorial List */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Rincian Evaluasi Kuis &amp; Editorial Pembahasan</span>
            </h4>

            {gameQuestions.map((q, idx) => {
              const detail = submission.detail_jawaban_json.find((d) => d.id_soal === q.id_soal);
              const isCorrect = detail?.is_correct ?? false;
              const isTimeout = detail?.is_timeout ?? false;

              return (
                <div
                  key={q.id_soal}
                  className="bg-[#080d1a] border border-[#1e293b] rounded-lg p-4 space-y-3"
                >
                  {/* Soal Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-blue-400">
                        Soal #{idx + 1} ({q.id_soal}) • {q.poin_dasar} Poin Dasar
                      </div>
                      <h5 className="font-bold text-white text-sm mt-0.5">
                        <MathText content={q.judul} inline />
                      </h5>
                    </div>

                    <div>
                      {isCorrect ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>BENAR (+{detail?.skor_xp_didapat} XP)</span>
                        </span>
                      ) : isTimeout ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>TIMEOUT (0 XP)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>SALAH (0 XP)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Narasi Soal */}
                  <MathText
                    content={q.narasi_soal}
                    className="text-xs text-slate-300 leading-relaxed font-sans"
                  />

                  {/* Cuplikan Kode (Jika Ada) */}
                  {q.cuplikan_kode && (
                    <pre className="p-3 bg-[#050811] border border-[#1e293b] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                      {q.cuplikan_kode}
                    </pre>
                  )}

                  {/* Jawaban Mahasiswa vs Kunci Jawaban */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2.5 rounded-lg bg-[#0b1120] border border-[#1e293b]">
                      <span className="text-slate-400 text-[10px]">Jawaban Anda:</span>
                      <div className={`font-bold mt-0.5 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <MathText content={detail?.jawaban_mahasiswa || '(Tidak Terjawab)'} inline />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0b1120] border border-[#1e293b]">
                      <span className="text-slate-400 text-[10px]">Kunci Jawaban Resmi:</span>
                      <div className="font-bold text-slate-200 mt-0.5">
                        <MathText content={q.kunci_jawaban} inline />
                      </div>
                    </div>
                  </div>

                  {/* Editorial Pembahasan Resmi */}
                  <div className="bg-[#0b1120] border-l-4 border-blue-500 p-3 rounded-r-lg text-xs space-y-1">
                    <div className="font-bold text-blue-400 flex items-center gap-1.5 font-mono">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Editorial &amp; Pembahasan Dosen:</span>
                    </div>
                    <MathText
                      content={q.editorial}
                      className="text-slate-200 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-[#1e293b] bg-[#0d1424] flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            * Tantangan koding dapat dicoba kapan saja tanpa batas waktu.
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1e293b] text-slate-300 font-medium text-xs font-mono transition-colors"
            >
              Tutup
            </button>
            {matchingProblem && onStartCoding && (
              <button
                onClick={() => {
                  onClose();
                  onStartCoding(matchingProblem, game);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Lanjut ke Tantangan Koding</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
