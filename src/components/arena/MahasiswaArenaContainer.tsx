'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Game, Question, Submission, User, Team, LeaderboardPlayer, KlubHari, Cohort } from '@/types/arena';
import { ArenaStore } from '@/lib/arena-store';
import { CheckCircle2 } from 'lucide-react';

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
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Filtering
  const [leaderboardFilter, setLeaderboardFilter] = useState<KlubHari>('KAMIS');
  const [leaderboardPlayers, setLeaderboardPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Notifications
  const [activeQuizGame, setActiveQuizGame] = useState<Game | null>(null);
  const [editorialTarget, setEditorialTarget] = useState<{ game: Game; submission: Submission } | null>(null);
  const [activeCodingProblem, setActiveCodingProblem] = useState<{ problem: Problem; sourceGame?: Game | null } | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const onboardingCompletedRef = useRef(false);

  // 1. Data Loader (Dengan Isolasi Paket Soal Ketat Per Kohort)
  const loadAllData = useCallback((user: User) => {
    setCurrentUser(user);

    // Cek apakah mahasiswa wajib onboarding (ganti password perdana)
    // Jika onboarding baru saja diselesaikan pada sesi ini, jangan buka ulang modal akibat hidrasi lambat
    if (onboardingCompletedRef.current) {
      setIsOnboardingModalOpen(false);
    } else if (user.role === 'PESERTA') {
      const hasChangedPassword = user.is_first_login === false || Boolean(user.password_changed_at);
      const isExplicitDefaultPass = Boolean(user.password) && user.password === user.nim;
      const needsOnboard = !hasChangedPassword || isExplicitDefaultPass;
      setIsOnboardingModalOpen(needsOnboard);
    } else {
      setIsOnboardingModalOpen(false);
    }

    const c = ArenaStore.getCohorts();
    setCohorts(c);

    // Isolasi ketat: hanya tampilkan paket soal yang diizinkan bagi kohort mahasiswa ini
    const allGames = ArenaStore.getGames();
    const visibleGames = ArenaStore.getGamesForUser(user, allGames, c);
    setGames(visibleGames);

    const q = ArenaStore.getQuestions();
    setQuestions(q);

    const s = ArenaStore.getSubmissions();
    setSubmissions(s);

    const t = ArenaStore.getTeams();
    setTeams(t);

    const legacyFilter: KlubHari = (user?.klub_hari && user.klub_hari !== 'ALL') ? user.klub_hari : 'ALL';
    setLeaderboardFilter(legacyFilter);
    const dynamicLeaderboardKey = user?.id_cohort || legacyFilter;
    setLeaderboardPlayers(ArenaStore.getLeaderboardPlayers(dynamicLeaderboardKey));
  }, []);

  // Route Guard: Pastikan sesi aktif + Hidrasi Live Supabase (dengan pemulihan otomatis dari HttpOnly cookie)
  useEffect(() => {
    let cancelled = false;

    const initStudentSession = async () => {
      let user = ArenaStore.getCurrentUser();

      // Jika localStorage kosong namun HttpOnly cookie valid (misal akun baru / tab baru), pulihkan dari server
      if (!user) {
        try {
          const sessionRes = await fetch('/api/auth/session', {
            cache: 'no-store',
            credentials: 'same-origin',
          });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData?.authenticated && sessionData?.session) {
              await ArenaStore.hydrateFromServer({
                role: sessionData.session.role,
                nim: sessionData.session.nim,
              });
              user = ArenaStore.getCurrentUser();
            }
          }
        } catch {
          // Abaikan error jaringan, lanjut redirect ke login
        }
      }

      if (cancelled) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      loadAllData(user);
      setIsCheckingAuth(false);

      // Sinkronisasi state terbaru dari Supabase PostgreSQL (non-blocking)
      ArenaStore.hydrateFromServer({ role: user.role, nim: user.nim }).then((res) => {
        if (!cancelled && res.synced) {
          const freshUser = ArenaStore.getCurrentUser() || user;
          loadAllData(freshUser);
        }
      });
    };

    initStudentSession();
    return () => {
      cancelled = true;
    };
  }, [router, loadAllData]);

  // Handle Dynamic URL Navigation
  const handleMenuChange = (newMenu: StudentActiveMenu) => {
    setIsMobileNavOpen(false);
    router.push(`/mahasiswa/${newMenu}`);
  };

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const user = ArenaStore.getCurrentUser();
    if (user) {
      await ArenaStore.hydrateFromServer({ role: user.role, nim: user.nim });
      const freshUser = ArenaStore.getCurrentUser() || user;
      loadAllData(freshUser);
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  // Handle Logout
  const handleLogout = async () => {
    await ArenaStore.logout();
    window.location.assign('/login');
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

  // Handle Onboarding Complete (Password Change Success -> Tutup Modal Seketika)
  const handleOnboardingComplete = (updatedUser: User) => {
    onboardingCompletedRef.current = true;
    setIsOnboardingModalOpen(false);
    setCurrentUser(updatedUser);
    loadAllData(updatedUser);
    setStatusBanner('Kata sandi baru berhasil disimpan. Selamat datang di Arena Pembelajaran!');
    setTimeout(() => setStatusBanner(null), 5000);
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
            {statusBanner && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/35 text-emerald-300 text-xs font-mono flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusBanner}</span>
              </div>
            )}

            {/* Menu 1: /mahasiswa/dashboard */}
            {activeMenu === 'dashboard' && (
              <DashboardOverviewView
                stats={userStats}
                currentUser={currentUser}
                games={games}
                cohorts={cohorts}
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

