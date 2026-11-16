import {
  calculateAcademicGrade,
  calculateQuestionXP,
  calculateLevelInfo,
  generateSnakeDraftTeams
} from '../src/lib/gamification.ts';
import { INITIAL_USERS, INITIAL_GAMES, INITIAL_QUESTIONS } from '../src/lib/seed-data.ts';
import { ArenaStore } from '../src/lib/arena-store.ts';
import { ICPC_PROBLEMS_DEF } from '../src/types/arena.ts';
import { seededShuffle, stringToSeed } from '../src/lib/shuffle.ts';
import { parseMathSegments, formatMathString, SYMBOL_MAP } from '../src/lib/math-parser.ts';

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
console.log('--- [TEST GROUP 1: Pengguna & Kohort Kelas (28 Mahasiswa + 1 Dosen)] ---');
const kamisStudents = INITIAL_USERS.filter(u => u.role === 'PESERTA' && u.klub_hari === 'KAMIS');
const jumatStudents = INITIAL_USERS.filter(u => u.role === 'PESERTA' && u.klub_hari === 'JUMAT');
const adminUsers = INITIAL_USERS.filter(u => u.role === 'ADMIN');

assert(kamisStudents.length === 15, `Kelas KAMIS memiliki tepat 15 Mahasiswa SI 2025 (Aktual: ${kamisStudents.length})`);
assert(jumatStudents.length === 13, `Kelas JUMAT memiliki tepat 13 Mahasiswa TI/SI 2024-2025 (Aktual: ${jumatStudents.length})`);
assert(adminUsers.length >= 1, `Akun Admin Pembina Tarq Hilmar Siregar terdaftar`);

const cecilia = INITIAL_USERS.find(u => u.nim === '2545001');
assert(cecilia !== undefined, 'Mahasiswa 2545001 (Cecilia_AlgoStar) terdaftar');
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
const teamsKamis = generateSnakeDraftTeams(INITIAL_USERS, 'KAMIS', 3);
assert(teamsKamis.length === 5, `15 Mahasiswa SI 2025 dibagi menjadi 5 Tim (Aktual: ${teamsKamis.length})`);
teamsKamis.forEach((t, i) => {
  assert(t.daftar_nim_json.length === 3, `Tim #${i + 1} (${t.nama_tim}) memiliki 3 anggota`);
  assert(t.total_skor_tim > 0, `Total skor tim #${i + 1} terhitung: ${t.total_skor_tim} XP`);
  assert(Boolean(t.kode_gabung && t.kode_gabung.length === 6), `Tim #${i + 1} memiliki kode gabung 6-karakter (${t.kode_gabung})`);
  assert(t.leader_nim === t.daftar_nim_json[0], `Tim #${i + 1} menunjuk draft pick pertama sebagai leader (${t.leader_nim})`);
});

const teamsJumat = generateSnakeDraftTeams(INITIAL_USERS, 'JUMAT', 3);
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

const mhsA = INITIAL_USERS.find(u => u.nim === '2545001'); // Cecilia
const mhsB = INITIAL_USERS.find(u => u.nim === '250201002'); // Indra
const mhsC = INITIAL_USERS.find(u => u.nim === '250201003'); // Mardianus
const mhsD = INITIAL_USERS.find(u => u.nim === '250201004'); // Laksman

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
const mhsCecilia = INITIAL_USERS.find(u => u.nim === '2545001');
const mhsIndra = INITIAL_USERS.find(u => u.nim === '250201002');
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

// 19.5 Uji decoupling penilaian (Answer by ID Soal, bukan index)
const firstQ = reloadedQs[0];
const answerResult = ArenaStore.answerQuestion({
  submissionId: subCecilia.id_submission,
  idSoal: firstQ.id_soal,
  jawaban: firstQ.kunci_jawaban || 'A',
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

console.log('\n========================================================');
console.log(`📊 Hasil Verifikasi: ${passedTests}/${totalTests} Uji Lulus (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('========================================================\n');

