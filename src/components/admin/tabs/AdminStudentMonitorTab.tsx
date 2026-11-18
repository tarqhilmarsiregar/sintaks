'use client';

import React, { useState, useEffect } from 'react';
import { User, Submission, CreateUserDTO, KlubHari, UserRole, Cohort, Game } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { calculateLevelInfo } from '@/lib/gamification';
import UserAvatar from '@/components/arena/UserAvatar';
import ModalPortal from '@/components/common/ModalPortal';
import BulkImportStudentsModal from '@/components/admin/modals/BulkImportStudentsModal';
import {
  GraduationCap,
  RotateCcw,
  Search,
  Flame,
  UserPlus,
  Trash2,
  X,
  Shield,
  Trophy,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  BookOpen,
  Check,
  Settings,
  FileSpreadsheet,
  KeyRound,
  Pencil,
} from 'lucide-react';

interface AdminStudentMonitorTabProps {
  users: User[];
  submissions: Submission[];
  games?: Game[];
  cohorts?: Cohort[];
  onResetStudent: (nim: string) => void;
  onResetStudentGame?: (nim: string, idGame: string) => { success: boolean; message: string };
  onUpdateStudentProgress?: (
    nim: string,
    payload: { total_xp?: number; grades: { id_game: string; nilai_akademik: number; skor_xp: number }[] }
  ) => { success: boolean; message: string };
  onAddUser: (dto: CreateUserDTO) => { success: boolean; message: string; user?: User };
  onBulkAddUsers?: (dtos: CreateUserDTO[]) => {
    success: boolean;
    message: string;
    createdCount: number;
    skippedCount: number;
  };
  onAdminResetPassword?: (nim: string) => Promise<{ success: boolean; message: string }>;
  onDeleteUser: (nim: string) => void;
  onRefresh?: () => void;
}

