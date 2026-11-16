'use client';

import {
  User,
  UserRole,
  CreateUserDTO,
  Cohort,
  CreateCohortDTO,
  Game,
  CreateGameDTO,
  UpdateGameDTO,
  Question,
  CreateQuestionDTO,
  UpdateQuestionDTO,
  CreateCodingProblemDTO,
  UpdateCodingProblemDTO,
  Submission,
  Team,
  TeamMemberInfo,
  FirstBloodAnnouncement,
  LeaderboardPlayer,
  KlubHari,
  GameStatus,
  PassingStatus,
  ICPCScoreboardRow,
  ICPCProblemStatus,
  ICPC_PROBLEMS_DEF
} from '@/types/arena';
import { Problem, TestCase } from '@/types';
import { MOCK_PROBLEMS } from './mock-data';
import {
  INITIAL_USERS,
  INITIAL_COHORTS,
  INITIAL_GAMES,
  INITIAL_QUESTIONS,
  INITIAL_SUBMISSIONS,
  FIRST_BLOOD_TICKER_DATA,
  INITIAL_TEAMS
} from './seed-data';
import { calculateAcademicGrade, calculateQuestionXP, calculateLevelInfo, generateSnakeDraftTeams } from './gamification';
import { seededShuffle } from './shuffle';

const STORAGE_KEYS = {
  CURRENT_USER: 'cparena_current_user',
  USERS: 'cparena_users_v2',
  COHORTS: 'cparena_cohorts_v2',
  GAMES: 'cparena_games_v2',
  QUESTIONS: 'cparena_questions_v2',
  SUBMISSIONS: 'cparena_submissions_v2',
  TEAMS: 'cparena_teams_v2',
  FIRST_BLOODS: 'cparena_first_bloods_v2',
  CODING_PROBLEMS: 'cparena_coding_problems_v2',
  GAME_PROBLEM_MAPPING: 'cparena_game_problem_mapping_v2'
};

