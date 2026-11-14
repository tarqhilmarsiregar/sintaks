export type UserRole = 'ADMIN' | 'PESERTA';
export type KlubHari = 'KAMIS' | 'JUMAT' | 'ALL';
export type GameStatus = 'UPCOMING' | 'OPEN' | 'FROZEN' | 'ENDED';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';
export type GameMode = 'SOLO' | 'TEAM';
export type SubmissionSessionStatus = 'ACTIVE' | 'DONE';
export type PassingStatus = 'LULUS' | 'BELUM LULUS';

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
  total_xp: number;
  level: number;
  tier_badge: string;
  milestones_json: string[];
  id_tim: string;
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
  durasi_total_menit: number;
  durasi_per_soal_detik: number;
  min_nilai_lulus: number;
  total_soal?: number;
  // Dynamic client-side fields:
  status_aktif?: GameStatus;
  user_submission?: Submission | null;
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
}

export interface Team {
  id_tim: string;
  nama_tim: string;
  klub_hari: KlubHari;
  kode_gabung?: string; // Kode unik 6-karakter untuk gabung tim (DOMjudge internal)
  leader_nim?: string;  // Mahasiswa pendiri / ketua tim
  daftar_nim_json: string[];
  daftar_nama_json: string[];
  total_skor_tim: number;
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

