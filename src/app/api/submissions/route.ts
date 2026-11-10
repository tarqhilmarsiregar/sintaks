import { NextRequest, NextResponse } from 'next/server';
import { evaluateCode } from '@/lib/judge/evaluator';
import { MOCK_PROBLEMS } from '@/lib/mock-data';
import { SupportedLanguage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemId, problemSlug, language, sourceCode, userId, contestId } = body;

    if (!sourceCode || !language) {
      return NextResponse.json(
        { error: 'Source code dan bahasa pemrograman wajib disertakan.' },
        { status: 400 }
      );
    }

    const problem = MOCK_PROBLEMS.find((p) => p.slug === problemSlug || p.id === problemId);
    if (!problem) {
      return NextResponse.json(
        { error: 'Soal tidak ditemukan di sistem juri.' },
        { status: 404 }
      );
    }

    // Evaluate code against sample + problem test cases
    const testCases = problem.sample_test_cases || [];
    const evaluation = evaluateCode(
      language as SupportedLanguage,
      sourceCode,
      testCases,
      problem.time_limit_ms
    );

    const submissionRecord = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      user_id: userId || 'usr-001',
      problem_id: problem.id,
      problem_slug: problem.slug,
      problem_title: problem.title,
      contest_id: contestId || null,
      language,
      source_code: sourceCode,
      verdict: evaluation.verdict,
      execution_time_ms: evaluation.execution_time_ms,
      memory_kb: evaluation.memory_kb,
      score: evaluation.score,
      error_message: evaluation.error_message,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      submission: submissionRecord,
      evaluation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal mengevaluasi submisi pada sandbox.' },
      { status: 500 }
    );
  }
}

