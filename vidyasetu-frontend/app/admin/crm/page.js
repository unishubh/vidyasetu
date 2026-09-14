'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle2,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, formatRelativeDays } from '@/lib/format';
import { useRequireStaff } from '@/lib/useRequireStaff';

const FILTERS = [
  { key: 'all', label: 'All Candidates' },
  { key: 'active', label: 'Active Learners' },
  { key: 'at_risk', label: 'At-Risk Candidates' },
  { key: 'high_performer', label: 'Top Performers' },
];

const badgeClassNames = {
  active: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  at_risk: 'border border-amber-200 bg-amber-50 text-amber-900',
  high_performer: 'border border-indigo-200 bg-indigo-50 text-indigo-800',
};

function formatCrmStatus(status) {
  if (status === 'high_performer') {
    return 'Top Performer';
  }
  if (status === 'at_risk') {
    return 'At-Risk (Needs Review)';
  }
  return 'Active';
}

export default function StudentCrmDashboardPage() {
  const ready = useRequireStaff();
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await api.get('/api/admin/crm/students');
        setStudents(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load student CRM directory');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [ready]);

  const filteredStudents = useMemo(() => {
    let result = students;

    if (filter !== 'all') {
      result = result.filter((student) => student.crm_status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (student) =>
          student.name?.toLowerCase().includes(q) || student.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [students, filter, search]);

  const summary = useMemo(() => {
    const total = students.length;
    const active = students.filter((student) => student.crm_status === 'active').length;
    const atRisk = students.filter((student) => student.crm_status === 'at_risk').length;
    const highPerformers = students.filter(
      (student) => student.crm_status === 'high_performer'
    ).length;

    return { total, active, atRisk, highPerformers };
  }, [students]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Verifying faculty CRM permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-panel backdrop-blur">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Users className="h-3.5 w-3.5" />
            <span>Faculty Analytics • Student CRM</span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Candidate Performance &amp; <span className="text-indigo-600">Engagement CRM</span>
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base max-w-3xl">
              Track candidate engagement across mock test series, detect students falling behind the passing threshold,
              and reward top percentile performers.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 pt-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</span>
              <p className="text-3xl font-black text-slate-900">{summary.total}</p>
              <span className="text-[11px] text-slate-500">Registered users</span>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 space-y-1">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active</span>
              <p className="text-3xl font-black text-emerald-900">{summary.active}</p>
              <span className="text-[11px] text-emerald-600">Regular practice</span>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 space-y-1">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">At-Risk</span>
              <p className="text-3xl font-black text-amber-900">{summary.atRisk}</p>
              <span className="text-[11px] text-amber-700">Needs intervention</span>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 space-y-1">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Top Performers</span>
              <p className="text-3xl font-black text-indigo-950">{summary.highPerformers}</p>
              <span className="text-[11px] text-indigo-600">&gt; 75% accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Directory & Filter Table */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-panel space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 p-1 text-xs">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
                  filter === item.key
                    ? 'bg-white text-indigo-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name or email..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Loading candidate records...</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Performance Category</th>
                  <th className="px-4 py-3">Average Score</th>
                  <th className="px-4 py-3">Total Attempts</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{student.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          badgeClassNames[student.crm_status] || badgeClassNames.active
                        }`}
                      >
                        {formatCrmStatus(student.crm_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-800">
                      {student.avg_score.toFixed(2)} pts
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {student.total_attempts} mocks
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">{formatRelativeDays(student.last_active_at)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(student.last_active_at)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/crm/${student.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600"
                      >
                        <span>View Analytics</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!filteredStudents.length ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-xs text-slate-400">
                      No candidate records found matching the current search criteria.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
