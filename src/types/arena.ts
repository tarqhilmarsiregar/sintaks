export type UserRole = 'ADMIN' | 'PESERTA';
export type KlubHari = 'KAMIS' | 'JUMAT' | 'LOMBA' | 'ALL';
export type GameStatus = 'UPCOMING' | 'OPEN' | 'FROZEN' | 'ENDED';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export type GameMode = 'SOLO' | 'TEAM';
export type SubmissionSessionStatus = 'ACTIVE' | 'DONE';
export type PassingStatus = 'LULUS' | 'BELUM LULUS';

export type AdminActiveTab =
  | 'contests'
  | 'games'
  | 'problems'
  | 'questions'
  | 'submissions'
  | 'teams'
  | 'students'
  | 'export';

export interface Cohort {
  id_cohort: string;
  nama_kelas: string;
  kode_kelas: string;
  periode: string; // Format: "<Ganjil/Genap> <Tahun>", e.g. "Ganjil 2025"
  deskripsi?: string;
  allowed_game_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface CreateCohortDTO {
  nama_kelas: string;
  kode_kelas: string;
  periode: string; // Format: "<Ganjil/Genap> <Tahun>", e.g. "Ganjil 2025"
  deskripsi?: string;
  allowed_game_ids?: string[];
}

export interface User {
  nim: string;
  password?: string;
  nama_lengkap: string;
  codename: string;
  avatar: string;
  role: UserRole;
  prodi: string;
  angkatan: number;
  kelas_reguler: string;
  klub_hari: KlubHari;
  id_cohort?: string;
  periode?: string;
  total_xp: number;
  level: number;
  tier_badge: string;
  milestones_json: string[];
  id_tim: string;
  is_first_login?: boolean;
  password_changed_at?: string;
}

export interface CreateUserDTO {
  nim: string;
  nama_lengkap: string;
  role: UserRole;
  klub_hari?: KlubHari;
  id_cohort?: string;
  periode?: string;
  prodi?: string;
  angkatan?: number;
  kelas_reguler?: string;
  codename?: string;
  password?: string;
}

export interface Game {
  id_game: string;
  ref_pertemuan: string;
  judul_game: string;
  kategori_materi: string;
  kesulitan: GameDifficulty;
  mode_game: GameMode;
  pin_akses?: string;
  status_kamis: GameStatus;
  status_jumat: GameStatus;
  status_lomba?: GameStatus;
  cohort_statuses?: Record<string, GameStatus>; // Dynamic per-cohort status mapping: id_cohort/kode_kelas -> GameStatus
  durasi_total_menit: number;
  durasi_per_soal_detik: number;
  min_nilai_lulus: number;
  total_soal?: number;
  // Dynamic client-side fields:
  status_aktif?: GameStatus;
  user_submission?: Submission | null;
}

export interface CreateGameDTO {
  id_game?: string; // e.g. "G8" (auto-generated if omitted)
  ref_pertemuan: string; // e.g. "Pertemuan 8"
  judul_game: string;
  kategori_materi: string;
  kesulitan: GameDifficulty; // 'Easy' | 'Medium' | 'Hard'
  mode_game: GameMode; // 'SOLO' | 'TEAM'
  pin_akses?: string;
  durasi_total_menit: number;
  durasi_per_soal_detik: number;
  min_nilai_lulus: number;
  allowed_cohort_ids?: string[]; // IDs of cohorts allowed to access this game
  initial_status?: GameStatus; // default 'UPCOMING'
}

export interface UpdateGameDTO {
  ref_pertemuan?: string;
  judul_game?: string;
  kategori_materi?: string;
  kesulitan?: GameDifficulty;
  mode_game?: GameMode;
  pin_akses?: string;
  durasi_total_menit?: number;
  durasi_per_soal_detik?: number;
  min_nilai_lulus?: number;
  allowed_cohort_ids?: string[];
}

export interface Question {
  id_soal: string;
  id_game: string;
  judul: string;
  narasi_soal: string;
  cuplikan_kode?: string;
  opsi_jawaban?: string; // separated by '|'
  kunci_jawaban?: string; // secret, only sent upon completion/verification
  teks_hint?: string;
  editorial?: string;
  poin_dasar: number;
  first_blood_by?: string;
}

export interface CreateQuestionDTO {
  id_soal?: string;
  id_game: string;
  judul: string;
  narasi_soal: string;
  cuplikan_kode?: string;
  opsi_jawaban: string[] | string;
  kunci_jawaban: string;
  teks_hint?: string;
  editorial?: string;
  poin_dasar?: number;
}

export interface UpdateQuestionDTO {
  id_game?: string;
  judul?: string;
  narasi_soal?: string;
  cuplikan_kode?: string;
  opsi_jawaban?: string[] | string;
  kunci_jawaban?: string;
  teks_hint?: string;
  editorial?: string;
  poin_dasar?: number;
}

export interface CreateCodingProblemDTO {
  id?: string;
  game_id?: string;
  title: string;
  slug?: string;
  statement_md: string;
  input_format: string;
  output_format: string;
  constraints: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  sample_test_cases?: {
    id: string;
    problem_id: string;
    input_data: string;
    expected_output: string;
    explanation?: string;
    is_sample: boolean;
    points: number;
    order_index?: number;
  }[];
}

export interface UpdateCodingProblemDTO {
  game_id?: string;
  title?: string;
  slug?: string;
  statement_md?: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  time_limit_ms?: number;
  memory_limit_mb?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  sample_test_cases?: {
    id: string;
    problem_id: string;
    input_data: string;
    expected_output: string;
    explanation?: string;
    is_sample: boolean;
    points: number;
    order_index?: number;
  }[];
}

export interface QuestionDetailAnswer {
  id_soal: string;
  jawaban_mahasiswa: string;
  is_correct: boolean;
  is_timeout: boolean;
  opened_hint: boolean;
  sisa_detik: number;
  skor_xp_didapat: number;
}

export interface Submission {
  id_submission: string;
  timestamp_mulai: string;
  timestamp_update: string;
  nim: string;
  codename: string;
  klub_hari: KlubHari;
  id_game: string;
  mode_game: GameMode;
  id_tim: string;
  skor_xp: number;
  nilai_akademik: number; // 0-100
  jumlah_benar: number;
  total_soal: number;
  status_lulus: PassingStatus;
  streak_saat_ini: number;
  tab_switch_count: number;
  status_sesi: SubmissionSessionStatus;
  detail_jawaban_json: QuestionDetailAnswer[];
  shuffled_question_ids?: string[]; // Urutan soal deterministik unik per peserta (Anti-Cheat Shuffling)
  tab_switch_log?: { timestamp: string; penalty_deducted: number }[];
}

export interface Team {
  id_tim: string;
  nama_tim: string;
  klub_hari: KlubHari;
  id_cohort?: string;   // ID Kohort Dinamis (Relasi ke tabel cohorts)
  kode_gabung?: string; // Kode unik 6-karakter untuk gabung tim (DOMjudge internal)
  leader_nim?: string;  // Mahasiswa pendiri / ketua tim
  daftar_nim_json: string[];
  daftar_nama_json: string[];
  total_skor_tim: number;
}

export interface TeamFairnessMetrics {
  totalTeams: number;
  totalStudents: number;
  averageXP: number;
  minXP: number;
  maxXP: number;
  deltaXP: number;
  standardDeviation: number;
  deviationPercent: number;
  balanceRating: 'OPTIMAL' | 'GOOD' | 'MODERATE' | 'IMBALANCED';
}

export interface TeamMemberInfo {
  nim: string;
  nama_lengkap: string;
  codename: string;
  avatar: string;
  role: UserRole;
  prodi: string;
  angkatan: number;
  kelas_reguler: string;
  klub_hari: KlubHari;
  total_xp: number;
  level: number;
  tier_badge: string;
  is_leader: boolean;
}

export interface FirstBloodAnnouncement {
  id_soal: string;
  judul_soal: string;
  first_blood_by: string;
}

export interface LeaderboardPlayer {
  nim: string;
  codename: string;
  avatar: string;
  klub_hari: KlubHari;
  total_xp: number;
  level: number;
  rata_nilai: number;
  tier_badge: string;
}

export interface LeaderboardTeam {
  id_tim: string;
  nama_tim: string;
  klub_hari: KlubHari;
  total_skor_tim: number;
  members_count: number;
}

export interface ICPCProblemStatus {
  problemLetter: string;
  gameId: string;
  balloonColor: string;
  balloonEmoji: string;
  isSolved: boolean;
  isFirstSolve: boolean;
  attempts: number;
  solveTimeMinutes: number;
  isPendingFreeze?: boolean;
}

export interface ICPCScoreboardRow {
  rank: number;
  nim: string;
  id_tim?: string;
  nama_tim?: string;
  displayName: string;
  realName: string;
  avatar: string;
  klub_hari: KlubHari;
  solvedCount: number;
  totalPenaltyTime: number;
  totalXP: number;
  problems: { [letter: string]: ICPCProblemStatus };
  isMyRow?: boolean;
}

export interface ICPCProblemMeta {
  letter: string;
  gameId: string;
  title: string;
  balloonColor: string;
  balloonEmoji: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const ICPC_PROBLEMS_DEF: ICPCProblemMeta[] = [
  {
    letter: 'A',
    gameId: 'G1',
    title: 'Pemanasan Logika & Big-O',
    balloonColor: '#EF4444',
    balloonEmoji: '🔴',
    bgClass: 'bg-red-500',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/40'
  },
  {
    letter: 'B',
    gameId: 'G2',
    title: 'Fast I/O & Presisi Python',
    balloonColor: '#10B981',
    balloonEmoji: '🟢',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40'
  },
  {
    letter: 'C',
    gameId: 'G3',
    title: 'Online Judge Anatomy',
    balloonColor: '#0EA5E9',
    balloonEmoji: '🔵',
    bgClass: 'bg-sky-500',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/40'
  },
  {
    letter: 'D',
    gameId: 'G4',
    title: 'Analisis 10^8 & Ad-Hoc',
    balloonColor: '#F59E0B',
    balloonEmoji: '🟡',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40'
  },
  {
    letter: 'E',
    gameId: 'G5',
    title: 'Pola Kompleksitas Algoritma',
    balloonColor: '#8B5CF6',
    balloonEmoji: '🟣',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40'
  },
  {
    letter: 'F',
    gameId: 'G6',
    title: 'Observasi Invarian & Game Theory (Team)',
    balloonColor: '#F97316',
    balloonEmoji: '🟠',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/40'
  },
  {
    letter: 'G',
    gameId: 'G7',
    title: 'Combinatorial Game Theory',
    balloonColor: '#EC4899',
    balloonEmoji: '🌸',
    bgClass: 'bg-pink-500',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-500/40'
  }
];

