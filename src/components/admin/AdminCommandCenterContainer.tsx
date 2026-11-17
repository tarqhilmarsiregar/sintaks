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
import { generateAcademicExportData, downloadAcademicExport } from '@/lib/export-service';
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

  // --- TEAM ACTIONS (SNAKE DRAFT & DYNAMIC COHORTS) ---
  const handleGenerateTeams = (klubHari: KlubHari) => {
    const res = ArenaStore.generateTeamsForCohort(klubHari, 3);
    refreshData();
    showAlert(res.message, res.success ? 'success' : 'error');
  };

  const handleDisbandTeams = (klubHari: KlubHari) => {
    const res = ArenaStore.disbandTeamsForCohort(klubHari);
    refreshData();
    showAlert(res.message, res.success ? 'success' : 'error');
  };

  const handleGenerateCohortTeams = (cohortId: string, teamSize: number) => {
    const res = ArenaStore.generateTeamsForCohort(cohortId, teamSize);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleDisbandCohortTeams = (cohortId: string) => {
    const res = ArenaStore.disbandTeamsForCohort(cohortId);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleDisbandSingleTeam = (teamId: string) => {
    const res = ArenaStore.disbandTeam(teamId, 'ADMIN');
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleUpdateTeam = (teamId: string, updates: { nama_tim?: string; leader_nim?: string }) => {
    const res = ArenaStore.updateTeamDetails(teamId, updates);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
  };

  const handleMoveMember = (nim: string, targetTeamId: string) => {
    const res = ArenaStore.moveTeamMember(nim, targetTeamId);
    if (res.success) {
      refreshData();
      showAlert(res.message, 'success');
    } else {
      showAlert(res.message, 'error');
    }
    return res;
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
  const handleExportExcel = (cohortIdOrCode: string = 'ALL', cohortName?: string) => {
    try {
      const exportResult = generateAcademicExportData({
        users,
        submissions,
        games,
        cohorts,
        targetCohortIdOrCode: cohortIdOrCode,
        targetCohortName: cohortName,
      });

      const res = downloadAcademicExport(exportResult);
      showAlert(res.message, res.success ? 'success' : 'error');
    } catch (err) {
      console.error(err);
      showAlert('Gagal mengekspor laporan akademik.', 'error');
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
              users={users}
              cohorts={cohorts}
              onGenerateTeams={handleGenerateTeams}
              onDisbandTeams={handleDisbandTeams}
              onGenerateCohortTeams={handleGenerateCohortTeams}
              onDisbandCohortTeams={handleDisbandCohortTeams}
              onDisbandSingleTeam={handleDisbandSingleTeam}
              onUpdateTeam={handleUpdateTeam}
              onMoveMember={handleMoveMember}
              onRefresh={refreshData}
              onAlert={showAlert}
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
              cohorts={cohorts}
              onExportExcel={handleExportExcel}
              onResetGlobal={handleResetGlobal}
              onCreateCohortClick={() => router.push('/admin/students')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
