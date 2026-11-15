/**
 * Global Site & Branding Configuration (Single Source of Truth)
 * SINTAKS — Competitive Programming Platform
 */
export const SITE_CONFIG = {
  name: 'Sintaks',
  brandMark: 'sintaks.',
  subname: 'arena',
  fullName: 'Sintaks — Competitive Programming Arena',
  version: '2.1',
  tagline: 'Competitive Execution Matrix & Learning Arena',
  description:
    'Platform Gamifikasi Pembelajaran Competitive Programming & Problem Solving STMIK TIME Medan. High-concurrency compilation sandbox dengan evaluasi algoritma berstandar ACM-ICPC.',
  institution: {
    name: 'STMIK TIME Medan',
    club: 'Programming (Problem Solving) Club STMIK TIME',
    advisor: 'Tarq Hilmar Siregar, S.Kom.',
  },
  copyright: '© 2026 Sintaks • Programming (Problem Solving) Club STMIK TIME',
} as const;

export type SiteConfig = typeof SITE_CONFIG;
