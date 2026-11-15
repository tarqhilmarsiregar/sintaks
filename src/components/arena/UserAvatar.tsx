'use client';

import React from 'react';
import { User } from '@/types/arena';

/**
 * Menghasilkan 2 huruf monogram inisial profesional.
 * Prioritas: nama_lengkap -> codename -> default fallback ('CP')
 * Contoh:
 * - "Indra Setiawan" -> "IS"
 * - "Cecilia" -> "CE"
 * - "Indra_trll" -> "IT"
 */
export function getMonogramInitials(nama?: string, codename?: string): string {
  const target = (nama || codename || '').trim();
  if (!target) return 'CP';

  // Pisahkan berdasarkan spasi atau underscore
  const words = target.split(/[\s_]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  // Jika 1 kata tunggal (misal "Cecilia" atau "Admin")
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0] || 'CP').toUpperCase().substring(0, 2);
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface UserAvatarProps {
  user?: Partial<User> | null;
  nama?: string;
  nim?: string;
  codename?: string;
  size?: AvatarSize;
  className?: string;
  showBorder?: boolean;
}

const SIZE_MAP: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6 rounded-md', text: 'text-[11px]' },
  sm: { container: 'w-7 h-7 rounded-md', text: 'text-xs' },
  md: { container: 'w-9 h-9 rounded-lg', text: 'text-sm' },
  lg: { container: 'w-11 h-11 rounded-lg', text: 'text-base font-bold' },
  xl: { container: 'w-16 h-16 rounded-xl', text: 'text-2xl font-black' },
  '2xl': { container: 'w-20 h-20 rounded-xl', text: 'text-3xl font-black' },
};

/**
 * Industrial Monochrome Avatar (Gaya Linear & Vercel)
 * - Tampilan tenang, netral, dan berwibawa
 * - Nol gradien neon acak / anti-AI Slop
 * - Kontras optik tinggi dengan standar WCAG AAA
 */
export default function UserAvatar({
  user,
  nama,
  nim,
  codename,
  size = 'sm',
  className = '',
  showBorder = true,
}: UserAvatarProps) {
  const resolvedNama = nama || user?.nama_lengkap || '';
  const resolvedCodename = codename || user?.codename || '';
  const initials = getMonogramInitials(resolvedNama, resolvedCodename);
  const sizeConfig = SIZE_MAP[size];

  const borderClass = showBorder
    ? 'border border-[#26354f] shadow-sm'
    : 'border-0';

  return (
    <div
      className={`bg-[#151f32] text-slate-200 font-mono font-bold flex items-center justify-center select-none shrink-0 tracking-wider transition-colors duration-150 ${sizeConfig.container} ${sizeConfig.text} ${borderClass} ${className}`}
      aria-hidden="true"
      title={resolvedNama || resolvedCodename}
    >
      <span className="leading-none drop-shadow-sm">{initials}</span>
    </div>
  );
}
