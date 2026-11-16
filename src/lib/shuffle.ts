/**
 * CP-Arena: Deterministic Seeded PRNG & Shuffling Engine
 * 
 * Digunakan untuk mengacak urutan soal kuis atau tantangan kompetisi secara unik
 * per peserta (berbasis NIM + Game ID) menggunakan algoritma Fisher-Yates yang
 * deterministik (idempotent across reloads).
 */

/**
 * Mengonversi sembarang string (misal NIM + GameID) menjadi 32-bit unsigned integer hash (FNV-1a).
 */
export function stringToSeed(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Generator angka pseudorandom 32-bit (Mulberry32 PRNG).
 * Menghasilkan nilai floating point dalam rentang [0, 1) secara deterministik dari seed.
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function mulberry32(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mengacak array secara deterministik menggunakan algoritma Fisher-Yates (Knuth) Shuffle.
 * Array asli tidak dimutasi (pure immutable function).
 */
export function seededShuffle<T>(items: readonly T[], seed: string | number): T[] {
  if (items.length <= 1) return [...items];

  const arr = [...items];
  const numericSeed = typeof seed === 'number' ? seed : stringToSeed(seed);
  const rng = createSeededRandom(numericSeed);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr;
}
