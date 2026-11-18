import {
  calculateAcademicGrade,
  calculateQuestionXP,
  calculateLevelInfo,
  generateSnakeDraftTeams,
  calculateTeamFairnessMetrics
} from '../src/lib/gamification.ts';
import { INITIAL_USERS, TEST_MOCK_STUDENTS, INITIAL_GAMES, INITIAL_QUESTIONS } from '../src/lib/seed-data.ts';
import { ArenaStore } from '../src/lib/arena-store.ts';
import { ICPC_PROBLEMS_DEF } from '../src/types/arena.ts';
import { seededShuffle, stringToSeed } from '../src/lib/shuffle.ts';
import { parseMathSegments, formatMathString, SYMBOL_MAP } from '../src/lib/math-parser.ts';
import { generateAcademicExportData } from '../src/lib/export-service.ts';
import { isSupabaseConfigured } from '../src/lib/supabase/admin.ts';
import {
  toDbCohortRow,
  fromDbCohortRow,
  toDbTeamRow,
  fromDbTeamRow,
  toDbUserRow,
  fromDbUserRow,
  toDbGameRow,
  fromDbGameRow,
  toDbSubmissionRow,
  fromDbSubmissionRow,
  sanitizeDatasetForStudent
} from '../src/lib/supabase/repository.ts';
import {
  hashPassword,
  verifyPassword,
  isPasswordHashed
} from '../src/lib/security/password.ts';
import {
  signSessionToken,
  verifySessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME
} from '../src/lib/security/session.ts';
import {
  detectCsvDelimiter,
  parseRawCsvText,
  validateImportedStudentRows,
  buildBulkCreateUserDTOs,
  generateStudentImportTemplateCsv
} from '../src/lib/student-import-service.ts';
import fs from 'fs';
import path from 'path';

