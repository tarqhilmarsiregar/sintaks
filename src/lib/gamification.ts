import { User, Submission, Team, KlubHari } from '@/types/arena';

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
 * Membagi mahasiswa per klub hari (Kamis / Jumat) secara seimbang berdasarkan urutan XP & angkatan
 */
export function generateSnakeDraftTeams(
  students: User[],
  klubHari: KlubHari,
  targetTeamSize: number = 3
): Team[] {
  // Filter mahasiswa berdasarkan kelas (hanya role PESERTA)
  const pool = students
    .filter(s => s.role === 'PESERTA' && (s.klub_hari === klubHari || klubHari === 'ALL'))
    .sort((a, b) => {
      // Urutkan XP tertinggi ke terendah, lalu senioritas angkatan (2024 lebih dulu daripada 2025)
      if (b.total_xp !== a.total_xp) {
        return b.total_xp - a.total_xp;
      }
      return a.angkatan - b.angkatan;
    });

  if (pool.length === 0) return [];

  const numTeams = Math.max(1, Math.ceil(pool.length / targetTeamSize));
  const teams: {
    id_tim: string;
    nama_tim: string;
    klub_hari: KlubHari;
    members: User[];
  }[] = [];

  for (let i = 0; i < numTeams; i++) {
    const teamNum = i + 1;
    const kodeGabung = `TIM${klubHari[0]}${teamNum < 10 ? '0' + teamNum : teamNum}`;
    teams.push({
      id_tim: `TIM-${klubHari.substring(0, 3)}-${teamNum}`,
      nama_tim: `Squad ${klubHari} #${teamNum}`,
      klub_hari: klubHari,
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
    const kodeGabung = `TIM${t.klub_hari[0]}${teamNum < 10 ? '0' + teamNum : teamNum}`;
    return {
      id_tim: t.id_tim,
      nama_tim: t.nama_tim,
      klub_hari: t.klub_hari,
      kode_gabung: kodeGabung,
      leader_nim: t.members.length > 0 ? t.members[0].nim : undefined,
      daftar_nim_json: t.members.map(m => m.nim),
      daftar_nama_json: t.members.map(m => `${m.nama_lengkap} (${m.codename})`),
      total_skor_tim: t.members.reduce((acc, m) => acc + m.total_xp, 0)
    };
  });
}

