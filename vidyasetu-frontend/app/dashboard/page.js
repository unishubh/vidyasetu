'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function DashboardPage() {
  const ready = useRequireAuth();
  const [dashboard, setDashboard] = useState({ purchased_catalogs: [], purchases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await api.get('/student/dashboard');
        setDashboard(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load student dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [ready]);

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking your session...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 px-8 py-10 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Student Home
        </p>
        <h1 className="mt-3 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-ink">
          Purchased subsections, attempts, and learning resources.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Open any purchased subsection to continue reading content, buy additional packs, or attempt full-length mocks.
        </p>
      </section>

      {loading ? <p className="text-sm text-slate-500">Loading purchases...</p> : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !dashboard.purchased_catalogs.length ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-8 text-sm text-slate-600">
          No paid subsections yet. Browse the catalog and buy a subsection to unlock tests, videos,
          and documents.
        </div>
      ) : null}

      <div className="space-y-6">
        {dashboard.purchased_catalogs.map((catalog) => (
          <section
            key={catalog.catalog_id}
            className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold leading-tight text-ink">{catalog.catalog_title}</h2>
                <p className="mt-1 text-sm text-slate-500">{catalog.sections.length} purchased subsections</p>
              </div>
              <Link
                href={`/catalog/${catalog.catalog_slug}`}
                className="text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                View full catalog
              </Link>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {catalog.sections.map((section) => (
                <Link
                  key={section.section_id}
                  href={`/section/${section.section_id}`}
                  className="flex h-full flex-col rounded-3xl border border-slate-100 bg-slate-50/80 p-5 transition hover:border-sky-300 hover:bg-white"
                >
                  <h3 className="text-lg font-semibold leading-tight text-ink">{section.section_title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{section.section_description}</p>
                  <p className="mt-auto pt-4 text-sm font-medium text-sky-700">
                    Access valid until {new Date(section.valid_until).toLocaleDateString('en-IN')}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