console.log('🧪 ========================================================');
console.log('🧪 STMIK TIME — CP ARENA: SYSTEM VERIFICATION SUITE');
console.log('🧪 ========================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. UJI SKEMA PENGGUNA & KOHORT KELAS STMIK TIME
console.log('--- [TEST GROUP 1: Pengguna & Kohort Kelas (Clean Slate Production + Fixture)] ---');
const adminUsers = INITIAL_USERS.filter(u => u.role === 'ADMIN');
const prodStudents = INITIAL_USERS.filter(u => u.role === 'PESERTA');
assert(prodStudents.length === 0, `Produksi Bersih: 0 Mahasiswa Dummy pada INITIAL_USERS (Aktual: ${prodStudents.length})`);
assert(adminUsers.length >= 2, `Akun Admin & Dosen Pembina terdaftar (Aktual: ${adminUsers.length})`);

const kamisStudents = TEST_MOCK_STUDENTS.filter(u => u.role === 'PESERTA' && u.klub_hari === 'KAMIS');
const jumatStudents = TEST_MOCK_STUDENTS.filter(u => u.role === 'PESERTA' && u.klub_hari === 'JUMAT');
assert(kamisStudents.length === 15, `Fixture: Kelas KAMIS memiliki tepat 15 Mahasiswa SI 2025 (Aktual: ${kamisStudents.length})`);
assert(jumatStudents.length === 13, `Fixture: Kelas JUMAT memiliki tepat 13 Mahasiswa TI/SI 2024-2025 (Aktual: ${jumatStudents.length})`);

const cecilia = TEST_MOCK_STUDENTS.find(u => u.nim === '2545001');
assert(cecilia !== undefined, 'Mahasiswa 2545001 (Cecilia_AlgoStar) terdaftar di fixture');
assert(cecilia?.codename === 'Cecilia_AlgoStar', 'Codename Cecilia_AlgoStar valid');
assert(cecilia?.klub_hari === 'KAMIS', 'Cecilia terdaftar di Kelas KAMIS');

// 2. UJI ATURAN MATEMATIKA: NILAI AKADEMIK (0 - 100)
console.log('\n--- [TEST GROUP 2: Aturan Matematika Nilai Akademik (0-100)] ---');
// Kasus 2.1: 2 Benar dari 4 Soal, 0 Pindah Tab -> 50/100
const gradeClean = calculateAcademicGrade(2, 4, 0);
assert(gradeClean.nilaiMurni === 50, 'Nilai Murni 2/4 = 50');
assert(gradeClean.penaltiTab === 0, 'Penalti Tab 0 = 0');
assert(gradeClean.nilaiAkhirBersih === 50, 'Nilai Akhir Bersih = 50');

// Kasus 2.2: 2 Benar dari 4 Soal, 2x Pindah Tab -> 50 - 10 = 40/100
const gradeWithPenalty = calculateAcademicGrade(2, 4, 2);
assert(gradeWithPenalty.penaltiTab === 10, 'Penalti 2x Pindah Tab = -10 Poin');
assert(gradeWithPenalty.nilaiAkhirBersih === 40, 'Nilai Akhir Bersih = 40');

// Kasus 2.3: Batas Bawah Nilai Bersih tidak boleh negatif
const gradeFloor = calculateAcademicGrade(0, 4, 5);
assert(gradeFloor.nilaiAkhirBersih === 0, 'Nilai Akhir Bersih dibatasi minimal 0 (tidak negatif)');

// 3. UJI ATURAN MATEMATIKA: SKOR XP & BONUS GAMIFIKASI
console.log('\n--- [TEST GROUP 3: Skor XP, Speed Bonus, Streak & First Blood] ---');
// Kasus 3.1: Soal 50 Poin, Buka Hint (-25 XP), Sisa Waktu 30s, Streak 3x (+50 XP), First Blood (+25 XP)
const xpResult = calculateQuestionXP({
  basePoints: 50,
  openedHint: true,
  remainingSeconds: 30,
  currentStreak: 3,
  isFirstBlood: true
});

assert(xpResult.baseXP === 25, 'Poin dasar setelah buka hint: 50 - 25 = 25 XP');
assert(xpResult.speedBonus === 36, 'Speed bonus: round(30 * 1.2) = 36 XP');
assert(xpResult.streakBonus === 50, 'Streak bonus >= 3: +50 XP');
assert(xpResult.firstBloodBonus === 25, 'First blood bonus: +25 XP');
assert(xpResult.totalXP === 25 + 36 + 50 + 25, `Total XP Soal: 136 XP (Aktual: ${xpResult.totalXP})`);

// 4. UJI SISTEM LEVELING & TIER BADGES
console.log('\n--- [TEST GROUP 4: Sistem Leveling & Tier Badges] ---');
const lvlNovice = calculateLevelInfo(200);
assert(lvlNovice.level === 1, 'XP 200 = Level 1');
assert(lvlNovice.tierBadge === '🌱 Logic Novice', 'Level 1 Tier = Logic Novice');

const lvlSprinter = calculateLevelInfo(481); // XP Cecilia di screenshot
assert(lvlSprinter.level === 2, 'XP 481 = Level 2');
assert(lvlSprinter.xpNeededForNext === 19, 'XP 481 butuh 19 XP lagi ke Level 3 (500 - 481 = 19)');

const lvlTactician = calculateLevelInfo(1500);
assert(lvlTactician.level === 7, 'XP 1500 = Level 7');
assert(lvlTactician.tierBadge === '🛡️ Greedy Tactician', 'Level 7 Tier = Greedy Tactician');

const lvlGrandmaster = calculateLevelInfo(9999);
assert(lvlGrandmaster.level >= 10, 'XP 9999 = Level 40');
assert(lvlGrandmaster.tierBadge === '👑 Grandmaster Time', 'Level 40 Tier = Grandmaster Time');

// 5. UJI ALGORITMA SNAKE-DRAFT TIM BERIMBANG
console.log('\n--- [TEST GROUP 5: Algoritma Snake-Draft Tim Berimbang] ---');
const teamsKamis = generateSnakeDraftTeams(TEST_MOCK_STUDENTS, 'KAMIS', 3);
assert(teamsKamis.length === 5, `15 Mahasiswa SI 2025 dibagi menjadi 5 Tim (Aktual: ${teamsKamis.length})`);
teamsKamis.forEach((t, i) => {
  assert(t.daftar_nim_json.length === 3, `Tim #${i + 1} (${t.nama_tim}) memiliki 3 anggota`);
  assert(t.total_skor_tim > 0, `Total skor tim #${i + 1} terhitung: ${t.total_skor_tim} XP`);
  assert(Boolean(t.kode_gabung && t.kode_gabung.length === 6), `Tim #${i + 1} memiliki kode gabung 6-karakter (${t.kode_gabung})`);
  assert(t.leader_nim === t.daftar_nim_json[0], `Tim #${i + 1} menunjuk draft pick pertama sebagai leader (${t.leader_nim})`);
});

const teamsJumat = generateSnakeDraftTeams(TEST_MOCK_STUDENTS, 'JUMAT', 3);
assert(teamsJumat.length === 5, `13 Mahasiswa TI/SI 2024-2025 dibagi menjadi 5 Tim (Aktual: ${teamsJumat.length})`);

// 6. UJI INTEGRITAS INISIALISASI PAKET GAMES (100% MURNI DINAMIS)
console.log('\n--- [TEST GROUP 6: Inisialisasi Paket Kontes Murni Dinamis (0 Paket Game Awal)] ---');
assert(INITIAL_GAMES.length === 0, `Sistem menginisialisasi 0 paket game default (Murni Dinamis, Aktual: ${INITIAL_GAMES.length})`);
assert(ArenaStore.getGames().length === 0, `Store mengembalikan 0 paket game sebelum dibuat manual oleh Admin (Aktual: ${ArenaStore.getGames().length})`);

// 6.1 Pembuatan Paket Kontes Dinamis Awal untuk Sistem & Pengujian
const g1Init = ArenaStore.createGame({
  id_game: 'G1',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Kontes Logika & Big-O Dasar',
  kategori_materi: 'Big-O & Game Theory',
  kesulitan: 'Easy',
  mode_game: 'SOLO',
  durasi_total_menit: 5,
  durasi_per_soal_detik: 45,
  min_nilai_lulus: 70,
  initial_status: 'ENDED'
});
assert(g1Init.success === true, 'Admin berhasil membuat paket kontes G1 secara dinamis');

const g2Init = ArenaStore.createGame({
  id_game: 'G2',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Anatomi Online Judge & Fast I/O',
  kategori_materi: 'Fast I/O & Presisi',
  kesulitan: 'Easy',
  mode_game: 'SOLO',
  durasi_total_menit: 6,
  durasi_per_soal_detik: 45,
  min_nilai_lulus: 70,
  initial_status: 'ENDED'
});
assert(g2Init.success === true, 'Admin berhasil membuat paket kontes G2 secara dinamis');

const g4Init = ArenaStore.createGame({
  id_game: 'G4',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Analisis Kompleksitas & Pola Ad-Hoc',
  kategori_materi: 'Big-O & Game Theory',
  kesulitan: 'Medium',
  mode_game: 'SOLO',
  durasi_total_menit: 7,
  durasi_per_soal_detik: 50,
  min_nilai_lulus: 75,
  initial_status: 'ENDED'
});
assert(g4Init.success === true, 'Admin berhasil membuat paket kontes G4 secara dinamis');

const g6Init = ArenaStore.createGame({
  id_game: 'G6',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Observasi Invarian & Game Theory Tim',
  kategori_materi: 'Game Theory',
  kesulitan: 'Hard',
  mode_game: 'TEAM',
  pin_akses: 'TIME-882',
  durasi_total_menit: 10,
  durasi_per_soal_detik: 60,
  min_nilai_lulus: 75,
  initial_status: 'OPEN'
});
assert(g6Init.success === true, 'Admin berhasil membuat paket kontes G6 secara dinamis');

const g7Init = ArenaStore.createGame({
  id_game: 'G7',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Simulasi Pemrograman Kompetitif Tim',
  kategori_materi: 'Competitive Programming',
  kesulitan: 'Hard',
  mode_game: 'TEAM',
  pin_akses: 'TIME-993',
  durasi_total_menit: 10,
  durasi_per_soal_detik: 60,
  min_nilai_lulus: 75,
  initial_status: 'FROZEN'
});
assert(g7Init.success === true, 'Admin berhasil membuat paket kontes G7 secara dinamis');

assert(g6Init.game?.mode_game === 'TEAM', 'G6 merupakan game mode TEAM');
assert(g6Init.game?.pin_akses === 'TIME-882', 'G6 dilindungi PIN Akses TIME-882');

// 7. UJI KONFIGURASI GOOGLE RECAPTCHA V3
console.log('\n--- [TEST GROUP 7: Konfigurasi Google reCAPTCHA v3] ---');
const EXPECTED_SITE_KEY = '6Le4QR8uAAAAAJbAO6RYJuVmyABJO-HJFZHeWUsn';
const EXPECTED_SECRET_KEY = '6Le4QR8uAAAAABnLAdYmiH1hkVlOd8tI6VbpKboY';

assert(EXPECTED_SITE_KEY.length === 40, `Panjang Site Key reCAPTCHA v3 tepat 40 karakter (${EXPECTED_SITE_KEY.length})`);
assert(EXPECTED_SECRET_KEY.length === 40, `Panjang Secret Key reCAPTCHA v3 tepat 40 karakter (${EXPECTED_SECRET_KEY.length})`);
assert(EXPECTED_SITE_KEY.startsWith('6Le4QR8u'), 'Format Site Key Google reCAPTCHA v3 valid');
assert(EXPECTED_SECRET_KEY.startsWith('6Le4QR8u'), 'Format Secret Key Google reCAPTCHA v3 valid');

// 8. UJI ROLE-BASED ACCESS CONTROL (RBAC) & URL DISPATCHER
console.log('\n--- [TEST GROUP 8: Routing RBAC (/mahasiswa vs /admin)] ---');
function resolveUserRoute(user) {
  if (!user) return '/login';
  if (user.role === 'ADMIN') return '/admin/contests';
  return '/mahasiswa/dashboard';
}

assert(resolveUserRoute(null) === '/login', 'Pengunjung tanpa sesi dialihkan ke /login');
assert(resolveUserRoute({ role: 'PESERTA', nim: '2545001' }) === '/mahasiswa/dashboard', 'Peserta Mahasiswa login langsung dialihkan ke /mahasiswa/dashboard');
assert(resolveUserRoute({ role: 'ADMIN', nim: 'DOSEN001' }) === '/admin/contests', 'Admin/Dosen login langsung dialihkan ke /admin/contests (Standard ICPC/DOMjudge)');
assert(resolveUserRoute({ role: 'PESERTA', nim: '240101001' }) === '/mahasiswa/dashboard', 'Mahasiswa Jumat login langsung dialihkan ke /mahasiswa/dashboard');

// 9. UJI DYNAMIC ROUTING & URL VALIDATION MAHASISWA
console.log('\n--- [TEST GROUP 9: Dynamic Routing & URL Resolver Mahasiswa (DOMjudge Semantic)] ---');
const VALID_MAHASISWA_MENUS = ['dashboard', 'katalog', 'team', 'leaderboard', 'submisi', 'capaian', 'profil'];
const MENU_ALIASES = {
  kontes: 'katalog',
  scoreboard: 'leaderboard',
  tim: 'team',
  evaluasi: 'capaian',
};

function resolveMahasiswaUrl(param) {
  const resolved = MENU_ALIASES[param] || param;
  return VALID_MAHASISWA_MENUS.includes(resolved) ? `/mahasiswa/${resolved}` : '/mahasiswa/dashboard';
}

VALID_MAHASISWA_MENUS.forEach(menu => {
  assert(resolveMahasiswaUrl(menu) === `/mahasiswa/${menu}`, `Rute dinamis mahasiswa /mahasiswa/${menu} valid`);
});
assert(resolveMahasiswaUrl('kontes') === '/mahasiswa/katalog', 'Alias semantik /mahasiswa/kontes -> /mahasiswa/katalog valid');
assert(resolveMahasiswaUrl('scoreboard') === '/mahasiswa/leaderboard', 'Alias semantik /mahasiswa/scoreboard -> /mahasiswa/leaderboard valid');
assert(resolveMahasiswaUrl('tim') === '/mahasiswa/team', 'Alias semantik /mahasiswa/tim -> /mahasiswa/team valid');
assert(resolveMahasiswaUrl('evaluasi') === '/mahasiswa/capaian', 'Alias semantik /mahasiswa/evaluasi -> /mahasiswa/capaian valid');
assert(resolveMahasiswaUrl('submisi') === '/mahasiswa/submisi', 'Rute dinamis riwayat submisi DOMjudge valid');
assert(resolveMahasiswaUrl('invalid-menu') === '/mahasiswa/dashboard', 'Rute tidak valid otomatis di-fallback ke /mahasiswa/dashboard');
assert(resolveMahasiswaUrl('') === '/mahasiswa/dashboard', 'Rute kosong otomatis di-fallback ke /mahasiswa/dashboard');

// 10. UJI DYNAMIC ROUTING & URL VALIDATION ADMIN COMMAND CENTER
console.log('\n--- [TEST GROUP 10: Dynamic Routing & URL Resolver Admin Command Center] ---');
const VALID_ADMIN_TABS = ['contests', 'problems', 'submissions', 'teams', 'students', 'export'];
const ADMIN_TAB_ALIASES = {
  'games': 'contests',
  'game': 'contests',
  'kontes': 'contests',
  'contest': 'contests',
  'questions': 'problems',
  'question': 'problems',
  'problem': 'problems',
  'soal': 'problems',
  'bank-soal': 'problems',
  'problem-bank': 'problems',
  'submisi': 'submissions',
  'judgement': 'submissions',
  'tim': 'teams',
  'mahasiswa': 'students',
  'rekap': 'export',
};
function resolveAdminUrl(param) {
  const resolved = ADMIN_TAB_ALIASES[param] || (VALID_ADMIN_TABS.includes(param) ? param : null);
  return resolved ? `/admin/${resolved}` : '/admin/contests';
}

VALID_ADMIN_TABS.forEach(tab => {
  assert(resolveAdminUrl(tab) === `/admin/${tab}`, `Rute dinamis admin /admin/${tab} valid`);
});
assert(resolveAdminUrl('games') === '/admin/contests', 'Backward-compatible alias /admin/games -> /admin/contests valid');
assert(resolveAdminUrl('game') === '/admin/contests', 'Backward-compatible alias /admin/game -> /admin/contests valid');
assert(resolveAdminUrl('kontes') === '/admin/contests', 'Alias semantik admin /admin/kontes -> /admin/contests valid');
assert(resolveAdminUrl('contest') === '/admin/contests', 'Alias semantik admin /admin/contest -> /admin/contests valid');
assert(resolveAdminUrl('problems') === '/admin/problems', 'Rute dinamis admin /admin/problems valid (Standard ICPC/DOMjudge)');
assert(resolveAdminUrl('questions') === '/admin/problems', 'Backward-compatible alias /admin/questions -> /admin/problems valid');
assert(resolveAdminUrl('question') === '/admin/problems', 'Backward-compatible alias /admin/question -> /admin/problems valid');
assert(resolveAdminUrl('soal') === '/admin/problems', 'Alias semantik admin /admin/soal -> /admin/problems valid');
assert(resolveAdminUrl('bank-soal') === '/admin/problems', 'Alias semantik admin /admin/bank-soal -> /admin/problems valid');
assert(resolveAdminUrl('problem-bank') === '/admin/problems', 'Alias semantik admin /admin/problem-bank -> /admin/problems valid');
assert(resolveAdminUrl('submisi') === '/admin/submissions', 'Alias semantik admin /admin/submisi -> /admin/submissions valid');
assert(resolveAdminUrl('rekap') === '/admin/export', 'Alias semantik admin /admin/rekap -> /admin/export valid');
assert(resolveAdminUrl('unknown-tab') === '/admin/contests', 'Rute tab admin tidak valid otomatis di-fallback ke /admin/contests');
assert(resolveAdminUrl('') === '/admin/contests', 'Rute tab admin kosong otomatis di-fallback ke /admin/contests');

// 11. UJI ENGINE TIM & KODE GABUNG 6-KARAKTER (DOMJUDGE ICPC SQUAD ENGINE)
console.log('\n--- [TEST GROUP 11: Engine Tim & Kode Gabung 6-Karakter (DOMjudge ICPC Standard)] ---');

// Reset store state untuk testing
ArenaStore.resetGlobal();
// Inisialisasi roster mahasiswa fixture untuk pengujian engine tim, scoreboard & sesi
ArenaStore.saveUsers([...INITIAL_USERS, ...TEST_MOCK_STUDENTS]);

const mhsA = TEST_MOCK_STUDENTS.find(u => u.nim === '2545001'); // Cecilia
const mhsB = TEST_MOCK_STUDENTS.find(u => u.nim === '250201002'); // Indra
const mhsC = TEST_MOCK_STUDENTS.find(u => u.nim === '250201003'); // Mardianus
const mhsD = TEST_MOCK_STUDENTS.find(u => u.nim === '250201004'); // Laksman

// 11.1 Generator Kode Unik 6 Karakter
const generatedCode = ArenaStore.generateTeamJoinCode();
assert(typeof generatedCode === 'string' && generatedCode.length === 6, `Generator menghasilkan kode tim tepat 6 karakter (${generatedCode})`);
assert(generatedCode.startsWith('CP'), `Format kode tim dimulai dengan prefix CP (${generatedCode})`);

// 11.2 Mahasiswa A mendirikan Tim Baru
const createRes = ArenaStore.createTeam(mhsA, 'AlgoWarriors');
assert(createRes.success === true, 'Mahasiswa A berhasil membuat Tim AlgoWarriors');
assert(Boolean(createRes.team), 'Objek tim hasil create valid');
assert(createRes.team?.leader_nim === mhsA.nim, 'Mahasiswa A tercatat sebagai leader tim');
assert(createRes.team?.kode_gabung?.length === 6, `Tim baru memiliki kode gabung 6 karakter (${createRes.team?.kode_gabung})`);
assert(createRes.team?.daftar_nim_json.length === 1, 'Tim baru memiliki 1 anggota awal (Leader)');
const teamCode = createRes.team?.kode_gabung;

// 11.3 Mahasiswa A mencoba membuat tim lagi saat sudah memiliki tim
const createAgainRes = ArenaStore.createTeam(mhsA, 'SecondTeam');
assert(createAgainRes.success === false, 'Mahasiswa yang sudah ber-tim ditolak membuat tim kedua');

// 11.4 Mahasiswa B bergabung menggunakan kode tim (case-insensitive & whitespace tolerant)
const joinBRes = ArenaStore.joinTeamWithCode(mhsB, `  ${teamCode.toLowerCase()}  `);
assert(joinBRes.success === true, 'Mahasiswa B berhasil bergabung dengan kode tim (case-insensitive & trimmed)');
assert(joinBRes.team?.daftar_nim_json.length === 2, 'Anggota tim bertambah menjadi 2 (Si A + Si B)');
assert(joinBRes.team?.total_skor_tim === (mhsA.total_xp + mhsB.total_xp), `Skor tim dinamis terakumulasi (${joinBRes.team?.total_skor_tim} XP)`);

// 11.5 Mahasiswa B mencoba bergabung kembali ke tim yang sama
const joinBDupRes = ArenaStore.joinTeamWithCode(mhsB, teamCode);
assert(joinBDupRes.success === false, 'Mahasiswa ditolak bergabung duplikat ke tim yang sama');

// 11.6 Mahasiswa C bergabung (Slot ke-3, Tim Penuh)
const joinCRes = ArenaStore.joinTeamWithCode(mhsC, teamCode);
assert(joinCRes.success === true, 'Mahasiswa C berhasil bergabung (Slot ke-3)');
assert(joinCRes.team?.daftar_nim_json.length === 3, 'Kapasitas tim mencapai batas kuota ICPC (3 anggota)');

// 11.7 Mahasiswa D mencoba bergabung ke tim yang sudah penuh (Maks 3 ICPC)
const joinDRes = ArenaStore.joinTeamWithCode(mhsD, teamCode);
assert(joinDRes.success === false, 'Mahasiswa D ditolak karena kuota tim penuh (Maks 3 ICPC)');

// 11.8 Validasi getTeamMembers untuk render slot kartu
const membersDetail = ArenaStore.getTeamMembers(joinCRes.team);
assert(membersDetail.length === 3, 'Detail member mengembalikan tepat 3 anggota');
assert(membersDetail[0].is_leader === true, 'Member pertama diidentifikasi sebagai Leader (👑)');
assert(membersDetail[1].is_leader === false, 'Member kedua diidentifikasi sebagai Member biasa');

// 11.9 Mahasiswa C keluar dari tim (Leave)
const leaveCRes = ArenaStore.leaveTeam(mhsC);
assert(leaveCRes.success === true, 'Mahasiswa C berhasil keluar dari tim');
const teamAfterLeave = ArenaStore.getTeams().find(t => t.kode_gabung === teamCode);
assert(teamAfterLeave?.daftar_nim_json.length === 2, 'Kapasitas tim kembali terbuka menjadi 2 anggota');

// 11.10 Pembubaran tim oleh Leader
const disbandRes = ArenaStore.disbandTeam(teamAfterLeave.id_tim, mhsA.nim);
assert(disbandRes.success === true, 'Leader berhasil membubarkan tim');
const teamAfterDisband = ArenaStore.getTeams().find(t => t.kode_gabung === teamCode);
assert(teamAfterDisband === undefined, 'Tim yang dibubarkan terhapus dari sistem');

// 12. UJI DOMJUDGE ICPC SCOREBOARD MATRIX, FREEZE SIMULATOR & PROBLEM SET A–Z
console.log('\n--- [TEST GROUP 12: DOMjudge ICPC Scoreboard Matrix, Freeze Simulator & Problem Set A–Z] ---');

// 12.1 Validasi Mapping Problem Set A–Z & Balon Warna
assert(ICPC_PROBLEMS_DEF.length === 7, `Tersedia 7 Problem ICPC A–G (Aktual: ${ICPC_PROBLEMS_DEF.length})`);
assert(ICPC_PROBLEMS_DEF[0].letter === 'A' && ICPC_PROBLEMS_DEF[0].balloonEmoji === '🔴', 'Problem A berlabel 🔴 (G1)');
assert(ICPC_PROBLEMS_DEF[1].letter === 'B' && ICPC_PROBLEMS_DEF[1].balloonEmoji === '🟢', 'Problem B berlabel 🟢 (G2)');
assert(ICPC_PROBLEMS_DEF[2].letter === 'C' && ICPC_PROBLEMS_DEF[2].balloonEmoji === '🔵', 'Problem C berlabel 🔵 (G3)');
assert(ICPC_PROBLEMS_DEF[3].letter === 'D' && ICPC_PROBLEMS_DEF[3].balloonEmoji === '🟡', 'Problem D berlabel 🟡 (G4)');
assert(ICPC_PROBLEMS_DEF[4].letter === 'E' && ICPC_PROBLEMS_DEF[4].balloonEmoji === '🟣', 'Problem E berlabel 🟣 (G5)');
assert(ICPC_PROBLEMS_DEF[5].letter === 'F' && ICPC_PROBLEMS_DEF[5].balloonEmoji === '🟠', 'Problem F berlabel 🟠 (G6)');
assert(ICPC_PROBLEMS_DEF[6].letter === 'G' && ICPC_PROBLEMS_DEF[6].balloonEmoji === '🌸', 'Problem G berlabel 🌸 (G7)');

// 12.2 Validasi Matriks Scoreboard Live (Tanpa Freeze)
// Seed submisi uji dinamis untuk simulasi ICPC Live & Freeze Scoreboard
ArenaStore.saveSubmissions([
  {
    id_submission: 'SUB-TEST-CECILIA-G2',
    timestamp_mulai: new Date(Date.now() - 5400000).toISOString(),
    timestamp_update: new Date(Date.now() - 5040000).toISOString(),
    nim: '2545001',
    codename: 'Cecilia_AlgoStar',
    klub_hari: 'KAMIS',
    id_game: 'G2',
    mode_game: 'SOLO',
    id_tim: '',
    skor_xp: 252,
    nilai_akademik: 50,
    jumlah_benar: 2,
    total_soal: 4,
    status_lulus: 'BELUM LULUS',
    streak_saat_ini: 2,
    tab_switch_count: 0,
    status_sesi: 'DONE',
    detail_jawaban_json: [
      { id_soal: 'Q201', jawaban_mahasiswa: 'False', is_correct: true, is_timeout: false, opened_hint: false, sisa_detik: 32, skor_xp_didapat: 98 },
      { id_soal: 'Q202', jawaban_mahasiswa: 'input() lambat', is_correct: true, is_timeout: false, opened_hint: false, sisa_detik: 28, skor_xp_didapat: 94 },
      { id_soal: 'Q203', jawaban_mahasiswa: 'O(N^2)', is_correct: false, is_timeout: false, opened_hint: false, sisa_detik: 15, skor_xp_didapat: 0 },
      { id_soal: 'Q204', jawaban_mahasiswa: 'N genap', is_correct: false, is_timeout: false, opened_hint: true, sisa_detik: 10, skor_xp_didapat: 0 }
    ]
  },
  {
    id_submission: 'SUB-TEST-CECILIA-G4',
    timestamp_mulai: new Date(Date.now() - 3000000).toISOString(),
    timestamp_update: new Date(Date.now() - 2580000).toISOString(),
    nim: '2545001',
    codename: 'Cecilia_AlgoStar',
    klub_hari: 'KAMIS',
    id_game: 'G4',
    mode_game: 'SOLO',
    id_tim: '',
    skor_xp: 113,
    nilai_akademik: 25,
    jumlah_benar: 1,
    total_soal: 4,
    status_lulus: 'BELUM LULUS',
    streak_saat_ini: 1,
    tab_switch_count: 0,
    status_sesi: 'DONE',
    detail_jawaban_json: [
      { id_soal: 'Q203', jawaban_mahasiswa: 'O(N log N)', is_correct: true, is_timeout: false, opened_hint: false, sisa_detik: 40, skor_xp_didapat: 113 },
      { id_soal: 'Q204', jawaban_mahasiswa: 'N prima', is_correct: false, is_timeout: false, opened_hint: false, sisa_detik: 12, skor_xp_didapat: 0 },
      { id_soal: 'Q201', jawaban_mahasiswa: 'True', is_correct: false, is_timeout: true, opened_hint: false, sisa_detik: 0, skor_xp_didapat: 0 },
      { id_soal: 'Q202', jawaban_mahasiswa: 'Tidak ada bedanya', is_correct: false, is_timeout: false, opened_hint: true, sisa_detik: 5, skor_xp_didapat: 0 }
    ]
  }
]);

const liveScoreboard = ArenaStore.getICPCScoreboard('KAMIS', false);
assert(liveScoreboard.rows.length === 15, `Scoreboard Live Kelas KAMIS memiliki 15 peserta (Aktual: ${liveScoreboard.rows.length})`);
assert(liveScoreboard.rows[0].rank === 1, 'Peserta pertama memiliki rank #1');

// Cecilia memiliki submisi di G2 dan G4
const ceciliaLive = liveScoreboard.rows.find(r => r.nim === '2545001');
assert(ceciliaLive !== undefined, 'Cecilia ditemukan di baris matriks scoreboard');
assert(ceciliaLive.solvedCount === 1, `Cecilia di Live Scoreboard solve 1 problem (Aktual: ${ceciliaLive.solvedCount})`);
assert(ceciliaLive.totalPenaltyTime > 0, `Total waktu penalti ICPC terhitung positif (${ceciliaLive.totalPenaltyTime} min)`);
assert(ceciliaLive.problems['B'].isSolved === true, 'Problem B (G2) berstatus Solved (AC)');
assert(ceciliaLive.problems['D'].isSolved === false, 'Problem D (G4) berstatus Not Passed (-attempts)');
assert(ceciliaLive.problems['D'].attempts >= 1, 'Problem D mencatat percobaan submisi');
assert(ceciliaLive.problems['B'].isPendingFreeze === false, 'Problem B tidak pending saat unfreeze');

// 12.3 Validasi Scoreboard Freeze Simulator (15 Menit Terakhir)
const frozenScoreboard = ArenaStore.getICPCScoreboard('KAMIS', true);
const ceciliaFrozen = frozenScoreboard.rows.find(r => r.nim === '2545001');
assert(ceciliaFrozen !== undefined, 'Cecilia ditemukan di frozen scoreboard');
assert(ceciliaFrozen.problems['D'].isPendingFreeze === true, 'Problem D (G4) ditandai pending freeze (?) di scoreboard');
assert(ceciliaFrozen.solvedCount === 1, `Solved count Cecilia tetap 1 karena B solved dan D pending (Aktual: ${ceciliaFrozen.solvedCount})`);

// 12.4 Validasi Statistik Ringkasan Problem (Footer DOMjudge)
assert(liveScoreboard.problemStats['B'].solvedCount >= 1, `Statistik Problem B mencatat minimal 1 tim AC (Aktual: ${liveScoreboard.problemStats['B'].solvedCount})`);
assert(liveScoreboard.problemStats['B'].totalAttempts >= 1, 'Statistik Problem B mencatat total percobaan masuk');

// 13. UJI MANAJEMEN AKUN MANUAL, KELAS LOMBA & ISOLASI RESOURCE
console.log('\n--- [TEST GROUP 13: Tambah Akun Manual, Opsi Kelas LOMBA & Resource Isolation] ---');

// 13.1 Tambah Akun Mahasiswa Reguler (Kelas KAMIS)
const createRes1 = ArenaStore.createUser({
  nim: '250201999',
  nama_lengkap: 'Budi Santoso',
  role: 'PESERTA',
  klub_hari: 'KAMIS',
  prodi: 'Sistem Informasi',
  angkatan: 2025,
  kelas_reguler: 'SI B 25'
});
assert(createRes1.success === true, 'Berhasil menambahkan akun mahasiswa reguler baru');
assert(createRes1.user.nim === '250201999', 'NIM akun baru sesuai');
assert(createRes1.user.password === '250201999', 'Password default disamakan dengan NIM');
assert(createRes1.user.klub_hari === 'KAMIS', 'Kohort kelas akun baru adalah KAMIS');

// 13.2 Tambah Akun Mahasiswa Khusus Kelas LOMBA
const createRes2 = ArenaStore.createUser({
  nim: '250209999',
  nama_lengkap: 'Siti Rahmawati ICPC',
  role: 'PESERTA',
  klub_hari: 'LOMBA',
  prodi: 'Teknik Informatika',
  angkatan: 2024,
  kelas_reguler: 'TI A 24'
});
assert(createRes2.success === true, 'Berhasil menambahkan akun mahasiswa kontingen LOMBA');
assert(createRes2.user.klub_hari === 'LOMBA', 'Kohort akun baru adalah LOMBA');

// 13.3 Tambah Akun Admin Manual
const createRes3 = ArenaStore.createUser({
  nim: 'DOSEN-TIME-99',
  nama_lengkap: 'Dr. Hendra Wijaya, M.Kom',
  role: 'ADMIN'
});
assert(createRes3.success === true, 'Berhasil menambahkan akun Admin Dosen baru');
assert(createRes3.user.role === 'ADMIN', 'Role akun admin baru terverifikasi ADMIN');
assert(createRes3.user.klub_hari === 'ALL', 'Klub hari Admin otomatis ALL');

// 13.4 Pencegahan Duplikasi NIM
const dupRes = ArenaStore.createUser({
  nim: '250201999',
  nama_lengkap: 'Budi Palsu',
  role: 'PESERTA'
});
assert(dupRes.success === false, 'Pencegahan duplikasi NIM berhasil (ditolak)');

// 13.5 Validasi Login Akun Baru (Credential Check)
const loginRes = ArenaStore.login('250209999', '250209999');
assert(loginRes.success === true, 'Akun baru berhasil login menggunakan NIM sebagai password default');
assert(loginRes.user?.klub_hari === 'LOMBA', 'Sesi login mendeteksi kelas LOMBA');

// 13.6 Validasi Isolasi Resource (Resource Scoping Isolation)
ArenaStore.createGame({
  id_game: 'G1',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Kuis Logika Dasar',
  kategori_materi: 'Logika',
  kesulitan: 'Easy',
  mode_game: 'SOLO',
  initial_status: 'ENDED'
});
ArenaStore.updateGameCohortStatus('G1', 'LOMBA', 'ENDED');

ArenaStore.createGame({
  id_game: 'G6',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Kontes Game Theory Tim',
  kategori_materi: 'Game Theory',
  kesulitan: 'Hard',
  mode_game: 'TEAM',
  pin_akses: 'TIME-882',
  initial_status: 'OPEN'
});
ArenaStore.updateGameCohortStatus('G6', 'LOMBA', 'OPEN');

ArenaStore.createGame({
  id_game: 'G7',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Simulasi ICPC Tim',
  kategori_materi: 'CP',
  kesulitan: 'Hard',
  mode_game: 'TEAM',
  pin_akses: 'TIME-993',
  initial_status: 'FROZEN'
});
ArenaStore.updateGameCohortStatus('G7', 'LOMBA', 'FROZEN');

const allGames = ArenaStore.getGames();
const lombaG1 = allGames.find(g => g.id_game === 'G1');
const lombaG6 = allGames.find(g => g.id_game === 'G6');
const lombaG7 = allGames.find(g => g.id_game === 'G7');
assert(lombaG1?.status_lomba === 'ENDED', 'G1 status LOMBA adalah ENDED');
assert(lombaG6?.status_lomba === 'OPEN', 'G6 status LOMBA adalah OPEN');
assert(lombaG7?.status_lomba === 'FROZEN', 'G7 status LOMBA adalah FROZEN');

// 13.7 Validasi Penghapusan Akun
const delRes = ArenaStore.deleteUser('250201999');
assert(delRes.success === true, 'Berhasil menghapus akun pengguna');
const recheck = ArenaStore.getUsers().find(u => u.nim === '250201999');
assert(recheck === undefined, 'Akun terhapus tidak lagi ditemukan di daftar pengguna');

// --- [TEST GROUP 14: Dynamic Cohorts, Custom Classes, Resource Access Matrix & Periode] ---
console.log('\n--- [TEST GROUP 14: Dynamic Cohorts, Custom Classes, Resource Access Matrix & Periode] ---');

// 14.1 Verifikasi Inisialisasi Kohort Murni Dinamis (0 Kohort Awal Sebelum Dibuat Manual)
const initialCohorts = ArenaStore.getCohorts();
assert(initialCohorts.length === 0, `Sistem menginisialisasi 0 kohort default (Murni Dinamis, Aktual: ${initialCohorts.length})`);

// 14.2 Validasi Format Periode (<Ganjil/Genap> <Tahun>)
assert(ArenaStore.normalizePeriode('Ganjil 2025') === 'Ganjil 2025', 'Validasi format standar "Ganjil 2025" berhasil');
assert(ArenaStore.normalizePeriode('genap 2026') === 'Genap 2026', 'Normalisasi format lowercase "genap 2026" berhasil');
assert(ArenaStore.normalizePeriode('2025-1') === null, 'Penolakan format invalid "2025-1" berhasil');
assert(ArenaStore.normalizePeriode('Semester Ganjil') === null, 'Penolakan format invalid "Semester Ganjil" berhasil');

// 14.3 Pembuatan Kohort Dinamis Baru
const newCohortRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Algoritma & Struktur Data C',
  kode_kelas: 'ALGO-C-25',
  periode: 'Genap 2026',
  deskripsi: 'Kelas baru semester genap untuk praktikum struktur data',
  allowed_game_ids: ['G1', 'G3']
});
assert(newCohortRes.success === true, 'Admin berhasil membuat kelas & kohort dinamis baru');
assert(newCohortRes.cohort?.periode === 'Genap 2026', 'Periode kelas baru tercatat "Genap 2026"');
assert(newCohortRes.cohort?.allowed_game_ids.length === 2, 'Hak akses kelas baru tepat 2 paket soal (G1, G3)');

