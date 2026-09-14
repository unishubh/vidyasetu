'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { formatDateTime, formatRelativeDays } from '@/lib/format';
import { useRequireStaff } from '@/lib/useRequireStaff';

const FILTERS = [
  { key: 'all', label: 'All students' },
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At-Risk' },
  { key: 'high_performer', label: 'High Performers' },
];

const badgeClassNames = {
  active: 'bg-emerald-100 text-emerald-800',
  at_risk: 'bg-amber-100 text-amber-900',
  high_performer: 'bg-sky-100 text-sky-800',
};

function formatCrmStatus(status) {
  if (status === 'high_performer') {
    return 'High performer';
  }

  if (status === 'at_risk') {
    return 'At-risk';
  }

  return 'Active';
}

export default function StudentCrmDashboardPage() {
  const ready = useRequireStaff();
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
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
        setError(requestError.response?.data?.message || 'Failed to load student CRM dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [ready]);

  const filteredStudents = useMemo(() => {
    if (filter === 'all') {
      return students;
    }

    return students.filter((student) => student.crm_status === filter);
  }, [filter, students]);

  const summary = useMemo(() => ({
    total: students.length,
    active: students.filter((student) => student.crm_status === 'active').length,
    atRisk: students.filter((student) => student.crm_status === 'at_risk').length,
    highPerformers: students.filter((student) => student.crm_status === 'high_performer').length,
  }), [students]);

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking staff access...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 px-8 py-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Admin / Teacher
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Student CRM
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Monitor student health, identify disengaged learners, and open a full profile for access and performance follow-up.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total students</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{summary.total}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{summary.active}</p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm text-slate-500">At-risk</p>
            <p className="mt-2 text-2xl font-semibold text-amber-800">{summary.atRisk}</p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm text-slate-500">High performers</p>
            <p className="mt-2 text-2xl font-semibold text-sky-800">{summary.highPerformers}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
        <div className="flex flex-wrap gap-3">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                filter === item.key ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? <p className="mt-5 text-sm text-slate-500">Loading students...</p> : null}
        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Avg Score</th>
                  <th className="px-4 py-3">Total Attempts</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold leading-tight text-ink">{student.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${badgeClassNames[student.crm_status] || badgeClassNames.active}`}>
                        {formatCrmStatus(student.crm_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{student.avg_score.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{student.total_attempts}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-700">{formatRelativeDays(student.last_active_at)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(student.last_active_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/crm/${student.id}`}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View profile
                      </Link>
                    </td>
                  </tr>
                ))}
                {!filteredStudents.length ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                      No students matched this filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
