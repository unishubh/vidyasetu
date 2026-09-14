'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  CheckCircle2,
  FileText,
  Video,
  Presentation,
  FileCode,
  Target,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useRequireAuth } from '@/lib/useRequireAuth';

function getContentIcon(type) {
  switch (type) {
    case 'video':
      return Video;
    case 'ppt':
      return Presentation;
    case 'doc':
      return FileCode;
    case 'pdf':
    default:
      return FileText;
  }
}

export default function SectionPage() {
  const ready = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [startingTestId, setStartingTestId] = useState(null);

  useEffect(() => {
    if (!ready || !params.id) {
      return;
    }

    const fetchSection = async () => {
      try {
        const response = await api.get(`/student/sections/${params.id}`);
        setSection(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load subsection');
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [params.id, ready]);

  const refreshSection = async () => {
    const response = await api.get(`/student/sections/${params.id}`);
    setSection(response.data);
  };

  const handleBuyNow = async () => {
    if (!section) {
      return;
    }

    setPurchasing(true);
    setError('');

    try {
      const orderResponse = await api.post('/student/purchases/create-order', {
        section_id: section.id,
      });
      await api.post(`/student/purchases/${orderResponse.data.purchase_id}/verify`, {
        upi_ref: `AUTO-UPI-${Date.now()}`,
      });
      await refreshSection();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleStartTest = async (testId) => {
    setStartingTestId(testId);
    setError('');

    try {
      const response = await api.post(`/student/tests/${testId}/start`);
      router.push(`/attempt/${response.data.attempt_id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to start test');
      setStartingTestId(null);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Checking your session...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Loading module details...</span>
        </div>
      </div>
    );
  }

  if (!section) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/" className="transition-colors hover:text-indigo-600">
          Catalog
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link
          href={`/catalog/${section.catalog_slug}`}
          className="transition-colors hover:text-indigo-600"
        >
          {section.catalog_title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900">{section.title}</span>
      </nav>

      {/* Hero / Header Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="space-y-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              {section.catalog_title}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {section.title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {section.description}
            </p>
          </div>

          {/* Access & Validity Status Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <span className="text-xs font-medium text-slate-500">Subsection Price</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(section.price_paise)}</span>
            </div>

            <dl className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Validity</span>
                </dt>
                <dd className="font-semibold text-slate-800">{section.validity_days} Days</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                  <span>Paid Attempt Cap</span>
                </dt>
                <dd className="font-semibold text-slate-800">10 Attempts Total</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                  <span>Status</span>
                </dt>
                <dd>
                  {section.has_purchase ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      <Lock className="h-3 w-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {section.has_purchase ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3 text-xs text-indigo-900 space-y-1">
                <p className="font-semibold">
                  Remaining Paid Attempts: {section.purchase.attempts_remaining} / {section.purchase.max_attempts}
                </p>
                <p className="text-[11px] text-indigo-700">
                  Valid until {new Date(section.purchase.valid_until).toLocaleDateString('en-IN')}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Unlock Callout (if not purchased) */}
      {!section.has_purchase ? (
        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <Lock className="h-3.5 w-3.5" />
                <span>Unlock Paid Tests & Resources</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Get full access to all {section.title} mocks
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Unlock {section.tests.filter((t) => !t.is_demo).length} paid full-length tests and learning materials.
                Includes 30 days validity and up to 10 attempt quotas. Free demos remain accessible below.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={purchasing}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Unlock className="h-4 w-4" />
              <span>{purchasing ? 'Unlocking...' : `Unlock Now • ${formatCurrency(section.price_paise)}`}</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* Study Materials / Resources */}
      {section.content_items?.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span>Study Notes & Video Explainers</span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.content_items.map((item) => {
              const IconComp = getContentIcon(item.type);
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel transition-all hover:border-indigo-200 hover:shadow-panel-hover"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        <IconComp className="h-3 w-3 text-indigo-600" />
                        <span>{item.type}</span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="pt-3 text-[11px] font-semibold text-indigo-600 group-hover:underline">
                    Open document →
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Tests & Attempt History */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-600" />
          <span>Tests & Previous Attempts</span>
        </h2>

        <div className="space-y-4">
          {section.tests.map((test) => (
            <div
              key={test.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel transition-all hover:border-indigo-100"
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl font-bold text-slate-900">
                      {test.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        test.is_demo
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border border-indigo-100 bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {test.is_demo ? 'Free Demo' : 'Full Mock'}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600">
                    {test.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{test.duration_minutes} Mins</span>
                    </span>
                    <span>•</span>
                    <span>
                      Attempts used: <strong className="text-slate-700">{test.attempt_count}</strong>
                    </span>
                    {test.latest_attempt ? (
                      <>
                        <span>•</span>
                        <span className="font-medium text-slate-700">
                          Latest Score: {test.latest_attempt.score} pts ({test.latest_attempt.status})
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Test Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 xl:justify-end">
                  {test.latest_attempt && test.latest_attempt.status !== 'in_progress' ? (
                    <Link
                      href={`/attempt/${test.latest_attempt.id}/review`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <span>Review</span>
                    </Link>
                  ) : null}

                  {test.can_resume ? (
                    <Link
                      href={`/attempt/${test.latest_attempt.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Resume Attempt</span>
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleStartTest(test.id)}
                    disabled={
                      !test.has_access
                      || startingTestId === test.id
                      || !test.can_start
                      || test.can_resume
                      || (test.is_demo && Boolean(test.latest_attempt))
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 disabled:opacity-40 disabled:hover:bg-indigo-600"
                  >
                    {!test.has_access ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Unlock Required</span>
                      </>
                    ) : test.is_demo && test.latest_attempt && test.latest_attempt.status !== 'in_progress' ? (
                      <span>Demo Completed</span>
                    ) : !test.can_start && test.is_demo ? (
                      <span>Demo Used</span>
                    ) : !test.can_start ? (
                      <span>Limit Reached</span>
                    ) : test.can_resume ? (
                      <span>Resume Above</span>
                    ) : startingTestId === test.id ? (
                      <span>Launching...</span>
                    ) : test.latest_attempt ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Re-attempt</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Start Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

