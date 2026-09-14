'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronRight,
  Sparkles,
  Lock,
  Play,
  Clock,
  CheckCircle2,
  FileText,
  Target,
  ArrowLeft,
  Landmark,
  Train,
  Award,
  BookOpen,
  TrendingUp,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';

function getCategoryIcon(slug = '', title = '') {
  const text = `${slug} ${title}`.toLowerCase();
  if (text.includes('bank')) {
    return {
      Icon: Landmark,
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
    };
  }
  if (text.includes('rail')) {
    return {
      Icon: Train,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
  }
  if (text.includes('ssc')) {
    return {
      Icon: Award,
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    };
  }
  if (text.includes('nism') || text.includes('deriv')) {
    return {
      Icon: TrendingUp,
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
    };
  }
  return {
    Icon: BookOpen,
    bg: 'bg-violet-50 text-violet-600 border-violet-100',
  };
}

export default function CatalogPage() {
  const params = useParams();
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!params.slug) {
      return;
    }

    setIsLoggedIn(Boolean(getToken()));

    const fetchCatalog = async () => {
      try {
        const response = await api.get(`/catalogs/${params.slug}`);
        setCatalog(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load catalog');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Loading catalog details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to all catalogs</span>
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!catalog) {
    return null;
  }

  const { Icon, bg } = getCategoryIcon(catalog.slug, catalog.title);

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href="/"
          className="transition-colors hover:text-indigo-600 flex items-center gap-1"
        >
          <span>Catalog</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900">{catalog.title}</span>
      </nav>

      {/* Category Header Card */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${bg} shadow-sm`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Exam Series
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  {catalog.title} Subsections & Tests
                </h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 sm:text-base pt-1">
              {catalog.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:self-start">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
              {catalog.sections?.length || 0} Subsections
            </span>
          </div>
        </div>
      </section>

      {/* Subsections List Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Available Modules & Mock Packs
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Click to practice demos or unlock full series
          </span>
        </div>

        <div className="grid gap-6">
          {catalog.sections.map((section) => (
            <div
              key={section.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel transition-all duration-300 hover:border-indigo-200 hover:shadow-panel-hover sm:p-8"
            >
              <div>
                {/* Header: Title & Counter Badge */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                        {section.title}
                      </h3>
                    </div>
                    {/* Curriculum Summary / Description */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                      {section.description}
                    </p>
                  </div>

                  <span className="self-start whitespace-nowrap rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                    {section.test_count} {section.test_count === 1 ? 'Test' : 'Tests'} Available
                  </span>
                </div>

                {/* Pricing & Validity Module */}
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {formatCurrency(section.price_paise)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">/ section</span>
                  </div>

                  <span className="text-slate-300 font-light hidden sm:inline">•</span>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{section.validity_days} Days Validity</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      <span>{section.demo_test_count || 1} Demo Test Included</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                      <Target className="h-3 w-3 text-indigo-600" />
                      <span>{section.max_attempts_per_test || 3} Attempts / Test</span>
                    </span>

                    {section.content_count ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                        <FileText className="h-3 w-3 text-slate-500" />
                        <span>{section.content_count} Resources</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Action Row: Two Distinct, Polished Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
                {/* Secondary Outline Button: Try Free Demo */}
                <Link
                  href={isLoggedIn ? `/section/${section.id}` : '/login'}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-indigo-600 text-indigo-600" />
                  <span>Try Free Demo</span>
                </Link>

                {/* Primary Solid Button: Unlock Full Access */}
                <Link
                  href={isLoggedIn ? `/section/${section.id}` : '/login'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Unlock Full Access • {formatCurrency(section.price_paise)}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

