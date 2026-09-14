'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, hasRole } from './auth';
import { useRequireAuth } from './useRequireAuth';

export function useRequireAdmin() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const user = getAuthUser();

    if (!hasRole(user, 'admin')) {
      router.replace('/dashboard');
      return;
    }

    setAllowed(true);
  }, [ready, router]);

  return allowed;
}
