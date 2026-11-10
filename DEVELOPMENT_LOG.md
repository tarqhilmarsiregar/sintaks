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
