# 🏆 CP ARENA — Software Development Life Cycle (SDLC) Tracking & Engineering Log

> **Project Name:** CP Arena (Competitive Programming Arena for University Students)  
> **Target Audience:** Mahasiswa & Dosen Pemrograman Kompetitif / Struktur Data & Algoritma  
> **Tech Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS), Supabase (Auth, PostgreSQL, Realtime, RLS), Vercel  
> **Default Authentication:** NIM as Identifier & Default Password (NIM)  
> **Author & Lead Architect:** Multi-Role Engineering Guild (Software Engineer, UI/UX Designer, QA, Product Engineer, Professional CP Lecturer)  
> **Repository:** `d:\CP-Arena`  
> **Initiation Date:** 2026-11-10  

---

## 📌 Executive Summary & Roles Spectrum

Sebagai tim multidisipliner terpadu:
1. **Software Engineer:** Merancang arsitektur monolit modular Next.js App Router, integrasi Supabase SSR (`@supabase/ssr`), Row Level Security (RLS), type safety end-to-end, dan arsitektur eksekusi kode (sandbox/judge runner).
2. **UI/UX Designer:** Merancang antarmuka arena kompetitif berstandar internasional (seperti Codeforces, AtCoder, Kattis) dengan sentuhan modern developer aesthetic, split-pane problem/editor view, real-time visual feedback, dan ICPC scoreboard.
3. **QA Engineer:** Menjamin *zero critical vulnerability*, validasi skema runtime, verifikasi hak akses antar-role (Mahasiswa vs Dosen/Admin), serta validasi edge case competitive programming (TLE, MLE, WA, CE, RE) dengan automated unit & integration testing.
4. **Product Engineer:** Menyusun roadmap MVP, prioritisasi fitur bernilai tinggi, serta metrik retensi dan keaktifan mahasiswa dalam perkuliahan & latihan mandiri.
5. **Professional Lecturer in CP:** Memastikan kepatuhan standar pedagogis: format soal standar ACM-ICPC / IOI (Deskripsi, Format Masukan/Keluaran, Batasan/Constraints matematis, Contoh Kasus Uji beserta penjelasan), kalkulasi penalti waktu, serta klasifikasi materi (Greedy, DP, Graph, Math, dsb).

---

## 🧭 SDLC Methodology: Structured Feature-Driven Lifecycle

Siklus pengembangan CP Arena mengadopsi 6 fase SDLC yang terukur:
1. **Phase 1: Requirements Engineering & Pedagogical Analysis** (Analisis Kebutuhan & Desain Pembelajaran)
2. **Phase 2: Architectural & Database Engineering** (Skema Database Supabase, Auth Mapping NIM, Security RLS)
3. **Phase 3: UI/UX & Design System Architecture** (Design Tokens, Responsive Layouts, Code Editor, Scoreboard)
4. **Phase 4: Core Implementation & Integration** (Next.js Application, Supabase Client, Auth Flow, Problem Arena, Judge Engine)
5. **Phase 5: Quality Assurance, Security & Edge-Case Testing** (Automated QA Test Suite, Compilation & TLE Heuristic Verification)
6. **Phase 6: Deployment & DevOps to Vercel & Supabase Production** (Env Configuration, CI/CD, Production Readiness)

---

## 📊 Live Progress Tracker

| Phase | Description | Status | Completion % | Notes |
|-------|-------------|--------|--------------|-------|
| **Phase 1** | Requirements & Pedagogical Analysis | 🟢 COMPLETED | 100% | PRD, User Stories, & NIM Auth Matrix finalized |
| **Phase 2** | Architecture & Supabase Schema | 🟢 COMPLETED | 100% | ERD, SQL DDL with RLS, NIM-Auth trigger, Seeds |
| **Phase 3** | UI/UX & Design System Architecture | 🟢 COMPLETED | 100% | Dark theme, Split-Pane Arena, ICPC Scoreboard |
| **Phase 4** | Core Next.js Implementation | 🟢 COMPLETED | 100% | Next.js 15 App Router, Code Editor, API routes |
| **Phase 5** | QA, Verification & Edge Cases | 🟢 COMPLETED | 100% | 12/12 Automated Tests Passed (`npm test`) |
| **Phase 6** | Vercel Deployment & Handover Guide | 🟢 COMPLETED | 100% | Production build verified (`next build` 11/11 routes) |

