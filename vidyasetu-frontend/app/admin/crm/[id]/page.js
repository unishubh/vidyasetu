'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency, formatDateOnly, formatDateTime, formatRelativeDays } from '@/lib/format';
import { useRequireStaff } from '@/lib/useRequireStaff';

const tabs = [
  { key: 'activity', label: 'Activity' },
  { key: 'purchases', label: 'Purchases' },
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

function SparkBars({ attempts }) {
  const maxScore = Math.max(...attempts.map((attempt) => Number(attempt.score || 0)), 1);

  return (
    <div className="flex h-28 items-end gap-2">
      {attempts.map((attempt) => (
        <div key={attempt.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-2xl bg-sky-400/80"
            style={{ height: `${Math.max(12, (Number(attempt.score || 0) / maxScore) * 100)}%` }}
            title={`${attempt.test_title}: ${attempt.score}`}
          />
          <span className="text-[11px] text-slate-500">#{attempt.attempt_number}</span>
        </div>
      ))}
    </div>
  );
}

export default function StudentCrmProfilePage() {
  const ready = useRequireStaff();
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('activity');
  const [notes, setNotes] = useState('');
  const [grantSectionId, setGrantSectionId] = useState('');
  const [grantValidUntil, setGrantValidUntil] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [mutatingAccess, setMutatingAccess] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = async () => {
    const response = await api.get(`/api/admin/crm/students/${params.id}/details`);
    setProfile(response.data);
    setNotes(response.data.student.admin_notes || '');
    setGrantSectionId(response.data.access.available_sections[0]?.id ? String(response.data.access.available_sections[0].id) : '');
  };

  useEffect(() => {
    if (!ready || !params.id) {
      return;
    }

    const load = async () => {
      try {
        await fetchProfile();
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id, ready]);

  const recentAttempts = useMemo(
    () => profile?.performance?.recent_attempts ? [...profile.performance.recent_attempts].reverse() : [],
    [profile]
  );

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/admin/crm/students/${params.id}/notes`, {
        admin_notes: notes,
      });
      setSuccess('Notes updated.');
      await fetchProfile();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!grantSectionId) {
      return;
    }

    setMutatingAccess(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/api/admin/crm/students/${params.id}/access/grant`, {
        section_id: Number(grantSectionId),
        valid_until: grantValidUntil ? `${grantValidUntil}T23:59:59Z` : null,
      });
      setSuccess('Section access granted.');
      await fetchProfile();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to grant access');
    } finally {
      setMutatingAccess(false);
    }
  };

  const handleRevokeAccess = async (sectionId) => {
    setMutatingAccess(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/api/admin/crm/students/${params.id}/access/revoke`, {
        section_id: sectionId,
      });
      setSuccess('Section access revoked.');
      await fetchProfile();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to revoke access');
    } finally {
      setMutatingAccess(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking staff access...</p>;
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading student profile...</p>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 px-8 py-8 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Student 360 Profile
            </p>
            <h1 className="mt-2 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-ink">
              {profile.student.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{profile.student.email}</p>
            <p className="mt-3 text-sm text-slate-500">
              Joined {formatDateOnly(profile.student.created_at)} · Last active {formatRelativeDays(profile.student.last_active_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] ${badgeClassNames[profile.student.crm_status] || badgeClassNames.active}`}>
              {formatCrmStatus(profile.student.crm_status)}
            </span>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              User status: {profile.student.status}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Avg score</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{profile.performance.avg_score.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm text-slate-500">Best score</p>
            <p className="mt-2 text-2xl font-semibold text-sky-800">{profile.performance.best_score.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm text-slate-500">Completed attempts</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{profile.performance.completed_attempts}</p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm text-slate-500">Avg score, last 5</p>
            <p className="mt-2 text-2xl font-semibold text-amber-800">{profile.performance.avg_score_last_5.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-ink">Performance trend</h2>
              <p className="text-sm text-slate-500">Last {recentAttempts.length} attempts</p>
            </div>

            {recentAttempts.length ? (
              <>
                <div className="mt-6">
                  <SparkBars attempts={recentAttempts} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {profile.performance.recent_attempts.slice(0, 4).map((attempt) => (
                    <div key={attempt.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-medium leading-tight text-ink">{attempt.test_title}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        Attempt #{attempt.attempt_number} · Score {attempt.score.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(attempt.submitted_at || attempt.started_at)}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No attempt history yet.</p>
            )}
          </article>

          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            <div className="flex flex-wrap gap-3">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    tab === item.key ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === 'activity' ? (
              <div className="mt-5 space-y-3">
                {profile.activity.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        item.type === 'login' ? 'bg-slate-200 text-slate-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateTime(item.occurred_at)}</span>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{item.summary}</p>
                    {item.score !== undefined ? (
                      <p className="mt-2 text-xs text-slate-500">Score: {Number(item.score).toFixed(2)} · Status: {item.status}</p>
                    ) : null}
                  </div>
                ))}
                {!profile.activity.length ? (
                  <p className="text-sm text-slate-500">No recent activity recorded.</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {profile.purchases.map((purchase) => (
                  <div key={purchase.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium leading-tight text-ink">{purchase.catalog_title} · {purchase.section_title}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {formatCurrency(purchase.amount_paise)} · {purchase.status}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500">
                        <p>Created: {formatDateOnly(purchase.created_at)}</p>
                        <p className="mt-1">Valid until: {formatDateOnly(purchase.valid_until)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!profile.purchases.length ? (
                  <p className="text-sm text-slate-500">No purchase history yet.</p>
                ) : null}
              </div>
            )}
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-ink">Access management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Grant subsection access directly or revoke currently active access for this student.
            </p>

            <div className="mt-5 space-y-3">
              <select
                value={grantSectionId}
                onChange={(event) => setGrantSectionId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                {profile.access.available_sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.catalog_title} · {section.title}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={grantValidUntil}
                onChange={(event) => setGrantValidUntil(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
              <button
                type="button"
                onClick={handleGrantAccess}
                disabled={mutatingAccess || !grantSectionId}
                className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {mutatingAccess ? 'Saving...' : 'Grant subsection'}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {profile.access.active_sections.map((section) => (
                <div key={`${section.id}-${section.section_id}`} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-medium leading-tight text-ink">{section.catalog_title} · {section.section_title}</p>
                  <p className="mt-2 text-sm text-slate-500">Valid until {formatDateOnly(section.valid_until)}</p>
                  <button
                    type="button"
                    onClick={() => handleRevokeAccess(section.section_id)}
                    disabled={mutatingAccess}
                    className="mt-3 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Revoke
                  </button>
                </div>
              ))}
              {!profile.access.active_sections.length ? (
                <p className="text-sm text-slate-500">No active subsection access.</p>
              ) : null}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-ink">Admin notes</h2>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={8}
              className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
              placeholder="Add intervention notes, parent follow-up details, or manual observations here..."
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-4 w-full rounded-2xl bg-ember px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              {savingNotes ? 'Saving...' : 'Save notes'}
            </button>
          </article>
        </aside>
      </div>
    </div>
  );
}
