'use client';

import React from 'react';
import { Game, Submission, Question } from '@/types/arena';
import { X, CheckCircle2, XCircle, AlertTriangle, BookOpen, Clock, ShieldAlert } from 'lucide-react';

interface EditorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  submission: Submission | null;
  questions: Question[];
}

export default function EditorialModal({
  isOpen,
  onClose,
  game,
  submission,
  questions
}: EditorialModalProps) {
  if (!isOpen || !game || !submission) return null;

  const gameQuestions = questions.filter(q => q.id_game === game.id_game);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f293d] bg-[#0f172a]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>{game.id_game} • {game.ref_pertemuan}</span>
              <span>•</span>
              <span className="text-amber-400">Hasil & Pembahasan Editorial</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {game.judul_game}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Summary Score Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111827] p-4 rounded-xl border border-[#1f293d] font-mono text-center">
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

          {/* Questions Editorial List */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Rincian Evaluasi Soal & Editorial Pembahasan</span>
            </h4>

            {gameQuestions.map((q, idx) => {
              const detail = submission.detail_jawaban_json.find(d => d.id_soal === q.id_soal);
              const isCorrect = detail?.is_correct ?? false;
              const isTimeout = detail?.is_timeout ?? false;

              return (
                <div
                  key={q.id_soal}
                  className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 space-y-3"
                >
                  {/* Soal Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-cyan-400">
                        Soal #{idx + 1} ({q.id_soal}) • {q.poin_dasar} Poin Dasar
                      </div>
                      <h5 className="font-bold text-white text-sm mt-0.5">{q.judul}</h5>
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
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {q.narasi_soal}
                  </p>

                  {/* Cuplikan Kode (Jika Ada) */}
                  {q.cuplikan_kode && (
                    <pre className="p-3 bg-[#080d17] border border-[#1f293d] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                      {q.cuplikan_kode}
                    </pre>
                  )}

                  {/* Jawaban Mahasiswa vs Kunci Jawaban */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2.5 rounded-lg bg-[#111827] border border-[#1f293d]">
                      <span className="text-slate-400 text-[10px]">Jawaban Anda:</span>
                      <div className={`font-bold mt-0.5 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {detail?.jawaban_mahasiswa || '(Tidak Terjawab)'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#111827] border border-[#1f293d]">
                      <span className="text-slate-400 text-[10px]">Kunci Jawaban Resmi:</span>
                      <div className="font-bold text-cyan-300 mt-0.5">{q.kunci_jawaban}</div>
                    </div>
                  </div>

                  {/* Editorial Pembahasan Resmi */}
                  <div className="bg-[#131f33] border-l-4 border-cyan-500 p-3 rounded-r-lg text-xs space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1 font-mono">
                      <span>💡 Editorial & Pembahasan Dosen:</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{q.editorial}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-[#1f293d] bg-[#0f172a] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs font-mono transition-colors"
          >
            Tutup Pembahasan
          </button>
        </div>
      </div>
    </div>
  );
}

