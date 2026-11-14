'use client';

import {
  User,
  Game,
  Question,
  Submission,
  Team,
  TeamMemberInfo,
  FirstBloodAnnouncement,
  LeaderboardPlayer,
  KlubHari,
  GameStatus,
  ICPCScoreboardRow,
  ICPCProblemStatus,
  ICPC_PROBLEMS_DEF
} from '@/types/arena';
import {
  INITIAL_USERS,
  INITIAL_GAMES,
  INITIAL_QUESTIONS,
  INITIAL_SUBMISSIONS,
  FIRST_BLOOD_TICKER_DATA,
  INITIAL_TEAMS
} from './seed-data';
import { calculateAcademicGrade, calculateQuestionXP, calculateLevelInfo, generateSnakeDraftTeams } from './gamification';

const STORAGE_KEYS = {
  CURRENT_USER: 'cparena_current_user',
  USERS: 'cparena_users_v2',
  GAMES: 'cparena_games_v2',
  QUESTIONS: 'cparena_questions_v2',
  SUBMISSIONS: 'cparena_submissions_v2',
  TEAMS: 'cparena_teams_v2',
  FIRST_BLOODS: 'cparena_first_bloods_v2'
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

  public static getGames(): Game[] {
    const raw = this.getItem(STORAGE_KEYS.GAMES);
    if (!raw) {
      this.setItem(STORAGE_KEYS.GAMES, JSON.stringify(INITIAL_GAMES));
      return INITIAL_GAMES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GAMES;
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

  public static getSubmissions(): Submission[] {
    const raw = this.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      this.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  }

  public static saveSubmissions(submissions: Submission[]): void {
    this.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
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

  // --- LEADERBOARD BUILDERS ---
  public static getLeaderboardPlayers(klubFilter: 'KAMIS' | 'JUMAT' | 'ALL' = 'KAMIS'): LeaderboardPlayer[] {
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
    klubFilter: 'KAMIS' | 'JUMAT' | 'ALL' = 'KAMIS',
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

  public static startQuizSession(user: User, game: Game): Submission {
    const existing = this.getSubmissionForGame(user.nim, game.id_game);
    if (existing) return existing;

    const questions = this.getQuestions().filter(q => q.id_game === game.id_game);
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
      detail_jawaban_json: []
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
  public static updateGameStatus(idGame: string, statusKamis: GameStatus, statusJumat: GameStatus): boolean {
    const games = this.getGames();
    const idx = games.findIndex(g => g.id_game === idGame);
    if (idx === -1) return false;

    games[idx].status_kamis = statusKamis;
    games[idx].status_jumat = statusJumat;
    this.saveGames(games);
    return true;
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

