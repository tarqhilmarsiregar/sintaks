'use client';

import React, { useState, useMemo } from 'react';
import { Game, GameStatus, GameDifficulty, GameMode, Cohort, CreateGameDTO, ICPC_PROBLEMS_DEF } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import ModalPortal from '@/components/common/ModalPortal';
import {
  Shuffle,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Sliders,
  Trophy,
  Plus,
  Edit3,
  X,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';

interface AdminContestControlTabProps {
  games: Game[];
  cohorts?: Cohort[];
  onToggleStatus?: (gameId: string, day: 'KAMIS' | 'JUMAT' | 'LOMBA', newStatus: GameStatus) => void;
  onToggleCohortStatus?: (gameId: string, cohortIdOrCode: string, newStatus: GameStatus) => void;
  onCreateGame?: (dto: CreateGameDTO) => { success: boolean; message: string };
  onUpdateGame?: (gameId: string, updates: Partial<Game> & { allowed_cohort_ids?: string[] }) => { success: boolean; message: string };
  onRandomPin: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  onFreezeClass?: (day: 'KAMIS' | 'JUMAT' | 'LOMBA') => void;
  onUnfreezeClass?: (day: 'KAMIS' | 'JUMAT' | 'LOMBA') => void;
  onFreezeCohort?: (cohortIdOrCode: string) => void;
  onUnfreezeCohort?: (cohortIdOrCode: string) => void;
}

export default function AdminContestControlTab({
  games,
  cohorts = [],
  onToggleStatus,
  onToggleCohortStatus,
  onCreateGame,
  onUpdateGame,
  onRandomPin,
  onDeleteGame,
  onFreezeClass,
  onUnfreezeClass,
  onFreezeCohort,
  onUnfreezeCohort,
}: AdminContestControlTabProps) {
  // 1. Inisialisasi Cohorts Aktif (100% Dinamis dari Props atau ArenaStore)
  const activeCohorts: Cohort[] = useMemo(() => {
    if (cohorts && cohorts.length > 0) return cohorts;
    return ArenaStore.getCohorts();
  }, [cohorts]);

  // 2. State Filter Kelas Aktif
  const [selectedCohortId, setSelectedCohortId] = useState<string>('ALL');

  // 3. State Modal Buat Paket Kontes Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formIdGame, setFormIdGame] = useState('');
  const [formJudul, setFormJudul] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formKategori, setFormKategori] = useState('');
  const [formKesulitan, setFormKesulitan] = useState<GameDifficulty>('Medium');
  const [formMode, setFormMode] = useState<GameMode>('SOLO');
  const [formPin, setFormPin] = useState('');
  const [formDurasiTotal, setFormDurasiTotal] = useState(30);
  const [formDurasiSoal, setFormDurasiSoal] = useState(60);
  const [formMinNilai, setFormMinNilai] = useState(70);
  const [formAllowedCohorts, setFormAllowedCohorts] = useState<string[]>([]);
  const [formInitialStatus, setFormInitialStatus] = useState<GameStatus>('UPCOMING');
  const [formError, setFormError] = useState<string | null>(null);

  // 4. State Modal Edit Paket Kontes
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editJudul, setEditJudul] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editKategori, setEditKategori] = useState('');
  const [editKesulitan, setEditKesulitan] = useState<GameDifficulty>('Medium');
  const [editMode, setEditMode] = useState<GameMode>('SOLO');
  const [editPin, setEditPin] = useState('');
  const [editDurasiTotal, setEditDurasiTotal] = useState(30);
  const [editDurasiSoal, setEditDurasiSoal] = useState(60);
  const [editMinNilai, setEditMinNilai] = useState(70);
  const [editAllowedCohorts, setEditAllowedCohorts] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  // 5. State Modal Konfirmasi Hapus Game
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);

  // 6. State Filter & Search Paket Kontes
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'SOLO' | 'TEAM'>('ALL');

  // Filtered games based on search query and mode filter
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (modeFilter !== 'ALL' && game.mode_game !== modeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = game.id_game.toLowerCase().includes(q);
        const matchJudul = (game.judul_game || '').toLowerCase().includes(q);
        const matchKategori = (game.kategori_materi || '').toLowerCase().includes(q);
        const matchRef = (game.ref_pertemuan || '').toLowerCase().includes(q);
        const matchKesulitan = (game.kesulitan || '').toLowerCase().includes(q);
        if (!matchId && !matchJudul && !matchKategori && !matchRef && !matchKesulitan) {
          return false;
        }
      }
      return true;
    });
  }, [games, searchQuery, modeFilter]);

  // Helper untuk membaca status game pada kohort tertentu
  const getStatusForCohort = (game: Game, cId: string): GameStatus => {
    return ArenaStore.getGameStatusForCohort(game, cId);
  };

  // Helper handler toggle status
  const handleToggle = (gameId: string, cId: string, newStatus: GameStatus) => {
    if (onToggleCohortStatus) {
      onToggleCohortStatus(gameId, cId, newStatus);
    } else if (onToggleStatus) {
      const day = cId === 'c-jumat' || cId === 'JUMAT' ? 'JUMAT' : cId === 'c-lomba' || cId === 'LOMBA' ? 'LOMBA' : 'KAMIS';
      onToggleStatus(gameId, day, newStatus);
    }
  };

  // Helper handler freeze/unfreeze
  const handleFreeze = (cId: string) => {
    if (onFreezeCohort) {
      onFreezeCohort(cId);
    } else if (onFreezeClass) {
      const day = cId === 'c-jumat' || cId === 'JUMAT' ? 'JUMAT' : cId === 'c-lomba' || cId === 'LOMBA' ? 'LOMBA' : 'KAMIS';
      onFreezeClass(day);
    }
  };

  const handleUnfreeze = (cId: string) => {
    if (onUnfreezeCohort) {
      onUnfreezeCohort(cId);
    } else if (onUnfreezeClass) {
      const day = cId === 'c-jumat' || cId === 'JUMAT' ? 'JUMAT' : cId === 'c-lomba' || cId === 'LOMBA' ? 'LOMBA' : 'KAMIS';
      onUnfreezeClass(day);
    }
  };

  // Buka Modal Buat Game Baru dengan default
  const handleOpenCreateModal = () => {
    let nextNum = 1;
    games.forEach(g => {
      const m = g.id_game.match(/^G(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= nextNum) nextNum = n + 1;
      }
    });

    setFormIdGame(`G${nextNum}`);
    setFormRef(`Pertemuan ${nextNum}`);
    setFormJudul('');
    setFormKategori('Algoritma & Struktur Data');
    setFormKesulitan('Medium');
    setFormMode('SOLO');
    setFormPin('');
    setFormDurasiTotal(30);
    setFormDurasiSoal(60);
    setFormMinNilai(70);
    // Default aman: [] (Draft / Belum Ditugaskan) agar tidak membocorkan paket baru ke seluruh kelas
    setFormAllowedCohorts([]);
    setFormInitialStatus('UPCOMING');
    setFormError(null);
    setShowCreateModal(true);
  };

  // Submit Buat Game Baru
  const handleFormCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      setFormError('Judul paket kontes wajib diisi!');
      return;
    }
    if (!formRef.trim()) {
      setFormError('Referensi pertemuan wajib diisi!');
      return;
    }
    if (!formKategori.trim()) {
      setFormError('Kategori materi wajib diisi!');
      return;
    }

    const dto: CreateGameDTO = {
      id_game: formIdGame.trim().toUpperCase() || undefined,
      ref_pertemuan: formRef.trim(),
      judul_game: formJudul.trim(),
      kategori_materi: formKategori.trim(),
      kesulitan: formKesulitan,
      mode_game: formMode,
      pin_akses: formMode === 'TEAM' ? (formPin.trim() || undefined) : undefined,
      durasi_total_menit: Number(formDurasiTotal) || 30,
      durasi_per_soal_detik: Number(formDurasiSoal) || 60,
      min_nilai_lulus: Number(formMinNilai) || 70,
      allowed_cohort_ids: formAllowedCohorts,
      initial_status: formInitialStatus,
    };

    if (onCreateGame) {
      const res = onCreateGame(dto);
      if (res.success) {
        setShowCreateModal(false);
      } else {
        setFormError(res.message);
      }
    } else {
      const res = ArenaStore.createGame(dto);
      if (res.success) {
        setShowCreateModal(false);
      } else {
        setFormError(res.message);
      }
    }
  };

  // Buka Modal Edit Game
  const handleOpenEditModal = (game: Game) => {
    setEditingGame(game);
    setEditJudul(game.judul_game);
    setEditRef(game.ref_pertemuan);
    setEditKategori(game.kategori_materi);
    setEditKesulitan(game.kesulitan);
    setEditMode(game.mode_game);
    setEditPin(game.pin_akses || '');
    setEditDurasiTotal(game.durasi_total_menit);
    setEditDurasiSoal(game.durasi_per_soal_detik);
    setEditMinNilai(game.min_nilai_lulus);

    // Cari kelas yang saat ini memiliki hak akses ke game ini
    const allowed = activeCohorts
      .filter(c => c.allowed_game_ids && c.allowed_game_ids.includes(game.id_game))
      .map(c => c.id_cohort);
    setEditAllowedCohorts(allowed);
    setEditError(null);
  };

  // Submit Edit Game
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;
    if (!editJudul.trim()) {
      setEditError('Judul paket kontes wajib diisi!');
      return;
    }

    const updates = {
      judul_game: editJudul.trim(),
      ref_pertemuan: editRef.trim(),
      kategori_materi: editKategori.trim(),
      kesulitan: editKesulitan,
      mode_game: editMode,
      pin_akses: editMode === 'TEAM' ? (editPin.trim() || undefined) : undefined,
      durasi_total_menit: Number(editDurasiTotal) || 30,
      durasi_per_soal_detik: Number(editDurasiSoal) || 60,
      min_nilai_lulus: Number(editMinNilai) || 70,
      allowed_cohort_ids: editAllowedCohorts,
    };

    if (onUpdateGame) {
      const res = onUpdateGame(editingGame.id_game, updates);
      if (res.success) {
        setEditingGame(null);
      } else {
        setEditError(res.message);
      }
    } else {
      const res = ArenaStore.updateGame(editingGame.id_game, updates);
      if (res.success) {
        setEditingGame(null);
      } else {
        setEditError(res.message);
      }
    }
  };

  // Filter game jika ada kelas tertentu yang dipilih
  const displayCohorts = useMemo(() => {
    if (selectedCohortId === 'ALL') return activeCohorts;
    return activeCohorts.filter(c => c.id_cohort === selectedCohortId);
  }, [activeCohorts, selectedCohortId]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Deskripsi Resmi */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Kontrol Kontes &amp; Saklar Status Independen
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
            Cockpit pengontrol status kompetisi real-time (UPCOMING, OPEN, FROZEN, ENDED) untuk seluruh kelas pembelajaran dan kohort dinamis. Mahasiswa hanya dapat mengakses soal yang berstatus aktif di kelasnya.
          </p>
        </div>

        {/* Master Action: Tambah Paket Kontes Baru */}
        <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Paket Kontes Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Dynamic Class Bar & Quick Freeze Controls */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-4 font-mono text-xs space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              Pilih Ruang Lingkup Kelas / Kohort:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Total Kelas Terdaftar:</span>
            <span className="font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {activeCohorts.length} Kelas
            </span>
          </div>
        </div>

        {/* Class Filter Pills */}
        {activeCohorts.length === 0 ? (
          <div className="p-3.5 rounded-lg bg-[#070c18] border border-[#1e293b] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0" />
              <span>Belum ada kelas / kohort terdaftar. Seluruh kelas bersifat 100% dinamis (hanya muncul saat dibuat manual oleh Admin).</span>
            </div>
            <a
              href="/admin/students"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111827] hover:bg-[#18233c] text-blue-400 hover:text-blue-300 font-bold border border-[#1e293b] text-xs shrink-0 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Buat Kelas di Data Mahasiswa</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCohortId('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
                selectedCohortId === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#111827] text-slate-300 hover:text-white border border-[#1e293b]'
              }`}
            >
              <span>Semua Kelas ({activeCohorts.length})</span>
            </button>

            {activeCohorts.map(cohort => {
              const isSelected = selectedCohortId === cohort.id_cohort;
              const cohortGames = games.filter(g => cohort.allowed_game_ids?.includes(g.id_game));
              const openCount = cohortGames.filter(g => getStatusForCohort(g, cohort.id_cohort) === 'OPEN').length;
              const frozenCount = cohortGames.filter(g => getStatusForCohort(g, cohort.id_cohort) === 'FROZEN').length;

              return (
                <button
                  key={cohort.id_cohort}
                  onClick={() => setSelectedCohortId(cohort.id_cohort)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#111827] text-slate-300 hover:text-white border border-[#1e293b]'
                  }`}
                >
                  <span>{cohort.nama_kelas}</span>
                  {openCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title={`${openCount} Game OPEN`} />
                  )}
                  {frozenCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title={`${frozenCount} Game FROZEN`} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Freeze Bar untuk Kelas yang Dipilih / Aktif (Hanya tampil jika ada kelas terdaftar) */}
        {activeCohorts.length > 0 && (
          <div className="pt-2 border-t border-[#1e293b] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Quick Master Freeze:</span>
            {displayCohorts.map(cohort => {
              const cohortGames = games.filter(g => cohort.allowed_game_ids?.includes(g.id_game));
              const openCount = cohortGames.filter(g => getStatusForCohort(g, cohort.id_cohort) === 'OPEN').length;
              const frozenCount = cohortGames.filter(g => getStatusForCohort(g, cohort.id_cohort) === 'FROZEN').length;

              return (
                <div
                  key={cohort.id_cohort}
                  className="p-1.5 px-2.5 rounded-lg bg-[#080d18] border border-[#1e293b] flex items-center gap-2"
                >
                  <span className="text-slate-300 font-semibold">{cohort.kode_kelas}:</span>
                  {frozenCount > 0 ? (
                    <button
                      onClick={() => handleUnfreeze(cohort.id_cohort)}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 transition-colors"
                      title={`Buka Freeze untuk ${cohort.nama_kelas}`}
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Unfreeze ({frozenCount})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFreeze(cohort.id_cohort)}
                      className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1 transition-colors"
                      title={`Bekukan Scoreboard 15m untuk ${cohort.nama_kelas}`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Freeze 15m ({openCount})</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Tabel Manajemen Soal & Status Dinamis */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
        {/* Table Toolbar: Title, Filter Badge & Search Bar */}
        <div className="p-3.5 border-b border-[#1e293b] bg-[#080d1a] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          {/* Left: Title & Filter Scope Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider">
              Daftar Paket Kontes ({games.length})
            </span>
            {searchQuery && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300">
                Ditemukan: {filteredGames.length}
              </span>
            )}
            {selectedCohortId !== 'ALL' && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold">
                Memfilter: {activeCohorts.find(c => c.id_cohort === selectedCohortId)?.nama_kelas}
              </span>
            )}
          </div>

          {/* Right: Search Input & Mode Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input Field */}
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, judul, materi, pertemuan..."
                className="w-full bg-[#111827] border border-[#1e293b] rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Bersihkan pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mode Game Filter Buttons */}
            <div className="inline-flex rounded-lg bg-[#060a14] p-0.5 border border-[#1e293b]">
              {(['ALL', 'SOLO', 'TEAM'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    modeFilter === m
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'ALL' ? 'Semua' : m}
                </button>
              ))}
            </div>

            <span className="text-slate-400 hidden xl:inline text-[11px]">
              ({displayCohorts.length} Kolom Saklar)
            </span>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="p-12 text-center font-mono space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Belum Ada Paket Kontes Terdaftar</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Seluruh data dummy bawaan telah dibersihkan. Sistem kini 100% murni dinamis dan siap untuk data kontes riil. Klik tombol di bawah untuk membuat paket kontes pertama Anda.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Paket Kontes Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono min-w-[950px]">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b] select-none">
                <tr>
                  <th className="p-3.5">ID &amp; Balon</th>
                  <th className="p-3.5">Judul &amp; Kategori</th>
                  <th className="p-3.5">Mode &amp; PIN</th>
                  {displayCohorts.length === 0 ? (
                    <th className="p-3.5 text-slate-400">Status Saklar Kelas</th>
                  ) : (
                    displayCohorts.map(cohort => (
                      <th key={cohort.id_cohort} className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{cohort.kode_kelas}</span>
                          <span className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                            {cohort.periode}
                          </span>
                        </div>
                      </th>
                    ))
                  )}
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={4 + Math.max(1, displayCohorts.length)} className="p-12 text-center text-slate-400 font-mono">
                      <div className="flex flex-col items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span className="text-xs">
                          Tidak ditemukan paket kontes yang cocok dengan filter / pencarian &quot;{searchQuery}&quot;
                        </span>
                        <button
                          onClick={() => { setSearchQuery(''); setModeFilter('ALL'); }}
                          className="px-3 py-1 rounded bg-[#111827] hover:bg-[#18233c] text-blue-400 text-xs border border-[#1e293b] font-bold"
                        >
                          Reset Filter Pencarian
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGames.map((game, idx) => {
                  const icpcMeta = ICPC_PROBLEMS_DEF.find(p => p.gameId === game.id_game);
                  const letter = icpcMeta?.letter || String.fromCharCode(65 + (idx % 26));
                  const balloonEmoji = icpcMeta?.balloonEmoji || '⚪';
                  const assignedCohortCount = activeCohorts.filter(
                    c => Array.isArray(c.allowed_game_ids) && c.allowed_game_ids.includes(game.id_game)
                  ).length;

                  return (
                    <tr key={game.id_game} className="hover:bg-[#111827]/60 transition-colors">
                      {/* Problem Index & Balloon */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded font-bold text-xs bg-[#111827] text-white border border-[#1e293b]">
                            Problem {letter}
                          </span>
                          <span className="font-bold text-white">{game.id_game}</span>
                          {assignedCohortCount === 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#090e1a] border border-amber-500/30 text-amber-400"
                              title="Paket belum ditugaskan ke kelas mana pun (tersembunyi dari seluruh mahasiswa)"
                            >
                              Draft (0 Kelas)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {game.ref_pertemuan} • {balloonEmoji} Balon {letter}
                        </div>
                      </td>

                      {/* Judul & Detail */}
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-white text-sm truncate" title={game.judul_game}>
                          {game.judul_game}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-blue-400">{game.kategori_materi}</span>
                          <span>•</span>
                          <span className="text-slate-300">{game.kesulitan}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {game.durasi_total_menit}m
                          </span>
                        </div>
                      </td>

                      {/* Mode Game & PIN */}
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            game.mode_game === 'TEAM'
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/25'
                              : 'bg-[#111827] text-slate-300 border border-[#1e293b]'
                          }`}
                        >
                          {game.mode_game}
                        </span>
                        {game.mode_game === 'TEAM' && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-amber-400 font-mono bg-[#070b14] px-1.5 py-0.5 rounded border border-[#1e293b]">
                              {game.pin_akses || 'PIN-AUTO'}
                            </span>
                            <button
                              onClick={() => onRandomPin(game.id_game)}
                              className="p-1 hover:text-white text-slate-400 bg-[#111827] hover:bg-[#18233c] rounded border border-[#1e293b] transition-colors"
                              title="Acak PIN Akses Game Tim"
                            >
                              <Shuffle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Kolom Saklar Dinamis per Kohort */}
                      {displayCohorts.length === 0 ? (
                        <td className="p-3.5 text-slate-500 italic text-[11px]">
                          Belum ada kelas terdaftar (Atur di menu Data Mahasiswa)
                        </td>
                      ) : (
                        displayCohorts.map(cohort => {
                          const isAllowed = cohort.allowed_game_ids && cohort.allowed_game_ids.includes(game.id_game);
                          const currentStatus = getStatusForCohort(game, cohort.id_cohort);

                          return (
                            <td key={cohort.id_cohort} className="p-3.5">
                              {!isAllowed ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#090e1a] border border-[#1e293b] text-slate-500 text-[11px]">
                                  <Lock className="w-3 h-3 text-slate-600" />
                                  <span>Terkunci Kelas</span>
                                </div>
                              ) : (
                                <div className="inline-flex rounded-lg bg-[#070b14] p-0.5 border border-[#1e293b]">
                                  {(['UPCOMING', 'OPEN', 'FROZEN', 'ENDED'] as GameStatus[]).map(st => (
                                    <button
                                      key={st}
                                      onClick={() => handleToggle(game.id_game, cohort.id_cohort, st)}
                                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                        currentStatus === st
                                          ? st === 'OPEN'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : st === 'FROZEN'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : st === 'ENDED'
                                            ? 'bg-slate-700 text-slate-200'
                                            : 'bg-blue-600 text-white shadow-sm'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })
                      )}

                      {/* Aksi Edit & Hapus */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(game)}
                            className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 hover:text-white transition-colors"
                            title="Edit Detail & Hak Akses Kelas Paket Game"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingGame(game)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-colors"
                            title="Hapus Game &amp; Soal Terkait"
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
      )}
      </div>

      {/* 4. MODAL BUAT PAKET KONTES BARU (PURE SOLID INDUSTRIAL DARK - ZERO AI SLOP) */}
      {showCreateModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-lg w-full shadow-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-base">Buat Paket Kontes Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormCreateSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">ID Game (Opsional)</label>
                    <input
                      type="text"
                      value={formIdGame}
                      onChange={(e) => setFormIdGame(e.target.value)}
                      placeholder="Contoh: G8 (Otomatis)"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Referensi Pertemuan *</label>
                    <input
                      type="text"
                      required
                      value={formRef}
                      onChange={(e) => setFormRef(e.target.value)}
                      placeholder="Contoh: Pertemuan 8"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Judul Paket Kontes *</label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={(e) => setFormJudul(e.target.value)}
                    placeholder="Contoh: Dynamic Programming &amp; Grid Simulation"
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kategori Materi *</label>
                    <input
                      type="text"
                      required
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      placeholder="Contoh: Dynamic Programming"
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tingkat Kesulitan</label>
                    <select
                      value={formKesulitan}
                      onChange={(e) => setFormKesulitan(e.target.value as GameDifficulty)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mode Game</label>
                    <select
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value as GameMode)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="SOLO">SOLO (Individu)</option>
                      <option value="TEAM">TEAM (Kelompok &amp; Snake-Draft)</option>
                    </select>
                  </div>

                  {formMode === 'TEAM' && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">PIN Akses Kontes</label>
                      <input
                        type="text"
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value)}
                        placeholder="Contoh: TIME-882 (Otomatis)"
                        className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Durasi Total (Menit)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={formDurasiTotal}
                      onChange={(e) => setFormDurasiTotal(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Detik / Soal</label>
                    <input
                      type="number"
                      min={15}
                      max={300}
                      value={formDurasiSoal}
                      onChange={(e) => setFormDurasiSoal(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Min Nilai Lulus</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formMinNilai}
                      onChange={(e) => setFormMinNilai(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Hak Akses Kelas Checklist */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Berikan Hak Akses ke Kelas (Opsional):</span>
                    <span className={`text-[11px] font-normal ${formAllowedCohorts.length === 0 ? 'text-slate-400' : 'text-blue-400'}`}>
                      {formAllowedCohorts.length === 0
                        ? 'Draft (0 Kelas — Belum Ditugaskan)'
                        : `${formAllowedCohorts.length} Kelas Dipilih`}
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Biarkan tidak dicentang untuk menyimpan sebagai Draft (tersembunyi dari seluruh kelas hingga ditugaskan).
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#060a14] border border-[#1e293b] rounded-lg">
                    {activeCohorts.length === 0 ? (
                      <div className="p-2 text-slate-500 italic text-[11px] text-center">
                        Belum ada kelas terdaftar. Game akan tersimpan dan dapat dihubungkan ke kelas nanti.
                      </div>
                    ) : (
                      activeCohorts.map(cohort => {
                        const isChecked = formAllowedCohorts.includes(cohort.id_cohort);
                        return (
                          <label
                            key={cohort.id_cohort}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-[#111827] cursor-pointer text-slate-300 select-none text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormAllowedCohorts(prev => [...prev, cohort.id_cohort]);
                                } else {
                                  setFormAllowedCohorts(prev => prev.filter(id => id !== cohort.id_cohort));
                                }
                              }}
                              className="rounded bg-[#111827] border-[#1e293b] text-blue-600 focus:ring-0"
                            />
                            <span className="font-bold text-white">{cohort.nama_kelas}</span>
                            <span className="text-slate-500">({cohort.periode})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                  >
                    Simpan &amp; Buat Paket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 5. MODAL EDIT DETAIL & HAK AKSES GAME */}
      {editingGame && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl max-w-lg w-full shadow-2xl font-mono overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#080d1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-base">
                    Edit Paket Kontes {editingGame.id_game}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
                {editError && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Referensi Pertemuan</label>
                    <input
                      type="text"
                      required
                      value={editRef}
                      onChange={(e) => setEditRef(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tingkat Kesulitan</label>
                    <select
                      value={editKesulitan}
                      onChange={(e) => setEditKesulitan(e.target.value as GameDifficulty)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Judul Paket Kontes</label>
                  <input
                    type="text"
                    required
                    value={editJudul}
                    onChange={(e) => setEditJudul(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kategori Materi</label>
                    <input
                      type="text"
                      required
                      value={editKategori}
                      onChange={(e) => setEditKategori(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mode Game</label>
                    <select
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value as GameMode)}
                      className="w-full bg-[#111827] border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="SOLO">SOLO</option>
                      <option value="TEAM">TEAM</option>
                    </select>
                  </div>
                </div>

                {/* Hak Akses Kelas Checklist */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Hak Akses Kelas / Kohort:</span>
                    <span className="text-[11px] text-blue-400 font-normal">
                      {editAllowedCohorts.length} Kelas Aktif
                    </span>
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#060a14] border border-[#1e293b] rounded-lg">
                    {activeCohorts.length === 0 ? (
                      <div className="p-2 text-slate-500 italic text-[11px] text-center">
                        Belum ada kelas terdaftar. Buat kelas di menu Data Mahasiswa untuk menghubungkan hak akses.
                      </div>
                    ) : (
                      activeCohorts.map(cohort => {
                        const isChecked = editAllowedCohorts.includes(cohort.id_cohort);
                        return (
                          <label
                            key={cohort.id_cohort}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-[#111827] cursor-pointer text-slate-300 select-none text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditAllowedCohorts(prev => [...prev, cohort.id_cohort]);
                                } else {
                                  setEditAllowedCohorts(prev => prev.filter(id => id !== cohort.id_cohort));
                                }
                              }}
                              className="rounded bg-[#111827] border-[#1e293b] text-blue-600 focus:ring-0"
                            />
                            <span className="font-bold text-white">{cohort.nama_kelas}</span>
                            <span className="text-slate-500">({cohort.periode})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setEditingGame(null)}
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
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS GAME (ZERO AI SLOP - PURE SOLID INDUSTRIAL DARK) */}
      {deletingGame && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setDeletingGame(null)}
          >
            <div
              className="bg-[#0c1222] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 text-xs font-mono animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5 pb-4 border-b border-[#1e293b]">
                <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Hapus Paket Kontes {deletingGame.id_game}?
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {deletingGame.judul_game} ({deletingGame.ref_pertemuan})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingGame(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151f33] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 p-3 rounded-lg bg-rose-950/25 border border-rose-500/25 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>
                  Tindakan ini bersifat permanen. Seluruh butir soal kuis, kunci jawaban, dan seluruh riwayat submisi nilai mahasiswa pada paket <strong>{deletingGame.id_game}</strong> akan dihapus secara bersih dari database.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setDeletingGame(null)}
                  className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#18233c] border border-[#1e293b] text-slate-300 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteGame(deletingGame.id_game);
                    setDeletingGame(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Paket Kontes</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
