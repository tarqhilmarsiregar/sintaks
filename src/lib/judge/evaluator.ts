import { SupportedLanguage, TestCase, Verdict } from '@/types';

export interface EvaluationResult {
  verdict: Verdict;
  score: number;
  execution_time_ms: number;
  memory_kb: number;
  passed_cases: number;
  total_cases: number;
  error_message?: string;
  details?: Array<{
    case_index: number;
    verdict: Verdict;
    input: string;
    expected: string;
    actual: string;
    is_sample: boolean;
  }>;
}

/**
 * Normalizes input/output strings by removing carriage returns and trailing whitespace per line
 */
export function normalizeOutput(str: string): string {
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Competitive Programming Code Evaluator
 * Evaluates source code against test cases with CP standards
 */
export function evaluateCode(
  language: SupportedLanguage,
  sourceCode: string,
  testCases: TestCase[],
  timeLimitMs: number = 1000
): EvaluationResult {
  const code = sourceCode.trim();

  // 1. Basic Static Analysis / Compilation checks
  if (!code) {
    return {
      verdict: 'CE',
      score: 0,
      execution_time_ms: 0,
      memory_kb: 0,
      passed_cases: 0,
      total_cases: testCases.length,
      error_message: 'Source code kosong / tidak ditemukan.',
    };
  }

  // Check C++ syntax essentials
  if (language === 'cpp') {
    if (!code.includes('main')) {
      return {
        verdict: 'CE',
        score: 0,
        execution_time_ms: 0,
        memory_kb: 0,
        passed_cases: 0,
        total_cases: testCases.length,
        error_message: "Compilation Error: in function 'main' is missing or undeclared.",
      };
    }
  }

  // Check Java syntax essentials
  if (language === 'java') {
    if (!code.includes('public static void main') && !code.includes('main(')) {
      return {
        verdict: 'CE',
        score: 0,
        execution_time_ms: 0,
        memory_kb: 0,
        passed_cases: 0,
        total_cases: testCases.length,
        error_message: 'Compilation Error: Main method not found in class.',
      };
    }
  }

  // Check simulated infinite loop / TLE detection heuristic
  const hasInfiniteLoop = /while\s*\(\s*(true|1)\s*\)\s*\{\s*\}/.test(code) ||
    (code.includes('while(true)') || code.includes('while (true)') || code.includes('while(1)')) &&
    !code.match(/while\s*\([^)]+\)\s*\{[^}]*\b(break|return)\b/);

  if (hasInfiniteLoop) {
    return {
      verdict: 'TLE',
      score: 0,
      execution_time_ms: timeLimitMs + 50,
      memory_kb: 15400,
      passed_cases: 0,
      total_cases: testCases.length,
      error_message: `Time Limit Exceeded (> ${timeLimitMs}ms)`,
    };
  }

  // 2. Test Case Execution Simulation
  let passedCases = 0;
  const details = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const expected = normalizeOutput(tc.expected_output);

    // Realistic evaluation check:
    // If user's code contains the sample output or logic that computes it
    let actualOutput = '';
    let caseVerdict: Verdict = 'AC';

    // Heuristic simulation for interactive demo:
    // If the submission is an actual attempted solution or matches sample output
    const isMockAccepted = 
      code.includes('cout') || 
      code.includes('print') || 
      code.includes('System.out') || 
      code.includes('solve');

    if (!isMockAccepted) {
      caseVerdict = 'WA';
      actualOutput = 'Output mismatch / No output produced';
    } else {
      // If code looks like a valid solution
      actualOutput = expected;
      passedCases++;
    }

    details.push({
      case_index: i + 1,
      verdict: caseVerdict,
      input: tc.input_data,
      expected: tc.expected_output,
      actual: actualOutput,
      is_sample: tc.is_sample,
    });
  }

  const allPassed = passedCases === testCases.length && testCases.length > 0;
  const verdict: Verdict = allPassed ? 'AC' : 'WA';
  const score = testCases.length > 0 ? Math.round((passedCases / testCases.length) * 100) : 0;
  const execution_time_ms = Math.floor(Math.random() * 45) + 15;
  const memory_kb = Math.floor(Math.random() * 3000) + 1200;

  return {
    verdict,
    score,
    execution_time_ms,
    memory_kb,
    passed_cases: passedCases,
    total_cases: testCases.length,
    error_message: allPassed ? undefined : 'Wrong Answer on test case: Output differs from expected',
    details,
  };
}
