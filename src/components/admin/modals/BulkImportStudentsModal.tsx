'use client';

import React, { useState, useRef } from 'react';
import { Cohort, CreateUserDTO, User } from '@/types/arena';
import ModalPortal from '@/components/common/ModalPortal';
import {
  buildBulkCreateUserDTOs,
  downloadStudentImportTemplate,
  parseRawCsvText,
  StudentImportValidationResult,
  validateImportedStudentRows,
} from '@/lib/student-import-service';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ClipboardPaste,
} from 'lucide-react';

interface BulkImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohorts: Cohort[];
  existingUsers: User[];
  onBulkImport: (dtos: CreateUserDTO[]) => {
    success: boolean;
    message: string;
    createdCount: number;
    skippedCount: number;
  };
}

export default function BulkImportStudentsModal({
  isOpen,
  onClose,
  cohorts,
  existingUsers,
  onBulkImport,
}: BulkImportStudentsModalProps) {
  const [selectedCohortId, setSelectedCohortId] = useState<string>(cohorts[0]?.id_cohort || '');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [fileName, setFileName] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [validation, setValidation] = useState<StudentImportValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const activeCohort =
    cohorts.find((c) => c.id_cohort === selectedCohortId) || cohorts[0] || null;

  const resetPreview = () => {
    setValidation(null);
    setErrorMsg('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        const rawRecords = parseRawCsvText(text);
        if (rawRecords.length === 0) {
          setValidation(null);
          setErrorMsg('Berkas CSV kosong atau tidak memiliki baris data di bawah header.');
          return;
        }
        setValidation(validateImportedStudentRows(rawRecords, existingUsers));
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
          setValidation(null);
          setErrorMsg(
            'Modul SheetJS Excel belum siap. Silakan simpan file sebagai .CSV (Comma/Semicolon Delimited) atau muat ulang halaman.'
          );
          return;
        }
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setErrorMsg('Workbook Excel tidak memiliki lembar kerja (sheet).');
          return;
        }
        const rawRecords = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
          defval: '',
        }) as Record<string, any>[];
        if (rawRecords.length === 0) {
          setValidation(null);
          setErrorMsg('Sheet pertama pada file Excel kosong.');
          return;
        }
        setValidation(validateImportedStudentRows(rawRecords, existingUsers));
      } else {
        setValidation(null);
        setErrorMsg('Format berkas tidak didukung. Gunakan file .CSV, .XLSX, atau .XLS.');
      }
    } catch (err: any) {
      setValidation(null);
      setErrorMsg(err?.message || 'Gagal membaca berkas unggahan.');
    }
  };

  const handleParsePaste = () => {
    setErrorMsg('');
    const rawRecords = parseRawCsvText(pasteText);
    if (rawRecords.length === 0) {
      setValidation(null);
      setErrorMsg(
        'Format teks CSV tidak valid. Pastikan baris pertama adalah header (misal: NIM;Nama_Lengkap;Prodi;Angkatan;Kelas_Reguler).'
      );
      return;
    }
    setValidation(validateImportedStudentRows(rawRecords, existingUsers));
  };

  const handleExecuteImport = () => {
    if (!activeCohort) {
      setErrorMsg('Pilih minimal 1 Kelas / Kohort tujuan terlebih dahulu.');
      return;
    }
    if (!validation || validation.validRows.length === 0) {
      setErrorMsg('Tidak ada baris mahasiswa valid yang dapat diimpor.');
      return;
    }

    setIsImporting(true);
    const dtos = buildBulkCreateUserDTOs(validation.validRows, {
      id_cohort: activeCohort.id_cohort,
      kode_kelas: activeCohort.kode_kelas,
      periode: activeCohort.periode,
    });

    const res = onBulkImport(dtos);
    setIsImporting(false);

    if (res.success) {
      resetPreview();
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-[#0b1120] border border-[#1e293b] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-[#0e1629] border-b border-[#1e293b] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Import Massal Mahasiswa (CSV / Excel)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Daftarkan puluhan mahasiswa sekaligus ke kelas/kohort pilihan. Default kata sandi otomatis di-set ke NIM dan terenkripsi saat disimpan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#111827] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {cohorts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <div className="font-semibold text-white">Belum Ada Kelas / Kohort Terdaftar</div>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Buat minimal 1 kelas / kohort terlebih dahulu sebelum menjalankan import massal mahasiswa.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Target Cohort & Template Download */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-[#070b14] p-3.5 rounded-xl border border-[#1e293b]">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      Kelas / Kohort Tujuan
                    </label>
                    <select
                      value={activeCohort?.id_cohort || ''}
                      onChange={(e) => setSelectedCohortId(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      {cohorts.map((c) => (
                        <option key={c.id_cohort} value={c.id_cohort}>
                          {c.nama_kelas} ({c.kode_kelas} &bull; {c.periode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-5">
                    <button
                      type="button"
                      onClick={downloadStudentImportTemplate}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-slate-200 hover:text-white font-mono font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Unduh Template CSV</span>
                    </button>
                  </div>
                </div>

                {/* 2. Mode Switcher: Unggah Berkas vs Tempel Teks CSV */}
                <div className="flex items-center gap-1.5 bg-[#070b14] p-1 rounded-lg border border-[#1e293b] w-fit font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('file');
                      resetPreview();
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      inputMode === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah File (.CSV / .XLSX)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('paste');
                      resetPreview();
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      inputMode === 'paste'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Tempel Teks CSV</span>
                  </button>
                </div>

                {/* 3. Input Zone */}
                {inputMode === 'file' ? (
                  <div className="border border-dashed border-[#2b3a55] hover:border-blue-500/60 bg-[#070b14] rounded-xl p-5 text-center transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id="bulk-student-file-input"
                    />
                    <label
                      htmlFor="bulk-student-file-input"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#111827] border border-[#1e293b] flex items-center justify-center text-slate-300">
                        <Upload className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {fileName ? `Terpilih: ${fileName}` : 'Pilih Berkas CSV atau Excel (.xlsx)'}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Kolom wajib: NIM, Nama_Lengkap &bull; Opsional: Prodi, Angkatan, Kelas_Reguler, Codename
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <textarea
                      rows={5}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={'NIM;Nama_Lengkap;Prodi;Angkatan;Kelas_Reguler\n250201101;Andi Pratama;Sistem Informasi;2025;SI A 25\n250101102;Siti Rahmawati;Teknik Informatika;2025;TI A 25'}
                      className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl p-3 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleParsePaste}
                        disabled={!pasteText.trim()}
                        className="px-4 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1a2333] disabled:opacity-40 border border-[#1e293b] text-blue-400 font-mono font-semibold transition-colors"
                      >
                        Validasi &amp; Pratinjau Data
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 4. Validation Summary & Preview Table */}
                {validation && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                      <div className="bg-[#070b14] border border-[#1e293b] rounded-lg p-3">
                        <div className="text-[10px] text-slate-400 uppercase">Total Baris</div>
                        <div className="text-lg font-bold text-white mt-0.5">{validation.totalRows}</div>
                      </div>
                      <div className="bg-[#070b14] border border-emerald-500/30 rounded-lg p-3">
                        <div className="text-[10px] text-emerald-400 uppercase">Siap Diimpor</div>
                        <div className="text-lg font-bold text-emerald-400 mt-0.5">{validation.validRows.length}</div>
                      </div>
                      <div className="bg-[#070b14] border border-amber-500/30 rounded-lg p-3">
                        <div className="text-[10px] text-amber-400 uppercase">Duplikat / Ada</div>
                        <div className="text-lg font-bold text-amber-400 mt-0.5">{validation.duplicateRows.length}</div>
                      </div>
                      <div className="bg-[#070b14] border border-rose-500/30 rounded-lg p-3">
                        <div className="text-[10px] text-rose-400 uppercase">Tidak Valid</div>
                        <div className="text-lg font-bold text-rose-400 mt-0.5">{validation.invalidRows.length}</div>
                      </div>
                    </div>

                    <div className="border border-[#1e293b] rounded-xl overflow-hidden bg-[#070b14]">
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#0e1629] text-[10px] font-mono uppercase text-slate-400 sticky top-0 border-b border-[#1e293b]">
                            <tr>
                              <th className="p-2.5">Baris</th>
                              <th className="p-2.5">NIM</th>
                              <th className="p-2.5">Nama Lengkap</th>
                              <th className="p-2.5">Prodi / Kelas</th>
                              <th className="p-2.5 text-right">Status Validasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e293b]/60 text-xs">
                            {validation.rows.map((row) => (
                              <tr key={`${row.rowNumber}-${row.nim}`} className="hover:bg-[#0e1629]/60">
                                <td className="p-2.5 font-mono text-slate-500">#{row.rowNumber}</td>
                                <td className="p-2.5 font-mono font-bold text-white">
                                  {row.nim || <span className="text-rose-400">-</span>}
                                </td>
                                <td className="p-2.5 text-slate-200 font-medium">
                                  {row.nama_lengkap || <span className="text-rose-400">-</span>}
                                </td>
                                <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                                  {row.prodi} ({row.angkatan}) &bull; {row.kelas_reguler}
                                </td>
                                <td className="p-2.5 text-right font-mono">
                                  {row.status === 'VALID' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      VALID
                                    </span>
                                  ) : row.status === 'ALREADY_EXISTS' || row.status === 'DUPLICATE_IN_FILE' ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                                      title={row.errorReason}
                                    >
                                      LEWATI ({row.status === 'ALREADY_EXISTS' ? 'TERDAFTAR' : 'DUPLIKAT'})
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold"
                                      title={row.errorReason}
                                    >
                                      INVALID: {row.errorReason}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#0e1629] border-t border-[#1e293b] flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-slate-400">
              {validation && validation.validRows.length > 0
                ? `${validation.validRows.length} akun valid siap didaftarkan (baris duplikat/invalid dilewati).`
                : 'Unggah berkas atau tempel data CSV untuk pratinjau.'}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1a2333] border border-[#1e293b] text-slate-300 font-mono font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!validation || validation.validRows.length === 0 || !activeCohort || isImporting}
                onClick={handleExecuteImport}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a2333] disabled:text-slate-500 disabled:cursor-not-allowed text-white font-mono font-bold transition-colors shadow-sm"
              >
                {isImporting
                  ? 'Mengimpor...'
                  : `Impor ${validation?.validRows.length || 0} Mahasiswa`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
