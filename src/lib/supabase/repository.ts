import {
  Cohort,
  Game,
  GameDifficulty,
  GameMode,
  GameStatus,
  KlubHari,
  PassingStatus,
  Question,
  Submission,
  SubmissionSessionStatus,
  Team,
  User,
  UserRole,
} from '@/types/arena';
import { getSupabaseAdmin } from './admin';
import { hashPassword, isPasswordHashed, verifyPassword } from '@/lib/security/password';

export interface FullArenaDataset {
  cohorts: Cohort[];
  teams: Team[];
  users: User[];
  games: Game[];
  questions: Question[];
  submissions: Submission[];
}

const nullIfEmpty = (val?: string | null): string | null => {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// ============================================================================
// 1. PURE ROW MAPPERS (DOMAIN <-> POSTGRESQL SUPABASE)
// ============================================================================

export function toDbCohortRow(c: Cohort) {
  return {
    id_cohort: c.id_cohort,
    nama_kelas: c.nama_kelas,
    kode_kelas: c.kode_kelas,
    periode: c.periode,
    deskripsi: c.deskripsi ?? null,
    is_active: c.is_active !== false,
    allowed_game_ids: Array.isArray(c.allowed_game_ids) ? c.allowed_game_ids : [],
    created_at: c.created_at || new Date().toISOString(),
  };
}

export function fromDbCohortRow(row: any): Cohort {
  return {
    id_cohort: String(row.id_cohort),
    nama_kelas: String(row.nama_kelas),
    kode_kelas: String(row.kode_kelas),
    periode: String(row.periode),
    deskripsi: row.deskripsi ?? undefined,
    is_active: row.is_active !== false,
    allowed_game_ids: Array.isArray(row.allowed_game_ids) ? row.allowed_game_ids : [],
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
  };
}

export function toDbTeamRow(t: Team) {
  return {
    id_tim: t.id_tim,
    nama_tim: t.nama_tim,
    klub_hari: t.klub_hari || 'ALL',
    id_cohort: nullIfEmpty(t.id_cohort),
    kode_gabung: nullIfEmpty(t.kode_gabung),
    leader_nim: nullIfEmpty(t.leader_nim),
    daftar_nim_json: Array.isArray(t.daftar_nim_json) ? t.daftar_nim_json : [],
    daftar_nama_json: Array.isArray(t.daftar_nama_json) ? t.daftar_nama_json : [],
    total_skor_tim: Number(t.total_skor_tim) || 0,
  };
}

export function fromDbTeamRow(row: any): Team {
  return {
    id_tim: String(row.id_tim),
    nama_tim: String(row.nama_tim),
    klub_hari: (row.klub_hari || 'ALL') as KlubHari,
    id_cohort: row.id_cohort ? String(row.id_cohort) : undefined,
    kode_gabung: row.kode_gabung ? String(row.kode_gabung) : undefined,
    leader_nim: row.leader_nim ? String(row.leader_nim) : undefined,
    daftar_nim_json: Array.isArray(row.daftar_nim_json) ? row.daftar_nim_json : [],
    daftar_nama_json: Array.isArray(row.daftar_nama_json) ? row.daftar_nama_json : [],
    total_skor_tim: Number(row.total_skor_tim) || 0,
  };
}

export function toDbUserRow(u: User, existingPassword?: string) {
  let resolvedPassword: string;
  if (u.password && u.password.trim()) {
    const raw = u.password.trim();
    resolvedPassword = isPasswordHashed(raw) ? raw : hashPassword(raw);
  } else if (existingPassword) {
    resolvedPassword = existingPassword;
  } else {
    resolvedPassword = hashPassword(u.nim);
  }

  return {
    nim: u.nim,
    password: resolvedPassword,
    nama_lengkap: u.nama_lengkap,
    codename: u.codename,
    avatar: u.avatar || 'TH',
    role: u.role || 'PESERTA',
    prodi: u.prodi || 'Sistem Informasi',
    angkatan: Number(u.angkatan) || 2025,
    kelas_reguler: u.kelas_reguler || 'REGULER',
    klub_hari: ['KAMIS', 'JUMAT', 'LOMBA', 'ALL'].includes(u.klub_hari) ? u.klub_hari : 'ALL',
    id_cohort: nullIfEmpty(u.id_cohort),
    periode: u.periode || 'Ganjil 2025',
    total_xp: Number(u.total_xp) || 0,
    level: Number(u.level) || 1,
    tier_badge: u.tier_badge || 'Logic Novice',
    milestones_json: Array.isArray(u.milestones_json) ? u.milestones_json : [],
    id_tim: nullIfEmpty(u.id_tim),
    is_first_login: u.role === 'ADMIN' ? false : u.is_first_login !== false,
    password_changed_at: u.password_changed_at ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function fromDbUserRow(row: any): User {
  return {
    nim: String(row.nim),
    password: row.password ? String(row.password) : undefined,
    nama_lengkap: String(row.nama_lengkap),
    codename: String(row.codename),
    avatar: String(row.avatar || 'TH'),
    role: (row.role || 'PESERTA') as UserRole,
    prodi: String(row.prodi || ''),
    angkatan: Number(row.angkatan) || 2025,
    kelas_reguler: String(row.kelas_reguler || ''),
    klub_hari: (row.klub_hari || 'ALL') as KlubHari,
    id_cohort: row.id_cohort ? String(row.id_cohort) : undefined,
    periode: row.periode ? String(row.periode) : undefined,
    total_xp: Number(row.total_xp) || 0,
    level: Number(row.level) || 1,
    tier_badge: String(row.tier_badge || 'Logic Novice'),
    milestones_json: Array.isArray(row.milestones_json) ? row.milestones_json : [],
    id_tim: row.id_tim ? String(row.id_tim) : '',
    is_first_login: typeof row.is_first_login === 'boolean' ? row.is_first_login : row.role === 'PESERTA',
    password_changed_at: row.password_changed_at ? String(row.password_changed_at) : undefined,
  };
}

export function toDbGameRow(g: Game) {
  return {
    id_game: g.id_game,
    ref_pertemuan: g.ref_pertemuan || 'Pertemuan 1',
    judul_game: g.judul_game,
    kategori_materi: g.kategori_materi || 'Umum',
    kesulitan: g.kesulitan || 'Easy',
    mode_game: g.mode_game || 'SOLO',
    pin_akses: nullIfEmpty(g.pin_akses),
    status_kamis: g.status_kamis || 'UPCOMING',
    status_jumat: g.status_jumat || 'UPCOMING',
    status_lomba: g.status_lomba || 'UPCOMING',
    cohort_statuses: g.cohort_statuses && typeof g.cohort_statuses === 'object' ? g.cohort_statuses : {},
    durasi_total_menit: Number(g.durasi_total_menit) || 20,
    durasi_per_soal_detik: Number(g.durasi_per_soal_detik) || 60,
    min_nilai_lulus: Number(g.min_nilai_lulus) || 70,
  };
}

export function fromDbGameRow(row: any): Game {
  return {
    id_game: String(row.id_game),
    ref_pertemuan: String(row.ref_pertemuan || ''),
    judul_game: String(row.judul_game),
    kategori_materi: String(row.kategori_materi || ''),
    kesulitan: (row.kesulitan || 'Easy') as GameDifficulty,
    mode_game: (row.mode_game || 'SOLO') as GameMode,
    pin_akses: row.pin_akses ? String(row.pin_akses) : undefined,
    status_kamis: (row.status_kamis || 'UPCOMING') as GameStatus,
    status_jumat: (row.status_jumat || 'UPCOMING') as GameStatus,
    status_lomba: (row.status_lomba || 'UPCOMING') as GameStatus,
    cohort_statuses: row.cohort_statuses && typeof row.cohort_statuses === 'object' ? row.cohort_statuses : {},
    durasi_total_menit: Number(row.durasi_total_menit) || 20,
    durasi_per_soal_detik: Number(row.durasi_per_soal_detik) || 60,
    min_nilai_lulus: Number(row.min_nilai_lulus) || 70,
  };
}

export function toDbQuestionRow(q: Question) {
  return {
    id_soal: q.id_soal,
    id_game: q.id_game,
    judul: q.judul,
    narasi_soal: q.narasi_soal,
    cuplikan_kode: q.cuplikan_kode ?? null,
    opsi_jawaban: q.opsi_jawaban ?? null,
    kunci_jawaban: q.kunci_jawaban ?? '',
    teks_hint: q.teks_hint ?? null,
    editorial: q.editorial ?? '',
    poin_dasar: Number(q.poin_dasar) || 50,
    first_blood_by: nullIfEmpty(q.first_blood_by),
  };
}

export function fromDbQuestionRow(row: any): Question {
  return {
    id_soal: String(row.id_soal),
    id_game: String(row.id_game),
    judul: String(row.judul),
    narasi_soal: String(row.narasi_soal),
    cuplikan_kode: row.cuplikan_kode ?? undefined,
    opsi_jawaban: row.opsi_jawaban ?? undefined,
    kunci_jawaban: row.kunci_jawaban !== undefined ? String(row.kunci_jawaban) : undefined,
    teks_hint: row.teks_hint ?? undefined,
    editorial: row.editorial !== undefined ? String(row.editorial) : undefined,
    poin_dasar: Number(row.poin_dasar) || 50,
    first_blood_by: row.first_blood_by ?? undefined,
  };
}

export function toDbSubmissionRow(s: Submission) {
  return {
    id_submission: s.id_submission,
    timestamp_mulai: s.timestamp_mulai || new Date().toISOString(),
    timestamp_update: s.timestamp_update || new Date().toISOString(),
    nim: s.nim,
    codename: s.codename,
    klub_hari: s.klub_hari || 'ALL',
    id_game: s.id_game,
    mode_game: s.mode_game || 'SOLO',
    id_tim: nullIfEmpty(s.id_tim),
    skor_xp: Number(s.skor_xp) || 0,
    nilai_akademik: Number(s.nilai_akademik) || 0,
    jumlah_benar: Number(s.jumlah_benar) || 0,
    total_soal: Number(s.total_soal) || 0,
    status_lulus: s.status_lulus || 'BELUM LULUS',
    streak_saat_ini: Number(s.streak_saat_ini) || 0,
    tab_switch_count: Number(s.tab_switch_count) || 0,
    tab_switch_log: Array.isArray(s.tab_switch_log) ? s.tab_switch_log : [],
    shuffled_question_ids: Array.isArray(s.shuffled_question_ids) ? s.shuffled_question_ids : [],
    status_sesi: s.status_sesi || 'ACTIVE',
    detail_jawaban_json: Array.isArray(s.detail_jawaban_json) ? s.detail_jawaban_json : [],
  };
}

export function fromDbSubmissionRow(row: any): Submission {
  return {
    id_submission: String(row.id_submission),
    timestamp_mulai: String(row.timestamp_mulai),
    timestamp_update: String(row.timestamp_update),
    nim: String(row.nim),
    codename: String(row.codename),
    klub_hari: (row.klub_hari || 'ALL') as KlubHari,
    id_game: String(row.id_game),
    mode_game: (row.mode_game || 'SOLO') as GameMode,
    id_tim: row.id_tim ? String(row.id_tim) : '',
    skor_xp: Number(row.skor_xp) || 0,
    nilai_akademik: Number(row.nilai_akademik) || 0,
    jumlah_benar: Number(row.jumlah_benar) || 0,
    total_soal: Number(row.total_soal) || 0,
    status_lulus: (row.status_lulus || 'BELUM LULUS') as PassingStatus,
    streak_saat_ini: Number(row.streak_saat_ini) || 0,
    tab_switch_count: Number(row.tab_switch_count) || 0,
    tab_switch_log: Array.isArray(row.tab_switch_log) ? row.tab_switch_log : [],
    shuffled_question_ids: Array.isArray(row.shuffled_question_ids) ? row.shuffled_question_ids : [],
    status_sesi: (row.status_sesi || 'ACTIVE') as SubmissionSessionStatus,
    detail_jawaban_json: Array.isArray(row.detail_jawaban_json) ? row.detail_jawaban_json : [],
  };
}

// ============================================================================
// 2. ANTI-CHEAT & PRIVACY SANITIZER FOR STUDENT SYNC PAYLOAD
// ============================================================================

export function sanitizeDatasetForStudent(
  dataset: FullArenaDataset,
  studentNim?: string
): FullArenaDataset {
  const cleanNim = (studentNim || '').trim().toUpperCase();

  // Temukan profil & kohort mahasiswa untuk isolasi ketat lintas kelas (SSOT: cohort.allowed_game_ids)
  const student = dataset.users.find((u) => u.nim.toUpperCase() === cleanNim);
  const studentCohort = student?.id_cohort
    ? dataset.cohorts.find(
        (c) => c.id_cohort === student.id_cohort || c.kode_kelas === student.id_cohort
      )
    : student?.klub_hari && student.klub_hari !== 'ALL'
      ? dataset.cohorts.find(
          (c) =>
            c.kode_kelas.toUpperCase() === student.klub_hari.toUpperCase() ||
            c.id_cohort === `c-${student.klub_hari.toLowerCase()}`
        )
      : undefined;

  // Game yang sudah selesai dikerjakan (DONE) oleh mahasiswa ini
  const finishedGameIds = new Set(
    dataset.submissions
      .filter((s) => s.nim.toUpperCase() === cleanNim && s.status_sesi === 'DONE')
      .map((s) => s.id_game)
  );

  // Isolasi Paket Soal Tingkat Server (Single Source of Truth: cohort.allowed_game_ids)
  // Field cohort_statuses TIDAK PERNAH memberikan izin akses, mencegah kebocoran pasca-unassign.
  let filteredGames: Game[] = [];
  let allowedGameIdSet: Set<string> = new Set();
  if (studentCohort) {
    const allowedIds = new Set(
      Array.isArray(studentCohort.allowed_game_ids) ? studentCohort.allowed_game_ids : []
    );
    filteredGames = dataset.games.filter((g) => allowedIds.has(g.id_game));
    allowedGameIdSet = new Set(filteredGames.map((g) => g.id_game));
  } else if (!student) {
    // Jika identitas mahasiswa tidak ditemukan dalam dataset, blokir seluruh paket soal
    filteredGames = [];
    allowedGameIdSet = new Set();
  } else {
    // Mahasiswa tanpa kelas (unassigned) tidak boleh melihat paket soal kelas mana pun
    filteredGames = [];
    allowedGameIdSet = new Set();
  }

  // Strip password seluruh user (Zero Password Exposure)
  const sanitizedUsers = dataset.users.map((u) => ({
    ...u,
    password: undefined,
  }));

  // Isolasi soal ke game yang diizinkan + strip kunci_jawaban & editorial kecuali game DONE
  const visibleQuestions = allowedGameIdSet
    ? dataset.questions.filter(
        (q) => allowedGameIdSet!.has(q.id_game) || finishedGameIds.has(q.id_game)
      )
    : dataset.questions;

  const sanitizedQuestions = visibleQuestions.map((q) => {
    if (finishedGameIds.has(q.id_game)) {
      return q;
    }
    return {
      ...q,
      kunci_jawaban: undefined,
      editorial: undefined,
    };
  });

  return {
    ...dataset,
    games: filteredGames,
    users: sanitizedUsers,
    questions: sanitizedQuestions,
  };
}

// ============================================================================
// 3. SUPABASE LIVE REPOSITORY OPERATIONS
// ============================================================================

export class SupabaseArenaRepo {
  public static async fetchAllState(options?: {
    role?: UserRole;
    nim?: string;
  }): Promise<FullArenaDataset | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const [cohortsRes, teamsRes, usersRes, gamesRes, questionsRes, submissionsRes] =
      await Promise.all([
        sb.from('cohorts').select('*').order('created_at', { ascending: true }),
        sb.from('teams').select('*').order('created_at', { ascending: true }),
        sb.from('users').select('*').order('total_xp', { ascending: false }),
        sb.from('games').select('*').order('created_at', { ascending: true }),
        sb.from('questions').select('*').order('created_at', { ascending: true }),
        sb.from('submissions').select('*').order('timestamp_update', { ascending: false }),
      ]);

    const firstError =
      cohortsRes.error ||
      teamsRes.error ||
      usersRes.error ||
      gamesRes.error ||
      questionsRes.error ||
      submissionsRes.error;

    if (firstError) {
      throw new Error(`Supabase fetchAllState gagal: ${firstError.message}`);
    }

    const fullDataset: FullArenaDataset = {
      cohorts: (cohortsRes.data || []).map(fromDbCohortRow),
      teams: (teamsRes.data || []).map(fromDbTeamRow),
      // Zero Password Exposure: password/hash TIDAK PERNAH dikirim ke browser (termasuk untuk ADMIN)
      users: (usersRes.data || []).map((row) => ({
        ...fromDbUserRow(row),
        password: undefined,
      })),
      games: (gamesRes.data || []).map(fromDbGameRow),
      questions: (questionsRes.data || []).map(fromDbQuestionRow),
      submissions: (submissionsRes.data || []).map(fromDbSubmissionRow),
    };

    if (options?.role !== 'ADMIN') {
      return sanitizeDatasetForStudent(fullDataset, options?.nim);
    }

    return fullDataset;
  }

  public static async syncCohorts(cohorts: Cohort[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    const rows = cohorts.map(toDbCohortRow);
    if (rows.length > 0) {
      const { error } = await sb.from('cohorts').upsert(rows, { onConflict: 'id_cohort' });
      if (error) throw new Error(`Gagal upsert cohorts: ${error.message}`);
    }

    // Hapus kohort yang telah dihapus oleh Admin
    const { data: existing } = await sb.from('cohorts').select('id_cohort');
    const keepIds = new Set(cohorts.map((c) => c.id_cohort));
    const toDelete = (existing || [])
      .map((r: any) => String(r.id_cohort))
      .filter((id) => !keepIds.has(id));

    if (toDelete.length > 0) {
      const { error } = await sb.from('cohorts').delete().in('id_cohort', toDelete);
      if (error) throw new Error(`Gagal menghapus cohorts: ${error.message}`);
    }

    return rows.length;
  }

  public static async syncTeams(teams: Team[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    const rows = teams.map(toDbTeamRow);
    if (rows.length > 0) {
      const { error } = await sb.from('teams').upsert(rows, { onConflict: 'id_tim' });
      if (error) throw new Error(`Gagal upsert teams: ${error.message}`);
    }

    const { data: existing } = await sb.from('teams').select('id_tim');
    const keepIds = new Set(teams.map((t) => t.id_tim));
    const toDelete = (existing || [])
      .map((r: any) => String(r.id_tim))
      .filter((id) => !keepIds.has(id));

    if (toDelete.length > 0) {
      const { error } = await sb.from('teams').delete().in('id_tim', toDelete);
      if (error) throw new Error(`Gagal menghapus teams: ${error.message}`);
    }

    return rows.length;
  }

  public static async syncUsers(users: User[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    // Ambil password eksisting agar sync dari payload tanpa password tidak menimpa password asli
    const { data: existingRows } = await sb.from('users').select('nim, password, role');
    const passwordMap = new Map<string, string>();
    (existingRows || []).forEach((r: any) => {
      passwordMap.set(String(r.nim).toUpperCase(), String(r.password));
    });

    const rows = users.map((u) => toDbUserRow(u, passwordMap.get(u.nim.toUpperCase())));
    if (rows.length > 0) {
      const { error } = await sb.from('users').upsert(rows, { onConflict: 'nim' });
      if (error) throw new Error(`Gagal upsert users: ${error.message}`);
    }

    const keepNims = new Set(users.map((u) => u.nim));
    const toDelete = (existingRows || [])
      .filter((r: any) => !keepNims.has(String(r.nim)) && r.role !== 'ADMIN' && String(r.nim) !== 'ADMIN' && String(r.nim) !== 'DOSEN001')
      .map((r: any) => String(r.nim));

    if (toDelete.length > 0) {
      const { error } = await sb.from('users').delete().in('nim', toDelete);
      if (error) throw new Error(`Gagal menghapus users: ${error.message}`);
    }

    return rows.length;
  }

  public static async syncGames(games: Game[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    const rows = games.map(toDbGameRow);
    if (rows.length > 0) {
      const { error } = await sb.from('games').upsert(rows, { onConflict: 'id_game' });
      if (error) throw new Error(`Gagal upsert games: ${error.message}`);
    }

    const { data: existing } = await sb.from('games').select('id_game');
    const keepIds = new Set(games.map((g) => g.id_game));
    const toDelete = (existing || [])
      .map((r: any) => String(r.id_game))
      .filter((id) => !keepIds.has(id));

    if (toDelete.length > 0) {
      const { error } = await sb.from('games').delete().in('id_game', toDelete);
      if (error) throw new Error(`Gagal menghapus games: ${error.message}`);
    }

    return rows.length;
  }

  public static async syncQuestions(questions: Question[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    // Pastikan tidak menimpa kunci_jawaban/editorial yang ter-strip jika payload datang dari non-admin
    const { data: existingRows } = await sb
      .from('questions')
      .select('id_soal, kunci_jawaban, editorial');
    const secretMap = new Map<string, { kunci_jawaban: string; editorial: string }>();
    (existingRows || []).forEach((r: any) => {
      secretMap.set(String(r.id_soal), {
        kunci_jawaban: String(r.kunci_jawaban || ''),
        editorial: String(r.editorial || ''),
      });
    });

    const rows = questions.map((q) => {
      const secret = secretMap.get(q.id_soal);
      return toDbQuestionRow({
        ...q,
        kunci_jawaban: q.kunci_jawaban !== undefined ? q.kunci_jawaban : (secret?.kunci_jawaban || ''),
        editorial: q.editorial !== undefined ? q.editorial : (secret?.editorial || ''),
      });
    });

    if (rows.length > 0) {
      const { error } = await sb.from('questions').upsert(rows, { onConflict: 'id_soal' });
      if (error) throw new Error(`Gagal upsert questions: ${error.message}`);
    }

    const keepIds = new Set(questions.map((q) => q.id_soal));
    const toDelete = (existingRows || [])
      .map((r: any) => String(r.id_soal))
      .filter((id) => !keepIds.has(id));

    if (toDelete.length > 0) {
      const { error } = await sb.from('questions').delete().in('id_soal', toDelete);
      if (error) throw new Error(`Gagal menghapus questions: ${error.message}`);
    }

    return rows.length;
  }

  public static async syncSubmissions(
    submissions: Submission[],
    options?: { deleteMissing?: boolean }
  ): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    const rows = submissions.map(toDbSubmissionRow);
    if (rows.length > 0) {
      const { error } = await sb
        .from('submissions')
        .upsert(rows, { onConflict: 'id_submission' });
      if (error) throw new Error(`Gagal upsert submissions: ${error.message}`);
    }

    // Jika dipanggil oleh ADMIN (misal Reset Submisi / Reset Progres), hapus baris yang telah dibuang (Anti-Zombie Submission)
    if (options?.deleteMissing) {
      const { data: existing } = await sb.from('submissions').select('id_submission');
      const keepIds = new Set(submissions.map((s) => s.id_submission));
      const toDelete = (existing || [])
        .map((r: any) => String(r.id_submission))
        .filter((id) => !keepIds.has(id));

      if (toDelete.length > 0) {
        const { error } = await sb.from('submissions').delete().in('id_submission', toDelete);
        if (error) throw new Error(`Gagal menghapus submissions usang: ${error.message}`);
      }
    }

    return rows.length;
  }

  /**
   * Anti-Cheat: Mahasiswa hanya diizinkan membuat baris sesi ACTIVE baru dengan nilai awal 0
   * apabila id_submission belum ada di database (ignoreDuplicates: true — tidak dapat menimpa nilai/status).
   */
  public static async createActiveSubmissionsIfAbsent(submissions: Submission[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb || submissions.length === 0) return 0;

    const sanitizedRows = submissions.map((s) =>
      toDbSubmissionRow({
        ...s,
        skor_xp: 0,
        nilai_akademik: 0,
        jumlah_benar: 0,
        status_lulus: 'BELUM LULUS',
        streak_saat_ini: 0,
        tab_switch_count: 0,
        tab_switch_log: [],
        status_sesi: 'ACTIVE',
        detail_jawaban_json: [],
      })
    );

    const { error } = await sb
      .from('submissions')
      .upsert(sanitizedRows, { onConflict: 'id_submission', ignoreDuplicates: true });
    if (error) throw new Error(`Gagal menginisialisasi sesi submisi baru: ${error.message}`);
    return sanitizedRows.length;
  }

  public static async getSubmissionByUserAndGame(nim: string, idGame: string): Promise<Submission | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const { data, error } = await sb
      .from('submissions')
      .select('*')
      .ilike('nim', nim.trim())
      .eq('id_game', idGame)
      .order('timestamp_mulai', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return fromDbSubmissionRow(data);
  }

  public static async getCohortById(idCohortOrCode: string): Promise<Cohort | null> {
    const sb = getSupabaseAdmin();
    if (!sb || !idCohortOrCode) return null;

    const { data, error } = await sb
      .from('cohorts')
      .select('*')
      .or(`id_cohort.eq.${idCohortOrCode},kode_kelas.eq.${idCohortOrCode}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return fromDbCohortRow(data);
  }

  public static async getQuestionsByGameId(idGame: string): Promise<Question[]> {
    const sb = getSupabaseAdmin();
    if (!sb) return [];

    const { data, error } = await sb
      .from('questions')
      .select('*')
      .eq('id_game', idGame)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map(fromDbQuestionRow);
  }

  public static async getUserByNim(nim: string): Promise<User | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const { data, error } = await sb
      .from('users')
      .select('*')
      .ilike('nim', nim.trim())
      .maybeSingle();

    if (error || !data) return null;
    return fromDbUserRow(data);
  }

  public static async authenticateUser(
    nim: string,
    pass: string
  ): Promise<{ success: boolean; user?: User; message?: string; requiresOnboarding?: boolean } | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const cleanNim = nim.trim().toUpperCase();
    const cleanPass = pass.trim();

    const user = await this.getUserByNim(cleanNim);
    if (!user) {
      return { success: false, message: 'NIM atau Akun tidak terdaftar di database STMIK TIME!' };
    }

    const expectedPass = user.password || user.nim;
    const verification = verifyPassword(cleanPass, expectedPass);
    if (!verification.valid) {
      return { success: false, message: 'Kata sandi salah! Periksa kembali kredensial Anda.' };
    }

    // Lazy Migration: upgrade otomatis kata sandi plain-text legacy ke salted scrypt hash
    if (verification.needsRehash) {
      const hashed = hashPassword(cleanPass);
      await sb
        .from('users')
        .update({ password: hashed, updated_at: new Date().toISOString() })
        .eq('nim', user.nim);
    }

    const isDefaultPass = !user.password || verifyPassword(user.nim, expectedPass).valid;
    const requiresOnboarding = user.role === 'PESERTA' && (isDefaultPass || user.is_first_login !== false);

    return {
      success: true,
      user: { ...user, password: undefined },
      requiresOnboarding,
    };
  }

  public static async updateUserCredentials(params: {
    nim: string;
    oldPassword?: string;
    newPassword: string;
    codename?: string;
    avatar?: string;
    verifyOldPassword: boolean;
  }): Promise<{ success: boolean; message: string; user?: User } | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const cleanNim = params.nim.trim().toUpperCase();
    const user = await this.getUserByNim(cleanNim);
    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan di database.' };
    }

    if (params.verifyOldPassword) {
      const expectedOld = user.password || user.nim;
      const checkOld = verifyPassword(params.oldPassword || '', expectedOld);
      if (!checkOld.valid) {
        return { success: false, message: 'Kata sandi saat ini yang Anda masukkan tidak sesuai.' };
      }
    }

    const trimmedNew = params.newPassword.trim();
    if (trimmedNew.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
    }
    if (trimmedNew.toUpperCase() === cleanNim) {
      return { success: false, message: 'Kata sandi baru tidak boleh sama dengan NIM Anda demi keamanan!' };
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      password: hashPassword(trimmedNew),
      is_first_login: false,
      password_changed_at: now,
      updated_at: now,
    };

    if (params.codename && params.codename.trim().length >= 3) {
      updates.codename = params.codename.trim();
    }
    if (params.avatar && params.avatar.trim()) {
      updates.avatar = params.avatar.trim();
    }

    const { data, error } = await sb
      .from('users')
      .update(updates)
      .eq('nim', user.nim)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, message: `Gagal memperbarui database: ${error?.message || 'Unknown error'}` };
    }

    const updated = fromDbUserRow(data);
    return {
      success: true,
      message: params.verifyOldPassword
        ? 'Kata sandi berhasil diperbarui dengan aman di database.'
        : 'Inisialisasi akun & pembaruan kata sandi berhasil! Selamat datang di Arena.',
      user: { ...updated, password: undefined },
    };
  }

  public static async adminResetUserPassword(
    nim: string
  ): Promise<{ success: boolean; message: string; user?: User } | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const cleanNim = nim.trim().toUpperCase();
    const user = await this.getUserByNim(cleanNim);
    if (!user) {
      return { success: false, message: `Akun dengan NIM ${cleanNim} tidak ditemukan di database.` };
    }

    const now = new Date().toISOString();
    const { data, error } = await sb
      .from('users')
      .update({
        password: hashPassword(user.nim),
        is_first_login: user.role === 'PESERTA',
        password_changed_at: null,
        updated_at: now,
      })
      .eq('nim', user.nim)
      .select('*')
      .single();

    if (error || !data) {
      return {
        success: false,
        message: `Gagal mereset kata sandi di database: ${error?.message || 'Unknown error'}`,
      };
    }

    const updated = fromDbUserRow(data);
    return {
      success: true,
      message: `Kata sandi ${updated.nama_lengkap} (${updated.nim}) berhasil direset kembali ke NIM. Mahasiswa akan diminta mengganti sandi saat login berikutnya.`,
      user: { ...updated, password: undefined },
    };
  }

  public static async getSubmissionById(idSubmission: string): Promise<Submission | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const { data, error } = await sb
      .from('submissions')
      .select('*')
      .eq('id_submission', idSubmission)
      .maybeSingle();

    if (error || !data) return null;
    return fromDbSubmissionRow(data);
  }

  public static async upsertSubmission(sub: Submission): Promise<Submission | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const { data, error } = await sb
      .from('submissions')
      .upsert(toDbSubmissionRow(sub), { onConflict: 'id_submission' })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Gagal menyimpan submission ke Supabase: ${error?.message || 'Unknown'}`);
    }
    return fromDbSubmissionRow(data);
  }

  public static async getQuestionById(idSoal: string): Promise<Question | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const { data, error } = await sb
      .from('questions')
      .select('*')
      .eq('id_soal', idSoal)
      .maybeSingle();

    if (error || !data) return null;
    return fromDbQuestionRow(data);
  }

  public static async getGameById(idGame: string): Promise<Game | null> {
    const sb = getSupabaseAdmin();
    if (!sb) return null;

    const { data, error } = await sb
      .from('games')
      .select('*')
      .eq('id_game', idGame)
      .maybeSingle();

    if (error || !data) return null;
    return fromDbGameRow(data);
  }

  public static async setQuestionFirstBlood(idSoal: string, codename: string): Promise<void> {
    const sb = getSupabaseAdmin();
    if (!sb) return;
    await sb
      .from('questions')
      .update({ first_blood_by: codename })
      .eq('id_soal', idSoal)
      .is('first_blood_by', null);
  }

  public static async updateUserXPAndMilestones(
    nim: string,
    updates: { total_xp: number; level: number; tier_badge: string; milestones_json: string[] }
  ): Promise<void> {
    const sb = getSupabaseAdmin();
    if (!sb) return;
    await sb
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('nim', nim);
  }

  public static async updateSingleUserProfile(
    nim: string,
    updates: { codename?: string; avatar?: string; id_tim?: string | null }
  ): Promise<boolean> {
    const sb = getSupabaseAdmin();
    if (!sb) return false;

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.codename !== undefined) payload.codename = updates.codename;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    if (updates.id_tim !== undefined) payload.id_tim = nullIfEmpty(updates.id_tim);

    const { error } = await sb.from('users').update(payload).eq('nim', nim);
    if (error) throw new Error(`Gagal memperbarui profil user: ${error.message}`);
    return true;
  }

  public static async upsertTeamsNonDestructive(teams: Team[]): Promise<number> {
    const sb = getSupabaseAdmin();
    if (!sb || teams.length === 0) return 0;

    const rows = teams.map(toDbTeamRow);
    const { error } = await sb.from('teams').upsert(rows, { onConflict: 'id_tim' });
    if (error) throw new Error(`Gagal upsert tim peserta: ${error.message}`);
    return rows.length;
  }

  public static async resetAllTransactionalData(): Promise<boolean> {
    const sb = getSupabaseAdmin();
    if (!sb) return false;

    await sb.from('submissions').delete().neq('id_submission', '');
    await sb.from('teams').delete().neq('id_tim', '');
    await sb
      .from('users')
      .update({ total_xp: 0, level: 1, tier_badge: 'Logic Novice', milestones_json: [], id_tim: null })
      .eq('role', 'PESERTA');
    return true;
  }
}
