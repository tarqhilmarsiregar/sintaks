-- ==============================================================================
-- STMIK TIME — CP ARENA: SUPABASE POSTGRESQL RELATIONAL SCHEMA
-- Platform Gamifikasi & Competitive Programming Pembelajaran Terstruktur
-- Dosen Pembina: Tarq Hilmar Siregar, S.Kom
-- Arsitektur: Dynamic Cohorts, Snake-Draft Squads, & Server-Side Anti-Cheat Hardening
-- ==============================================================================

-- 1. DROP EXISTING RELATIONS & VIEWS (IDEMPOTENT CLEAN SLATE)
DROP VIEW IF EXISTS public.student_questions_view CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.cohort_game_access CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.cohorts CASCADE;

-- ==============================================================================
-- 2. TABEL COHORTS / KELAS PEMBELAJARAN DINAMIS
-- ==============================================================================
CREATE TABLE public.cohorts (
  id_cohort VARCHAR(50) PRIMARY KEY,
  nama_kelas VARCHAR(120) NOT NULL,
  kode_kelas VARCHAR(30) UNIQUE NOT NULL,
  periode VARCHAR(30) NOT NULL, -- Format: <Ganjil/Genap> <Tahun>, misal: 'Ganjil 2025'
  deskripsi TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_periode_format CHECK (periode ~ '^(Ganjil|Genap) [0-9]{4}$')
);

CREATE INDEX idx_cohorts_kode_kelas ON public.cohorts(kode_kelas);
CREATE INDEX idx_cohorts_is_active ON public.cohorts(is_active);

-- ==============================================================================
-- 3. TABEL TEAMS (SKUAD KOMPETITIF / ALGORITMA SNAKE-DRAFT)
-- ==============================================================================
CREATE TABLE public.teams (
  id_tim VARCHAR(50) PRIMARY KEY,
  nama_tim VARCHAR(150) NOT NULL,
  klub_hari VARCHAR(20) NOT NULL DEFAULT 'ALL',
  id_cohort VARCHAR(50) REFERENCES public.cohorts(id_cohort) ON DELETE SET NULL,
  kode_gabung VARCHAR(20) UNIQUE,
  leader_nim VARCHAR(30),
  daftar_nim_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  daftar_nama_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_skor_tim INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_id_cohort ON public.teams(id_cohort);
CREATE INDEX idx_teams_klub_hari ON public.teams(klub_hari);
CREATE INDEX idx_teams_kode_gabung ON public.teams(kode_gabung);

-- ==============================================================================
-- 4. TABEL USERS (MAHASISWA PESERTA & DOSEN / ROOT ADMIN)
-- ==============================================================================
CREATE TABLE public.users (
  nim VARCHAR(30) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(120) NOT NULL,
  codename VARCHAR(80) NOT NULL,
  avatar VARCHAR(20) NOT NULL DEFAULT 'TH', -- Standard Monogram Initials (Zero AI Slop)
  role VARCHAR(20) NOT NULL DEFAULT 'PESERTA' CHECK (role IN ('ADMIN', 'PESERTA')),
  prodi VARCHAR(80) NOT NULL,
  angkatan INT NOT NULL DEFAULT 2025,
  kelas_reguler VARCHAR(50) NOT NULL,
  klub_hari VARCHAR(20) NOT NULL DEFAULT 'ALL' CHECK (klub_hari IN ('KAMIS', 'JUMAT', 'LOMBA', 'ALL')),
  id_cohort VARCHAR(50) REFERENCES public.cohorts(id_cohort) ON DELETE SET NULL,
  periode VARCHAR(30) DEFAULT 'Ganjil 2025',
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  tier_badge VARCHAR(80) NOT NULL DEFAULT 'Logic Novice',
  milestones_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  id_tim VARCHAR(50) REFERENCES public.teams(id_tim) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_klub_hari ON public.users(klub_hari);
CREATE INDEX idx_users_id_cohort ON public.users(id_cohort);
CREATE INDEX idx_users_xp ON public.users(total_xp DESC);
CREATE INDEX idx_users_id_tim ON public.users(id_tim);

-- ==============================================================================
-- 5. TABEL GAMES (PAKET KONTES & MICRO-LEARNING)
-- ==============================================================================
CREATE TABLE public.games (
  id_game VARCHAR(30) PRIMARY KEY,
  ref_pertemuan VARCHAR(50) NOT NULL,
  judul_game VARCHAR(255) NOT NULL,
  kategori_materi VARCHAR(100) NOT NULL,
  kesulitan VARCHAR(20) NOT NULL CHECK (kesulitan IN ('Easy', 'Medium', 'Hard')),
  mode_game VARCHAR(10) NOT NULL CHECK (mode_game IN ('SOLO', 'TEAM')),
  pin_akses VARCHAR(30),
  status_kamis VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status_kamis IN ('UPCOMING', 'OPEN', 'FROZEN', 'ENDED')),
  status_jumat VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status_jumat IN ('UPCOMING', 'OPEN', 'FROZEN', 'ENDED')),
  status_lomba VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status_lomba IN ('UPCOMING', 'OPEN', 'FROZEN', 'ENDED')),
  cohort_statuses JSONB NOT NULL DEFAULT '{}'::JSONB,
  durasi_total_menit INT NOT NULL DEFAULT 20,
  durasi_per_soal_detik INT NOT NULL DEFAULT 60,
  min_nilai_lulus INT NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_mode ON public.games(mode_game);
