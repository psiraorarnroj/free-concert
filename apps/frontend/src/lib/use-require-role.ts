'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import type { Role } from './api';

export function useRequireRole(role: Role) {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) {
      router.replace(user.role === 'ADMIN' ? '/admin' : '/user');
    }
  }, [isLoading, token, user, role, router]);

  const isReady = !isLoading && !!token && !!user && user.role === role;
  return { user, token, isReady };
}
