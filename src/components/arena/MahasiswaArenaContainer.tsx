'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Game, Question, Submission, User, Team, LeaderboardPlayer, KlubHari } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';

import TopNavbar from '@/components/arena/TopNavbar';
import StudentSidebar, { StudentActiveMenu } from '@/components/arena/StudentSidebar';
import DashboardOverviewView from '@/components/arena/DashboardOverviewView';
import LeaderboardView from '@/components/arena/LeaderboardView';
import GameCatalogGrid from '@/components/arena/GameCatalogGrid';
import TeamBattleTab from '@/components/arena/TeamBattleTab';
import CapaianTab from '@/components/arena/CapaianTab';
import ProfileTab from '@/components/arena/ProfileTab';
import SubmissionsHistoryTab from '@/components/arena/SubmissionsHistoryTab';
import EditorialModal from '@/components/arena/EditorialModal';
import QuizArenaModal from '@/components/arena/QuizArenaModal';
import CodingArenaModal from '@/components/arena/CodingArenaModal';
import FirstLoginOnboardingModal from '@/components/arena/FirstLoginOnboardingModal';
import { Problem } from '@/types';

interface MahasiswaArenaContainerProps {
  activeMenu: StudentActiveMenu;
}

export default function MahasiswaArenaContainer({ activeMenu }: MahasiswaArenaContainerProps) {
  const router = useRouter();

  // Primary State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Filtering
  const [leaderboardFilter, setLeaderboardFilter] = useState<KlubHari>('KAMIS');
  const [leaderboardPlayers, setLeaderboardPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [activeQuizGame, setActiveQuizGame] = useState<Game | null>(null);
  const [editorialTarget, setEditorialTarget] = useState<{ game: Game; submission: Submission } | null>(null);
  const [activeCodingProblem, setActiveCodingProblem] = useState<{ problem: Problem; sourceGame?: Game | null } | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // 1. Data Loader
  const loadAllData = useCallback((user: User) => {
    setCurrentUser(user);

    // Cek apakah mahasiswa wajib onboarding (ganti password perdana)
    if (user.role === 'PESERTA') {
      const isDefaultPass = !user.password || user.password === user.nim;
      const needsOnboard = isDefaultPass || user.is_first_login !== false;
      setIsOnboardingModalOpen(needsOnboard);
    } else {
      setIsOnboardingModalOpen(false);
    }

    const g = ArenaStore.getGames();
    setGames(g);

    const q = ArenaStore.getQuestions();
    setQuestions(q);

    const s = ArenaStore.getSubmissions();
    setSubmissions(s);

    const t = ArenaStore.getTeams();
    setTeams(t);

    const filter = (user?.klub_hari && user.klub_hari !== 'ALL') ? user.klub_hari : 'KAMIS';
    setLeaderboardFilter(filter);
    setLeaderboardPlayers(ArenaStore.getLeaderboardPlayers(filter));
  }, []);

  // Route Guard: Pastikan sesi aktif
  useEffect(() => {
    const user = ArenaStore.getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    loadAllData(user);
    setIsCheckingAuth(false);
  }, [router, loadAllData]);

  // Handle Dynamic URL Navigation
  const handleMenuChange = (newMenu: StudentActiveMenu) => {
    setIsMobileNavOpen(false);
    router.push(`/mahasiswa/${newMenu}`);
  };

  // Handle Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const user = ArenaStore.getCurrentUser();
      if (user) loadAllData(user);
      setIsRefreshing(false);
    }, 400);
  };

  // Handle Logout
  const handleLogout = () => {
    ArenaStore.logout();
    router.push('/login');
  };

  // Handle Leaderboard Filter Change
  const handleLeaderboardFilterChange = (filter: KlubHari) => {
    setLeaderboardFilter(filter);
    setLeaderboardPlayers(ArenaStore.getLeaderboardPlayers(filter));
  };

  // Handle Profile Update
  const handleUpdateProfile = (newCodename: string, newAvatar: string) => {
    if (!currentUser) return false;
    const ok = ArenaStore.updateProfile(currentUser.nim, newCodename, newAvatar);
    if (ok) {
      const user = ArenaStore.getCurrentUser();
      if (user) loadAllData(user);
    }
    return ok;
  };

  // Handle Onboarding Complete (Password Change Success)
  const handleOnboardingComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setIsOnboardingModalOpen(false);
    const user = ArenaStore.getCurrentUser();
    if (user) loadAllData(user);
  };

  // Handle Unlock PIN for Team Game
  const handleUnlockTeamGame = (gameId: string, pin: string) => {
    const g = games.find(item => item.id_game === gameId);
    if (!g) return false;
    if (g.pin_akses && g.pin_akses.trim().toUpperCase() === pin.trim().toUpperCase()) {
      setActiveQuizGame(g);
      return true;
    }
    return false;
  };

  // Handle Finishing Game from Arena
  const handleFinishQuiz = (finalSubmission: Submission) => {
    const finishedGame = games.find(g => g.id_game === finalSubmission.id_game);
    setActiveQuizGame(null);
    const user = ArenaStore.getCurrentUser();
    if (user) loadAllData(user);

    if (finishedGame) {
      setEditorialTarget({
        game: finishedGame,
        submission: finalSubmission
      });
    }
  };

  // Handle Team Roster Update (Create, Join, Leave, Disband)
  const handleTeamUpdated = () => {
    const user = ArenaStore.getCurrentUser();
    if (user) loadAllData(user);
  };

  if (isCheckingAuth || !currentUser) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Memverifikasi Sesi Mahasiswa...</p>
        </div>
      </div>
    );
  }

  // User Stats Calculation
  const userStats = currentUser
    ? ArenaStore.getUserStats(currentUser)
    : {
        totalGamesSelesai: 0,
        totalGamesKelas: games.length,
        jadwalKlubLabel: 'HARI KAMIS (SI C 25)',
        rataRataNilaiAkhir: 0,
        nilaiTerbaik: 0,
        totalXP: 0,
        level: 1,
        xpNeededForNext: 250,
        diagnostikStatus: '🟢 Siap Memulai',
        diagnostikSubtitle: 'Pilih Game di Katalog'
      };

  const teamGames = games.filter(g => g.mode_game === 'TEAM');

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f1f5f9] font-sans antialiased flex flex-col">
      {/* 1. Top Navbar */}
      <TopNavbar
        user={currentUser}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileNavOpen}
      />

      {/* 2. Main App Body (Sidebar Full-Height Docked di Kiri + Area Konten Dinamis di Kanan) */}
      <div className="flex-1 flex flex-col md:flex-row w-full min-h-[calc(100vh-61px)]">
        {/* A. SIDEBAR NAVIGASI KIRI: Full-Height Docked di Desktop, Off-Canvas Drawer di Mobile */}
        <StudentSidebar
          currentUser={currentUser}
          activeMenu={activeMenu}
          onMenuChange={handleMenuChange}
          onLogout={handleLogout}
          totalGamesCount={games.length}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* B. AREA KONTEN UTAMA: Offsetting Fixed Sidebar secara Presisi */}
        <main className="flex-1 min-w-0 md:ml-72 lg:ml-80 xl:ml-[328px] px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
            {/* Menu 1: /mahasiswa/dashboard */}
            {activeMenu === 'dashboard' && (
              <DashboardOverviewView
                stats={userStats}
                currentUser={currentUser}
                games={games}
                submissions={submissions}
                leaderboardPlayers={leaderboardPlayers}
                teams={teams}
                onOpenGame={(g) => setActiveQuizGame(g)}
                onViewEditorial={(g, s) => setEditorialTarget({ game: g, submission: s })}
                onNavigateTab={(tab) => handleMenuChange(tab)}
              />
            )}

            {/* Menu 2: /mahasiswa/katalog */}
            {activeMenu === 'katalog' && (
              <div className="space-y-4">
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Katalog Game &amp; Tantangan Algoritma
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Pilih paket tantangan sesuai pertemuan dan tingkat kesulitan. Selesaikan untuk mengumpulkan XP &amp; Nilai Akademik!
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 px-3 py-1.5 rounded-lg bg-[#131d33] border border-[#223354] shrink-0 self-start sm:self-auto">
                    {games.length} Paket Game
                  </span>
                </div>

                <GameCatalogGrid
                  games={games}
                  submissions={submissions}
                  currentUser={currentUser}
                  onOpenGame={(g) => setActiveQuizGame(g)}
                  onViewEditorial={(g, s) => setEditorialTarget({ game: g, submission: s })}
                  onStartCoding={(problem, game) => setActiveCodingProblem({ problem, sourceGame: game })}
                />
              </div>
            )}

            {/* Menu 3: /mahasiswa/team (Tim & Kode Gabung DOMjudge) */}
            {activeMenu === 'team' && (
              <div className="space-y-4">
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Tim &amp; Kode Gabung (ICPC Team Roster)
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Bentuk squad bertiga (Maksimal 3 Mahasiswa) untuk kompetisi DOMjudge internal atau gabung menggunakan Kode Tim 6-Karakter.
                  </p>
                </div>

                <TeamBattleTab
                  currentUser={currentUser}
                  teams={teams}
                  teamGames={teamGames}
                  onUnlockTeamGame={handleUnlockTeamGame}
                  onTeamUpdated={handleTeamUpdated}
                />
              </div>
            )}

            {/* Menu 4: /mahasiswa/capaian */}
            {activeMenu === 'capaian' && (
              <div className="space-y-4">
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Capaian Prestasi &amp; Rekomendasi Modul
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Evaluasi kemajuan materi komputasional dan kumpulkan semua lencana milestone kompetisi.
                  </p>
                </div>

                <CapaianTab
                  currentUser={currentUser}
                  submissions={submissions}
                  games={games}
                />
              </div>
            )}

            {/* Menu 5: /mahasiswa/leaderboard (Scoreboard ICPC) */}
            {activeMenu === 'leaderboard' && (
              <LeaderboardView
                players={leaderboardPlayers}
                teams={teams}
                currentUser={currentUser}
                initialFilter={leaderboardFilter}
                onFilterChange={handleLeaderboardFilterChange}
              />
            )}

            {/* Menu: /mahasiswa/submisi (DOMjudge Live Verdict Log) */}
            {activeMenu === 'submisi' && (
              <SubmissionsHistoryTab
                currentUser={currentUser}
                submissions={submissions}
                games={games}
                onViewEditorial={(g, s) => setEditorialTarget({ game: g, submission: s })}
              />
            )}

            {/* Menu 6: /mahasiswa/profil */}
            {activeMenu === 'profil' && (
              <div className="space-y-4">
                <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl p-5 shadow-xl">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Profil Mahasiswa &amp; Akun Kompetisi
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Informasi kredensial akademik terdaftar, identitas handle Scoreboard ICPC, dan status squad tim DOMjudge internal.
                  </p>
                </div>

                <ProfileTab
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  teams={teams}
                  submissions={submissions}
                  games={games}
                />
              </div>
            )}
        </main>
      </div>

      {/* MODAL 1: Arena Kuis Ketat (Dual Timer, One-Shot, Anti-Cheat) */}
      {activeQuizGame && currentUser && (
        <QuizArenaModal
          isOpen={true}
          game={activeQuizGame}
          currentUser={currentUser}
          onFinishGame={handleFinishQuiz}
          onCancel={() => setActiveQuizGame(null)}
        />
      )}

      {/* MODAL 2: Editorial & Hasil Submisi */}
      {editorialTarget && (
        <EditorialModal
          isOpen={true}
          game={editorialTarget.game}
          submission={editorialTarget.submission}
          questions={questions}
          onClose={() => setEditorialTarget(null)}
          onStartCoding={(problem, game) => {
            setEditorialTarget(null);
            setActiveCodingProblem({ problem, sourceGame: game });
          }}
        />
      )}

      {/* MODAL 3: Tantangan Koding Online Judge (Topik Sesuai Kuis) */}
      {activeCodingProblem && (
        <CodingArenaModal
          isOpen={true}
          problem={activeCodingProblem.problem}
          sourceGame={activeCodingProblem.sourceGame}
          onClose={() => setActiveCodingProblem(null)}
        />
      )}

      {/* MODAL 4: Onboarding Perdana & Pembaruan Kata Sandi Mahasiswa (Zero AI Slop) */}
      {isOnboardingModalOpen && currentUser && (
        <FirstLoginOnboardingModal
          isOpen={isOnboardingModalOpen}
          currentUser={currentUser}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}

