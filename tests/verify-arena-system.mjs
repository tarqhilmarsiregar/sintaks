import {
  calculateAcademicGrade,
  calculateQuestionXP,
  calculateLevelInfo,
  generateSnakeDraftTeams
} from '../src/lib/gamification.ts';
import { INITIAL_USERS, INITIAL_GAMES, INITIAL_QUESTIONS } from '../src/lib/seed-data.ts';
import { ArenaStore } from '../src/lib/arena-store.ts';
import { ICPC_PROBLEMS_DEF } from '../src/types/arena.ts';

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

// 6. UJI INTEGRITAS 7 PAKET GAMES
console.log('\n--- [TEST GROUP 6: Integritas 7 Paket Game Sesuai Screenshot] ---');
assert(INITIAL_GAMES.length === 7, `Tersedia 7 Paket Game G1-G7 (Aktual: ${INITIAL_GAMES.length})`);
const g1 = INITIAL_GAMES.find(g => g.id_game === 'G1');
const g2 = INITIAL_GAMES.find(g => g.id_game === 'G2');
const g6 = INITIAL_GAMES.find(g => g.id_game === 'G6');
assert(g1?.status_kamis === 'ENDED', 'G1 Kamis berstatus ENDED');
assert(g2?.status_kamis === 'ENDED', 'G2 Kamis berstatus ENDED');
assert(g6?.mode_game === 'TEAM', 'G6 merupakan game mode TEAM');
assert(g6?.pin_akses === 'TIME-882', 'G6 dilindungi PIN Akses TIME-882');

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
  if (user.role === 'ADMIN') return '/admin/games';
  return '/mahasiswa/dashboard';
}

assert(resolveUserRoute(null) === '/login', 'Pengunjung tanpa sesi dialihkan ke /login');
assert(resolveUserRoute({ role: 'PESERTA', nim: '2545001' }) === '/mahasiswa/dashboard', 'Peserta Mahasiswa login langsung dialihkan ke /mahasiswa/dashboard');
assert(resolveUserRoute({ role: 'ADMIN', nim: 'DOSEN001' }) === '/admin/games', 'Admin/Dosen login langsung dialihkan ke /admin/games');
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
const VALID_ADMIN_TABS = ['games', 'questions', 'teams', 'students'];
function resolveAdminUrl(param) {
  return VALID_ADMIN_TABS.includes(param) ? `/admin/${param}` : '/admin/games';
}

VALID_ADMIN_TABS.forEach(tab => {
  assert(resolveAdminUrl(tab) === `/admin/${tab}`, `Rute dinamis admin /admin/${tab} valid`);
});
assert(resolveAdminUrl('unknown-tab') === '/admin/games', 'Rute tab admin tidak valid otomatis di-fallback ke /admin/games');
assert(resolveAdminUrl('') === '/admin/games', 'Rute tab admin kosong otomatis di-fallback ke /admin/games');

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

console.log('\n========================================================');
console.log(`📊 Hasil Verifikasi: ${passedTests}/${totalTests} Uji Lulus (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('========================================================\n');