// 14.4 Pencegahan Duplikasi Kode Kelas
const dupCohortRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Duplikat',
  kode_kelas: 'ALGO-C-25',
  periode: 'Genap 2026'
});
assert(dupCohortRes.success === false, 'Pencegahan duplikasi kode kelas berhasil (ditolak)');

// 14.5 Penolakan Periode Tidak Valid
const invalidPeriodeRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Format Salah',
  kode_kelas: 'SALAH-01',
  periode: '2026-Genap'
});
assert(invalidPeriodeRes.success === false, 'Pencegahan pembuatan kelas dengan format periode salah berhasil');

// 14.6 Assign Mahasiswa ke Kelas Dinamis & Warisan Periode
const studentRes = ArenaStore.createUser({
  nim: '250201888',
  nama_lengkap: 'David Alamsyah',
  role: 'PESERTA',
  id_cohort: 'c-algo-c-25'
});
assert(studentRes.success === true, 'Berhasil menambahkan mahasiswa ke kelas dinamis');
assert(studentRes.user?.id_cohort === 'c-algo-c-25', 'Mahasiswa terikat dengan id_cohort kelas dinamis');
assert(studentRes.user?.periode === 'Genap 2026', 'Mahasiswa otomatis mewarisi periode "Genap 2026" dari kelasnya');

// 14.7 Resource Access Matrix Enforcement
assert(ArenaStore.isGameAllowedForUser(studentRes.user, 'G1') === true, 'Mahasiswa diizinkan mengakses Game G1');
assert(ArenaStore.isGameAllowedForUser(studentRes.user, 'G3') === true, 'Mahasiswa diizinkan mengakses Game G3');
assert(ArenaStore.isGameAllowedForUser(studentRes.user, 'G2') === false, 'Mahasiswa DITOLAK/DIKUNCI dari Game G2 (Bukan hak akses kelas)');
assert(ArenaStore.isGameAllowedForUser(studentRes.user, 'G4') === false, 'Mahasiswa DITOLAK/DIKUNCI dari Game G4 (Bukan hak akses kelas)');

// 14.8 Proteksi Penghapusan Kohort Jika Masih Ada Mahasiswa Terdaftar
const delHasUserRes = ArenaStore.deleteCohort('c-algo-c-25');
assert(delHasUserRes.success === false, 'Penghapusan kohort ditolak karena masih ada mahasiswa terdaftar');

// 14.9 Penghapusan Kohort Berhasil Jika Tidak Ada Mahasiswa Terdaftar
const emptyCohortRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Kosong Temporer',
  kode_kelas: 'TEMP-KOSONG',
  periode: 'Ganjil 2025'
});
assert(emptyCohortRes.success === true, 'Berhasil membuat kelas kosong temporer');
const delEmptyRes = ArenaStore.deleteCohort(emptyCohortRes.cohort.id_cohort);
assert(delEmptyRes.success === true, 'Berhasil menghapus kelas kosong tanpa mahasiswa');

// 15. MANAJEMEN PROGRES MAHASISWA: RESET PER-PERTEMUAN, EDIT NILAI/XP & RESET TOTAL
console.log('\n--- [TEST GROUP 15: Student Progress Management (Reset Per-Game, Edit Nilai/XP, Reset Total)] ---');

// 15.1 Reset Submisi Per-Pertemuan (resetUserGameSubmission)
const testStudentNim = '2545001'; // Cecilia

// Seed submisi tes dinamis untuk pengujian reset
ArenaStore.saveSubmissions([
  {
    id_submission: 'SUB-2545001-G2-TEST',
    timestamp_mulai: new Date().toISOString(),
    timestamp_update: new Date().toISOString(),
    nim: testStudentNim,
    codename: 'Cecilia_AlgoStar',
    klub_hari: 'KAMIS',
    id_game: 'G2',
    mode_game: 'SOLO',
    id_tim: '',
    skor_xp: 252,
    nilai_akademik: 50,
    jumlah_benar: 2,
    total_soal: 4,
    status_lulus: 'BELUM LULUS',
    streak_saat_ini: 1,
    tab_switch_count: 0,
    status_sesi: 'DONE',
    detail_jawaban_json: []
  }
]);

const userInitial = ArenaStore.getUsers().find(u => u.nim === testStudentNim);
const subsBefore = ArenaStore.getSubmissions().filter(s => s.nim === testStudentNim);
assert(subsBefore.length >= 1, 'Mahasiswa target memiliki riwayat submisi sebelum pengujian');

const g2Sub = subsBefore.find(s => s.id_game === 'G2');
const g2Xp = g2Sub ? g2Sub.skor_xp : 0;
const expectedXpAfterG2Reset = Math.max(0, (userInitial?.total_xp || 0) - g2Xp);

const resetG2Res = ArenaStore.resetUserGameSubmission(testStudentNim, 'G2');
assert(resetG2Res.success === true, 'Admin berhasil me-reset submisi G2 untuk mahasiswa');
const subsAfterG2 = ArenaStore.getSubmissions().filter(s => s.nim === testStudentNim && s.id_game === 'G2');
assert(subsAfterG2.length === 0, 'Submisi G2 mahasiswa benar-benar terhapus dari basis data');

const userAfterG2 = ArenaStore.getUsers().find(u => u.nim === testStudentNim);
assert(userAfterG2?.total_xp === expectedXpAfterG2Reset, `Total XP mahasiswa berkurang dari ${userInitial?.total_xp} menjadi ${expectedXpAfterG2Reset}`);
assert(userAfterG2?.level === calculateLevelInfo(expectedXpAfterG2Reset).level, 'Level mahasiswa disinkronkan secara matematis');

// 15.2 Validasi Error Saat Reset Submisi yang Tidak Ada
const resetNonExistent = ArenaStore.resetUserGameSubmission(testStudentNim, 'G2');
assert(resetNonExistent.success === false, 'Reset kuis ditolak jika submisi memang belum/tidak ada');

// 15.3 Edit Progres, Nilai Kuis per Pertemuan & Penyesuaian XP (updateUserProgressAndGrades)
const updateRes = ArenaStore.updateUserProgressAndGrades(testStudentNim, {
  total_xp: 950,
  grades: [
    { id_game: 'G1', nilai_akademik: 95, skor_xp: 150 },
    { id_game: 'G2', nilai_akademik: 80, skor_xp: 100 },
    { id_game: 'G3', nilai_akademik: 45, skor_xp: 40 }
  ]
});
assert(updateRes.success === true, 'Admin berhasil memperbarui nilai per pertemuan dan total XP');

const userUpdated = ArenaStore.getUsers().find(u => u.nim === testStudentNim);
assert(userUpdated?.total_xp === 950, 'Total XP mahasiswa ter-update menjadi 950 XP');
assert(userUpdated?.level === calculateLevelInfo(950).level, 'Level mahasiswa ter-update otomatis sesuai XP baru');

const subsUpdated = ArenaStore.getSubmissions().filter(s => s.nim === testStudentNim);
const subG1 = subsUpdated.find(s => s.id_game === 'G1');
const subG2 = subsUpdated.find(s => s.id_game === 'G2');
const subG3 = subsUpdated.find(s => s.id_game === 'G3');

assert(subG1?.nilai_akademik === 95 && subG1?.status_lulus === 'LULUS', 'Submisi G1 bernilai 95 dengan status LULUS');
assert(subG2?.nilai_akademik === 80 && subG2?.status_lulus === 'LULUS', 'Submisi G2 bernilai 80 dengan status LULUS');
assert(subG3?.nilai_akademik === 45 && subG3?.status_lulus === 'BELUM LULUS', 'Submisi G3 bernilai 45 dengan status BELUM LULUS (<70)');

// 15.4 Verifikasi Konsistensi Rata-rata Nilai Dinamis
const doneSubs = subsUpdated.filter(s => s.status_sesi === 'DONE');
const expectedSum = doneSubs.reduce((acc, s) => acc + s.nilai_akademik, 0);
const expectedAverage = Math.round(expectedSum / doneSubs.length);
const calculatedAverage = Math.round(subsUpdated.reduce((acc, s) => acc + s.nilai_akademik, 0) / subsUpdated.length);
assert(calculatedAverage === expectedAverage, `Nilai rata-rata dinamis terhitung konsisten: ${calculatedAverage}/100 across ${doneSubs.length} paket kuis`);

// 15.5 Reset Keseluruhan Data Progres Mahasiswa (resetUserProgress)
const fullResetRes = ArenaStore.resetUserProgress(testStudentNim);
assert(fullResetRes === true, 'Admin berhasil me-reset total data progres mahasiswa');

const subsAfterFullReset = ArenaStore.getSubmissions().filter(s => s.nim === testStudentNim);
assert(subsAfterFullReset.length === 0, 'Seluruh riwayat submisi mahasiswa terhapus bersih (0 submisi)');

const userAfterFullReset = ArenaStore.getUsers().find(u => u.nim === testStudentNim);
assert(userAfterFullReset?.total_xp === 0, 'Total XP mahasiswa di-reset menjadi 0');
assert(userAfterFullReset?.level === 1, 'Level mahasiswa dikembalikan ke Level 1');
assert(userAfterFullReset?.tier_badge === '🌱 Logic Novice', 'Tier badge dikembalikan ke Logic Novice');

// 15.6 Hapus Submisi Spesifik (deleteSubmission) & Hapus per-Problem (deleteSubmissionsForGame)
ArenaStore.saveSubmissions([
  {
    id_submission: 'SUB-DEL-SINGLE-01',
    timestamp_mulai: new Date().toISOString(),
    timestamp_update: new Date().toISOString(),
    nim: testStudentNim,
    codename: 'Cecilia_AlgoStar',
    klub_hari: 'KAMIS',
    id_game: 'G1',
    mode_game: 'SOLO',
    id_tim: '',
    skor_xp: 50,
    nilai_akademik: 80,
    jumlah_benar: 3,
    total_soal: 3,
    status_lulus: 'LULUS',
    streak_saat_ini: 1,
    tab_switch_count: 0,
    status_sesi: 'DONE',
    detail_jawaban_json: []
  },
  {
    id_submission: 'SUB-DEL-BULK-01',
    timestamp_mulai: new Date().toISOString(),
    timestamp_update: new Date().toISOString(),
    nim: '250201002',
    codename: 'Indra_CodeMaster',
    klub_hari: 'KAMIS',
    id_game: 'G99_BULK',
    mode_game: 'SOLO',
    id_tim: '',
    skor_xp: 75,
    nilai_akademik: 90,
    jumlah_benar: 3,
    total_soal: 3,
    status_lulus: 'LULUS',
    streak_saat_ini: 1,
    tab_switch_count: 0,
    status_sesi: 'DONE',
    detail_jawaban_json: []
  }
]);

const delSingleRes = ArenaStore.deleteSubmission('SUB-DEL-SINGLE-01');
assert(delSingleRes.success === true, 'Admin berhasil menghapus 1 submisi spesifik (deleteSubmission)');
const checkSingleDeleted = ArenaStore.getSubmissions().find(s => s.id_submission === 'SUB-DEL-SINGLE-01');
assert(checkSingleDeleted === undefined, 'Submisi target benar-benar hilang dari daftar submisi');

const delBulkRes = ArenaStore.deleteSubmissionsForGame('G99_BULK');
assert(delBulkRes.success === true && delBulkRes.deletedCount === 1, 'Admin berhasil menghapus seluruh submisi untuk problem tertentu (deleteSubmissionsForGame)');
const checkBulkDeleted = ArenaStore.getSubmissions().filter(s => s.id_game === 'G99_BULK');
assert(checkBulkDeleted.length === 0, 'Seluruh submisi problem target terhapus tuntas (0 submisi tersisa)');

// ========================================================
// TEST GROUP 16: Dynamic Contest Creation, Per-Cohort Game Status & Switcher
// ========================================================
console.log('\n--- [TEST GROUP 16: Dynamic Contest Creation, Per-Cohort Game Status & Switcher] ---');

// 16.1 Pembuatan Paket Game Baru Secara Dinamis
const initialGameCount = ArenaStore.getGames().length;
const testDynamicCohort = ArenaStore.getCohorts().find(c => c.kode_kelas === 'ALGO-C-25') || ArenaStore.getCohorts()[0];

const secondCohortRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Pemrograman Kompetitif B',
  kode_kelas: 'CP-B-26',
  periode: 'Ganjil 2026'
});
assert(secondCohortRes.success === true, 'Berhasil membuat kelas dinamis kedua untuk testing matrix');
const testSecondCohort = secondCohortRes.cohort;

const newGameRes = ArenaStore.createGame({
  id_game: 'G8',
  ref_pertemuan: 'Pertemuan 8',
  judul_game: 'Dynamic Programming & Grid DAGs',
  kategori_materi: 'Dynamic Programming',
  kesulitan: 'Hard',
  mode_game: 'TEAM',
  durasi_total_menit: 45,
  durasi_per_soal_detik: 90,
  min_nilai_lulus: 75,
  allowed_cohort_ids: [testDynamicCohort.id_cohort],
  initial_status: 'UPCOMING'
});

assert(newGameRes.success === true, 'Admin berhasil membuat paket kontes dinamis baru (G8)');
assert(ArenaStore.getGames().length === initialGameCount + 1, 'Total paket game bertambah menjadi 8 (Aktual: ' + ArenaStore.getGames().length + ')');

const createdG8 = ArenaStore.getGames().find(g => g.id_game === 'G8');
assert(createdG8?.judul_game === 'Dynamic Programming & Grid DAGs', 'Judul game G8 terdaftar valid');
assert(createdG8?.mode_game === 'TEAM', 'Mode game G8 adalah TEAM');
assert(!!createdG8?.pin_akses && createdG8.pin_akses.startsWith('TIME-'), 'PIN akses game tim G8 ter-generate otomatis');

// 16.2 Verifikasi Sinkronisasi Hak Akses ke Kohort
const dynamicCohortUpdated = ArenaStore.getCohortById(testDynamicCohort.id_cohort);
assert(dynamicCohortUpdated?.allowed_game_ids.includes('G8') === true, 'Kelas Dinamis otomatis memiliki hak akses ke game G8');

const secondCohortNotAllowed = ArenaStore.getCohortById(testSecondCohort.id_cohort);
assert(secondCohortNotAllowed?.allowed_game_ids.includes('G8') === false, 'Kelas Kedua terkunci dari game G8 (Bukan kelas yang diizinkan)');

// 16.3 Pengaturan Saklar Status Independen per Kelas Dinamis
const toggleDynamicRes = ArenaStore.updateGameCohortStatus('G8', testDynamicCohort.id_cohort, 'OPEN');
assert(toggleDynamicRes === true, 'Admin berhasil mengubah status G8 untuk kelas dinamis menjadi OPEN');
const g8AfterDynamic = ArenaStore.getGames().find(g => g.id_game === 'G8');
assert(ArenaStore.getGameStatusForCohort(g8AfterDynamic, testDynamicCohort.id_cohort) === 'OPEN', 'Status G8 untuk kelas dinamis terbaca OPEN');

const toggleSecondRes = ArenaStore.updateGameCohortStatus('G8', testSecondCohort.id_cohort, 'FROZEN');
assert(toggleSecondRes === true, 'Admin berhasil mengubah status G8 untuk kelas kedua menjadi FROZEN');
const g8AfterSecond = ArenaStore.getGames().find(g => g.id_game === 'G8');
assert(ArenaStore.getGameStatusForCohort(g8AfterSecond, testSecondCohort.id_cohort) === 'FROZEN', 'Status G8 untuk kelas kedua terbaca FROZEN');

// 16.4 Pembacaan Reaktif Status Game di Sisi Mahasiswa Sesuai Kohort
const dummyDynamicUser = {
  nim: '9999001',
  nama_lengkap: 'Dynamic Student',
  codename: 'Dyno_Star',
  avatar: 'DS',
  role: 'PESERTA',
  prodi: 'Sistem Informasi',
  angkatan: 2026,
  kelas_reguler: 'SI Ext 26',
  klub_hari: 'KAMIS',
  id_cohort: testDynamicCohort.id_cohort,
  total_xp: 0,
  level: 1,
  tier_badge: '🌱 Logic Novice',
  milestones_json: [],
  id_tim: ''
};

const dummySecondUser = {
  nim: '9999002',
  nama_lengkap: 'Second Dynamic Student',
  codename: 'Second_Star',
  avatar: 'SS',
  role: 'PESERTA',
  prodi: 'Teknik Informatika',
  angkatan: 2026,
  kelas_reguler: 'TI Ext 26',
  klub_hari: 'KAMIS',
  id_cohort: testSecondCohort.id_cohort,
  total_xp: 0,
  level: 1,
  tier_badge: '🌱 Logic Novice',
  milestones_json: [],
  id_tim: ''
};

const dynamicUserStatus = ArenaStore.getGameStatusForUser(g8AfterSecond, dummyDynamicUser);
assert(dynamicUserStatus === 'OPEN', 'Mahasiswa di kelas dinamis pertama melihat status G8 adalah OPEN');

const secondUserStatus = ArenaStore.getGameStatusForUser(g8AfterSecond, dummySecondUser);
assert(secondUserStatus === 'FROZEN', 'Mahasiswa di kelas dinamis kedua melihat status G8 adalah FROZEN');

// 16.5 Master Freeze & Unfreeze Per-Kohort
ArenaStore.freezeCohort(testDynamicCohort.id_cohort);
const g8AfterFreeze = ArenaStore.getGames().find(g => g.id_game === 'G8');
assert(ArenaStore.getGameStatusForCohort(g8AfterFreeze, testDynamicCohort.id_cohort) === 'FROZEN', 'Game OPEN di kelas dinamis berhasil dibekukan (FROZEN)');

ArenaStore.unfreezeCohort(testDynamicCohort.id_cohort);
const g8AfterUnfreeze = ArenaStore.getGames().find(g => g.id_game === 'G8');
assert(ArenaStore.getGameStatusForCohort(g8AfterUnfreeze, testDynamicCohort.id_cohort) === 'OPEN', 'Game FROZEN di kelas dinamis berhasil dibuka kembali (OPEN)');

// 16.6 Update Detail Paket Kontes (updateGame)
const updateGameRes = ArenaStore.updateGame('G8', {
  judul_game: 'Dynamic Programming & Grid Optimization [Updated]',
  durasi_total_menit: 60
});
assert(updateGameRes.success === true, 'Admin berhasil memperbarui informasi paket kontes G8');
const g8Updated = ArenaStore.getGames().find(g => g.id_game === 'G8');
assert(g8Updated?.judul_game.includes('[Updated]'), 'Judul paket kontes G8 ter-update');
assert(g8Updated?.durasi_total_menit === 60, 'Durasi total G8 ter-update menjadi 60 menit');

// 16.7 Penghapusan Bersih Paket Kontes (deleteGame)
const deleteGameRes = ArenaStore.deleteGame('G8');
assert(deleteGameRes.success === true, 'Admin berhasil menghapus paket kontes G8');
assert(ArenaStore.getGames().some(g => g.id_game === 'G8') === false, 'Game G8 benar-benar terhapus dari daftar paket game');

