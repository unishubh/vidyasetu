'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacyTestPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!params.attemptId) {
      router.replace('/dashboard');
      return;
    }

    router.replace(`/attempt/${params.attemptId}`);
  }, [params.attemptId, router]);

  return <p className="text-sm text-slate-500">Redirecting to the new attempt flow...</p>;
}
