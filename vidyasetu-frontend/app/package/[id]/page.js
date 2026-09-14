'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyPackagePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return <p className="text-sm text-slate-500">Redirecting to the LMS dashboard...</p>;
}