---

## 📜 Detailed SDLC Phase Logs & Artifacts

### Phase 1: Requirements & Pedagogical Analysis (Product Engineer & CP Lecturer)
- **Problem Statement:** Mahasiswa membutuhkan platform kompetitif yang terintegrasi langsung dengan perkuliahan tanpa kerepotan registrasi email manual yang rawan salah. Dosen membutuhkan visibilitas terhadap pemahaman algoritma mahasiswa secara real-time.
- **Authentication Specification:**
  - Login menggunakan **NIM** dan **Password (default = NIM)**.
  - Untuk kompatibilitas penuh dengan Supabase Auth (yang mensyaratkan format email), platform mengimplementasikan *Internal Identity Proxy*: `NIM -> ${nim}@cparena.internal`. Mahasiswa hanya melihat dan mengisi form NIM & Password.
- **Role-Based Access Control (RBAC):**
  - `student`: Mengikuti kontes aktif, latihan mandiri di Bank Soal, submit kode solusi, melihat riwayat submission sendiri, melihat leaderboard publik.
  - `lecturer` / `admin`: Membuat/mengedit kontes, mengelola bank soal & test cases (termasuk hidden tests), memonitor freeze scoreboard, mengunggah batch akun mahasiswa via NIM range/CSV.

---

### Phase 2: Database & Architecture Blueprint (Software Engineer & Database Architect)
- **Database Schema File:** `supabase/schema.sql`
- **Entities & Tables:**
  1. `profiles`: `id (uuid, FK auth.users)`, `nim (varchar, unique)`, `full_name (varchar)`, `role (enum: student/lecturer/admin)`, `class_group (varchar)`, `rating`, `solved_count`.
  2. `contests`: `id (uuid)`, `title`, `slug`, `description`, `start_time`, `end_time`, `freeze_minutes`, `penalty_minutes`, `is_published`.
  3. `problems`: `id (uuid)`, `contest_id (nullable)`, `title`, `slug`, `order_letter`, `statement_md`, `input_format`, `output_format`, `constraints`, `time_limit_ms`, `memory_limit_mb`, `difficulty`, `tags`.
  4. `test_cases`: `id (uuid)`, `problem_id (FK)`, `input_data`, `expected_output`, `explanation`, `is_sample (boolean)`, `points`.
  5. `submissions`: `id (uuid)`, `user_id (FK)`, `problem_id (FK)`, `contest_id (nullable)`, `language`, `source_code`, `verdict`, `execution_time_ms`, `memory_kb`, `score`.
  6. `contest_registrations`: `(contest_id, user_id)`.
- **Security & RLS Policies:**
  - `test_cases`: Mahasiswa HANYA dapat membaca test case jika `is_sample = true`. Hidden test cases dilarang diakses oleh role `student` guna mencegah kecurangan hardcoding output.
  - `submissions`: Mahasiswa hanya bisa melihat kode milik dirinya sendiri; Dosen memiliki wewenang penuh untuk membaca seluruh submisi.
  - `handle_new_user()` PostgreSQL trigger otomatis menyinkronkan pendaftaran akun auth baru dengan entri `public.profiles`.

---

### Phase 3: UI/UX & Design System Architecture (UI/UX Designer)
- **Palette & Design Tokens:**
  - Background: Obsidian Dark (`#090d16`), Cards (`#0e1422`), Borders (`#1f2937`).
  - Brand Glow: Electric Indigo & Cyan (`#3b82f6` / `#06b6d4`).
  - Competitive Programming Verdict Colors:
    - **AC (Accepted):** Emerald `#10b981` (Glow effect & confetti celebration)
    - **WA (Wrong Answer):** Rose `#ef4444`
    - **TLE (Time Limit Exceeded):** Amber `#f59e0b`
    - **CE (Compilation Error):** Slate `#64748b`
    - **MLE (Memory Limit Exceeded):** Purple `#8b5cf6`
    - **First-to-Solve (FTS):** Gold star & solid emerald balloon.
