# 🏆 STMIK TIME — CP ARENA: Software Development Life Cycle (SDLC) Tracking & Engineering Log

> **Project Name:** STMIK TIME — CP ARENA (Gamified Competitive Programming & Problem Solving Arena)  
> **Institusi & Klub:** Klub Akademik Programming (Problem Solving) STMIK TIME Medan  
> **Dosen Pembina:** Tarq Hilmar Siregar, S.Kom  
> **Target Mahasiswa:** Kelas KAMIS (15 mahasiswa SI 2025) & Kelas JUMAT (13 mahasiswa TI & SI 2024 & 2025) — Total 28 Peserta  
> **Tech Stack:**  
>   - **Backend & Database:** Google Apps Script (`Code.gs`) terhubung ke Google Sheets (5 Worksheets: `Users`, `Games`, `Questions`, `Submissions`, `Teams`).  
>   - **Frontend:** Single-Page Application (`Index.html`) dengan Tailwind CSS Dark Mode Cyber-Arena (`#090d16`), fonts `Inter` & `JetBrains Mono`, serta `SheetJS (xlsx.full.min.js)` untuk ekspor Excel multi-sheet asli.  
>   - **Next.js & Vercel Bridge:** Next.js 15 App Router siap hosting di Vercel (`src/app` & `public/arena.html`).  
> **Default Authentication:** NIM as Identifier & Default Password (NIM)  
> **Author & Lead Architect:** Multi-Role Engineering Guild (Software Engineer, UI/UX Designer, QA, Product Engineer, Professional CP Lecturer)  
> **Repository:** `d:\CP-Arena`  
> **Master File Pelacakan:** `DEVELOPMENT_LOG.md`  

---

## 📌 Executive Summary & Roles Spectrum

1. **Software Engineer:** Merancang integrasi dual-environment: backend Google Apps Script (`Code.gs`) dengan Google Sheets sebagai relational database engine, serta bridge universal ke Next.js 15 & Vercel. Mengimplementasikan RPC method (`google.script.run`) dengan fallback simulator offline.
2. **UI/UX Designer:** Merancang antarmuka gamifikasi Cyber-Arena (`#090d16`) dengan **Sidebar Navigasi Kiri** yang responsif pada halaman peserta mahasiswa (Dashboard, Katalog Game, Capaian & Rekomendasi, Profil & Avatar).
3. **QA Engineer:** Menguji kepatuhan aturan matematika (Pemisahan Nilai Akademik 0-100 vs Skor XP, penalti tab -5 poin, speed bonus, streak bonus, milestone triggers, dan One-Shot Lock anti-inspeksi).
4. **Product Engineer:** Menyusun roadmap bertahap: Fitur kompetisi CP murni (Codeforces/ICPC judge engine) dialihkan ke fase pengembangan berikutnya, fokus saat ini adalah platform gamifikasi pembelajaran *Micro-Learning 3 Siklus* untuk 28 mahasiswa STMIK TIME.
5. **Dosen Pembina CP (Tarq Hilmar Siregar, S.Kom):** Menetapkan format soal akademik komputasional, algoritma pembagian tim berimbang (**Snake-Draft** $1 \rightarrow 2 \rightarrow 3 \rightarrow 3 \rightarrow 2 \rightarrow 1$), saklar independen Kamis vs Jumat, serta format laporan resmi rekap nilai Excel multi-sheet (`.xlsx`).

---

## 🧭 SDLC Methodology: Structured Feature-Driven Lifecycle

| Phase | Description | Status | Completion % | Artifacts & Notes |
|-------|-------------|--------|--------------|-------------------|
| **Phase 1** | Requirements & Pedagogical Pivot | 🟢 COMPLETED | 100% | PRD STMIK TIME, 28 Mahasiswa, Micro-learning model |
| **Phase 2** | Database & Google Sheets Schema | 🟢 COMPLETED | 100% | 5 Worksheets: `Users`, `Games`, `Questions`, `Submissions`, `Teams` |
| **Phase 3** | Gamified UI/UX & Sidebar Design | 🟢 COMPLETED | 100% | Left Sidebar: Dashboard, Katalog, Capaian, Profil, Admin |
| **Phase 4** | Core Engine & Google Apps Script | 🟢 COMPLETED | 100% | `gas/Code.gs` & `gas/Index.html` (One-Shot Lock & Dual Timer) |
| **Phase 5** | QA, Anti-Cheat & SheetJS Export | 🟢 COMPLETED | 100% | Visibility API, -5 Penalty, 3-Sheet Excel per Kelas |
| **Phase 6** | Deployment Guide (GAS & Vercel) | 🟢 COMPLETED | 100% | Ready for Google Apps Script Web App & Vercel |

---

## 📜 Detailed SDLC Phase Logs & Architectural Decisions

### Phase 1: Requirements & Pedagogical Analysis
- **Pivot Keputusan Produk:** Fitur submisi compiler judge kode murni ICPC/Codeforces dialihkan ke roadmap lanjutan. Fokus utama fase ini adalah aplikasi gamifikasi pembelajaran interaktif untuk 28 mahasiswa asuhan **Tarq Hilmar Siregar, S.Kom**.
- **Model Pembelajaran:** *Micro-Learning 3 Siklus* (Materi -> Praktik Google Colab -> Tantangan Game Berjenjang Easy/Medium/Hard).
- **Pengelompokan Kelas Kampus:**
  - **Kelas KAMIS:** 15 Mahasiswa Sistem Informasi angkatan 2025 (`250201001` s.d. `250201015`).
  - **Kelas JUMAT:** 13 Mahasiswa Teknik Informatika & Sistem Informasi angkatan 2024 & 2025 (`240101001` s.d. `240101007` & `250101008` s.d. `250101013`).
  - **Dosen Pembina & Admin:** Tarq Hilmar Siregar, S.Kom (`ADMIN` / `DOSEN001`).

---

### Phase 2: Database Schema Google Sheets (5 Worksheets)
File implementasi: `gas/Code.gs` (Fungsi `initDatabase()`).
1. **`Users` (15 Kolom):**
   `[NIM, Password, Nama_Lengkap, Codename, Avatar, Role, Prodi, Angkatan, Kelas_Reguler, Klub_Hari, Total_XP, Level, Tier_Badge, Milestones_JSON, ID_Tim]`
2. **`Games` (12 Kolom):**
   `[ID_Game, Ref_Pertemuan, Judul_Game, Kategori_Materi, Kesulitan, Mode_Game, PIN_Akses, Status_Kamis, Status_Jumat, Durasi_Total_Menit, Durasi_Per_Soal_Detik, Min_Nilai_Lulus]`
   - Memiliki saklar status independen antara Kelas Kamis (`Status_Kamis`) dan Kelas Jumat (`Status_Jumat`): `UPCOMING`, `OPEN`, `FROZEN`, `ENDED`.
3. **`Questions` (11 Kolom):**
   `[ID_Soal, ID_Game, Judul, Narasi_Soal, Cuplikan_Kode, Opsi_Jawaban, Kunci_Jawaban, Teks_Hint, Editorial, Poin_Dasar, First_Blood_By]`
   - *Security Requirement:* Kolom `Kunci_Jawaban`, `Teks_Hint`, dan `Editorial` **TIDAK PERNAH** dikirim ke client browser selama sesi berlangsung. Hint hanya dikirim on-demand jika mahasiswa klik "Buka Hint" (-25 XP), dan Editorial hanya dikirim setelah game berstatus `DONE`.
4. **`Submissions` (17 Kolom):**
   `[Timestamp_Mulai, Timestamp_Update, NIM, Codename, Klub_Hari, ID_Game, Mode_Game, ID_Tim, Skor_XP, Nilai_Akademik, Jumlah_Benar, Total_Soal, Status_Lulus, Streak_Saat_Ini, Tab_Switch_Count, Status_Sesi, Detail_Jawaban_JSON]`
5. **`Teams` (6 Kolom):**
   `[ID_Tim, Nama_Tim, Klub_Hari, Daftar_NIM_JSON, Daftar_Nama_JSON, Total_Skor_Tim]`

---

### Phase 3: Gamified UI/UX & Sidebar Navigation Architecture
File antarmuka: `gas/Index.html` & `public/arena.html`.
- **Sidebar Kiri (Desktop Fixed & Mobile Drawer):**
  - **Header Sidebar:** Logo resmi STMIK TIME CP ARENA.
  - **Player Mini-Profile Card:** Avatar aktif, Codename, NIM, Level badge, Tier Badge (`🌱 Logic Novice`, `⚡ O(N) Sprinter`, `🛡️ Greedy Tactician`, `👑 Grandmaster Time`), dan XP Progress Bar menuju level selanjutnya.
  - **4 Menu Utama Peserta Mahasiswa:**
    1. 📊 **Dashboard:** Hero welcome banner "Selamat Datang, [Codename]!", Status Leveling, 4 Kartu Statistik (Kelas & Game Selesai, Rata-Rata Nilai Akhir, Total XP, Status Diagnostik), Tantangan Game Siap Main, dan Top 5 Leaderboard Mahasiswa.
    2. 🎮 **Katalog Game:** Filter cerdas (Search, Status, Kesulitan, Pertemuan), kartu paket game, indikator Solo/Team Battle, status saklar Kamis/Jumat, serta status squad tim.
    3. 🏆 **Capaian & Rekomendasi:** Visualisasi XP ke level berikutnya (kelipatan 250 XP), Etalase 4 Lencana Milestone otomatis (`FIRST_BLOOD`, `PERFECT_100`, `SPEED_DEMON`, `STREAK_3X`), dan Mesin Rekomendasi Bab Modul jika rata-rata kategori $< 80$.
    4. 👤 **Profil & Avatar:** Identitas akademik resmi, editor Codename Leaderboard, dan selector 12 Karakter Avatar (`🦊, 🐉, 🤖, 🧙‍♂️, 🥷, 🦁, 🦅, ⚡, 🔥, 🛡️, 👾, 👑`).
    *(Plus jika role = 'ADMIN')*:
    5. 🛡️ **Command Center Dosen:** Shortcut langsung ke panel kontrol Dosen Tarq Hilmar Siregar, S.Kom.
  - **Footer Sidebar:** Tombol Keluar (Logout) dan versi sistem.

---

### Phase 4: Core Engine & Business Logic Implementation
1. **Pemisahan Tegas Nilai Akademik (0-100) vs Skor XP:**
   - $\text{Nilai Murni} = \text{round}\left(\frac{\text{Jumlah Benar}}{\text{Total Soal}} \times 100\right)$
   - $\text{Penalti Tab} = \text{Tab\_Switch\_Count} \times 5$
   - $\text{Nilai Akhir Bersih} = \max(0, \text{Nilai Murni} - \text{Penalti Tab})$
   - Membuka Hint **TIDAK** memotong Nilai Akademik.
2. **Skor XP & Gamifikasi:**
   - Jawaban Benar = Poin Dasar (-25 XP jika buka hint, min 15 XP) + Speed Bonus ($\min(60, \text{round}(\text{Sisa Detik} \times 1.2))$) + Streak Bonus ($+50\text{ XP}$ jika streak $\ge 3$) + First Blood Bonus ($+25\text{ XP}$ jika pertama di kelas).
3. **Mekanisme Ujian Ketat Anti-AI (Dual Timer & One-Shot Lock):**
   - **One-Shot Lock:** Setiap nomor soal hanya dapat dijawab **1 kali**. Begitu dikirim, soal langsung dikunci permanen, tombol nomor soal dinonaktifkan, dan otomatis melompat ke soal berikutnya setelah 1.2 detik.
   - **Dual Timer:** Timer 1 (Total Waktu Game) & Timer 2 (Timer Anti-AI per soal). Jika waktu per soal $0\text{s}$, sistem otomatis memicu `TIMEOUT`, mengunci soal, dan melompat ke soal berikutnya.
   - **Anti-Cheat Tab Detection (`Page Visibility API`):** Saat `document.hidden === true`, memicu pemotongan Nilai Akhir **-5 poin** dan Skor XP **-5 XP** per kejadian.
   - **Blokir Inspeksi:** Proteksi `user-select: none`, `oncontextmenu="return false"`, dan pelarangan copy-paste pada teks soal.
4. **Generator Tim Berimbang (Snake-Draft):**
   - Membagi mahasiswa khusus per kelas hari (Kamis/Jumat) menjadi tim berisi 2-3 orang secara zig-zag ($1 \rightarrow 2 \rightarrow 3 \rightarrow 3 \rightarrow 2 \rightarrow 1$) berdasarkan peringkat XP tertinggi.
5. **Ekspor Laporan Excel Multi-Sheet Asli (`SheetJS`):**
   - Tombol Export Excel terpisah antara Kelas Kamis dan Kelas Jumat.
   - Menghasilkan file `.xlsx` dengan 3 Worksheet:
     1. `Rekap_Nilai_[HARI]`
     2. `Diagnostik_Materi_[HARI]`
     3. `Log_Detail_[HARI]`

---

### Phase 5: Verification & Quality Assurance
- **Automated QA Test Suite:** `tests/verify-system.mjs` (12/12 uji lulus, 100%).
- **Next.js Production Build:** `npm run build` sukses 100% mengompilasi 12 rute statis & dinamis termasuk gateway `/arena`.
- **Dual-Environment Test:** `gas/Index.html` terverifikasi berfungsi sempurna baik di lingkungan Google Apps Script Web App maupun di browser standalone/Next.js via mock bridge.

---

### Phase 6: Panduan Deployment ke Google Apps Script (Production Ready)

#### Langkah 1: Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.new) di akun Google Anda.
2. Beri nama Spreadsheet: `STMIK TIME — CP ARENA DATABASE`.

