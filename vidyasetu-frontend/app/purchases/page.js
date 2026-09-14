'use client';

import { useEffect, useState } from 'react';
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
        setError(requestError.response?.data?.message || 'Failed to load purchases');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [ready]);

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking your session...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Purchases
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Paid subsection access
        </h1>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading purchases...</p> : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {purchases.map((purchase) => (
          <div
            key={purchase.purchase_id}
            className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel"
          >
            <h2 className="text-xl font-semibold text-ink">{purchase.section_title}</h2>
            <p className="mt-2 text-sm text-slate-600">{purchase.catalog_title}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Amount: {formatCurrency(purchase.amount_paise)}</p>
              <p>Valid until: {new Date(purchase.valid_until).toLocaleString('en-IN')}</p>
              <p>UPI reference: {purchase.payment_ref}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
