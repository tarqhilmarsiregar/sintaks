'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Game, Question, User, Team, Submission, KlubHari, GameStatus } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import {
  Shield,
  Gamepad2,
  HelpCircle,
  Users,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Shuffle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export type AdminActiveTab = 'games' | 'questions' | 'teams' | 'students';

interface AdminCommandCenterContainerProps {
  activeAdminTab: AdminActiveTab;
}

export default function AdminCommandCenterContainer({ activeAdminTab }: AdminCommandCenterContainerProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State data
  const [games, setGames] = useState<Game[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Form states
  const [selectedGameForQuestions, setSelectedGameForQuestions] = useState<string>('G1');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'KAMIS' | 'JUMAT'>('ALL');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial data
  const refreshData = () => {
    const user = ArenaStore.getCurrentUser();
    setCurrentUser(user);
    setGames(ArenaStore.getGames());
    setQuestions(ArenaStore.getQuestions());
    setUsers(ArenaStore.getUsers());
    setTeams(ArenaStore.getTeams());
    setSubmissions(ArenaStore.getSubmissions());
  };

  useEffect(() => {
    const user = ArenaStore.getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/mahasiswa/dashboard');
      return;
    }
    refreshData();
  }, [router]);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleTabChange = (tabId: AdminActiveTab) => {
    router.push(`/admin/${tabId}`);
  };

  // --- GAME ACTIONS ---
  const handleToggleStatus = (gameId: string, day: 'KAMIS' | 'JUMAT', newStatus: GameStatus) => {
    const g = games.find(item => item.id_game === gameId);
    if (!g) return;

    const newKamis = day === 'KAMIS' ? newStatus : g.status_kamis;
    const newJumat = day === 'JUMAT' ? newStatus : g.status_jumat;

    ArenaStore.updateGameStatus(gameId, newKamis, newJumat);
    refreshData();
    showAlert(`Status Game ${gameId} untuk Kelas ${day} berhasil diubah menjadi ${newStatus}`);
  };

  const handleRandomPin = (gameId: string) => {
    const pin = ArenaStore.randomizeGamePin(gameId);
    refreshData();
    showAlert(`PIN Akses Game ${gameId} diperbarui: ${pin}`);
  };

  const handleDeleteGame = (gameId: string) => {
    if (!confirm(`Hapus game ${gameId} beserta seluruh soal dan data submisinya?`)) return;
    const updatedGames = games.filter(g => g.id_game !== gameId);
    const updatedQs = questions.filter(q => q.id_game !== gameId);
    const updatedSubs = submissions.filter(s => s.id_game !== gameId);

    ArenaStore.saveGames(updatedGames);
    ArenaStore.saveQuestions(updatedQs);
    ArenaStore.saveSubmissions(updatedSubs);
    refreshData();
    showAlert(`Game ${gameId} berhasil dihapus.`);
  };

  // --- TEAM ACTIONS (SNAKE DRAFT) ---
  const handleGenerateTeams = (klubHari: KlubHari) => {
    ArenaStore.generateTeamsForClass(klubHari);
    refreshData();
    showAlert(`Tim berimbang (Snake-Draft) untuk Kelas ${klubHari} berhasil dibuat!`);
  };

  const handleDisbandTeams = (klubHari: KlubHari) => {
    if (!confirm(`Bubarkan seluruh tim untuk Kelas ${klubHari}?`)) return;
    ArenaStore.disbandTeamsForClass(klubHari);
    refreshData();
    showAlert(`Seluruh tim Kelas ${klubHari} berhasil dibubarkan.`);
  };

  // --- STUDENT RESET ---
  const handleResetStudent = (nim: string) => {
    if (!confirm(`Reset riwayat submisi dan skor untuk mahasiswa NIM ${nim}?`)) return;
    ArenaStore.resetUserProgress(nim);
    refreshData();
    showAlert(`Progres mahasiswa ${nim} berhasil di-reset.`);
  };

  const handleResetGlobal = () => {
    if (!confirm('PERINGATAN: Reset seluruh database kembali ke kondisi awal pabrik?')) return;
    ArenaStore.resetGlobal();
    refreshData();
    showAlert('Database berhasil di-reset ke pengaturan awal.');
  };

  // --- EXPORT EXCEL VIA CLIENT XLSX INJECTION ---
  const handleExportExcel = (klubHari: 'KAMIS' | 'JUMAT') => {
    try {
      const filteredUsers = users.filter(u => u.role === 'PESERTA' && u.klub_hari === klubHari);

      // Sheet 1: Rekap Nilai
      const rekapNilaiData = filteredUsers.map(u => {
        const userSubs = submissions.filter(s => s.nim === u.nim && s.status_sesi === 'DONE');
        const totalNilai = userSubs.reduce((acc, s) => acc + s.nilai_akademik, 0);
        const rataNilai = userSubs.length > 0 ? Math.round(totalNilai / userSubs.length) : 0;
        const maxNilai = userSubs.length > 0 ? Math.max(...userSubs.map(s => s.nilai_akademik)) : 0;
        const totalTab = userSubs.reduce((acc, s) => acc + s.tab_switch_count, 0);

        return {
          NIM: u.nim,
          Nama_Lengkap: u.nama_lengkap,
          Codename: u.codename,
          Prodi: u.prodi,
          Angkatan: u.angkatan,
          Kelas_Reguler: u.kelas_reguler,
          Game_Selesai: `${userSubs.length}/${games.length}`,
          Rata_Nilai_Akhir: rataNilai,
          Nilai_Terbaik: maxNilai,
          Total_Pindah_Tab: totalTab,
          Akumulasi_Penalti: `-${totalTab * 5}`,
          Total_XP: u.total_xp,
          Level: u.level,
          Status_Ketuntasan: rataNilai >= 70 ? 'TUNTAS' : 'BELUM TUNTAS'
        };
      });

      // Sheet 2: Diagnostik Materi
      const diagnostikData = filteredUsers.map(u => {
        return {
          NIM: u.nim,
          Nama_Lengkap: u.nama_lengkap,
          Codename: u.codename,
          Klub_Hari: u.klub_hari,
          Level: u.level,
          Tier_Badge: u.tier_badge,
          Kategori_Fokus: 'Big-O & Game Theory',
          Indikasi_Akademik: u.total_xp >= 800 ? '🟢 Sangat Menguasai' : u.total_xp >= 400 ? '🟡 Cukup' : '🔴 Butuh Pengayaan',
          Rekomendasi_Modul: u.total_xp >= 800 ? 'Pengayaan Lanjut' : 'Review Modul & Colab Pertemuan 1'
        };
      });

      // Sheet 3: Log Detail Submisi
      const logDetailData = submissions
        .filter(s => s.klub_hari === klubHari)
        .map(s => ({
          ID_Submisi: s.id_submission,
          Waktu: new Date(s.timestamp_mulai).toLocaleString('id-ID'),
          NIM: s.nim,
          Codename: s.codename,
          ID_Game: s.id_game,
          Jumlah_Benar: s.jumlah_benar,
          Total_Soal: s.total_soal,
          Nilai_Akademik: s.nilai_akademik,
          Penalti_Tab: s.tab_switch_count * 5,
          Skor_XP: s.skor_xp,
          Status_Kelulusan: s.status_lulus
        }));

      // Inisialisasi Script SheetJS jika belum ada di window
      const win = window as any;
      if (typeof win.XLSX !== 'undefined') {
        const wb = win.XLSX.utils.book_new();

        const ws1 = win.XLSX.utils.json_to_sheet(rekapNilaiData);
        win.XLSX.utils.book_append_sheet(wb, ws1, `Rekap_Nilai_${klubHari}`);

        const ws2 = win.XLSX.utils.json_to_sheet(diagnostikData);
        win.XLSX.utils.book_append_sheet(wb, ws2, `Diagnostik_Materi_${klubHari}`);

        const ws3 = win.XLSX.utils.json_to_sheet(logDetailData);
        win.XLSX.utils.book_append_sheet(wb, ws3, `Log_Detail_${klubHari}`);

        win.XLSX.writeFile(wb, `STMIK_TIME_CP_ARENA_REKAP_${klubHari}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showAlert(`Laporan Excel Resmi Kelas ${klubHari} (.xlsx 3-Sheet) berhasil diunduh!`);
      } else {
        // Fallback CSV download jika SheetJS script belum selesai memuat
        const csvContent = "data:text/csv;charset=utf-8," + 
          Object.keys(rekapNilaiData[0] || {}).join(",") + "\n" +
          rekapNilaiData.map(e => Object.values(e).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Nilai_${klubHari}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert(`Data CSV Kelas ${klubHari} berhasil diunduh.`);
      }
    } catch (err) {
      console.error(err);
      showAlert('Gagal mengekspor laporan Excel.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f1f5f9] font-sans pb-16">
      {/* Script SheetJS untuk Export Excel */}
      <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="lazyOnload" />

      {/* Top Navbar Admin */}
      <header className="bg-[#0b1120] border-b border-[#1f293d] px-4 lg:px-6 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/mahasiswa/dashboard"
              className="p-2 rounded-lg bg-[#111827] hover:bg-[#162238] border border-[#1f293d] text-slate-300 hover:text-white transition-colors"
              title="Kembali ke Portal Mahasiswa"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base font-mono">
                  COMMAND CENTER DOSEN
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  Pembina: Tarq Hilmar Siregar, S.Kom
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Panel Kontrol &amp; Manajemen Pembelajaran Competitive Programming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Export Excel Dropdown Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExportExcel('KAMIS')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold transition-colors"
                title="Unduh Rekap Excel Multi-Sheet Kelas Kamis"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Kamis (.xlsx)</span>
              </button>

              <button
                onClick={() => handleExportExcel('JUMAT')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold transition-colors"
                title="Unduh Rekap Excel Multi-Sheet Kelas Jumat"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Jumat (.xlsx)</span>
              </button>
            </div>

            <button
              onClick={handleResetGlobal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-mono transition-colors"
              title="Reset Database ke kondisi awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Global</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Alert Notification */}
        {alertMsg && (
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Tab Navigation Admin (Dynamic URL Driven) */}
        <div className="flex items-center gap-2 border-b border-[#1f293d] pb-2 overflow-x-auto">
          {[
            { id: 'games' as const, label: 'Manajemen Game (CRUD)', icon: Gamepad2 },
            { id: 'questions' as const, label: 'Bank Soal per Game', icon: HelpCircle },
            { id: 'teams' as const, label: 'Team Generator (Snake-Draft)', icon: Users },
            { id: 'students' as const, label: 'Monitor 28 Mahasiswa & Reset', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#111827] text-slate-300 hover:bg-[#162238] border border-[#1f293d]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: MANAJEMEN GAME & SAKLAR STATUS */}
        {activeAdminTab === 'games' && (
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">
                  Daftar Game &amp; Saklar Status Independen (Kamis vs Jumat)
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Ubah status game secara real-time untuk kelas Kamis dan Jumat tanpa saling mengganggu.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b]">
                  <tr>
                    <th className="p-3">ID &amp; Pertemuan</th>
                    <th className="p-3">Judul &amp; Kategori</th>
                    <th className="p-3">Mode &amp; PIN</th>
                    <th className="p-3">Saklar Kelas KAMIS</th>
                    <th className="p-3">Saklar Kelas JUMAT</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {games.map(game => (
                    <tr key={game.id_game} className="hover:bg-[#131d33] transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-white">{game.id_game}</span>
                        <div className="text-[10px] text-slate-400">{game.ref_pertemuan}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white text-sm">{game.judul_game}</div>
                        <div className="text-[10px] text-slate-400">{game.kategori_materi} • {game.kesulitan} • {game.durasi_total_menit}m</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          game.mode_game === 'TEAM' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {game.mode_game}
                        </span>
                        {game.mode_game === 'TEAM' && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-amber-400 font-mono">{game.pin_akses}</span>
                            <button
                              onClick={() => handleRandomPin(game.id_game)}
                              className="p-1 hover:text-white text-slate-400"
                              title="Randomize PIN"
                            >
                              <Shuffle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      {/* Saklar Status Kamis */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {(['UPCOMING', 'OPEN', 'FROZEN', 'ENDED'] as GameStatus[]).map(st => (
                            <button
                              key={st}
                              onClick={() => handleToggleStatus(game.id_game, 'KAMIS', st)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                game.status_kamis === st
                                  ? st === 'OPEN' ? 'bg-emerald-600 text-white' : st === 'ENDED' ? 'bg-slate-700 text-white' : 'bg-amber-600 text-white'
                                  : 'bg-[#111827] text-slate-400 hover:text-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      {/* Saklar Status Jumat */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {(['UPCOMING', 'OPEN', 'FROZEN', 'ENDED'] as GameStatus[]).map(st => (
                            <button
                              key={st}
                              onClick={() => handleToggleStatus(game.id_game, 'JUMAT', st)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                game.status_jumat === st
                                  ? st === 'OPEN' ? 'bg-emerald-600 text-white' : st === 'ENDED' ? 'bg-slate-700 text-white' : 'bg-amber-600 text-white'
                                  : 'bg-[#111827] text-slate-400 hover:text-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteGame(game.id_game)}
                          className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300"
                          title="Hapus Game"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 2: BANK SOAL PER GAME */}
        {activeAdminTab === 'questions' && (
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
              <div>
                <h4 className="font-bold text-white text-base">
                  Bank Soal Kompetisi &amp; Pembahasan Editorial
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Kunci jawaban, hint, dan editorial tersembunyi secara aman dari browser mahasiswa saat kuis berlangsung.
                </p>
              </div>

              {/* Selector Game */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Pilih Game:</span>
                <select
                  value={selectedGameForQuestions}
                  onChange={e => setSelectedGameForQuestions(e.target.value)}
                  className="bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                >
                  {games.map(g => (
                    <option key={g.id_game} value={g.id_game}>
                      {g.id_game} - {g.judul_game}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="space-y-3">
              {questions
                .filter(q => q.id_game === selectedGameForQuestions)
                .map((q, idx) => (
                  <div key={q.id_soal} className="p-4 rounded-xl bg-[#080d1a] border border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400 font-mono text-sm">
                          Soal #{idx + 1} ({q.id_soal})
                        </span>
                        <span className="text-xs font-bold text-white">{q.judul}</span>
                      </div>
                      <span className="text-amber-400 font-mono text-xs font-bold">
                        Poin Dasar: {q.poin_dasar} XP
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono bg-[#0d1424] p-2.5 rounded-lg border border-[#1e293b]">
                      {q.narasi_soal}
                    </p>

                    {q.cuplikan_kode && (
                      <pre className="p-3 rounded-lg bg-[#050811] text-emerald-400 font-mono text-xs overflow-x-auto border border-[#1e293b]">
                        <code>{q.cuplikan_kode}</code>
                      </pre>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                      <div className="p-2 rounded bg-[#0f172a] border border-[#1e293b]">
                        <span className="text-slate-400 block text-[10px]">KUNCI JAWABAN:</span>
                        <span className="font-bold text-emerald-400">{q.kunci_jawaban}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0f172a] border border-[#1e293b]">
                        <span className="text-slate-400 block text-[10px]">HINT (-25 XP):</span>
                        <span className="text-amber-300 truncate block">{q.teks_hint || '-'}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0f172a] border border-[#1e293b]">
                        <span className="text-slate-400 block text-[10px]">FIRST BLOOD BY:</span>
                        <span className="text-purple-300 truncate block">{q.first_blood_by || 'Belum ada'}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SECTION 3: TEAM GENERATOR (SNAKE-DRAFT) */}
        {activeAdminTab === 'teams' && (
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
              <div>
                <h4 className="font-bold text-white text-base">
                  Generator Tim Berimbang (Snake-Draft Algorithm)
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Membagi mahasiswa secara zig-zag (1 &rarr; 2 &rarr; 3 &rarr; 3 &rarr; 2 &rarr; 1) berdasarkan ranking XP untuk keadilan kompetisi.
                </p>
              </div>

              {/* Action Buttons Generator */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateTeams('KAMIS')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Draft Tim KAMIS (15 SI)</span>
                </button>

                <button
                  onClick={() => handleGenerateTeams('JUMAT')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Draft Tim JUMAT (13 TI/SI)</span>
                </button>
              </div>
            </div>

            {/* List Tim Terbentuk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['KAMIS', 'JUMAT'].map(klub => {
                const teamsInClass = teams.filter(t => t.klub_hari === klub);

                return (
                  <div key={klub} className="p-4 rounded-xl bg-[#080d1a] border border-[#1e293b] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                      <div className="font-bold text-white text-sm font-mono flex items-center gap-2">
                        <span>Squad Kelas {klub}</span>
                        <span className="text-[10px] font-normal text-slate-400">({teamsInClass.length} Tim)</span>
                      </div>
                      {teamsInClass.length > 0 && (
                        <button
                          onClick={() => handleDisbandTeams(klub as KlubHari)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline"
                        >
                          Bubarkan Tim
                        </button>
                      )}
                    </div>

                    {teamsInClass.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-mono">
                        Belum ada tim terbentuk di Kelas {klub}. Klik tombol Draft di atas.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {teamsInClass.map((t, idx) => (
                          <div key={t.id_tim} className="p-3 rounded-lg bg-[#0d1424] border border-[#1e293b] space-y-1.5 font-mono text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400">#{idx + 1} {t.nama_tim}</span>
                                {t.kode_gabung && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                                    Kode: {t.kode_gabung}
                                  </span>
                                )}
                              </div>
                              <span className="text-amber-400">{t.total_skor_tim} XP</span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              {t.daftar_nama_json?.map((name, i) => (
                                <span key={i} className="inline-block mr-2 px-1.5 py-0.5 rounded bg-[#111827] text-slate-300 border border-slate-700 text-[10px]">
                                  {name} ({t.daftar_nim_json[i]})
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: MONITOR MAHASISWA & RESET PROGRES */}
        {activeAdminTab === 'students' && (
          <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
              <div>
                <h4 className="font-bold text-white text-base">
                  Pemantauan 28 Mahasiswa STMIK TIME Medan
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  15 Mahasiswa Sistem Informasi 2025 (Kamis) &amp; 13 Mahasiswa TI/SI 2024-2025 (Jumat).
                </p>
              </div>

              {/* Filter Kelas */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {(['ALL', 'KAMIS', 'JUMAT'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStudentFilter(f)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      studentFilter === f ? 'bg-blue-600 text-white' : 'bg-[#111827] text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#111827] text-slate-400 border-b border-[#1e293b]">
                  <tr>
                    <th className="p-3">NIM &amp; Kelas</th>
                    <th className="p-3">Nama &amp; Codename</th>
                    <th className="p-3">Prodi &amp; Angkatan</th>
                    <th className="p-3">Level &amp; Tier</th>
                    <th className="p-3">Total XP</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {users
                    .filter(u => u.role === 'PESERTA' && (studentFilter === 'ALL' || u.klub_hari === studentFilter))
                    .map(u => (
                      <tr key={u.nim} className="hover:bg-[#131d33] transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-white">{u.nim}</span>
                          <div className="text-[10px] text-blue-400 font-bold">Kelas {u.klub_hari}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{u.avatar || '⚡'}</span>
                            <span>{u.nama_lengkap}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Codename: {u.codename}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300">{u.prodi} ({u.angkatan})</span>
                          <div className="text-[10px] text-slate-500">{u.kelas_reguler}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-amber-400 font-bold">Lv. {u.level}</span>
                          <div className="text-[10px] text-slate-400">{u.tier_badge}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-cyan-400 text-sm">{u.total_xp} XP</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleResetStudent(u.nim)}
                            className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300"
                            title="Reset Progres Mahasiswa"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

