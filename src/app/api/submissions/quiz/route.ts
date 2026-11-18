import { NextRequest, NextResponse } from 'next/server';
import { ArenaStore } from '@/lib/arena-store';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { SupabaseArenaRepo } from '@/lib/supabase/repository';
import {
  calculateAcademicGrade,
  calculateLevelInfo,
  calculateQuestionXP,
} from '@/lib/gamification';
import { Submission } from '@/types/arena';
import { SESSION_COOKIE_NAME, SessionPayload, verifySessionToken } from '@/lib/security/session';

function isSubmissionOwnedBySession(sub: Submission, session: SessionPayload | null): boolean {
  if (!session) return false;
  return session.role === 'ADMIN' || sub.nim.toUpperCase() === session.nim.toUpperCase();
}

/**
 * Server-Side Submission Validation & Anti-Cheat Endpoint
 * Persists directly to Supabase PostgreSQL when configured, with resilient local fallback.
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

    const useSupabase = isSupabaseConfigured();
    let activeSession: SessionPayload | null = null;
    if (useSupabase) {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      activeSession = await verifySessionToken(token);
      if (!activeSession) {
        return NextResponse.json(
          { error: 'Akses ditolak (401): Sesi login tidak valid.' },
          { status: 401 }
        );
      }
    }

    // 1. ACTION: RECORD TAB-SWITCH VIOLATION
    if (action === 'tab-switch') {
      if (useSupabase) {
        const sub = await SupabaseArenaRepo.getSubmissionById(submissionId);
        if (sub && !isSubmissionOwnedBySession(sub, activeSession)) {
          return NextResponse.json(
            { error: 'Akses ditolak (403): Submisi ini bukan milik sesi Anda.' },
            { status: 403 }
          );
        }
        if (sub && sub.status_sesi === 'ACTIVE') {
          const updated: Submission = {
            ...sub,
            tab_switch_count: (sub.tab_switch_count || 0) + 1,
            skor_xp: Math.max(0, (sub.skor_xp || 0) - 5),
            tab_switch_log: [
              ...(sub.tab_switch_log || []),
              { timestamp: new Date().toISOString(), penalty_deducted: 5 },
            ],
            timestamp_update: new Date().toISOString(),
          };
          const saved = await SupabaseArenaRepo.upsertSubmission(updated);
          if (saved) {
            return NextResponse.json({
              success: true,
              mode: 'supabase',
              message: 'Pelanggaran pindah tab tercatat di database.',
              tab_switch_count: saved.tab_switch_count,
              penalty_deducted: 5,
              total_penalty: saved.tab_switch_count * 5,
              current_xp: saved.skor_xp,
              submission: saved,
            });
          }
        }
      }

      const updated = ArenaStore.recordTabSwitch(submissionId);
      if (!updated) {
        return NextResponse.json(
          { error: 'Sesi kuis tidak ditemukan atau sudah tidak aktif.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        mode: 'local',
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

      if (useSupabase) {
        const sub = await SupabaseArenaRepo.getSubmissionById(submissionId);
        if (sub) {
          if (!isSubmissionOwnedBySession(sub, activeSession)) {
            return NextResponse.json(
              { error: 'Akses ditolak (403): Submisi ini bukan milik sesi Anda.' },
              { status: 403 }
            );
          }
          if (sub.status_sesi === 'DONE') {
            return NextResponse.json(
              { error: 'Sesi kuis sudah selesai dan dikunci. Jawaban baru ditolak.' },
              { status: 403 }
            );
          }

          const alreadyAnswered = sub.detail_jawaban_json.some((d) => d.id_soal === idSoal);
          if (alreadyAnswered) {
            return NextResponse.json(
              { error: 'Butir soal ini sudah pernah dijawab sebelumnya (Single-Shot Lock).' },
              { status: 409 }
            );
          }

          const q = await SupabaseArenaRepo.getQuestionById(idSoal);
          if (!q) {
            return NextResponse.json({ error: 'Soal tidak ditemukan di database.' }, { status: 404 });
          }

          const isCorrect =
            !Boolean(isTimeout) &&
            String(jawaban || '').trim().toLowerCase() ===
              String(q.kunci_jawaban || '').trim().toLowerCase();

          let xpEarned = 0;
          let jumlahBenar = sub.jumlah_benar;
          let streakSaatIni = sub.streak_saat_ini;

          if (isCorrect) {
            jumlahBenar += 1;
            streakSaatIni += 1;
            const isFirstBlood = !q.first_blood_by;
            if (isFirstBlood) {
              await SupabaseArenaRepo.setQuestionFirstBlood(q.id_soal, sub.codename);
            }
            const xpCalc = calculateQuestionXP({
              basePoints: q.poin_dasar,
              openedHint: Boolean(openedHint),
              remainingSeconds: Number(sisaDetik) || 0,
              currentStreak: streakSaatIni,
              isFirstBlood,
            });
            xpEarned = xpCalc.totalXP;
          } else {
            streakSaatIni = 0;
          }

          const updatedSub: Submission = {
            ...sub,
            jumlah_benar: jumlahBenar,
            streak_saat_ini: streakSaatIni,
            skor_xp: (sub.skor_xp || 0) + xpEarned,
            detail_jawaban_json: [
              ...sub.detail_jawaban_json,
              {
                id_soal: idSoal,
                jawaban_mahasiswa: String(jawaban || ''),
                is_correct: isCorrect,
                is_timeout: Boolean(isTimeout),
                opened_hint: Boolean(openedHint),
                sisa_detik: Number(sisaDetik) || 0,
                skor_xp_didapat: xpEarned,
              },
            ],
            timestamp_update: new Date().toISOString(),
          };

          const saved = await SupabaseArenaRepo.upsertSubmission(updatedSub);
          if (saved) {
            return NextResponse.json({
              success: true,
              mode: 'supabase',
              isCorrect,
              xpEarned,
              totalScoreXP: saved.skor_xp,
              answeredCount: saved.detail_jawaban_json.length,
              totalQuestions: saved.total_soal,
              submission: saved,
            });
          }
        }
      }

      // Fallback local ArenaStore
      const sub = ArenaStore.getSubmissions().find((s) => s.id_submission === submissionId);
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

      const alreadyAnswered = sub.detail_jawaban_json.some((d) => d.id_soal === idSoal);
      if (alreadyAnswered) {
        return NextResponse.json(
          { error: 'Butir soal ini sudah pernah dijawab sebelumnya (Single-Shot Lock).' },
          { status: 409 }
        );
      }

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
        mode: 'local',
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
      if (useSupabase) {
        const sub = await SupabaseArenaRepo.getSubmissionById(submissionId);
        if (sub) {
          if (!isSubmissionOwnedBySession(sub, activeSession)) {
            return NextResponse.json(
              { error: 'Akses ditolak (403): Submisi ini bukan milik sesi Anda.' },
              { status: 403 }
            );
          }
          if (sub.status_sesi === 'DONE') {
            return NextResponse.json({
              success: true,
              mode: 'supabase',
              message: 'Sesi kuis sudah selesai sebelumnya.',
              submission: sub,
            });
          }

          const game = await SupabaseArenaRepo.getGameById(sub.id_game);
          const minPass = game?.min_nilai_lulus ?? 70;
          const grade = calculateAcademicGrade(
            sub.jumlah_benar,
            sub.total_soal,
            sub.tab_switch_count
          );

          const finalized: Submission = {
            ...sub,
            nilai_akademik: grade.nilaiAkhirBersih,
            status_lulus: grade.nilaiAkhirBersih >= minPass ? 'LULUS' : 'BELUM LULUS',
            status_sesi: 'DONE',
            timestamp_update: new Date().toISOString(),
          };

          const saved = await SupabaseArenaRepo.upsertSubmission(finalized);
          if (saved) {
            // Akumulasi XP & Level ke profil user di Supabase
            const user = await SupabaseArenaRepo.getUserByNim(saved.nim);
            if (user) {
              const newXP = (user.total_xp || 0) + (saved.skor_xp || 0);
              const lvlInfo = calculateLevelInfo(newXP);
              const milestones = new Set(user.milestones_json || []);
              if (saved.nilai_akademik === 100) milestones.add('PERFECT_100');
              if (saved.streak_saat_ini >= 3) milestones.add('STREAK_3X');

              await SupabaseArenaRepo.updateUserXPAndMilestones(user.nim, {
                total_xp: newXP,
                level: lvlInfo.level,
                tier_badge: lvlInfo.tierBadge,
                milestones_json: Array.from(milestones),
              });
            }

            return NextResponse.json({
              success: true,
              mode: 'supabase',
              message: 'Sesi kuis berhasil diselesaikan dan dinilai di database.',
              submission: saved,
            });
          }
        }
      }

      const finalSub = ArenaStore.finishQuizSession(submissionId);

      return NextResponse.json({
        success: true,
        mode: 'local',
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