export default function AdminStudentMonitorTab({
  users,
  submissions,
  games,
  cohorts: propCohorts,
  onResetStudent,
  onResetStudentGame,
  onUpdateStudentProgress,
  onAddUser,
  onBulkAddUsers,
  onAdminResetPassword,
  onDeleteUser,
  onRefresh,
}: AdminStudentMonitorTabProps) {
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Daftar Paket Soal 100% Murni Dinamis dari Database (Zero Dummy G1-G7)
  const availableGamePackages = (games || []).map((g) => ({
    id: g.id_game,
    label: `${g.ref_pertemuan ? `${g.ref_pertemuan} — ` : ''}${g.judul_game}`,
  }));

  // Cohorts & Dynamic Class State (sinkron dengan hidrasi Supabase)
  const [cohorts, setCohorts] = useState<Cohort[]>(() =>
    propCohorts && propCohorts.length > 0 ? propCohorts : ArenaStore.getCohorts()
  );

  useEffect(() => {
    if (propCohorts) {
      setCohorts(propCohorts);
    }
  }, [propCohorts]);

  // Bulk Import & Admin Password Reset Modal States
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [isConfirmingPasswordReset, setIsConfirmingPasswordReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [showCohortModal, setShowCohortModal] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [cohortNama, setCohortNama] = useState('');
  const [cohortKode, setCohortKode] = useState('');
  const [cohortSemester, setCohortSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [cohortTahun, setCohortTahun] = useState('2025');
  const [cohortDeskripsi, setCohortDeskripsi] = useState('');
  const [cohortAllowedGames, setCohortAllowedGames] = useState<string[]>([]);
  const [cohortModalError, setCohortModalError] = useState('');
  const [cohortModalSuccess, setCohortModalSuccess] = useState('');

  const openCreateCohortModal = () => {
    setEditingCohort(null);
    setCohortNama('');
    setCohortKode('');
    setCohortSemester('Ganjil');
    setCohortTahun(String(new Date().getFullYear()));
    setCohortDeskripsi('');
    // Default kosong jika 0 game, atau pilih game yang benar-benar ada saja
    setCohortAllowedGames([]);
    setCohortModalError('');
    setCohortModalSuccess('');
    setShowCohortModal(true);
  };

  const openEditCohortModal = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setCohortNama(cohort.nama_kelas);
    setCohortKode(cohort.kode_kelas);
    const parts = (cohort.periode || 'Ganjil 2025').trim().split(/\s+/);
    setCohortSemester(parts[0]?.toLowerCase() === 'genap' ? 'Genap' : 'Ganjil');
    setCohortTahun(parts[1] && /^\d{4}$/.test(parts[1]) ? parts[1] : '2025');
    setCohortDeskripsi(cohort.deskripsi || '');
    // Filter hanya game ID yang valid dan benar-benar ada di database saat ini
    const existingGameIds = new Set(availableGamePackages.map((g) => g.id));
    setCohortAllowedGames((cohort.allowed_game_ids || []).filter((id) => existingGameIds.has(id)));
    setCohortModalError('');
    setCohortModalSuccess('');
    setShowCohortModal(true);
  };

  // Managing Student Modal State (Nilai, XP & Reset Pertemuan)
  const [managingStudent, setManagingStudent] = useState<User | null>(null);
  const [editTotalXp, setEditTotalXp] = useState<number>(0);
  const [editGrades, setEditGrades] = useState<
    Record<string, { nilai_akademik: number; skor_xp: number; hasSub: boolean; enabled: boolean }>
  >({});
  const [manageModalError, setManageModalError] = useState('');
  const [manageModalSuccess, setManageModalSuccess] = useState('');

  // Destructive Confirmation Modals State (Zero Browser confirm() / Pure Industrial Dark Anti-AI Slop)
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [confirmResetGame, setConfirmResetGame] = useState<{ idGame: string; label: string } | null>(null);
  const [isConfirmingFullReset, setIsConfirmingFullReset] = useState(false);

  // Form State Tambah Akun
  const [showAddModal, setShowAddModal] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('PESERTA');
  const [formNim, setFormNim] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formCodename, setFormCodename] = useState('');
  const [formCohortId, setFormCohortId] = useState<string>(() => (ArenaStore.getCohorts()[0]?.id_cohort || ''));
  const [formClass, setFormClass] = useState<KlubHari>('ALL');
  const [formProdi, setFormProdi] = useState('Sistem Informasi');
  const [formAngkatan, setFormAngkatan] = useState('2025');
  const [formKelasReguler, setFormKelasReguler] = useState('SI C 25');
  const [modalError, setModalError] = useState('');

  const filteredUsers = users.filter(u => {
    if (u.role !== 'PESERTA') return false;
    if (classFilter !== 'ALL') {
      const matchCohort = u.id_cohort === classFilter;
      const matchKlub = u.klub_hari === classFilter;
      const matchKode = cohorts.some(c => c.id_cohort === classFilter && (c.kode_kelas === u.klub_hari || c.kode_kelas === u.id_cohort));
      if (!matchCohort && !matchKlub && !matchKode) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNim = u.nim.toLowerCase().includes(q);
      const matchName = (u.nama_lengkap || '').toLowerCase().includes(q);
      const matchCodename = (u.codename || '').toLowerCase().includes(q);
      if (!matchNim && !matchName && !matchCodename) return false;
    }
    return true;
  });

  const totalStudentsCount = users.filter(u => u.role === 'PESERTA').length;

  const handleCreateCohortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortNama.trim()) {
      setCohortModalError('Nama kelas wajib diisi!');
      return;
    }
    if (!cohortKode.trim()) {
      setCohortModalError('Kode kelas wajib diisi!');
      return;
    }
    if (!cohortTahun.trim() || !/^\d{4}$/.test(cohortTahun.trim())) {
      setCohortModalError('Tahun harus berupa 4 digit angka (contoh: 2025)!');
      return;
    }

    const periodeString = `${cohortSemester} ${cohortTahun.trim()}`;

    if (editingCohort) {
      const res = ArenaStore.updateCohort(editingCohort.id_cohort, {
        nama_kelas: cohortNama.trim(),
        kode_kelas: cohortKode.trim().toUpperCase(),
        periode: periodeString,
        deskripsi: cohortDeskripsi.trim() || undefined,
        allowed_game_ids: cohortAllowedGames,
      });

      if (res.success && res.cohort) {
        const updated = ArenaStore.getCohorts();
        setCohorts(updated);
        onRefresh?.();
        setCohortModalSuccess(res.message);
        setCohortModalError('');
        setTimeout(() => {
          setCohortModalSuccess('');
          setEditingCohort(null);
          setShowCohortModal(false);
        }, 600);
      } else {
        setCohortModalError(res.message);
      }
      return;
    }

    const res = ArenaStore.createCohort({
      nama_kelas: cohortNama.trim(),
      kode_kelas: cohortKode.trim(),
      periode: periodeString,
      deskripsi: cohortDeskripsi.trim() || undefined,
      allowed_game_ids: cohortAllowedGames,
    });

    if (res.success && res.cohort) {
      const updated = ArenaStore.getCohorts();
      setCohorts(updated);
      setFormCohortId(res.cohort.id_cohort);
      onRefresh?.();
      setCohortModalSuccess(res.message);
      setCohortModalError('');
      setCohortNama('');
      setCohortKode('');
      setCohortDeskripsi('');
      setCohortAllowedGames([]);
      setTimeout(() => {
        setCohortModalSuccess('');
        setShowCohortModal(false);
      }, 600);
    } else {
      setCohortModalError(res.message);
    }
  };

  const handleDeleteEditingCohort = () => {
    if (!editingCohort) return;
    const res = ArenaStore.deleteCohort(editingCohort.id_cohort);
    if (res.success) {
      const updated = ArenaStore.getCohorts();
      setCohorts(updated);
      if (classFilter === editingCohort.id_cohort) {
        setClassFilter('ALL');
      }
      onRefresh?.();
      setEditingCohort(null);
      setShowCohortModal(false);
    } else {
      setCohortModalError(res.message);
    }
  };

  // Managing Student Modal Handlers
  const handleOpenManageModal = (student: User) => {
    setManagingStudent(student);
    setEditTotalXp(student.total_xp || 0);
    setManageModalError('');
    setManageModalSuccess('');

    const initialGrades: Record<string, { nilai_akademik: number; skor_xp: number; hasSub: boolean; enabled: boolean }> = {};
    availableGamePackages.forEach(pkg => {
      const sub = submissions.find(s => s.nim === student.nim && s.id_game === pkg.id);
      if (sub) {
        initialGrades[pkg.id] = {
          nilai_akademik: sub.nilai_akademik,
          skor_xp: sub.skor_xp,
          hasSub: true,
          enabled: true,
        };
      } else {
        initialGrades[pkg.id] = {
          nilai_akademik: 70,
          skor_xp: 50,
          hasSub: false,
          enabled: false,
        };
      }
    });

    setEditGrades(initialGrades);
  };

  const handleSaveStudentProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStudent) return;

    const gradesPayload: { id_game: string; nilai_akademik: number; skor_xp: number }[] = [];
    Object.entries(editGrades).forEach(([idGame, val]) => {
      if (val.enabled || val.hasSub) {
        gradesPayload.push({
          id_game: idGame,
          nilai_akademik: Number(val.nilai_akademik) || 0,
          skor_xp: Number(val.skor_xp) || 0,
        });
      }
    });

    if (onUpdateStudentProgress) {
      const res = onUpdateStudentProgress(managingStudent.nim, {
        total_xp: Number(editTotalXp),
        grades: gradesPayload,
      });
      if (res.success) {
        setManageModalSuccess(res.message);
        setManageModalError('');
        setTimeout(() => {
          setManagingStudent(null);
        }, 500);
      } else {
        setManageModalError(res.message);
      }
    } else {
      const res = ArenaStore.updateUserProgressAndGrades(managingStudent.nim, {
        total_xp: Number(editTotalXp),
        grades: gradesPayload,
      });
      if (res.success) {
        setManageModalSuccess(res.message);
        setManageModalError('');
        setTimeout(() => {
          setManagingStudent(null);
        }, 500);
      } else {
        setManageModalError(res.message);
      }
    }
  };

  const handleExecuteResetSingleGame = (idGame: string) => {
    if (!managingStudent) return;

    if (onResetStudentGame) {
      const res = onResetStudentGame(managingStudent.nim, idGame);
      if (res.success) {
        const currentSubXp = editGrades[idGame]?.skor_xp || 0;
        setEditGrades(prev => ({
          ...prev,
          [idGame]: { nilai_akademik: 0, skor_xp: 0, hasSub: false, enabled: false }
        }));
        setEditTotalXp(prev => Math.max(0, prev - currentSubXp));
        setManageModalSuccess(`Submisi ${idGame} berhasil di-reset.`);
      } else {
        setManageModalError(res.message);
      }
    } else {
      const res = ArenaStore.resetUserGameSubmission(managingStudent.nim, idGame);
      if (res.success) {
        const currentSubXp = editGrades[idGame]?.skor_xp || 0;
        setEditGrades(prev => ({
          ...prev,
          [idGame]: { nilai_akademik: 0, skor_xp: 0, hasSub: false, enabled: false }
        }));
        setEditTotalXp(prev => Math.max(0, prev - currentSubXp));
        setManageModalSuccess(`Submisi ${idGame} berhasil di-reset.`);
      } else {
        setManageModalError(res.message);
      }
    }
    setConfirmResetGame(null);
  };

  const handleExecuteFullResetStudent = () => {
    if (!managingStudent) return;
    onResetStudent(managingStudent.nim);
    setIsConfirmingFullReset(false);
    setManagingStudent(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNim.trim()) {
      setModalError('NIM atau NIDN wajib diisi!');
      return;
    }
    if (!formNama.trim()) {
      setModalError('Nama lengkap wajib diisi!');
      return;
    }

    if (formRole === 'PESERTA' && cohorts.length === 0) {
      setModalError('Wajib membuat minimal 1 kelas / kohort sebelum mendaftarkan akun mahasiswa!');
      return;
    }

    const selectedCohort = cohorts.find(c => c.id_cohort === formCohortId) || cohorts[0];
    let resolvedKlubHari: KlubHari = formRole === 'ADMIN' ? 'ALL' : formClass;
    if (formRole !== 'ADMIN' && selectedCohort) {
      if (selectedCohort.kode_kelas === 'KAMIS' || selectedCohort.kode_kelas === 'JUMAT' || selectedCohort.kode_kelas === 'LOMBA') {
        resolvedKlubHari = selectedCohort.kode_kelas as KlubHari;
      } else {
        resolvedKlubHari = 'ALL';
      }
    }

    const res = onAddUser({
      nim: formNim.trim(),
      nama_lengkap: formNama.trim(),
      role: formRole,
      codename: formCodename.trim() || undefined,
      klub_hari: resolvedKlubHari,
      id_cohort: formRole === 'ADMIN' ? undefined : (selectedCohort?.id_cohort || formCohortId),
      periode: formRole === 'ADMIN' ? undefined : (selectedCohort?.periode || 'Ganjil 2025'),
      prodi: formRole === 'ADMIN' ? 'Dosen STMIK TIME' : formProdi,
      angkatan: Number(formAngkatan) || 2025,
      kelas_reguler: formRole === 'ADMIN' ? 'Dosen Pembina' : formKelasReguler,
    });

    if (res.success) {
      setModalError('');
      setShowAddModal(false);
      // Reset form
      setFormNim('');
      setFormNama('');
      setFormCodename('');
    } else {
      setModalError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header, Counter & Tambah Akun Button */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pemantauan Mahasiswa &amp; Manajemen Akun
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
            Manajemen akun mahasiswa dan dosen. Admin dapat menambahkan akun baru secara manual dan meng-assign ke kelas / kohort pembelajaran secara dinamis.
          </p>
        </div>

        {/* Action Buttons: Buat Kelas, Import CSV/Excel & Tambah Akun Baru */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs shrink-0">
          <button
            onClick={openCreateCohortModal}
            className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-200 hover:text-white font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>+ Buat Kelas / Kohort</span>
          </button>

          <button
            onClick={() => setShowBulkImportModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-200 hover:text-white font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={() => {
              setModalError('');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-blue-100" />
            <span>+ Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Filter, Counter & Search Bar */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Class Filter (Murni Dinamis Berdasarkan Kohort) */}
        <div className="flex flex-wrap items-center gap-1 bg-[#060a14] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => setClassFilter('ALL')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              classFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] opacity-80">({users.filter(u => u.role === 'PESERTA').length})</span>
          </button>

          {cohorts.map(c => {
            const count = users.filter(u => u.role === 'PESERTA' && (u.id_cohort === c.id_cohort || u.klub_hari === c.kode_kelas)).length;
            const isSelected = classFilter === c.id_cohort;

            return (
              <div
                key={c.id_cohort}
                className={`inline-flex items-center rounded transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#111827]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setClassFilter(c.id_cohort)}
                  className="pl-3 pr-1.5 py-1 text-xs font-bold flex items-center gap-1.5"
                >
                  <span>{c.nama_kelas}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditCohortModal(c);
                  }}
                  title={`Edit kelas ${c.nama_kelas} & hak akses paket soal`}
                  className={`pr-2 pl-1 py-1 rounded-r transition-colors ${
                    isSelected
                      ? 'text-blue-100 hover:text-white'
                      : 'text-slate-500 hover:text-blue-400'
                  }`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIM, Nama, atau Codename..."
            className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 3. Students Content (Zero-State Card atau Active Table) */}
      {totalStudentsCount === 0 ? (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-10 sm:p-14 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#111827] border border-[#1e293b] flex items-center justify-center text-slate-400 mb-4">
            <GraduationCap className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Belum Ada Mahasiswa Terdaftar</h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mb-6 leading-relaxed">
            Direktori mahasiswa masih kosong. Buat kelas atau kohort terlebih dahulu jika belum ada, kemudian daftarkan akun mahasiswa baru secara manual.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {cohorts.length === 0 && (
              <button
                onClick={() => {
                  setCohortModalError('');
                  setCohortModalSuccess('');
                  setShowCohortModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-200 hover:text-white font-mono text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>+ Buat Kelas / Kohort</span>
              </button>
            )}
            <button
              onClick={() => {
                setModalError('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-blue-100" />
              <span>+ Tambah Akun Baru</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white">
              Menampilkan {filteredUsers.length} Mahasiswa
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Pangkalan Data Mahasiswa &amp; Kredensial STMIK TIME
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono min-w-[850px]">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b]">
                <tr>
                  <th className="p-3.5">NIM &amp; Kelas</th>
                  <th className="p-3.5">Mahasiswa (Monogram)</th>
                  <th className="p-3.5">Program Studi &amp; Angkatan</th>
                  <th className="p-3.5">Level &amp; Tier</th>
                  <th className="p-3.5">Performa Akademik</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span>Tidak ada mahasiswa yang cocok dengan filter atau pencarian.</span>
                        {(classFilter !== 'ALL' || searchQuery.trim() !== '') && (
                          <button
                            onClick={() => {
                              setClassFilter('ALL');
                              setSearchQuery('');
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 underline font-mono font-bold"
                          >
                            Reset Filter &amp; Pencarian
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const userSubs = submissions.filter(s => s.nim === u.nim && s.status_sesi === 'DONE');
                    const solvedCount = userSubs.filter(s => s.status_lulus === 'LULUS' || s.nilai_akademik >= 50).length;
                    const totalNilai = userSubs.reduce((acc, s) => acc + s.nilai_akademik, 0);
                    const rataNilai = userSubs.length > 0 ? Math.round(totalNilai / userSubs.length) : 0;

                    return (
                      <tr key={u.nim} className="hover:bg-[#111827]/60 transition-colors">
                        {/* NIM & Kelas */}
                        <td className="p-3.5">
                          <span className="font-bold text-white">{u.nim}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            {(() => {
                              const cohortObj = cohorts.find(c => c.id_cohort === u.id_cohort || c.kode_kelas === u.id_cohort || c.kode_kelas === u.klub_hari);
                              const label = cohortObj ? cohortObj.nama_kelas : (u.klub_hari && u.klub_hari !== 'ALL' ? `Kelas ${u.klub_hari}` : 'Reguler');
                              return (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-300 border-blue-500/25">
                                  {label}
                                </span>
                              );
                            })()}
                            {u.periode && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/50">
                                {u.periode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Mahasiswa Info dengan Industrial Monochrome Avatar */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={u} size="md" />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate">
                                {u.nama_lengkap}
                              </div>
                              <div className="text-xs text-blue-400 font-bold mt-0.5">
                                @{u.codename}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Prodi & Kelas Reguler */}
                        <td className="p-3.5">
                          <div className="text-slate-300 font-bold">
                            {u.prodi} ({u.angkatan})
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {u.kelas_reguler}
                          </div>
                        </td>

                        {/* Level & Tier Badge */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <Flame className="w-3.5 h-3.5" />
                            <span>Level {u.level}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {u.tier_badge}
                          </div>
                        </td>

                        {/* Total XP & Rata Nilai */}
                        <td className="p-3.5">
                          <div className="font-extrabold text-blue-400">
                            {u.total_xp} <span className="text-[10px] font-normal text-slate-400">XP</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Rata: <strong className={rataNilai >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{rataNilai}/100</strong> • {solvedCount} AC
                          </div>
                        </td>

                        {/* Aksi Kelola Progres & Delete */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenManageModal(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] hover:border-blue-500/40 text-blue-400 hover:text-white transition-all flex items-center gap-1.5 font-bold shadow-sm"
                              title={`Kelola Progres, Edit Nilai & Reset ${u.nama_lengkap} (${u.nim})`}
                            >
                              <Settings className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-[11px]">Kelola</span>
                            </button>
                            <button
                              onClick={() => setDeletingStudent(u)}
                              className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-white transition-all shadow-sm"
                              title={`Hapus Akun ${u.nama_lengkap} (${u.nim})`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL TAMBAH AKUN BARU (CLEAN INDUSTRIAL FORM) */}
      {showAddModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-lg w-full shadow-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-base">
                    Tambah Akun Pengguna Baru
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Role Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Peran Pengguna (Role)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#060a14] p-1 rounded-lg border border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setFormRole('PESERTA')}
                    className={`py-1.5 rounded-md font-bold text-center transition-colors ${
                      formRole === 'PESERTA'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mahasiswa (Peserta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole('ADMIN')}
                    className={`py-1.5 rounded-md font-bold text-center transition-colors ${
                      formRole === 'ADMIN'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dosen (Admin)
                  </button>
                </div>
              </div>

              {/* NIM & Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {formRole === 'ADMIN' ? 'NIDN / NIP' : 'NIM Mahasiswa'} *
                  </label>
                  <input
                    type="text"
                    value={formNim}
                    onChange={(e) => setFormNim(e.target.value)}
                    placeholder={formRole === 'ADMIN' ? 'Contoh: DOSEN-02' : 'Contoh: 250201099'}
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Codename */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contest Codename (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                  <input
                    type="text"
                    value={formCodename}
                    onChange={(e) => setFormCodename(e.target.value)}
                    placeholder="Budi_Algo (Otomatis jika kosong)"
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Mahasiswa Specific Fields */}
              {formRole === 'PESERTA' && (
                <div className="space-y-3 pt-2 border-t border-[#1e293b]">
                  {/* Pilihan Kelas Kohort Dinamis */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">
                        Kelas &amp; Kohort Pembelajaran *
                      </label>
                      <button
                        type="button"
                        onClick={openCreateCohortModal}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1"
                      >
                        + Buat Kelas Baru
                      </button>
                    </div>
                    {cohorts.length === 0 ? (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono">
                        Belum ada kelas / kohort terdaftar. Buat kelas terlebih dahulu dengan menekan tombol &quot;+ Buat Kelas Baru&quot; di atas sebelum mendaftarkan mahasiswa.
                      </div>
                    ) : (
                      <>
                        <select
                          value={formCohortId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            setFormCohortId(selectedId);
                            const c = cohorts.find(ch => ch.id_cohort === selectedId);
                            if (c) {
                              if (c.kode_kelas === 'KAMIS' || c.kode_kelas === 'JUMAT' || c.kode_kelas === 'LOMBA') {
                                setFormClass(c.kode_kelas as KlubHari);
                              } else {
                                setFormClass('ALL');
                              }
                            }
                          }}
                          className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 font-bold"
                        >
                          {cohorts.map((c) => (
                            <option key={c.id_cohort} value={c.id_cohort}>
                              {c.nama_kelas} • Periode: {c.periode} ({c.allowed_game_ids.length} Paket Soal)
                            </option>
                          ))}
                        </select>

                        {/* Active Cohort Details Card */}
                        {(() => {
                          const activeCohort = cohorts.find(c => c.id_cohort === formCohortId) || cohorts[0];
                          if (!activeCohort) return null;
                          return (
                            <div className="mt-2 p-2.5 rounded-lg bg-[#0c1222] border border-[#1f2d48] text-xs font-mono space-y-1">
                              <div className="flex items-center justify-between text-slate-300">
                                <span>Periode Terdaftar:</span>
                                <span className="font-bold text-blue-400 px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">
                                  {activeCohort.periode}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Akses Paket Soal:</span>
                                <span className="font-bold text-emerald-400">
                                  {activeCohort.allowed_game_ids.length} Paket ({activeCohort.allowed_game_ids.join(', ')})
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    <p className="text-[11px] text-slate-400 mt-1">
                      Mahasiswa hanya dapat mengakses soal dan kontes yang aktif di kelas yang di-assign.
                    </p>
                  </div>

                  {/* Prodi & Angkatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Program Studi
                      </label>
                      <select
                        value={formProdi}
                        onChange={(e) => setFormProdi(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="Sistem Informasi">Sistem Informasi</option>
                        <option value="Teknik Informatika">Teknik Informatika</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Angkatan &amp; Kelas Reguler
                      </label>
                      <input
                        type="text"
                        value={formKelasReguler}
                        onChange={(e) => setFormKelasReguler(e.target.value)}
                        placeholder="Contoh: SI C 25"
                        className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Default Notice */}
              <div className="p-2.5 rounded-lg bg-[#060a14] border border-[#1e293b] text-[11px] text-slate-400">
                Kredensial login default untuk akun baru adalah <strong>NIM/NIDN</strong> terdaftar.
              </div>

              {/* Error Alert */}
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm transition-colors"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* MODAL: Buat Kelas & Kohort Pembelajaran Baru */}
      {showCohortModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowCohortModal(false)}
          >
            <div
              className="bg-[#0c1222] border border-[#1f2d48] rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 text-xs font-mono max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingCohort ? `Edit Kelas: ${editingCohort.nama_kelas}` : 'Buat Kelas & Kohort Pembelajaran Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCohort(null);
                  setShowCohortModal(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151f33] transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCohortSubmit} className="space-y-4 pt-4">
              {/* Nama Kelas */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Kelas &amp; Kohort *
                </label>
                <input
                  type="text"
                  value={cohortNama}
                  onChange={(e) => setCohortNama(e.target.value)}
                  placeholder="Contoh: Kelas Algoritma & Pemrograman C"
                  className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Kode Kelas & Periode (Paired Segmented Control) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kode Kelas *
                  </label>
                  <input
                    type="text"
                    value={cohortKode}
                    onChange={(e) => setCohortKode(e.target.value)}
                    placeholder="Contoh: ALGO-C-25"
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Periode Akademik *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={cohortSemester}
                      onChange={(e) => setCohortSemester(e.target.value as 'Ganjil' | 'Genap')}
                      className="bg-[#111827] border border-[#1e293b] rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500 font-semibold shrink-0"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                    <input
                      type="number"
                      value={cohortTahun}
                      onChange={(e) => setCohortTahun(e.target.value)}
                      placeholder="2025"
                      min={2020}
                      max={2035}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format: &lt;Ganjil/Genap&gt; &lt;Tahun&gt; &bull; Hasil: <strong className="text-blue-400">{cohortSemester} {cohortTahun}</strong>
                  </p>
                </div>
              </div>

              {/* Deskripsi Opsional */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Deskripsi / Catatan Kelas (Opsional)
                </label>
                <input
                  type="text"
                  value={cohortDeskripsi}
                  onChange={(e) => setCohortDeskripsi(e.target.value)}
                  placeholder="Keterangan singkat tentang silabus atau tujuan kohort ini..."
                  className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Resource Access Matrix Checkbox (100% Murni Dinamis dari Paket Soal Terdaftar) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    Hak Akses Paket Soal (Opsional)
                  </label>
                  {availableGamePackages.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setCohortAllowedGames(availableGamePackages.map(g => g.id))}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setCohortAllowedGames([])}
                        className="text-slate-400 hover:text-white underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  )}
                </div>

                {availableGamePackages.length === 0 ? (
                  <div className="bg-[#080d18] border border-[#1a2333] rounded-xl p-3.5 text-slate-400 text-xs leading-relaxed">
                    Belum ada paket soal / kontes yang dibuat di sistem. Anda dapat langsung menyimpan kelas ini sekarang, lalu menetapkan hak akses paket soal kapan saja melalui tombol <strong className="text-slate-200">Edit Kelas</strong> setelah membuat paket di menu Manajemen Kontes.
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-[#080d18] border border-[#1a2333] rounded-xl p-3 max-h-48 overflow-y-auto">
                    {availableGamePackages.map((pkg) => {
                      const isChecked = cohortAllowedGames.includes(pkg.id);
                      return (
                        <label
                          key={pkg.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${
                            isChecked
                              ? 'bg-blue-950/30 border-blue-500/30 text-white'
                              : 'bg-transparent border-transparent text-slate-400 hover:bg-[#111827]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCohortAllowedGames([...cohortAllowedGames, pkg.id]);
                              } else {
                                setCohortAllowedGames(cohortAllowedGames.filter(id => id !== pkg.id));
                              }
                            }}
                            className="rounded border-[#1e293b] text-blue-600 focus:ring-0 bg-[#111827] w-4 h-4"
                          />
                          <span className="font-bold text-xs">{pkg.id}</span>
                          <span className="text-xs truncate">{pkg.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Mahasiswa di kelas ini hanya dapat melihat dan mengakses paket soal yang dicentang ({cohortAllowedGames.length} paket dipilih).
                </p>
              </div>

              {/* Alert Feedback */}
              {cohortModalError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cohortModalError}</span>
                </div>
              )}
              {cohortModalSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{cohortModalSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e293b]">
                <div>
                  {editingCohort && (
                    <button
                      type="button"
                      onClick={handleDeleteEditingCohort}
                      className="px-3 py-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 hover:text-white font-bold transition-colors flex items-center gap-1.5"
                      title="Hapus kelas jika tidak ada mahasiswa terdaftar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Kelas</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCohort(null);
                      setShowCohortModal(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                  >
                    {editingCohort ? 'Simpan Perubahan Kelas' : 'Simpan Kelas Baru'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* 5. MODAL KELOLA NILAI & PROGRES MAHASISWA (ZERO AI SLOP - SOLID INDUSTRIAL DARK) */}
      {managingStudent && (() => {
        const activeGradesList = Object.entries(editGrades).filter(([_, v]) => v.enabled || v.hasSub);
        const liveAverageGrade = activeGradesList.length > 0
          ? Math.round(activeGradesList.reduce((acc, [_, v]) => acc + Number(v.nilai_akademik || 0), 0) / activeGradesList.length)
          : 0;
        const liveLevelInfo = calculateLevelInfo(Number(editTotalXp) || 0);

        return (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
              onClick={() => setManagingStudent(null)}
            >
              <div
                className="bg-[#0c1222] border border-[#1f2d48] rounded-2xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 text-xs font-mono max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                <div className="flex items-center gap-3">
                  <UserAvatar user={managingStudent} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {managingStudent.nama_lengkap}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 font-bold">
                        {managingStudent.nim}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>@{managingStudent.codename}</span>
                      <span>&bull;</span>
                      <span>{ArenaStore.resolveUserCohortName(managingStudent, cohorts)}</span>
                      {managingStudent.periode && (
                        <>
                          <span>&bull;</span>
                          <span className="text-blue-300">{managingStudent.periode}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingStudent(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151f33] transition-colors"
                  aria-label="Tutup modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStudentProgress} className="space-y-4 pt-4">
                {/* Bagian 1: Override Total XP & Live Leveling */}
                <div className="p-3.5 bg-[#080d18] border border-[#1a2333] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>Penyesuaian Total Skor XP</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-amber-400 font-bold">
                        Level {liveLevelInfo.level}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-300">{liveLevelInfo.tierBadge}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={editTotalXp}
                      onChange={(e) => setEditTotalXp(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Contoh: 1200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const totalFromSubs = Object.entries(editGrades)
                          .filter(([_, v]) => v.enabled || v.hasSub)
                          .reduce((acc, [_, v]) => acc + Number(v.skor_xp || 0), 0);
                        setEditTotalXp(totalFromSubs);
                      }}
                      className="px-3 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white text-xs font-semibold shrink-0 transition-colors"
                      title="Hitung ulang total XP dari penjumlahan kuis di bawah"
                    >
                      Hitung dari Kuis
                    </button>
                  </div>
                </div>

                {/* Bagian 2: Matriks Submisi Nilai per Pertemuan (G1 s.d. G7) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold">
                      Nilai Akademik &amp; Kuis per Pertemuan
                    </label>
                    <div className="text-[11px] text-slate-400">
                      Nilai Rata-rata Terkini:{' '}
                      <strong className={`font-bold ${liveAverageGrade >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {liveAverageGrade}/100
                      </strong>{' '}
                      ({activeGradesList.length} Paket)
                    </div>
                  </div>

                  <div className="bg-[#080d18] border border-[#1a2333] rounded-xl overflow-hidden">
                    {availableGamePackages.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 font-mono">
                        Belum ada paket soal / kontes yang terdaftar di sistem.
                      </div>
                    ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b]">
                        <tr>
                          <th className="p-2.5">Paket Pertemuan</th>
                          <th className="p-2.5 w-32">Nilai (0–100)</th>
                          <th className="p-2.5 w-24">Skor XP</th>
                          <th className="p-2.5 text-right w-36">Aksi Pertemuan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]">
                        {availableGamePackages.map((pkg) => {
                          const gradeData = editGrades[pkg.id] || { nilai_akademik: 0, skor_xp: 0, hasSub: false, enabled: false };
                          const isActive = gradeData.hasSub || gradeData.enabled;

                          return (
                            <tr key={pkg.id} className="hover:bg-[#111827]/40 transition-colors">
                              {/* Nama Paket */}
                              <td className="p-2.5">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{pkg.id}</span>
                                  <span className="text-slate-400 font-normal text-[11px] truncate max-w-[180px] sm:max-w-[220px]">
                                    {pkg.label}
                                  </span>
                                </div>
                                <div className="text-[10px] mt-0.5">
                                  {gradeData.hasSub ? (
                                    <span className="text-emerald-400 font-medium">✓ Submisi Tercatat</span>
                                  ) : gradeData.enabled ? (
                                    <span className="text-blue-400 font-medium">+ Input Manual Aktif</span>
                                  ) : (
                                    <span className="text-slate-500 font-normal">Belum Dikerjakan</span>
                                  )}
                                </div>
                              </td>

                              {/* Input Nilai Akademik */}
                              <td className="p-2.5">
                                {isActive ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={gradeData.nilai_akademik}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                      setEditGrades(prev => ({
                                        ...prev,
                                        [pkg.id]: { ...prev[pkg.id], nilai_akademik: val }
                                      }));
                                    }}
                                    className="w-24 bg-[#111827] border border-[#1e293b] rounded px-2 py-1 text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                                  />
                                ) : (
                                  <span className="text-slate-600 font-mono text-xs">-</span>
                                )}
                              </td>

                              {/* Input Skor XP */}
                              <td className="p-2.5">
                                {isActive ? (
                                  <input
                                    type="number"
                                    min={0}
                                    value={gradeData.skor_xp}
                                    onChange={(e) => {
                                      const val = Math.max(0, Number(e.target.value) || 0);
                                      setEditGrades(prev => ({
                                        ...prev,
                                        [pkg.id]: { ...prev[pkg.id], skor_xp: val }
                                      }));
                                    }}
                                    className="w-20 bg-[#111827] border border-[#1e293b] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                                  />
                                ) : (
                                  <span className="text-slate-600 font-mono text-xs">-</span>
                                )}
                              </td>

                              {/* Aksi Pertemuan */}
                              <td className="p-2.5 text-right">
                                {gradeData.hasSub ? (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmResetGame({ idGame: pkg.id, label: pkg.label })}
                                    className="px-2 py-1 rounded bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                                    title={`Reset submisi kuis ${pkg.id} agar mahasiswa bisa ujian ulang`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset Kuis</span>
                                  </button>
                                ) : !gradeData.enabled ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditGrades(prev => ({
                                        ...prev,
                                        [pkg.id]: { nilai_akademik: 75, skor_xp: 50, hasSub: false, enabled: true }
                                      }));
                                    }}
                                    className="px-2 py-1 rounded bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-blue-400 text-[11px] font-semibold transition-colors ml-auto"
                                  >
                                    + Input Nilai
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditGrades(prev => ({
                                        ...prev,
                                        [pkg.id]: { ...prev[pkg.id], enabled: false }
                                      }));
                                    }}
                                    className="text-[11px] text-slate-500 hover:text-slate-300 underline ml-auto"
                                  >
                                    Batal Input
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    )}
                  </div>
                </div>

                {/* Alert Feedback */}
                {manageModalError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{manageModalError}</span>
                  </div>
                )}
                {manageModalSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{manageModalSuccess}</span>
                  </div>
                )}

                {/* Modal Footer: Reset Sandi & Reset Progres (Kiri) + Simpan Perubahan (Kanan) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1e293b]">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingPasswordReset(true)}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 hover:text-white font-bold transition-colors flex items-center justify-center gap-1.5"
                      title="Reset kata sandi mahasiswa kembali ke NIM bawaan"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Sandi ke NIM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsConfirmingFullReset(true)}
                      className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 hover:text-white font-bold transition-colors flex items-center justify-center gap-1.5"
                      title="Hapus seluruh submisi dan reset XP mahasiswa ke 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Progres</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setManagingStudent(null)}
                      className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        );
      })()}

      {/* 6. MODAL KONFIRMASI HAPUS AKUN (PURE SOLID INDUSTRIAL DARK - ZERO AI SLOP) */}
      {deletingStudent && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setDeletingStudent(null)}
          >
            <div
              className="bg-[#0c1222] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Dialog */}
              <div className="flex items-start gap-3.5 pb-4 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Hapus Akun Pengguna?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tindakan ini permanen dan akan menghapus seluruh data terkait.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingStudent(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151f33] transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Information Card */}
              <div className="my-4 p-3.5 rounded-xl bg-[#080d18] border border-[#1a2333] space-y-2.5">
                <div className="flex items-center gap-3">
                  <UserAvatar user={deletingStudent} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm truncate">
                      {deletingStudent.nama_lengkap}
                    </div>
                    <div className="text-[11px] text-blue-400 font-bold mt-0.5">
                      @{deletingStudent.codename}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1a2333] text-[11px]">
                  <div>
                    <span className="text-slate-500 block">NIM/NIDN</span>
                    <span className="font-bold text-slate-200">{deletingStudent.nim}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kelas / Kohort</span>
                    <span className="font-bold text-slate-200">
                      {ArenaStore.resolveUserCohortName(deletingStudent, cohorts)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Destructive Warning Box */}
              <div className="p-3 rounded-lg bg-rose-950/25 border border-rose-500/25 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>
                  Seluruh riwayat submisi kuis, skor XP, status kelulusan, dan keanggotaan tim mahasiswa ini akan dihapus secara permanen dari database.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setDeletingStudent(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteUser(deletingStudent.nim);
                    setDeletingStudent(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Akun</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 7. MODAL KONFIRMASI RESET KUIS PER PERTEMUAN (ZERO AI SLOP) */}
      {confirmResetGame && managingStudent && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setConfirmResetGame(null)}
          >
            <div
              className="bg-[#0c1222] border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 pb-3 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Reset Kuis {confirmResetGame.idGame}?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mahasiswa: <strong className="text-white">{managingStudent.nama_lengkap}</strong>
                  </p>
                </div>
              </div>

              <div className="my-4 p-3 rounded-lg bg-amber-950/20 border border-amber-500/25 text-amber-300 text-xs leading-relaxed space-y-2">
                <p>
                  Submisi paket <strong>{confirmResetGame.label}</strong> akan dihapus. Skor XP dari kuis ini akan ditarik dan status kuis akan <strong>terbuka kembali</strong> untuk mahasiswa agar dapat mengikuti ujian susulan / remedial.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setConfirmResetGame(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteResetSingleGame(confirmResetGame.idGame)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ya, Reset Kuis</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 8. MODAL KONFIRMASI RESET KESELURUHAN DATA PROGRES (ZERO AI SLOP) */}
      {isConfirmingFullReset && managingStudent && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsConfirmingFullReset(false)}
          >
            <div
              className="bg-[#0c1222] border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 pb-3 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Reset KESELURUHAN Progres?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mahasiswa: <strong className="text-white">{managingStudent.nama_lengkap}</strong> ({managingStudent.nim})
                  </p>
                </div>
              </div>

              <div className="my-4 p-3 rounded-lg bg-rose-950/25 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1.5">
                <p className="font-bold text-rose-200">
                  PERINGATAN AKADEMIK:
                </p>
                <p>
                  Seluruh riwayat submisi (G1 s.d. G7) akan dihapus total. Total skor XP akan dikembalikan ke <strong>0 XP</strong>, level menjadi <strong>Level 1</strong>, dan tier badge kembali ke <strong>🌱 Logic Novice</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsConfirmingFullReset(false)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteFullResetStudent}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ya, Reset Seluruh Data</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 9. MODAL KONFIRMASI RESET KATA SANDI MAHASISWA KE NIM (ZERO AI SLOP) */}
      {isConfirmingPasswordReset && managingStudent && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => !isResettingPassword && setIsConfirmingPasswordReset(false)}
          >
            <div
              className="bg-[#0c1222] border border-amber-500/35 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 pb-4 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Reset Kata Sandi ke NIM?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Mahasiswa: <strong className="text-white">{managingStudent.nama_lengkap}</strong> ({managingStudent.nim})
                  </p>
                </div>
              </div>

              <div className="my-4 p-3 rounded-lg bg-[#070b14] border border-[#1e293b] text-slate-300 text-xs leading-relaxed space-y-1.5">
                <p>
                  Kata sandi mahasiswa akan dikembalikan ke NIM (<strong className="text-amber-300">{managingStudent.nim}</strong>).
                </p>
                <p className="text-slate-400">
                  Status akun otomatis disetel ulang agar mahasiswa wajib menetapkan kata sandi pribadi baru pada login berikutnya.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  disabled={isResettingPassword}
                  onClick={() => setIsConfirmingPasswordReset(false)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isResettingPassword}
                  onClick={async () => {
                    setIsResettingPassword(true);
                    setManageModalError('');
                    setManageModalSuccess('');
                    const res = onAdminResetPassword
                      ? await onAdminResetPassword(managingStudent.nim)
                      : ArenaStore.adminResetPassword(managingStudent.nim);
                    setIsResettingPassword(false);
                    setIsConfirmingPasswordReset(false);
                    if (res.success) {
                      setManageModalSuccess(res.message);
                    } else {
                      setManageModalError(res.message);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isResettingPassword ? 'Mereset...' : 'Ya, Reset ke NIM'}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 10. MODAL IMPORT MASSAL MAHASISWA (CSV / EXCEL) */}
      <BulkImportStudentsModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        cohorts={cohorts}
        existingUsers={users}
        onBulkImport={(dtos) => {
          if (onBulkAddUsers) {
            return onBulkAddUsers(dtos);
          }
          return ArenaStore.bulkCreateUsers(dtos);
        }}
      />
    </div>
  );
}