- **Core Components Created:**
  - `src/components/CodeEditor.tsx`: Editor kode dengan penomoran baris, penanganan tab indentation (4 spasi), shortcut <kbd>Ctrl</kbd>+<kbd>Enter</kbd>, pemilih bahasa (C++, Python, Java), template starter otomatis, serta drawer pengujian kasus uji (Sample, Custom Input, Verdict Log).
  - `src/components/ScoreboardTable.tsx`: Live scoreboard berstandar ACM-ICPC dengan urutan peringkat, jumlah soal terpecahkan, penalti waktu, balon per soal, indikator First-to-Solve, dan pencarian instan berdasarkan NIM/Nama.
  - `src/components/CountdownTimer.tsx`: Penghitung waktu mundur kontes secara live dengan peringatan pembekuan (*freeze scoreboard*) di sisa 60 menit.
  - `src/components/VerdictBadge.tsx`: Badge semantik kode warna untuk status submisi.
  - `src/components/Navbar.tsx` & `Footer.tsx`: Navigasi dan footer bertema universitas.

---

### Phase 4: Implementation Logs & Application Routing (Software Engineer)
- **Next.js 15 App Router Structure:**
  - `/` — Beranda (Hero, Kontes Aktif, Soal Terpopuler, Top Mahasiswa widget).
  - `/login` — Portal Masuk Khusus Mahasiswa & Dosen (Default NIM & Password NIM, dilengkapi tombol one-click demo credentials).
  - `/contests` — Daftar kontes resmi kampus (Live, Upcoming, dan Arsip).
  - `/contests/[slug]` — Ikhtisar kontes, tabel soal A, B, C, serta countdown timer.
  - `/contests/[slug]/arena/[problemSlug]` — **THE ARENA**: Tampilan split-pane interaktif dengan deskripsi soal di sisi kiri dan code editor di sisi kanan.
  - `/contests/[slug]/scoreboard` — Scoreboard resmi ICPC dengan indikator balon.
  - `/problems` — Arsip bank soal dengan filter tingkat kesulitan dan topik algoritma.
  - `/problems/[slug]` — Arena mode latihan bebas tanpa tekanan waktu.
  - `/submissions` — Riwayat submisi mahasiswa dengan filter verdict, bahasa, dan modal peninjau kode (*Code Inspector*).
  - `/admin` — Portal Dosen: Pendaftaran massal NIM mahasiswa (*batch import*), pembuat soal baru berstandar CP, dan manajemen jadwal kontes.
  - `/api/auth/login` — Endpoint autentikasi proksi NIM.
  - `/api/submissions` — Endpoint evaluasi kode juri otomatis.

---

### Phase 5: Quality Assurance & Testing (QA Engineer)
- **Automated Test Suite:** `tests/verify-system.mjs` (dijalankan via `npm test`).
- **Hasil Pengujian Otomatis (12/12 Lolos - 100%):**
  1. `[PASS]` Pemetaan NIM `230101001` ke email proksi internal `230101001@cparena.internal`.
  2. `[PASS]` Ekstraksi terbalik email proksi ke NIM mahasiswa.
  3. `[PASS]` Mahasiswa berhasil login menggunakan Password Default (NIM).
  4. `[PASS]` Validasi profil terautentikasi (Budi Santoso).
  5. `[PASS]` Penolakan login jika password tidak cocok dengan kredensial.
  6. `[PASS]` Verifikasi login Dosen dengan role `lecturer`.
  7. `[PASS]` Kode kosong menghasilkan status `CE` (Compilation Error).
  8. `[PASS]` Kode C++ tanpa fungsi `main()` menghasilkan status `CE`.
  9. `[PASS]` Loop tak hingga (`while(true)`) terdeteksi sebagai `TLE` (Time Limit Exceeded).
  10. `[PASS]` Solusi valid menghasilkan status `AC` (Accepted).
  11. `[PASS]` Solusi Accepted memperoleh nilai sempurna 100/100.
  12. `[PASS]` Normalisasi whitespace dan pembersihan karakter newline `\r\n` berjalan akurat.
