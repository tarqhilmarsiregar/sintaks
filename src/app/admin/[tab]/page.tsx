'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminCommandCenterContainer, { AdminActiveTab } from '@/components/admin/AdminCommandCenterContainer';

const VALID_TABS: AdminActiveTab[] = ['games', 'questions', 'teams', 'students'];

export default function AdminDynamicTabPage() {
  const params = useParams();
  const router = useRouter();

  const rawTab = (params?.tab as string) || 'games';
  const isValid = VALID_TABS.includes(rawTab as AdminActiveTab);

  useEffect(() => {
    if (!isValid) {
      router.replace('/admin/games');
    }
  }, [isValid, router]);

  const activeTab: AdminActiveTab = isValid ? (rawTab as AdminActiveTab) : 'games';

  return <AdminCommandCenterContainer activeAdminTab={activeTab} />;
}

