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
