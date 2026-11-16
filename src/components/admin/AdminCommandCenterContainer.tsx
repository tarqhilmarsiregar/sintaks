'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Game, Question, User, Team, Submission, KlubHari, GameStatus, CreateUserDTO, AdminActiveTab, Cohort, CreateGameDTO, UpdateGameDTO } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import TopNavbar from '@/components/arena/TopNavbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminContestControlTab from '@/components/admin/tabs/AdminContestControlTab';
import AdminQuestionBankTab from '@/components/admin/tabs/AdminQuestionBankTab';
import AdminSubmissionsTab from '@/components/admin/tabs/AdminSubmissionsTab';
import AdminTeamDraftTab from '@/components/admin/tabs/AdminTeamDraftTab';
import AdminStudentMonitorTab from '@/components/admin/tabs/AdminStudentMonitorTab';
import AdminExportTab from '@/components/admin/tabs/AdminExportTab';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export type { AdminActiveTab };

interface AdminCommandCenterContainerProps {
  activeAdminTab: AdminActiveTab;
}

export default function AdminCommandCenterContainer({ activeAdminTab }: AdminCommandCenterContainerProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // State data utama
  const [games, setGames] = useState<Game[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial data
  const refreshData = useCallback(() => {
    const user = ArenaStore.getCurrentUser();
    setCurrentUser(user);
    setGames(ArenaStore.getGames());
    setQuestions(ArenaStore.getQuestions());
    setUsers(ArenaStore.getUsers());
    setTeams(ArenaStore.getTeams());
    setSubmissions(ArenaStore.getSubmissions());
    setCohorts(ArenaStore.getCohorts());
  }, []);

  // Guard autentikasi & RBAC
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
    setIsCheckingAuth(false);
  }, [router, refreshData]);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleTabChange = (tabId: AdminActiveTab) => {
    router.push(`/admin/${tabId}`);
  };

  const handleLogout = () => {
    ArenaStore.logout();
    router.replace('/login');
  };

  // --- GAME ACTIONS ---
  const handleToggleStatus = (gameId: string, day: 'KAMIS' | 'JUMAT' | 'LOMBA', newStatus: GameStatus) => {
    const g = games.find(item => item.id_game === gameId);
    if (!g) return;

    const newKamis = day === 'KAMIS' ? newStatus : g.status_kamis;
    const newJumat = day === 'JUMAT' ? newStatus : g.status_jumat;
    const newLomba = day === 'LOMBA' ? newStatus : (g.status_lomba || 'UPCOMING');

    ArenaStore.updateGameStatus(gameId, newKamis, newJumat, newLomba);
    refreshData();
    showAlert(`Status Game ${gameId} untuk Kelas ${day} diubah menjadi ${newStatus}`);
  };

  const handleToggleCohortStatus = (gameId: string, cohortIdOrCode: string, newStatus: GameStatus) => {
    const res = ArenaStore.updateGameCohortStatus(gameId, cohortIdOrCode, newStatus);
    if (res) {
      refreshData();
      showAlert(`Status Game ${gameId} untuk kelas ${cohortIdOrCode} diubah menjadi ${newStatus}`);
    }
  };

  const handleCreateGame = (dto: CreateGameDTO) => {
    const res = ArenaStore.createGame(dto);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleUpdateGame = (gameId: string, updates: Partial<Game> & { allowed_cohort_ids?: string[] }) => {
    const res = ArenaStore.updateGame(gameId, updates);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleRandomPin = (gameId: string) => {
    const pin = ArenaStore.randomizeGamePin(gameId);
    refreshData();
    showAlert(`PIN Akses Game ${gameId} diperbarui: ${pin}`);
  };

  const handleDeleteGame = (gameId: string) => {
    const res = ArenaStore.deleteGame(gameId);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleFreezeCohort = (cohortIdOrCode: string) => {
    ArenaStore.freezeCohort(cohortIdOrCode);
    refreshData();
    showAlert(`Scoreboard untuk kelas ${cohortIdOrCode} berhasil dibekukan (Freeze 15m Aktif).`);
  };

  const handleUnfreezeCohort = (cohortIdOrCode: string) => {
    ArenaStore.unfreezeCohort(cohortIdOrCode);
    refreshData();
    showAlert(`Scoreboard untuk kelas ${cohortIdOrCode} kembali dibuka (Live Unfreeze).`);
  };

  const handleFreezeClass = (day: 'KAMIS' | 'JUMAT' | 'LOMBA') => {
    handleFreezeCohort(day);
  };

  const handleUnfreezeClass = (day: 'KAMIS' | 'JUMAT' | 'LOMBA') => {
    handleUnfreezeCohort(day);
  };

  // --- USER CREATION & MANAGEMENT ACTIONS ---
  const handleCreateUser = (dto: CreateUserDTO) => {
    const res = ArenaStore.createUser(dto);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleDeleteUser = (nim: string) => {
    const res = ArenaStore.deleteUser(nim);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
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

  // --- STUDENT RESET & PROGRESS MANAGEMENT ---
  const handleResetStudent = (nim: string) => {
    if (!confirm(`Reset seluruh riwayat submisi dan skor XP untuk mahasiswa NIM ${nim}?`)) return;
    ArenaStore.resetUserProgress(nim);
    refreshData();
    showAlert(`Seluruh progres mahasiswa ${nim} berhasil di-reset.`);
  };

  const handleResetStudentGame = (nim: string, idGame: string) => {
    const res = ArenaStore.resetUserGameSubmission(nim, idGame);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleUpdateStudentProgress = (
    nim: string,
    payload: { total_xp?: number; grades: { id_game: string; nilai_akademik: number; skor_xp: number }[] }
  ) => {
    const res = ArenaStore.updateUserProgressAndGrades(nim, payload);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleResetGlobal = () => {
    ArenaStore.resetGlobal();
    refreshData();
    showAlert('Database berhasil di-reset ke kondisi awal pabrik.');
  };

  // --- EXPORT EXCEL VIA CLIENT XLSX INJECTION ---
  const handleExportExcel = (klubHari: KlubHari) => {
    try {
      const filteredUsers = users.filter(u => u.role === 'PESERTA' && (klubHari === 'ALL' || u.klub_hari === klubHari));

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
          Klub_Hari: u.klub_hari,
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
        .filter(s => {
          if (klubHari === 'ALL') return true;
          const owner = users.find(u => u.nim === s.nim);
          return owner?.klub_hari === klubHari;
        })
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

      // Inisialisasi Script SheetJS jika tersedia di window
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (win && typeof win.XLSX !== 'undefined') {
        const wb = win.XLSX.utils.book_new();

        const ws1 = win.XLSX.utils.json_to_sheet(rekapNilaiData);
        win.XLSX.utils.book_append_sheet(wb, ws1, `Rekap_Nilai_${klubHari}`);

        const ws2 = win.XLSX.utils.json_to_sheet(diagnostikData);
        win.XLSX.utils.book_append_sheet(wb, ws2, `Diagnostik_${klubHari}`);

        const ws3 = win.XLSX.utils.json_to_sheet(logDetailData);
        win.XLSX.utils.book_append_sheet(wb, ws3, `Log_Detail_${klubHari}`);

        win.XLSX.writeFile(wb, `STMIK_TIME_CP_ARENA_${klubHari}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showAlert(`Laporan Excel Resmi Kelas ${klubHari} (.xlsx 3-Sheet) berhasil diunduh!`);
      } else {
        // Fallback CSV download dengan UTF-8 BOM agar Excel membukanya secara sempurna
        const csvContent = "\uFEFF" + 
          Object.keys(rekapNilaiData[0] || {}).join(";") + "\n" +
          rekapNilaiData.map(e => Object.values(e).join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
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

  if (isCheckingAuth || !currentUser) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Memverifikasi Otoritas Admin Dosen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f1f5f9] font-sans antialiased flex flex-col">
      {/* Script SheetJS untuk ekspor Excel */}
      <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="lazyOnload" />

      {/* 1. TOP NAVBAR (Identik & Konsisten dengan Portal Mahasiswa) */}
      <TopNavbar
        user={currentUser}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileNavOpen}
      />

      {/* 2. MAIN APP BODY (Left Docked Fixed Sidebar + Offsetting Main Content) */}
      <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-61px)]">
        {/* A. SIDEBAR NAVIGASI KIRI ADMIN */}
        <AdminSidebar
          currentUser={currentUser}
          activeTab={activeAdminTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* B. AREA KONTEN UTAMA ADMIN */}
        <main className="flex-1 min-w-0 md:ml-72 lg:ml-80 xl:ml-[328px] px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
          {/* Notification Alert Bar */}
          {alertMsg && (
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-mono shadow-sm animate-in fade-in duration-150 ${
                alertMsg.type === 'success'
                  ? 'bg-[#0b1120] border-emerald-500/40 text-emerald-300'
                  : 'bg-[#0b1120] border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {alertMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{alertMsg.text}</span>
              </div>
              <button
                onClick={() => setAlertMsg(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: /admin/contests (Canonical) & /admin/games (Legacy Alias) */}
          {(activeAdminTab === 'contests' || activeAdminTab === 'games') && (
            <AdminContestControlTab
              games={games}
              cohorts={cohorts}
              onToggleStatus={handleToggleStatus}
              onToggleCohortStatus={handleToggleCohortStatus}
              onCreateGame={handleCreateGame}
              onUpdateGame={handleUpdateGame}
              onRandomPin={handleRandomPin}
              onDeleteGame={handleDeleteGame}
              onFreezeClass={handleFreezeClass}
              onUnfreezeClass={handleUnfreezeClass}
              onFreezeCohort={handleFreezeCohort}
              onUnfreezeCohort={handleUnfreezeCohort}
            />
          )}

          {/* TAB 2: /admin/problems (Alias: /admin/questions) */}
          {(activeAdminTab === 'problems' || activeAdminTab === 'questions') && (
            <AdminQuestionBankTab
              games={games}
              questions={questions}
              onRefresh={refreshData}
              onAlert={showAlert}
            />
          )}

          {/* TAB 3: /admin/submissions */}
          {activeAdminTab === 'submissions' && (
            <AdminSubmissionsTab
              submissions={submissions}
              games={games}
              users={users}
              cohorts={cohorts}
              onRefresh={refreshData}
              onAlert={showAlert}
            />
          )}

          {/* TAB 4: /admin/teams */}
          {activeAdminTab === 'teams' && (
            <AdminTeamDraftTab
              teams={teams}
              onGenerateTeams={handleGenerateTeams}
              onDisbandTeams={handleDisbandTeams}
            />
          )}

          {/* TAB 5: /admin/students */}
          {activeAdminTab === 'students' && (
            <AdminStudentMonitorTab
              users={users}
              submissions={submissions}
              games={games}
              onResetStudent={handleResetStudent}
              onResetStudentGame={handleResetStudentGame}
              onUpdateStudentProgress={handleUpdateStudentProgress}
              onAddUser={handleCreateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {/* TAB 6: /admin/export */}
          {activeAdminTab === 'export' && (
            <AdminExportTab
              users={users}
              submissions={submissions}
              games={games}
              onExportExcel={handleExportExcel}
              onResetGlobal={handleResetGlobal}
            />
          )}
        </main>
      </div>
    </div>
  );
}
