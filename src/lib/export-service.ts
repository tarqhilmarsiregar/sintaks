import { User, Submission, Game, Cohort } from '@/types/arena';

export interface RekapNilaiRow {
  NIM: string;
  Nama_Lengkap: string;
  Codename: string;
  Kelas_Kohort: string;
  Periode: string;
  Program_Studi: string;
  Angkatan: number;
  Kelas_Reguler: string;
  Game_Selesai: string;
  Rata_Nilai_Akhir: number;
  Nilai_Terbaik: number;
  Total_Pindah_Tab: number;
  Akumulasi_Penalti: string;
  Total_XP: number;
  Level: number;
  Tier_Badge: string;
  Status_Ketuntasan: 'TUNTAS' | 'BELUM TUNTAS';
}

export interface DiagnostikMateriRow {
  NIM: string;
  Nama_Lengkap: string;
  Codename: string;
  Kelas_Kohort: string;
  Level: number;
  Tier_Badge: string;
  Total_XP: number;
  Kategori_Fokus: string;
  Indikasi_Akademik: string;
  Rekomendasi_Modul: string;
}

export interface LogDetailSubmisiRow {
  ID_Submisi: string;
  Waktu: string;
  NIM: string;
  Codename: string;
  ID_Game: string;
  Jumlah_Benar: number;
  Total_Soal: number;
  Nilai_Akademik: number;
  Penalti_Tab: number;
  Skor_XP: number;
  Status_Kelulusan: string;
}

export interface AcademicExportPayload {
  users: User[];
  submissions: Submission[];
  games: Game[];
  cohorts: Cohort[];
  targetCohortIdOrCode?: string;
  targetCohortName?: string;
}

export interface AcademicExportResult {
  targetCode: string;
  targetTitle: string;
  fileName: string;
  studentCount: number;
  submissionCount: number;
  rekapNilaiData: RekapNilaiRow[];
  diagnostikData: DiagnostikMateriRow[];
  logDetailData: LogDetailSubmisiRow[];
}

/**
 * Pure Transformer: Menghasilkan struktur data 3-Sheet untuk ekspor Excel / CSV.
 * Murni dinamis berdasarkan data pengguna, kohort, game, dan riwayat submisi.
 */
export function generateAcademicExportData({
  users,
  submissions,
  games,
  cohorts,
  targetCohortIdOrCode = 'ALL',
  targetCohortName,
}: AcademicExportPayload): AcademicExportResult {
  const isAll = !targetCohortIdOrCode || targetCohortIdOrCode === 'ALL';

  // Cari metadata kohort target jika spesifik
  const matchedCohort = !isAll
    ? cohorts.find(c => c.id_cohort === targetCohortIdOrCode || c.kode_kelas === targetCohortIdOrCode)
    : null;

  const targetTitle = isAll
    ? 'Semua Kelas & Kohort'
    : targetCohortName || (matchedCohort ? matchedCohort.nama_kelas : `Kelas ${targetCohortIdOrCode}`);

  const targetCode = isAll
    ? 'ALL'
    : matchedCohort?.kode_kelas || targetCohortIdOrCode;

  // Filter Mahasiswa
  const filteredUsers = users.filter(u => {
    if (u.role !== 'PESERTA') return false;
    if (isAll) return true;
    return u.id_cohort === targetCohortIdOrCode || u.klub_hari === targetCohortIdOrCode || (matchedCohort && u.klub_hari === matchedCohort.kode_kelas);
  });

  // 1. Sheet 1: Rekap_Nilai
  const rekapNilaiData: RekapNilaiRow[] = filteredUsers.map(u => {
    const userSubs = submissions.filter(s => s.nim === u.nim && s.status_sesi === 'DONE');
    const totalNilai = userSubs.reduce((acc, s) => acc + s.nilai_akademik, 0);
    const rataNilai = userSubs.length > 0 ? Math.round(totalNilai / userSubs.length) : 0;
    const maxNilai = userSubs.length > 0 ? Math.max(...userSubs.map(s => s.nilai_akademik)) : 0;
    const totalTab = userSubs.reduce((acc, s) => acc + s.tab_switch_count, 0);

    const cohortObj = cohorts.find(c => c.id_cohort === u.id_cohort || c.kode_kelas === u.id_cohort || c.kode_kelas === u.klub_hari);
    const kelasLabel = cohortObj ? cohortObj.nama_kelas : (u.klub_hari && u.klub_hari !== 'ALL' ? `Kelas ${u.klub_hari}` : 'Reguler');
    const periodeLabel = u.periode || cohortObj?.periode || '-';

    return {
      NIM: u.nim,
      Nama_Lengkap: u.nama_lengkap,
      Codename: u.codename || '-',
      Kelas_Kohort: kelasLabel,
      Periode: periodeLabel,
      Program_Studi: u.prodi || '-',
      Angkatan: u.angkatan || 2025,
      Kelas_Reguler: u.kelas_reguler || '-',
      Game_Selesai: `${userSubs.length}/${games.length}`,
      Rata_Nilai_Akhir: rataNilai,
      Nilai_Terbaik: maxNilai,
      Total_Pindah_Tab: totalTab,
      Akumulasi_Penalti: `-${totalTab * 5}`,
      Total_XP: u.total_xp || 0,
      Level: u.level || 1,
      Tier_Badge: u.tier_badge || 'Logic Novice',
      Status_Ketuntasan: rataNilai >= 70 ? 'TUNTAS' : 'BELUM TUNTAS',
    };
  });

  // 2. Sheet 2: Diagnostik_Materi
  const diagnostikData: DiagnostikMateriRow[] = filteredUsers.map(u => {
    const cohortObj = cohorts.find(c => c.id_cohort === u.id_cohort || c.kode_kelas === u.id_cohort || c.kode_kelas === u.klub_hari);
    const kelasLabel = cohortObj ? cohortObj.nama_kelas : (u.klub_hari && u.klub_hari !== 'ALL' ? `Kelas ${u.klub_hari}` : 'Reguler');
    const xp = u.total_xp || 0;

    let indikasi = '🔴 Butuh Pengayaan';
    let rekomendasi = 'Review Modul Dasar Sintaks & Mentoring';
    if (xp >= 800) {
      indikasi = '🟢 Sangat Menguasai';
      rekomendasi = 'Pengayaan Lanjut (ICPC Division & Algoritma Lanjut)';
    } else if (xp >= 400) {
      indikasi = '🟡 Cukup';
      rekomendasi = 'Latihan Mandiri Problem Set Logika & Loop';
    }

    return {
      NIM: u.nim,
      Nama_Lengkap: u.nama_lengkap,
      Codename: u.codename || '-',
      Kelas_Kohort: kelasLabel,
      Level: u.level || 1,
      Tier_Badge: u.tier_badge || 'Logic Novice',
      Total_XP: xp,
      Kategori_Fokus: 'Logika Pemrograman, Big-O & CP Arena',
      Indikasi_Akademik: indikasi,
      Rekomendasi_Modul: rekomendasi,
    };
  });

  // 3. Sheet 3: Log_Detail_Submisi
  const userNimsSet = new Set(filteredUsers.map(u => u.nim));
  const logDetailData: LogDetailSubmisiRow[] = submissions
    .filter(s => userNimsSet.has(s.nim))
    .map(s => {
      let formattedTime = '-';
      if (s.timestamp_mulai) {
        try {
          formattedTime = new Date(s.timestamp_mulai).toLocaleString('id-ID');
        } catch {
          formattedTime = String(s.timestamp_mulai);
        }
      }

      return {
        ID_Submisi: s.id_submission,
        Waktu: formattedTime,
        NIM: s.nim,
        Codename: s.codename || '-',
        ID_Game: s.id_game,
        Jumlah_Benar: s.jumlah_benar,
        Total_Soal: s.total_soal,
        Nilai_Akademik: s.nilai_akademik,
        Penalti_Tab: (s.tab_switch_count || 0) * 5,
        Skor_XP: s.skor_xp,
        Status_Kelulusan: s.status_lulus,
      };
    });

  const cleanDateStr = new Date().toISOString().slice(0, 10);
  const cleanCode = targetCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `STMIK_TIME_CP_ARENA_${cleanCode}_${cleanDateStr}`;

  return {
    targetCode,
    targetTitle,
    fileName,
    studentCount: filteredUsers.length,
    submissionCount: logDetailData.length,
    rekapNilaiData,
    diagnostikData,
    logDetailData,
  };
}

