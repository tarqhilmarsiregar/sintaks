import { CreateUserDTO, KlubHari, User } from '@/types/arena';

export interface ParsedStudentRow {
  rowNumber: number;
  nim: string;
  nama_lengkap: string;
  prodi: string;
  angkatan: number;
  kelas_reguler: string;
  codename?: string;
  status: 'VALID' | 'DUPLICATE_IN_FILE' | 'ALREADY_EXISTS' | 'INVALID';
  errorReason?: string;
}

export interface StudentImportValidationResult {
  rows: ParsedStudentRow[];
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  duplicateRows: ParsedStudentRow[];
  totalRows: number;
}

/**
 * Memisahkan satu baris CSV dengan kepatuhan RFC 4180 (mendukung delimiter ',' maupun ';',
 * serta tanda kutip ganda untuk field yang mengandung delimiter).
 */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Mendeteksi delimiter CSV secara otomatis (',' vs ';') dari baris header.
 */
export function detectCsvDelimiter(headerLine: string): ',' | ';' {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

/**
 * Mem-parsing teks CSV mentah (termasuk UTF-8 BOM) menjadi array objek key-value mentah.
 */
export function parseRawCsvText(csvText: string): Record<string, string>[] {
  const cleanText = (csvText || '').replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  );

  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) {
        record[h] = (values[idx] || '').trim();
      }
    });
    records.push(record);
  }

  return records;
}

function resolveField(record: Record<string, any>, aliases: string[]): string {
  const normalizedMap: Record<string, string> = {};
  Object.entries(record).forEach(([k, v]) => {
    const normKey = k.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    normalizedMap[normKey] = v !== undefined && v !== null ? String(v).trim() : '';
  });

  for (const alias of aliases) {
    if (normalizedMap[alias] !== undefined && normalizedMap[alias] !== '') {
      return normalizedMap[alias];
    }
  }
  return '';
}

/**
 * Memvalidasi baris mentah (dari CSV maupun SheetJS Excel) terhadap daftar user eksisting.
 */
export function validateImportedStudentRows(
  rawRecords: Record<string, any>[],
  existingUsers: User[]
): StudentImportValidationResult {
  const existingNimSet = new Set(existingUsers.map((u) => u.nim.trim().toUpperCase()));
  const seenInFile = new Set<string>();

  const rows: ParsedStudentRow[] = rawRecords.map((rec, index) => {
    const rowNumber = index + 2; // Baris 1 = header
    const nim = resolveField(rec, ['nim', 'no_induk', 'npm', 'id_mahasiswa']).toUpperCase();
    const nama_lengkap = resolveField(rec, ['nama_lengkap', 'nama', 'name', 'full_name', 'nama_mahasiswa']);
    const prodi = resolveField(rec, ['prodi', 'program_studi', 'jurusan']) || 'Sistem Informasi';
    const angkatanRaw = resolveField(rec, ['angkatan', 'tahun', 'year']);
    const angkatanNum = Number(angkatanRaw);
    const angkatan = Number.isFinite(angkatanNum) && angkatanNum >= 2000 && angkatanNum <= 2100 ? angkatanNum : 2025;
    const kelas_reguler = resolveField(rec, ['kelas_reguler', 'kelas', 'class', 'rombel']) || 'REGULER';
    const codename = resolveField(rec, ['codename', 'handle', 'username']) || undefined;

    if (!nim) {
      return {
        rowNumber,
        nim: '',
        nama_lengkap,
        prodi,
        angkatan,
        kelas_reguler,
        codename,
        status: 'INVALID',
        errorReason: 'Kolom NIM kosong',
      };
    }

    if (!/^[A-Z0-9._-]{3,30}$/.test(nim)) {
      return {
        rowNumber,
        nim,
        nama_lengkap,
        prodi,
        angkatan,
        kelas_reguler,
        codename,
        status: 'INVALID',
        errorReason: 'Format NIM tidak valid (3-30 karakter alfanumerik)',
      };
    }

    if (!nama_lengkap || nama_lengkap.length < 2) {
      return {
        rowNumber,
        nim,
        nama_lengkap,
        prodi,
        angkatan,
        kelas_reguler,
        codename,
        status: 'INVALID',
        errorReason: 'Kolom Nama Lengkap kosong atau terlalu pendek',
      };
    }

    if (existingNimSet.has(nim)) {
      return {
        rowNumber,
        nim,
        nama_lengkap,
        prodi,
        angkatan,
        kelas_reguler,
        codename,
        status: 'ALREADY_EXISTS',
        errorReason: 'NIM sudah terdaftar di sistem',
      };
    }

    if (seenInFile.has(nim)) {
      return {
        rowNumber,
        nim,
        nama_lengkap,
        prodi,
        angkatan,
        kelas_reguler,
        codename,
        status: 'DUPLICATE_IN_FILE',
        errorReason: 'Duplikat NIM di dalam file unggahan',
      };
    }

    seenInFile.add(nim);
    return {
      rowNumber,
      nim,
      nama_lengkap,
      prodi,
      angkatan,
      kelas_reguler,
      codename,
      status: 'VALID',
    };
  });

  const validRows = rows.filter((r) => r.status === 'VALID');
  const invalidRows = rows.filter((r) => r.status === 'INVALID');
  const duplicateRows = rows.filter(
    (r) => r.status === 'DUPLICATE_IN_FILE' || r.status === 'ALREADY_EXISTS'
  );

  return {
    rows,
    validRows,
    invalidRows,
    duplicateRows,
    totalRows: rows.length,
  };
}

/**
 * Mengonversi baris valid menjadi payload CreateUserDTO yang siap di-insert secara batch.
 */
export function buildBulkCreateUserDTOs(
  validRows: ParsedStudentRow[],
  targetCohort: { id_cohort: string; kode_kelas: string; periode: string }
): CreateUserDTO[] {
  const klubHari: KlubHari = ['KAMIS', 'JUMAT', 'LOMBA'].includes(targetCohort.kode_kelas)
    ? (targetCohort.kode_kelas as KlubHari)
    : 'ALL';

  return validRows.map((row) => ({
    nim: row.nim,
    nama_lengkap: row.nama_lengkap,
    role: 'PESERTA',
    codename: row.codename,
    klub_hari: klubHari,
    id_cohort: targetCohort.id_cohort,
    periode: targetCohort.periode || 'Ganjil 2025',
    prodi: row.prodi,
    angkatan: row.angkatan,
    kelas_reguler: row.kelas_reguler,
  }));
}

/**
 * Menghasilkan konten template CSV resmi ber-BOM UTF-8 untuk Excel Indonesia maupun Google Sheets.
 */
export function generateStudentImportTemplateCsv(): string {
  const header = 'NIM;Nama_Lengkap;Prodi;Angkatan;Kelas_Reguler;Codename';
  const sample1 = '250201101;Andi Pratama;Sistem Informasi;2025;SI A 25;Andi_Algo';
  const sample2 = '250101102;Siti Rahmawati;Teknik Informatika;2025;TI A 25;';
  return `\uFEFF${header}\n${sample1}\n${sample2}\n`;
}

/**
 * Memicu unduhan file template CSV di browser.
 */
export function downloadStudentImportTemplate(): void {
  if (typeof window === 'undefined') return;
  const content = generateStudentImportTemplateCsv();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'TEMPLATE_IMPORT_MAHASISWA_STMIK_TIME.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