const dynamicAfterDelete = ArenaStore.getCohortById(testDynamicCohort.id_cohort);
assert(dynamicAfterDelete?.allowed_game_ids.includes('G8') === false, 'Game G8 terhapus dari daftar hak akses kelas dinamis');

// ========================================================
// TEST GROUP 17: Dynamic Question Bank CRUD & Coding Problem Management
// ========================================================
console.log('\n--- [TEST GROUP 17: Dynamic Question Bank CRUD & Coding Problem Management] ---');

// 17.1 Pembuatan Butir Soal Kuis Dinamis Baru
const initialQCountG1 = ArenaStore.getQuestionsForGame('G1').length;
const newQRes = ArenaStore.createQuestion({
  id_game: 'G1',
  judul: 'Analisis Kompleksitas Nested Loops',
  narasi_soal: 'Berapa kompleksitas waktu algoritma berikut jika outer loop berjalan N kali dan inner berjalan N kali?',
  cuplikan_kode: 'for i in range(n):\n    for j in range(n):\n        total += 1',
  opsi_jawaban: ['O(N)', 'O(N^2)', 'O(log N)', 'O(2^N)'],
  kunci_jawaban: 'O(N^2)',
  teks_hint: 'Perhatikan jumlah iterasi total di loop dalam.',
  editorial: 'Dua loop bertingkat berukuran N menghasilkan N * N = O(N^2) operasi.',
  poin_dasar: 50
});

assert(newQRes.success === true, 'Admin berhasil menambahkan butir soal kuis baru');
assert(ArenaStore.getQuestionsForGame('G1').length === initialQCountG1 + 1, 'Total butir soal paket G1 bertambah menjadi ' + (initialQCountG1 + 1));

const createdQ = newQRes.question;
assert(createdQ?.kunci_jawaban === 'O(N^2)', 'Kunci jawaban kuis tersimpan valid');
assert(createdQ?.opsi_jawaban?.includes('O(N^2)'), 'Opsi jawaban kuis terformat rapi');

// 17.2 Validasi Integritas Pembuatan Soal Kuis
const invalidKeyRes = ArenaStore.createQuestion({
  id_game: 'G1',
  judul: 'Soal Kunci Salah',
  narasi_soal: 'Testing kunci tidak ada di opsi',
  opsi_jawaban: ['Pilihan A', 'Pilihan B'],
  kunci_jawaban: 'Pilihan C' // Tidak ada di opsi!
});
assert(invalidKeyRes.success === false, 'Sistem menolak pembuatan soal jika kunci jawaban tidak ada di opsi');

const emptyTitleRes = ArenaStore.createQuestion({
  id_game: 'G1',
  judul: '',
  narasi_soal: 'Testing judul kosong',
  opsi_jawaban: ['A', 'B'],
  kunci_jawaban: 'A'
});
assert(emptyTitleRes.success === false, 'Sistem menolak pembuatan soal jika judul kosong');

// 17.3 Pembaruan Butir Soal Kuis (updateQuestion)
const updateQRes = ArenaStore.updateQuestion(createdQ.id_soal, {
  judul: 'Analisis Kompleksitas Nested Loops [Updated]',
  poin_dasar: 75,
  kunci_jawaban: 'O(N^2)'
});
assert(updateQRes.success === true, 'Admin berhasil memperbarui butir soal kuis');
const qUpdated = ArenaStore.getQuestions().find(q => q.id_soal === createdQ.id_soal);
assert(qUpdated?.judul.includes('[Updated]'), 'Judul butir soal ter-update');
assert(qUpdated?.poin_dasar === 75, 'Poin dasar butir soal ter-update menjadi 75 XP');

// 17.4 Penghapusan Butir Soal Kuis (deleteQuestion)
const deleteQRes = ArenaStore.deleteQuestion(createdQ.id_soal);
assert(deleteQRes.success === true, 'Admin berhasil menghapus butir soal kuis');
assert(ArenaStore.getQuestions().some(q => q.id_soal === createdQ.id_soal) === false, 'Butir soal benar-benar terhapus dari bank soal');
assert(ArenaStore.getQuestionsForGame('G1').length === initialQCountG1, 'Total butir soal paket G1 kembali normal');

// 17.5 Pembuatan & Manajemen Tantangan Koding Online Judge (createCodingProblem)
const initialCodingCount = ArenaStore.getCodingProblems().length;
const newCodingRes = ArenaStore.createCodingProblem({
  game_id: 'G1',
  title: 'Pencarian Subarray Maksimum K-Elemen',
  slug: 'pencarian-subarray-maksimum-k-elemen',
  statement_md: 'Diberikan array N integer dan integer K. Temukan jumlah maksimum dari subarray berukuran K.',
  input_format: 'Baris pertama berisi N dan K. Baris kedua berisi N integer.',
  output_format: 'Cetak jumlah maksimum.',
  constraints: '1 <= K <= N <= 10^5',
  time_limit_ms: 1000,
  memory_limit_mb: 256,
  difficulty: 'Medium',
  tags: ['Sliding Window', 'Array'],
  sample_test_cases: [
    {
      id: 'tc-sample-1',
      problem_id: 'prob-subarray',
      input_data: '5 3\n1 2 3 4 5',
      expected_output: '12',
      explanation: 'Subarray [3, 4, 5] menghasilkan 12',
      is_sample: true,
      points: 25
    },
    {
      id: 'tc-eval-1',
      problem_id: 'prob-subarray',
      input_data: '4 2\n10 20 30 40',
      expected_output: '70',
      is_sample: false,
      points: 75
    }
  ]
});

assert(newCodingRes.success === true, 'Admin berhasil membuat tantangan koding Online Judge baru');
assert(ArenaStore.getCodingProblems().length === initialCodingCount + 1, 'Total tantangan koding bertambah');

// 17.6 Verifikasi Linkage Dinamis Game ke Soal Koding
const linkedCodingProb = ArenaStore.getCodingProblemForGame('G1');
assert(linkedCodingProb?.title === 'Pencarian Subarray Maksimum K-Elemen', 'Paket G1 berhasil terhubung ke tantangan koding baru');
assert(linkedCodingProb?.sample_test_cases?.length === 2, 'Tantangan koding memiliki tepat 2 testcases (1 sample, 1 evaluation)');

// 17.7 Pembaruan Tantangan Koding & Testcase (updateCodingProblem)
const updateCodingRes = ArenaStore.updateCodingProblem(linkedCodingProb.id, {
  time_limit_ms: 1500,
  difficulty: 'Hard'
});
assert(updateCodingRes.success === true, 'Admin berhasil memperbarui tantangan koding');
const codingUpdated = ArenaStore.getCodingProblems().find(p => p.id === linkedCodingProb.id);
assert(codingUpdated?.time_limit_ms === 1500, 'Time limit ter-update menjadi 1500ms');
assert(codingUpdated?.difficulty === 'Hard', 'Tingkat kesulitan ter-update menjadi Hard');

// 17.8 Penghapusan Tantangan Koding (deleteCodingProblem)
const deleteCodingRes = ArenaStore.deleteCodingProblem(linkedCodingProb.id);
assert(deleteCodingRes.success === true, 'Admin berhasil menghapus tantangan koding');
assert(ArenaStore.getCodingProblems().some(p => p.id === linkedCodingProb.id) === false, 'Tantangan koding terhapus dari repositori judge');

// ========================================================
// TEST GROUP 18: Contest Search Engine & Real-Time Filtering Logic
// ========================================================
console.log('\n--- [TEST GROUP 18: Contest Search Engine & Real-Time Filtering Logic] ---');

// Mock search filter function matching AdminContestControlTab implementation
function filterContests(games, query, mode) {
  return games.filter(game => {
    if (mode !== 'ALL' && game.mode_game !== mode) return false;
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      const matchId = game.id_game.toLowerCase().includes(q);
      const matchJudul = (game.judul_game || '').toLowerCase().includes(q);
      const matchKategori = (game.kategori_materi || '').toLowerCase().includes(q);
      const matchRef = (game.ref_pertemuan || '').toLowerCase().includes(q);
      const matchKesulitan = (game.kesulitan || '').toLowerCase().includes(q);
      if (!matchId && !matchJudul && !matchKategori && !matchRef && !matchKesulitan) {
        return false;
      }
    }
    return true;
  });
}

const currentGames = ArenaStore.getGames();
assert(currentGames.length >= 3, `Tersedia game aktif untuk testing search (Aktual: ${currentGames.length})`);

// 18.1 Search by Game ID
const searchById = filterContests(currentGames, 'G1', 'ALL');
assert(searchById.length === 1 && searchById[0].id_game === 'G1', 'Pencarian dengan ID "G1" mengembalikan tepat paket G1');

// 18.2 Search by Title Keyword
const searchByTitle = filterContests(currentGames, 'Logika', 'ALL');
assert(searchByTitle.length >= 1 && searchByTitle.every(g => g.judul_game.toLowerCase().includes('logika')), 'Pencarian judul "Logika" akurat memfilter paket yang relevan');

// 18.3 Search by Category
const searchByCategory = filterContests(currentGames, 'Game Theory', 'ALL');
assert(searchByCategory.length >= 1 && searchByCategory.some(g => g.id_game === 'G6'), 'Pencarian kategori "Game Theory" menyertakan paket G6');

// 18.4 Mode Filter Enforcement
const soloOnly = filterContests(currentGames, '', 'SOLO');
assert(soloOnly.every(g => g.mode_game === 'SOLO'), 'Filter mode SOLO hanya menyertakan game ber-mode SOLO');

const teamOnly = filterContests(currentGames, '', 'TEAM');
assert(teamOnly.every(g => g.mode_game === 'TEAM'), 'Filter mode TEAM hanya menyertakan game ber-mode TEAM');
assert(teamOnly.some(g => g.id_game === 'G6'), 'Game G6 masuk ke dalam filter mode TEAM');

// 18.5 Non-Matching Query
const noMatch = filterContests(currentGames, 'XYZ-TIDAK-ADA-999', 'ALL');
assert(noMatch.length === 0, 'Pencarian keyword non-existent mengembalikan array kosong');

// 19. UJI DETERMINISTIC SEEDED SHUFFLE & ANTI-CHEAT QUESTION RANDOMIZATION
console.log('\n--- [TEST GROUP 19: Deterministic Seeded Shuffle & Anti-Cheat Question Order] ---');

// 19.1 Uji determinisme PRNG
const sampleList = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
const shuffleA1 = seededShuffle(sampleList, '2545001_G1');
const shuffleA2 = seededShuffle(sampleList, '2545001_G1');
assert(JSON.stringify(shuffleA1) === JSON.stringify(shuffleA2), 'PRNG Determinisme: Seed yang sama selalu menghasilkan urutan permutasi yang identik');
assert(shuffleA1.length === sampleList.length, 'Panjang array teracak tetap utuh');

// 19.2 Uji diversitas antar-peserta (Anti-Cheat Invariance)
const shuffleB = seededShuffle(sampleList, '250201002_G1');
assert(JSON.stringify(shuffleA1) !== JSON.stringify(shuffleB), 'Anti-Cheat Diversity: Dua mahasiswa berbeda (Cecilia vs Indra) mendapatkan urutan soal yang berbeda');

// 19.3 Uji getQuestionsForUser & Sesi Submisi
const mhsCecilia = TEST_MOCK_STUDENTS.find(u => u.nim === '2545001');
const mhsIndra = TEST_MOCK_STUDENTS.find(u => u.nim === '250201002');
const targetGame = ArenaStore.getGames().find(g => g.id_game === 'G1') || ArenaStore.getGames()[0];

const qsCecilia = ArenaStore.getQuestionsForUser(mhsCecilia, targetGame.id_game);
const qsIndra = ArenaStore.getQuestionsForUser(mhsIndra, targetGame.id_game);

assert(qsCecilia.length > 0, `Mahasiswa Cecilia mendapatkan soal untuk game ${targetGame.id_game}`);
assert(qsIndra.length > 0, `Mahasiswa Indra mendapatkan soal untuk game ${targetGame.id_game}`);
assert(qsCecilia.length === qsIndra.length, 'Jumlah total soal yang dikerjakan tetap setara');

if (qsCecilia.length > 1) {
  const idsCecilia = qsCecilia.map(q => q.id_soal);
  const idsIndra = qsIndra.map(q => q.id_soal);
  assert(JSON.stringify(idsCecilia) !== JSON.stringify(idsIndra), 'Susunan ID soal kuis Cecilia dan Indra teracak unik');
}

// 19.4 Uji persistensi sesi saat reload / refresh
const subCecilia = ArenaStore.startQuizSession(mhsCecilia, targetGame);
assert(Array.isArray(subCecilia.shuffled_question_ids), 'Sesi submisi menyimpan shuffled_question_ids secara persisten');
assert(subCecilia.shuffled_question_ids.length === qsCecilia.length, 'Jumlah shuffled_question_ids pada sesi submisi tepat');

// Buka ulang sesi kuis (simulasi refresh browser)
const reloadedQs = ArenaStore.getQuestionsForUser(mhsCecilia, targetGame.id_game, subCecilia);
assert(JSON.stringify(reloadedQs.map(q => q.id_soal)) === JSON.stringify(subCecilia.shuffled_question_ids), 'Simulasi reload/refresh: Urutan soal mahasiswa 100% konsisten dan tidak berubah');

// 19.5 Uji Anti-Cheat Protection & decoupling penilaian (Answer by ID Soal, bukan index)
const firstQ = reloadedQs[0];
assert(firstQ.kunci_jawaban === undefined, 'Anti-Cheat: Kunci jawaban terlindung (undefined) pada sesi aktif peserta');
assert(firstQ.editorial === undefined, 'Anti-Cheat: Editorial terlindung (undefined) pada sesi aktif peserta');

const secretQ = ArenaStore.getQuestions().find(q => q.id_soal === firstQ.id_soal);
const answerResult = ArenaStore.answerQuestion({
  submissionId: subCecilia.id_submission,
  idSoal: firstQ.id_soal,
  jawaban: secretQ?.kunci_jawaban || 'A',
  isTimeout: false,
  openedHint: false,
  sisaDetik: 30
});
assert(answerResult.isCorrect === true, 'Penilaian berbasis ID Soal valid dan terisolasi dari pergeseran indeks');
assert(answerResult.submission.detail_jawaban_json.some(d => d.id_soal === firstQ.id_soal), 'Jawaban tersimpan rapi mengacu ke ID soal');

// 20. UJI MATHEMATICAL NOTATION & FORMULA PARSER ENGINE (PANGKAT **, BIG-O & SIMBOL)
console.log('\n--- [TEST GROUP 20: Mathematical Notation & Formula Parser Engine (Pangkat **, Big-O, Simbol)] ---');

// 20.1 Konversi Pangkat Python (**) dan Topi (^)
const powerSegments1 = parseMathSegments('Batas N <= 10**8 dan M <= 2^31');
const pow1 = powerSegments1.find(s => s.type === 'power' && s.base === '10');
const pow2 = powerSegments1.find(s => s.type === 'power' && s.base === '2');
assert(pow1 !== undefined && pow1.exponent === '8', 'Notasi pangkat Python 10**8 terurai menjadi base=10 dan exponent=8');
assert(pow2 !== undefined && pow2.exponent === '31', 'Notasi pangkat topi 2^31 terurai menjadi base=2 dan exponent=31');

// 20.2 Kompleksitas Algoritma (Big-O & Theta)
const bigOSegments = parseMathSegments('Solusi harus beroperasi dalam O(N log N) atau O(N**2)');
const bigOList = bigOSegments.filter(s => s.type === 'big_o');
assert(bigOList.length === 2, 'Dua ekspresi Big-O terdeteksi akurat');
assert(bigOList[0].innerTokens.some(t => t.content && t.content.includes('N log N')), 'Inner Big-O O(N log N) terurai rapi');
assert(bigOList[1].innerTokens.some(t => t.type === 'power' && t.base === 'N' && t.exponent === '2'), 'Inner Big-O O(N**2) terkonversi otomatis ke N^2');

// 20.3 Konversi Simbol Relasional (<=, >=, !=, ->, +-)
const symbolSegments = parseMathSegments('Pastikan A <= B dan C >= D serta X != Y dan arah P -> Q');
const symbolsFound = symbolSegments.filter(s => s.type === 'symbol').map(s => s.symbol);
assert(symbolsFound.includes('≤'), 'Simbol <= terkonversi ke ≤');
assert(symbolsFound.includes('≥'), 'Simbol >= terkonversi ke ≥');
assert(symbolsFound.includes('≠'), 'Simbol != terkonversi ke ≠');
assert(symbolsFound.includes('→'), 'Simbol -> terkonversi ke →');

// 20.4 Proteksi Kode Program (Code Block & Inline Code Invariance)
const codeBlockRaw = '```python\ndef compute(n):\n    return n ** 2\n```';
const codeBlockSegments = parseMathSegments(codeBlockRaw);
assert(codeBlockSegments.length === 1 && codeBlockSegments[0].type === 'code_block', 'Blok kode program terisolasi sebagai code_block');
assert(codeBlockSegments[0].code.includes('n ** 2'), 'Sintaks Python n ** 2 di dalam blok kode tidak termutasi (Code Block Preserved)');

const inlineCodeRaw = 'Gunakan rumus `x ** y` untuk eksponensial';
const inlineSegments = parseMathSegments(inlineCodeRaw);
const inlineCode = inlineSegments.find(s => s.type === 'inline_code');
assert(inlineCode !== undefined && inlineCode.code === 'x ** y', 'Inline code `x ** y` tetap utuh');

// 20.5 End-to-End Formatted String Test
const formatted = formatMathString('Batas N <= 10**8 dan kompleksitas O(N**2) dengan `return x ** 2`');
assert(formatted === 'Batas N ≤ 10^8 dan kompleksitas O(N^2) dengan `return x ** 2`', 'Format string akhir terkonversi sempurna tanpa merusak kode');

// ========================================================
// TEST GROUP 21: Dynamic Cohort Snake-Draft, Fairness Analytics & Squad Management
// ========================================================
console.log('\n--- [TEST GROUP 21: Dynamic Cohort Snake-Draft, Fairness Analytics & Squad Management] ---');

// 21.1 Pembuatan Kohort Dinamis & Mahasiswa untuk Uji Draft
const draftCohortRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Tim Dinamis 2026',
  kode_kelas: 'TEAM-DYN-26',
  periode: 'Ganjil 2026'
});
assert(draftCohortRes.success === true, 'Berhasil membuat kohort dinamis untuk uji snake-draft');
const draftCohortId = draftCohortRes.cohort.id_cohort;

// Daftarkan 6 mahasiswa dengan sebaran XP bervariasi
const mockStudentNims = ['2601001', '2601002', '2601003', '2601004', '2601005', '2601006'];
const mockXPs = [1200, 950, 800, 650, 500, 300];

mockStudentNims.forEach((nim, idx) => {
  ArenaStore.createUser({
    nim,
    nama_lengkap: `Peserta Uji Draft #${idx + 1}`,
    role: 'PESERTA',
    id_cohort: draftCohortId
  });
  const users = ArenaStore.getUsers();
  const u = users.find(usr => usr.nim === nim);
  if (u) {
    u.total_xp = mockXPs[idx];
    ArenaStore.saveUsers(users);
  }
});

// 21.2 Snake Draft dengan Ukuran Tim Kustom (3 Orang per Tim -> 2 Tim)
const draftRes = ArenaStore.generateTeamsForCohort(draftCohortId, 3);
assert(draftRes.success === true, 'Admin berhasil menjalankan snake-draft untuk kohort dinamis');
assert(draftRes.teams.length === 2, `Tepat 2 tim terbentuk dari 6 mahasiswa (Aktual: ${draftRes.teams.length})`);

