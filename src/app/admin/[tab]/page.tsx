'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminCommandCenterContainer from '@/components/admin/AdminCommandCenterContainer';
import { AdminActiveTab } from '@/types/arena';

const VALID_TABS: AdminActiveTab[] = [
  'contests',
  'games',
  'problems',
  'questions',
  'submissions',
  'teams',
  'students',
  'export'
];

// Alias mapping untuk fleksibilitas navigasi URL admin
const TAB_ALIASES: Record<string, AdminActiveTab> = {
  'kontes': 'contests',
  'games': 'contests',
  'game': 'contests',
  'contest': 'contests',
  'questions': 'problems',
  'question': 'problems',
  'problem': 'problems',
  'soal': 'problems',
  'bank-soal': 'problems',
  'problem-bank': 'problems',
  'submisi': 'submissions',
  'judgement': 'submissions',
  'tim': 'teams',
  'team': 'teams',
  'mahasiswa': 'students',
  'peserta': 'students',
  'ekspor': 'export',
  'rekap': 'export',
};

export default function AdminDynamicTabPage() {
  const params = useParams();
  const router = useRouter();

  const rawTab = (params?.tab as string) || 'contests';
  const resolvedTab = TAB_ALIASES[rawTab] || (VALID_TABS.includes(rawTab as AdminActiveTab) ? (rawTab as AdminActiveTab) : null);

  useEffect(() => {
    if (!resolvedTab) {
      router.replace('/admin/contests');
    }
  }, [resolvedTab, router]);

  const activeTab: AdminActiveTab = resolvedTab || 'contests';

  return <AdminCommandCenterContainer activeAdminTab={activeTab} />;
}
