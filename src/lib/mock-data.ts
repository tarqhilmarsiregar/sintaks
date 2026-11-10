import { Contest, Problem, UserProfile, Submission, ScoreboardParticipant } from '@/types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr-001',
    nim: '230101001',
    full_name: 'Budi Santoso',
    role: 'student',
    class_group: 'Teknik Informatika 2024-A',
    rating: 1540,
    solved_count: 24,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-002',
    nim: '230101002',
    full_name: 'Siti Rahmawati',
    role: 'student',
    class_group: 'Teknik Informatika 2024-A',
    rating: 1680,
    solved_count: 31,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-003',
    nim: '230101003',
    full_name: 'Ahmad Fauzi',
    role: 'student',
    class_group: 'Sistem Informasi 2024-B',
    rating: 1420,
    solved_count: 18,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-004',
    nim: '230101004',
    full_name: 'Dewi Lestari',
    role: 'student',
    class_group: 'Ilmu Komputer 2024',
    rating: 1750,
    solved_count: 42,
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-dosen',
    nim: 'DOSEN001',
    full_name: 'Dr. Ir. Alan Turing, M.Kom.',
    role: 'lecturer',
    class_group: 'Dosen Pembina CP & Algoritma',
    rating: 2400,
    solved_count: 150,
    created_at: '2026-08-01T08:00:00Z',
  },
];

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'prob-001',
    contest_id: 'contest-pam-2026',
    title: 'Penjumlahan Dua Bilangan Prima',
    slug: 'penjumlahan-dua-bilangan-prima',
    order_letter: 'A',
    statement_md: `Diberikan sebuah bilangan bulat genap $N$ yang lebih besar dari $2$. 

Berdasarkan **Hipotesis Goldbach**, setiap bilangan genap yang lebih besar dari 2 dapat dinyatakan sebagai penjumlahan dari dua bilangan prima.

Tugas Anda adalah menemukan dua bilangan prima $P_1$ dan $P_2$ sedemikian sehingga:
1. $P_1 + P_2 = N$
2. $P_1 \\le P_2$
3. Selisih $|P_2 - P_1|$ adalah **seminimal mungkin**.

Jika terdapat beberapa pasangan prima yang memenuhi, pilihlah pasangan yang memiliki selisih paling kecil.`,
    input_format: `Baris pertama berisi sebuah bilangan bulat $T$ ($1 \\le T \\le 100$) yang menyatakan jumlah kasus uji.
Setiap $T$ baris berikutnya berisi satu buah bilangan bulat genap $N$.`,
    output_format: `Untuk setiap kasus uji, cetak dua buah bilangan prima $P_1$ dan $P_2$ yang dipisahkan oleh satu spasi pada baris terpisah.`,
    constraints: `* $1 \\le T \\le 100$
* $4 \\le N \\le 10^6$
* $N$ dijamin merupakan bilangan genap positif`,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    difficulty: 'Easy',
    tags: ['Math', 'Number Theory', 'Sieve of Eratosthenes'],
    is_published: true,
    created_at: '2026-11-01T10:00:00Z',
    sample_test_cases: [
      {
        id: 'tc-001',
        problem_id: 'prob-001',
        input_data: `2\n10\n16`,
        expected_output: `5 5\n5 11`,
        explanation: 'Untuk N=10, pasangan primanya (3, 7) selisih 4, dan (5, 5) selisih 0. Maka dipilih 5 5.\nUntuk N=16, pasangan primanya (3, 13) selisih 10, dan (5, 11) selisih 6. Maka dipilih 5 11.',
        is_sample: true,
        points: 20,
      },
      {
        id: 'tc-002',
        problem_id: 'prob-001',
        input_data: `1\n4`,
        expected_output: `2 2`,
        explanation: 'Satu-satunya kemungkinan: 2 + 2 = 4.',
        is_sample: true,
        points: 20,
      },
    ],
  },
  {
    id: 'prob-002',
    contest_id: 'contest-pam-2026',
    title: 'Rotasi Matriks Spiral Terbalik',
    slug: 'rotasi-matriks-spiral-terbalik',
    order_letter: 'B',
    statement_md: `Diberikan sebuah matriks berukuran $M \\times N$. 

Anda diminta untuk menelusuri elemen-elemen matriks tersebut dalam pola spiral searah jarum jam:
* Dimulai dari elemen kiri-atas $(1,1)$, bergerak ke kanan hingga pojok kanan atas,
* Lalu bergerak ke bawah hingga pojok kanan bawah,
* Lalu bergerak ke kiri hingga pojok kiri bawah,
* Lalu bergerak ke atas, dan terus berputar ke arah dalam.

Setelah urutan spiral didapatkan, **cetak seluruh elemen tersebut dalam urutan terbalik** (dari elemen spiral paling dalam hingga elemen $(1,1)$).`,
    input_format: `Baris pertama berisi dua buah bilangan bulat $M$ dan $N$ yang menyatakan jumlah baris dan kolom.
$M$ baris berikutnya masing-masing berisi $N$ bilangan bulat yang dipisahkan spasi.`,
    output_format: `Cetak satu baris berisi $(M \\times N)$ bilangan bulat yang dipisahkan spasi, yang menyatakan urutan spiral yang telah dibalik.`,
    constraints: `* $1 \\le M, N \\le 500$
* $-10^9 \\le A_{i,j} \\le 10^9$`,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    difficulty: 'Medium',
    tags: ['Matrix', 'Simulation', 'Implementation'],
    is_published: true,
    created_at: '2026-11-01T10:00:00Z',
    sample_test_cases: [
      {
        id: 'tc-003',
        problem_id: 'prob-002',
        input_data: `3 3\n1 2 3\n4 5 6\n7 8 9`,
        expected_output: `5 4 7 8 9 6 3 2 1`,
        explanation: 'Urutan spiral searah jarum jam adalah: 1, 2, 3, 6, 9, 8, 7, 4, 5. Hasil pembalikannya adalah 5 4 7 8 9 6 3 2 1.',
        is_sample: true,
        points: 30,
      },
    ],
  },
  {
    id: 'prob-003',
    contest_id: 'contest-pam-2026',
    title: 'Jalur Terpendek Gedung Kampus',
    slug: 'jalur-terpendek-gedung-kampus',
    order_letter: 'C',
    statement_md: `Kampus memiliki $V$ gedung perkuliahan (bernomor $1$ sampai $V$) dan $E$ ruas jalan dua arah. Masing-masing ruas jalan menghubungkan gedung $u$ dan gedung $v$ dengan jarak $w$ meter.

Mahasiswa ingin berjalan dari gedung awal $S$ ke gedung tujuan $D$ dengan jarak tempuh sesingkat mungkin.

Namun karena sedang ada pameran karya rekayasa mahasiswa, terdapat $K$ jalan yang ditutup sementara dan tidak dapat dilewati sama sekali. Carilah panjang rute terpendek yang aman dilalui!`,
    input_format: `Baris pertama berisi empat bilangan bulat $V, E, S, D$.
$E$ baris berikutnya masing-masing berisi tiga bilangan $u, v, w$.
Baris berikutnya berisi sebuah bilangan $K$ ($0 \\le K \\le E$).
$K$ baris berikutnya berisi pasangan $u$ dan $v$ dari jalan yang ditutup.`,
    output_format: `Cetak satu bilangan bulat yang menyatakan jarak terpendek dari gedung $S$ ke $D$. Jika gedung $D$ mustahil dicapai, cetak -1.`,
    constraints: `* $2 \\le V \\le 10^5$
* $1 \\le E \\le 2 \\times 10^5$
* $1 \\le S, D \\le V$
* $1 \\le w \\le 10^9$`,
    time_limit_ms: 2000,
    memory_limit_mb: 256,
    difficulty: 'Hard',
    tags: ['Graph', 'Dijkstra', 'Shortest Path'],
    is_published: true,
    created_at: '2026-11-01T10:00:00Z',
    sample_test_cases: [
      {
        id: 'tc-004',
        problem_id: 'prob-003',
        input_data: `4 4 1 4\n1 2 5\n2 4 10\n1 3 3\n3 4 8\n1\n1 3`,
        expected_output: `15`,
        explanation: 'Jalan langsung 1-3 ditutup. Rute yang tersedia adalah 1 -> 2 -> 4 dengan bobot 5 + 10 = 15.',
        is_sample: true,
        points: 30,
      },
    ],
  },
  {
    id: 'prob-004',
    contest_id: null,
    title: 'Optimasi Tas Ransel Mahasiswa',
    slug: 'optimasi-tas-ransel-mahasiswa',
    order_letter: 'D',
    statement_md: `Seorang mahasiswa membawa tas ransel dengan kapasitas bobot maksimum $W$ kg untuk kegiatan praktikum lapangan.

Terdapat $N$ barang yang dapat dibawa. Setiap barang $i$ memiliki bobot $w_i$ dan nilai manfaat $v_i$. Mahasiswa hanya dapat membawa paling banyak satu buah dari masing-masing barang. Tentukan total nilai manfaat maksimum yang dapat dimasukkan ke dalam tas ransel tanpa melebihi kapasitas $W$.`,
    input_format: `Baris pertama berisi dua bilangan $N$ dan $W$.
$N$ baris berikutnya masing-masing berisi dua bilangan $w_i$ dan $v_i$.`,
    output_format: `Cetak satu bilangan bulat yang menyatakan nilai manfaat maksimum.`,
    constraints: `* $1 \\le N \\le 1000$
* $1 \\le W \\le 2000$
* $1 \\le w_i \\le W$
* $1 \\le v_i \\le 10^6$`,
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Knapsack'],
    is_published: true,
    created_at: '2026-11-01T10:00:00Z',
    sample_test_cases: [
      {
        id: 'tc-005',
        problem_id: 'prob-004',
        input_data: `4 7\n1 1\n3 4\n4 5\n5 7`,
        expected_output: `9`,
        explanation: 'Memilih barang ke-2 (bobot 3, nilai 4) dan ke-3 (bobot 4, nilai 5) menghasilkan bobot total 7 dan nilai total 9.',
        is_sample: true,
        points: 20,
      },
    ],
  },
];

