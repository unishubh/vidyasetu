'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  ArrowRight,
  Landmark,
  Train,
  Award,
  BookOpen,
  Zap,
  Target,
  TrendingUp,
  X,
  CheckCircle2,
  Clock,
  BarChart3,
  ShieldCheck,
  Laptop,
} from 'lucide-react';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';

function getCategoryIcon(catalog) {
  const text = `${catalog.slug || ''} ${catalog.title || ''}`.toLowerCase();
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

export default function HomePage() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));

    const fetchCatalogs = async () => {
      try {
        const response = await api.get('/catalogs');
        setCatalogs(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load exam catalog');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const filteredCatalogs = useMemo(() => {
    if (!searchQuery.trim()) {
      return catalogs;
    }
    const q = searchQuery.toLowerCase();
    return catalogs.filter((c) =>
      c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [catalogs, searchQuery]);

  return (
    <div className="space-y-12 pb-8">
      {/* Hero Banner / Section Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-panel backdrop-blur sm:p-10 lg:p-14">
        {/* Subtle Ambient Background Gradients */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/90 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span className="tracking-wide uppercase text-[11px]">VidyaSetu 2.0 • Precision Exam Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Master Competitive Exams with <span className="text-indigo-600">Precision Mock Tests</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Prepare with authentic exam simulations for NISM Certifications, Banking, SSC, and Railway exams.
            Practice with free diagnostic demo tests, access curated study guides, and review step-by-step solution keys.
          </p>

          {/* Action Row & Live Search Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center pt-2">
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isLoggedIn ? 'Go to My Learning' : 'Start Free Demo Drills'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Quick Search / Filter Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams (e.g., NISM, Derivatives, Banking, SSC)..."
                className="w-full rounded-full border border-slate-200 bg-slate-50/90 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Real TCS iON Exam Interface
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Instant Score &amp; Negative Mark Analysis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Comprehensive Solution Keys
            </span>
          </div>
        </div>
      </section>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Loading exam catalogs...</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Multi-column Catalog Grid Section */}
      {!loading && (
        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Featured Exam Test Series
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Handcrafted question banks aligned with current exam patterns and syllabi
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredCatalogs.length} {filteredCatalogs.length === 1 ? 'Program' : 'Programs'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCatalogs.map((catalog) => {
              const { Icon, bg } = getCategoryIcon(catalog);
              return (
                <Link
                  key={catalog.id}
                  href={`/catalog/${catalog.slug}`}
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-panel-hover"
                >
                  <div>
                    {/* Top: Category Icon & Section Counter Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${bg} shadow-sm transition-transform group-hover:scale-110`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        {catalog.section_count}{' '}
                        {catalog.section_count === 1 ? 'Module' : 'Modules'}
                      </span>
                    </div>

                    {/* Header: Title */}
                    <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-xl">
                      {catalog.title}
                    </h3>

                    {/* Description: Body Text */}
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">
                      {catalog.description}
                    </p>
                  </div>

                  {/* Card Footer: Badges & Primary Action Link */}
                  <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <Target className="h-3 w-3 text-emerald-600" />
                        <span>Demo Available</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        <Zap className="h-3 w-3 text-amber-600" />
                        <span>Instant Access</span>
                      </span>
                    </div>

                    {/* Action link with smooth hover arrow */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-medium text-slate-400">
                        Full test series
                      </span>
                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-all group-hover:text-indigo-700">
                        <span>View Program</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Empty State for Search Filter */}
          {!filteredCatalogs.length && !loading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">
                No matching exams found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try searching for keywords like &ldquo;NISM&rdquo;, &ldquo;Derivatives&rdquo;, &ldquo;Banking&rdquo;, or &ldquo;SSC&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Reset Search Filters
              </button>
            </div>
          ) : null}
        </section>
      )}

      {/* Why Choose VidyaSetu Feature Matrix */}
      <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-panel sm:p-10">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">The VidyaSetu Advantage</span>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Engineered for High-Stakes Exam Mastery
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Everything you need to identify knowledge gaps, build testing stamina, and achieve top percentile ranks.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900">Exact Exam Timing</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Experience the pressure of real countdown timers and sectional time limits identical to official exams.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900">Diagnostic Analytics</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Detailed scorecards highlighting correct, incorrect, negative marks, and speed per question.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900">In-Depth Explanations</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Step-by-step solutions for every problem, complete with financial formulas and conceptual breakdowns.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Laptop className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900">Seamless Auto-Save</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Every selected answer is immediately persisted to the server so you never lose your progress during a test.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
