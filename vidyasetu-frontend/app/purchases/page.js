'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FolderLock,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function PurchasesPage() {
  const ready = useRequireAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }

    const fetchPurchases = async () => {
      try {
        const response = await api.get('/student/purchases');
        setPurchases(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load access records');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Verifying student credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Receipt className="h-3.5 w-3.5" />
            <span>Billing &amp; Access Manager</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            My Subscriptions &amp; <span className="text-indigo-600">Access Passes</span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Manage your active test package enrollments, check validity dates, view payment confirmation references,
            and jump straight into practice mocks.
          </p>
        </div>
      </section>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Loading billing passes...</span>
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
      {!loading && !purchases.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FolderLock className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Active Subscriptions Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              You currently do not have any active test package passes. Explore our catalog to practice free demo drills or subscribe to a module.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <span>Explore Exam Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Purchases Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {purchases.map((purchase) => (
          <div
            key={purchase.purchase_id}
            className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel transition-all hover:border-indigo-200 hover:shadow-panel-hover"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  {purchase.catalog_title}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Access Active</span>
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                  {purchase.section_title}
                </h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    {formatCurrency(purchase.amount_paise)}
                  </span>
                  <span className="text-xs text-slate-400">one-time pass</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Valid Until</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(purchase.valid_until).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Payment Ref</span>
                  </span>
                  <span className="font-mono text-slate-700 font-medium">
                    {purchase.payment_ref}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">10 practice attempts included</span>
              <Link
                href={`/section/${purchase.section_id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>Launch Mock Tests</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
