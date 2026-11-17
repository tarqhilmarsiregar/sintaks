import { User, Submission, Team, KlubHari, TeamFairnessMetrics } from '@/types/arena';

/**
 * 1. Menghitung Nilai Akademik Resmi (Skala 0 - 100)
 * Nilai Murni = round((Jumlah Benar / Total Soal) * 100)
 * Penalti Tab = Tab Switch Count * 5
 * Nilai Bersih = max(0, Nilai Murni - Penalti Tab)
 */
export function calculateAcademicGrade(
  correctCount: number,
  totalQuestions: number,
  tabSwitchCount: number
): {
  nilaiMurni: number;
  penaltiTab: number;
  nilaiAkhirBersih: number;
} {
  if (totalQuestions <= 0) {
    return { nilaiMurni: 0, penaltiTab: 0, nilaiAkhirBersih: 0 };
  }
  const nilaiMurni = Math.round((correctCount / totalQuestions) * 100);
  const penaltiTab = tabSwitchCount * 5;
  const nilaiAkhirBersih = Math.max(0, nilaiMurni - penaltiTab);

  return { nilaiMurni, penaltiTab, nilaiAkhirBersih };
}

/**
 * 2. Menghitung Skor XP untuk 1 Soal
 * Poin Dasar: dikurangi 25 jika buka hint (minimal 15 XP)
 * Speed Bonus: min(60, round(sisaDetik * 1.2))
 * Streak Bonus: +50 XP jika streak >= 3
 * First Blood: +25 XP jika pemecah pertama
 */
export function calculateQuestionXP(params: {
  basePoints: number;
  openedHint: boolean;
  remainingSeconds: number;
  currentStreak: number;
  isFirstBlood: boolean;
}): {
  baseXP: number;
  speedBonus: number;
  streakBonus: number;
  firstBloodBonus: number;
  totalXP: number;
} {
  const { basePoints, openedHint, remainingSeconds, currentStreak, isFirstBlood } = params;

  // Poin dasar setelah hint
  let baseXP = basePoints;
  if (openedHint) {
    baseXP = Math.max(15, basePoints - 25);
  }

  // Speed bonus
  const speedBonus = Math.min(60, Math.round(Math.max(0, remainingSeconds) * 1.2));

  // Streak bonus
  const streakBonus = currentStreak >= 3 ? 50 : 0;

  // First blood bonus
  const firstBloodBonus = isFirstBlood ? 25 : 0;

  const totalXP = baseXP + speedBonus + streakBonus + firstBloodBonus;

  return {
    baseXP,
    speedBonus,
    streakBonus,
    firstBloodBonus,
    totalXP
  };
}

/**
 * 3. Menghitung Level & Tier Badge Pemain
 * Level naik setiap kelipatan 250 XP: Level = floor(total_xp / 250) + 1
 */
export function calculateLevelInfo(totalXP: number): {
  level: number;
  currentLevelMinXP: number;
  nextLevelXP: number;
  xpNeededForNext: number;
  progressPercent: number;
  tierBadge: string;
} {
  const level = Math.max(1, Math.floor(totalXP / 250) + 1);
  const currentLevelMinXP = (level - 1) * 250;
  const nextLevelXP = level * 250;
  const xpNeededForNext = Math.max(0, nextLevelXP - totalXP);
  const progressInLevel = totalXP - currentLevelMinXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / 250) * 100)));

  let tierBadge = '🌱 Logic Novice';
  if (level >= 10) {
    tierBadge = '👑 Grandmaster Time';
  } else if (level >= 6) {
    tierBadge = '🛡️ Greedy Tactician';
  } else if (level >= 3) {
    tierBadge = '⚡ O(N) Sprinter';
  }

  return {
    level,
    currentLevelMinXP,
    nextLevelXP,
    xpNeededForNext,
    progressPercent,
    tierBadge
  };
}

/**
 * 4. Algoritma Pembentukan Tim Berimbang (Snake-Draft)
 * 1 -> 2 -> 3 -> 3 -> 2 -> 1
 * Membagi mahasiswa per kohort / klub secara seimbang berdasarkan urutan XP & angkatan
 */