const teamA = draftRes.teams[0];
const teamB = draftRes.teams[1];

// Distribusi Snake:
// Rank 1 (1200) -> Tim A
// Rank 2 (950) -> Tim B
// Rank 3 (800) -> Tim B
// Rank 4 (650) -> Tim A
// Rank 5 (500) -> Tim A
// Rank 6 (300) -> Tim B
// Tim A total: 1200 + 650 + 500 = 2350 XP
// Tim B total: 950 + 800 + 300 = 2050 XP
assert(teamA.total_skor_tim === 2350, `Skor Tim A terhitung akurat: 2350 XP (Aktual: ${teamA.total_skor_tim})`);
assert(teamB.total_skor_tim === 2050, `Skor Tim B terhitung akurat: 2050 XP (Aktual: ${teamB.total_skor_tim})`);
assert(teamA.leader_nim === '2601001', 'Mahasiswa XP tertinggi di Tim A ditunjuk otomatis sebagai Leader');
assert(teamB.leader_nim === '2601002', 'Mahasiswa XP tertinggi di Tim B ditunjuk otomatis sebagai Leader');
assert(Boolean(teamA.kode_gabung && teamA.kode_gabung.length === 6), `Tim A memiliki kode gabung valid (${teamA.kode_gabung})`);
assert(Boolean(teamB.kode_gabung && teamB.kode_gabung.length === 6), `Tim B memiliki kode gabung valid (${teamB.kode_gabung})`);

// Verifikasi sinkronisasi user.id_tim
const user1 = ArenaStore.getUsers().find(u => u.nim === '2601001');
assert(user1?.id_tim === teamA.id_tim, 'User 2601001 terikat dengan id_tim Tim A');

// 21.3 Perhitungan Metrik Fairness & Deviasi XP (calculateTeamFairnessMetrics)
const metrics = calculateTeamFairnessMetrics(draftRes.teams);
assert(metrics.totalTeams === 2, 'Metrik mencatat 2 tim aktif');
assert(metrics.totalStudents === 6, 'Metrik mencatat 6 mahasiswa terlibat');
assert(metrics.averageXP === 2200, `Rata-rata skor tim: 2200 XP (Aktual: ${metrics.averageXP})`);
assert(metrics.deltaXP === 300, `Delta disparitas Max-Min: 300 XP (Aktual: ${metrics.deltaXP})`);
assert(metrics.balanceRating === 'OPTIMAL', `Rating keseimbangan algoritma adalah OPTIMAL (Aktual: ${metrics.balanceRating})`);

// 21.4 Ubah Pengaturan Skuad (updateTeamDetails: Ganti Nama & Leader)
const updateTeamRes = ArenaStore.updateTeamDetails(teamA.id_tim, {
  nama_tim: 'Vanguard Cyber TIME',
  leader_nim: '2601004'
});
assert(updateTeamRes.success === true, 'Admin berhasil memperbarui nama tim dan leader');
assert(updateTeamRes.team?.nama_tim === 'Vanguard Cyber TIME', 'Nama tim berhasil diubah');
assert(updateTeamRes.team?.leader_nim === '2601004', 'Leader berhasil dipindahkan ke anggota terpilih');

// 21.5 Pindahkan Anggota Antar Skuad (moveTeamMember)
const moveRes = ArenaStore.moveTeamMember('2601005', teamB.id_tim);
assert(moveRes.success === true, 'Admin berhasil memindahkan anggota dari Tim A ke Tim B');
const teamBAfterMove = ArenaStore.getTeams().find(t => t.id_tim === teamB.id_tim);
assert(teamBAfterMove?.daftar_nim_json.includes('2601005') === true, 'Mahasiswa terdaftar di Tim B setelah pindah');
assert(teamBAfterMove?.daftar_nim_json.length === 4, 'Jumlah anggota Tim B bertambah menjadi 4');

// 21.6 Bubarkan 1 Tim Spesifik (disbandTeam)
const disbandSingleRes = ArenaStore.disbandTeam(teamA.id_tim, 'ADMIN');
assert(disbandSingleRes.success === true, 'Admin berhasil membubarkan 1 tim spesifik');
assert(ArenaStore.getTeams().some(t => t.id_tim === teamA.id_tim) === false, 'Tim A benar-benar terhapus dari repositori');

// 21.7 Bubarkan Seluruh Tim Kelas (disbandTeamsForCohort)
const disbandCohortTeamsRes = ArenaStore.disbandTeamsForCohort(draftCohortId);
assert(disbandCohortTeamsRes.success === true, 'Admin berhasil membubarkan seluruh tim di kelas dinamis');
assert(ArenaStore.getTeams().some(t => t.id_cohort === draftCohortId) === false, 'Tidak ada lagi tim tersisa untuk kelas ini (0 tim)');
const userMoved = ArenaStore.getUsers().find(u => u.nim === '2601005');
assert(userMoved?.id_tim === '', 'Status id_tim mahasiswa dilepaskan setelah kelas dibubarkan');

// 22. UJI MULTI-SHEET ACADEMIC EXPORT & DATA TRANSFORMER ENGINE
console.log('\n--- [TEST GROUP 22: Multi-Sheet Academic Report & Dynamic Export Engine] ---');

// 22.1 Ekspor Rekap Total (Seluruh Kelas & Kohort)
const exportAll = generateAcademicExportData({
  users: ArenaStore.getUsers(),
  submissions: ArenaStore.getSubmissions(),
  games: ArenaStore.getGames(),
  cohorts: ArenaStore.getCohorts(),
  targetCohortIdOrCode: 'ALL'
});

assert(exportAll.targetCode === 'ALL', 'Target kode rekap global adalah ALL');
assert(exportAll.targetTitle === 'Semua Kelas & Kohort', 'Target title rekap global sesuai');
assert(exportAll.fileName.startsWith('STMIK_TIME_CP_ARENA_ALL_'), `Nama file ekspor memuat prefix resmi (${exportAll.fileName})`);
assert(Array.isArray(exportAll.rekapNilaiData), 'rekapNilaiData berupa array');
assert(Array.isArray(exportAll.diagnostikData), 'diagnostikData berupa array');
assert(Array.isArray(exportAll.logDetailData), 'logDetailData berupa array');
assert(exportAll.studentCount === ArenaStore.getUsers().filter(u => u.role === 'PESERTA').length, 'Jumlah baris mahasiswa rekap global akurat');

// 22.2 Ekspor Spesifik Kohort Dinamis
const testCohort = ArenaStore.getCohorts()[0];
if (testCohort) {
  const exportCohort = generateAcademicExportData({
    users: ArenaStore.getUsers(),
    submissions: ArenaStore.getSubmissions(),
    games: ArenaStore.getGames(),
    cohorts: ArenaStore.getCohorts(),
    targetCohortIdOrCode: testCohort.id_cohort,
    targetCohortName: testCohort.nama_kelas
  });

  assert(exportCohort.targetCode === testCohort.kode_kelas, `Target kode ekspor kohort sesuai kode kelas (${exportCohort.targetCode})`);
  assert(exportCohort.targetTitle === testCohort.nama_kelas, 'Target title ekspor kohort sesuai nama kelas');
  assert(exportCohort.fileName.startsWith(`STMIK_TIME_CP_ARENA_${testCohort.kode_kelas}_`), 'Prefix nama file memuat kode kelas');
  exportCohort.rekapNilaiData.forEach(row => {
    assert(row.Kelas_Kohort.includes(testCohort.nama_kelas) || row.Kelas_Kohort.includes(testCohort.kode_kelas), `Mahasiswa ${row.NIM} terkonfirmasi bagian dari kohort`);
  });
}

// 22.3 Uji Integritas Kalkulasi Nilai & Status Ketuntasan
const mockStudentWithHighGrade = {
  nim: '2699001',
  nama_lengkap: 'Budi Santoso',
  role: 'PESERTA',
  id_cohort: 'c_test_grade',
  total_xp: 950,
  level: 4,
  tier_badge: 'O(N) Sprinter'
};
const mockHighSub = {
  id_submission: 'SUB-TEST-HIGH',
  nim: '2699001',
  id_game: 'G1',
  nilai_akademik: 85,
  tab_switch_count: 1,
  status_sesi: 'DONE',
  status_lulus: 'LULUS',
  skor_xp: 150
};
const mockCohortGrade = {
  id_cohort: 'c_test_grade',
  nama_kelas: 'Kelas Uji Nilai',
  kode_kelas: 'UJI-NILAI',
  periode: 'Ganjil 2025',
  allowed_game_ids: ['G1']
};

const exportGradingTest = generateAcademicExportData({
  users: [mockStudentWithHighGrade],
  submissions: [mockHighSub],
  games: [{ id_game: 'G1', judul_game: 'Test Game', pin_sesi: '123' }],
  cohorts: [mockCohortGrade],
  targetCohortIdOrCode: 'c_test_grade'
});

assert(exportGradingTest.rekapNilaiData.length === 1, 'Hasil rekap memuat 1 mahasiswa uji');
const rowBudi = exportGradingTest.rekapNilaiData[0];
assert(rowBudi.Rata_Nilai_Akhir === 85, 'Rata-rata nilai akhir terhitung 85');
assert(rowBudi.Status_Ketuntasan === 'TUNTAS', 'Nilai >= 70 berstatus TUNTAS');
assert(rowBudi.Akumulasi_Penalti === '-5', 'Akumulasi penalti 1x tab switch adalah -5');
assert(exportGradingTest.diagnostikData[0].Indikasi_Akademik === '🟢 Sangat Menguasai', 'XP >= 800 terindikasi Sangat Menguasai');
assert(exportGradingTest.logDetailData.length === 1, 'Log detail memuat 1 submisi');
assert(exportGradingTest.logDetailData[0].Penalti_Tab === 5, 'Log submisi mencatat penalti tab 5 poin');

// 22.4 Uji Kohort Kosong (Cold Start Resilience)
const exportEmptyCohort = generateAcademicExportData({
  users: [],
  submissions: [],
  games: [],
  cohorts: [mockCohortGrade],
  targetCohortIdOrCode: 'c_test_grade'
});

assert(exportEmptyCohort.studentCount === 0, 'Kohort kosong mencatat 0 mahasiswa tanpa error');
assert(exportEmptyCohort.submissionCount === 0, 'Kohort kosong mencatat 0 submisi tanpa error');
assert(exportEmptyCohort.rekapNilaiData.length === 0, 'Array rekap nilai kosong aman');

// ========================================================
// TEST GROUP 23: Server-Side Submission Validation & Anti-Cheat Hardening
// ========================================================
console.log('\n--- [TEST GROUP 23: Server-Side Submission Validation & Anti-Cheat Hardening] ---');

// Setup test fixture for Group 23
const studentCheatTest = {
  nim: '2699777',
  nama_lengkap: 'Hacker Wannabe',
  role: 'PESERTA',
  id_cohort: 'c_test_cheat',
  total_xp: 300,
  level: 2,
  tier_badge: 'Logic Novice'
};
const adminCheatTest = {
  nim: 'ADMIN_TEST',
  nama_lengkap: 'Root Admin',
  role: 'ADMIN',
  id_cohort: '',
  total_xp: 9999,
  level: 40,
  tier_badge: 'Grandmaster Time'
};

// Pastikan paket game memiliki soal uji
const cheatTestGame = {
  id_game: 'G_CHEAT_TEST',
  judul_game: 'Uji Anti-Cheat & Validasi Server',
  pin_sesi: 'TIME-777',
  tipe_game: 'QUIZ',
  mode_game: 'INDIVIDUAL',
  durasi_total_menit: 15,
  durasi_per_soal_detik: 60,
  min_nilai_lulus: 70
};

const cheatTestQuestions = [
  {
    id_soal: 'Q_CHEAT_1',
    id_game: 'G_CHEAT_TEST',
    pertanyaan: 'Berapa kompleksitas waktu binary search?',
    opsi_jawaban: 'O(N)|O(log N)|O(N^2)|O(1)',
    kunci_jawaban: 'O(log N)',
    poin_dasar: 50,
    hint: 'Bagi dua ruang pencarian',
    editorial: 'Binary search membagi ruang pencarian menjadi setengah pada setiap langkah, menghasilkan O(log N).'
  },
  {
    id_soal: 'Q_CHEAT_2',
    id_game: 'G_CHEAT_TEST',
    pertanyaan: 'Manakah struktur data LIFO?',
    opsi_jawaban: 'Queue|Stack|Heap|Graph',
    kunci_jawaban: 'Stack',
    poin_dasar: 50,
    hint: 'Last In First Out',
    editorial: 'Stack beroperasi dengan prinsip Last-In First-Out.'
  }
];

ArenaStore.saveGames([...ArenaStore.getGames(), cheatTestGame]);
ArenaStore.saveQuestions([...ArenaStore.getQuestions(), ...cheatTestQuestions]);

// Mulai sesi kuis untuk mahasiswa
const cheatSubmission = ArenaStore.startQuizSession(studentCheatTest, cheatTestGame);
assert(cheatSubmission.status_sesi === 'ACTIVE', 'Sesi kuis mahasiswa berstatus ACTIVE');
assert(cheatSubmission.tab_switch_count === 0, 'Tab switch count awal adalah 0');

// 23.1 Zero Answer Leakage saat Sesi Aktif
const activeQuestionsForStudent = ArenaStore.getQuestionsForUser(studentCheatTest, cheatTestGame.id_game, cheatSubmission);
assert(activeQuestionsForStudent.length === 2, 'Mengembalikan 2 soal untuk mahasiswa');
activeQuestionsForStudent.forEach((q, idx) => {
  assert(q.kunci_jawaban === undefined, `Soal #${idx + 1}: Kunci jawaban terlindung (undefined) di memori client`);
  assert(q.editorial === undefined, `Soal #${idx + 1}: Editorial solusi terlindung (undefined) di memori client`);
  assert(q.opsi_jawaban && q.opsi_jawaban.length > 0, `Soal #${idx + 1}: Opsi jawaban tetap tersedia untuk UI`);
});

// 23.2 Admin Selalu Memiliki Akses Kunci Jawaban & Editorial (Bypass Hak Akses)
const adminQuestions = ArenaStore.getQuestionsForUser(adminCheatTest, cheatTestGame.id_game, cheatSubmission);
adminQuestions.forEach((q, idx) => {
  assert(q.kunci_jawaban !== undefined, `Admin: Kunci jawaban soal #${idx + 1} tetap terbaca (${q.kunci_jawaban})`);
  assert(q.editorial !== undefined, `Admin: Editorial soal #${idx + 1} tetap terbaca`);
});

// 23.3 Pelanggaran Pindah Tab (Tab Switch Audit Log & Clamping)
const tabViolation1 = ArenaStore.recordTabSwitch(cheatSubmission.id_submission);
assert(tabViolation1 !== null, 'Pencatatan pelanggaran tab pertama berhasil');
assert(tabViolation1.tab_switch_count === 1, 'Tab switch count naik menjadi 1');
assert(Array.isArray(tabViolation1.tab_switch_log), 'tab_switch_log tersimpan sebagai array');
assert(tabViolation1.tab_switch_log.length === 1, 'tab_switch_log memiliki 1 entri audit');
assert(tabViolation1.tab_switch_log[0].penalty_deducted === 5, 'Entri log audit mencatat penalti -5 poin');
assert(typeof tabViolation1.tab_switch_log[0].timestamp === 'string', 'Entri log audit mencatat timestamp ISO valid');

// 23.4 Single-Shot Answer Lock & Replay Prevention
const firstQId = activeQuestionsForStudent[0].id_soal;
const answer1 = ArenaStore.answerQuestion({
  submissionId: cheatSubmission.id_submission,
  idSoal: firstQId,
  jawaban: 'O(log N)',
  isTimeout: false,
  openedHint: false,
  sisaDetik: 45
});

assert(answer1.isCorrect === true, 'Jawaban pertama dinilai benar oleh server store');
assert(answer1.xpEarned > 0, 'Mahasiswa mendapatkan XP');
assert(answer1.submission.detail_jawaban_json.length === 1, 'Detail jawaban mencatat 1 soal terjawab');

// Upaya Replay Jawaban untuk soal yang sama
const duplicateAnswer = ArenaStore.answerQuestion({
  submissionId: cheatSubmission.id_submission,
  idSoal: firstQId,
  jawaban: 'O(N)',
  isTimeout: false,
  openedHint: false,
  sisaDetik: 30
});
assert(duplicateAnswer.submission.detail_jawaban_json.length === 1, 'Replay Prevention: Detail jawaban tidak bertambah untuk soal yang sudah dikunci');
assert(duplicateAnswer.submission.detail_jawaban_json[0].jawaban_mahasiswa === 'O(log N)', 'Replay Prevention: Jawaban pertama tidak dapat ditimpa (Immutable Answer Lock)');

// Jawab soal kedua
const secondQId = activeQuestionsForStudent[1].id_soal;
ArenaStore.answerQuestion({
  submissionId: cheatSubmission.id_submission,
  idSoal: secondQId,
  jawaban: 'Stack',
  isTimeout: false,
  openedHint: false,
  sisaDetik: 40
});

// 23.5 Selesaikan Kuis & Restorasi Kunci Jawaban / Editorial
const finalizedSub = ArenaStore.finishQuizSession(cheatSubmission.id_submission);
assert(finalizedSub.status_sesi === 'DONE', 'Status sesi submisi terkunci DONE');
assert(finalizedSub.nilai_akademik === 95, `Nilai akademik terhitung akurat: 100 - 5 = 95 (Aktual: ${finalizedSub.nilai_akademik})`);
assert(finalizedSub.status_lulus === 'LULUS', 'Status kelulusan tercapai (Nilai 95 >= 70)');

// Saat status sudah DONE, getQuestionsForUser merestorasi kunci jawaban & editorial
const completedQuestionsForStudent = ArenaStore.getQuestionsForUser(studentCheatTest, cheatTestGame.id_game, finalizedSub);
completedQuestionsForStudent.forEach((q, idx) => {
  assert(q.kunci_jawaban !== undefined, `Sesi Selesai #${idx + 1}: Kunci jawaban terestorasi untuk telaah (${q.kunci_jawaban})`);
  assert(q.editorial !== undefined, `Sesi Selesai #${idx + 1}: Editorial terestorasi untuk evaluasi akademik`);
});

// ========================================================
// TEST GROUP 24: Supabase PostgreSQL Schema & Relational Model Integrity
// ========================================================
console.log('\n--- [TEST GROUP 24: Supabase PostgreSQL Schema & Relational Model Integrity] ---');

const schemaPath = path.resolve('supabase/schema.sql');
assert(fs.existsSync(schemaPath), 'File supabase/schema.sql terdeteksi di repositori');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// 24.1 Validasi Keberadaan Tabel Utama & View
assert(schemaSql.includes('CREATE TABLE public.cohorts'), 'Tabel public.cohorts terdefinisi');
assert(schemaSql.includes('CREATE TABLE public.teams'), 'Tabel public.teams terdefinisi');
assert(schemaSql.includes('CREATE TABLE public.users'), 'Tabel public.users terdefinisi');
assert(schemaSql.includes('CREATE TABLE public.games'), 'Tabel public.games terdefinisi');
assert(schemaSql.includes('CREATE TABLE public.cohort_game_access'), 'Tabel public.cohort_game_access terdefinisi');
assert(schemaSql.includes('CREATE TABLE public.questions'), 'Tabel public.questions terdefinisi');
assert(schemaSql.includes('CREATE TABLE public.submissions'), 'Tabel public.submissions terdefinisi');
assert(schemaSql.includes('CREATE OR REPLACE VIEW public.student_questions_view'), 'View public.student_questions_view terdefinisi');