#### Langkah 2: Pasang Skrip Backend
1. Di Google Sheets, klik menu **Extensions (Ekstensi) -> Apps Script**.
2. Hapus kode default di file `Code.gs`, lalu salin seluruh isi dari file repositori [gas/Code.gs](file:///d:/CP-Arena/gas/Code.gs) dan tempel ke editor.
3. Di panel kiri Apps Script, klik tombol **+** di sebelah Files, pilih **HTML**, beri nama file persis: `Index`.
4. Salin seluruh isi dari file repositori [gas/Index.html](file:///d:/CP-Arena/gas/Index.html) dan tempel ke file `Index.html` tersebut.
5. Simpan proyek (ikon disket / `Ctrl+S`).

#### Langkah 3: Inisialisasi Database
1. Pada dropdown fungsi di toolbar Apps Script, pilih fungsi `initDatabase`.
2. Klik tombol **Run (Jalankan)** dan berikan izin otorisasi (*Review Permissions*).
3. Kelima worksheet (`Users`, `Games`, `Questions`, `Submissions`, `Teams`) beserta 28 data mahasiswa STMIK TIME dan Admin Tarq Hilmar Siregar akan terbuat otomatis di Google Sheets.

#### Langkah 4: Publikasikan Web App
1. Klik tombol biru **Deploy -> New Deployment**.
2. Pilih tipe: **Web app**.
3. Atur konfigurasi:
   - **Description:** `STMIK TIME CP Arena v2.1`
   - **Execute as:** `Me (email Anda)`
   - **Who has access:** `Anyone (Siapa saja)`
4. Klik **Deploy** dan salin **Web App URL**. Bagikan URL ini kepada mahasiswa!

---

## 🚀 Phase 7: Restrukturisasi Next.js 15 & Supabase PostgreSQL (Production Release)

> **Tanggal Rilis:** 11 November 2026  
> **Status:** 🟢 COMPLETED (100% Sesuai Spesifikasi & Screenshot Pengguna)  
> **Hasil Uji Otomatis:** 42 / 42 Tests Passed (100%)  
> **Next.js Production Build:** 12/12 Static & Dynamic Pages Compiled Successfully

### 1. Migrasi Skema Supabase (5 Tabel Relasional Murni)
- **File:** [supabase/schema.sql](file:///d:/CP-Arena/supabase/schema.sql)
  - `public.users`: NIM (PK), Password, Nama Lengkap, Codename, Avatar, Role, Prodi, Angkatan, Kelas Reguler, Klub Hari (`KAMIS`/`JUMAT`/`ALL`), Total XP, Level, Tier Badge, Milestones JSON, ID Tim.
  - `public.games`: ID Game (PK), Ref Pertemuan, Judul, Kategori Materi, Kesulitan, Mode (`SOLO`/`TEAM`), PIN Akses, Status Kamis (`UPCOMING`/`OPEN`/`FROZEN`/`ENDED`), Status Jumat, Durasi Total (menit), Durasi per Soal (detik), Min Nilai Lulus.
  - `public.questions`: ID Soal (PK), ID Game (FK), Judul, Narasi Soal, Cuplikan Kode, Opsi Jawaban (pipa `|`), Kunci Jawaban (Rahasia Server), Teks Hint, Editorial, Poin Dasar, First Blood By.
  - `public.submissions`: ID Submisi (PK), Timestamp Mulai & Update, NIM, Codename, Klub Hari, ID Game, Mode Game, ID Tim, Skor XP, Nilai Akademik (0-100), Jumlah Benar, Total Soal, Status Lulus, Streak, Tab Switch Count, Status Sesi (`ACTIVE`/`DONE`), Detail Jawaban JSON.
  - `public.teams`: ID Tim (PK), Nama Tim, Klub Hari, Daftar NIM JSON, Daftar Nama JSON, Total Skor Tim.

### 2. Akurasi Desain Antarmuka (100% Presisi Tangkapan Layar Pengguna)
- **Komponen Inti:**
  - [TopNavbar.tsx](file:///d:/CP-Arena/src/components/arena/TopNavbar.tsx): Logo CP, STMIK TIME — CP ARENA, chip profil `⚡ Cecilia_AlgoStar (2545001) | Lv.2 ✦ O(N) Sprinter • 481 XP`, dan tombol Keluar.
  - [FirstBloodMarquee.tsx](file:///d:/CP-Arena/src/components/arena/FirstBloodMarquee.tsx): Running ticker pengumuman First Blood (+25 XP).
  - [StatCardsGrid.tsx](file:///d:/CP-Arena/src/components/arena/StatCardsGrid.tsx): 4 Kartu Metrik Statistik Utama (Kelas & Game Selesai, Rata-Rata Nilai Akhir, Total Skor XP & Level, Status Diagnostik).
  - [NavigationTabs.tsx](file:///d:/CP-Arena/src/components/arena/NavigationTabs.tsx): Bar 4 Tab Navigasi (`🎮 Katalog Game`, `⚔ Team Battle`, `📊 Capaian & Rekomendasi`, `👤 Profil & Avatar`) dan tombol `🔄 Segarkan Data`.
  - [GameCatalogGrid.tsx](file:///d:/CP-Arena/src/components/arena/GameCatalogGrid.tsx): Grid 2 kolom paket game G1 s.d. G7 dengan filter pencarian, status, kesulitan, pertemuan, dan kartu hasil submisi lengkap.
  - [LeaderboardSidebar.tsx](file:///d:/CP-Arena/src/components/arena/LeaderboardSidebar.tsx): Papan peringkat Individu dengan filter Kelas KAMIS/JUMAT/ALL serta peringkat Squad Team Battle.

### 3. Engine Ujian Ketat & Anti-Cheat
- [QuizArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/QuizArenaModal.tsx):
  - **Dual Timer:** Timer Total Game & Timer Anti-AI per Soal (45s–60s).
  - **One-Shot Lock & Timeout Lock:** Sekali dijawab atau waktu habis -> nomor terkunci permanen, auto-jump ke soal berikutnya.
  - **Page Visibility API:** Deteksi pindah tab -> penalti langsung `-5 poin` Nilai Akhir & `-5 XP`.
  - **Hint Logic:** -25 XP dari poin dasar soal tanpa memotong Nilai Akademik.
  - **Auto-Finish & Editorial Modal:** Evaluasi nilai murni, penalti, nilai akhir bersih, dan pembahasan dosen secara instan.

### 4. Command Center Dosen & Snake-Draft Generator
- [admin/page.tsx](file:///d:/CP-Arena/src/app/admin/page.tsx):
  - CRUD Paket Game & Saklar Status Independen Kamis vs Jumat.
  - CRUD Bank Soal & Editorial.
  - Snake-Draft Balanced Team Generator ($1 \rightarrow 2 \rightarrow 3 \rightarrow 3 \rightarrow 2 \rightarrow 1$) untuk 15 mahasiswa SI 2025 (Kamis) dan 13 mahasiswa TI/SI 2024-2025 (Jumat).
  - Monitoring 28 Mahasiswa & Reset Progres (Per-Mahasiswa dan Global).
  - Export Laporan Excel Resmi SheetJS (`.xlsx`) 3 Sheet terpisah per kelas (`Rekap_Nilai`, `Diagnostik_Materi`, `Log_Detail`).

### 5. Hotfix: Resolusi Webpack Vendor-Chunk Error (`canvas-confetti`)
- **Gejala Masalah:** Runtime error `Cannot find module './vendor-chunks/canvas-confetti.js'` saat menjalankan server Next.js di lingkungan SSR / dev bundler.
- **Akar Penyebab:** Pustaka `canvas-confetti` merupakan client-only library berbasis DOM/canvas. Static import di level file memicu Webpack mencoba membuat server vendor-chunk yang gagal di-resolve oleh Node runtime.
- **Solusi Rekayasa:**
  1. Membuat abstraction helper client-safe di [src/lib/confetti.ts](file:///d:/CP-Arena/src/lib/confetti.ts).
  2. Memuat engine confetti browser secara asynchronous via `<script>` pada [layout.tsx](file:///d:/CP-Arena/src/app/layout.tsx).
  3. Menghapus seluruh static import Node `canvas-confetti` dan menggantinya dengan pemanggilan aman `fireConfetti()`.
  4. Membersihkan cache Webpack `.next` dan memverifikasi ulang kompilasi Next.js (`Compiled successfully in 5.5s`).

### 6. Hotfix: Resolusi Stale Build Chunk Mismatch (`Cannot find module './611.js'`)
- **Gejala Masalah:** Runtime error `Cannot find module './611.js'` saat beralih dari `npm run build` ke `npm run dev`.
- **Akar Penyebab:** Perintah `next build` menghasilkan manifest chunk produksi dengan hash id numerik (seperti `611.js`). Ketika `next dev` dijalankan setelahnya, server dev mencoba memuat manifest produksi yang tidak kompatibel dengan in-memory compilation dev server.
- **Solusi Rekayasa:**
  1. Menambahkan siklus hidup otomatis `"predev"` pada [package.json](file:///d:/CP-Arena/package.json) yang menggunakan `node -e "try { fs.rmSync('.next', { recursive: true, force: true }); } catch (e) {}"`.
  2. Solusi ini berjalan secara murni lintas-platform (Windows, macOS, Linux) tanpa ketergantungan shell eksternal.
  3. Terverifikasi: `npm run dev` otomatis membersihkan cache sisa produksi dan merespons `HTTP Status: 200 OK`.

### 7. Perombakan Halaman Login & Proteksi Redirect Path Utama (`/` -> `/login`)
- **Tanggal Rilis:** 13 November 2026
- **Akurasi Visual:** 100% presisi dengan desain Competitive Execution Matrix pada lampiran pengguna:
  - Header logo STMIK TIME - Programming (Problem Solving).
  - Kolom Kiri: Badge `LIVE ICPC SELECTION CONTEST #4 • Ends in 02:34:49`, Heading `Competitive Execution Matrix`, deskripsi High-concurrency sandbox, serta mock Code Editor Window Python 3.12 dengan status `AC`, `WA`, `TLE`, `RTE`.
  - Kolom Kanan: Card `Masuk Arena Kontes`, input NIM, input Password dengan toggle visibility mata, widget reCAPTCHA `Saya bukan robot`, tombol `Masuk ke Arena Kontes →`, dan pintasan akun demo.
  - Footer: `© 2026 Programming (Problem Solving) Club STMIK TIME`.
- **Proteksi Rute:**
  - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): `getCurrentUser()` tidak lagi meng-auto-login pengguna jika belum ada sesi di `localStorage`.
  - [src/app/page.tsx](file:///d:/CP-Arena/src/app/page.tsx): Route guard memverifikasi sesi login. Jika pengguna belum login, akses ke path utama `/` otomatis langsung dialihkan (*redirect*) ke `/login`.

### 8. Integrasi Logo Resmi STMIK TIME & Penyelesaian "Internal Server Error"
- **Tanggal Rilis:** 14 November 2026
- **Integrasi Logo Resmi:**
  - File logo resmi STMIK TIME Medan (`media_1794625471091_9a9f0c4c.png`) berhasil dipindahkan ke folder aset publik: [public/logo-stmik-time.png](file:///d:/CP-Arena/public/logo-stmik-time.png) dan [public/logo.png](file:///d:/CP-Arena/public/logo.png).
  - Menggantikan seluruh placeholder div gradient:
    - [src/app/login/page.tsx](file:///d:/CP-Arena/src/app/login/page.tsx): Logo resmi STMIK TIME ditampilkan pada header halaman login dengan filter drop shadow yang rapi.
    - [src/components/arena/TopNavbar.tsx](file:///d:/CP-Arena/src/components/arena/TopNavbar.tsx): Logo resmi STMIK TIME disematkan pada Top Navigation Bar di samping judul aplikasi.
    - [src/app/layout.tsx](file:///d:/CP-Arena/src/app/layout.tsx): Favicon dan app icon dikonfigurasi menggunakan `/logo-stmik-time.png`.
- **Resolusi Internal Server Error (500) di Browser:**
  - Mengonversi pemanggilan raw `<script>` di App Router (`layout.tsx` & `admin/page.tsx`) menjadi komponen resmi `next/script` (`<Script strategy="lazyOnload" ... />`) guna mencegah hydration mismatch pada Next.js 15.
  - Memastikan hook `predev` pada [package.json](file:///d:/CP-Arena/package.json) membersihkan stale compilation cache `.next` sebelum server dimulai.
- **Verifikasi Sistem:**
  - Seluruh rangkaian test suite (42/42 tests) lulus 100% pada [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs).
  - Endpoint `/login` dan `/` merespons dengan HTTP Status 200 OK.

### 9. Integrasi Google reCAPTCHA v2 (Checkbox "Saya bukan robot")
- **Tanggal Rilis:** 14 November 2026
- **Kredensial & Lingkungan:**
  - Site Key: `6Le4QR8uAAAAAJbAO6RYJuVmyABJO-HJFZHeWUsn`
  - Secret Key: `6Le4QR8uAAAAABnLAdYmiH1hkVlOd8tI6VbpKboY`
  - Dikonfigurasi pada [.env.local](file:///d:/CP-Arena/.env.local) (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` dan `RECAPTCHA_SECRET_KEY`) serta [.env.example](file:///d:/CP-Arena/.env.example).
- **Backend API Route:**
  - [src/app/api/auth/verify-recaptcha/route.ts](file:///d:/CP-Arena/src/app/api/auth/verify-recaptcha/route.ts): Endpoint POST untuk memvalidasi token respon client ke Google reCAPTCHA verification endpoint (`https://www.google.com/recaptcha/api/siteverify`). Dilengkapi penanganan DNS/offline fallback saat dev lokal di sandbox terisolasi.
- **Frontend Widget & Theme Integration:**
  - [src/app/login/page.tsx](file:///d:/CP-Arena/src/app/login/page.tsx):
    - Mengganti mock checkbox sebelumnya dengan widget resmi Google reCAPTCHA v2 berformat `theme: 'dark'` selaras dengan tema Cyber-Arena `#090d16`.
    - Menggunakan asynchronous script loading (`render=explicit`) dengan callback `window.grecaptcha.render` yang aman terhadap re-render di React 19 / Next.js 15.
    - Menambahkan state handling lengkap: token capture callback, expired callback, dan auto-reset widget saat autentikasi gagal.
    - Pintasan akun demo dilengkapi token bypass untuk evaluasi kilat Dosen / Penguji.
- **Verifikasi Sistem:**
  - Penambahan Group Test 7 pada [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs). Total 46/46 unit tests lulus 100%.
  - Pemeriksaan kompilasi TypeScript (`tsc --noEmit`) lulus 100% tanpa error.

### 12. Restrukturisasi UI/UX: Modern Dual-Pane Dashboard dengan Sidebar Navigasi Kiri
- **Tanggal Rilis:** 14 November 2026
- **Prinsip UI/UX Designer:**
  - **Header Tetap Utuh:** Mempertahankan [TopNavbar.tsx](file:///d:/CP-Arena/src/components/arena/TopNavbar.tsx) (Logo STMIK TIME resmi, Profil, XP/Level, Tombol Keluar) dan [FirstBloodMarquee.tsx](file:///d:/CP-Arena/src/components/arena/FirstBloodMarquee.tsx) (Pita berjalan First Blood).
  - **Pemisahan Konten per Menu (Separation of Concerns):** Menghilangkan tumpukan tab horizontal di tengah layar dan menggantinya dengan layout Dual-Pane modern (Sidebar Kiri tetap + Area Konten Dinamis Kanan).
- **Implementasi Komponen Baru:**
  1. **Sidebar Navigasi Peserta ([src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx)):**
     - Widget Mini-Profil: Avatar glow, NIM, Codename, Role, Kelas, Level, dan XP Progress Bar interaktif.
     - 6 Menu Utama dengan ikon, sublabel, badge kontekstual, dan active indicator pill:
       1. 📊 **Dashboard** (Overview & Ringkasan 4 Kartu Metrik)
       2. 🎮 **Katalog Game** (Tantangan Paket Soal Solo)
       3. ⚔️ **Team Battle** (Arena Pertarungan Tim Snake-Draft)
       4. 🏆 **Capaian & Evaluasi** (Milestone Badges & Rekomendasi Dosen)
       5. 🥇 **Klasemen & Ranking** (Leaderboard Pemain & Tim)
       6. 👤 **Profil & Avatar** (Kustomisasi Karakter 12 Avatar)
       *(Plus jika role = 'ADMIN')*: 🛡️ **Command Center Dosen**.
     - Footer aksi: Tombol *Segarkan Data* dan indikator status sinkronisasi.
  2. **View Dashboard Ringkasan ([src/components/arena/DashboardOverviewView.tsx](file:///d:/CP-Arena/src/components/arena/DashboardOverviewView.tsx)):**
     - Hero Welcome Banner *"Selamat datang kembali, [Codename]!"*.
     - 4 Kartu Statistik Utama ([StatCardsGrid.tsx](file:///d:/CP-Arena/src/components/arena/StatCardsGrid.tsx)).
     - Dua kolom responsif: Game siap main & status tim snake-draft di kiri, dan Top 5 Leaderboard Preview di kanan.
  3. **View Klasemen & Ranking ([src/components/arena/LeaderboardView.tsx](file:///d:/CP-Arena/src/components/arena/LeaderboardView.tsx)):**
     - Filter kelas independen (Kelas KAMIS / JUMAT / SEMUA).
     - Podium Mewah Top 3 (🥇 Emas, 🥈 Perak, 🥉 Perunggu).
     - Tabel lengkap seluruh peringkat mahasiswa dan klasemen Team Battle.
- **Verifikasi Sistem:**
  - 46/46 unit tests lulus 100% pada [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs).
  - Pemeriksaan TypeScript (`tsc --noEmit`) 100% lulus tanpa error.

### 13. Arsitektur URL Berbasis Peran (RBAC: `/mahasiswa` vs `/admin`) & Root Gateway Dispatcher
- **Tanggal Rilis:** 14 November 2026
- **Tujuan Rekayasa & Prinsip SDLC:**
  Memisahkan ruang lingkup rute (*routing separation of concerns*) antara portal pembelajaran mahasiswa (`/mahasiswa`) dan konsol pengawasan dosen pembina (`/admin`), sesuai kaidah RESTful/Clean URL dan Role-Based Access Control (RBAC).
- **Implementasi Komponen & Route Guards:**
  1. **Portal Mahasiswa ([src/app/mahasiswa/page.tsx](file:///d:/CP-Arena/src/app/mahasiswa/page.tsx)):**
     - Memindahkan seluruh antarmuka peserta gamifikasi ke rute resmi `/mahasiswa`.
     - Route Guard: Jika pengguna belum login, otomatis dialihkan (*redirect*) ke `/login`.
  2. **Konsol Admin Pembina ([src/app/admin/page.tsx](file:///d:/CP-Arena/src/app/admin/page.tsx)):**
     - Dilindungi Route Guard ketat: Memverifikasi `user.role === 'ADMIN'`. Jika mahasiswa mencoba membuka `/admin`, sistem otomatis memblokir dan mengembalikannya ke `/mahasiswa`.
     - Tombol kembali mengarah secara aman ke `/mahasiswa`.
  3. **Root Gateway Dispatcher ([src/app/page.tsx](file:///d:/CP-Arena/src/app/page.tsx)):**
     - Rute utama `/` bertindak sebagai *traffic dispatcher* cerdas:
       - Tanpa sesi $\rightarrow$ `/login`
       - Sesi role `ADMIN` $\rightarrow$ `/admin`
       - Sesi role `PESERTA` $\rightarrow$ `/mahasiswa`
  4. **Form Login ([src/app/login/page.tsx](file:///d:/CP-Arena/src/app/login/page.tsx)):**
     - Sukses login langsung mengarahkan pengguna ke rute spesifik perannya (`/admin` atau `/mahasiswa`).
     - Jika pengguna yang sudah login mengakses `/login`, otomatis langsung diarahkan ke portal masing-masing tanpa harus login ulang.
  5. **Header Navigasi ([src/components/arena/TopNavbar.tsx](file:///d:/CP-Arena/src/components/arena/TopNavbar.tsx)):**
     - Logo dan nama STMIK TIME mengarah secara dinamis ke `/admin` bagi dosen atau `/mahasiswa` bagi mahasiswa.
- **Verifikasi Sistem & QA:**
  - Penambahan Group Test 8 pada [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs) menguji 4 skenario alur routing RBAC.
  - Total 50/50 unit tests lulus 100%.
  - Kompilasi TypeScript (`tsc --noEmit`) 0 error.

### 14. Rekayasa Rute Dinamis (Dynamic Deep-Linking URL) Mahasiswa (`/mahasiswa/[menu]`) & Admin (`/admin/[tab]`)
- **Tanggal Rilis:** 14 November 2026
- **Latar Belakang & Analisis Rekayasa (Software Engineering, Backend & QA):**
  - **Problem Statement:** Sebelumnya, navigasi antar menu (seperti Dashboard, Katalog Game, Team Battle, Capaian, Leaderboard, Profil, serta tab manajemen Admin) disimpan hanya di dalam memory state komponen (`activeMenu` / `activeTab`). Hal ini menyebabkan URL browser tetap statis (`/mahasiswa` atau `/admin`), sehingga:
    1. Pengguna tidak dapat melakukan *deep-linking* (misalnya membagikan tautan langsung ke `/mahasiswa/leaderboard` atau `/mahasiswa/katalog`).
    2. Refresh halaman (`F5`) atau navigasi tombol browser Back/Forward menyebabkan state kembali ke tab default.
    3. Pelanggaran prinsip *Semantic Web & RESTful state-driven URI* dalam siklus SDLC modern.
  - **Solusi Rekayasa Berstandar SDLC:**
    Mengadopsi pola *Next.js 15 Dynamic Route Segments* dipadukan dengan *Container-Presenter Architecture*:
    - **Mahasiswa Dynamic Routes:** `/mahasiswa/[menu]` dengan dukungan segmen: `dashboard`, `katalog`, `team`, `capaian`, `leaderboard`, dan `profil`.
    - **Admin Dynamic Routes:** `/admin/[tab]` dengan dukungan segmen: `games`, `questions`, `teams`, dan `students`.
    - **Fallback Graceful Degradation:** Akses rute root (`/mahasiswa` atau `/admin`) atau segmen slug yang tidak terdaftar otomatis di-fallback ke menu default (`/mahasiswa/dashboard` dan `/admin/games`).
- **Implementasi Komponen & Routing:**
  1. **Container Komponen Mahasiswa ([src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx)):**
     - Menerima prop `activeMenu: StudentActiveMenu`.
     - Ketika pengguna mengklik menu di sidebar atau kartu di overview, navigasi diarahkan menggunakan `router.push('/mahasiswa/' + menuId)`.
  2. **Dynamic Route Page Mahasiswa ([src/app/mahasiswa/[menu]/page.tsx](file:///d:/CP-Arena/src/app/mahasiswa/[menu]/page.tsx)):**
     - Membaca slug melalui `useParams().menu`.
     - Melakukan validasi terhadap *whitelist* menu yang diizinkan (`['dashboard', 'katalog', 'team', 'capaian', 'leaderboard', 'profil']`). Jika di luar daftar, me-redirect ke `/mahasiswa/dashboard`.
  3. **Mahasiswa Root Redirect Page ([src/app/mahasiswa/page.tsx](file:///d:/CP-Arena/src/app/mahasiswa/page.tsx)):**
     - Mengalihkan akses `/mahasiswa` langsung ke `/mahasiswa/dashboard`.
  4. **Container Komponen Admin ([src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx)):**
     - Menerima prop `activeAdminTab: AdminActiveTab`.
     - Tab navigation memicu `router.push('/admin/' + tabId)`.
  5. **Dynamic Route Page Admin ([src/app/admin/[tab]/page.tsx](file:///d:/CP-Arena/src/app/admin/[tab]/page.tsx)):**
     - Membaca slug melalui `useParams().tab`.
     - Validasi terhadap *whitelist* tab (`['games', 'questions', 'teams', 'students']`). Jika tidak valid, fallback ke `/admin/games`.
  6. **Admin Root Redirect Page ([src/app/admin/page.tsx](file:///d:/CP-Arena/src/app/admin/page.tsx)):**
     - Mengalihkan akses `/admin` langsung ke `/admin/games`.
  7. **Preservasi Top Navbar & Marquee:**
     - Struktur [src/components/arena/TopNavbar.tsx](file:///d:/CP-Arena/src/components/arena/TopNavbar.tsx) dan marquee First Blood tetap dipertahankan 100% tanpa perubahan visual/struktural.
- **Verifikasi Sistem & Penjaminan Mutu (QA):**
  - Pembaruan test suite pada [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs) dengan penambahan Group 9 (Dynamic Routing Mahasiswa) dan Group 10 (Dynamic Routing Admin).
  - Total pengujian: **64/64 unit tests lulus 100%**.
  - TypeScript Compiler (`tsc --noEmit`): **0 Error / Clean Type Checking**.
  - Next.js Production Build (`next build`): **100% Berhasil**, seluruh 14 rute statis & dinamis ter-generate secara optimal.

### 15. Penataan UI/UX: Eliminasi Ticker Marquee First Blood untuk Tampilan Bersih & Minimalis
- **Tanggal Rilis:** 14 November 2026
- **Tujuan Rekayasa & UI/UX:**
  - Menghilangkan pita berjalan (*continuous marquee banner*) First Blood yang sebelumnya terletak di bawah Header TopNavbar.
  - Memberikan *vertical viewing area* yang lebih luas dan pengalaman visual yang lebih tenang (*less visual noise/distraction*), selaras dengan konsep dashboard akademis modern.
- **Implementasi:**
  - Menghapus komponen `<FirstBloodMarquee announcements={firstBloods} />` dan dependensi state terkait pada [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx).
- **Verifikasi Sistem:**
  - TypeScript Compiler (`tsc --noEmit`): **0 Error**.
  - System Verification Suite: **64/64 tests lulus 100%**.

### 16. Redesain UI/UX & Arsitektur Layout: Sidebar Full-Height Docked & Eliminasi Truncation Navigasi
- **Tanggal Rilis:** 14 November 2026
- **Latar Belakang & Analisis UI/UX & Software Engineering:**
  - **Identifikasi Masalah (Before):**
    1. *Fragmentasi Visual:* Sidebar sebelumnya terpecah menjadi 2 kartu terapung (*floating cards*) terpisah dengan rounded border tebal dan gap margin yang meninggalkan ruang kosong gelap di bawahnya (*abrupt cutoff*).
    2. *Text Truncation Parah:* Lebar sidebar sebelumnya terlalu sempit (`w-64` / `w-72`), menyebabkan teks menu utama dan sublabel terpotong elipsis (`...`) seperti `Capaian & Evalu...`, `Klasemen & Ran...`, `Tantangan Soal So..`, dan `Arena Pertaru..`, sehingga merusak estetika dan profesionalitas antarmuka.
    3. *Layout Disconnected:* Sidebar dibungkus di dalam kontainer ber-padding luar (`max-w-[1720px] mx-auto px-4 py-6`), menjadikannya tidak menempel (*docked*) ke tepi layar selayaknya aplikasi dashboard modern (seperti Linear, GitHub, Supabase, Vercel).
  - **Prinsip Perancangan Baru (After):**
    1. **Full-Height Docked Sidebar:** Menggunakan kelas `md:sticky md:top-[61px] md:h-[calc(100vh-61px)]` dengan garis pembatas vertikal presisi `border-r border-[#1e293b] bg-[#090e1a]`. Menempel sempurna dari bawah TopNavbar hingga dasar layar.
    2. **Adequate Width & Zero Truncation:** Memperluas dimensi horizontal menjadi responsif `w-full md:w-72 lg:w-80 xl:w-[328px]`, menjamin seluruh label navigasi dan sublabel terbaca utuh tanpa terpotong.
    3. **Three-Tier Seamless Vertical Architecture:**
       - *Top Header Tier:* Profil mahasiswa terintegrasi dengan avatar ambient glow, NIM, Prodi, badge kelas, level flame, dan XP progress bar (dilindungi border-bottom).
       - *Middle Nav Tier:* Menu navigasi 6 item yang memiliki *vertical scrollbar* mandiri (`overflow-y-auto custom-scrollbar`) agar tetap nyaman diakses pada monitor laptop 13-14 inci.
       - *Bottom Action Tier:* Pinned footer dengan tombol *Segarkan Data* (sinkronisasi) dan indikator status *STMIK TIME • CP Arena v2.1 Connected*.
    4. **Restrukturisasi App Body ([MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx)):**
       - Mengubah wrapper menjadi flex column `min-h-screen bg-[#070b14]`, di mana area konten utama `<main>` mengisi sisa layar (`flex-1 min-w-0`) dengan padding leluasa (`px-4 sm:px-6 lg:px-8 py-6`).
- **Verifikasi Sistem:**
  - TypeScript Compiler (`tsc --noEmit`): **0 Error / Clean Type Checking**.
  - System Verification Suite: **64/64 tests lulus 100%**.

### 17. Implementasi Fixed-Position Sidebar & Migrasi Tombol Aksi Logout
- **Tanggal Rilis:** 14 November 2026
- **Tujuan Rekayasa & UX Improvement:**
  1. *Sidebar Benar-Benar Terkunci (Fixed Viewport Position):* Mengganti perilaku sticky berbasis kontainer menjadi `position: fixed` (`md:fixed md:top-[61px] md:bottom-0 md:left-0`). Ketika pengguna melakukan *scroll down/up* pada konten soal kuis, katalog, maupun papan peringkat, sidebar tetap 100% diam dan terkunci di tempat tanpa bergerak sedikit pun.
  2. *Offsetting Konten Utama:* Elemen `<main>` diberi margin kiri responsif (`md:ml-72 lg:ml-80 xl:ml-[328px]`) untuk mengimbangi lebar sidebar fixed, memastikan tidak ada elemen konten yang tertutup.
  3. *Migrasi Tombol Logout Akun:* Mengubah tombol di bagian bawah sidebar dari *Segarkan Data* menjadi tombol resmi **Keluar (Logout)** yang memicu pembersihan sesi `ArenaStore.logout()` dan pengalihan ke `/login`.
- **Implementasi Komponen:**
  - [src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx): `md:fixed md:top-[61px] md:bottom-0 md:left-0` dengan tombol logout rose gradient.
  - [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx): Menyematkan prop `onLogout={handleLogout}` dan margin offset `md:ml-72 lg:ml-80 xl:ml-[328px]`.
- **Verifikasi Sistem:**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **64/64 tests pass (100%)**.

### 18. Minimalis & Clean Navigation Refactoring: Eliminasi Badge Statis & Arrow Redundant
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan UI/UX Designer & Software Engineering:**
  - **Identifikasi Masalah (Carnival/Rainbow Effect):** Badge statis pada setiap baris menu (`Utama`, `7 Paket`, `Snake-Draft`, `4 Badges`, `Realtime`, `Pengaturan`) menampilkan 6 warna cerah berbeda yang bertabrakan, menciptakan distraksi sensorik visual (*cognitive overload*). Selain itu, badge mengambil ruang horizontal 70-80px sehingga memotong deskripsi sublabel (seperti `Arena Pertarungan ...`).
  - **Penerapan Prinsip "Less is More" & Standar Industri (Linear, GitHub, Vercel, Supabase):**
    1. Seluruh badge statis warna-warni dihilangkan, mengembalikan hierarki visual yang tenang, fokus, dan berkelas.
    2. Ikon chevron panah kanan `>` yang redundant dihilangkan untuk menciptakan tampilan flat-menu modern.
    3. Tipografi diberikan ruang bernapas leluasa: teks judul menu (`text-sm font-semibold`) dan sublabel (`text-[11px] text-slate-400`) kini tampil 100% utuh tanpa elipsis.
    4. Indikator aktif dipercantik dengan aksen bar vertikal halus di sisi kiri (`w-1 bg-cyan-400 rounded-r-full`) dipadukan dengan gradient aktif lembut.
- **Implementasi Komponen:**
  - [src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx): Refactoring struktur data `menuItems` dan pembersihan elemen badge/arrow JSX.
- **Verifikasi Sistem:**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **64/64 unit tests lulus 100%**.

### 19. Transformasi Panel Profil Sidebar: Eliminasi Kotak Avatar Menuju Minimalist Academic Header
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan UI/UX Designer & Software Engineering:**
  - **Latar Belakang:** Kotak avatar emoji 48px di header sidebar redundan dengan avatar yang sudah tampil di TopNavbar, menyita ruang horizontal, dan menimbulkan impresi game kasual yang kontras dengan portal kompetisi akademik.
  - **Penyempurnaan Desain (After):**
    1. Kotak avatar `w-12 h-12` resmi dihilangkan dari header sidebar.
    2. Identitas mahasiswa dirombak dengan tipografi rata kiri (*left-aligned clean typography*):
       - Baris atas: Codename mahasiswa (`text-base font-extrabold text-white`) bersanding rapi dengan badge live status kelas (`Kelas KAMIS` / `Kelas JUMAT`).
       - Baris bawah: Identitas akademik lengkap (`NIM • Prodi • Angkatan`) dengan warna slate redup.
    3. Widget progress bar level dan XP di bawahnya tetap terintegrasi sempurna dengan garis pemisah border halus.
- **Implementasi Komponen:**
  - [src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx): Pembersihan elemen avatar box dan restrukturisasi layout profil.
- **Verifikasi Sistem:**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **64/64 unit tests lulus 100%**.

### 20. Refinement Card Profil & Gamification Tier Widget: Micro Rank Chip & XP Countdown Highlight
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan UI/UX Designer & Software Engineering:**
  - **Penerapan Psikologi Gamifikasi (*Goal Gradient Effect*):**
    1. Teks sisa XP ke level berikutnya diubah menjadi menyala dan memotivasi: `Butuh `**`31 XP`**` ke Lv.5`, di mana angka `31 XP` di-highlight warna amber cerah (`text-amber-400 font-bold`).
    2. Gelar Big-O (`⚡ O(N) Sprinter`) yang sebelumnya berada di catatan kaki kecil dinaikkan kelasnya menjadi **Micro Rank Badge Chip** berlatar gelap (`bg-[#111827] border border-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded-md`).
    3. Progress bar XP dipertebal (`h-2.5`) dengan *specular shimmer tip* (`bg-white/70 blur-[1px]`) di ujung bar untuk memberikan kesan hidup dan dinamis.
  - **Penataan Tipografi Identitas:**
    - NIM dikemas dalam *monospace chip badge* yang presisi.
    - Prodi dan angkatan menggunakan font sans-serif halus (`Sistem Informasi '25`).
    - Badge kelas disempurnakan dengan rasio visual yang lebih seimbang.
- **Implementasi Komponen:**
  - [src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx): Penyempurnaan card profil, progress bar shimmer, rank chip, dan countdown highlight.
- **Verifikasi Sistem:**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **64/64 unit tests lulus 100%**.

### 21. Restrukturisasi Arsitektur Navigasi: Grouped Flat Navigation (Standar DOMjudge/Linear)
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan UI/UX Designer & Software Engineering:**
  - **Eliminasi Teks Redundan & Noise:** Menghapus teks artifak `6 MENU` dan mengganti label kaku `MENU NAVIGASI PESERTA` menjadi pengelompokan fungsional (*Grouped Flat Sections*).
  - **Pencegahan Anti-Pattern Sub-Sub-Menu:** Menghindari sistem *nested accordion menu* 3 level yang menghambat kecepatan navigasi mahasiswa saat kontes live (Fitts's Law). Sebagai gantinya, mengadopsi navigasi datar 1-klik yang dikelompokkan ke dalam kategori domain:
    1. **KOMPETISI & ARENA (DOMjudge Core):** Dashboard (Overview), Katalog Game (Tantangan Solo/Kontes), Team Battle (Arena Tim & Kode Gabung), dan Klasemen & Ranking (Scoreboard ICPC).
    2. **AKADEMIK & PROFIL:** Capaian & Evaluasi (Milestones & Rapor Dosen) dan Profil & Avatar (Kustomisasi Karakter).
    3. **PANEL PEMBINA (jika role ADMIN):** Akses instan Command Center Dosen.
- **Implementasi Komponen:**
  - [src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx): Pemisahan `arenaMenuItems` dan `academicMenuItems` dengan section headers minimalis.
- **Verifikasi Sistem:**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **64/64 unit tests lulus 100%**.

### 22. SDLC Sprint 1: Realisasi Mental Model DOMjudge Internal (Restrukturisasi Kategori, Naming Semantik, & Menu Riwayat Submisi)
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan SDLC & Arsitektur Perangkat Lunak:**
  - **Transisi Domain Model (Ubiquitous Language):** Mengubah terminologi kasual kuis ("Game", "Team Battle", "Avatar") menjadi terminologi resmi platform penjurian *Competitive Programming* ala DOMjudge:
    1. **`KOMPETISI DOMJUDGE (LIVE ARENA)`**
       - 📊 **Overview Kontes** (`/mahasiswa/dashboard`) — Status kontes, countdown timer, & akses cepat.
       - 🏆 **Arena Kontes** (`/mahasiswa/katalog` atau `/mahasiswa/kontes`) — Problem set A–Z dan pengerjaan soal.
       - 👥 **Tim & Kode Gabung** (`/mahasiswa/team` atau `/mahasiswa/tim`) — Squad roster dan persiapan registrasi kode tim (maks. 3 mahasiswa).
       - 📊 **Scoreboard ICPC** (`/mahasiswa/leaderboard` atau `/mahasiswa/scoreboard`) — Live Matrix board dengan penalti dan freeze status.
       - 📝 **Riwayat Submisi** (`/mahasiswa/submisi`) — Live judge log verdicts (Accepted, Test Case count, penalti integritas tab).
    2. **`LATIHAN & EVALUASI KAMPUS`**
       - 🎖️ **Evaluasi Akademik** (`/mahasiswa/capaian` atau `/mahasiswa/evaluasi`) — Rekap nilai dosen, diagnostik materi Big-O, dan XP.
       - ⚙️ **Profil Mahasiswa** (`/mahasiswa/profil`) — Akun, kredensial NIM, dan pengaturan identitas.
  - **Implementasi Komponen Baru & URL Aliases:**
    - [src/components/arena/SubmissionsHistoryTab.tsx](file:///d:/CP-Arena/src/components/arena/SubmissionsHistoryTab.tsx): Tabel live verdict log submisi peserta dengan filter submisi pribadi vs satu kelas.
    - [src/app/mahasiswa/[menu]/page.tsx](file:///d:/CP-Arena/src/app/mahasiswa/[menu]/page.tsx): Dukungan semantic aliases (`kontes`, `scoreboard`, `tim`, `evaluasi`) dan penambahan rute `/mahasiswa/submisi`.
    - [src/components/arena/StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx): Layout Grouped Navigation DOMjudge dengan ikon teknis (`Code2`, `Users`, `FileText`, `Trophy`).
- **Verifikasi Sistem & Penjaminan Mutu (QA):**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **70/70 unit tests lulus 100%** di [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs).

### 23. SDLC Sprint 2: Implementasi Engine Tim & Kode Gabung 6-Karakter (DOMjudge ICPC Standard)
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan SDLC & Arsitektur Perangkat Lunak:**
  - **Kebutuhan Bisnis & Visi DOMjudge Internal:** Memungkinkan mahasiswa mendaftarkan squad kompetisi secara instan dan mandiri menggunakan kode unik 6 karakter. Si A mendirikan tim, membagikan kode ke Si B dan Si C, dan keduanya otomatis tergabung ke dalam 1 tim kompetisi tanpa intervensi manual dosen.
  - **Spesifikasi Aturan & Validasi Engine (Domain Rules):**
    1. **Format Kode Tim 6-Karakter:** Diterbitkan otomatis dengan format `CP` + 4 karakter alfanumerik (contoh: `CPVAQP`, `CP882A`) dengan toleransi case-insensitive, trimming, dan sanitasi tanda hubung.
    2. **Batas Kuota Roster ICPC:** Maksimal tepat 3 mahasiswa per tim (Trio). Pendaftaran anggota ke-4 otomatis ditolak dengan pesan kesalahan ramah pengguna.
    3. **Kohort Kelas Integritas:** Mahasiswa hanya dapat bergabung ke tim yang berada di kelas jadwal yang sama (`KAMIS` vs `JUMAT`).
    4. **Siklus Hidup Tim (Lifecycle):**
       - *Create Team:* Mahasiswa menjadi Ketua Tim (`leader_nim`) dan mendapatkan kode gabung.
       - *Join Team with Code:* Anggota otomatis terdaftar dan total skor XP tim terakumulasi secara dinamis.
       - *Leave Team:* Mahasiswa dapat keluar; jika ketua keluar, kepemimpinan diserahkan ke anggota berikutnya.
       - *Disband Team:* Tim dapat dibubarkan oleh Ketua Tim atau Dosen, mengembalikan seluruh anggota menjadi peserta solo.
  - **Implementasi Komponen & Integrasi:**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts): Penambahan atribut `kode_gabung`, `leader_nim`, dan interface `TeamMemberInfo`.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): Implementasi metode `generateTeamJoinCode`, `createTeam`, `joinTeamWithCode`, `leaveTeam`, `disbandTeam`, `getTeamMembers`, serta memory-store fallback untuk eksekusi serverless dan Node.js test runner.
    - [src/components/arena/TeamBattleTab.tsx](file:///d:/CP-Arena/src/components/arena/TeamBattleTab.tsx): Transformasi UI menjadi ICPC Team Roster Hub dengan Hero Join Code spotlight, 3 kartu slot anggota visual (Leader 👑, Member #2, Member #3), panel gabung/buat tim, direktori tim terbuka, dan pembuka PIN tantangan kolaboratif.
    - [src/components/arena/LeaderboardView.tsx](file:///d:/CP-Arena/src/components/arena/LeaderboardView.tsx): Integrasi highlight `TIM ANDA`, kode gabung tim, dan roster nama anggota pada kolom Klasemen Tim Scoreboard.
    - [supabase/schema.sql](file:///d:/CP-Arena/supabase/schema.sql): Sinkronisasi kolom `kode_gabung VARCHAR(20) UNIQUE` dan `leader_nim VARCHAR(30)` pada tabel `public.teams`.
- **Verifikasi Sistem & Penjaminan Mutu (QA):**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **102/102 unit tests lulus 100%** di [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs) (mencakup 10 skenario baru siklus engine kode tim).

### 24. SDLC Sprint 3: DOMjudge Internal Contest Freeze Scoreboard & Problem Set A–Z
- **Tanggal Rilis:** 14 November 2026
- **Tinjauan SDLC & Arsitektur Perangkat Lunak:**
  - **Realisasi Standar Penjurian ICPC & DOMjudge Matrix Board:** Mengembangkan matriks 2D resmi kontes pemrograman yang menghubungkan peserta/tim terhadap Problem Set A–G dengan sistem balon warna, waktu penalti (menit), dan mekanisme Scoreboard Freeze.
  - **Spesifikasi Aturan & Fitur (Domain Rules):**
    1. **Nomenklatur Problem Set A–G & Balon Warna:**
       - Problem A (🔴 Red): Onboarding Arena: Pemanasan Logika & Big-O
       - Problem B (🟢 Emerald): Fast I/O & Presisi Python
       - Problem C (🔵 Sky): Anatomi Online Judge
       - Problem D (🟡 Amber): Analisis 10^8 & Ad-Hoc
       - Problem E (🟣 Purple): Pola Kompleksitas Algoritma
       - Problem F (🟠 Orange): Observasi Invarian & Game Theory (Mode Team)
       - Problem G (🌸 Pink): Combinatorial Game Theory
    2. **Status Cell Matriks Penjurian:**
       - *First to Solve (First Blood) 🏆:* Kotak hijau tua menyala dengan tanda bintang emas `⭐️` dan catatan `tries/minutes`.
       - *Accepted (Solved) ✅:* Kotak hijau dengan rincian percobaan dan menit solve.
       - *Failed (Not Passed) ❌:* Kotak merah tua dengan tanda `-tries` (misal `-1`, `-2`).
       - *Pending Freeze ⏳:* Kotak biru berkedip dengan tanda `?` atau `+tries?` saat mode Scoreboard Freeze aktif.
       - *Unattempted:* Titik netral (`•`).
    3. **Scoreboard Freeze Simulator (15 Menit Terakhir Kontes):**
       - Toggle interaktif `Freeze / Live` yang mensimulasikan protokol ICPC di mana submisi di 15 menit terakhir kontes dikunci dan disembunyikan sampai sesi pengumuman juara (*reveal ceremony*).
    4. **Dual Mode View:**
       - *Tab Matriks ICPC:* Tabel matriks horizontal 2D dengan statistik footer total solved per problem.
       - *Tab Podium & Tim:* Podest top-3 juara dan klasemen regu squad.
  - **Implementasi Komponen & Integrasi:**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts): Penambahan interface `ICPCProblemStatus`, `ICPCScoreboardRow`, `ICPCProblemMeta`, dan konstanta `ICPC_PROBLEMS_DEF`.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): Implementasi metode `getICPCScoreboard(klubFilter, isFrozen)` dengan algoritma sorting ICPC (Solved count DESC $\rightarrow$ Penalty time ASC $\rightarrow$ XP DESC).
    - [src/components/arena/LeaderboardView.tsx](file:///d:/CP-Arena/src/components/arena/LeaderboardView.tsx): Antarmuka Matriks ICPC DOMjudge dengan Freeze Banner, balon legend bar, cell status real-time, dan highlight pengguna aktif.
    - [src/components/arena/GameCatalogGrid.tsx](file:///d:/CP-Arena/src/components/arena/GameCatalogGrid.tsx): Penyematan badge alfabetis Problem A–G dan balon warna pada setiap kartu soal di Arena Kontes.
- **Verifikasi Sistem & Penjaminan Mutu (QA):**
  - TypeScript Compilation: **0 Error**.
  - System Test Suite: **124/124 unit tests lulus 100%** di [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs) (mencakup 22 skenario uji matriks ICPC & freeze simulator).

---

### Bagian 25: Sprint 4 — Redesain Profil Mahasiswa & Monogram Inisial Akademik (Enterprise & Competitive Standard)
- **Konteks & Kebutuhan UI/UX:**
  - Evaluasi halaman `/mahasiswa/profil` menunjukkan adanya ketidakselarasan antara orientasi kompetisi resmi (DOMjudge / ICPC) dengan elemen gamifikasi kasual.
  - Tampilan lama memuat grid 12 emoji avatar kartun (`🦊, 🐉, 🤖, 🧙‍♂️, 🥷, 🦁, 🦅, ⚡, 🔥, 🛡️, 👾, 👑`) dan diksi video game kasual (*"Cyber-Arena", "Kustomisasi Avatar", "Julukan Kompetitif"*), yang menurunkan impresi profesional platform universitas.
- **Transformasi & Solusi Desain UI/UX:**
  1. **Eliminasi Total 12 Emoji Avatar Kasual:**
     - Seluruh avatar kartun/hewan dihilangkan demi menjaga keseriusan dan wibawa akademik.
  2. **Monogram Inisial Mahasiswa Otomatis (Linear / GitHub Style):**
     - Generator inisial dua huruf dinamis berbasis nama lengkap mahasiswa (contoh: Indra Setiawan $\rightarrow$ `"IS"`, Cecilia Agnesia $\rightarrow$ `"CA"`).
     - Desain monogram squircle dengan gradien biru-indigo-cyan (`from-blue-600 via-indigo-600 to-cyan-500`) dan efek glow halus.
  3. **3 Kartu Metrik Ringkas & Bernilai Tambah:**
     - *Reputasi Algoritma:* Akumulasi XP, Level, Tier badge, dan progress menuju level berikutnya.
     - *Status Squad ICPC DOMjudge:* Nama tim, kode gabung 6-karakter (`[TIMK01]`), dan indikator kapasitas regu bertiga (`● 3/3` atau `● 1/3`).
     - *Performa Kampus:* Rata-rata nilai akademik (0–100) dan total problem solved (AC).
  4. **Struktur Kredensial Akademik Resmi Kampus STMIK TIME:**
     - Data resmi read-only: NIM, Nama Lengkap, Program Studi & Angkatan, Kelas Reguler & Jadwal Lab.
  5. **Form Standar DOMjudge Contest Codename / Handle:**
     - Penggantian label "Julukan Kompetitif" menjadi "Contest Codename / Handle" yang terhubung langsung ke nama samaran pada Scoreboard ICPC Matrix dan ticker First Blood.
- **Implementasi Komponen:**
  - [src/components/arena/ProfileTab.tsx](file:///d:/CP-Arena/src/components/arena/ProfileTab.tsx): Redesain menyeluruh dengan inisial monogram, metric cards, kredensial akademik, dan contest handle form.
  - [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx): Penyesuaian header menjadi *"Profil Mahasiswa & Akun Kompetisi"* serta passing props teams, submissions, dan games.
- **Verifikasi & Validasi:**
  - TypeScript Compilation: **0 Error** via `npx tsc --noEmit`.
  - Verification Suite: **124/124 Tests PASS (100%)** via `npm test`.


---

### Bagian 28: Sprint 7 — Sinkronisasi Penuh Antarmuka Admin & Portal Mahasiswa (Zero AI Slop)
- **Konteks & Kebutuhan:**
  - Menghilangkan inkonsistensi visual, menghapus popup browser bawaan (`confirm()`) pada aksi destruktif mahasiswa & kontes, serta mengimplementasikan modal dialog industrial slate `#0c1222`.
  - Mengatasi bug z-index modal dialog yang terpotong di pojok kiri atas viewport dengan memanfaatkan [ModalPortal.tsx](file:///d:/CP-Arena/src/components/common/ModalPortal.tsx).

---

### Bagian 29: Sprint 8 — Dynamic Question Bank & Online Judge Coding Problem CRUD
- **Konteks & Implementasi:**
  - Mengubah tab **Bank Soal & Editorial** (`/admin/questions`) menjadi sistem Full CRUD dinamis:
    1. Kuis Pilihan Ganda (Teori & Logika Algoritma): Form tambah, edit butir soal, kunci jawaban, dan modal konfirmasi hapus.
    2. Tantangan Koding Online Judge: Manajemen judul soal, batas waktu (ms), batas memori (MB), deskripsi markdown, serta CRUD testcase (Sample vs Hidden Testcase, bobot poin).
  - Terintegrasi langsung dengan `ArenaStore.getCodingProblemForGame(gameId)` di [src/lib/problem-mapping.ts](file:///d:/CP-Arena/src/lib/problem-mapping.ts).

---

### Bagian 30: Sprint 9 — 100% Dynamic Cohort Architecture & Eliminasi Data Kelas Dummy Pre-Seeded
- **Konteks & Masalah Pengguna:**
  - Pengguna mendapati bahwa bar *"PILIH RUANG LINGKUP KELAS / KOHORT"* masih menampilkan kelas bawaan prototipe (`Kelas KAMIS (SI 2025)`, `Kelas JUMAT (TI & SI 2024–2025)`, `🏆 Kelas LOMBA`), padahal admin belum pernah membuat kelas-kelas tersebut secara manual.
  - Pengguna menginstruksikan agar seluruh kelas yang muncul di sistem HANYA yang secara eksplisit dibuat oleh Admin melalui tombol `+ Buat Kelas / Kohort` (100% Murni Dinamis).
- **Analisis Multi-Perspektif:**
  - **Software & Backend Engineering:** Seed data prototipe (`INITIAL_COHORTS`) di [src/lib/seed-data.ts](file:///d:/CP-Arena/src/lib/seed-data.ts) sebelumnya menginisialisasi 3 kohort default ke dalam `localStorage` browser. Perlindungan statis (`['c-kamis', 'c-jumat', 'c-lomba']`) pada `deleteCohort` juga membatasi kebebasan admin.
  - **UI/UX Designer:** Jika total kelas terdaftar adalah 0, sistem tidak boleh menampilkan bar filter kosong atau kelas dummy bawaan. Sebaliknya, harus ditampilkan *Empty State* industrial yang rapi dengan panduan jelas mengarahkan Admin ke menu pembuatan kelas di Data Mahasiswa.
  - **Quality Assurance & Control:** Seluruh pengujian sistem (termasuk Test Group 14 dan 16) harus memvalidasi bahwa sistem bermula dari 0 kohort, seluruh pembuatan kelas melalui `createCohort` tercatat dinamis, dan penghapusan kelas diperbolehkan asalkan tidak ada mahasiswa terdaftar di dalamnya.
- **Implementasi Solusi:**
  1. **Eliminasi Auto-Seed Dummy Cohort:**
     - [src/lib/seed-data.ts](file:///d:/CP-Arena/src/lib/seed-data.ts): Mengosongkan `INITIAL_COHORTS: Cohort[] = [];`.
     - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
       - `getCohorts()`: Mengembalikan `[]` saat belum ada data dan secara otomatis membersihkan kohort legacy dummy (`c-kamis`, `c-jumat`, `c-lomba`) yang tersisa di `localStorage` peramban klien.
       - `deleteCohort(id)`: Menghapus batasan hardcoded kohort inti, sehingga seluruh kelas buatan admin dapat dihapus secara aman (dengan proteksi integritas: kelas tidak dapat dihapus jika masih ada mahasiswa terdaftar).
       - `isGameAllowedForUser(user, gameId)`: Mengizinkan akses kontes terbuka jika mahasiswa belum memiliki kohort spesifik, atau membatasi sesuai matriks akses `cohort.allowed_game_ids`.
       - `createGame(dto)`: Mengganti fallback statis menjadi `this.getCohorts().map(c => c.id_cohort)`.
  2. **Empty State & UI Dinamis di Kontrol Kontes & Saklar:**
     - [src/components/admin/tabs/AdminContestControlTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminContestControlTab.tsx):
       - Bilah filter *"PILIH RUANG LINGKUP KELAS / KOHORT"* menampilkan status `0 Kelas` dengan pesan empty state industrial rapi dan tombol shortcut ke `+ Buat Kelas di Data Mahasiswa`.
       - Quick Master Freeze disembunyikan saat `activeCohorts.length === 0`.
       - Tabel saklar menampilkan kolom informatif *"Status Saklar Kelas"* dengan catatan *"Belum ada kelas terdaftar (Atur di menu Data Mahasiswa)"* saat belum ada kelas dibuat.
       - Modal formulir Tambah/Edit Game menampilkan pesan panduan jika belum ada kelas terdaftar.
  3. **Penyelarasan Dinamis di Menu Pemantauan Mahasiswa:**
     - [src/components/admin/tabs/AdminStudentMonitorTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminStudentMonitorTab.tsx):
       - Tombol filter kelas kini murni dipetakan dari kohort aktif hasil inputan admin (`cohorts.map(...)`).
       - Modal Tambah Akun memvalidasi ketersediaan kelas dan menampilkan instruksi pembuatan kelas baru jika admin belum membuat kelas.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Type-Checking: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated System Suite: **227/227 Tests PASS (100%)** via `npm test` di [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs).

---

### Bagian 31: Sprint 10 — 100% Dynamic Contest Architecture, Auto-Purge Mock Games, & Real-Time Search Engine
- **Konteks & Kebutuhan Rekayasa:**
  - Pengguna meminta agar daftar paket kontes (`games`) pada tab **Kontrol Kontes & Saklar** dijadikan **100% murni dinamis** (hanya muncul jika Admin membuatnya secara manual melalui `+ Buat Paket Kontes Baru`), selaras dengan arsitektur kohort dinamis sebelumnya.
  - Pengguna menginstruksikan pembersihan total terhadap 7 paket kontes dummy prototipe (`G1`–`G7` dengan judul mock bawaan) agar basis data bersih dan siap untuk data produksi/riil.
  - Menyediakan **Field Search (Pencarian Real-Time)** dan filter mode game (`SOLO` vs `TEAM`) pada tabel kontes.
- **Analisis Multi-Perspektif:**
  - **Software Engineering:**
    - Lifecycle data kontes kini murni digerakkan oleh event creation Admin (`ArenaStore.createGame`).
    - Skema auto-numbering ID game (`G1`, `G2`...) beradaptasi mulai dari indeks 1 secara dinamis.
  - **Backend Engineering:**
    - [src/lib/seed-data.ts](file:///d:/CP-Arena/src/lib/seed-data.ts): Mengosongkan konstanta awal `INITIAL_GAMES: Game[] = [];`.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): `ArenaStore.getGames()` kini dilengkapi sanitasi otomatis terhadap array legacy mock games (`Onboarding Arena...`, `[KAMIS] - ...`, `[JUMAT] - ...`), sehingga browser klien yang me-refresh halaman otomatis menghapus data dummy lama tanpa perlu pembersihan cache manual.
  - **UI/UX Designer:**
    - [src/components/admin/tabs/AdminContestControlTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminContestControlTab.tsx):
      - Toolbar atas tabel kontes dilengkapi search bar (`Search` icon, clear button `X`), mode filter pills (`Semua`, `SOLO`, `TEAM`), dan counter badge `(Menampilkan X dari Y)`.
      - Saat 0 kontes terdaftar (`games.length === 0`), ditampilkan Empty State industrial yang elegan dengan tombol CTA `+ Buat Paket Kontes Pertama`.
      - Saat pencarian tidak menemukan hasil yang cocok, ditampilkan status informatif dengan tombol `Reset Filter Pencarian`.
    - [src/components/admin/tabs/AdminQuestionBankTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminQuestionBankTab.tsx):
      - Menampilkan empty state yang rapi jika belum ada paket kontes terdaftar dengan tombol navigasi langsung ke menu Kontrol Kontes.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 18 (Contest Search Engine & Real-Time Filtering Logic)** yang menguji filter ID game, keyword judul, kategori materi, isolasi mode SOLO/TEAM, dan non-matching query.
      - Memperbarui Test Group 6 untuk memvalidasi inisialisasi awal 0 paket game dan penciptaan kontes dinamis.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **239/239 Tests PASS (100%)** via `npm test`.

---

### Bagian 32: Sprint 11 — Industrial Semantic URL Standardization (/admin/contests) & Zero Breaking Change Compatibility
- **Konteks & Kebutuhan Rekayasa:**
  - Standardisasi URL endpoint menu *Kontrol Kontes & Saklar* dari URL prototipe `/admin/games` menjadi rute berstandar industri Competitive Programming `/admin/contests` (berkiblat pada arsitektur ICPC DOMjudge, Codeforces, dan Kattis).
  - Menjaga prinsip *High Availability & Zero Breaking Changes*: URL lama (`/admin/games`, `/admin/game`, `/admin/kontes`, `/admin/contest`) harus tetap dapat diakses tanpa menghasilkan error 404 melalui routing aliases & seamless state resolver.
  - Memastikan konsistensi arsitektur RBAC, navigasi internal, deep link, dan test suite verifikasi.
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Domain-Driven Design (DDD):**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts): Memperbarui definisi tipe `AdminActiveTab` dengan `'contests'` sebagai union type kanonikal utama:
      ```typescript
      export type AdminActiveTab = 'contests' | 'games' | 'questions' | 'submissions' | 'teams' | 'students' | 'export';
      ```
    - [src/components/admin/AdminSidebar.tsx](file:///d:/CP-Arena/src/components/admin/AdminSidebar.tsx): Memperbarui tab identifier menu navigasi sidebar ke `id: 'contests'` dan memastikan highlight visual tetap aktif jika pengguna membuka alias legacy `games`.
    - [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx): Memperbarui evaluasi tab aktif agar mengenali `activeAdminTab === 'contests' || activeAdminTab === 'games'`.
  - **Backend Engineering & Next.js Routing Architecture:**
    - [src/app/admin/[tab]/page.tsx](file:///d:/CP-Arena/src/app/admin/[tab]/page.tsx):
      - Mengonfigurasi `VALID_TABS` dengan `'contests'` sebagai entri utama.
      - Menambahkan dictionary `TAB_ALIASES` memetakan `'games'`, `'game'`, `'kontes'`, dan `'contest'` ke `'contests'`.
      - Fallback route yang tidak valid diarahkan secara aman ke `/admin/contests`.
    - [src/app/admin/page.tsx](file:///d:/CP-Arena/src/app/admin/page.tsx):
      - Mengubah rute redirect default dari `/admin/games` ke `/admin/contests`.
    - [src/components/admin/tabs/AdminQuestionBankTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminQuestionBankTab.tsx):
      - Mengarahkan tombol CTA empty state langsung ke `/admin/contests`.
  - **UI/UX Designer:**
    - Menyelaraskan teks judul header *"Kontrol Kontes & Saklar Status Independen"* dengan URL address bar `/admin/contests`, menciptakan kohesi semantik yang profesional bagi admin dan dosen.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Test Group 8 diperbarui untuk memvalidasi redirect pasca login Admin langsung menuju `/admin/contests`.
      - Test Group 10 diperbarui untuk menguji rute dinamis `/admin/contests`, pengujian alias mundur (`/admin/games` -> `/admin/contests`, `/admin/game` -> `/admin/contests`), alias semantik bahasa Indonesia (`/admin/kontes` -> `/admin/contests`), dan fallback URL kosong/invalid.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **243/243 Tests PASS (100%)** via `npm test`.

---

### Bagian 33: Sprint 12 — Global Standard Industrial Taxonomy (/admin/problems) & Zero Breaking Change Compatibility
- **Konteks & Kebutuhan Rekayasa:**
  - Standardisasi endpoint menu *Bank Soal & Editorial* dari URL lama `/admin/questions` menjadi rute berstandar emas global Competitive Programming `/admin/problems` (mengadopsi arsitektur ICPC DOMjudge, Codeforces, LeetCode, dan Kattis).
  - Menjaga prinsip *Zero Breaking Changes*: URL lama (`/admin/questions`, `/admin/question`, `/admin/soal`, `/admin/bank-soal`, `/admin/problem-bank`) otomatis me-resolve ke `/admin/problems` tanpa menghasilkan error 404.
  - Memastikan konsistensi penamaan domain (*Ubiquitous Language*) antara `Problem A`, `Problem B`, `Testcase`, `Starter Code`, dan `Editorial` dengan address bar URL browser.
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Domain-Driven Design (DDD):**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts): Memperbarui definisi tipe `AdminActiveTab` dengan `'problems'` sebagai union type kanonikal utama:
      ```typescript
      export type AdminActiveTab =
        | 'contests'
        | 'games'
        | 'problems'
        | 'questions'
        | 'submissions'
        | 'teams'
        | 'students'
        | 'export';
      ```
    - [src/components/admin/AdminSidebar.tsx](file:///d:/CP-Arena/src/components/admin/AdminSidebar.tsx): Mengubah tab identifier menu navigasi sidebar ke `id: 'problems'` dan memastikan highlight visual tetap aktif jika pengguna membuka alias legacy `questions`.
    - [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx): Memperbarui evaluasi tab aktif agar mengenali `activeAdminTab === 'problems' || activeAdminTab === 'questions'`.
  - **Backend Engineering & Next.js Routing Architecture:**
    - [src/app/admin/[tab]/page.tsx](file:///d:/CP-Arena/src/app/admin/[tab]/page.tsx):
      - Mengonfigurasi `VALID_TABS` dengan `'problems'` sebagai entri utama.
      - Menambahkan dictionary `TAB_ALIASES` memetakan `'questions'`, `'question'`, `'problem'`, `'soal'`, `'bank-soal'`, dan `'problem-bank'` ke `'problems'`.
      - Fallback route yang tidak valid diarahkan secara aman ke `/admin/contests`.
  - **UI/UX Designer:**
    - Menyelaraskan teks judul *"Bank Soal & Editorial"* dan sublabel *"Narasi, Testcase & Hint"* dengan URL address bar `/admin/problems`, memberikan impresi platform Competitive Programming kelas dunia yang profesional dan terpercaya.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Test Group 10 diperbarui untuk menguji rute dinamis `/admin/problems`, pengujian alias mundur (`/admin/questions` -> `/admin/problems`, `/admin/question` -> `/admin/problems`), alias semantik bahasa Indonesia (`/admin/soal`, `/admin/bank-soal`), dan variasi URL lainnya.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **248/248 Tests PASS (100%)** via `npm test`.

---

### Bagian 34: Sprint 13 — Anti-Cheat Deterministic Seeded Question Shuffling per Participant
- **Konteks & Kebutuhan Rekayasa:**
  - Mahasiswa yang mengerjakan kuis maupun tantangan kontes tidak boleh mendapatkan urutan soal yang seragam demi mencegah kecurangan saling intip di laboratorium komputer (misal: Soal #1 bagi Mahasiswa A menjadi Soal #4 bagi Mahasiswa B).
  - Pengacakan wajib bersifat **Deterministik & Idempotent** (tidak boleh menggunakan `Math.random()` murni): jika mahasiswa me-refresh browser atau koneksi terputus, urutan soal tetap 100% konsisten bagi dirinya sepanjang sesi.
  - Opsi pilihan ganda (A, B, C, D) turut diacak secara deterministik per butir soal per peserta untuk menghentikan pembocoran huruf opsi.
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Cryptographic PRNG:**
    - [src/lib/shuffle.ts](file:///d:/CP-Arena/src/lib/shuffle.ts):
      - Mengembangkan generator hashing 32-bit FNV-1a (`stringToSeed`).
      - Mengembangkan generator angka pseudorandom berkualitas tinggi Mulberry32 (`createSeededRandom`).
      - Mengembangkan algoritma pengacakan murni (*pure immutable*) Fisher-Yates / Knuth (`seededShuffle`).
    - Seed unik dibentuk dari kombinasi identitas: `${user.nim}_${game.id_game}_QUIZ_SEED`.
  - **Backend Engineering & Data Model:**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts): Menambahkan field `shuffled_question_ids?: string[]` pada `Submission` interface.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - `ArenaStore.startQuizSession`: Mengunci urutan array ID soal teracak ke dalam rekaman sesi submisi mahasiswa.
      - `ArenaStore.getQuestionsForUser`: Memulihkan (*restore*) urutan soal teracak persisten jika sesi sudah aktif, atau me-fallback ke deterministik shuffle.
      - Penilaian `ArenaStore.answerQuestion`: Tetap terikat secara independen pada `id_soal` kanonikal, sehingga kebal terhadap pergeseran indeks.
  - **UI/UX Designer:**
    - [src/components/arena/QuizArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/QuizArenaModal.tsx):
      - Navigator nomor kuis (`#1`, `#2`, `#3`...) memetakan urutan lokal unik mahasiswa.
      - Header menampilkan `Soal X dari Y` dan indikator sekunder halus `Ref: <id_soal>` untuk memudahkan pengawas atau dosen mengidentifikasi nomor referensi saat mendampingi mahasiswa di lab.
      - Pilihan ganda diacak deterministik per butir soal via `useMemo` dan `seededShuffle`.
    - [src/components/arena/EditorialModal.tsx](file:///d:/CP-Arena/src/components/arena/EditorialModal.tsx):
      - Menampilkan hasil evaluasi dan editorial pembahasan pasca-ujian mengikuti urutan yang persis sama dengan yang dialami mahasiswa saat ujian.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 19 (Deterministic Seeded Shuffle & Anti-Cheat Question Order)** dengan 12 assertions baru yang memvalidasi: determinisme seed, keanekaragaman urutan antar-mahasiswa, persistensi sesi pasca-reload, integritas penilaian berbasis ID soal, dan kekebalan terhadap pergeseran indeks.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **260/260 Tests PASS (100%)** via `npm test`.

---

### Bagian 35: Sprint 14 — Mathematical & Algorithmic Formula Rendering Engine (Pangkat `**`, Big-O & Relational Symbols)
- **Konteks & Kebutuhan Rekayasa:**
  - Mahasiswa membutuhkan representasi visual yang jelas dan mudah dibaca untuk rumus matematika, batas masalah (*constraints*), dan analisis kompleksitas algoritma.
  - Mengonversi secara cerdas notasi input dosen seperti pangkat Python (`10**8`, `2**31`, `N**2`), pangkat kalkulator (`10^8`), kompleksitas Big-O (`O(N log N)`, `O(N**2)`), dan simbol relasional (`<=`, `>=`, `!=`, `->`, `+-`) menjadi tipografi matematika yang indah.
  - **Prinsip Proteksi Kode (*Code Block Invariance*):** Di dalam blok kode pemrograman (misal `return n ** 2`), operator eksponensial `**` wajib dipertahankan verbatim dan tidak boleh termutasi menjadi format superskrip.
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & AST Tokenizer:**
    - [src/lib/math-parser.ts](file:///d:/CP-Arena/src/lib/math-parser.ts):
      - Mengembangkan parser multi-tahap yang memisahkan segmen `code_block`, `inline_code`, `latex_math`, `big_o`, `power`, `symbol`, dan teks biasa.
      - Mendukung peta translasi `SYMBOL_MAP` (`<=` $\to$ `≤`, `>=` $\to$ `≥`, `!=` $\to$ `≠`, `->` $\to$ `→`, `+-` $\to$ `±`, `\times` $\to$ `×`).
      - Menyediakan fungsi normalisasi `formatMathString` dan tokenizer rekursif `parseInlineMathTokens`.
  - **UI/UX Designer & Tipografi Dark Mode:**
    - [src/components/common/MathText.tsx](file:///d:/CP-Arena/src/components/common/MathText.tsx):
      - Komponen universal yang merender superskrip cyan (`10`<sup>8</sup>), badge Big-O berfont serif italic (`𝒪(N log N)`), simbol relasional berwarna terang, dan blok kode emerald (`#070b14`).
      - Zero XSS vulnerability: Merender murni menggunakan virtual DOM React tanpa `dangerouslySetInnerHTML`.
    - Integrasi penuh pada:
      - [src/components/arena/QuizArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/QuizArenaModal.tsx): Judul, narasi kuis, petunjuk hint, dan opsi jawaban.
      - [src/components/arena/EditorialModal.tsx](file:///d:/CP-Arena/src/components/arena/EditorialModal.tsx): Narasi soal, jawaban mahasiswa, kunci jawaban, dan pembahasan editorial dosen.
      - [src/components/arena/CodingArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/CodingArenaModal.tsx): Deskripsi problem solving, format masukan/keluaran, dan batasan masalah (*constraints*).
      - [src/components/admin/tabs/AdminQuestionBankTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminQuestionBankTab.tsx): Pratinjau butir soal kuis dan tantangan koding.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 20 (Mathematical Notation & Formula Parser Engine)** dengan 13 assertions baru yang memvalidasi: penguraian pangkat Python `10**8` dan `2^31`, ekspresi Big-O `O(N log N)` dan `O(N**2)`, simbol relasional, isolasi kode blok Python `n ** 2`, dan verifikasi string akhir end-to-end.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **273/273 Tests PASS (100%)** via `npm test`.

---

### Bagian 36: Sprint 15 — Pure Dynamic Submissions Feed & Granular Submissions/Problem Deletion Engine
- **Konteks & Kebutuhan Rekayasa:**
  - Menghilangkan data dummy prototipe submisi (`SUB-2545001-G1`, `SUB-2545001-G2`, `SUB-2545001-G4` milik Cecilia) dari antrean penjurian `/admin/submissions`, sehingga sistem beroperasi 100% dengan data dinamis real-time (dimulai dari 0 submisi).
  - Menyediakan kendali penghapusan granular bagi Dosen/Admin:
    - **Hapus per Submisi:** Menghapus satu submisi spesifik, mengembalikan kuota pengerjaan, dan otomatis memotong akumulasi XP serta menyinkronkan ulang level mahasiswa yang bersangkutan.
    - **Hapus per Problem (Bulk Delete):** Menghapus seluruh riwayat submisi untuk paket kontes/soal tertentu sekaligus saat paket tersebut dipilih di filter bar.
  - Mengganti pill filter kelas statis (`KAMIS`, `JUMAT`, `LOMBA`) menjadi filter kohort dinamis (`dynamicCohorts`) yang terhubung langsung ke basis data kohort kelas.
  - Menghadirkan antarmuka *Industrial Dark-Mode Empty State* saat belum ada submisi yang masuk, dengan zero AI slop modal konfirmasi via `ModalPortal`.
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Data Store Architecture:**
    - [src/lib/seed-data.ts](file:///d:/CP-Arena/src/lib/seed-data.ts):
      - Mengosongkan `INITIAL_SUBMISSIONS: Submission[] = [];` menjadi array bersih.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - Mengimplementasikan `auto-purge` pada `getSubmissions()` untuk membersihkan entri mock lama dari `localStorage` browser pengguna secara transparan.
      - Menambahkan metode `deleteSubmission(submissionId: string)`: menghapus record submisi dan mengurangi `total_xp` mahasiswa sebesar XP yang didapat dari submisi tersebut, lalu menghitung ulang levelnya secara matematis.
      - Menambahkan metode `deleteSubmissionsForGame(gameId: string)`: melakukan penghapusan massal seluruh submisi yang berasosiasi dengan paket game tertentu, lalu memotong XP dari seluruh mahasiswa terdampak secara akurat.
  - **UI/UX Designer & Industrial Dark Mode Interface:**
    - [src/components/admin/tabs/AdminSubmissionsTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminSubmissionsTab.tsx):
      - Menghubungkan pill filter kelas ke daftar kohort dinamis (`cohorts` dari store) dengan badge kuantitas submisi real-time.
      - Menghapus residu *fallback* `users[].klub_hari` yang sebelumnya memunculkan kelas dummy (`Kelas ALL`, `Kelas KAMIS`, `Kelas JUMAT`) saat data kelas admin masih kosong, sehingga kini murni 100% hanya menampilkan kelas yang dibuat manual oleh Admin.
      - Menambahkan kolom `Aksi` pada tabel dengan tombol icon sampah (`Trash2`) per baris submisi.
      - Menambahkan tombol aksi toolbar `Hapus Submisi {filterGame}` berwarna rose saat filter paket soal aktif.
      - Menambahkan kartu *Industrial Empty State* elegan (`#0b1120`, border `#1e293b`) dengan ikon `ListChecks` ketika belum ada submisi.
      - Mengimplementasikan 2 modal konfirmasi kustom via [src/components/common/ModalPortal.tsx](file:///d:/CP-Arena/src/components/common/ModalPortal.tsx) tanpa menggunakan `window.confirm()` bawaan browser.
    - [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx):
      - Meneruskan props `cohorts` dan handler `onAlert` ke `<AdminSubmissionsTab />`.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Memutakhirkan **Test Group 12 (DOMjudge ICPC Scoreboard Matrix & Freeze Simulator)** untuk menggunakan seeding dinamis terisolasi untuk pengujian metriks AC dan Freeze Scoreboard tanpa bergantung pada dummy data awal.
      - Menambahkan pengujian di **Test Group 15 (Student Progress Management)** untuk validasi `deleteSubmission` dan `deleteSubmissionsForGame`.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **277/277 Tests PASS (100%)** via `npm test`.

---

### Bagian 37: Sprint 16 — Advanced Snake-Draft Team Engine, Fairness Analytics & Dynamic Squad Management
- **Konteks & Kebutuhan Rekayasa:**
  - Melanjutkan pengembangan menu **Manajemen Tim** ([/admin/teams](http://localhost:3001/admin/teams)) dari prototipe statis (`KAMIS`, `JUMAT`, `LOMBA`) menjadi sistem manajemen skuad kompetitif 100% dinamis terintegrasi penuh dengan kohort kelas buatan Admin.
  - Memperluas algoritma Snake-Draft zig-zag ($1 \to 2 \to 3 \to 3 \to 2 \to 1$) untuk mendukung konfigurasi ukuran tim kustom (2, 3, 4, atau 5 mahasiswa per skuad).
  - Menyediakan **Fairness & Balance Analytics Dashboard** yang memonitor rata-rata XP skuad, disparitas (Delta Max-Min), standar deviasi, dan rating keseimbangan matematis secara *real-time*.
  - Menyediakan kendali manajemen granular: pembubaran per-tim vs per-kelas, pengubahan nama tim, penunjukan ketua tim (*leader*), serta pemindahan anggota antar-skuad dengan rekalkulasi skor otomatis.
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Data Store Architecture:**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts):
      - Memperluas interface `Team` dengan atribut `id_cohort?: string`.
      - Menambahkan interface `TeamFairnessMetrics` untuk kalkulasi analitik keseimbangan.
    - [src/lib/gamification.ts](file:///d:/CP-Arena/src/lib/gamification.ts):
      - Memperbarui `generateSnakeDraftTeams` untuk menerima kohort dinamis (`cohortIdOrKlub`), ukuran tim variabel (`targetTeamSize`), serta penamaan dan kode gabung otomatis.
      - Menambahkan fungsi `calculateTeamFairnessMetrics(teams: Team[])` yang menghitung mean, min/max, delta, standar deviasi ($\sigma = \sqrt{\frac{\sum(XP_i - \bar{XP})^2}{N}}$), persentase deviasi, dan rating keseimbangan (`OPTIMAL`, `GOOD`, `MODERATE`, `IMBALANCED`).
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - Menambahkan `generateTeamsForCohort(cohortIdOrKlub, targetTeamSize)` yang otomatis menyinkronkan referensi `user.id_tim` secara bi-direksional.
      - Menambahkan `disbandTeamsForCohort(cohortIdOrKlub)` untuk pembubaran massal tim per-kohort.
      - Menambahkan `updateTeamDetails(idTim, { nama_tim, leader_nim })` untuk pengeditan metadata tim dan perpindahan kepemimpinan.
      - Menambahkan `moveTeamMember(nim, targetTeamId)` untuk perpindahan mahasiswa antar-skuad dengan rekalkulasi skor tim otomatis.
  - **UI/UX Designer & Industrial Dark Mode Interface:**
    - [src/components/admin/tabs/AdminTeamDraftTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminTeamDraftTab.tsx):
      - Desain ulang menyeluruh (*Zero AI Slop*) menggunakan palet industri utilitarian (`#070b14`, `#0b1120`, border `#1e293b`).
      - Menghilangkan total seluruh ikon dan ornamen klise AI Slop (ikon `Sparkles`, animasi `animate-pulse`, dan emoji warna-warni). Menggantikannya dengan ikon fungsional standar industri (`Shuffle`, `Users`, `BarChart3`, `ArrowUpDown`, `ShieldCheck`, `Shield`).
      - Normalisasi tipografi: font monospace (`font-mono`) dikhususkan secara presisi hanya untuk data teknis (NIM, Kode Gabung, Skor XP, ID Tim), sementara narasi, judul, label tombol, dan modal menggunakan font sans-serif yang bersih dan mudah dibaca.
      - Menghadirkan **Fairness Analytics KPI Card** (Total Skuad, Rata-rata Skor Skuad, Disparitas Max-Min, dan Status Keseimbangan Algoritma dengan indikator deviasi persentase).
      - Menghadirkan filter pill kohort dinamis yang sinkron dengan kohort kelas aktif, serta bar pencarian instan tim/mahasiswa.
      - Kartu tim interaktif dengan rank badge, kode gabung 1-klik salin (*copy-to-clipboard*), total XP beserta deviasi vs rata-rata kelas, badge Ketua Tim yang elegan, tombol pindah anggota, dan tombol aksi per-tim.
      - Menghadirkan 5 modal portal kustom via [src/components/common/ModalPortal.tsx](file:///d:/CP-Arena/src/components/common/ModalPortal.tsx): Modal Generate Draft (dengan selector ukuran tim 2-5 orang), Modal Bubarkan Kelas, Modal Bubarkan Tim Spesifik, Modal Ubah Skuad, dan Modal Pindah Anggota.
    - [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx):
      - Menghubungkan handler `handleGenerateCohortTeams`, `handleDisbandCohortTeams`, `handleDisbandSingleTeam`, `handleUpdateTeam`, dan `handleMoveMember`.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 21 (Dynamic Cohort Snake-Draft, Fairness Analytics & Squad Management)** dengan 26 assertions baru yang memvalidasi pembagian snake-draft kohort dinamis, akurasi akumulasi XP tim, kode gabung, penunjukan leader otomatis, metrik fairness deviasi XP, update nama/leader tim, perpindahan anggota antar-tim, serta pembubaran tim per-unit maupun per-kelas.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **303/303 Tests PASS (100%)** via `npm test`.

---

### Bagian 38: Eliminasi Data Dummy Mahasiswa, Zero-State Industrial UI, dan Transisi 100% Direktori Mahasiswa Dinamis (/admin/students)
- **Konteks & Kebutuhan Rekayasa:**
  - Evaluasi halaman Manajemen Mahasiswa ([/admin/students](http://localhost:3000/admin/students)) yang sebelumnya masih menampilkan 28 akun mahasiswa dummy warisan masa *prototyping* (`2545001 Cecilia`, 14 mahasiswa Kamis, 13 mahasiswa Jumat).
  - Sesuai prinsip *Single Source of Truth* (SSOT), *Clean Slate Architecture*, dan integrasi kohort murni dinamis, data seed aplikasi di lingkungan produksi harus 0 mahasiswa (hanya memuat akun resmi sistem `ADMIN` dan `DOSEN001`).
  - Mengimplementasikan pembersihan otomatis (*auto-purge*) pada `localStorage` browser klien untuk menghapus 28 NIM mahasiswa mock lama tanpa merusak akun admin resmi atau data mahasiswa riil yang didaftarkan manual oleh Admin.
  - Merancang **Industrial Dark Empty State Card** saat direktori mahasiswa masih kosong (`0 Mahasiswa`), lengkap dengan panduan kontekstual dan tombol CTA langsung (`+ Buat Kelas / Kohort` & `+ Tambah Akun Baru`).
  - Pembersihan copywriting dan fallback statis peninggalan legacy enum (`KAMIS`, `JUMAT`, `LOMBA`), beralih ke relasi kohort pembelajaran murni dinamis.
  - Memisahkan test fixture pengujian algoritma (`TEST_MOCK_STUDENTS`) dari runtime produksi, sehingga automated verification suite tetap lulus 100% (304/304 test assertions).
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Data Store Architecture:**
    - [src/lib/seed-data.ts](file:///d:/CP-Arena/src/lib/seed-data.ts):
      - `INITIAL_USERS` dipangkas hanya memuat akun sistem root: `ADMIN` dan `DOSEN001` (0 akun mahasiswa dummy pada runtime produksi).
      - Avatar akun admin dinormalisasi ke monogram inisial profesional `TH` (*anti-AI slop*, menggantikan emoji mahkota).
      - Data 28 mahasiswa dipisahkan dan diekspor sebagai fixture khusus pengujian: `TEST_MOCK_STUDENTS`.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - `getUsers()`: Menambahkan auto-purge satu kali (`cparena_mock_students_purged_v2`) untuk membersihkan 28 NIM mock lama dari `localStorage` browser klien, sekaligus memastikan akun `ADMIN` & `DOSEN001` tetap tersedia.
      - `getCurrentUser()`: Mengamankan pemulihan sesi, otomatis menginvaliasi sesi jika token sesi merujuk pada akun mahasiswa dummy yang telah dibersihkan.
      - `createUser()`: Menghapus fallback statis ke `c-kamis`/`c-jumat`, dan menautkan mahasiswa secara dinamis ke kohort kelas yang dipilih.
      - `resetGlobal()`: Menjamin state pasca-reset mempertahankan status bersih produksi.
  - **UI/UX Designer & Zero-State Industrial UI:**
    - [src/components/admin/tabs/AdminStudentMonitorTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminStudentMonitorTab.tsx):
      - Menghadirkan **Industrial Dark Empty State Card** saat `totalStudentsCount === 0` dengan ikon `GraduationCap`, panduan alur registrasi, serta tombol CTA kontekstual (`+ Buat Kelas / Kohort` dan `+ Tambah Akun Baru`).
      - Menambahkan prompt pencarian/filter reset interaktif saat filter aktif tidak menghasilkan kecocokan.
      - Subheader diperbarui menjadi netral berbasis kelas/kohort dinamis tanpa hardcoded hari Kamis/Jumat.
      - Badge kelas pada tabel mahasiswa kini dinamis mengambil `nama_kelas` dari kohort terdaftar.
      - Dropdown assign kohort pada modal tambah akun kini dinamis mengikuti kode kelas kohort.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Memperbarui Test Group 1 untuk memverifikasi kondisi produksi bersih (`INITIAL_USERS.filter(u => u.role === 'PESERTA').length === 0`) dan memvalidasi integritas test fixture `TEST_MOCK_STUDENTS`.
      - Memperbarui Test Group 5, 11, dan 19 agar menggunakan fixture data untuk pengujian engine tim, scoreboard ICPC, dan peracakan soal anti-cheat.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **304/304 Tests PASS (100%)** via `npx tsx tests/verify-arena-system.mjs`.

---

### Bagian 39: Sistem Ekspor Multi-Sheet Dinamis, Eliminasi Kartu Statis, dan Engine Laporan Akademik (/admin/export)
- **Konteks & Kebutuhan Rekayasa:**
  - Evaluasi halaman Rekapitulasi Nilai & Ekspor Laporan Resmi ([/admin/export](http://localhost:3000/admin/export)) yang sebelumnya masih menggunakan 4 kartu statis peninggalan *prototyping* (`Kelas KAMIS 15 SI`, `Kelas JUMAT 13 TI/SI`, `Kelas LOMBA`, dan `ALL`).
  - Memutakhirkan sistem ekspor agar 100% dinamis terintegrasi dengan kohort buatan Admin (`cohorts.map(...)`) serta menyediakan **Master Summary Report Card** gabungan seluruh kelas.
  - Memisahkan logika transformasi dataset laporan akademik ke dalam service terisolasi ([src/lib/export-service.ts](file:///d:/CP-Arena/src/lib/export-service.ts)) untuk mendukung ekspor multi-sheet `.xlsx` (SheetJS) dan fallback RFC 4180 CSV ber-BOM UTF-8 (`\uFEFF`).
  - Merancang **Zero-State Card** saat belum ada kelas terdaftar dengan panduan kontekstual dan tombol CTA ke pembuatan kohort.
  - Menjaga integritas Zona Bahaya (*Danger Zone*) dengan dialog konfirmasi custom modal portal (`RESET-TIME`).
- **Implementasi Multi-Perspektif:**
  - **Software Engineering & Data Transformation Service:**
    - [src/lib/export-service.ts](file:///d:/CP-Arena/src/lib/export-service.ts):
      - Mendefinisikan interface: `RekapNilaiRow`, `DiagnostikMateriRow`, `LogDetailSubmisiRow`, `AcademicExportPayload`, dan `AcademicExportResult`.
      - Mengimplementasikan `generateAcademicExportData()`: fungsi murni (*pure transformer*) yang memetakan dataset mahasiswa, riwayat submisi, dan game menjadi struktur data 3-Sheet:
        1. **Sheet 1 (`Rekap_Nilai`):** NIM, Nama, Codename, Kelas Kohort, Periode, Prodi, Rata-rata Nilai (0-100), Nilai Terbaik, Total Pindah Tab, Akumulasi Penalti (-5 per switch), Total XP, Level, Tier, dan Status Ketuntasan ($\ge 70 \to \text{TUNTAS}$).
        2. **Sheet 2 (`Diagnostik_Materi`):** Pemetaan serapan kompetensi teknis, level, XP, indikasi akademik (*Sangat Menguasai* / *Cukup* / *Butuh Pengayaan*), dan rekomendasi modul.
        3. **Sheet 3 (`Log_Detail`):** Log presisi detik submisi, jumlah benar/total soal, nilai, penalti tab, dan status kelulusan.
      - Mengimplementasikan `downloadAcademicExport()`: *browser dispatcher* yang menginjeksi SheetJS workbook multi-sheet jika tersedia, atau men-download CSV UTF-8 ber-delimiter titik koma dengan *quote escaping*.
    - [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx):
      - Menghubungkan service ekspor dinamis `handleExportExcel(cohortIdOrCode, cohortName)`.
      - Memasukkan properti `cohorts` dan `onCreateCohortClick` ke `AdminExportTab`.
  - **UI/UX Designer & Anti-AI Slop Interface:**
    - [src/components/admin/tabs/AdminExportTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminExportTab.tsx):
      - Menghilangkan kartu statis Kamis/Jumat dan menggantikannya dengan **Master Report Card** (ALL) lengkap dengan metrik cepat (Total Mahasiswa, Submisi Selesai, Paket Kontes, dan Total Kelas).
      - Menghadirkan **Dynamic Cohort Cards Grid** yang merender kartu ekspor per-kohort dengan counter mahasiswa aktual, log submisi, dan tombol unduh spesifik kelas.
      - Menampilkan **Industrial Zero-State Card** saat belum ada kelas terdaftar dengan panduan dan tombol CTA `+ Buat Kelas / Kohort Baru`.
      - Menata kartu informasi struktur laporan 3-Sheet dengan palet gelap utilitarian (`#070b14`, `#0b1120`, border `#1e293b`).
      - Mempertahankan Zona Bahaya yang aman dengan verifikasi ketik `RESET-TIME` via [src/components/common/ModalPortal.tsx](file:///d:/CP-Arena/src/components/common/ModalPortal.tsx).
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 22 (Multi-Sheet Academic Report & Dynamic Export Engine)** dengan 21 assertions baru:
        - Memverifikasi output ekspor rekap total `ALL` (prefix nama file, keberadaan 3 array sheet, akurasi baris data).
        - Memverifikasi isolasi ekspor per-kohort spesifik (kode file, judul kelas, filter mahasiswa).
        - Memverifikasi kalkulasi nilai akademik, akumulasi penalti tab switch (-5 poin), penetapan status ketuntasan, dan indikasi diagnostik XP.
        - Memverifikasi *cold start resilience* pada kohort kosong (0 mahasiswa, 0 submisi) tetap menghasilkan array valid tanpa *error*.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx tsc --noEmit`.
  - Automated Verification Suite: **325/325 Tests PASS (100%)** via `npx tsx tests/verify-arena-system.mjs`.

---

### Bagian 40: Validasi Submisi Server-Side & Pengerasan Anti-Cheat Integritas Kuis (/api/submissions/quiz)
- **Konteks & Kebutuhan Rekayasa (Opsi C):**
  - Mencegah kebocoran data (*data leakage*) kunci jawaban dan editorial soal pada inspeksi memori client/browser selama sesi kuis berlangsung (`status_sesi === 'ACTIVE'`).
  - Membangun rute server-side dedicated [src/app/api/submissions/quiz/route.ts](file:///d:/CP-Arena/src/app/api/submissions/quiz/route.ts) untuk memproses penilaian per-butir soal secara objektif di server, pencatatan pelanggaran tab switch, dan finalisasi penilaian akhir.
  - Menerapkan penguncian satu kali (*Single-Shot Answer Lock & Replay Prevention*) agar jawaban yang sudah dikirim tidak dapat dimanipulasi atau diulang.
  - Memasang *Anti-Cheat Access Guard* pada modal editorial ([src/components/arena/EditorialModal.tsx](file:///d:/CP-Arena/src/components/arena/EditorialModal.tsx)) untuk mengunci pembahasan hingga sesi kuis benar-benar selesai.
  - Menghilangkan elemen AI Slop yang tersisa: membersihkan ikon `Sparkles` tak terpakai pada [src/components/arena/CodingArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/CodingArenaModal.tsx) dan mengganti native `window.confirm()` pada [src/components/CodeEditor.tsx](file:///d:/CP-Arena/src/components/CodeEditor.tsx) dengan custom `ModalPortal` bergaya Industrial Dark.
- **Implementasi Multi-Perspektif:**
  - **Backend & Security Engineering:**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts):
      - Menambahkan field audit `tab_switch_log?: { timestamp: string; penalty_deducted: number }[]` ke dalam interface `Submission`.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - Memperbarui `getQuestionsForUser(user, gameId, submission)`: Mengamankan array soal dengan menghapus (`undefined`) field `kunci_jawaban` dan `editorial` jika user adalah `PESERTA` dan status sesi belum `DONE`. Kunci jawaban dan editorial secara otomatis dipulihkan setelah sesi selesai (`status_sesi === 'DONE'`) untuk keperluan telaah pasca-ujian. Akun `ADMIN` tetap memiliki akses penuh tanpa restriksi.
      - Memperbarui `recordTabSwitch(submissionId)`: Mencatat log audit forensik dengan timestamp ISO presisi detik dan deduksi penalti 5 poin per pelanggaran, dengan penjagaan nilai minimum ($\ge 0$).
    - [src/app/api/submissions/quiz/route.ts](file:///d:/CP-Arena/src/app/api/submissions/quiz/route.ts):
      - Merancang rute API Next.js App Router `POST /api/submissions/quiz` yang menangani 3 aksi utama:
        1. `action: 'answer'`: Memvalidasi sesi aktif, menerapkan *Single-Shot Lock* (menolak duplikasi/replay dengan HTTP 409 Conflict), mengevaluasi kebenaran jawaban di server, menghitung bonus XP (speed bonus, streak, first blood), dan memperbarui rekaman submisi.
        2. `action: 'tab-switch'`: Mencatat pelanggaran pindah tab di server dan mengurangkan penalti.
        3. `action: 'finish'`: Mengunci sesi menjadi `DONE`, memotong penalti akhir secara deterministik, dan menentukan status kelulusan akademik.
  - **Frontend & UI/UX Engineering:**
    - [src/components/arena/QuizArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/QuizArenaModal.tsx):
      - Mengintegrasikan fungsi pengiriman jawaban (`handleAnswer`), pendeteksian pindah tab (`handleVisibilityChange`), dan penyelesaian ujian (`completeGame`) ke endpoint API server `/api/submissions/quiz` dengan mekanisme *resilient offline fallback* ke `ArenaStore`.
    - [src/components/arena/EditorialModal.tsx](file:///d:/CP-Arena/src/components/arena/EditorialModal.tsx):
      - Menambahkan pengaman anti-curang (*Anti-Cheat Guard*): Jika sesi belum selesai (`status_sesi !== 'DONE'`), dialog langsung menampilkan peringatan bahwa editorial terkunci hingga kuis selesai, mencegah inspeksi kode sumber editorial.
    - [src/components/arena/CodingArenaModal.tsx](file:///d:/CP-Arena/src/components/arena/CodingArenaModal.tsx):
      - Menghapus import ikon `Sparkles` yang tidak digunakan (Zero AI Slop).
    - [src/components/CodeEditor.tsx](file:///d:/CP-Arena/src/components/CodeEditor.tsx):
      - Mengganti pemanggilan `confirm(...)` browser bawaan dengan modal konfirmasi interaktif berbasis `ModalPortal` dengan tema Industrial Dark, typography monospace terarah, dan tombol konfirmasi yang jelas.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 23 (Server-Side Submission Validation & Anti-Cheat Hardening)** dengan 33 assertions:
        - Memverifikasi *zero answer & editorial leakage* pada sesi aktif mahasiswa (`kunci_jawaban: undefined`, `editorial: undefined`).
        - Memverifikasi ketersediaan kunci jawaban dan editorial bagi peran `ADMIN`.
        - Memverifikasi audit log perpindahan tab (`tab_switch_log`) beserta pemotongan penalti.
        - Memverifikasi ketahanan *Single-Shot Answer Lock* terhadap upaya modifikasi jawaban berulang (*replay prevention*).
        - Memverifikasi pemulihan otomatis (*restoration*) kunci jawaban dan editorial saat sesi bertransformasi menjadi `DONE`.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **358/358 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 41: Sinkronisasi Skema Supabase, Model Relasional Dinamis & Clean Production Migration (supabase/schema.sql)
- **Konteks & Kebutuhan Rekayasa (Opsi A):**
  - Menyelaraskan skema database PostgreSQL Supabase ([supabase/schema.sql](file:///d:/CP-Arena/supabase/schema.sql)) dengan seluruh perubahan arsitektur dinamis terbaru (kohort dinamis, skuad snake-draft, audit trail anti-cheat, dan kebijakan clean-slate).
  - Menghilangkan *hardcoding* 28 mahasiswa mock dari seed eksekutif database produksi agar saat `schema.sql` di-deploy ke Supabase, database bersih hanya berisi kredensial root Dosen Pembina / Admin (`ADMIN` & `DOSEN001`) dan template kohort awal.
  - Memisahkan data mock/fixture ke dalam blok terisolasi (*demarcated commented block*) agar tim QA/Developer dapat membukanya hanya saat pengujian lokal/staging tanpa mencemari produksi.
  - Membangun database-level view [student_questions_view](file:///d:/CP-Arena/supabase/schema.sql#L137) untuk mempertegas prinsip *Zero Answer & Editorial Leakage* pada level engine PostgreSQL Supabase.
  - Memastikan seluruh relasi Foreign Key (`teams.id_cohort`, `users.id_cohort`, `submissions.nim`, `cohort_game_access`) dan indeks performa terdefinisi secara rapi dan konsisten.
- **Implementasi Multi-Perspektif:**
  - **Database & Backend Architecture:**
    - [supabase/schema.sql](file:///d:/CP-Arena/supabase/schema.sql):
      - **Tabel `cohorts`:** Menambahkan indeks `idx_cohorts_kode_kelas` dan `idx_cohorts_is_active` serta validasi regex format periode (`CHK chk_periode_format`).
      - **Tabel `teams`:** Menambahkan foreign key `id_cohort VARCHAR(50) REFERENCES public.cohorts(id_cohort) ON DELETE SET NULL`, default `klub_hari = 'ALL'`, indeks `idx_teams_id_cohort`, dan indeks `idx_teams_kode_gabung`.
      - **Tabel `users`:** Menyesuaikan avatar default dengan inisial monogram `'TH'` (Zero AI Slop), indeks `idx_users_id_tim`, dan relasi dinamis ke `cohorts`.
      - **Tabel `games`:** Menambahkan kolom JSONB `cohort_statuses JSONB NOT NULL DEFAULT '{}'::JSONB` untuk pemetaan status akses per-kohort secara instan.
      - **Tabel `submissions`:** Menambahkan kolom `tab_switch_log JSONB NOT NULL DEFAULT '[]'::JSONB` dan `shuffled_question_ids JSONB NOT NULL DEFAULT '[]'::JSONB` untuk sinkronisasi audit forensic anti-cheat.
      - **View `student_questions_view`:** Mengenkapsulasi query soal mahasiswa sehingga kolom sensitif (`kunci_jawaban` dan `editorial`) dihilangkan pada tingkat database.
      - **Row Level Security (RLS):** Mengaktifkan RLS pada seluruh 7 tabel utama dengan konfigurasi public read policies dan service-role write policies.
  - **Clean Slate Data Engineering & Quality Management:**
    - **Seed Produksi Bersih:** Hanya menginisialisasi 2 akun eksekutif (`ADMIN` dan `DOSEN001` - Tarq Hilmar Siregar, S.Kom) dengan monogram `TH`, 3 template kohort awal (`c-kamis`, `c-jumat`, `c-lomba` tanpa ikon slop), serta paket game G1-G7 dan bank soal.
    - **Staging / Test Fixtures Demarcation:** 28 mahasiswa mock dan submisi dummy diisolasi dalam komentar blok berpagar jelas (`/* ... */`) untuk keperluan testing manual jika dibutuhkan.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 24 (Supabase PostgreSQL Schema & Relational Model Integrity)** dengan 26 assertions baru:
        - Memvalidasi keberadaan 7 tabel utama dan 1 view anti-cheat pada file SQL.
        - Memvalidasi keberadaan kolom relasional dinamis (`teams.id_cohort`, `submissions.tab_switch_log`, `submissions.shuffled_question_ids`, `games.cohort_statuses`).
        - Memverifikasi kepatuhan *Zero Leakage* pada definisi view `student_questions_view`.
        - Memverifikasi bahwa seed aktif produksi bersih 100% dari 28 mahasiswa mock (0 dummy data).
        - Memverifikasi pengaktifan RLS pada seluruh tabel.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **384/384 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 42: Alur Onboarding Mahasiswa Baru, First-Login Password Change & Self-Profile Initialization (/api/auth/password)
- **Konteks & Kebutuhan Rekayasa (Opsi B):**
  - Mahasiswa baru yang didaftarkan oleh admin menggunakan kata sandi bawaan yang identik dengan NIM (`password === nim`). Kondisi ini menimbulkan kerentanan keamanan di mana mahasiswa lain dapat mengakses akun rekannya jika mengetahui NIM terdaftar.
  - Membangun alur onboarding wajib perdana (*First-Login Mandatory Security Onboarding*) yang memaksa mahasiswa memperbarui kata sandi sebelum dapat mengakses dashboard, katalog kuis, maupun scoreboard ICPC.
  - Menerapkan aturan pengerasan kata sandi (*password hardening*): minimal 6 karakter dan dilarang menggunakan NIM sebagai kata sandi baru.
  - Memperbarui sistem autentikasi [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts) agar kata sandi lama (NIM) otomatis ditolak setelah berhasil diperbarui.
  - Menghilangkan seluruh elemen AI Slop: antarmuka dirancang murni bertema Industrial Dark, checklist keamanan real-time berbasis teks monospace, dan menggunakan inisial monogram resmi STMIK TIME tanpa kartun/emoji/efek neon.
- **Implementasi Multi-Perspektif:**
  - **Backend & Security Engineering:**
    - [src/types/arena.ts](file:///d:/CP-Arena/src/types/arena.ts):
      - Menambahkan field `is_first_login?: boolean` dan `password_changed_at?: string` ke dalam interface `User`.
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - Menambahkan metode `changePassword(nim, oldPass, newPass)`: memvalidasi kecocokan kata sandi lama, memvalidasi aturan $\ge 6$ karakter dan $\ne \text{NIM}$, memperbarui kata sandi, dan mencatat timestamp ISO.
      - Menambahkan metode `completeOnboarding({ nim, newPassword, codename, avatar })`: merangkum pembaruan kata sandi perdana dan kustomisasi identitas kompetisi dalam 1 transaksi atomik.
      - Memperbarui metode `login(nim, pass)`: mengembalikan flag `requiresOnboarding` jika pengguna adalah `PESERTA` dan kata sandi masih default / `is_first_login !== false`, serta menolak penggunaan NIM sebagai kata sandi setelah akun diperbarui.
    - [src/app/api/auth/password/route.ts](file:///d:/CP-Arena/src/app/api/auth/password/route.ts):
      - Rute server-side Next.js App Router `POST /api/auth/password` untuk menangani aksi `change` dan `onboarding` dengan sanitasi input ketat dan error handling terstruktur.
  - **Frontend & UI/UX Engineering (Zero AI Slop):**
    - [src/components/arena/FirstLoginOnboardingModal.tsx](file:///d:/CP-Arena/src/components/arena/FirstLoginOnboardingModal.tsx):
      - Komponen modal onboarding wajib berbasis [src/components/common/ModalPortal.tsx](file:///d:/CP-Arena/src/components/common/ModalPortal.tsx).
      - Backdrop modal tidak dapat ditutup paksa sebelum prosedur ganti kata sandi selesai.
      - Menampilkan kartu ringkasan identitas terdaftar (NIM, Nama Lengkap, Kohort).
      - Menghadirkan checklist keamanan real-time bergaya utilitarian: minimal 6 karakter, tidak sama dengan NIM, dan konfirmasi kata sandi cocok.
      - Pilihan kustomisasi contest handle / codename dengan monogram avatar resmi.
    - [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx):
      - Memasang deteksi otomatis saat inisialisasi sesi mahasiswa: jika `currentUser.is_first_login !== false` atau kata sandi masih sama dengan NIM, modal onboarding langsung dimunculkan.
    - [src/components/arena/ProfileTab.tsx](file:///d:/CP-Arena/src/components/arena/ProfileTab.tsx):
      - Menambahkan Bagian 5: "Keamanan Akun & Perbarui Kata Sandi" agar mahasiswa dapat mengganti kata sandi kapan saja secara mandiri melalui tab profil.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 25 (Student Onboarding, First-Login Guard & Password Change Security)** dengan 24 assertions:
        - Memverifikasi status `is_first_login === true` pada mahasiswa baru.
        - Memverifikasi deteksi `requiresOnboarding === true` saat login perdana.
        - Memverifikasi penolakan kata sandi pendek (< 6 karakter), kata sandi sama dengan NIM, dan kata sandi lama yang salah.
        - Memverifikasi penolakan login menggunakan NIM lama setelah ganti kata sandi.
        - Memverifikasi keberhasilan login dengan kata sandi baru dan transisi `requiresOnboarding === false`.
        - Memverifikasi fungsi `completeOnboarding` atomik.
        - Memverifikasi kekebalan peran `ADMIN` dari alur onboarding mahasiswa.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **408/408 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 43: Integrasi Persistensi Supabase Live, Repository Layer & Multi-Device State Sync (/api/arena/sync)
- **Konteks & Kebutuhan Rekayasa (Opsi 1):**
  - Mengubah aplikasi dari penyimpanan lokal tunggal (`localStorage`) menjadi arsitektur **Multi-Device Live Persistence** yang terhubung langsung ke PostgreSQL Supabase, dengan *resilient offline/local fallback* saat kredensial belum dikonfigurasi.
  - Memastikan seluruh aksi CRUD Admin (pembuatan kohort, pendaftaran mahasiswa, paket game, soal, tim snake-draft) dan aksi Mahasiswa (login, onboarding ganti sandi, submisi kuis, penalti tab switch) langsung tersinkronisasi lintas perangkat secara konsisten.
  - Melindungi keamanan data saat hidrasi state mahasiswa (`Zero Password Exposure` dan `Zero Answer Leakage`).
- **Implementasi Multi-Perspektif:**
  - **Database & Schema Alignment:**
    - [supabase/schema.sql](file:///d:/CP-Arena/supabase/schema.sql):
      - Menambahkan kolom `allowed_game_ids JSONB NOT NULL DEFAULT '[]'::JSONB` pada tabel `cohorts`.
      - Menambahkan kolom `is_first_login BOOLEAN NOT NULL DEFAULT TRUE` dan `password_changed_at TIMESTAMPTZ` pada tabel `users` (dengan nilai eksplisit `FALSE` untuk akun root `ADMIN` dan `DOSEN001`).
  - **Backend & Repository Engineering:**
    - [src/lib/supabase/admin.ts](file:///d:/CP-Arena/src/lib/supabase/admin.ts):
      - Utilitas `isSupabaseConfigured()` (deteksi aman terhadap placeholder URL/key) dan singleton server-side client `getSupabaseAdmin()` berbasis `SUPABASE_SERVICE_ROLE_KEY`.
    - [src/lib/supabase/repository.ts](file:///d:/CP-Arena/src/lib/supabase/repository.ts):
      - Pure Row Mappers dua arah (`toDb*Row` / `fromDb*Row`) untuk 6 entitas utama dengan sanitasi foreign key PostgreSQL (`"" -> null`) serta perlindungan agar sync client tidak menimpa password asli atau kunci jawaban di database.
      - Fungsi `sanitizeDatasetForStudent()` yang men-strip seluruh password user dan men-strip `kunci_jawaban` + `editorial` untuk game yang belum berstatus `DONE`.
      - Kelas `SupabaseArenaRepo` yang menangani `fetchAllState`, diff-aware `sync*` (upsert + delete), `authenticateUser`, `updateUserCredentials`, dan transaksi submisi kuis.
    - [src/app/api/arena/sync/route.ts](file:///d:/CP-Arena/src/app/api/arena/sync/route.ts):
      - Endpoint REST `GET /api/arena/sync` (hidrasi state live) dan `POST /api/arena/sync` (write-through persistensi per-entitas).
    - [src/app/api/auth/login/route.ts](file:///d:/CP-Arena/src/app/api/auth/login/route.ts), [src/app/api/auth/password/route.ts](file:///d:/CP-Arena/src/app/api/auth/password/route.ts), & [src/app/api/submissions/quiz/route.ts](file:///d:/CP-Arena/src/app/api/submissions/quiz/route.ts):
      - Seluruh endpoint ditingkatkan agar membaca/menulis langsung ke Supabase PostgreSQL saat terkonfigurasi, dengan fallback mulus ke `ArenaStore` lokal saat mode offline.
  - **Frontend State Synchronization:**
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - Menambahkan `hydrateFromServer()`, `getSyncStatus()`, dan non-blocking write-through dispatcher `pushEntityToServer()` pada seluruh mutasi penyimpanan.
    - [src/app/login/page.tsx](file:///d:/CP-Arena/src/app/login/page.tsx), [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx), [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx), [src/components/arena/FirstLoginOnboardingModal.tsx](file:///d:/CP-Arena/src/components/arena/FirstLoginOnboardingModal.tsx), & [src/components/arena/ProfileTab.tsx](file:///d:/CP-Arena/src/components/arena/ProfileTab.tsx):
      - Menghubungkan autentikasi live, hidrasi otomatis saat mount & refresh, serta perbaikan guard onboarding agar tetap akurat saat password di-strip demi keamanan.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 26 (Supabase Live Persistence, Row Mappers & Multi-Device Sync Safety)** dengan 28 assertions baru mencakup deteksi env, validasi kolom baru di SQL, round-trip seluruh row mapper, sanitasi FK `null`, proteksi password eksisting, serta sanitasi anti-leakage payload mahasiswa.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **436/436 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 44: Security Auth Hardening — Salted scrypt Password Hashing, Signed HttpOnly Session Cookie & Server-Side RBAC Middleware (Opsi 2)
- **Konteks & Kebutuhan Rekayasa (Opsi 2):**
  - Menutup total celah keamanan produksi yang teridentifikasi pada uji live Supabase:
    1. Password sebelumnya disimpan dan dapat terbaca plain-text jika endpoint sinkronisasi diakses langsung.
    2. Endpoint `/api/arena/sync` sebelumnya menerima parameter query `?role=ADMIN` dari client tanpa verifikasi sesi kriptografis.
    3. Proteksi rute `/admin/*` sebelumnya hanya dijalankan di sisi client (`useEffect`), bukan di level server middleware.
  - Menjamin kompatibilitas mulus dengan akun eksisting di Supabase (`ADMIN` & `2244090`) melalui mekanisme *lazy migration* otomatis saat login pertama.
- **Implementasi Multi-Perspektif:**
  - **Cryptography & Session Engineering:**
    - [src/lib/security/password.ts](file:///d:/CP-Arena/src/lib/security/password.ts):
      - `hashPassword()`: Enkripsi kata sandi menggunakan `crypto.scryptSync` dengan 16-byte random salt per akun (`scrypt$<salt>$<key>`).
      - `verifyPassword()`: Pembandingan konstan-waktu (`crypto.timingSafeEqual`) untuk mencegah *timing attack*, sekaligus mendeteksi akun legacy plain-text (`needsRehash: true`) agar di-upgrade otomatis di PostgreSQL saat login berhasil.
    - [src/lib/security/session.ts](file:///d:/CP-Arena/src/lib/security/session.ts):
      - `signSessionToken()` & `verifySessionToken()`: Token sesi bertanda tangan **HMAC-SHA256** berbasis Web Crypto API (`crypto.subtle`) sehingga kompatibel penuh di **Next.js Edge Middleware** maupun **Node.js API Routes**.
      - Cookie `cp_arena_session` dengan flag ketat `httpOnly: true`, `sameSite: 'lax'`, dan `secure` pada lingkungan produksi.
  - **Server-Side RBAC & API Protection:**
    - [src/middleware.ts](file:///d:/CP-Arena/src/middleware.ts):
      - Middleware Edge untuk rute `/admin/:path*` dan `/mahasiswa/:path*`: menolak akses tanpa sesi `HttpOnly` valid pada mode Supabase Live (redirect ke `/login?reason=auth_required`) serta mengalihkan `PESERTA` yang mencoba menembus `/admin/*` langsung ke `/mahasiswa/dashboard`.
    - [src/app/api/auth/login/route.ts](file:///d:/CP-Arena/src/app/api/auth/login/route.ts), [src/app/api/auth/logout/route.ts](file:///d:/CP-Arena/src/app/api/auth/logout/route.ts), & [src/app/api/auth/session/route.ts](file:///d:/CP-Arena/src/app/api/auth/session/route.ts):
      - Manajemen siklus penuh cookie `HttpOnly` (`cp_arena_session`) dan pembersihan otomatis cookie legacy `cp_arena_user`.
    - [src/app/api/arena/sync/route.ts](file:///d:/CP-Arena/src/app/api/arena/sync/route.ts):
      - Mengabaikan total parameter `?role=` dari URL; menolak akses tanpa sesi (`401 Unauthorized`); menerapkan RBAC ketat per-entitas (entitas `cohorts`, `games`, `questions`, `reset-all` terkunci khusus `ADMIN` dengan `403 Forbidden`, sementara `PESERTA` hanya dapat memperbarui profil/tim/submisi miliknya secara non-destruktif).
    - [src/app/api/auth/password/route.ts](file:///d:/CP-Arena/src/app/api/auth/password/route.ts) & [src/app/api/submissions/quiz/route.ts](file:///d:/CP-Arena/src/app/api/submissions/quiz/route.ts):
      - Verifikasi kepemilikan sesi (*horizontal privilege escalation guard*) sehingga mahasiswa tidak dapat mengubah kata sandi atau memanipulasi submisi mahasiswa lain.
    - [src/lib/supabase/repository.ts](file:///d:/CP-Arena/src/lib/supabase/repository.ts):
      - Auto-hashing pada `toDbUserRow()`, lazy-upgrade pada `authenticateUser()`, dan strip total field `password` pada `fetchAllState()` (Zero Password Exposure untuk semua role termasuk `ADMIN`).
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 27 (Security Auth Hardening)** dengan 21 assertions baru (salted scrypt hashing, lazy migration, anti-tampering role spoofing token, expired token rejection, HttpOnly cookie flags, serta keberadaan middleware & anti-spoofing sync route).
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **457/457 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 45: Efisiensi Operasional Dosen — Bulk Import Mahasiswa (CSV/Excel) & Admin Password Reset (Opsi 3)
- **Konteks & Kebutuhan Rekayasa (Opsi 3):**
  - Mempercepat pendaftaran massal puluhan hingga ratusan mahasiswa per semester dari berkas CSV maupun spreadsheet Excel (`.xlsx`/`.xls`) atau tempel langsung (*paste*) dari SIAKAD/Excel tanpa perlu input manual satu per satu.
  - Menyediakan fitur **"Reset Sandi ke NIM"** bagi dosen/admin untuk membantu mahasiswa yang lupa kata sandi pribadinya pasca-onboarding, dengan otorisasi ketat khusus `ADMIN` dan dialog konfirmasi Industrial Dark (Zero AI Slop).
- **Implementasi Multi-Perspektif:**
  - **Software Engineering (Pure Parser & Validation Service):**
    - [src/lib/student-import-service.ts](file:///d:/CP-Arena/src/lib/student-import-service.ts):
      - `detectCsvDelimiter()` & `parseRawCsvText()`: Mendukung otomatis delimiter koma (`,`) dan titik koma (`;` Excel Indonesia), pembersihan UTF-8 BOM (`\uFEFF`), serta parsing RFC 4180 field berkoma dalam tanda kutip.
      - `validateImportedStudentRows()`: Memvalidasi setiap baris secara terperinci (deteksi kolom wajib kosong, format NIM, duplikat NIM internal dalam file, serta NIM yang sudah terdaftar di database).
      - `buildBulkCreateUserDTOs()` & `downloadStudentImportTemplate()`: Konversi baris valid ke DTO batch terikat kohort tujuan, plus generator template `.csv` resmi ber-BOM UTF-8.
  - **Backend & Persistence Engineering:**
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts):
      - Menambahkan `bulkCreateUsers(dtos)`: Pendaftaran atomik 1x write-through sync ke `localStorage` dan Supabase PostgreSQL dengan monogram inisial otomatis dan `is_first_login: true`.
      - Menambahkan `adminResetPassword(nim)`: Mengembalikan kata sandi mahasiswa ke NIM dan memicu ulang wajib onboarding saat login berikutnya.
    - [src/lib/supabase/repository.ts](file:///d:/CP-Arena/src/lib/supabase/repository.ts) & [src/app/api/auth/password/route.ts](file:///d:/CP-Arena/src/app/api/auth/password/route.ts):
      - Menambahkan `SupabaseArenaRepo.adminResetUserPassword(nim)` dan aksi `action: 'admin-reset'` yang terkunci ketat khusus sesi `ADMIN` (`403 Forbidden` untuk non-admin), langsung meng-hash ulang NIM via `scrypt` di PostgreSQL.
  - **Frontend & UI/UX Designer (Zero AI Slop):**
    - [src/components/admin/modals/BulkImportStudentsModal.tsx](file:///d:/CP-Arena/src/components/admin/modals/BulkImportStudentsModal.tsx):
      - Modal Industrial Dark berbasis `ModalPortal` dengan pemilih kohort tujuan, tombol unduh template CSV, tab **Unggah File (`.csv`/`.xlsx`)** dan **Tempel Teks CSV**, 4 KPI ringkasan validasi, serta tabel pratinjau per-baris sebelum eksekusi impor.
    - [src/components/admin/tabs/AdminStudentMonitorTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminStudentMonitorTab.tsx) & [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx):
      - Menambahkan tombol `Import CSV / Excel` pada toolbar utama, menyinkronkan `cohorts` dari hidrasi Supabase, menghapus sisa native `confirm()` pada `handleResetStudent`, serta menambahkan tombol `Reset Sandi ke NIM` lengkap dengan dialog konfirmasi khusus pada modal kelola mahasiswa.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs):
      - Menambahkan **Test Group 28 (Bulk Student Import & Admin Password Reset)** dengan 27 assertions baru (deteksi delimiter, BOM & RFC 4180 quotes, deteksi duplikat internal & DB, eksekusi atomik `bulkCreateUsers`, idempotensi anti-duplikat, reset password Admin + pemicu ulang onboarding, template CSV, dan proteksi RBAC `admin-reset`).
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **484/484 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 46: Production Build Audit (`next build`), HTTP Security Headers & Vercel Deployment Readiness (Opsi 4)
- **Konteks & Kebutuhan Rekayasa (Opsi 4):**
  - Memastikan seluruh rute App Router, API Endpoints, dan Edge Middleware terkompilasi bersih untuk produksi (`next build`) dengan 0 error TypeScript, 0 error ESLint, dan 0 error prerendering.
  - Menambahkan HTTP Security Headers produksi dan membersihkan sisa secret key pada `.env.example` demi kesiapan rilis ke Vercel.
- **Implementasi & Audit:**
  - **[next.config.mjs](file:///d:/CP-Arena/next.config.mjs):**
    - Menonaktifkan `X-Powered-By` (`poweredByHeader: false`).
    - Mengonfigurasi HTTP Security Headers global: `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - **[.env.example](file:///d:/CP-Arena/.env.example):**
    - Menyertakan `SESSION_SECRET` dan mengganti kunci contoh reCAPTCHA dengan placeholder aman.
  - **Hasil Production Build (`npx.cmd next build`):**
    - Compiled successfully in `7.9s` (Next.js `15.5.29`).
    - Linting & Type Validation: **0 Error**.
    - Static Prerendering: **19/19 halaman PASS**.
    - Edge Middleware (`src/middleware.ts`): **34.7 kB (Clean)**.
    - Seluruh 7 API Routes (`/api/arena/sync`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/password`, `/api/auth/session`, `/api/auth/verify-recaptcha`, `/api/submissions`, `/api/submissions/quiz`) terkompilasi bersih.
- **Hasil Verifikasi Mutu (QA):**
  - Production Build: **PASS (Exit Code 0)** via `npx.cmd next build`.
  - Automated Verification Suite: **484/484 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.

---

### Bagian 47: Post-Deploy Hardening (Branch `fix/post-deploy-issues`) — Single-Click Login, Race-Free Onboarding, Dynamic Edit Kelas & Strict Cohort Game Isolation
- **Konteks & Daftar 4 Temuan Uji Produksi:**
  1. Login kadang memerlukan 2x klik karena Next.js Router Cache memutar ulang redirect lama dari middleware sebelum cookie `HttpOnly` aktif.
  2. Modal onboarding ganti sandi mahasiswa sempat macet di state `"Menyimpan Kredensial..."` hingga browser di-refresh akibat race condition hidrasi + hilangnya blok `finally` & properti `mode` pada respons error API.
  3. Belum tersedia tombol **Edit Kelas / Kohort**, serta modal Buat Kelas masih memuat 7 paket soal hardcode (`ALL_GAME_PACKAGES` G1–G7) meski database masih memiliki 0 paket soal.
  4. Portal mahasiswa masih menampilkan `"Kelas ALL"` (karena membaca `klub_hari` alih-alih `id_cohort`) dan paket soal lintas kelas belum terisolasi ketat pada lapisan server & UI.
- **Implementasi Multi-Perspektif:**
  - **Fix 1 (Auth Redirect & Middleware Caching):**
    - [src/middleware.ts](file:///d:/CP-Arena/src/middleware.ts): Menambahkan header `Cache-Control: no-store, no-cache, must-revalidate` pada semua respons redirect middleware.
    - [src/app/login/page.tsx](file:///d:/CP-Arena/src/app/login/page.tsx): Menambahkan timeout 3 detik untuk reCAPTCHA v3, menyertakan `credentials: 'same-origin'`, dan menggunakan hard navigation `window.location.assign(...)` pasca-login agar cookie `HttpOnly` langsung dikirim pada request segar tanpa bentrok Router Cache.
  - **Fix 2 (Race-Free Onboarding Dismissal):**
    - [src/app/api/auth/password/route.ts](file:///d:/CP-Arena/src/app/api/auth/password/route.ts): Memastikan seluruh respons error mode live menyertakan `mode: 'supabase'`.
    - [src/components/arena/FirstLoginOnboardingModal.tsx](file:///d:/CP-Arena/src/components/arena/FirstLoginOnboardingModal.tsx) & [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx): Menambahkan `credentials: 'same-origin'`, `finally { setIsSubmitting(false) }`, `ArenaStore.markLocalUserOnboarded()`, guard `onboardingCompletedRef` agar hidrasi latar belakang tidak membuka ulang modal, serta banner notifikasi sukses seketika.
  - **Fix 3 (Dynamic Edit Kelas & Zero Hardcode G1–G7):**
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): Menghapus fallback hardcode `['G1'..'G7']` pada `createCohort()`, meningkatkan `updateCohort()` (validasi unik kode kelas & sinkronisasi periode mahasiswa).
    - [src/components/admin/tabs/AdminStudentMonitorTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminStudentMonitorTab.tsx): Menghapus konstanta `ALL_GAME_PACKAGES`, menampilkan daftar paket soal 100% dinamis dari database (plus pesan netral bila 0 paket soal), serta menambahkan tombol **Edit Kelas** (ikon pensil) dan opsi **Hapus Kelas** di modal kelas.
  - **Fix 4 (Strict Cohort Game Isolation & Zero `"Kelas ALL"`):**
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): Menambahkan `resolveUserCohortName()` dan `getGamesForUser()`, serta memperluas `getLeaderboardPlayers()` agar mendukung `id_cohort` dinamis.
    - [src/lib/supabase/repository.ts](file:///d:/CP-Arena/src/lib/supabase/repository.ts): Memperketat `sanitizeDatasetForStudent()` agar server `/api/arena/sync` hanya mengirim `games` dan `questions` milik kelas/kohort mahasiswa tersebut (0% kebocoran lintas kelas).
    - [DashboardOverviewView.tsx](file:///d:/CP-Arena/src/components/arena/DashboardOverviewView.tsx), [GameCatalogGrid.tsx](file:///d:/CP-Arena/src/components/arena/GameCatalogGrid.tsx), [ProfileTab.tsx](file:///d:/CP-Arena/src/components/arena/ProfileTab.tsx), [StudentSidebar.tsx](file:///d:/CP-Arena/src/components/arena/StudentSidebar.tsx), [SubmissionsHistoryTab.tsx](file:///d:/CP-Arena/src/components/arena/SubmissionsHistoryTab.tsx), & [TeamBattleTab.tsx](file:///d:/CP-Arena/src/components/arena/TeamBattleTab.tsx): Seluruh label kelas kini merujuk ke `resolveUserCohortName()` (Zero `"Kelas ALL"`) dan katalog/submisi/tim terisolasi ketat per kohort.
  - **Quality Assurance & Control (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs): Menambahkan **Test Group 29** dengan 24 assertions baru mencakup seluruh 4 perbaikan produksi.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **508/508 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.
  - Production Build: **PASS (Exit Code 0)** via `npx.cmd next build`.

---

### Bagian 48: Post-Deploy Hardening Putaran 2 (Branch `fix/post-deploy-issues`) — SSOT Strict Unassignment, Zero Unassigned Leak & New-Account Single-Click Login
- **Konteks & Akar Masalah (Root Causes):**
  1. **Login Akun Baru Terasa Refresh (Butuh 2x Submit):**
     - Di [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts), `getCurrentUser()` sebelumnya menghapus `CURRENT_USER` dari `localStorage` jika `nim` belum ada di cache lokal `cp_arena_users`. Akibatnya, saat akun baru pertama kali login di browser baru, `hydrateFromServer()` memanggil `getCurrentUser()` sebelum fetch `users` selesai sehingga `CURRENT_USER` terhapus, lalu dashboard langsung me-redirect balik ke `/login` (baru berhasil pada klik kedua setelah `cp_arena_users` terisi).
     - Ditambah *race condition* antara `useEffect` `/api/auth/session` di `/login`, `logout()` *fire-and-forget* tanpa `await`, dan container dashboard yang tidak memulihkan sesi dari `HttpOnly` cookie saat `localStorage` kosong.
  2. **Kebocoran Paket Soal Belum Ditugaskan & Gagal Unassign:**
     - `ArenaStore.createGame()` sebelumnya melakukan fallback ke **seluruh kelas** saat `allowed_cohort_ids` kosong (`[]`), dan modal Buat Paket di `AdminContestControlTab` otomatis mencentang seluruh kelas.
     - Saat unassign melalui `updateGame()` atau `updateCohort()`, key kelas pada `game.cohort_statuses` tidak ikut dipangkas, sementara `isGameAllowedForUser()` dan `sanitizeDatasetForStudent()` masih mengevaluasi `allowedByCohort || allowedByStatusMap`, sehingga paket yang sudah di-unassign tetap terlihat selamanya.
- **Implementasi Perbaikan:**
  - **Single Source of Truth (`cohort.allowed_game_ids`) & Pruning Dua Arah:**
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): Menghapus fallback semua kelas pada `createGame()` (kosong = Draft / 0 kelas), menghapus kondisi `|| allowedByStatusMap` pada `isGameAllowedForUser()`, menambahkan pemangkasan key `cohort_statuses` secara sinkron pada `updateGame()` dan `updateCohort()`, membatasi `freezeCohort()`/`unfreezeCohort()` hanya pada game yang diizinkan, serta menyelaraskan `getUserStats()` ke `getGamesForUser()` & `resolveUserCohortName()`.
    - [src/lib/supabase/repository.ts](file:///d:/CP-Arena/src/lib/supabase/repository.ts): Menghapus `|| byStatusMap` di `sanitizeDatasetForStudent()` sehingga isolasi server 100% mengikuti `cohort.allowed_game_ids` (termasuk memblokir baris legacy dengan `cohort_statuses` usang).
    - [src/components/admin/tabs/AdminContestControlTab.tsx](file:///d:/CP-Arena/src/components/admin/tabs/AdminContestControlTab.tsx): Default modal buat paket diubah ke `[]` (Draft / 0 kelas), menambah badge `"Draft (0 Kelas)"`, memperbaiki kalkulasi badge jumlah `OPEN`/`FROZEN` per kelas, dan menghapus `animate-pulse` (Zero AI Slop).
  - **New-Account Single-Click Login & Session Recovery:**
    - [src/lib/arena-store.ts](file:///d:/CP-Arena/src/lib/arena-store.ts): Memperbaiki `getCurrentUser()` agar tidak menghapus sesi akun baru sebelum `cp_arena_users` terhidrasi, menambahkan `flushPendingSync()`, `credentials: 'same-origin'` pada write-through sync, `hydrateFromServer({ nim })` recovery, serta `async logout()` yang menunggu pending sync + `/api/auth/logout` selesai.
    - [src/app/login/page.tsx](file:///d:/CP-Arena/src/app/login/page.tsx): Menambahkan `AbortController` + `isSubmittingRef` agar respons `401` tertunda dari `useEffect` tidak pernah menghapus sesi login baru.
    - [src/components/admin/AdminCommandCenterContainer.tsx](file:///d:/CP-Arena/src/components/admin/AdminCommandCenterContainer.tsx) & [src/components/arena/MahasiswaArenaContainer.tsx](file:///d:/CP-Arena/src/components/arena/MahasiswaArenaContainer.tsx): Menambahkan pemulihan otomatis dari `/api/auth/session` + `hydrateFromServer()` sebelum redirect ke `/login`, serta `await ArenaStore.logout()` saat keluar.
  - **Quality Assurance (QA/QC):**
    - [tests/verify-arena-system.mjs](file:///d:/CP-Arena/tests/verify-arena-system.mjs): Menambahkan **Test Group 30** (23 assertions baru) memverifikasi zero-leak paket Draft, siklus Assign -> Unassign via `updateGame` & `updateCohort`, pemblokiran legacy `cohort_statuses`, ketahanan sesi akun baru di `getCurrentUser()`, serta guard UI/container.
- **Hasil Verifikasi Mutu (QA):**
  - TypeScript Compilation: **0 Error (Clean)** via `npx.cmd tsc --noEmit`.
  - Automated Verification Suite: **531/531 Tests PASS (100%)** via `npx.cmd tsx tests/verify-arena-system.mjs`.
  - Production Build: **PASS (Exit Code 0)** via `npx.cmd next build`.