/**
 * Browser-side Dispatcher: Mengunduh file Excel multi-sheet (.xlsx) atau CSV fallback.
 */
export function downloadAcademicExport(result: AcademicExportResult): { success: boolean; format: 'XLSX' | 'CSV'; message: string } {
  if (typeof window === 'undefined') {
    return { success: false, format: 'CSV', message: 'Hanya dapat dijalankan di browser.' };
  }

  const win = window as any;
  const { fileName, targetTitle, targetCode, rekapNilaiData, diagnostikData, logDetailData } = result;

  // 1. Ekspor Multi-Sheet XLSX jika SheetJS tersedia
  if (win && typeof win.XLSX !== 'undefined') {
    try {
      const wb = win.XLSX.utils.book_new();

      const ws1 = win.XLSX.utils.json_to_sheet(rekapNilaiData.length > 0 ? rekapNilaiData : [{ Info: 'Belum ada data mahasiswa terdaftar' }]);
      win.XLSX.utils.book_append_sheet(wb, ws1, 'Rekap_Nilai');

      const ws2 = win.XLSX.utils.json_to_sheet(diagnostikData.length > 0 ? diagnostikData : [{ Info: 'Belum ada data diagnostik' }]);
      win.XLSX.utils.book_append_sheet(wb, ws2, 'Diagnostik_Materi');

      const ws3 = win.XLSX.utils.json_to_sheet(logDetailData.length > 0 ? logDetailData : [{ Info: 'Belum ada log submisi tercatat' }]);
      win.XLSX.utils.book_append_sheet(wb, ws3, 'Log_Detail');

      win.XLSX.writeFile(wb, `${fileName}.xlsx`);
      return {
        success: true,
        format: 'XLSX',
        message: `Laporan resmi Excel (${targetTitle}) berhasil diunduh (.xlsx 3-Sheet)!`,
      };
    } catch (err) {
      console.error('Error saat menulis workbook Excel:', err);
    }
  }

  // 2. Fallback CSV dengan UTF-8 BOM
  try {
    const dataToExport = rekapNilaiData.length > 0
      ? rekapNilaiData
      : [{ Status: 'Kosong', Keterangan: 'Belum ada data mahasiswa untuk kelas ini' }];

    const headers = Object.keys(dataToExport[0]);
    const csvRows = [
      headers.join(';'),
      ...dataToExport.map(row => {
        return headers.map(h => {
          const val = String((row as any)[h] ?? '');
          // Escape quote jika ada tanda titik koma atau kutip
          if (val.includes(';') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(';');
      })
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      format: 'CSV',
      message: `Laporan data CSV (${targetTitle}) berhasil diunduh.`,
    };
  } catch (err) {
    console.error('Error saat download CSV fallback:', err);
    return {
      success: false,
      format: 'CSV',
      message: 'Gagal mengekspor data laporan.',
    };
  }
}