export function generateSnakeDraftTeams(
  students: User[],
  cohortIdOrKlub: string,
  targetTeamSize: number = 3,
  cohortName?: string
): Team[] {
  const isLegacyKlub = ['KAMIS', 'JUMAT', 'LOMBA', 'ALL'].includes(cohortIdOrKlub);
  const klubHariFallback: KlubHari = isLegacyKlub ? (cohortIdOrKlub as KlubHari) : 'KAMIS';

  // Filter mahasiswa berdasarkan kelas / kohort (hanya role PESERTA)
  const pool = students
    .filter(s => {
      if (s.role !== 'PESERTA') return false;
      if (cohortIdOrKlub === 'ALL') return true;
      if (s.id_cohort && (s.id_cohort === cohortIdOrKlub || s.id_cohort === `c-${cohortIdOrKlub.toLowerCase()}`)) return true;
      if (s.klub_hari && s.klub_hari === cohortIdOrKlub) return true;
      return false;
    })
    .sort((a, b) => {
      // Urutkan XP tertinggi ke terendah, lalu senioritas angkatan (2024 lebih dulu daripada 2025)
      if (b.total_xp !== a.total_xp) {
        return b.total_xp - a.total_xp;
      }
      return a.angkatan - b.angkatan;
    });

  if (pool.length === 0) return [];

  const numTeams = Math.max(1, Math.ceil(pool.length / Math.max(1, targetTeamSize)));
  const teams: {
    id_tim: string;
    nama_tim: string;
    klub_hari: KlubHari;
    id_cohort?: string;
    members: User[];
  }[] = [];

  // Generate prefix kode gabung
  let prefix = 'TIM';
  if (isLegacyKlub) {
    prefix = `TIM${cohortIdOrKlub[0]}`;
  } else {
    const cleanCode = cohortIdOrKlub.replace(/^c-/, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    prefix = `TIM${cleanCode.substring(0, 3) || 'S'}`;
  }

  for (let i = 0; i < numTeams; i++) {
    const teamNum = i + 1;
    let idTim = `TIM-${cohortIdOrKlub.substring(0, 5).toUpperCase()}-${teamNum}`;
    if (isLegacyKlub) {
      idTim = `TIM-${cohortIdOrKlub.substring(0, 3)}-${teamNum}`;
    }

    let teamDisplayName = `Squad ${cohortName || cohortIdOrKlub} #${teamNum}`;
    if (isLegacyKlub) {
      teamDisplayName = `Squad ${cohortIdOrKlub} #${teamNum}`;
    }

    teams.push({
      id_tim: idTim,
      nama_tim: teamDisplayName,
      klub_hari: klubHariFallback,
      id_cohort: isLegacyKlub ? undefined : cohortIdOrKlub,
      members: []
    });
  }

  // Snake draft distribution:
  // Round 0: 0 -> numTeams - 1
  // Round 1: numTeams - 1 -> 0
  // Round 2: 0 -> numTeams - 1 ...
  let currentTeamIndex = 0;
  let direction = 1; // 1 for forward, -1 for backward

  pool.forEach((student) => {
    teams[currentTeamIndex].members.push(student);
    currentTeamIndex += direction;

    if (currentTeamIndex >= numTeams) {
      currentTeamIndex = numTeams - 1;
      direction = -1;
    } else if (currentTeamIndex < 0) {
      currentTeamIndex = 0;
      direction = 1;
    }
  });

  return teams.map((t, idx) => {
    const teamNum = idx + 1;
    const teamNumStr = teamNum < 10 ? `0${teamNum}` : `${teamNum}`;
    const kodeGabung = `${prefix.substring(0, 4)}${teamNumStr}`.substring(0, 6);

    return {
      id_tim: t.id_tim,
      nama_tim: t.nama_tim,
      klub_hari: t.klub_hari,
      id_cohort: t.id_cohort,
      kode_gabung: kodeGabung,
      leader_nim: t.members.length > 0 ? t.members[0].nim : undefined,
      daftar_nim_json: t.members.map(m => m.nim),
      daftar_nama_json: t.members.map(m => `${m.nama_lengkap} (${m.codename})`),
      total_skor_tim: t.members.reduce((acc, m) => acc + m.total_xp, 0)
    };
  });
}

/**
 * 5. Menghitung Metrik Keseimbangan & Fairness Pembagian Tim (Snake-Draft Analytics)
 */
export function calculateTeamFairnessMetrics(teams: Team[]): TeamFairnessMetrics {
  if (teams.length === 0) {
    return {
      totalTeams: 0,
      totalStudents: 0,
      averageXP: 0,
      minXP: 0,
      maxXP: 0,
      deltaXP: 0,
      standardDeviation: 0,
      deviationPercent: 0,
      balanceRating: 'OPTIMAL'
    };
  }

  const scores = teams.map(t => t.total_skor_tim || 0);
  const totalStudents = teams.reduce((acc, t) => acc + (t.daftar_nim_json?.length || 0), 0);
  const sumXP = scores.reduce((acc, s) => acc + s, 0);
  const averageXP = Math.round(sumXP / scores.length);

  const minXP = Math.min(...scores);
  const maxXP = Math.max(...scores);
  const deltaXP = maxXP - minXP;

  // Standar deviasi: sqrt(sum((x - mean)^2) / N)
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - averageXP, 2), 0) / scores.length;
  const standardDeviation = Math.round(Math.sqrt(variance));

  const deviationPercent = averageXP > 0 ? Math.round((standardDeviation / averageXP) * 100) : 0;

  let balanceRating: 'OPTIMAL' | 'GOOD' | 'MODERATE' | 'IMBALANCED' = 'OPTIMAL';
  if (deviationPercent <= 10) {
    balanceRating = 'OPTIMAL';
  } else if (deviationPercent <= 20) {
    balanceRating = 'GOOD';
  } else if (deviationPercent <= 30) {
    balanceRating = 'MODERATE';
  } else {
    balanceRating = 'IMBALANCED';
  }

  return {
    totalTeams: teams.length,
    totalStudents,
    averageXP,
    minXP,
    maxXP,
    deltaXP,
    standardDeviation,
    deviationPercent,
    balanceRating
  };
}