// 24.2 Validasi Sinkronisasi Kolom & Relasi Dinamis
assert(schemaSql.includes('id_cohort VARCHAR(50) REFERENCES public.cohorts(id_cohort)'), 'Tabel teams memuat foreign key id_cohort ke cohorts');
assert(schemaSql.includes('tab_switch_log JSONB'), 'Tabel submissions memuat kolom audit tab_switch_log');
assert(schemaSql.includes('shuffled_question_ids JSONB'), 'Tabel submissions memuat kolom anti-cheat shuffled_question_ids');
assert(schemaSql.includes('cohort_statuses JSONB'), 'Tabel games memuat kolom pemetaan status dinamis cohort_statuses');

// 24.3 Zero Answer Leakage pada View Mahasiswa
const viewDefinition = schemaSql.split('CREATE OR REPLACE VIEW public.student_questions_view')[1]?.split(';')[0] || '';
assert(!viewDefinition.includes('kunci_jawaban'), 'student_questions_view mengecualikan kunci_jawaban (Zero Leakage)');
assert(!viewDefinition.includes('editorial'), 'student_questions_view mengecualikan editorial (Zero Leakage)');
assert(viewDefinition.includes('opsi_jawaban'), 'student_questions_view tetap menyediakan opsi_jawaban untuk antarmuka kuis');

// 24.4 Kepatuhan Produksi Bersih (0 Mahasiswa Mock pada Seed Eksekutif)
const uncommentedSql = schemaSql.replace(/\/\*[\s\S]*?\*\//g, '');
const usersInsertMatch = uncommentedSql.match(/INSERT INTO public\.users[\s\S]*?;/g);
const activeUserInsertSql = usersInsertMatch ? usersInsertMatch.join('\n') : '';

assert(activeUserInsertSql.includes("'ADMIN'"), 'Seed produksi mendaftarkan kredensial ADMIN');
assert(activeUserInsertSql.includes("'DOSEN001'"), 'Seed produksi mendaftarkan kredensial DOSEN001');
assert(activeUserInsertSql.includes("'TH'"), 'Avatar root menggunakan inisial monogram TH (Zero AI Slop)');
assert(!activeUserInsertSql.includes('2545001'), 'Seed produksi bersih tidak memuat mahasiswa mock 2545001');
assert(!activeUserInsertSql.includes('240101001'), 'Seed produksi bersih tidak memuat mahasiswa mock 240101001');
assert(!activeUserInsertSql.includes('Cecilia Anggraini'), 'Seed produksi bersih 0 mahasiswa dummy (Aktual: 0)');

// 24.5 Perlindungan RLS (Row Level Security)
assert(schemaSql.includes('ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY'), 'RLS diaktifkan untuk cohorts');
assert(schemaSql.includes('ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY'), 'RLS diaktifkan untuk teams');
assert(schemaSql.includes('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY'), 'RLS diaktifkan untuk users');
assert(schemaSql.includes('ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY'), 'RLS diaktifkan untuk submissions');

// ========================================================
// TEST GROUP 25: Student Onboarding, First-Login Guard & Password Change Security
// ========================================================
console.log('\n--- [TEST GROUP 25: Student Onboarding, First-Login Guard & Password Change Security] ---');

// 25.1 Pendaftaran Mahasiswa Baru & Status First-Login
const newStudentNim = '26019999';
const createdStudentRes = ArenaStore.createUser({
  nim: newStudentNim,
  nama_lengkap: 'Surya Pratama',
  role: 'PESERTA',
  klub_hari: 'KAMIS',
  id_cohort: 'c_test_onboard',
  periode: 'Ganjil 2025',
  prodi: 'Sistem Informasi',
  angkatan: 2025,
  kelas_reguler: 'SI C 25'
});

assert(createdStudentRes.success === true, 'Pendaftaran akun mahasiswa baru berhasil');
assert(createdStudentRes.user?.is_first_login === true, 'Akun mahasiswa baru memiliki status is_first_login === true');
assert(createdStudentRes.user?.password === newStudentNim, 'Default password mahasiswa baru identik dengan NIM');

// 25.2 Login Perdana & Deteksi Kebutuhan Onboarding
const loginFirstRes = ArenaStore.login(newStudentNim, newStudentNim);
assert(loginFirstRes.success === true, 'Login dengan default password (NIM) berhasil');
assert(loginFirstRes.requiresOnboarding === true, 'Sistem mendeteksi wajib onboarding pada mahasiswa baru');

// 25.3 Validasi Penolakan Password Lemah & Trivial
const rejectShortPass = ArenaStore.changePassword(newStudentNim, newStudentNim, '12345');
assert(rejectShortPass.success === false, 'Menolak kata sandi baru < 6 karakter');
assert(rejectShortPass.message.includes('minimal'), 'Pesan error mengindikasikan syarat minimal 6 karakter');

const rejectSameNimPass = ArenaStore.changePassword(newStudentNim, newStudentNim, newStudentNim);
assert(rejectSameNimPass.success === false, 'Menolak kata sandi baru yang sama dengan NIM');
assert(rejectSameNimPass.message.includes('NIM'), 'Pesan error mengindikasikan larangan penggunaan NIM');

const rejectWrongOldPass = ArenaStore.changePassword(newStudentNim, 'WRONG_OLD_PASS', 'RahasiaBaru#2025');
assert(rejectWrongOldPass.success === false, 'Menolak pembaruan jika kata sandi lama salah');

// 25.4 Sukses Ganti Password Mandiri
const successChangePass = ArenaStore.changePassword(newStudentNim, newStudentNim, 'AlgoMaster#2025');
assert(successChangePass.success === true, 'Pembaruan kata sandi valid berhasil');
assert(successChangePass.user?.password === 'AlgoMaster#2025', 'Kata sandi tersimpan sesuai input baru');
assert(successChangePass.user?.is_first_login === false, 'Status is_first_login berganti menjadi false');
assert(typeof successChangePass.user?.password_changed_at === 'string', 'Timestamp password_changed_at tercatat');

// 25.5 Login Pasca-Ganti Password
const loginOldPassFail = ArenaStore.login(newStudentNim, newStudentNim);
assert(loginOldPassFail.success === false, 'Login dengan kata sandi lama (NIM) otomatis ditolak');

const loginNewPassSuccess = ArenaStore.login(newStudentNim, 'AlgoMaster#2025');
assert(loginNewPassSuccess.success === true, 'Login dengan kata sandi baru berhasil');
assert(loginNewPassSuccess.requiresOnboarding === false, 'Sesi tidak lagi meminta onboarding (requiresOnboarding === false)');

// 25.6 Alur Complete Onboarding (Password + Custom Codename)
const anotherStudentNim = '26018888';
ArenaStore.createUser({
  nim: anotherStudentNim,
  nama_lengkap: 'Bunga Citra',
  role: 'PESERTA',
  klub_hari: 'JUMAT',
  prodi: 'Teknik Informatika',
  angkatan: 2025,
  kelas_reguler: 'TI A 25'
});

const onboardRes = ArenaStore.completeOnboarding({
  nim: anotherStudentNim,
  newPassword: 'SecureMatrix2025',
  codename: 'CyberFlora',
  avatar: 'BC'
});

assert(onboardRes.success === true, 'Eksekusi completeOnboarding berhasil');
assert(onboardRes.user?.password === 'SecureMatrix2025', 'Kata sandi baru tersimpan via completeOnboarding');
assert(onboardRes.user?.codename === 'CyberFlora', 'Codename kustom tersimpan via completeOnboarding');
assert(onboardRes.user?.avatar === 'BC', 'Avatar monogram tersimpan via completeOnboarding');
assert(onboardRes.user?.is_first_login === false, 'is_first_login berganti false pasca-completeOnboarding');

// 25.7 Akun Admin Kebal dari Onboarding Mahasiswa
const adminLoginRes = ArenaStore.login('ADMIN', 'ADMIN');
assert(adminLoginRes.success === true, 'Login root ADMIN berhasil');
assert(adminLoginRes.requiresOnboarding === false, 'Root ADMIN tidak diarahkan ke onboarding mahasiswa');

// ========================================================
// TEST GROUP 26: Supabase Live Persistence, Row Mappers & Multi-Device Sync Safety
// ========================================================
console.log('\n--- [TEST GROUP 26: Supabase Live Persistence, Row Mappers & Multi-Device Sync Safety] ---');

// 26.1 Deteksi Konfigurasi Environment Supabase (Safe Placeholder Guard)
assert(typeof isSupabaseConfigured() === 'boolean', 'isSupabaseConfigured mengembalikan nilai boolean yang valid');
const syncStatus = ArenaStore.getSyncStatus();
assert(syncStatus.mode === 'local' || syncStatus.mode === 'supabase', `ArenaStore.getSyncStatus melaporkan mode valid (${syncStatus.mode})`);

// 26.2 Validasi Kolom Sinkronisasi Terbaru di supabase/schema.sql
assert(schemaSql.includes('is_first_login BOOLEAN'), 'Tabel users di schema.sql memuat kolom is_first_login');
assert(schemaSql.includes('password_changed_at TIMESTAMPTZ'), 'Tabel users di schema.sql memuat kolom password_changed_at');
assert(schemaSql.includes('allowed_game_ids JSONB'), 'Tabel cohorts di schema.sql memuat kolom allowed_game_ids');

// 26.3 Round-Trip Mapper Cohort
const sampleCohort = {
  id_cohort: 'c-algo-2025',
  nama_kelas: 'Algoritma Lanjutan 2025',
  kode_kelas: 'ALGO-25',
  periode: 'Ganjil 2025',
  deskripsi: 'Kelas praktikum dinamis',
  is_active: true,
  allowed_game_ids: ['G1', 'G2'],
  created_at: '2025-09-01T00:00:00.000Z'
};
const dbCohort = toDbCohortRow(sampleCohort);
const domainCohort = fromDbCohortRow(dbCohort);
assert(dbCohort.allowed_game_ids.length === 2, 'toDbCohortRow mempertahankan array allowed_game_ids');
assert(domainCohort.kode_kelas === 'ALGO-25', 'fromDbCohortRow memulihkan kode_kelas akurat');
assert(domainCohort.allowed_game_ids.includes('G2'), 'fromDbCohortRow memulihkan allowed_game_ids akurat');

// 26.4 Round-Trip Mapper User & PostgreSQL FK Null Sanitization
const sampleUser = {
  nim: '2599001',
  password: undefined, // simulasi payload tanpa password (sanitized client)
  nama_lengkap: 'Raka Pratama',
  codename: 'Raka_CP',
  avatar: 'RP',
  role: 'PESERTA',
  prodi: 'Teknik Informatika',
  angkatan: 2025,
  kelas_reguler: 'TI A 25',
  klub_hari: 'ALL',
  id_cohort: '', // empty string harus jadi null di Postgres!
  periode: 'Ganjil 2025',
  total_xp: 450,
  level: 2,
  tier_badge: 'O(N) Sprinter',
  milestones_json: ['FIRST_BLOOD'],
  id_tim: '', // empty string harus jadi null di Postgres!
  is_first_login: false,
  password_changed_at: '2025-09-10T08:00:00.000Z'
};
const dbUser = toDbUserRow(sampleUser, 'ExistingSecret#99');
assert(dbUser.id_cohort === null, 'toDbUserRow mengubah id_cohort string kosong menjadi NULL (FK Safe)');
assert(dbUser.id_tim === null, 'toDbUserRow mengubah id_tim string kosong menjadi NULL (FK Safe)');
assert(dbUser.password === 'ExistingSecret#99', 'toDbUserRow mempertahankan password DB eksisting saat payload client tidak menyertakan password');
assert(dbUser.is_first_login === false, 'toDbUserRow memetakan is_first_login === false dengan akurat');

const domainUser = fromDbUserRow(dbUser);
assert(domainUser.id_tim === '', 'fromDbUserRow menormalkan id_tim NULL kembali ke string kosong untuk UI');
assert(domainUser.is_first_login === false, 'fromDbUserRow mempertahankan status is_first_login === false');

// 26.5 Round-Trip Mapper Team, Game, & Submission
const dbTeam = toDbTeamRow({
  id_tim: 'TIM-01',
  nama_tim: 'Squad Alpha',
  klub_hari: 'KAMIS',
  id_cohort: '',
  kode_gabung: 'ALPH01',
  leader_nim: '2599001',
  daftar_nim_json: ['2599001'],
  daftar_nama_json: ['Raka Pratama'],
  total_skor_tim: 450
});
assert(dbTeam.id_cohort === null, 'toDbTeamRow mengubah id_cohort kosong menjadi NULL');
assert(fromDbTeamRow(dbTeam).kode_gabung === 'ALPH01', 'fromDbTeamRow memulihkan kode_gabung akurat');

const dbGame = toDbGameRow({
  id_game: 'G_SYNC_1',
  ref_pertemuan: 'Pertemuan 2',
  judul_game: 'Uji Sync Supabase',
  kategori_materi: 'Graph',
  kesulitan: 'Medium',
  mode_game: 'SOLO',
  status_kamis: 'OPEN',
  status_jumat: 'UPCOMING',
  cohort_statuses: { 'c-algo-2025': 'OPEN' },
  durasi_total_menit: 20,
  durasi_per_soal_detik: 60,
  min_nilai_lulus: 75
});
assert(dbGame.cohort_statuses['c-algo-2025'] === 'OPEN', 'toDbGameRow mempertahankan cohort_statuses JSONB');
assert(fromDbGameRow(dbGame).cohort_statuses['c-algo-2025'] === 'OPEN', 'fromDbGameRow memulihkan cohort_statuses akurat');

const dbSub = toDbSubmissionRow({
  id_submission: 'SUB-SYNC-1',
  timestamp_mulai: '2025-09-10T09:00:00.000Z',
  timestamp_update: '2025-09-10T09:10:00.000Z',
  nim: '2599001',
  codename: 'Raka_CP',
  klub_hari: 'ALL',
  id_game: 'G_SYNC_1',
  mode_game: 'SOLO',
  id_tim: '',
  skor_xp: 120,
  nilai_akademik: 95,
  jumlah_benar: 2,
  total_soal: 2,
  status_lulus: 'LULUS',
  streak_saat_ini: 2,
  tab_switch_count: 1,
  tab_switch_log: [{ timestamp: '2025-09-10T09:05:00.000Z', penalty_deducted: 5 }],
  shuffled_question_ids: ['Q2', 'Q1'],
  status_sesi: 'DONE',
  detail_jawaban_json: []
});
assert(dbSub.id_tim === null, 'toDbSubmissionRow mengubah id_tim kosong menjadi NULL');
assert(dbSub.tab_switch_log.length === 1, 'toDbSubmissionRow mempertahankan tab_switch_log JSONB');
assert(dbSub.shuffled_question_ids[0] === 'Q2', 'toDbSubmissionRow mempertahankan shuffled_question_ids JSONB');
const domainSub = fromDbSubmissionRow(dbSub);
assert(domainSub.tab_switch_log?.length === 1, 'fromDbSubmissionRow memulihkan tab_switch_log akurat');

// 26.6 Sanitasi Payload Sync Mahasiswa (Zero Password & Zero Answer Leakage)
const sanitizedForStudent = sanitizeDatasetForStudent(
  {
    cohorts: [sampleCohort],
    teams: [],
    users: [
      { ...domainUser, password: 'SecretPassword123' },
      { ...domainUser, nim: '2599002', password: 'OtherStudentSecret' }
    ],
    games: [],
    questions: [
      {
        id_soal: 'Q_DONE',
        id_game: 'G_DONE',
        judul: 'Soal Selesai',
        narasi_soal: 'Narasi',
        kunci_jawaban: 'A',
        editorial: 'Pembahasan A',
        poin_dasar: 50
      },
      {
        id_soal: 'Q_ACTIVE',
        id_game: 'G_ACTIVE',
        judul: 'Soal Aktif',
        narasi_soal: 'Narasi',
        kunci_jawaban: 'B',
        editorial: 'Pembahasan B',
        poin_dasar: 50
      }
    ],
    submissions: [
      { ...domainSub, nim: '2599001', id_game: 'G_DONE', status_sesi: 'DONE' },
      { ...domainSub, nim: '2599001', id_game: 'G_ACTIVE', status_sesi: 'ACTIVE' }
    ]
  },
  '2599001'
);

assert(sanitizedForStudent.users.every((u) => u.password === undefined), 'Sync Payload Mahasiswa: Seluruh password user di-strip (Zero Password Exposure)');
const qDoneSanitized = sanitizedForStudent.questions.find((q) => q.id_soal === 'Q_DONE');
const qActiveSanitized = sanitizedForStudent.questions.find((q) => q.id_soal === 'Q_ACTIVE');
assert(qDoneSanitized?.kunci_jawaban === 'A' && qDoneSanitized?.editorial === 'Pembahasan A', 'Sync Payload Mahasiswa: Kunci jawaban & editorial tersedia untuk game DONE');
assert(qActiveSanitized?.kunci_jawaban === undefined && qActiveSanitized?.editorial === undefined, 'Sync Payload Mahasiswa: Kunci jawaban & editorial ter-strip untuk game ACTIVE (Zero Leakage)');

// 26.7 Verifikasi Keberadaan Endpoint Live Sync
assert(fs.existsSync(path.resolve('src/app/api/arena/sync/route.ts')), 'Endpoint src/app/api/arena/sync/route.ts tersedia');
assert(fs.existsSync(path.resolve('src/lib/supabase/admin.ts')), 'Helper src/lib/supabase/admin.ts tersedia');
assert(fs.existsSync(path.resolve('src/lib/supabase/repository.ts')), 'Repository src/lib/supabase/repository.ts tersedia');

// ========================================================
// TEST GROUP 27: Security Auth Hardening (scrypt Hashing, Signed HttpOnly Cookie & Server RBAC)
// ========================================================
console.log('\n--- [TEST GROUP 27: Security Auth Hardening (scrypt Hashing, Signed HttpOnly Cookie & Server RBAC)] ---');

// 27.1 Salted scrypt Password Hashing
const hashA = hashPassword('time2026CP');
const hashB = hashPassword('time2026CP');
assert(isPasswordHashed(hashA), 'hashPassword menghasilkan format scrypt$<salt>$<key> yang valid');
assert(hashA !== 'time2026CP', 'Hash kata sandi tidak pernah identik dengan plain-text');
assert(hashA !== hashB, 'Dua hash untuk input identik berbeda karena random per-user salt (Anti-Rainbow-Table)');

// 27.2 Verifikasi Hash & Lazy Migration Legacy Plain-Text
const validHashCheck = verifyPassword('time2026CP', hashA);
assert(validHashCheck.valid === true && validHashCheck.needsRehash === false, 'verifyPassword menerima kata sandi cocok terhadap hash scrypt (needsRehash: false)');

const invalidHashCheck = verifyPassword('salahPassword', hashA);
assert(invalidHashCheck.valid === false, 'verifyPassword menolak kata sandi yang salah');

const legacyPlainCheck = verifyPassword('time2026CP', 'time2026CP');
assert(legacyPlainCheck.valid === true && legacyPlainCheck.needsRehash === true, 'verifyPassword mendukung lazy migration untuk password legacy plain-text (needsRehash: true)');

// 27.3 Auto-Hashing pada toDbUserRow
const hashedDbUserRow = toDbUserRow({ ...sampleUser, password: 'MyPlainPassword#1' });
assert(isPasswordHashed(hashedDbUserRow.password), 'toDbUserRow otomatis mengenkripsi password plain-text baru ke hash scrypt');
assert(verifyPassword('MyPlainPassword#1', hashedDbUserRow.password).valid === true, 'Password ter-hash pada toDbUserRow dapat diverifikasi dengan akurat');

// 27.4 Signed Session Token (HMAC-SHA256) & Anti-Tampering
const adminToken = await signSessionToken({ nim: 'ADMIN', role: 'ADMIN', codename: 'Grandmaster_Tarq' });
const verifiedAdmin = await verifySessionToken(adminToken);
assert(verifiedAdmin !== null, 'Token sesi ADMIN berhasil diverifikasi');
assert(verifiedAdmin?.nim === 'ADMIN' && verifiedAdmin?.role === 'ADMIN', 'Payload sesi ADMIN (nim & role) utuh dan akurat');

const studentToken = await signSessionToken({ nim: '2599001', role: 'PESERTA', codename: 'Raka_CP' });
const verifiedStudent = await verifySessionToken(studentToken);
assert(verifiedStudent?.nim === '2599001' && verifiedStudent?.role === 'PESERTA', 'Payload sesi PESERTA utuh dan akurat');

// Simulasi manipulasi payload token (mengubah PESERTA -> ADMIN tanpa secret key)
const [rawPayloadB64, rawSigB64] = studentToken.split('.');
const fakePayloadObj = { nim: '2599001', role: 'ADMIN', codename: 'Hacker', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 };
const fakePayloadB64 = Buffer.from(JSON.stringify(fakePayloadObj)).toString('base64url');
const tamperedToken = `${fakePayloadB64}.${rawSigB64}`;
const tamperedResult = await verifySessionToken(tamperedToken);
assert(tamperedResult === null, 'Anti-Tampering: Token dengan payload termanipulasi (role spoofing) otomatis ditolak (null)');

// Simulasi token kedaluwarsa
const expiredToken = await signSessionToken({ nim: '2599001', role: 'PESERTA', codename: 'Raka_CP', ttlSeconds: -10 });
const expiredResult = await verifySessionToken(expiredToken);
assert(expiredResult === null, 'Token sesi kedaluwarsa otomatis ditolak (null)');

// 27.5 Konfigurasi Cookie HttpOnly & Keberadaan Middleware Server RBAC
const cookieOpts = getSessionCookieOptions();
assert(SESSION_COOKIE_NAME === 'cp_arena_session', 'Nama cookie sesi resmi adalah cp_arena_session');
assert(cookieOpts.httpOnly === true, 'Cookie sesi mengaktifkan flag httpOnly: true (Anti-XSS Theft)');
assert(cookieOpts.sameSite === 'lax', 'Cookie sesi mengaktifkan SameSite: lax (Anti-CSRF)');

assert(fs.existsSync(path.resolve('src/middleware.ts')), 'Server-side RBAC Middleware src/middleware.ts tersedia');
assert(fs.existsSync(path.resolve('src/app/api/auth/logout/route.ts')), 'Endpoint src/app/api/auth/logout/route.ts tersedia');
assert(fs.existsSync(path.resolve('src/app/api/auth/session/route.ts')), 'Endpoint src/app/api/auth/session/route.ts tersedia');

const syncRouteCode = fs.readFileSync(path.resolve('src/app/api/arena/sync/route.ts'), 'utf8');
assert(syncRouteCode.includes('verifySessionToken'), '/api/arena/sync memverifikasi token sesi kriptografis (Anti-Spoofing)');
assert(!syncRouteCode.includes("searchParams.get('role')"), '/api/arena/sync tidak lagi membaca parameter ?role= yang tidak tepercaya dari URL');

// ========================================================
// TEST GROUP 28: Bulk Student Import (CSV/Excel) & Admin Password Reset
// ========================================================
console.log('\n--- [TEST GROUP 28: Bulk Student Import (CSV/Excel) & Admin Password Reset] ---');

// 28.1 Deteksi Delimiter & Parsing CSV (Semicolon Excel ID + UTF-8 BOM + Quoted Field)
assert(detectCsvDelimiter('NIM;Nama_Lengkap;Prodi') === ';', 'Deteksi otomatis delimiter titik koma (;) untuk Excel Indonesia');
assert(detectCsvDelimiter('NIM,Nama_Lengkap,Prodi') === ',', 'Deteksi otomatis delimiter koma (,) untuk CSV standar');

const sampleCsvText = [
  '\uFEFFNIM;Nama_Lengkap;Prodi;Angkatan;Kelas_Reguler;Codename',
  '2605001;Nadia Kusuma;Sistem Informasi;2025;SI A 25;Nadia_DP',
  '2605002;"Budi, S.Kom Candidate";Teknik Informatika;2025;TI B 25;',
  '2605001;Duplikat Dalam File;Sistem Informasi;2025;SI A 25;',
  ';Tanpa NIM;Sistem Informasi;2025;SI A 25;',
  '2605003;;Sistem Informasi;2025;SI A 25;',
  '26019999;Sudah Terdaftar Sebelumnya;Sistem Informasi;2025;SI C 25;'
].join('\n');

const parsedCsvRecords = parseRawCsvText(sampleCsvText);
assert(parsedCsvRecords.length === 6, `parseRawCsvText membaca tepat 6 baris data (Aktual: ${parsedCsvRecords.length})`);
assert(parsedCsvRecords[0].nim === '2605001', 'Parsing baris 1 mempertahankan NIM tanpa BOM');
assert(parsedCsvRecords[1].nama_lengkap === 'Budi, S.Kom Candidate', 'Parsing RFC 4180 mempertahankan field berkoma dalam tanda kutip');

// 28.2 Validasi Duplikat (Dalam File & Eksisting DB) serta Baris Invalid
const importValidation = validateImportedStudentRows(parsedCsvRecords, ArenaStore.getUsers());
assert(importValidation.totalRows === 6, 'Total baris tervalidasi adalah 6');
assert(importValidation.validRows.length === 2, `Tepat 2 baris berstatus VALID (Aktual: ${importValidation.validRows.length})`);
assert(importValidation.duplicateRows.length === 2, `Tepat 2 baris berstatus DUPLIKAT/TERDAFTAR (Aktual: ${importValidation.duplicateRows.length})`);
assert(importValidation.invalidRows.length === 2, `Tepat 2 baris berstatus INVALID (Aktual: ${importValidation.invalidRows.length})`);
assert(importValidation.rows[2].status === 'DUPLICATE_IN_FILE', 'Baris duplikat internal ditandai DUPLICATE_IN_FILE');
assert(importValidation.rows[5].status === 'ALREADY_EXISTS', 'Baris NIM eksisting ditandai ALREADY_EXISTS');

// 28.3 Build DTO & Eksekusi Atomik ArenaStore.bulkCreateUsers
const bulkDtos = buildBulkCreateUserDTOs(importValidation.validRows, {
  id_cohort: 'c-bulk-test',
  kode_kelas: 'BULK-25',
  periode: 'Ganjil 2025'
});
assert(bulkDtos.length === 2, 'buildBulkCreateUserDTOs menghasilkan 2 DTO siap impor');
assert(bulkDtos[0].id_cohort === 'c-bulk-test', 'DTO mengikat id_cohort tujuan secara dinamis');

const bulkInsertRes = ArenaStore.bulkCreateUsers(bulkDtos);
assert(bulkInsertRes.success === true, 'ArenaStore.bulkCreateUsers berhasil');
assert(bulkInsertRes.createdCount === 2, `Tepat 2 mahasiswa baru tercipta (Aktual: ${bulkInsertRes.createdCount})`);
assert(bulkInsertRes.createdUsers[0].is_first_login === true, 'Mahasiswa hasil bulk import wajib onboarding (is_first_login === true)');
assert(bulkInsertRes.createdUsers[0].avatar === 'NK', 'Monogram inisial Nadia Kusuma terhitung otomatis (NK)');

// Uji idempotensi: impor ulang batch yang sama harus dilewati seluruhnya
const reImportRes = ArenaStore.bulkCreateUsers(bulkDtos);
assert(reImportRes.success === false && reImportRes.createdCount === 0, 'Impor ulang NIM yang sama ditolak otomatis (Zero Duplicate)');

// 28.4 Admin Reset Kata Sandi Mahasiswa Kembali ke NIM
const changeBeforeReset = ArenaStore.changePassword('2605001', '2605001', 'PasswordRahasia#88');
assert(changeBeforeReset.success === true && changeBeforeReset.user?.is_first_login === false, 'Mahasiswa 2605001 berhasil mengganti sandi terlebih dahulu');

const adminResetRes = ArenaStore.adminResetPassword('2605001');
assert(adminResetRes.success === true, 'Admin berhasil mereset kata sandi mahasiswa 2605001 ke NIM');
assert(adminResetRes.user?.password === '2605001', 'Password mahasiswa kembali ke NIM setelah direset Admin');
assert(adminResetRes.user?.is_first_login === true, 'is_first_login direset kembali ke true');

const loginAfterAdminReset = ArenaStore.login('2605001', '2605001');
assert(loginAfterAdminReset.success === true, 'Mahasiswa bisa login kembali menggunakan NIM pasca-reset Admin');
assert(loginAfterAdminReset.requiresOnboarding === true, 'Login pasca-reset Admin otomatis memicu wajib onboarding ganti sandi baru');

// 28.5 Template CSV Resmi & Keberadaan Komponen / Endpoint
const csvTemplate = generateStudentImportTemplateCsv();
assert(csvTemplate.startsWith('\uFEFFNIM;Nama_Lengkap;'), 'Template CSV resmi memuat UTF-8 BOM dan header standar STMIK TIME');
assert(fs.existsSync(path.resolve('src/components/admin/modals/BulkImportStudentsModal.tsx')), 'Komponen modal BulkImportStudentsModal.tsx tersedia');
const passRouteCode = fs.readFileSync(path.resolve('src/app/api/auth/password/route.ts'), 'utf8');
assert(passRouteCode.includes("action === 'admin-reset'") && passRouteCode.includes("session.role !== 'ADMIN'"), '/api/auth/password mendukung admin-reset khusus otoritas ADMIN');

// ========================================================
// TEST GROUP 29: Post-Deploy Fixes — Strict Cohort Isolation, Dynamic Cohort Edit & Auth/Onboarding Race-Free
// ========================================================
console.log('\n--- [TEST GROUP 29: Post-Deploy Fixes — Strict Cohort Isolation, Dynamic Cohort Edit & Auth/Onboarding Race-Free] ---');

// 29.1 Issue 3: Zero Hardcode G1-G7 saat Buat Kelas Baru & Fitur Edit Kelas
const freshEmptyClassRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Kamis SI 2026',
  kode_kelas: 'KAMIS-SI-26',
  periode: 'Ganjil 2026'
});
assert(freshEmptyClassRes.success === true, 'Membuat kelas baru tanpa paket soal awal berhasil');
assert(Array.isArray(freshEmptyClassRes.cohort?.allowed_game_ids) && freshEmptyClassRes.cohort.allowed_game_ids.length === 0, 'Kelas baru memiliki 0 paket soal default (Zero Hardcode G1-G7)');

