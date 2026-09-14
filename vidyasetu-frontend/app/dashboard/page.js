'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  Target,
  FolderLock,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Verifying student session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Student Learning Portal</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            My Enrolled Programs &amp; <span className="text-indigo-600">Mock Series</span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Continue practicing full-length timed tests, review detailed solutions for past attempts,
            and monitor your validity periods across all subscribed modules.
          </p>
        </div>
      </section>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Loading enrolled subscriptions...</span>
          </div>
        </div>
      ) : null}

      {/* Error state */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Empty State */}
      {!loading && !dashboard.purchased_catalogs.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FolderLock className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              No Subscribed Modules Yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              You haven&apos;t enrolled in any paid mock series yet. You can explore the exam catalog to practice free demo drills or unlock full test access.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <span>Explore Exam Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Enrolled Catalogs & Sections */}
      <div className="space-y-8">
        {dashboard.purchased_catalogs.map((catalog) => (
          <section
            key={catalog.catalog_id}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel sm:p-8"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {catalog.catalog_title}
                  </h2>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    {catalog.sections.length} {catalog.sections.length === 1 ? 'Module' : 'Modules'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Active mock test series and reference study guides
                </p>
              </div>

              <Link
                href={`/catalog/${catalog.catalog_slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {catalog.sections.map((section) => (
                <Link
                  key={section.section_id}
                  href={`/section/${section.section_id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-panel-hover"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Enrolled &amp; Active</span>
                      </span>
                      <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-900/5">
                        Test Series
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {section.section_title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {section.section_description}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-200/60 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Valid until {new Date(section.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      <span>Practice Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