export const MOCK_CONTESTS: Contest[] = [
  {
    id: 'contest-pam-2026',
    title: 'Pekan Algoritma Mahasiswa 2026 (PAM-2026)',
    slug: 'pam-2026',
    description: 'Kompetisi pemrograman tahunan tingkat universitas. Terbuka untuk seluruh mahasiswa angkatan 2023-2026. Format aturan mengacu pada standar ACM-ICPC dengan penalti 20 menit untuk setiap jawaban salah yang akhirnya Accepted.',
    start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // started 45 mins ago
    end_time: new Date(Date.now() + 195 * 60 * 1000).toISOString(), // ends in ~3.25 hrs
    freeze_minutes: 60,
    penalty_minutes: 20,
    is_published: true,
    problems: MOCK_PROBLEMS.filter(p => p.contest_id === 'contest-pam-2026'),
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'contest-dsa-warmup',
    title: 'Warm-up Latihan Mandiri Struktur Data',
    slug: 'warmup-dsa-2026',
    description: 'Arena latihan mandiri untuk memperkuat fondasi array, stack, queue, dan greedy algorithm.',
    start_time: '2026-11-01T00:00:00Z',
    end_time: '2026-12-31T23:59:59Z',
    freeze_minutes: 0,
    penalty_minutes: 0,
    is_published: true,
    problems: [MOCK_PROBLEMS[3]],
    created_at: '2026-11-01T00:00:00Z',
  },
];

