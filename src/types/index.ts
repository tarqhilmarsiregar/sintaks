export type UserRole = 'student' | 'lecturer' | 'admin';

export interface UserProfile {
  id: string;
  nim: string;
  full_name: string;
  role: UserRole;
  class_group: string;
  rating: number;
  solved_count: number;
  avatar_url?: string;
  created_at: string;
}

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: string;
  problem_id: string;
  input_data: string;
  expected_output: string;
  explanation?: string;
  is_sample: boolean;
  points: number;
  order_index?: number;
}

export interface Problem {
  id: string;
  contest_id?: string | null;
  title: string;
  slug: string;
  order_letter?: string; // 'A', 'B', 'C', etc.
  statement_md: string;
  input_format: string;
  output_format: string;
  constraints: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  difficulty: ProblemDifficulty;
  tags: string[];
  is_published: boolean;
  sample_test_cases?: TestCase[];
  created_at: string;
}

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  freeze_minutes: number;
  penalty_minutes: number;
  is_published: boolean;
  problems?: Problem[];
  created_at: string;
}

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'CE' | 'RE' | 'PENDING' | 'RUNNING';

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'c' | 'javascript';

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  contest_id?: string | null;
  language: SupportedLanguage;
  source_code: string;
  verdict: Verdict;
  execution_time_ms: number;
  memory_kb: number;
  score: number;
  error_message?: string;
  created_at: string;
  // Join fields
  user_name?: string;
  user_nim?: string;
  problem_title?: string;
  problem_letter?: string;
}

export interface ScoreboardParticipant {
  user_id: string;
  nim: string;
  full_name: string;
  class_group: string;
  rank: number;
  solved_count: number;
  total_penalty: number; // in minutes
  problems: {
    [problemLetter: string]: {
      solved: boolean;
      attempts: number;
      solved_at_minute?: number; // minute from contest start
      is_first_to_solve?: boolean; // ICPC "First to Solve" balloon
    };
  };
}