export class ArenaStore {
  private static memoryStore: Record<string, string> = {};

  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private static getItem(key: string): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(key);
    }
    return this.memoryStore[key] || null;
  }

  private static setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    } else {
      this.memoryStore[key] = value;
    }
  }

  private static removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    } else {
      delete this.memoryStore[key];
    }
  }

  // --- INITIALIZERS & GETTERS ---
  public static getUsers(): User[] {
    const raw = this.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  }

  public static saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- COHORT & CLASSROOM CRUD ---
  public static normalizePeriode(val: string): string | null {
    const trimmed = (val || '').trim();
    const match = trimmed.match(/^(ganjil|genap)\s*(\d{4})$/i);
    if (!match) return null;
    const sem = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const year = match[2];
    return `${sem} ${year}`;
  }

  public static getCohorts(): Cohort[] {
    const raw = this.getItem(STORAGE_KEYS.COHORTS);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      // Pembersihan otomatis untuk legacy dummy cohorts (c-kamis, c-jumat, c-lomba)
      // Menjamin kelas yang muncul murni dinamis (hanya yang dibuat manual oleh Admin)
      const cleaned = parsed.filter(c => !['c-kamis', 'c-jumat', 'c-lomba'].includes(c.id_cohort));
      if (cleaned.length !== parsed.length) {
        this.saveCohorts(cleaned);
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  public static saveCohorts(cohorts: Cohort[]): void {
    this.setItem(STORAGE_KEYS.COHORTS, JSON.stringify(cohorts));
  }

  public static getCohortById(id: string): Cohort | undefined {
    return this.getCohorts().find(c => c.id_cohort === id || c.kode_kelas === id);
  }

  public static createCohort(dto: CreateCohortDTO): { success: boolean; message: string; cohort?: Cohort } {
    const cohorts = this.getCohorts();
    const namaKelas = (dto.nama_kelas || '').trim();
    const kodeKelas = (dto.kode_kelas || '').trim().toUpperCase();
    const normalizedPeriode = this.normalizePeriode(dto.periode || '');

    if (!namaKelas) {
      return { success: false, message: 'Nama kelas wajib diisi!' };
    }
    if (!kodeKelas) {
      return { success: false, message: 'Kode kelas wajib diisi!' };
    }
    if (!normalizedPeriode) {
      return { success: false, message: 'Format Periode harus: <Ganjil/Genap> <Tahun> (contoh: Ganjil 2025)!' };
    }

    const exists = cohorts.some(c => c.kode_kelas === kodeKelas);
    if (exists) {
      return { success: false, message: `Kelas dengan kode "${kodeKelas}" sudah terdaftar!` };
    }

    const idCohort = `c-${kodeKelas.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newCohort: Cohort = {
      id_cohort: idCohort,
      nama_kelas: namaKelas,
      kode_kelas: kodeKelas,
      periode: normalizedPeriode,
      deskripsi: dto.deskripsi?.trim() || undefined,
      allowed_game_ids: dto.allowed_game_ids && dto.allowed_game_ids.length > 0
        ? dto.allowed_game_ids
        : ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'],
      is_active: true,
      created_at: new Date().toISOString()
    };

    cohorts.push(newCohort);
    this.saveCohorts(cohorts);

    return { success: true, message: `Kelas "${namaKelas}" (${normalizedPeriode}) berhasil dibuat!`, cohort: newCohort };
  }

  public static updateCohort(id: string, updates: Partial<Cohort>): { success: boolean; message: string; cohort?: Cohort } {
    const cohorts = this.getCohorts();
    const idx = cohorts.findIndex(c => c.id_cohort === id || c.kode_kelas === id);
    if (idx === -1) {
      return { success: false, message: 'Kelas tidak ditemukan!' };
    }

    if (updates.periode) {
      const normalized = this.normalizePeriode(updates.periode);
      if (!normalized) {
        return { success: false, message: 'Format Periode harus: <Ganjil/Genap> <Tahun> (contoh: Ganjil 2025)!' };
      }
      updates.periode = normalized;
    }

    cohorts[idx] = { ...cohorts[idx], ...updates };
    this.saveCohorts(cohorts);
    return { success: true, message: 'Data kelas berhasil diperbarui!', cohort: cohorts[idx] };
  }

  public static deleteCohort(id: string): { success: boolean; message: string } {
    const cohorts = this.getCohorts();
    const target = cohorts.find(c => c.id_cohort === id || c.kode_kelas === id);
    if (!target) {
      return { success: false, message: 'Kelas tidak ditemukan!' };
    }

    const users = this.getUsers();
    const hasUsers = users.some(u => u.id_cohort === target.id_cohort);
    if (hasUsers) {
      return { success: false, message: `Tidak dapat menghapus kelas karena masih ada mahasiswa yang terdaftar di kelas ini!` };
    }

    const filtered = cohorts.filter(c => c.id_cohort !== target.id_cohort);
    this.saveCohorts(filtered);
    return { success: true, message: `Kelas "${target.nama_kelas}" berhasil dihapus!` };
  }

  public static isGameAllowedForUser(user: User | null | undefined, gameId: string): boolean {
    if (!user) return true;
    if (user.role === 'ADMIN') return true;
    if (!user.id_cohort) {
      return true;
    }
    const cohort = this.getCohortById(user.id_cohort);
    if (!cohort) return true;
    return cohort.allowed_game_ids.includes(gameId);
  }

  public static getGames(): Game[] {
    const raw = this.getItem(STORAGE_KEYS.GAMES);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      // Pembersihan otomatis untuk legacy dummy games (G1 - G7 bawaan prototipe)
      // Menjamin daftar kontes 100% murni dinamis (hanya yang dibuat manual oleh Admin)
      const legacyTitles = [
        'Onboarding Arena: Pemanasan Logika & Big-O',
        '[KAMIS] - ANATOMI ONLINE JUDGE, ATURAN I/O, & JEBAKAN PRESISI PYTHON',
        '[JUMAT] - ANATOMI ONLINE JUDGE, ATURAN I/O, & JEBAKAN PRESISI PYTHON',
        '[KAMIS] - ANALISIS KOMPLEKSITAS BIG-O, ATURAN 10^8, & POLA AD-HOC',
        '[JUMAT] - ANALISIS KOMPLEKSITAS BIG-O, ATURAN 10^8, & POLA AD-HOC',
        '[KAMIS] - OBSERVASI INVARIAN & COMBINATORIAL GAME THEORY',
        '[JUMAT] - OBSERVASI INVARIAN & COMBINATORIAL GAME THEORY'
      ];
      const cleaned = parsed.filter(g => !legacyTitles.includes(g.judul_game));
      if (cleaned.length !== parsed.length) {
        this.saveGames(cleaned);
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  public static saveGames(games: Game[]): void {
    this.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  }

  public static getQuestions(): Question[] {
    const raw = this.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_QUESTIONS;
    }
  }

  public static saveQuestions(questions: Question[]): void {
    this.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }

  // --- QUESTION CRUD (KUIS PILIHAN GANDA) ---
  public static getQuestionsForGame(gameId: string): Question[] {
    return this.getQuestions().filter(q => q.id_game === gameId);
  }

  public static createQuestion(dto: CreateQuestionDTO): { success: boolean; message: string; question?: Question } {
    const questions = this.getQuestions();
    const idGame = (dto.id_game || '').trim().toUpperCase();
    const judul = (dto.judul || '').trim();
    const narasi = (dto.narasi_soal || '').trim();

    if (!idGame) return { success: false, message: 'ID Game/Paket Kontes wajib ditentukan!' };
    if (!judul) return { success: false, message: 'Judul soal kuis wajib diisi!' };
    if (!narasi) return { success: false, message: 'Narasi soal kuis wajib diisi!' };

    // Format opsi jawaban
    let opsiStr = '';
    if (Array.isArray(dto.opsi_jawaban)) {
      opsiStr = dto.opsi_jawaban.map(o => (o || '').trim()).filter(Boolean).join('|');
    } else {
      opsiStr = (dto.opsi_jawaban || '').trim();
    }

    if (!opsiStr) return { success: false, message: 'Pilihan jawaban wajib diisi (minimal 2 opsi)!' };

    const kunci = (dto.kunci_jawaban || '').trim();
    if (!kunci) return { success: false, message: 'Kunci jawaban benar wajib ditentukan!' };

    // Validasi apakah kunci ada dalam opsi
    const opsiArr = opsiStr.split('|');
    if (!opsiArr.includes(kunci)) {
      return { success: false, message: `Kunci jawaban "${kunci}" harus cocok dengan salah satu pilihan jawaban yang tersedia!` };
    }

    // Auto-generate ID Soal jika belum ada
    let idSoal = (dto.id_soal || '').trim().toUpperCase();
    if (!idSoal) {
      let maxNum = 0;
      questions.forEach(q => {
        const m = q.id_soal.match(/^Q(\d+)$/i) || q.id_soal.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      idSoal = `Q${maxNum + 1}`;
    }

    if (questions.some(q => q.id_soal === idSoal)) {
      return { success: false, message: `Butir Soal dengan ID "${idSoal}" sudah ada!` };
    }

    const newQuestion: Question = {
      id_soal: idSoal,
      id_game: idGame,
      judul,
      narasi_soal: narasi,
      cuplikan_kode: dto.cuplikan_kode?.trim() || undefined,
      opsi_jawaban: opsiStr,
      kunci_jawaban: kunci,
      teks_hint: dto.teks_hint?.trim() || undefined,
      editorial: dto.editorial?.trim() || undefined,
      poin_dasar: dto.poin_dasar !== undefined ? Number(dto.poin_dasar) : 50,
    };

    questions.push(newQuestion);
    this.saveQuestions(questions);

    // Update total_soal pada Game terkait
    this.syncGameTotalQuestions(idGame);

    return {
      success: true,
      message: `Butir soal "${judul}" (${idSoal}) berhasil ditambahkan ke paket ${idGame}!`,
      question: newQuestion
    };
  }

  public static updateQuestion(idSoal: string, updates: UpdateQuestionDTO): { success: boolean; message: string; question?: Question } {
    const questions = this.getQuestions();
    const idx = questions.findIndex(q => q.id_soal === idSoal);
    if (idx === -1) return { success: false, message: 'Butir soal tidak ditemukan!' };

    const q = questions[idx];
    const prevGameId = q.id_game;

    if (updates.judul !== undefined) q.judul = updates.judul.trim();
    if (updates.narasi_soal !== undefined) q.narasi_soal = updates.narasi_soal.trim();
    if (updates.cuplikan_kode !== undefined) q.cuplikan_kode = updates.cuplikan_kode?.trim() || undefined;
    if (updates.id_game !== undefined) q.id_game = updates.id_game.trim().toUpperCase();

    if (updates.opsi_jawaban !== undefined) {
      if (Array.isArray(updates.opsi_jawaban)) {
        q.opsi_jawaban = updates.opsi_jawaban.map(o => (o || '').trim()).filter(Boolean).join('|');
      } else {
        q.opsi_jawaban = updates.opsi_jawaban.trim();
      }
    }

    if (updates.kunci_jawaban !== undefined) {
      q.kunci_jawaban = updates.kunci_jawaban.trim();
    }

    if (updates.teks_hint !== undefined) q.teks_hint = updates.teks_hint?.trim() || undefined;
    if (updates.editorial !== undefined) q.editorial = updates.editorial?.trim() || undefined;
    if (updates.poin_dasar !== undefined) q.poin_dasar = Number(updates.poin_dasar);

    this.saveQuestions(questions);

    // Sync total questions
    this.syncGameTotalQuestions(q.id_game);
    if (prevGameId !== q.id_game) {
      this.syncGameTotalQuestions(prevGameId);
    }

    return { success: true, message: `Butir soal ${idSoal} berhasil diperbarui!`, question: q };
  }

  public static deleteQuestion(idSoal: string): { success: boolean; message: string } {
    const questions = this.getQuestions();
    const target = questions.find(q => q.id_soal === idSoal);
    if (!target) return { success: false, message: 'Butir soal tidak ditemukan!' };

    const targetGameId = target.id_game;
    const filtered = questions.filter(q => q.id_soal !== idSoal);
    this.saveQuestions(filtered);

    // Sync total questions
    this.syncGameTotalQuestions(targetGameId);

    return { success: true, message: `Butir soal "${target.judul}" (${idSoal}) berhasil dihapus!` };
  }

  private static syncGameTotalQuestions(gameId: string): void {
    const games = this.getGames();
    const gIdx = games.findIndex(g => g.id_game === gameId);
    if (gIdx !== -1) {
      const qCount = this.getQuestions().filter(q => q.id_game === gameId).length;
      games[gIdx].total_soal = qCount;
      this.saveGames(games);
    }
  }

  // --- CODING PROBLEMS & ONLINE JUDGE MANAGEMENT ---
  public static getCodingProblems(): Problem[] {
    const raw = this.getItem(STORAGE_KEYS.CODING_PROBLEMS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.CODING_PROBLEMS, JSON.stringify(MOCK_PROBLEMS));
      return MOCK_PROBLEMS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.setItem(STORAGE_KEYS.CODING_PROBLEMS, JSON.stringify(MOCK_PROBLEMS));
        return MOCK_PROBLEMS;
      }
      return parsed;
    } catch {
      return MOCK_PROBLEMS;
    }
  }

  public static saveCodingProblems(problems: Problem[]): void {
    this.setItem(STORAGE_KEYS.CODING_PROBLEMS, JSON.stringify(problems));
  }

  public static getGameProblemMapping(): Record<string, string> {
    const raw = this.getItem(STORAGE_KEYS.GAME_PROBLEM_MAPPING);
    const defaultMapping: Record<string, string> = {
      G1: 'penjumlahan-dua-bilangan-prima',
      G2: 'rotasi-matriks-spiral-terbalik',
      G3: 'jalur-terpendek-gedung-kampus',
      G4: 'optimasi-tas-ransel-mahasiswa',
      G5: 'penjumlahan-dua-bilangan-prima',
      G6: 'rotasi-matriks-spiral-terbalik',
      G7: 'optimasi-tas-ransel-mahasiswa',
    };

    if (!raw) {
      this.setItem(STORAGE_KEYS.GAME_PROBLEM_MAPPING, JSON.stringify(defaultMapping));
      return defaultMapping;
    }
    try {
      return { ...defaultMapping, ...JSON.parse(raw) };
    } catch {
      return defaultMapping;
    }
  }

  public static saveGameProblemMapping(mapping: Record<string, string>): void {
    this.setItem(STORAGE_KEYS.GAME_PROBLEM_MAPPING, JSON.stringify(mapping));
  }

  public static linkGameToProblem(gameId: string, problemSlug: string): boolean {
    const mapping = this.getGameProblemMapping();
    mapping[gameId] = problemSlug;
    this.saveGameProblemMapping(mapping);
    return true;
  }

  public static getCodingProblemForGame(gameId: string): Problem | undefined {
    const mapping = this.getGameProblemMapping();
    const slug = mapping[gameId];
    const problems = this.getCodingProblems();

    if (slug) {
      const found = problems.find(p => p.slug === slug || p.id === slug);
      if (found) return found;
    }

    return problems[0];
  }

  public static createCodingProblem(dto: CreateCodingProblemDTO): { success: boolean; message: string; problem?: Problem } {
    const problems = this.getCodingProblems();
    const title = (dto.title || '').trim();
    if (!title) return { success: false, message: 'Judul tantangan koding wajib diisi!' };

    let slug = (dto.slug || '').trim().toLowerCase();
    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (problems.some(p => p.slug === slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const id = dto.id?.trim() || `prob-${Date.now().toString(36)}`;
    const newProblem: Problem = {
      id,
      contest_id: dto.game_id || null,
      title,
      slug,
      statement_md: dto.statement_md?.trim() || 'Deskripsi tantangan belum dikonfigurasi.',
      input_format: dto.input_format?.trim() || 'Standar input terformat.',
      output_format: dto.output_format?.trim() || 'Standar output baris.',
      constraints: dto.constraints?.trim() || '1 <= N <= 10^5',
      time_limit_ms: dto.time_limit_ms || 1000,
      memory_limit_mb: dto.memory_limit_mb || 256,
      difficulty: dto.difficulty || 'Medium',
      tags: dto.tags && dto.tags.length > 0 ? dto.tags : ['Algorithm', 'Competitive Programming'],
      is_published: true,
      sample_test_cases: dto.sample_test_cases || [],
      created_at: new Date().toISOString()
    };

    problems.push(newProblem);
    this.saveCodingProblems(problems);

    if (dto.game_id) {
      this.linkGameToProblem(dto.game_id, slug);
    }

    return {
      success: true,
      message: `Tantangan koding "${title}" (${slug}) berhasil dibuat!`,
      problem: newProblem
    };
  }

  public static updateCodingProblem(idOrSlug: string, updates: UpdateCodingProblemDTO): { success: boolean; message: string; problem?: Problem } {
    const problems = this.getCodingProblems();
    const idx = problems.findIndex(p => p.id === idOrSlug || p.slug === idOrSlug);
    if (idx === -1) return { success: false, message: 'Tantangan koding tidak ditemukan!' };

    const p = problems[idx];
    if (updates.title) p.title = updates.title.trim();
    if (updates.statement_md !== undefined) p.statement_md = updates.statement_md.trim();
    if (updates.input_format !== undefined) p.input_format = updates.input_format.trim();
    if (updates.output_format !== undefined) p.output_format = updates.output_format.trim();
    if (updates.constraints !== undefined) p.constraints = updates.constraints.trim();
    if (updates.time_limit_ms) p.time_limit_ms = Number(updates.time_limit_ms);
    if (updates.memory_limit_mb) p.memory_limit_mb = Number(updates.memory_limit_mb);
    if (updates.difficulty) p.difficulty = updates.difficulty;
    if (updates.tags) p.tags = updates.tags;
    if (updates.sample_test_cases) p.sample_test_cases = updates.sample_test_cases;

    this.saveCodingProblems(problems);

    if (updates.game_id) {
      this.linkGameToProblem(updates.game_id, p.slug);
    }

    return { success: true, message: `Tantangan koding "${p.title}" berhasil diperbarui!`, problem: p };
  }

  public static deleteCodingProblem(idOrSlug: string): { success: boolean; message: string } {
    const problems = this.getCodingProblems();
    const target = problems.find(p => p.id === idOrSlug || p.slug === idOrSlug);
    if (!target) return { success: false, message: 'Tantangan koding tidak ditemukan!' };

    const filtered = problems.filter(p => p.id !== target.id && p.slug !== target.slug);
    this.saveCodingProblems(filtered);

    // Clean up mapping
    const mapping = this.getGameProblemMapping();
    let modified = false;
    for (const gId in mapping) {
      if (mapping[gId] === target.slug || mapping[gId] === target.id) {
        delete mapping[gId];
        modified = true;
      }
    }
    if (modified) {
      this.saveGameProblemMapping(mapping);
    }

    return { success: true, message: `Tantangan koding "${target.title}" berhasil dihapus!` };
  }

  public static getSubmissions(): Submission[] {
    const raw = this.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    try {
      const parsed: Submission[] = JSON.parse(raw);
      // Auto-purge legacy prototype mock submissions
      const legacyMockIds = ['SUB-2545001-G1', 'SUB-2545001-G2', 'SUB-2545001-G4'];
      const hasLegacyMock = parsed.some(s => legacyMockIds.includes(s.id_submission));
      if (hasLegacyMock) {
        const cleaned = parsed.filter(s => !legacyMockIds.includes(s.id_submission));
        this.saveSubmissions(cleaned);
        return cleaned;
      }
      return parsed;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  }

  public static saveSubmissions(submissions: Submission[]): void {
    this.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  /**
   * Menghapus 1 submisi spesifik dan menyinkronkan kembali XP & level mahasiswa
   */
  public static deleteSubmission(submissionId: string): { success: boolean; message: string } {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(s => s.id_submission === submissionId);
    if (idx === -1) {
      return { success: false, message: 'Submisi tidak ditemukan di basis data.' };
    }

    const [removed] = subs.splice(idx, 1);
    this.saveSubmissions(subs);

    // Sinkronkan pengurangan skor XP dan level mahasiswa jika ada poin yang didapat
    if (removed.skor_xp > 0) {
      const users = this.getUsers();
      const uIdx = users.findIndex(u => u.nim === removed.nim);
      if (uIdx !== -1) {
        const newXp = Math.max(0, (users[uIdx].total_xp || 0) - removed.skor_xp);
        const levelInfo = calculateLevelInfo(newXp);
        users[uIdx].total_xp = newXp;
        users[uIdx].level = levelInfo.level;
        users[uIdx].tier_badge = levelInfo.tierBadge;
        this.saveUsers(users);

        const current = this.getCurrentUser();
        if (current && current.nim === removed.nim) {
          this.setCurrentUser(users[uIdx]);
        }
      }
    }

    return { success: true, message: `Submisi ${submissionId} berhasil dihapus!` };
  }

  /**
   * Menghapus seluruh submisi untuk suatu paket game/problem tertentu (Bulk delete per problem)
   */
  public static deleteSubmissionsForGame(gameId: string): { success: boolean; message: string; deletedCount: number } {
    const subs = this.getSubmissions();
    const toRemove = subs.filter(s => s.id_game === gameId);
    if (toRemove.length === 0) {
      return { success: false, message: `Tidak ada submisi untuk paket ${gameId}.`, deletedCount: 0 };
    }

    const remaining = subs.filter(s => s.id_game !== gameId);
    this.saveSubmissions(remaining);

    // Sinkronkan pengurangan skor XP mahasiswa yang terdampak
    const users = this.getUsers();
    let usersUpdated = false;
    for (const sub of toRemove) {
      if (sub.skor_xp > 0) {
        const uIdx = users.findIndex(u => u.nim === sub.nim);
        if (uIdx !== -1) {
          const newXp = Math.max(0, (users[uIdx].total_xp || 0) - sub.skor_xp);
          const levelInfo = calculateLevelInfo(newXp);
          users[uIdx].total_xp = newXp;
          users[uIdx].level = levelInfo.level;
          users[uIdx].tier_badge = levelInfo.tierBadge;
          usersUpdated = true;
        }
      }
    }

    if (usersUpdated) {
      this.saveUsers(users);
      const current = this.getCurrentUser();
      if (current) {
        const updatedSelf = users.find(u => u.nim === current.nim);
        if (updatedSelf) this.setCurrentUser(updatedSelf);
      }
    }

    return {
      success: true,
      message: `Berhasil menghapus ${toRemove.length} submisi untuk paket ${gameId}!`,
      deletedCount: toRemove.length,
    };
  }

  public static getTeams(): Team[] {
    const raw = this.getItem(STORAGE_KEYS.TEAMS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TEAMS;
    }
  }

  public static saveTeams(teams: Team[]): void {
    this.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }

  public static getFirstBloods(): FirstBloodAnnouncement[] {
    const raw = this.getItem(STORAGE_KEYS.FIRST_BLOODS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.FIRST_BLOODS, JSON.stringify(FIRST_BLOOD_TICKER_DATA));
      return FIRST_BLOOD_TICKER_DATA;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return FIRST_BLOOD_TICKER_DATA;
    }
  }

  public static saveFirstBloods(fb: FirstBloodAnnouncement[]): void {
    this.setItem(STORAGE_KEYS.FIRST_BLOODS, JSON.stringify(fb));
  }

  // --- AUTHENTICATION & SESSION PERSISTENCE ---
  public static getCurrentUser(): User | null {
    const raw = this.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      const user = JSON.parse(raw) as User;
      const freshUser = this.getUsers().find(u => u.nim === user.nim);
      return freshUser || user;
    } catch {
      return null;
    }
  }

  public static setCurrentUser(user: User | null): void {
    if (user) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      this.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  public static login(nim: string, pass: string): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const cleanNim = nim.trim().toUpperCase();
    const cleanPass = pass.trim();

    const found = users.find(u => u.nim.toUpperCase() === cleanNim);
    if (!found) {
      return { success: false, message: 'NIM atau Akun tidak terdaftar di sistem STMIK TIME!' };
    }

    // Default password sama dengan NIM, atau password yang tersimpan
    const expectedPass = found.password || found.nim;
    if (cleanPass !== expectedPass && cleanPass !== found.nim) {
      return { success: false, message: 'Password salah! Default password adalah NIM Anda.' };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  }

  public static logout(): void {
    this.setCurrentUser(null);
  }

  // --- USER PROFILE & AVATAR UPDATES ---
  public static updateProfile(nim: string, newCodename: string, newAvatar: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.nim === nim);
    if (idx === -1) return false;

    users[idx].codename = newCodename;
    users[idx].avatar = newAvatar;
    this.saveUsers(users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.nim === nim) {
      this.setCurrentUser(users[idx]);
    }
    return true;
  }

  // --- USER CREATION & MANAGEMENT CRUD ---
  public static createUser(dto: CreateUserDTO): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const cleanNim = (dto.nim || '').trim().toUpperCase();
    const cleanNama = (dto.nama_lengkap || '').trim();

    if (!cleanNim) {
      return { success: false, message: 'NIM atau NIDN tidak boleh kosong!' };
    }
    if (!cleanNama) {
      return { success: false, message: 'Nama lengkap tidak boleh kosong!' };
    }

    const exists = users.some(u => u.nim.toUpperCase() === cleanNim);
    if (exists) {
      return { success: false, message: `Akun dengan NIM/NIDN "${cleanNim}" sudah terdaftar!` };
    }

    const role: UserRole = dto.role === 'ADMIN' ? 'ADMIN' : 'PESERTA';
    let klubHari: KlubHari = role === 'ADMIN' ? 'ALL' : (dto.klub_hari || 'KAMIS');
    let idCohort = dto.id_cohort;
    let periode = dto.periode;

    if (idCohort) {
      const cohort = this.getCohortById(idCohort);
      if (cohort) {
        if (!periode) periode = cohort.periode;
        if (role !== 'ADMIN') {
          if (cohort.id_cohort === 'c-jumat') klubHari = 'JUMAT';
          else if (cohort.id_cohort === 'c-lomba') klubHari = 'LOMBA';
          else if (cohort.id_cohort === 'c-kamis') klubHari = 'KAMIS';
        }
      }
    } else if (role !== 'ADMIN') {
      if (klubHari === 'JUMAT') idCohort = 'c-jumat';
      else if (klubHari === 'LOMBA') idCohort = 'c-lomba';
      else idCohort = 'c-kamis';
      const cohort = this.getCohortById(idCohort);
      if (cohort && !periode) periode = cohort.periode;
    }

    if (periode) {
      const normalized = this.normalizePeriode(periode);
      if (normalized) periode = normalized;
    }

    // Inisial Monogram
    const getInitials = (nama: string) => {
      const parts = nama.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const codename = dto.codename?.trim() || (cleanNama.split(/\s+/)[0] + '_' + cleanNim.slice(-4));
    const avatar = getInitials(cleanNama);

    const newUser: User = {
      nim: cleanNim,
      password: dto.password?.trim() || cleanNim,
      nama_lengkap: cleanNama,
      codename: codename,
      avatar: avatar,
      role: role,
      prodi: dto.prodi?.trim() || (role === 'ADMIN' ? 'Dosen STMIK TIME' : 'Sistem Informasi'),
      angkatan: dto.angkatan || 2025,
      kelas_reguler: dto.kelas_reguler?.trim() || (role === 'ADMIN' ? 'Dosen Pembina' : (klubHari === 'LOMBA' ? 'KONTES ICPC TIME' : 'SI C 25')),
      klub_hari: klubHari,
      id_cohort: idCohort,
      periode: periode || 'Ganjil 2025',
      total_xp: 0,
      level: 1,
      tier_badge: 'Logic Novice',
      milestones_json: [],
      id_tim: ''
    };

    users.push(newUser);
    this.saveUsers(users);

    return { success: true, message: `Akun ${cleanNama} (${cleanNim}) berhasil didaftarkan!`, user: newUser };
  }

  public static deleteUser(nim: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.nim.toUpperCase() === nim.trim().toUpperCase());
    if (idx === -1) {
      return { success: false, message: 'Akun tidak ditemukan!' };
    }
    const removed = users.splice(idx, 1)[0];
    this.saveUsers(users);
    return { success: true, message: `Akun ${removed.nama_lengkap} (${removed.nim}) berhasil dihapus.` };
  }

  // --- LEADERBOARD BUILDERS ---
  public static getLeaderboardPlayers(klubFilter: KlubHari = 'KAMIS'): LeaderboardPlayer[] {
    const users = this.getUsers();
    const submissions = this.getSubmissions();

    let filtered = users.filter(u => u.role === 'PESERTA');
    if (klubFilter !== 'ALL') {
      filtered = filtered.filter(u => u.klub_hari === klubFilter);
    }

    const leaderboard: LeaderboardPlayer[] = filtered.map(u => {
      const userSubs = submissions.filter(s => s.nim === u.nim && s.status_sesi === 'DONE');
      const totalNilai = userSubs.reduce((acc, s) => acc + s.nilai_akademik, 0);
      const rataNilai = userSubs.length > 0 ? Math.round(totalNilai / userSubs.length) : 0;

      return {
        nim: u.nim,
        codename: u.codename,
        avatar: u.avatar,
        klub_hari: u.klub_hari,
        total_xp: u.total_xp,
        level: u.level,
        rata_nilai: rataNilai,
        tier_badge: u.tier_badge
      };
    });

    return leaderboard.sort((a, b) => b.total_xp - a.total_xp);
  }

  // --- DOMjudge ICPC SCOREBOARD MATRIX BUILDER (WITH FREEZE CAPABILITY) ---
  public static getICPCScoreboard(
    klubFilter: KlubHari = 'KAMIS',
    isFrozen: boolean = false
  ): {
    rows: ICPCScoreboardRow[];
    problemStats: { [letter: string]: { solvedCount: number; totalAttempts: number } };
  } {
    const users = this.getUsers().filter(u => u.role === 'PESERTA');
    const submissions = this.getSubmissions();
    const teams = this.getTeams();
    const questions = this.getQuestions();

    const filteredUsers = klubFilter === 'ALL'
      ? users
      : users.filter(u => u.klub_hari === klubFilter);

    // Hitung first blood per game
    const firstSolveMap: { [gameId: string]: string } = {};
    ICPC_PROBLEMS_DEF.forEach(prob => {
      const qInGame = questions.filter(q => q.id_game === prob.gameId);
      const firstBloodNim = qInGame.find(q => q.first_blood_by)?.first_blood_by;
      if (firstBloodNim) {
        const u = users.find(user => user.codename === firstBloodNim || user.nim === firstBloodNim);
        if (u) firstSolveMap[prob.gameId] = u.nim;
      }
      if (!firstSolveMap[prob.gameId]) {
        const earlySub = submissions
          .filter(s => s.id_game === prob.gameId && (s.status_lulus === 'LULUS' || s.nilai_akademik >= 50))
          .sort((a, b) => new Date(a.timestamp_update).getTime() - new Date(b.timestamp_update).getTime())[0];
        if (earlySub) {
          firstSolveMap[prob.gameId] = earlySub.nim;
        }
      }
    });

    const problemStats: { [letter: string]: { solvedCount: number; totalAttempts: number } } = {};
    ICPC_PROBLEMS_DEF.forEach(p => {
      problemStats[p.letter] = { solvedCount: 0, totalAttempts: 0 };
    });

    const rows: ICPCScoreboardRow[] = filteredUsers.map(user => {
      const userSubs = submissions.filter(s => s.nim === user.nim);
      const userTeam = teams.find(t => t.id_tim === user.id_tim || t.daftar_nim_json.includes(user.nim));

      let solvedCount = 0;
      let totalPenaltyTime = 0;
      const problems: { [letter: string]: ICPCProblemStatus } = {};

      ICPC_PROBLEMS_DEF.forEach(prob => {
        const sub = userSubs.find(s => s.id_game === prob.gameId);
        if (!sub) {
          problems[prob.letter] = {
            problemLetter: prob.letter,
            gameId: prob.gameId,
            balloonColor: prob.balloonColor,
            balloonEmoji: prob.balloonEmoji,
            isSolved: false,
            isFirstSolve: false,
            attempts: 0,
            solveTimeMinutes: 0
          };
          return;
        }

        const isSolved = sub.status_lulus === 'LULUS' || sub.nilai_akademik >= 50;
        const failedAttempts = sub.detail_jawaban_json ? sub.detail_jawaban_json.filter(d => !d.is_correct).length : 0;
        const attempts = Math.max(1, failedAttempts + (isSolved ? 1 : 0));
        problemStats[prob.letter].totalAttempts += attempts;

        // Hitung menit solve
        const diffMs = Math.max(60000, new Date(sub.timestamp_update).getTime() - new Date(sub.timestamp_mulai).getTime());
        const solveMinutes = Math.min(180, Math.max(12, Math.round(diffMs / 60000) + (sub.id_game === 'G4' ? 45 : sub.id_game === 'G2' ? 25 : 15)));

        // Kondisi Freeze: Submisi pada game G4 & G6 ditandai pending saat freeze
        const isPendingFreeze = isFrozen && (prob.gameId === 'G4' || prob.gameId === 'G6');

        if (isSolved && !isPendingFreeze) {
          solvedCount += 1;
          const penalty = solveMinutes + (failedAttempts * 20);
          totalPenaltyTime += penalty;
          problemStats[prob.letter].solvedCount += 1;
        }

        const isFirst = firstSolveMap[prob.gameId] === user.nim;

        problems[prob.letter] = {
          problemLetter: prob.letter,
          gameId: prob.gameId,
          balloonColor: prob.balloonColor,
          balloonEmoji: prob.balloonEmoji,
          isSolved: isSolved && !isPendingFreeze,
          isFirstSolve: isFirst && isSolved && !isPendingFreeze,
          attempts,
          solveTimeMinutes: solveMinutes,
          isPendingFreeze
        };
      });

      return {
        rank: 1,
        nim: user.nim,
        id_tim: userTeam?.id_tim,
        nama_tim: userTeam?.nama_tim,
        displayName: user.codename,
        realName: user.nama_lengkap,
        avatar: user.avatar,
        klub_hari: user.klub_hari,
        solvedCount,
        totalPenaltyTime,
        totalXP: user.total_xp,
        problems
      };
    });

    // Urutkan sesuai standar ICPC
    rows.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }
      if (a.totalPenaltyTime !== b.totalPenaltyTime) {
        return a.totalPenaltyTime - b.totalPenaltyTime;
      }
      return b.totalXP - a.totalXP;
    });

    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return { rows, problemStats };
  }

  // --- STAT CARDS CALCULATOR ---
  public static getUserStats(user: User): {
    totalGamesSelesai: number;
    totalGamesKelas: number;
    jadwalKlubLabel: string;
    rataRataNilaiAkhir: number;
    nilaiTerbaik: number;
    totalXP: number;
    level: number;
    xpNeededForNext: number;
    diagnostikStatus: string;
    diagnostikSubtitle: string;
  } {
    const games = this.getGames();
    const submissions = this.getSubmissions();

    // Game yang relevan untuk user (sesuai kelasnya)
    const userGames = games.filter(g => {
      if (user.klub_hari === 'LOMBA') return (g.status_lomba || 'UPCOMING') !== 'UPCOMING';
      if (user.klub_hari === 'KAMIS') return g.status_kamis !== 'UPCOMING';
      if (user.klub_hari === 'JUMAT') return g.status_jumat !== 'UPCOMING';
      return true;
    });

    const userSubs = submissions.filter(s => s.nim === user.nim && s.status_sesi === 'DONE');
    const totalGamesSelesai = userSubs.length;
    const totalGamesKelas = games.length;

    const nilaiList = userSubs.map(s => s.nilai_akademik);
    const rataRataNilaiAkhir = nilaiList.length > 0 ? Math.round(nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length) : 0;
    const nilaiTerbaik = nilaiList.length > 0 ? Math.max(...nilaiList) : 0;

    const levelInfo = calculateLevelInfo(user.total_xp);

    const jadwalKlubLabel = user.klub_hari === 'KAMIS'
      ? 'HARI KAMIS (SI C 25)'
      : user.klub_hari === 'JUMAT'
      ? 'HARI JUMAT (TI & SI 24-25)'
      : user.klub_hari === 'LOMBA'
      ? 'KELAS LOMBA & SELEKSI ICPC'
      : 'ALL CLASS (DOSEN)';

    const diagnostikStatus = rataRataNilaiAkhir >= 75
      ? '🟢 Sangat Baik'
      : rataRataNilaiAkhir >= 50
      ? '🔴 Perlu Perhatian'
      : '🔴 Kritis & Pembinaan';

    const diagnostikSubtitle = rataRataNilaiAkhir < 80
      ? '1 Kategori Perlu Diulas'
      : 'Semua Kategori Tuntas';

    return {
      totalGamesSelesai,
      totalGamesKelas,
      jadwalKlubLabel,
      rataRataNilaiAkhir,
      nilaiTerbaik,
      totalXP: user.total_xp,
      level: levelInfo.level,
      xpNeededForNext: levelInfo.xpNeededForNext,
      diagnostikStatus,
      diagnostikSubtitle
    };
  }

  // --- SUBMISSIONS & QUIZ ENGINE ---
  public static getSubmissionForGame(nim: string, idGame: string): Submission | null {
    const submissions = this.getSubmissions();
    return submissions.find(s => s.nim === nim && s.id_game === idGame) || null;
  }

  /**
   * Mengembalikan butir soal kuis dengan urutan unik teracak deterministik
   * untuk peserta tertentu (Anti-Cheat Shuffling).
   */
  public static getQuestionsForUser(user: User | null, gameId: string, submission?: Submission | null): Question[] {
    const rawQuestions = this.getQuestions().filter(q => q.id_game === gameId);
    if (rawQuestions.length <= 1 || !user || user.role === 'ADMIN') {
      return rawQuestions;
    }

    // 1. Cek dari submission yang sudah ada / tersimpan
    const sub = submission || this.getSubmissionForGame(user.nim, gameId);
    if (sub && sub.shuffled_question_ids && sub.shuffled_question_ids.length > 0) {
      const qMap = new Map(rawQuestions.map(q => [q.id_soal, q]));
      const ordered: Question[] = [];
      for (const qId of sub.shuffled_question_ids) {
        const found = qMap.get(qId);
        if (found) ordered.push(found);
      }
      for (const q of rawQuestions) {
        if (!sub.shuffled_question_ids.includes(q.id_soal)) {
          ordered.push(q);
        }
      }
      if (ordered.length === rawQuestions.length) {
        return ordered;
      }
    }

    // 2. Fallback deterministik berbasis NIM + Game ID
    const seed = `${user.nim}_${gameId}_QUIZ_SEED`;
    return seededShuffle(rawQuestions, seed);
  }

  /**
   * Mengembalikan urutan problem solving (games/kontes) teracak deterministik per peserta.
   */
  public static getContestProblemsForUser<T extends { id_game?: string; id?: string }>(
    items: T[],
    user: User | null,
    contestId: string = 'GLOBAL'
  ): T[] {
    if (!user || user.role === 'ADMIN' || items.length <= 1) return items;
    const seed = `${user.nim}_${contestId}_CONTEST_SEED`;
    return seededShuffle(items, seed);
  }

  public static startQuizSession(user: User, game: Game): Submission {
    const existing = this.getSubmissionForGame(user.nim, game.id_game);
    if (existing) {
      // Jika submission legacy belum memiliki shuffled_question_ids, generate dan simpan
      if (!existing.shuffled_question_ids || existing.shuffled_question_ids.length === 0) {
        const questions = this.getQuestions().filter(q => q.id_game === game.id_game);
        const seed = `${user.nim}_${game.id_game}_QUIZ_SEED`;
        existing.shuffled_question_ids = seededShuffle(questions, seed).map(q => q.id_soal);
        const allSubs = this.getSubmissions().map(s => s.id_submission === existing.id_submission ? existing : s);
        this.saveSubmissions(allSubs);
      }
      return existing;
    }

    const questions = this.getQuestions().filter(q => q.id_game === game.id_game);
    const seed = `${user.nim}_${game.id_game}_QUIZ_SEED`;
    const shuffledQuestionIds = seededShuffle(questions, seed).map(q => q.id_soal);

    const newSub: Submission = {
      id_submission: `SUB-${user.nim}-${game.id_game}-${Date.now()}`,
      timestamp_mulai: new Date().toISOString(),
      timestamp_update: new Date().toISOString(),
      nim: user.nim,
      codename: user.codename,
      klub_hari: user.klub_hari,
      id_game: game.id_game,
      mode_game: game.mode_game,
      id_tim: user.id_tim || '',
      skor_xp: 0,
      nilai_akademik: 0,
      jumlah_benar: 0,
      total_soal: questions.length,
      status_lulus: 'BELUM LULUS',
      streak_saat_ini: 0,
      tab_switch_count: 0,
      status_sesi: 'ACTIVE',
      detail_jawaban_json: [],
      shuffled_question_ids: shuffledQuestionIds,
    };

    const subs = this.getSubmissions();
    subs.push(newSub);
    this.saveSubmissions(subs);
    return newSub;
  }

  public static answerQuestion(params: {
    submissionId: string;
    idSoal: string;
    jawaban: string;
    isTimeout: boolean;
    openedHint: boolean;
    sisaDetik: number;
  }): { submission: Submission; isCorrect: boolean; xpEarned: number } {
    const subs = this.getSubmissions();
    const subIdx = subs.findIndex(s => s.id_submission === params.submissionId);
    if (subIdx === -1) throw new Error('Sesi pengerjaan tidak ditemukan');

    const sub = subs[subIdx];
    const questions = this.getQuestions();
    const q = questions.find(item => item.id_soal === params.idSoal);
    if (!q) throw new Error('Soal tidak ditemukan');

    // Cek apakah sudah pernah dijawab sebelumnya
    const alreadyAnswered = sub.detail_jawaban_json.some(d => d.id_soal === params.idSoal);
    if (alreadyAnswered) {
      return { submission: sub, isCorrect: false, xpEarned: 0 };
    }

    const isCorrect = !params.isTimeout && (params.jawaban.trim().toLowerCase() === q.kunci_jawaban?.trim().toLowerCase());

    let xpEarned = 0;
    if (isCorrect) {
      sub.jumlah_benar += 1;
      sub.streak_saat_ini += 1;

      // Cek first blood
      const isFirstBlood = !q.first_blood_by;
      if (isFirstBlood) {
        q.first_blood_by = sub.codename;
        this.saveQuestions(questions);

        // Tambah ke ticker
        const firstBloods = this.getFirstBloods();
        firstBloods.unshift({
          id_soal: q.id_soal,
          judul_soal: q.judul,
          first_blood_by: sub.codename
        });
        this.saveFirstBloods(firstBloods.slice(0, 15));
      }

      const xpCalc = calculateQuestionXP({
        basePoints: q.poin_dasar,
        openedHint: params.openedHint,
        remainingSeconds: params.sisaDetik,
        currentStreak: sub.streak_saat_ini,
        isFirstBlood
      });

      xpEarned = xpCalc.totalXP;
      sub.skor_xp += xpEarned;
    } else {
      sub.streak_saat_ini = 0;
    }

    sub.detail_jawaban_json.push({
      id_soal: params.idSoal,
      jawaban_mahasiswa: params.jawaban,
      is_correct: isCorrect,
      is_timeout: params.isTimeout,
      opened_hint: params.openedHint,
      sisa_detik: params.sisaDetik,
      skor_xp_didapat: xpEarned
    });

    sub.timestamp_update = new Date().toISOString();
    subs[subIdx] = sub;
    this.saveSubmissions(subs);

    return { submission: sub, isCorrect, xpEarned };
  }

  public static recordTabSwitch(submissionId: string): Submission | null {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(s => s.id_submission === submissionId);
    if (idx === -1) return null;

    subs[idx].tab_switch_count += 1;
    // Potong langsung 5 XP per pelanggaran
    subs[idx].skor_xp = Math.max(0, subs[idx].skor_xp - 5);
    subs[idx].timestamp_update = new Date().toISOString();

    this.saveSubmissions(subs);
    return subs[idx];
  }

  public static finishQuizSession(submissionId: string): Submission {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(s => s.id_submission === submissionId);
    if (idx === -1) throw new Error('Sesi submisi tidak ditemukan');

    const sub = subs[idx];
    const games = this.getGames();
    const game = games.find(g => g.id_game === sub.id_game);
    const minLulus = game?.min_nilai_lulus || 70;

    // Hitung Nilai Akademik
    const grades = calculateAcademicGrade(sub.jumlah_benar, sub.total_soal, sub.tab_switch_count);
    sub.nilai_akademik = grades.nilaiAkhirBersih;
    sub.status_lulus = sub.nilai_akademik >= minLulus ? 'LULUS' : 'BELUM LULUS';
    sub.status_sesi = 'DONE';
    sub.timestamp_update = new Date().toISOString();

    subs[idx] = sub;
    this.saveSubmissions(subs);

    // Update akumulasi XP dan Level pengguna
    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.nim === sub.nim);
    if (uIdx !== -1) {
      users[uIdx].total_xp += sub.skor_xp;
      const lvl = calculateLevelInfo(users[uIdx].total_xp);
      users[uIdx].level = lvl.level;
      users[uIdx].tier_badge = lvl.tierBadge;
      this.saveUsers(users);

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.nim === sub.nim) {
        this.setCurrentUser(users[uIdx]);
      }
    }

    return sub;
  }

  // --- TEAM ENGINE & JOIN CODE (DOMjudge Internal / ICPC Squad) ---
  public static generateTeamJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const teams = this.getTeams();
    const existingCodes = teams.map(t => t.kode_gabung?.toUpperCase() || '');

    for (let attempt = 0; attempt < 200; attempt++) {
      let code = 'CP';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!existingCodes.includes(code)) return code;
    }
    return `CP${Math.floor(1000 + Math.random() * 9000)}`;
  }

  public static createTeam(user: User, namaTim: string): { success: boolean; team?: Team; message: string } {
    const cleanNama = namaTim.trim();
    if (cleanNama.length < 3) {
      return { success: false, message: 'Nama tim minimal 3 karakter!' };
    }

    const teams = this.getTeams();
    const users = this.getUsers();

    // Pastikan user belum tergabung dalam tim aktif
    const existingTeam = teams.find(t => t.daftar_nim_json.includes(user.nim));
    if (existingTeam) {
      return {
        success: false,
        message: `Anda sudah tergabung dalam tim "${existingTeam.nama_tim}". Silakan keluar dari tim terlebih dahulu.`
      };
    }

    const kodeGabung = this.generateTeamJoinCode();
    const newTeam: Team = {
      id_tim: `TIM-${user.klub_hari.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`,
      nama_tim: cleanNama,
      klub_hari: user.klub_hari,
      kode_gabung: kodeGabung,
      leader_nim: user.nim,
      daftar_nim_json: [user.nim],
      daftar_nama_json: [`${user.nama_lengkap} (${user.codename})`],
      total_skor_tim: user.total_xp
    };

    teams.push(newTeam);
    this.saveTeams(teams);

    // Update id_tim pada user
    const uIdx = users.findIndex(u => u.nim === user.nim);
    if (uIdx !== -1) {
      users[uIdx].id_tim = newTeam.id_tim;
      this.saveUsers(users);
      this.setCurrentUser(users[uIdx]);
    }

    return {
      success: true,
      team: newTeam,
      message: `Tim "${newTeam.nama_tim}" berhasil dibentuk! Bagikan Kode Gabung ${newTeam.kode_gabung} ke rekan tim Anda.`
    };
  }

  public static joinTeamWithCode(user: User, rawCode: string): { success: boolean; team?: Team; message: string } {
    const cleanInput = rawCode.trim().toUpperCase();
    if (!cleanInput) {
      return { success: false, message: 'Masukkan Kode Tim!' };
    }

    const normalizedInput = cleanInput.replace(/[^A-Z0-9]/g, '');
    const teams = this.getTeams();
    const users = this.getUsers();

    // Cari tim berdasarkan kode_gabung atau id_tim
    const teamIdx = teams.findIndex(t => {
      if (t.kode_gabung) {
        const normCode = t.kode_gabung.replace(/[^A-Z0-9]/g, '').toUpperCase();
        if (normCode === normalizedInput || t.kode_gabung.toUpperCase() === cleanInput) return true;
      }
      return t.id_tim.replace(/[^A-Z0-9]/g, '').toUpperCase() === normalizedInput;
    });

    if (teamIdx === -1) {
      return { success: false, message: `Kode Tim "${rawCode.toUpperCase()}" tidak ditemukan! Periksa kembali kode dari ketua tim Anda.` };
    }

    const team = teams[teamIdx];

    // Cek apakah user sudah berada di tim ini
    if (team.daftar_nim_json.includes(user.nim)) {
      return { success: false, message: `Anda sudah menjadi anggota tim "${team.nama_tim}"!` };
    }

    // Cek apakah user sudah punya tim lain
    const existingOtherTeam = teams.find(t => t.id_tim !== team.id_tim && t.daftar_nim_json.includes(user.nim));
    if (existingOtherTeam) {
      return {
        success: false,
        message: `Anda sudah tergabung dalam tim "${existingOtherTeam.nama_tim}". Silakan keluar dari tim lama sebelum bergabung.`
      };
    }

    // Cek batas kuota (Maks 3 Mahasiswa ICPC / DOMjudge)
    if (team.daftar_nim_json.length >= 3) {
      return {
        success: false,
        message: `Tim "${team.nama_tim}" sudah penuh (Maksimal 3 Mahasiswa sesuai regulasi ICPC/DOMjudge)!`
      };
    }

    // Cek batasan kelas kohort (kecuali user/tim bertipe ALL)
    if (team.klub_hari !== 'ALL' && user.klub_hari !== 'ALL' && team.klub_hari !== user.klub_hari) {
      return {
        success: false,
        message: `Tim "${team.nama_tim}" terdaftar untuk Kelas ${team.klub_hari}. Anda terdaftar di Kelas ${user.klub_hari}.`
      };
    }

    // Tambahkan user ke dalam tim
    team.daftar_nim_json.push(user.nim);
    team.daftar_nama_json.push(`${user.nama_lengkap} (${user.codename})`);

    // Hitung ulang total XP tim dari seluruh anggota
    const memberUsers = users.filter(u => team.daftar_nim_json.includes(u.nim));
    team.total_skor_tim = memberUsers.reduce((sum, m) => sum + (m.total_xp || 0), 0);
    if (!team.leader_nim && team.daftar_nim_json.length > 0) {
      team.leader_nim = team.daftar_nim_json[0];
    }

    teams[teamIdx] = team;
    this.saveTeams(teams);

    // Update user
    const uIdx = users.findIndex(u => u.nim === user.nim);
    if (uIdx !== -1) {
      users[uIdx].id_tim = team.id_tim;
      this.saveUsers(users);
      this.setCurrentUser(users[uIdx]);
    }

    return {
      success: true,
      team,
      message: `Selamat! Anda berhasil bergabung ke dalam squad "${team.nama_tim}".`
    };
  }

  public static leaveTeam(user: User): { success: boolean; message: string } {
    const teams = this.getTeams();
    const users = this.getUsers();

    const teamIdx = teams.findIndex(t => t.daftar_nim_json.includes(user.nim) || t.id_tim === user.id_tim);
    if (teamIdx === -1) {
      // Bersihkan id_tim user jika ada desinkronisasi
      const uIdx = users.findIndex(u => u.nim === user.nim);
      if (uIdx !== -1) {
        users[uIdx].id_tim = '';
        this.saveUsers(users);
        this.setCurrentUser(users[uIdx]);
      }
      return { success: true, message: 'Status tim berhasil dibersihkan.' };
    }

    const team = teams[teamIdx];
    team.daftar_nim_json = team.daftar_nim_json.filter(nim => nim !== user.nim);
    team.daftar_nama_json = team.daftar_nama_json.filter(name => !name.includes(user.nim) && !name.includes(user.nama_lengkap));

    // Jika tim kosong setelah ditinggal, hapus tim
    if (team.daftar_nim_json.length === 0) {
      teams.splice(teamIdx, 1);
    } else {
      // Jika yang keluar adalah ketua tim, serahkan kepemimpinan ke anggota berikutnya
      if (team.leader_nim === user.nim) {
        team.leader_nim = team.daftar_nim_json[0];
      }
      // Hitung ulang skor tim
      const memberUsers = users.filter(u => team.daftar_nim_json.includes(u.nim));
      team.total_skor_tim = memberUsers.reduce((sum, m) => sum + (m.total_xp || 0), 0);
      teams[teamIdx] = team;
    }
    this.saveTeams(teams);

    // Bersihkan id_tim user
    const uIdx = users.findIndex(u => u.nim === user.nim);
    if (uIdx !== -1) {
      users[uIdx].id_tim = '';
      this.saveUsers(users);
      this.setCurrentUser(users[uIdx]);
    }

    return { success: true, message: `Anda telah keluar dari tim "${team.nama_tim}".` };
  }

  public static disbandTeam(idTim: string, requesterNim?: string): { success: boolean; message: string } {
    const teams = this.getTeams();
    const teamIdx = teams.findIndex(t => t.id_tim === idTim);
    if (teamIdx === -1) {
      return { success: false, message: 'Tim tidak ditemukan.' };
    }

    const team = teams[teamIdx];
    if (requesterNim && team.leader_nim && requesterNim !== 'ADMIN' && team.leader_nim !== requesterNim) {
      return { success: false, message: 'Hanya Ketua Tim atau Dosen Pembina yang dapat membubarkan tim!' };
    }

    const users = this.getUsers();
    team.daftar_nim_json.forEach(nim => {
      const uIdx = users.findIndex(u => u.nim === nim);
      if (uIdx !== -1) {
        users[uIdx].id_tim = '';
      }
    });
    this.saveUsers(users);

    const currentUser = this.getCurrentUser();
    if (currentUser && team.daftar_nim_json.includes(currentUser.nim)) {
      currentUser.id_tim = '';
      this.setCurrentUser(currentUser);
    }

    teams.splice(teamIdx, 1);
    this.saveTeams(teams);

    return { success: true, message: `Tim "${team.nama_tim}" berhasil dibubarkan.` };
  }

  public static getTeamMembers(team: Team): TeamMemberInfo[] {
    const users = this.getUsers();
    return team.daftar_nim_json.map(nim => {
      const u = users.find(user => user.nim === nim);
      return {
        nim: nim,
        nama_lengkap: u?.nama_lengkap || nim,
        codename: u?.codename || 'Peserta',
        avatar: u?.avatar || '⚡',
        role: u?.role || 'PESERTA',
        prodi: u?.prodi || 'Sistem Informasi',
        angkatan: u?.angkatan || 2025,
        kelas_reguler: u?.kelas_reguler || 'SI C 25',
        klub_hari: u?.klub_hari || team.klub_hari,
        total_xp: u?.total_xp || 0,
        level: u?.level || 1,
        tier_badge: u?.tier_badge || '🌱 Logic Novice',
        is_leader: team.leader_nim === nim
      };
    });
  }

  // --- ADMIN METHODS ---
  public static updateGameStatus(
    idGame: string,
    statusKamis: GameStatus,
    statusJumat: GameStatus,
    statusLomba?: GameStatus
  ): boolean {
    const games = this.getGames();
    const idx = games.findIndex(g => g.id_game === idGame);
    if (idx === -1) return false;

    games[idx].status_kamis = statusKamis;
    games[idx].status_jumat = statusJumat;
    if (statusLomba !== undefined) {
      games[idx].status_lomba = statusLomba;
    }
    
    // Sinkronisasikan ke dynamic cohort_statuses
    const cohortStatuses = { ...(games[idx].cohort_statuses || {}) };
    cohortStatuses['c-kamis'] = statusKamis;
    cohortStatuses['KAMIS'] = statusKamis;
    cohortStatuses['c-jumat'] = statusJumat;
    cohortStatuses['JUMAT'] = statusJumat;
    if (statusLomba !== undefined) {
      cohortStatuses['c-lomba'] = statusLomba;
      cohortStatuses['LOMBA'] = statusLomba;
    }
    games[idx].cohort_statuses = cohortStatuses;

    this.saveGames(games);
    return true;
  }

  // --- DYNAMIC GAME & COHORT STATUS METHODS ---
  public static getGameStatusForCohort(game: Game, cohortIdOrCode: string): GameStatus {
    if (!game) return 'UPCOMING';
    const normalized = (cohortIdOrCode || '').trim();

    // 1. Direct key match in dynamic map
    if (game.cohort_statuses && game.cohort_statuses[normalized]) {
      return game.cohort_statuses[normalized];
    }

    // 2. Standard base cohorts fallback
    if (normalized === 'c-kamis' || normalized === 'KAMIS') {
      return game.status_kamis;
    }
    if (normalized === 'c-jumat' || normalized === 'JUMAT') {
      return game.status_jumat;
    }
    if (normalized === 'c-lomba' || normalized === 'LOMBA') {
      return game.status_lomba || 'UPCOMING';
    }

    // 3. Resolve via Cohort object
    const cohort = this.getCohortById(normalized);
    if (cohort && game.cohort_statuses) {
      if (game.cohort_statuses[cohort.id_cohort]) return game.cohort_statuses[cohort.id_cohort];
      if (game.cohort_statuses[cohort.kode_kelas]) return game.cohort_statuses[cohort.kode_kelas];
    }

    // Default to UPCOMING if not specifically configured
    return 'UPCOMING';
  }

  public static getGameStatusForUser(game: Game, user: User | null | undefined): GameStatus {
    if (!user) return 'UPCOMING';
    if (user.role === 'ADMIN') return 'OPEN';
    const cohortId = user.id_cohort || user.klub_hari;
    return this.getGameStatusForCohort(game, cohortId);
  }

  public static updateGameCohortStatus(
    idGame: string,
    cohortIdOrCode: string,
    newStatus: GameStatus
  ): boolean {
    const games = this.getGames();
    const idx = games.findIndex(g => g.id_game === idGame);
    if (idx === -1) return false;

    const game = games[idx];
    const statuses = { ...(game.cohort_statuses || {}) };
    const norm = (cohortIdOrCode || '').trim();

    statuses[norm] = newStatus;

    if (norm === 'c-kamis' || norm === 'KAMIS') {
      game.status_kamis = newStatus;
      statuses['c-kamis'] = newStatus;
      statuses['KAMIS'] = newStatus;
    } else if (norm === 'c-jumat' || norm === 'JUMAT') {
      game.status_jumat = newStatus;
      statuses['c-jumat'] = newStatus;
      statuses['JUMAT'] = newStatus;
    } else if (norm === 'c-lomba' || norm === 'LOMBA') {
      game.status_lomba = newStatus;
      statuses['c-lomba'] = newStatus;
      statuses['LOMBA'] = newStatus;
    } else {
      const cohort = this.getCohortById(norm);
      if (cohort) {
        statuses[cohort.id_cohort] = newStatus;
        statuses[cohort.kode_kelas] = newStatus;
      }
    }

    game.cohort_statuses = statuses;
    this.saveGames(games);
    return true;
  }

  public static createGame(dto: CreateGameDTO): { success: boolean; message: string; game?: Game } {
    const games = this.getGames();
    const judul = (dto.judul_game || '').trim();
    const ref = (dto.ref_pertemuan || '').trim();
    const kategori = (dto.kategori_materi || '').trim();

    if (!judul) return { success: false, message: 'Judul paket kontes wajib diisi!' };
    if (!ref) return { success: false, message: 'Referensi pertemuan wajib diisi!' };
    if (!kategori) return { success: false, message: 'Kategori materi wajib diisi!' };

    // Tentukan ID Game jika belum disediakan
    let idGame = (dto.id_game || '').trim().toUpperCase();
    if (!idGame) {
      let maxNum = 0;
      games.forEach(g => {
        const m = g.id_game.match(/^G(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      idGame = `G${maxNum + 1}`;
    }

    if (games.some(g => g.id_game === idGame)) {
      return { success: false, message: `Paket Game dengan ID "${idGame}" sudah terdaftar!` };
    }

    const pin = dto.mode_game === 'TEAM'
      ? (dto.pin_akses?.trim() || `TIME-${Math.floor(100 + Math.random() * 900)}`)
      : undefined;

    const initialStatus: GameStatus = dto.initial_status || 'UPCOMING';
    const cohortStatuses: Record<string, GameStatus> = {};
    const allowedCohortIds = dto.allowed_cohort_ids && dto.allowed_cohort_ids.length > 0
      ? dto.allowed_cohort_ids
      : this.getCohorts().map(c => c.id_cohort);

    allowedCohortIds.forEach(cId => {
      cohortStatuses[cId] = initialStatus;
    });

    const isAllowedKamis = allowedCohortIds.includes('c-kamis') || allowedCohortIds.includes('KAMIS');
    const isAllowedJumat = allowedCohortIds.includes('c-jumat') || allowedCohortIds.includes('JUMAT');
    const isAllowedLomba = allowedCohortIds.includes('c-lomba') || allowedCohortIds.includes('LOMBA');

    const newGame: Game = {
      id_game: idGame,
      ref_pertemuan: ref,
      judul_game: judul,
      kategori_materi: kategori,
      kesulitan: dto.kesulitan || 'Medium',
      mode_game: dto.mode_game || 'SOLO',
      pin_akses: pin,
      status_kamis: isAllowedKamis ? initialStatus : 'UPCOMING',
      status_jumat: isAllowedJumat ? initialStatus : 'UPCOMING',
      status_lomba: isAllowedLomba ? initialStatus : 'UPCOMING',
      cohort_statuses: cohortStatuses,
      durasi_total_menit: dto.durasi_total_menit || 30,
      durasi_per_soal_detik: dto.durasi_per_soal_detik || 60,
      min_nilai_lulus: dto.min_nilai_lulus || 70,
      total_soal: 0,
    };

    games.push(newGame);
    this.saveGames(games);

    // Sinkronisasikan hak akses ke tabel kohort
    const cohorts = this.getCohorts();
    let cohortsModified = false;
    cohorts.forEach(c => {
      const isTarget = allowedCohortIds.includes(c.id_cohort) || allowedCohortIds.includes(c.kode_kelas);
      if (isTarget && !c.allowed_game_ids.includes(idGame)) {
        c.allowed_game_ids.push(idGame);
        cohortsModified = true;
      }
    });
    if (cohortsModified) {
      this.saveCohorts(cohorts);
    }

    return {
      success: true,
      message: `Paket Game "${judul}" (${idGame}) berhasil dibuat!`,
      game: newGame
    };
  }

  public static updateGame(
    idGame: string,
    updates: Partial<Game> & { allowed_cohort_ids?: string[] }
  ): { success: boolean; message: string; game?: Game } {
    const games = this.getGames();
    const idx = games.findIndex(g => g.id_game === idGame);
    if (idx === -1) return { success: false, message: 'Game tidak ditemukan!' };

    const { allowed_cohort_ids, ...fieldUpdates } = updates;
    games[idx] = { ...games[idx], ...fieldUpdates };
    this.saveGames(games);

    if (allowed_cohort_ids) {
      const cohorts = this.getCohorts();
      cohorts.forEach(c => {
        const isTarget = allowed_cohort_ids.includes(c.id_cohort) || allowed_cohort_ids.includes(c.kode_kelas);
        if (isTarget && !c.allowed_game_ids.includes(idGame)) {
          c.allowed_game_ids.push(idGame);
        } else if (!isTarget && c.allowed_game_ids.includes(idGame)) {
          c.allowed_game_ids = c.allowed_game_ids.filter(id => id !== idGame);
        }
      });
      this.saveCohorts(cohorts);
    }

    return { success: true, message: `Paket Game ${idGame} berhasil diperbarui!`, game: games[idx] };
  }

  public static deleteGame(idGame: string): { success: boolean; message: string } {
    const games = this.getGames();
    const target = games.find(g => g.id_game === idGame);
    if (!target) return { success: false, message: 'Game tidak ditemukan!' };

    // 1. Filter out games
    const filteredGames = games.filter(g => g.id_game !== idGame);
    this.saveGames(filteredGames);

    // 2. Filter out questions
    const questions = this.getQuestions().filter(q => q.id_game !== idGame);
    this.saveQuestions(questions);

    // 3. Filter out submissions
    const submissions = this.getSubmissions().filter(s => s.id_game !== idGame);
    this.saveSubmissions(submissions);

    // 4. Remove from cohorts
    const cohorts = this.getCohorts();
    cohorts.forEach(c => {
      c.allowed_game_ids = c.allowed_game_ids.filter(id => id !== idGame);
    });
    this.saveCohorts(cohorts);

    return {
      success: true,
      message: `Paket Game "${target.judul_game}" (${idGame}) beserta seluruh data terkait berhasil dihapus!`
    };
  }

  public static freezeCohort(cohortIdOrCode: string): void {
    const games = this.getGames();
    games.forEach(g => {
      const current = this.getGameStatusForCohort(g, cohortIdOrCode);
      if (current === 'OPEN') {
        this.updateGameCohortStatus(g.id_game, cohortIdOrCode, 'FROZEN');
      }
    });
  }

  public static unfreezeCohort(cohortIdOrCode: string): void {
    const games = this.getGames();
    games.forEach(g => {
      const current = this.getGameStatusForCohort(g, cohortIdOrCode);
      if (current === 'FROZEN') {
        this.updateGameCohortStatus(g.id_game, cohortIdOrCode, 'OPEN');
      }
    });
  }

  public static randomizeGamePin(idGame: string): string {
    const games = this.getGames();
    const idx = games.findIndex(g => g.id_game === idGame);
    if (idx === -1) return '';

    const newPin = `TIME-${Math.floor(100 + Math.random() * 900)}`;
    games[idx].pin_akses = newPin;
    this.saveGames(games);
    return newPin;
  }

  public static generateTeamsForClass(klubHari: KlubHari): Team[] {
    const users = this.getUsers();
    const existingTeams = this.getTeams().filter(t => t.klub_hari !== klubHari);
    const newTeams = generateSnakeDraftTeams(users, klubHari, 3);

    const merged = [...existingTeams, ...newTeams];
    this.saveTeams(merged);

    // Update team reference pada users
    newTeams.forEach(team => {
      team.daftar_nim_json.forEach(nim => {
        const uIdx = users.findIndex(u => u.nim === nim);
        if (uIdx !== -1) {
          users[uIdx].id_tim = team.id_tim;
        }
      });
    });
    this.saveUsers(users);

    return newTeams;
  }

  public static disbandTeamsForClass(klubHari: KlubHari): void {
    const existingTeams = this.getTeams().filter(t => t.klub_hari !== klubHari);
    this.saveTeams(existingTeams);

    const users = this.getUsers();
    users.forEach(u => {
      if (u.klub_hari === klubHari) {
        u.id_tim = '';
      }
    });
    this.saveUsers(users);
  }

  public static resetUserProgress(nim: string): boolean {
    const subs = this.getSubmissions().filter(s => s.nim !== nim);
    this.saveSubmissions(subs);

    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.nim === nim);
    if (uIdx !== -1) {
      users[uIdx].total_xp = 0;
      users[uIdx].level = 1;
      users[uIdx].tier_badge = '🌱 Logic Novice';
      users[uIdx].milestones_json = [];
      this.saveUsers(users);

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.nim === nim) {
        this.setCurrentUser(users[uIdx]);
      }
    }
    return true;
  }

  public static resetUserGameSubmission(nim: string, idGame: string): { success: boolean; message: string; updatedUser?: User } {
    const subs = this.getSubmissions();
    const subIdx = subs.findIndex(s => s.nim === nim && s.id_game === idGame);
    if (subIdx === -1) {
      return { success: false, message: `Submisi paket ${idGame} tidak ditemukan untuk mahasiswa ini.` };
    }

    const removedSub = subs.splice(subIdx, 1)[0];
    this.saveSubmissions(subs);

    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.nim === nim);
    let updatedUser: User | undefined;

    if (uIdx !== -1) {
      const currentXp = users[uIdx].total_xp || 0;
      const subXp = removedSub.skor_xp || 0;
      const newXp = Math.max(0, currentXp - subXp);
      const levelInfo = calculateLevelInfo(newXp);

      users[uIdx].total_xp = newXp;
      users[uIdx].level = levelInfo.level;
      users[uIdx].tier_badge = levelInfo.tierBadge;
      this.saveUsers(users);
      updatedUser = users[uIdx];

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.nim === nim) {
        this.setCurrentUser(users[uIdx]);
      }
    }

    return {
      success: true,
      message: `Submisi ${idGame} berhasil di-reset. Mahasiswa kini dapat mengulang kuis tersebut.`,
      updatedUser
    };
  }

  public static updateUserProgressAndGrades(
    nim: string,
    payload: {
      total_xp?: number;
      grades: { id_game: string; nilai_akademik: number; skor_xp: number }[];
    }
  ): { success: boolean; message: string; updatedUser?: User } {
    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.nim === nim);
    if (uIdx === -1) {
      return { success: false, message: 'Mahasiswa tidak ditemukan.' };
    }

    const subs = this.getSubmissions();
    const games = this.getGames();

    payload.grades.forEach(g => {
      const gameDef = games.find(gm => gm.id_game === g.id_game);
      const minPass = gameDef?.min_nilai_lulus || 70;
      const passStatus: PassingStatus = g.nilai_akademik >= minPass ? 'LULUS' : 'BELUM LULUS';

      const existingIdx = subs.findIndex(s => s.nim === nim && s.id_game === g.id_game);
      if (existingIdx !== -1) {
        subs[existingIdx].nilai_akademik = Math.max(0, Math.min(100, Math.round(g.nilai_akademik)));
        subs[existingIdx].skor_xp = Math.max(0, Math.round(g.skor_xp));
        subs[existingIdx].status_lulus = passStatus;
        subs[existingIdx].status_sesi = 'DONE';
        subs[existingIdx].timestamp_update = new Date().toISOString();
      } else {
        const newSub: Submission = {
          id_submission: `SUB-${nim}-${g.id_game}-MANUAL`,
          timestamp_mulai: new Date().toISOString(),
          timestamp_update: new Date().toISOString(),
          nim: nim,
          codename: users[uIdx].codename,
          klub_hari: users[uIdx].klub_hari,
          id_game: g.id_game,
          mode_game: gameDef?.mode_game || 'SOLO',
          id_tim: users[uIdx].id_tim || '',
          skor_xp: Math.max(0, Math.round(g.skor_xp)),
          nilai_akademik: Math.max(0, Math.min(100, Math.round(g.nilai_akademik))),
          jumlah_benar: Math.round((g.nilai_akademik / 100) * (gameDef?.total_soal || 4)),
          total_soal: gameDef?.total_soal || 4,
          status_lulus: passStatus,
          streak_saat_ini: 0,
          tab_switch_count: 0,
          status_sesi: 'DONE',
          detail_jawaban_json: []
        };
        subs.push(newSub);
      }
    });

    this.saveSubmissions(subs);

    const newTotalXp = payload.total_xp !== undefined
      ? Math.max(0, Math.round(payload.total_xp))
      : subs.filter(s => s.nim === nim).reduce((acc, s) => acc + (s.skor_xp || 0), 0);

    const levelInfo = calculateLevelInfo(newTotalXp);
    users[uIdx].total_xp = newTotalXp;
    users[uIdx].level = levelInfo.level;
    users[uIdx].tier_badge = levelInfo.tierBadge;
    this.saveUsers(users);

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.nim === nim) {
      this.setCurrentUser(users[uIdx]);
    }

    return {
      success: true,
      message: `Progres & nilai akademik ${users[uIdx].nama_lengkap} berhasil diperbarui.`,
      updatedUser: users[uIdx]
    };
  }

  public static resetGlobal(): void {
    this.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.removeItem(STORAGE_KEYS.USERS);
    this.removeItem(STORAGE_KEYS.GAMES);
    this.removeItem(STORAGE_KEYS.QUESTIONS);
    this.removeItem(STORAGE_KEYS.SUBMISSIONS);
    this.removeItem(STORAGE_KEYS.TEAMS);
    this.removeItem(STORAGE_KEYS.FIRST_BLOODS);
    this.memoryStore = {};
  }
}