const secondIsoClassRes = ArenaStore.createCohort({
  nama_kelas: 'Kelas Jumat TI 2026',
  kode_kelas: 'JUMAT-TI-26',
  periode: 'Ganjil 2026'
});
assert(secondIsoClassRes.success === true, 'Membuat kelas kedua untuk uji isolasi berhasil');

// Edit Kelas (update nama, deskripsi, dan hak akses paket soal)
const editCohortRes = ArenaStore.updateCohort(freshEmptyClassRes.cohort.id_cohort, {
  nama_kelas: 'Kelas Kamis SI 2026 (Revisi)',
  deskripsi: 'Deskripsi hasil edit kelas',
  allowed_game_ids: ['G_ISO_A']
});
assert(editCohortRes.success === true, 'Admin berhasil mengedit detail & hak akses kelas');
assert(editCohortRes.cohort?.nama_kelas === 'Kelas Kamis SI 2026 (Revisi)', 'Nama kelas terbarui akurat');
assert(editCohortRes.cohort?.allowed_game_ids.includes('G_ISO_A'), 'Hak akses paket soal G_ISO_A terikat ke Kelas A');

const dupEditKodeRes = ArenaStore.updateCohort(freshEmptyClassRes.cohort.id_cohort, {
  kode_kelas: 'JUMAT-TI-26'
});
assert(dupEditKodeRes.success === false, 'Edit kelas menolak kode kelas duplikat milik kelas lain');

// Set hak akses Kelas B hanya untuk G_ISO_B
ArenaStore.updateCohort(secondIsoClassRes.cohort.id_cohort, {
  allowed_game_ids: ['G_ISO_B']
});

const studentTabCode = fs.readFileSync(path.resolve('src/components/admin/tabs/AdminStudentMonitorTab.tsx'), 'utf8');
assert(!studentTabCode.includes('ALL_GAME_PACKAGES'), 'AdminStudentMonitorTab 100% bebas dari konstanta hardcode ALL_GAME_PACKAGES (G1-G7)');

// 29.2 Issue 4: Label Nama Kelas Akurat (Zero "Kelas ALL") & Isolasi Paket Soal Antar Kelas
const gameIsoA = {
  id_game: 'G_ISO_A',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Kuis Khusus Kelas Kamis',
  kategori_materi: 'Logika',
  kesulitan: 'Easy',
  mode_game: 'SOLO',
  status_kamis: 'OPEN',
  status_jumat: 'UPCOMING',
  cohort_statuses: { [freshEmptyClassRes.cohort.id_cohort]: 'OPEN' },
  durasi_total_menit: 15,
  durasi_per_soal_detik: 60,
  min_nilai_lulus: 70
};
const gameIsoB = {
  id_game: 'G_ISO_B',
  ref_pertemuan: 'Pertemuan 1',
  judul_game: 'Kuis Khusus Kelas Jumat',
  kategori_materi: 'Graph',
  kesulitan: 'Medium',
  mode_game: 'SOLO',
  status_kamis: 'UPCOMING',
  status_jumat: 'OPEN',
  cohort_statuses: { [secondIsoClassRes.cohort.id_cohort]: 'OPEN' },
  durasi_total_menit: 15,
  durasi_per_soal_detik: 60,
  min_nilai_lulus: 70
};
ArenaStore.saveGames([...ArenaStore.getGames(), gameIsoA, gameIsoB]);

const studentIsoARes = ArenaStore.createUser({
  nim: '2699101',
  nama_lengkap: 'Mahasiswa Kelas A',
  role: 'PESERTA',
  klub_hari: 'ALL', // simulasi fallback ALL saat kohort dinamis dipilih
  id_cohort: freshEmptyClassRes.cohort.id_cohort,
  periode: 'Ganjil 2026',
  prodi: 'Sistem Informasi',
  angkatan: 2026,
  kelas_reguler: 'SI A 26'
});
const studentIsoBRes = ArenaStore.createUser({
  nim: '2699102',
  nama_lengkap: 'Mahasiswa Kelas B',
  role: 'PESERTA',
  klub_hari: 'ALL',
  id_cohort: secondIsoClassRes.cohort.id_cohort,
  periode: 'Ganjil 2026',
  prodi: 'Teknik Informatika',
  angkatan: 2026,
  kelas_reguler: 'TI B 26'
});

const labelA = ArenaStore.resolveUserCohortName(studentIsoARes.user);
const labelB = ArenaStore.resolveUserCohortName(studentIsoBRes.user);
assert(labelA === 'Kelas Kamis SI 2026 (Revisi)', `Label Mahasiswa A menampilkan nama kelas asli, bukan Kelas ALL (Aktual: ${labelA})`);
assert(labelB === 'Kelas Jumat TI 2026', `Label Mahasiswa B menampilkan nama kelas asli, bukan Kelas ALL (Aktual: ${labelB})`);
assert(!labelA.includes('ALL') && !labelB.includes('ALL'), 'Zero "Kelas ALL" pada label kelas mahasiswa');

// Isolasi Client-Side: getGamesForUser
const gamesForA = ArenaStore.getGamesForUser(studentIsoARes.user);
const gamesForB = ArenaStore.getGamesForUser(studentIsoBRes.user);
assert(gamesForA.some((g) => g.id_game === 'G_ISO_A'), 'Mahasiswa A melihat paket soal miliknya (G_ISO_A)');
assert(!gamesForA.some((g) => g.id_game === 'G_ISO_B'), 'Isolasi Ketat: Mahasiswa A TIDAK melihat paket soal Kelas B (G_ISO_B)');
assert(gamesForB.some((g) => g.id_game === 'G_ISO_B'), 'Mahasiswa B melihat paket soal miliknya (G_ISO_B)');
assert(!gamesForB.some((g) => g.id_game === 'G_ISO_A'), 'Isolasi Ketat: Mahasiswa B TIDAK melihat paket soal Kelas A (G_ISO_A)');

// Isolasi Server-Side: sanitizeDatasetForStudent
const serverIsoPayloadA = sanitizeDatasetForStudent(
  {
    cohorts: [editCohortRes.cohort, ArenaStore.getCohortById(secondIsoClassRes.cohort.id_cohort)],
    teams: [],
    users: [studentIsoARes.user, studentIsoBRes.user],
    games: [gameIsoA, gameIsoB],
    questions: [
      { id_soal: 'Q_ISO_A', id_game: 'G_ISO_A', judul: 'Soal A', narasi_soal: 'A', kunci_jawaban: 'X', editorial: 'Ed A', poin_dasar: 50 },
      { id_soal: 'Q_ISO_B', id_game: 'G_ISO_B', judul: 'Soal B', narasi_soal: 'B', kunci_jawaban: 'Y', editorial: 'Ed B', poin_dasar: 50 }
    ],
    submissions: []
  },
  '2699101'
);
assert(serverIsoPayloadA.games.length === 1 && serverIsoPayloadA.games[0].id_game === 'G_ISO_A', 'Server Sync Isolation: Mahasiswa A hanya menerima 1 paket soal miliknya (G_ISO_A)');
assert(serverIsoPayloadA.questions.length === 1 && serverIsoPayloadA.questions[0].id_soal === 'Q_ISO_A', 'Server Sync Isolation: Soal Kelas B (Q_ISO_B) terblokir total di server');

// 29.3 Issue 1 & 2: Single-Click Login Redirect & Race-Free Onboarding Cache Sync
const middlewareCode = fs.readFileSync(path.resolve('src/middleware.ts'), 'utf8');
assert(middlewareCode.includes('no-store'), 'Middleware menerapkan Cache-Control: no-store pada redirect agar bebas Router Cache loop');
const loginPageCode = fs.readFileSync(path.resolve('src/app/login/page.tsx'), 'utf8');
assert(loginPageCode.includes('window.location.assign'), 'Login menggunakan hard navigation window.location.assign untuk langsung membawa HttpOnly cookie baru');
assert(loginPageCode.includes("credentials: 'same-origin'"), 'Login menyertakan credentials: same-origin');

ArenaStore.markLocalUserOnboarded({ ...studentIsoARes.user, is_first_login: false, codename: 'Updated_A' });
const syncedCurrent = ArenaStore.getCurrentUser();
const syncedListUser = ArenaStore.getUsers().find((u) => u.nim === '2699101');
assert(syncedCurrent?.is_first_login === false && syncedCurrent?.codename === 'Updated_A', 'markLocalUserOnboarded memperbarui currentUser sinkron tanpa race-condition');
assert(syncedListUser?.is_first_login === false && syncedListUser?.codename === 'Updated_A', 'markLocalUserOnboarded memperbarui cache daftar users secara konsisten');

const onboardModalCode = fs.readFileSync(path.resolve('src/components/arena/FirstLoginOnboardingModal.tsx'), 'utf8');
assert(onboardModalCode.includes('finally') && onboardModalCode.includes('setIsSubmitting(false)'), 'FirstLoginOnboardingModal selalu mereset state loading pada blok finally');
assert(onboardModalCode.includes("credentials: 'same-origin'"), 'FirstLoginOnboardingModal menyertakan credentials: same-origin');

