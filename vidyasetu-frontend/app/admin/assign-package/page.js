'use client';

import { useEffect, useState } from 'react';
import { Shield, UserCheck, Calendar, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useRequireAdmin } from '@/lib/useRequireAdmin';

function defaultExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date.toISOString().slice(0, 10);
}

export default function AssignAccessPage() {
  const ready = useRequireAdmin();
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [validUntil, setValidUntil] = useState(defaultExpiryDate());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }

    const fetchOptions = async () => {
      try {
        const [studentsResponse, sectionsResponse] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/sections'),
        ]);

        const nextStudents = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];
        const nextSections = Array.isArray(sectionsResponse.data) ? sectionsResponse.data : [];

        setStudents(nextStudents);
        setSections(nextSections);
        setStudentId(nextStudents[0]?.id ? String(nextStudents[0].id) : '');
        setSectionId(nextSections[0]?.id ? String(nextSections[0].id) : '');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load students or program modules');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [ready]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/admin/assign-section', {
        user_id: Number(studentId),
        section_id: Number(sectionId),
        valid_until: `${validUntil}T23:59:59Z`,
      });

      const selectedStudent = students.find((student) => String(student.id) === studentId);
      const selectedSection = sections.find((section) => String(section.id) === sectionId);

      setSuccess(`Successfully granted access to "${selectedSection?.title}" for candidate ${selectedStudent?.email}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to grant candidate module access');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Verifying administrator authority...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-panel backdrop-blur">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Shield className="h-3.5 w-3.5" />
            <span>Administrator Control • Access Grants</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Direct Candidate Access <span className="text-indigo-600">Provisioning</span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Allocate paid examination packages and sectional test series directly to enrolled students,
            sponsorship recipients, or test reviewers without requiring the UPI checkout flow.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-panel space-y-6"
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Grant Access Parameters</h2>
          <p className="text-xs text-slate-500 mt-0.5">Select candidate account, package module, and expiry cutoff</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Target Candidate</label>
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Program / Test Module</label>
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.catalog_title} • {section.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Access Expiry Date</label>
            <input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !students.length || !sections.length}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <span>{submitting ? 'Allocating Access...' : 'Confirm Access Grant'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
