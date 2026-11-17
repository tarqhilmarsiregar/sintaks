import { NextRequest, NextResponse } from 'next/server';
import { ArenaStore } from '@/lib/arena-store';
import { calculateAcademicGrade, calculateQuestionXP } from '@/lib/gamification';

/**
 * Server-Side Submission Validation & Anti-Cheat Endpoint
 * POST /api/submissions/quiz
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'ID Submisi sesi kuis wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. ACTION: RECORD TAB-SWITCH VIOLATION
    if (action === 'tab-switch') {
      const updated = ArenaStore.recordTabSwitch(submissionId);
      if (!updated) {
        return NextResponse.json(
          { error: 'Sesi kuis tidak ditemukan atau sudah tidak aktif.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Pelanggaran pindah tab tercatat.',
        tab_switch_count: updated.tab_switch_count,
        penalty_deducted: 5,
        total_penalty: updated.tab_switch_count * 5,
        current_xp: updated.skor_xp,
        submission: updated,
      });
    }

    // 2. ACTION: SUBMIT SINGLE-QUESTION ANSWER
    if (action === 'answer') {
      const { idSoal, jawaban, isTimeout, openedHint, sisaDetik } = body;

      if (!idSoal) {
        return NextResponse.json(
          { error: 'ID Soal wajib disertakan.' },
          { status: 400 }
        );
      }

      // Validasi sesi
      const sub = ArenaStore.getSubmissions().find(s => s.id_submission === submissionId);
      if (!sub) {
        return NextResponse.json(
          { error: 'Sesi submisi tidak ditemukan.' },
          { status: 404 }
        );
      }

      if (sub.status_sesi === 'DONE') {
        return NextResponse.json(
          { error: 'Sesi kuis sudah selesai dan dikunci. Jawaban baru ditolak.' },
          { status: 403 }
        );
      }

      // Replay prevention: cegah jawaban ganda untuk soal yang sama
      const alreadyAnswered = sub.detail_jawaban_json.some(d => d.id_soal === idSoal);
      if (alreadyAnswered) {
        return NextResponse.json(
          { error: 'Butir soal ini sudah pernah dijawab sebelumnya (Single-Shot Lock).' },
          { status: 409 }
        );
      }

      // Evaluasi jawaban di server
      const evalRes = ArenaStore.answerQuestion({
        submissionId,
        idSoal,
        jawaban: jawaban || '',
        isTimeout: Boolean(isTimeout),
        openedHint: Boolean(openedHint),
        sisaDetik: Number(sisaDetik) || 0,
      });

      return NextResponse.json({
        success: true,
        isCorrect: evalRes.isCorrect,
        xpEarned: evalRes.xpEarned,
        totalScoreXP: evalRes.submission.skor_xp,
        answeredCount: evalRes.submission.detail_jawaban_json.length,
        totalQuestions: evalRes.submission.total_soal,
        submission: evalRes.submission,
      });
    }

    // 3. ACTION: FINISH QUIZ SESSION
    if (action === 'finish') {
      const finalSub = ArenaStore.finishQuizSession(submissionId);

      return NextResponse.json({
        success: true,
        message: 'Sesi kuis berhasil diselesaikan dan dinilai.',
        submission: finalSub,
      });
    }

    return NextResponse.json(
      { error: `Aksi "${action}" tidak didukung. Pilihan: answer | tab-switch | finish` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error pada validasi submisi kuis server-side:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan internal pada server juri kuis.' },
      { status: 500 }
    );
  }
}