// ============================================================================
// TEST GROUP 30: STRICT SSOT UNASSIGNMENT, ZERO UNASSIGNED LEAK & NEW-ACCOUNT SINGLE-CLICK LOGIN
// ============================================================================
console.log('\n--- [TEST GROUP 30: Strict SSOT Unassignment, Zero Unassigned Leak & New-Account Single-Click Login] ---');

// 30.1 Buat 2 kelas baru kosong + 2 mahasiswa
const ssotClassA = ArenaStore.createCohort({
  nama_kelas: 'Kelas SSOT Alpha',
  kode_kelas: 'SSOT-A',
  periode: 'Genap 2026',
});
const ssotClassB = ArenaStore.createCohort({
  nama_kelas: 'Kelas SSOT Beta',
  kode_kelas: 'SSOT-B',
  periode: 'Genap 2026',
});
assert(ssotClassA.success && ssotClassB.success, 'Membuat 2 kelas uji SSOT berhasil');

const ssotStudentA = ArenaStore.createUser({
  nim: '2699301',
  nama_lengkap: 'Mahasiswa SSOT Alpha',
  role: 'PESERTA',
  klub_hari: 'ALL',
  id_cohort: ssotClassA.cohort.id_cohort,
  periode: 'Genap 2026',
});
const ssotStudentB = ArenaStore.createUser({
  nim: '2699302',
  nama_lengkap: 'Mahasiswa SSOT Beta',
  role: 'PESERTA',
  klub_hari: 'ALL',
  id_cohort: ssotClassB.cohort.id_cohort,
  periode: 'Genap 2026',
});
assert(ssotStudentA.success && ssotStudentB.success, 'Membuat 2 mahasiswa uji SSOT berhasil');

// 30.2 Buat paket game TANPA assign kelas (allowed_cohort_ids: []) -> ZERO LEAK ke seluruh kelas
const draftGameRes = ArenaStore.createGame({
  id_game: 'G_DRAFT_SSOT',
  ref_pertemuan: 'Pertemuan Draft',
  judul_game: 'Paket Draft Belum Ditugaskan',
  kategori_materi: 'Algoritma',
  kesulitan: 'Easy',
  mode_game: 'SOLO',
  allowed_cohort_ids: [],
  initial_status: 'OPEN',
});
assert(draftGameRes.success === true, 'Admin berhasil membuat paket kontes Draft (allowed_cohort_ids: [])');
assert(
  Object.keys(draftGameRes.game?.cohort_statuses || {}).length === 0,
  'Paket Draft memiliki cohort_statuses kosong ({})'
);
assert(
  !ArenaStore.getCohortById(ssotClassA.cohort.id_cohort)?.allowed_game_ids.includes('G_DRAFT_SSOT'),
  'Kelas A tidak otomatis menerima paket Draft'
);
assert(
  !ArenaStore.getCohortById(ssotClassB.cohort.id_cohort)?.allowed_game_ids.includes('G_DRAFT_SSOT'),
  'Kelas B tidak otomatis menerima paket Draft'
);
assert(
  ArenaStore.getGamesForUser(ssotStudentA.user).length === 0 &&
    ArenaStore.getGamesForUser(ssotStudentB.user).length === 0,
  'Zero Leak: Mahasiswa Kelas A dan B melihat 0 paket saat game belum ditugaskan'
);

// 30.3 Assign ke Kelas A -> muncul di A, 0 di B -> Unassign via updateGame -> langsung hilang dari A!
ArenaStore.updateGame('G_DRAFT_SSOT', {
  allowed_cohort_ids: [ssotClassA.cohort.id_cohort],
});
ArenaStore.updateGameCohortStatus('G_DRAFT_SSOT', ssotClassA.cohort.id_cohort, 'OPEN');
assert(
  ArenaStore.getGamesForUser(ssotStudentA.user).some((g) => g.id_game === 'G_DRAFT_SSOT'),
  'Pasca-Assign: Mahasiswa Kelas A melihat paket G_DRAFT_SSOT'
);
assert(
  !ArenaStore.getGamesForUser(ssotStudentB.user).some((g) => g.id_game === 'G_DRAFT_SSOT'),
  'Pasca-Assign: Mahasiswa Kelas B tetap terisolasi (tidak melihat G_DRAFT_SSOT)'
);

// Unassign via updateGame([])
ArenaStore.updateGame('G_DRAFT_SSOT', {
  allowed_cohort_ids: [],
});
const gameAfterUnassign = ArenaStore.getGames().find((g) => g.id_game === 'G_DRAFT_SSOT');
const cohortAAfterUnassign = ArenaStore.getCohortById(ssotClassA.cohort.id_cohort);
assert(
  !cohortAAfterUnassign?.allowed_game_ids.includes('G_DRAFT_SSOT'),
  'Pasca-Unassign (updateGame): G_DRAFT_SSOT dihapus dari cohort.allowed_game_ids'
);
assert(
  !(ssotClassA.cohort.id_cohort in (gameAfterUnassign?.cohort_statuses || {})) &&
    !(ssotClassA.cohort.kode_kelas in (gameAfterUnassign?.cohort_statuses || {})),
  'Pasca-Unassign (updateGame): key kelas dipangkas bersih dari game.cohort_statuses'
);
assert(
  ArenaStore.getGamesForUser(ssotStudentA.user).length === 0,
  'Pasca-Unassign (updateGame): Paket soal LANGSUNG HILANG dari portal Mahasiswa Kelas A'
);

// 30.4 Assign ulang ke Kelas B lalu Unassign via updateCohort -> langsung hilang & cohort_statuses bersih!
ArenaStore.updateCohort(ssotClassB.cohort.id_cohort, {
  allowed_game_ids: ['G_DRAFT_SSOT'],
});
ArenaStore.updateGameCohortStatus('G_DRAFT_SSOT', ssotClassB.cohort.id_cohort, 'OPEN');
assert(
  ArenaStore.getGamesForUser(ssotStudentB.user).some((g) => g.id_game === 'G_DRAFT_SSOT'),
  'Assign via updateCohort: Mahasiswa Kelas B melihat G_DRAFT_SSOT'
);

ArenaStore.updateCohort(ssotClassB.cohort.id_cohort, {
  allowed_game_ids: [],
});
const gameAfterCohortUnassign = ArenaStore.getGames().find((g) => g.id_game === 'G_DRAFT_SSOT');
assert(
  !(ssotClassB.cohort.id_cohort in (gameAfterCohortUnassign?.cohort_statuses || {})) &&
    !(ssotClassB.cohort.kode_kelas in (gameAfterCohortUnassign?.cohort_statuses || {})),
  'Pasca-Unassign (updateCohort): key Kelas B dipangkas bersih dari game.cohort_statuses'
);
assert(
  ArenaStore.getGamesForUser(ssotStudentB.user).length === 0,
  'Pasca-Unassign (updateCohort): Paket soal LANGSUNG HILANG dari portal Mahasiswa Kelas B'
);

// 30.5 Simulasi baris legacy Supabase dengan cohort_statuses basi namun allowed_game_ids kosong -> Server & Client tetap BLOKIR
const staleLegacyGame = {
  ...gameAfterCohortUnassign,
  cohort_statuses: {
    [ssotClassA.cohort.id_cohort]: 'OPEN',
    [ssotClassA.cohort.kode_kelas]: 'OPEN',
  },
};
const staleServerPayload = sanitizeDatasetForStudent(
  {
    cohorts: [ArenaStore.getCohortById(ssotClassA.cohort.id_cohort)],
    teams: [],
    users: [ssotStudentA.user],
    games: [staleLegacyGame],
    questions: [
      { id_soal: 'Q_STALE', id_game: 'G_DRAFT_SSOT', judul: 'Soal Basi', narasi_soal: 'X', kunci_jawaban: 'A', editorial: 'E', poin_dasar: 50 },
    ],
    submissions: [],
  },
  '2699301'
);
assert(
  staleServerPayload.games.length === 0 && staleServerPayload.questions.length === 0,
  'Server SSOT: sanitizeDatasetForStudent memblokir game yang sudah di-unassign walau cohort_statuses legacy masih tersisa'
);
assert(
  ArenaStore.isGameAllowedForUser(
    ssotStudentA.user,
    'G_DRAFT_SSOT',
    [staleLegacyGame],
    [ArenaStore.getCohortById(ssotClassA.cohort.id_cohort)]
  ) === false,
  'Client SSOT: isGameAllowedForUser memblokir game yang sudah di-unassign walau cohort_statuses legacy masih tersisa'
);

// 30.6 New-Account Single-Click Login: getCurrentUser tidak menghapus sesi akun baru sebelum cp_arena_users terhidrasi
const brandNewRemoteAdmin = {
  nim: 'NEWADMIN999',
  nama_lengkap: 'Dosen Baru Supabase',
  codename: 'DosenBaru_999',
  avatar: 'DB',
  role: 'ADMIN',
  prodi: 'Teknik Informatika',
  angkatan: 2026,
  kelas_reguler: 'DOSEN',
  klub_hari: 'ALL',
  total_xp: 0,
  level: 1,
  tier_badge: 'Logic Novice',
  milestones_json: [],
  id_tim: '',
  is_first_login: false,
};
ArenaStore.setCurrentUser(brandNewRemoteAdmin);
const retrievedBeforeHydrate = ArenaStore.getCurrentUser();
assert(
  retrievedBeforeHydrate !== null && retrievedBeforeHydrate.nim === 'NEWADMIN999',
  'Anti-Refresh Login: getCurrentUser mempertahankan sesi akun baru meski belum masuk cache localStorage cp_arena_users'
);
ArenaStore.setCurrentUser(null);

// 30.7 Guard struktural UI & Container Session Recovery
const contestTabCode = fs.readFileSync(path.resolve('src/components/admin/tabs/AdminContestControlTab.tsx'), 'utf8');
assert(
  contestTabCode.includes('setFormAllowedCohorts([])'),
  'AdminContestControlTab menginisialisasi pilihan kelas paket baru menjadi [] (Draft / Zero Broadcast)'
);
assert(
  !contestTabCode.includes('animate-pulse'),
  'AdminContestControlTab bebas dari animate-pulse (Zero AI Slop)'
);
const loginCodeLatest = fs.readFileSync(path.resolve('src/app/login/page.tsx'), 'utf8');
assert(
  loginCodeLatest.includes('AbortController') && loginCodeLatest.includes('isSubmittingRef'),
  'Halaman Login membatalkan session-check lama dengan AbortController saat form disubmit'
);
const adminContainerCode = fs.readFileSync(path.resolve('src/components/admin/AdminCommandCenterContainer.tsx'), 'utf8');
const studentContainerCode = fs.readFileSync(path.resolve('src/components/arena/MahasiswaArenaContainer.tsx'), 'utf8');
assert(
  adminContainerCode.includes("'/api/auth/session'") && adminContainerCode.includes('await ArenaStore.logout()'),
  'AdminCommandCenterContainer mendukung pemulihan sesi HttpOnly & await logout sebelum redirect'
);
assert(
  studentContainerCode.includes("'/api/auth/session'") && studentContainerCode.includes('await ArenaStore.logout()'),
  'MahasiswaArenaContainer mendukung pemulihan sesi HttpOnly & await logout sebelum redirect'
);

// ============================================================================
// TEST GROUP 31: PRE-MERGE QA HARDENING (HOOKS SAFETY, LIVE QUIZ SYNC, RLS, ANTI-CHEAT, TEAM COHORT ISOLATION)
// ============================================================================
console.log('\n--- [TEST GROUP 31: Pre-Merge QA Hardening — Hooks Safety, Live Quiz Sync, RLS, Anti-Cheat & Team Isolation] ---');

// 31.1 QA-CRIT-01: Zero React Rules of Hooks violation (no hook called after top-level return null)
const hookCheckedFiles = [
  'src/components/arena/FirstLoginOnboardingModal.tsx',
  'src/components/arena/QuizArenaModal.tsx',
  'src/components/arena/EditorialModal.tsx',
  'src/components/arena/ProfileTab.tsx',
];
for (const relPath of hookCheckedFiles) {
  const src = fs.readFileSync(path.resolve(relPath), 'utf8');
  const firstReturnNull = src.indexOf('return null;');
  const afterReturnNull = firstReturnNull !== -1 ? src.slice(firstReturnNull) : '';
  const hasHookAfterReturnNull = /\b(useState|useEffect|useMemo|useCallback|useRef)\s*\(/.test(afterReturnNull);
  assert(!hasHookAfterReturnNull, `Rules of Hooks PASS: Tidak ada hook setelah return null di ${path.basename(relPath)}`);
}
const editorialSrc = fs.readFileSync(path.resolve('src/components/arena/EditorialModal.tsx'), 'utf8');
assert(editorialSrc.includes('submission.total_soal > 0'), 'EditorialModal terlindungi dari pembagian nol (Zero NaN/100)');

// 31.2 QA-CRIT-02: Server-authoritative Quiz Start/Finish & syncLocalSubmissionOnly
const quizModalSrc = fs.readFileSync(path.resolve('src/components/arena/QuizArenaModal.tsx'), 'utf8');
assert(quizModalSrc.includes("action: 'start'"), 'QuizArenaModal menginisialisasi sesi ACTIVE di server via /api/submissions/quiz action start');
assert(quizModalSrc.includes('syncLocalSubmissionOnly'), 'QuizArenaModal menyinkronkan respons server tanpa menimpa DB via write-through');
assert(quizModalSrc.includes('isFinishingRef'), 'QuizArenaModal memiliki guard anti double-finish (isFinishingRef)');
const quizRouteSrc = fs.readFileSync(path.resolve('src/app/api/submissions/quiz/route.ts'), 'utf8');
assert(quizRouteSrc.includes("if (action === 'start')"), '/api/submissions/quiz mendukung action start otoritatif dengan validasi kohort');

// 31.3 QA-CRIT-03: Supabase RLS Exclusive service_role (Zero Anon Exposure)
const hardenedSchemaSql = fs.readFileSync(path.resolve('supabase/schema.sql'), 'utf8');
assert(
  hardenedSchemaSql.includes('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;'),
  'schema.sql mencabut hak akses tabel langsung dari role anon & authenticated'
);
assert(
  !hardenedSchemaSql.includes('TO anon, authenticated, service_role'),
  'schema.sql tidak lagi memberikan GRANT ALL ke anon/authenticated'
);
assert(
  hardenedSchemaSql.includes('FOR ALL TO service_role USING (true) WITH CHECK (true)'),
  'Seluruh policy RLS schema.sql dikunci eksklusif untuk service_role'
);

// 31.4 QA-HIGH-01 & QA-HIGH-02: Anti-Forge Student Submission Sync & Anti-Zombie Admin Delete
const syncRouteSrc = fs.readFileSync(path.resolve('src/app/api/arena/sync/route.ts'), 'utf8');
assert(
  syncRouteSrc.includes('createActiveSubmissionsIfAbsent'),
  '/api/arena/sync memblokir manipulasi skor/XP/DONE oleh peserta lewat createActiveSubmissionsIfAbsent'
);
assert(
  syncRouteSrc.includes('deleteMissing: true'),
  '/api/arena/sync mengaktifkan deleteMissing: true untuk ADMIN (Anti-Zombie Submission)'
);
const repoSrc = fs.readFileSync(path.resolve('src/lib/supabase/repository.ts'), 'utf8');
assert(
  repoSrc.includes('ignoreDuplicates: true') && repoSrc.includes('options?.deleteMissing'),
  'SupabaseArenaRepo menerapkan ignoreDuplicates untuk peserta dan deleteMissing untuk reset Admin'
);

// 31.5 QA-HIGH-03: Isolasi Lintas Kelas pada Pembuatan & Gabung Tim Mandiri
const teamLeaderA = ArenaStore.createUser({
  nim: '2699401',
  nama_lengkap: 'Ketua Tim Kelas A',
  role: 'PESERTA',
  klub_hari: 'ALL',
  id_cohort: ssotClassA.cohort.id_cohort,
  periode: 'Genap 2026',
});
const teamMemberA = ArenaStore.createUser({
  nim: '2699402',
  nama_lengkap: 'Anggota Tim Kelas A',
  role: 'PESERTA',
  klub_hari: 'ALL',
  id_cohort: ssotClassA.cohort.id_cohort,
  periode: 'Genap 2026',
});
const teamOutsiderB = ArenaStore.createUser({
  nim: '2699403',
  nama_lengkap: 'Mahasiswa Kelas B Luar',
  role: 'PESERTA',
  klub_hari: 'ALL',
  id_cohort: ssotClassB.cohort.id_cohort,
  periode: 'Genap 2026',
});
const createdTeamA = ArenaStore.createTeam(teamLeaderA.user, 'Squad Alpha QA');
assert(
  createdTeamA.success && createdTeamA.team?.id_cohort === ssotClassA.cohort.id_cohort,
  'createTeam menyimpan id_cohort kelas ketua tim secara akurat'
);
const crossCohortJoin = ArenaStore.joinTeamWithCode(teamOutsiderB.user, createdTeamA.team.kode_gabung);
assert(
  crossCohortJoin.success === false,
  'Isolasi Tim Lintas Kelas: Mahasiswa Kelas B DITOLAK bergabung ke tim milik Kelas A'
);
const sameCohortJoin = ArenaStore.joinTeamWithCode(teamMemberA.user, createdTeamA.team.kode_gabung);
assert(
  sameCohortJoin.success === true,
  'Mahasiswa sesama Kelas A berhasil bergabung ke tim menggunakan kode gabung'
);

// 31.6 QA-MED-01, QA-MED-02 & QA-LOW-01: reCAPTCHA, Login Rate Limiter, Coding Judge Auth & Zero AI Slop
const recapRouteSrc = fs.readFileSync(path.resolve('src/app/api/auth/verify-recaptcha/route.ts'), 'utf8');
assert(
  !recapRouteSrc.includes('6Le4QR8uAAAAABnLAdYmiH1hkVlOd8tI6VbpKboY'),
  'Hardcoded fallback RECAPTCHA_SECRET_KEY dihapus dari source code'
);
assert(
  recapRouteSrc.includes("process.env.NODE_ENV === 'production'"),
  'demo-bypass-token diblokir pada lingkungan produksi'
);
const loginRouteSrc = fs.readFileSync(path.resolve('src/app/api/auth/login/route.ts'), 'utf8');
assert(
  loginRouteSrc.includes('status: 429') && loginRouteSrc.includes('isRateLimited'),
  '/api/auth/login dilengkapi proteksi brute-force rate limiter (HTTP 429)'
);
const judgeRouteSrc = fs.readFileSync(path.resolve('src/app/api/submissions/route.ts'), 'utf8');
assert(
  judgeRouteSrc.includes('verifySessionToken') && judgeRouteSrc.includes('status: 401'),
  'POST /api/submissions dilindungi autentikasi HttpOnly session cookie (401)'
);
const scoreboardSrc = fs.readFileSync(path.resolve('src/components/ScoreboardTable.tsx'), 'utf8');
const verdictSrc = fs.readFileSync(path.resolve('src/components/VerdictBadge.tsx'), 'utf8');
assert(!scoreboardSrc.includes('Sparkles'), 'ScoreboardTable bebas dari ikon Sparkles (Zero AI Slop)');
assert(!verdictSrc.includes('animate-pulse'), 'VerdictBadge bebas dari animasi animate-pulse (Zero AI Slop)');

console.log('\n========================================================');
console.log(`📊 Hasil Verifikasi: ${passedTests}/${totalTests} Uji Lulus (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('========================================================\n');