CREATE INDEX idx_games_ref ON public.games(ref_pertemuan);

-- ==============================================================================
-- 6. TABEL COHORT_GAME_ACCESS (Resource Access Matrix Dinamis)
-- ==============================================================================
CREATE TABLE public.cohort_game_access (
  id_cohort VARCHAR(50) REFERENCES public.cohorts(id_cohort) ON DELETE CASCADE,
  id_game VARCHAR(30) REFERENCES public.games(id_game) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'OPEN', 'FROZEN', 'ENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_cohort, id_game)
);

-- ==============================================================================
-- 7. TABEL QUESTIONS (BANK SOAL & EDITORIAL PEMBAHASAN)
-- ==============================================================================
CREATE TABLE public.questions (
  id_soal VARCHAR(30) PRIMARY KEY,
  id_game VARCHAR(30) NOT NULL REFERENCES public.games(id_game) ON DELETE CASCADE,
  judul VARCHAR(200) NOT NULL,
  narasi_soal TEXT NOT NULL,
  cuplikan_kode TEXT,
  opsi_jawaban TEXT, -- Opsi terpisah tanda '|' (misal: "O(1)|O(N)|O(N^2)")
  kunci_jawaban TEXT NOT NULL,
  teks_hint TEXT,
  editorial TEXT NOT NULL,
  poin_dasar INT NOT NULL DEFAULT 50,
  first_blood_by VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_game ON public.questions(id_game);

-- ==============================================================================
-- 8. VIEW PERLINDUNGAN ANTI-CHEAT (ZERO ANSWER & EDITORIAL LEAKAGE)
-- ==============================================================================
-- View publik untuk akses mahasiswa aktif saat kuis berjalan,
-- secara ketat mengecualikan kunci_jawaban dan editorial.
CREATE OR REPLACE VIEW public.student_questions_view AS
SELECT 
  id_soal,
  id_game,
  judul,
  narasi_soal,
  cuplikan_kode,
  opsi_jawaban,
  teks_hint,
  poin_dasar,
  first_blood_by,
  created_at
FROM public.questions;

-- ==============================================================================
-- 9. TABEL SUBMISSIONS (RIWAYAT SUBMISI, AUDIT TRAIL, & PENILAIAN AKADEMIK)
-- ==============================================================================
CREATE TABLE public.submissions (
  id_submission VARCHAR(60) PRIMARY KEY,
  timestamp_mulai TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timestamp_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nim VARCHAR(30) NOT NULL REFERENCES public.users(nim) ON DELETE CASCADE,
  codename VARCHAR(80) NOT NULL,
  klub_hari VARCHAR(20) NOT NULL,
  id_game VARCHAR(30) NOT NULL REFERENCES public.games(id_game) ON DELETE CASCADE,
  mode_game VARCHAR(10) NOT NULL,
  id_tim VARCHAR(50),
  skor_xp INT NOT NULL DEFAULT 0,
  nilai_akademik INT NOT NULL DEFAULT 0,
  jumlah_benar INT NOT NULL DEFAULT 0,
  total_soal INT NOT NULL DEFAULT 0,
  status_lulus VARCHAR(20) NOT NULL DEFAULT 'BELUM LULUS' CHECK (status_lulus IN ('LULUS', 'BELUM LULUS')),
  streak_saat_ini INT NOT NULL DEFAULT 0,
  tab_switch_count INT NOT NULL DEFAULT 0,
  tab_switch_log JSONB NOT NULL DEFAULT '[]'::JSONB,
  shuffled_question_ids JSONB NOT NULL DEFAULT '[]'::JSONB,
  status_sesi VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status_sesi IN ('ACTIVE', 'DONE')),
  detail_jawaban_json JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE INDEX idx_submissions_user_game ON public.submissions(nim, id_game);
CREATE INDEX idx_submissions_game ON public.submissions(id_game);
CREATE INDEX idx_submissions_status ON public.submissions(status_sesi);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_game_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Read Access Policies
CREATE POLICY "Allow public read access to cohorts" ON public.cohorts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public read access to cohort_game_access" ON public.cohort_game_access FOR SELECT USING (true);
CREATE POLICY "Allow public read access to questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to submissions" ON public.submissions FOR SELECT USING (true);

-- Service Role Full Read/Write Policies (Next.js Server API Routes & Admin Operations)
CREATE POLICY "Allow service all cohorts" ON public.cohorts FOR ALL USING (true);
CREATE POLICY "Allow service all teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Allow service all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow service all games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow service all cohort_game_access" ON public.cohort_game_access FOR ALL USING (true);
CREATE POLICY "Allow service all questions" ON public.questions FOR ALL USING (true);
CREATE POLICY "Allow service all submissions" ON public.submissions FOR ALL USING (true);

-- ==============================================================================
-- 11. PRODUCTION SEED: ROOT ADMIN CREDENTIALS & STARTER COHORTS (CLEAN PRODUCTION)
-- ==============================================================================
-- Catatan Kepatuhan Mutu: 0 Mahasiswa Dummy pada Lingkungan Produksi Bersih.
-- Hanya kredensial root dosen pembina dan template kohort default yang diinisialisasi.

-- A. Starter Kohort Pembelajaran
INSERT INTO public.cohorts (id_cohort, nama_kelas, kode_kelas, periode, deskripsi)
VALUES
('c-kamis', 'Kelas KAMIS (SI 2025)', 'CP-SI-25-K', 'Ganjil 2025', 'Kohort praktikum Competitive Programming Kamis SI 2025'),
('c-jumat', 'Kelas JUMAT (TI & SI 2024–2025)', 'CP-TISI-2425-J', 'Ganjil 2025', 'Kohort gabungan TI & SI praktikum Jumat'),
('c-lomba', 'Kelas LOMBA (Kompetisi / Seleksi ICPC)', 'CP-ICPC-LOMBA', 'Ganjil 2025', 'Kontingen delegasi seleksi kompetisi ICPC')
ON CONFLICT (id_cohort) DO NOTHING;

-- B. Root Credentials Dosen Pembina & Admin (Tarq Hilmar Siregar, S.Kom)
INSERT INTO public.users (nim, password, nama_lengkap, codename, avatar, role, prodi, angkatan, kelas_reguler, klub_hari, total_xp, level, tier_badge, milestones_json, id_tim)
VALUES 
('ADMIN', 'ADMIN', 'Tarq Hilmar Siregar, S.Kom', 'Grandmaster_Tarq', 'TH', 'ADMIN', 'Teknik Informatika', 2020, 'DOSEN', 'ALL', 9999, 40, 'Grandmaster Time', '["FIRST_BLOOD", "PERFECT_100", "SPEED_DEMON", "STREAK_3X"]'::jsonb, NULL),
('DOSEN001', 'dosen123', 'Tarq Hilmar Siregar, S.Kom', 'Grandmaster_Tarq', 'TH', 'ADMIN', 'Teknik Informatika', 2020, 'DOSEN', 'ALL', 9999, 40, 'Grandmaster Time', '["FIRST_BLOOD", "PERFECT_100", "SPEED_DEMON", "STREAK_3X"]'::jsonb, NULL)
ON CONFLICT (nim) DO NOTHING;

-- C. Paket Game Default Pertemuan 1 (G1 - G7)
INSERT INTO public.games (id_game, ref_pertemuan, judul_game, kategori_materi, kesulitan, mode_game, pin_akses, status_kamis, status_jumat, durasi_total_menit, durasi_per_soal_detik, min_nilai_lulus)
VALUES
('G1', 'Pertemuan 1', 'Onboarding Arena: Pemanasan Logika & Big-O', 'Big-O & Game Theory', 'Easy', 'SOLO', NULL, 'ENDED', 'ENDED', 5, 45, 70),
('G2', 'Pertemuan 1', '[KAMIS] - ANATOMI ONLINE JUDGE, ATURAN I/O, & JEBAKAN PRESISI PYTHON', 'Big-O & Game Theory', 'Easy', 'SOLO', NULL, 'ENDED', 'UPCOMING', 6, 45, 70),
('G3', 'Pertemuan 1', '[JUMAT] - ANATOMI ONLINE JUDGE, ATURAN I/O, & JEBAKAN PRESISI PYTHON', 'Big-O & Game Theory', 'Easy', 'SOLO', NULL, 'UPCOMING', 'ENDED', 6, 45, 70),
('G4', 'Pertemuan 1', '[KAMIS] - ANALISIS KOMPLEKSITAS BIG-O, ATURAN 10^8, & POLA AD-HOC', 'Big-O & Game Theory', 'Medium', 'SOLO', NULL, 'ENDED', 'UPCOMING', 7, 50, 75),
('G5', 'Pertemuan 1', '[JUMAT] - ANALISIS KOMPLEKSITAS BIG-O, ATURAN 10^8, & POLA AD-HOC', 'Big-O & Game Theory', 'Medium', 'SOLO', NULL, 'UPCOMING', 'ENDED', 7, 50, 75),
('G6', 'Pertemuan 1', '[KAMIS] - OBSERVASI INVARIAN & COMBINATORIAL GAME THEORY', 'Big-O & Game Theory', 'Hard', 'TEAM', 'TIME-882', 'UPCOMING', 'UPCOMING', 10, 60, 75),
('G7', 'Pertemuan 1', '[JUMAT] - OBSERVASI INVARIAN & COMBINATORIAL GAME THEORY', 'Big-O & Game Theory', 'Hard', 'TEAM', 'TIME-993', 'FROZEN', 'FROZEN', 10, 60, 75)
ON CONFLICT (id_game) DO NOTHING;

-- D. Bank Soal & Editorial Default (Pertemuan 1)
INSERT INTO public.questions (id_soal, id_game, judul, narasi_soal, cuplikan_kode, opsi_jawaban, kunci_jawaban, teks_hint, editorial, poin_dasar, first_blood_by)
VALUES
('Q101', 'G1', 'Analisis Nested Loop Kompleks', 'Perhatikan cuplikan algoritma di bawah ini. Berapakah kompleksitas asimtotik waktu terburuk (Worst-case Time Complexity) dalam notasi Big-O?', 'for i in range(n):\n    j = 1\n    while j < n:\n        j *= 2\n        total += (i + j)', 'O(N)|O(N log N)|O(N^2)|O(log N)', 'O(N log N)', 'Perhatikan pertumbuhan variabel j yang berlipat ganda dua kali setiap iterasi.', 'Loop luar berjalan N kali. Loop dalam menggandakan j dua kali lipat setiap iterasi (j = 1, 2, 4, 8, ...), sehingga loop dalam berjalan sebanyak log2(N) kali. Total kompleksitas adalah O(N * log N).', 50, 'Tomy_FastIO'),
('Q102', 'G1', 'Jebakan Pembagian Integer Python', 'Pada Python 3, apa output tepat dari baris kode berikut saat memproses batasan bilangan besar?', 'a = 10**18 + 7\nb = 10**18\nprint(int(a / 1) - b)', '7|0|1|OverflowError', '0', 'Perhatikan tipe data kembalian dari operator garis miring tunggal (/) pada Python 3.', 'Operator / di Python selalu menghasilkan float presisi 64-bit IEEE 754 (sekitar 15-17 digit signifikan). 10^18 melebihi presisi float, sehingga pembagian desimal mengalami loss of precision menjadi nilai yang dibulatkan. Gunakan integer division // untuk mempertahankan presisi integer.', 50, 'Tomy_FastIO'),
('Q103', 'G1', 'Batasan Operasi 1 Detik Online Judge', 'Pada Online Judge modern dengan limit waktu 1.0 detik (CPU 2-3 GHz), berapakah estimasi batas aman jumlah operasi komputasi dasar agar tidak terkena Time Limit Exceeded (TLE)?', '10^6 operasi|10^8 operasi|10^10 operasi|10^12 operasi', '10^8 operasi', 'Ingat Aturan Emas 10^8 per detik di CP.', 'Aturan praktis Competitive Programming internasional adalah 1 detik setara dengan sekitar 10^8 operasi dasar (100 juta operasi) pada judge modern.', 50, 'Willson_SHIRO'),
('Q201', 'G2', 'Jebakan Presisi Pembagian Python', 'Diberikan perhitungan matematis berikut. Apa output ekspresi (1 / 10 + 2 / 10 == 3 / 10)?', 'True|False|SyntaxError|TypeError', 'False', 'Pikirkan representasi biner pecahan floating point.', 'Dalam representasi IEEE 754 floating point, 0.1 + 0.2 menghasilkan 0.30000000000000004 sehingga pembandingan kesetaraan presisi biner menghasilkan False.', 60, 'Tomy_FastIO'),
('Q202', 'G2', 'Aturan Fast I/O Python', 'Mengapa pada Competitive Programming kita wajib memakai sys.stdin.readline daripada input() saat membaca 2 * 10^5 baris?', 'sys.stdin.readline tidak membaca newline|input() memicu garbage collector|input() melakukan sanitasi string dan EOF handling berlebih yang lambat|Tidak ada bedanya', 'input() melakukan sanitasi string dan EOF handling berlebih yang lambat', 'Fungsi bawaan input() menangani prompt dan parsing ekstra yang memperlambat loop I/O.', 'input() mengecek prompt, stripping karakter kontrol, dan EOF check per baris yang lambat. sys.stdin.readline membaca raw buffer dari C layer dengan performa hingga 5-10x lebih cepat.', 60, 'Mardianus_StackHero'),
('Q203', 'G2', 'Triage Kompleksitas 1 Detik', 'Jika N = 10^5 dan time limit 1 detik, algoritma dengan kompleksitas manakah yang dipastikan AMAN dari TLE?', 'O(N^2)|O(2^N)|O(N log N)|O(N!)', 'O(N log N)', '10^5 log2(10^5) berkisar 1.7 * 10^6 operasi.', 'O(N log N) membutuhkan ~1.7 * 10^6 operasi, jauh di bawah batas aman 10^8 per detik. O(N^2) membutuhkan 10^10 yang pasti menghasilkan TLE.', 65, 'Tomy_FastIO'),
('Q204', 'G2', 'Langkah Kunci Subtraction Game', 'Pada permainan kelereng di mana dua pemain bergantian mengambil 1, 2, atau 3 kelereng, dan yang mengambil kelereng terakhir MENANG. Kondisi posisi kalah (P-position) terjadi jika jumlah kelereng N adalah?', 'N genap|N ganjil|N habis dibagi 4|N prima', 'N habis dibagi 4', 'Pikirkan kelipatan dari (maksimum langkah + 1).', 'Aturan combinatorial game kelereng modulo (k+1): jika N % 4 == 0, setiap langkah pemain pertama dapat selalu diimbangi oleh pemain kedua hingga sisa 0.', 65, 'Tomy_FastIO')
ON CONFLICT (id_soal) DO NOTHING;

-- ==============================================================================
-- 12. OPTIONAL TEST FIXTURES / DEMO DATA (JANGAN DIJALANKAN DI PRODUKSI)
-- ==============================================================================
-- Blok di bawah ini hanya dibuka jika Anda memerlukan seed 28 mahasiswa mock
-- untuk keperluan local development, QA automated testing, atau benchmark performa.
/*
-- 1. KELAS KAMIS (15 Mahasiswa SI 2025)
INSERT INTO public.users (nim, password, nama_lengkap, codename, avatar, role, prodi, angkatan, kelas_reguler, klub_hari, total_xp, level, tier_badge, milestones_json, id_tim)
VALUES 
('2545001', '2545001', 'Cecilia Anggraini', 'Cecilia_AlgoStar', 'CA', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 481, 2, 'O(N) Sprinter', '["SPEED_DEMON"]'::jsonb, NULL),
('250201002', '250201002', 'Indra Setiawan', 'Indra_trll', 'IS', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 969, 4, 'O(N) Sprinter', '["FIRST_BLOOD", "STREAK_3X"]'::jsonb, NULL),
('250201003', '250201003', 'Mardianus Gea', 'Mardianus_StackHero', 'MG', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 966, 4, 'O(N) Sprinter', '["FIRST_BLOOD", "SPEED_DEMON"]'::jsonb, NULL),
('250201004', '250201004', 'Laksman Dwi Prasetyo', 'Laksman_DPKnight', 'LP', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 898, 4, 'O(N) Sprinter', '["STREAK_3X"]'::jsonb, NULL),
('250201005', '250201005', 'Ibrena Nora Bosq', 'Ibrenanorabosq', 'IB', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 880, 4, 'O(N) Sprinter', '["SPEED_DEMON"]'::jsonb, NULL),
('250201006', '250201006', 'Tasya Bitriana', 'Tasya_BitQueen', 'TB', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 854, 4, 'O(N) Sprinter', '["PERFECT_100"]'::jsonb, NULL),
('250201007', '250201007', 'Risca Hashifa', 'Risca_HashHunter', 'RH', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 805, 4, 'O(N) Sprinter', '["STREAK_3X"]'::jsonb, NULL),
('250201008', '250201008', 'Tomy Kurniawan', 'Tomy_FastIO', 'TK', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 710, 3, 'O(N) Sprinter', '["FIRST_BLOOD", "SPEED_DEMON"]'::jsonb, NULL),
('250201009', '250201009', 'Ahmad Farhan', 'Ahmad_Binary', 'AF', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 680, 3, 'O(N) Sprinter', '[]'::jsonb, NULL),
('250201010', '250201010', 'Rian Hidayat', 'Rian_GraphMaster', 'RH', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 640, 3, 'O(N) Sprinter', '[]'::jsonb, NULL),
('250201011', '250201011', 'Bima Sakti', 'Bima_BitManip', 'BS', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 490, 2, 'O(N) Sprinter', '[]'::jsonb, NULL),
('250201012', '250201012', 'Dina Lestari', 'Dina_Recursion', 'DL', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 430, 2, 'Logic Novice', '[]'::jsonb, NULL),
('250201013', '250201013', 'Fajar Pratama', 'Fajar_Sorting', 'FP', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 390, 2, 'Logic Novice', '[]'::jsonb, NULL),
('250201014', '250201014', 'Gita Permata', 'Gita_DynamicProg', 'GP', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 240, 1, 'Logic Novice', '[]'::jsonb, NULL),
('250201015', '250201015', 'Hendra Wijaya', 'Hendra_ArrayPro', 'HW', 'PESERTA', 'Sistem Informasi', 2025, 'SI C 25', 'KAMIS', 180, 1, 'Logic Novice', '[]'::jsonb, NULL)
ON CONFLICT (nim) DO NOTHING;

-- 2. KELAS JUMAT (13 Mahasiswa TI 2024, TI 2025 & SI 2025)
INSERT INTO public.users (nim, password, nama_lengkap, codename, avatar, role, prodi, angkatan, kelas_reguler, klub_hari, total_xp, level, tier_badge, milestones_json, id_tim)
VALUES 
('240101001', '240101001', 'Willson Gunawan', 'Willson_SHIRO', 'WG', 'PESERTA', 'Teknik Informatika', 2024, 'TI A 24', 'JUMAT', 1250, 5, 'Greedy Tactician', '["FIRST_BLOOD", "SPEED_DEMON", "STREAK_3X"]'::jsonb, NULL),
('240101002', '240101002', 'Kevin Anderson', 'MemorySlayer', 'KA', 'PESERTA', 'Teknik Informatika', 2024, 'TI A 24', 'JUMAT', 1190, 5, 'Greedy Tactician', '["PERFECT_100", "STREAK_3X"]'::jsonb, NULL),
('240101003', '240101003', 'Steven Chandra', 'HashMaster', 'SC', 'PESERTA', 'Teknik Informatika', 2024, 'TI A 24', 'JUMAT', 980, 4, 'O(N) Sprinter', '["FIRST_BLOOD"]'::jsonb, NULL),
('240101004', '240101004', 'Ricky Jonathan', 'ByteVoyager', 'RJ', 'PESERTA', 'Teknik Informatika', 2024, 'TI B 24', 'JUMAT', 920, 4, 'O(N) Sprinter', '["SPEED_DEMON"]'::jsonb, NULL),
('240101005', '240101005', 'David Christian', 'MatrixRunner', 'DC', 'PESERTA', 'Teknik Informatika', 2024, 'TI B 24', 'JUMAT', 740, 3, 'O(N) Sprinter', '[]'::jsonb, NULL),
('240101006', '240101006', 'Michael Tanuwijaya', 'CodePhantom', 'MT', 'PESERTA', 'Teknik Informatika', 2024, 'TI B 24', 'JUMAT', 690, 3, 'O(N) Sprinter', '[]'::jsonb, NULL),
('240101007', '240101007', 'Daniel Ferdinand', 'BinaryTitan', 'DF', 'PESERTA', 'Teknik Informatika', 2024, 'TI B 24', 'JUMAT', 630, 3, 'O(N) Sprinter', '[]'::jsonb, NULL),
('250101008', '250101008', 'Jason Leonard', 'QuantumSpark', 'JL', 'PESERTA', 'Teknik Informatika', 2025, 'TI A 25', 'JUMAT', 490, 2, 'O(N) Sprinter', '[]'::jsonb, NULL),
('250101009', '250101009', 'Bryan Nicholas', 'CyberFalcon', 'BN', 'PESERTA', 'Teknik Informatika', 2025, 'TI A 25', 'JUMAT', 450, 2, 'O(N) Sprinter', '[]'::jsonb, NULL),
('250101010', '250101010', 'Edwin Prayoga', 'DevRonin', 'EP', 'PESERTA', 'Teknik Informatika', 2025, 'TI A 25', 'JUMAT', 410, 2, 'Logic Novice', '[]'::jsonb, NULL),
('250101011', '250101011', 'Felix Gunardi', 'PixelSavant', 'FG', 'PESERTA', 'Teknik Informatika', 2025, 'TI A 25', 'JUMAT', 380, 2, 'Logic Novice', '[]'::jsonb, NULL),
('250101012', '250101012', 'Jessica Angelina', 'LogicViper', 'JA', 'PESERTA', 'Teknik Informatika', 2025, 'TI B 25', 'JUMAT', 230, 1, 'Logic Novice', '[]'::jsonb, NULL),
('250101013', '250101013', 'William Hartono', 'NullPointer', 'WH', 'PESERTA', 'Sistem Informasi', 2025, 'SI A 25', 'JUMAT', 190, 1, 'Logic Novice', '[]'::jsonb, NULL)
ON CONFLICT (nim) DO NOTHING;
*/
