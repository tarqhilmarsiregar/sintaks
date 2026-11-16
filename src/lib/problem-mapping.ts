import { Problem } from '@/types';
import { MOCK_PROBLEMS } from '@/lib/mock-data';
import { ArenaStore } from '@/lib/arena-store';

/**
 * Mapping topik paket soal kuis (Game G1-G7, G8...) ke tantangan Problem Solving Coding (Online Judge).
 * Mendukung pembacaan dinamis dari ArenaStore jika telah dikonfigurasi oleh Admin.
 */
export function getCodingProblemForGame(gameId: string): Problem {
  try {
    const dynamicProb = ArenaStore.getCodingProblemForGame(gameId);
    if (dynamicProb) return dynamicProb;
  } catch {
    // fallback to static lookup if storage uninitialized
  }

  const mapping: Record<string, string> = {
    G1: 'penjumlahan-dua-bilangan-prima', // Pemanasan Logika & Big-O -> Math / Prime Search O(N)
    G2: 'rotasi-matriks-spiral-terbalik', // Fast I/O & Presisi Python -> Matrix Simulation & Fast I/O
    G3: 'jalur-terpendek-gedung-kampus', // Online Judge Anatomy & Graph -> Shortest Path (Dijkstra)
    G4: 'optimasi-tas-ransel-mahasiswa', // Analisis 10^8 & Ad-Hoc -> 0/1 Knapsack Dynamic Programming
    G5: 'penjumlahan-dua-bilangan-prima',
    G6: 'rotasi-matriks-spiral-terbalik',
    G7: 'optimasi-tas-ransel-mahasiswa',
  };

  const targetSlug = mapping[gameId] || 'penjumlahan-dua-bilangan-prima';
  const found = MOCK_PROBLEMS.find((p) => p.slug === targetSlug);

  return found || MOCK_PROBLEMS[0];
}
