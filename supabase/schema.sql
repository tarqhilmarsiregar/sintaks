-- ==============================================================================
-- CP ARENA (COMPETITIVE PROGRAMMING ARENA)
-- Supabase PostgreSQL Database Schema with Row-Level Security (RLS)
-- Designed for University Students with NIM Authentication
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF EXIST (Order matters due to foreign keys)
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.test_cases CASCADE;
DROP TABLE IF EXISTS public.problems CASCADE;
DROP TABLE IF EXISTS public.contest_registrations CASCADE;
DROP TABLE IF EXISTS public.contests CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nim VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'lecturer', 'admin')),
  class_group VARCHAR(50) DEFAULT 'Teknik Informatika 2024',
  rating INT NOT NULL DEFAULT 1200,
  solved_count INT NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on NIM for ultra-fast lookup
CREATE INDEX idx_profiles_nim ON public.profiles(nim);
CREATE INDEX idx_profiles_rating ON public.profiles(rating DESC);

-- 4. CONTESTS TABLE
CREATE TABLE public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  freeze_minutes INT NOT NULL DEFAULT 60,
  penalty_minutes INT NOT NULL DEFAULT 20,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contests_slug ON public.contests(slug);
CREATE INDEX idx_contests_timing ON public.contests(start_time, end_time);

-- 5. CONTEST REGISTRATIONS
CREATE TABLE public.contest_registrations (
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contest_id, user_id)
);

-- 6. PROBLEMS TABLE
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  order_letter VARCHAR(5) DEFAULT 'A',
  statement_md TEXT NOT NULL,
  input_format TEXT NOT NULL,
  output_format TEXT NOT NULL,
  constraints TEXT NOT NULL,
  time_limit_ms INT NOT NULL DEFAULT 1000,
  memory_limit_mb INT NOT NULL DEFAULT 256,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problems_slug ON public.problems(slug);
CREATE INDEX idx_problems_contest ON public.problems(contest_id);

-- 7. TEST CASES TABLE
CREATE TABLE public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  input_data TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  explanation TEXT,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  points INT NOT NULL DEFAULT 10,
  order_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_cases_problem ON public.test_cases(problem_id);

-- 8. SUBMISSIONS TABLE
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  language VARCHAR(30) NOT NULL CHECK (language IN ('cpp', 'python', 'java', 'c', 'javascript')),
  source_code TEXT NOT NULL,
  verdict VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (verdict IN ('AC', 'WA', 'TLE', 'MLE', 'CE', 'RE', 'PENDING', 'RUNNING')),
  execution_time_ms INT DEFAULT 0,
  memory_kb INT DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_user ON public.submissions(user_id);