- **Production Build Verification:**
  - Perintah `npm run build` sukses 100% mengkompilasi 11 rute statis & dinamis tanpa galat TypeScript maupun webpack.

---

### Phase 6: Panduan Deployment ke Supabase & Vercel (DevOps & Product Engineer)

#### 1. Setup Database di Supabase
1. Buka [Supabase Dashboard](https://supabase.com) dan buat proyek baru (misal: `cp-arena-campus`).
2. Masuk ke menu **SQL Editor**, buka file `supabase/schema.sql` dari repositori ini, salin seluruh kodenya, lalu klik **Run**.
3. Tabel `profiles`, `contests`, `problems`, `test_cases`, `submissions`, serta RLS policies dan seed data awal akan otomatis terpasang.
4. Masuk ke **Project Settings -> API** untuk menyalin:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

#### 2. Konfigurasi Environment Variables
Buat file `.env.local` pada environment lokal atau isi di dashboard Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key...

NEXT_PUBLIC_APP_NAME="CP Arena"
NEXT_PUBLIC_APP_DESCRIPTION="Competitive Programming Arena for University Students"
NEXT_PUBLIC_DEFAULT_STUDENT_DOMAIN="@cparena.internal"
```

#### 3. Hosting di Vercel
1. Hubungkan repositori GitHub `CP-Arena` ke [Vercel](https://vercel.com).
2. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.
3. Masukkan Environment Variables di atas pada menu **Environment Variables** di Vercel.
4. Klik **Deploy**. Website CP Arena siap diakses oleh mahasiswa seluruh kampus!

---

### Changelog Aktivitas (Timestamped)

- **[2026-11-10 13:42]** Workspace initialized di `d:\CP-Arena`.
- **[2026-11-10 13:44]** Repositori Git diinisialisasi (`git init`).
- **[2026-11-10 13:46]** Masterfile pelacakan SDLC `DEVELOPMENT_LOG.md` disusun.
- **[2026-11-10 13:54]** Inisialisasi dependensi Next.js 15, Tailwind CSS, Supabase SSR, Lucide React, Canvas Confetti.
- **[2026-11-10 14:01]** Perancangan skema database PostgreSQL Supabase dengan RLS di `supabase/schema.sql`.
- **[2026-11-10 14:04]** Implementasi modul autentikasi proksi identitas NIM mahasiswa di `src/lib/auth/student-auth.ts`.
- **[2026-11-10 14:05]** Pembuatan mesin evaluator juri kode kompetitif di `src/lib/judge/evaluator.ts`.
- **[2026-11-10 14:06]** Pembuatan komponen UI: `VerdictBadge`, `CountdownTimer`, `Navbar`, `Footer`.
- **[2026-11-10 14:08]** Pembuatan komponen arena: `CodeEditor` dan `ScoreboardTable` (ICPC balloon scoring).
- **[2026-11-10 14:10]** Implementasi antarmuka pengguna: Beranda (`/`), Login NIM (`/login`), Kontes (`/contests`), Arena Soal (`/contests/[slug]/arena/[problemSlug]`), Bank Soal (`/problems`), Submisi (`/submissions`), Panel Dosen (`/admin`).
- **[2026-11-10 14:27]** Kompilasi produksi `next build` berhasil memverifikasi 11 rute statis & dinamis.
- **[2026-11-10 14:34]** Pembuatan dan eksekusi test suite otomatis `npm test` dengan tingkat kelulusan 100% (12/12 uji berhasil).
- **[2026-11-10 14:36]** Pembaruan final `DEVELOPMENT_LOG.md` sebagai catatan pengembangan resmi.
