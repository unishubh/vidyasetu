'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthUser, hasRole } from './auth';
import { useRequireAuth } from './useRequireAuth';

export function useRequireStaff() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const user = getAuthUser();

    if (!hasRole(user, 'admin', 'teacher')) {
      router.replace('/dashboard');
      return;
    }

    setAllowed(true);
  }, [ready, router]);

  return allowed;
}