export const MOCK_SCOREBOARD: ScoreboardParticipant[] = [
  {
    user_id: 'usr-004',
    nim: '230101004',
    full_name: 'Dewi Lestari',
    class_group: 'Ilmu Komputer 2024',
    rank: 1,
    solved_count: 3,
    total_penalty: 142,
    problems: {
      A: { solved: true, attempts: 1, solved_at_minute: 14, is_first_to_solve: true },
      B: { solved: true, attempts: 2, solved_at_minute: 38, is_first_to_solve: true },
      C: { solved: true, attempts: 1, solved_at_minute: 70, is_first_to_solve: true },
    },
  },
  {
    user_id: 'usr-002',
    nim: '230101002',
    full_name: 'Siti Rahmawati',
    class_group: 'Teknik Informatika 2024-A',
    rank: 2,
    solved_count: 2,
    total_penalty: 85,
    problems: {
      A: { solved: true, attempts: 1, solved_at_minute: 22 },
      B: { solved: true, attempts: 1, solved_at_minute: 63 },
      C: { solved: false, attempts: 2 },
    },
  },
  {
    user_id: 'usr-001',
    nim: '230101001',
    full_name: 'Budi Santoso',
    class_group: 'Teknik Informatika 2024-A',
    rank: 3,
    solved_count: 1,
    total_penalty: 45,
    problems: {
      A: { solved: true, attempts: 2, solved_at_minute: 25 },
      B: { solved: false, attempts: 3 },
      C: { solved: false, attempts: 0 },
    },
  },
  {
    user_id: 'usr-003',
    nim: '230101003',
    full_name: 'Ahmad Fauzi',
    class_group: 'Sistem Informasi 2024-B',
    rank: 4,
    solved_count: 1,
    total_penalty: 58,
    problems: {
      A: { solved: true, attempts: 3, solved_at_minute: 18 },
      B: { solved: false, attempts: 1 },
      C: { solved: false, attempts: 0 },
    },
  },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-101',
    user_id: 'usr-004',
    user_name: 'Dewi Lestari',
    user_nim: '230101004',
    problem_id: 'prob-001',
    problem_title: 'Penjumlahan Dua Bilangan Prima',
    problem_letter: 'A',
    contest_id: 'contest-pam-2026',
    language: 'cpp',
    source_code: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "5 5\\n5 11" << endl;\n    return 0;\n}`,
    verdict: 'AC',
    execution_time_ms: 12,
    memory_kb: 1420,
    score: 100,
    created_at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub-102',
    user_id: 'usr-001',
    user_name: 'Budi Santoso',
    user_nim: '230101001',
    problem_id: 'prob-001',
    problem_title: 'Penjumlahan Dua Bilangan Prima',
    problem_letter: 'A',
    contest_id: 'contest-pam-2026',
    language: 'python',
    source_code: `print("Hello World")`,
    verdict: 'WA',
    execution_time_ms: 25,
    memory_kb: 4200,
    score: 0,
    error_message: 'Sample test case 1 failed: Output mismatch',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'sub-103',
    user_id: 'usr-001',
    user_name: 'Budi Santoso',
    user_nim: '230101001',
    problem_id: 'prob-001',
    problem_title: 'Penjumlahan Dua Bilangan Prima',
    problem_letter: 'A',
    contest_id: 'contest-pam-2026',
    language: 'python',
    source_code: `def solve():\n    # Prime calculation\n    pass`,
    verdict: 'AC',
    execution_time_ms: 45,
    memory_kb: 4350,
    score: 100,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

export const CODE_STARTERS: Record<string, Record<string, string>> = {
  cpp: {
    default: `#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>

using namespace std;

void solve() {
    // Tulis solusi algoritma Anda di sini
    
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t; // Buka komentar jika terdapat multi test cases
    while (t--) {
        solve();
    }
    return 0;
}`,
  },
  python: {
    default: `import sys

def solve():
    # Gunakan sys.stdin.readline untuk pembacaan cepat (I/O optimal)
    input_data = sys.stdin.read().split()
    if not input_data:
        return
        
    # Tulis logika algoritma di sini
    

if __name__ == '__main__':
    solve()`,
  },
  java: {
    default: `import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        
        // Tulis solusi Anda di sini
        
    }
}`,
  },
};