CREATE INDEX idx_submissions_problem ON public.submissions(problem_id);
CREATE INDEX idx_submissions_contest ON public.submissions(contest_id);
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is lecturer or admin
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('lecturer', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Public read, User can update own profile, Staff can manage all
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Contests: Public read published contests, Staff can do anything
CREATE POLICY "Published contests are viewable by everyone" 
  ON public.contests FOR SELECT 
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Staff can insert/update/delete contests" 
  ON public.contests FOR ALL 
  USING (public.is_staff());

-- Problems: Anyone can view published problems
CREATE POLICY "Published problems are viewable by everyone" 
  ON public.problems FOR SELECT 
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Staff can manage problems" 
  ON public.problems FOR ALL 
  USING (public.is_staff());

-- Test Cases: CRITICAL CP SECURITY RULE
-- Students can ONLY view test cases marked as `is_sample = true`
CREATE POLICY "Students can only view sample test cases" 
  ON public.test_cases FOR SELECT 
  USING (is_sample = true OR public.is_staff());

CREATE POLICY "Staff can manage all test cases" 
  ON public.test_cases FOR ALL 
  USING (public.is_staff());

-- Submissions:
-- Authenticated users can create submissions
CREATE POLICY "Users can create their own submissions" 
  ON public.submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions or staff can view all
CREATE POLICY "Users can view own submissions, staff can view all" 
  ON public.submissions FOR SELECT 
  USING (auth.uid() = user_id OR public.is_staff());

-- Registrations:
CREATE POLICY "Users can register for contests" 
  ON public.contest_registrations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Registrations viewable by everyone" 
  ON public.contest_registrations FOR SELECT 
  USING (true);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_nim TEXT;
  v_name TEXT;
  v_role TEXT;
  v_class TEXT;
BEGIN
  -- Extract metadata or fallback from email
  v_nim := COALESCE(NEW.raw_user_meta_data->>'nim', SPLIT_PART(NEW.email, '@', 1));
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mahasiswa ' || v_nim);
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_class := COALESCE(NEW.raw_user_meta_data->>'class_group', 'Teknik Informatika 2024');

  INSERT INTO public.profiles (id, nim, full_name, role, class_group)
  VALUES (NEW.id, v_nim, v_name, v_role, v_class)
  ON CONFLICT (id) DO UPDATE
  SET nim = EXCLUDED.nim,
      full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- INITIAL SEED DATA FOR CP ARENA
-- ==============================================================================

-- Contests
INSERT INTO public.contests (id, title, slug, description, start_time, end_time, freeze_minutes, penalty_minutes, is_published)
VALUES 
(
  'a0000000-0000-0000-0000-000000000001',
  'Pekan Algoritma Mahasiswa 2026 (PAM-2026)',
  'pam-2026',
  'Kompetisi pemrograman tahunan tingkat universitas. Terbuka untuk seluruh mahasiswa angkatan 2023-2026. Format aturan mengacu pada standar ACM-ICPC dengan penalti 20 menit untuk setiap jawaban salah yang akhirnya Accepted.',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '4 hours',
  60,
  20,
  true
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Warm-up Latihan Mandiri Struktur Data',
  'warmup-dsa-2026',
  'Arena latihan mandiri untuk memperkuat fondasi array, stack, queue, dan greedy algorithm.',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '30 days',
  0,
  0,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Problems
INSERT INTO public.problems (id, contest_id, title, slug, order_letter, statement_md, input_format, output_format, constraints, time_limit_ms, memory_limit_mb, difficulty, tags, is_published)
VALUES 
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Penjumlahan Dua Bilangan Prima',
  'penjumlahan-dua-bilangan-prima',
  'A',
  'Diberikan sebuah bilangan bulat genap $N$ yang lebih besar dari $2$. Berdasarkan Hipotesis Goldbach, setiap bilangan genap yang lebih besar dari 2 dapat dinyatakan sebagai penjumlahan dari dua bilangan prima. Tugas Anda adalah menemukan dua bilangan prima $P_1$ dan $P_2$ sedemikian sehingga $P_1 + P_2 = N$ dan nilai $|P_1 - P_2|$ sekecil mungkin. Jika terdapat beberapa kemungkinan, pilih pasangan dengan $P_1 \le P_2$.',
  'Baris pertama berisi sebuah bilangan bulat $T$ ($1 \le T \le 100$) yang menyatakan jumlah kasus uji. Setiap kasus uji terdiri dari sebuah baris yang berisi satu bilangan genap $N$.',
  'Untuk setiap kasus uji, cetak dua bilangan prima $P_1$ dan $P_2$ yang dipisahkan oleh spasi pada satu baris.',
  '4 \le N \le 10^6, N \text{ adalah bilangan genap}',
  1000,
  256,
  'Easy',
  ARRAY['Math', 'Number Theory', 'Sieve of Eratosthenes'],
  true
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Rotasi Matriks Spiral Terbalik',
  'rotasi-matriks-spiral-terbalik',
  'B',
  'Diberikan matriks berukuran $M \times N$. Anda diminta untuk menelusuri elemen-elemen matriks tersebut dalam urutan spiral searah jarum jam (dimulai dari pojok kiri atas $(1,1)$ menuju ke kanan, bawah, kiri, atas, dst), lalu mencetak hasil penelusuran tersebut secara terbalik (dari elemen spiral terakhir hingga elemen spiral pertama).',
  'Baris pertama berisi dua bilangan bulat $M$ dan $N$. $M$ baris berikutnya masing-masing berisi $N$ bilangan bulat yang menyatakan elemen matriks.',
  'Cetak satu baris berisi $(M \times N)$ bilangan bulat yang dipisahkan oleh spasi, sesuai dengan urutan spiral terbalik.',
  '1 \le M, N \le 500, -10^9 \le A_{i,j} \le 10^9',
  1000,
  256,
  'Medium',
  ARRAY['Matrix', 'Implementation', 'Simulation'],
  true
),
(
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Jalur Terpendek Antar Gedung Kampus',
  'jalur-terpendek-antar-gedung-kampus',
  'C',
  'Kampus memiliki $V$ gedung yang dihubungkan oleh $E$ jalan dua arah. Setiap jalan memiliki panjang jarak tertentu (dalam meter). Mahasiswa ingin berjalan dari gedung $S$ menuju gedung $D$ dalam waktu seminimal mungkin. Namun, terdapat $K$ jalan khusus yang sedang dalam perbaikan sehingga tidak dapat dilalui. Carilah jarak terpendek dari $S$ ke $D$. Jika tidak ada jalan yang memungkinkan, cetak -1.',
  'Baris pertama berisi empat bilangan $V, E, S, D$. $E$ baris berikutnya berisi $u, v, w$ yang menyatakan jalan dua arah antara $u$ dan $v$ dengan bobot $w$. Baris berikutnya berisi bilangan $K$, diikuti oleh $K$ baris berisi pasangan jalan yang ditutup.',
  'Cetak satu bilangan bulat yang menyatakan jarak terpendek dari $S$ ke $D$, atau -1 jika tidak tercapai.',
  '2 \le V \le 10^5, 1 \le E \le 2 \times 10^5, 1 \le w \le 10^9',
  2000,
  256,
  'Hard',
  ARRAY['Graph', 'Dijkstra', 'Shortest Path'],
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Sample Test Cases
INSERT INTO public.test_cases (problem_id, input_data, expected_output, explanation, is_sample, points, order_index)
VALUES 
(
  'b0000000-0000-0000-0000-000000000001',
  '2
10
16',
  '5 5
3 13',
  'Untuk N=10, pasangan prima yang mungkin adalah (3, 7) dan (5, 5). Selisih terkecil adalah |5 - 5| = 0. Untuk N=16, pasangan primanya adalah (3, 13) dan (5, 11). Selisih terkecil adalah |5 - 11| = 6, sehingga jawabannya 5 11 (catatan: 3 13 memiliki selisih 10, 5 11 memiliki selisih 6).',
  true,
  20,
  1
),
(
  'b0000000-0000-0000-0000-000000000001',
  '1
4',
  '2 2',
  'Satu-satunya pasangan prima untuk 4 adalah 2 + 2 = 4.',
  true,
  20,
  2
),
(
  'b0000000-0000-0000-0000-000000000002',
  '3 3
1 2 3
4 5 6
7 8 9',
  '5 4 7 8 9 6 3 2 1',
  'Penelusuran spiral searah jarum jam: 1 2 3 6 9 8 7 4 5. Dibalik menjadi: 5 4 7 8 9 6 3 2 1.',
  true,
  30,
  1
);
