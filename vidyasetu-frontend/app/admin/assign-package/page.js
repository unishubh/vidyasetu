'use client';

import { useEffect, useState } from 'react';
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
        setError(requestError.response?.data?.message || 'Failed to load students or sections');
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

      setSuccess(`Assigned ${selectedSection?.title} to ${selectedStudent?.email}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to assign subsection access');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking admin access...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Admin Only
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Assign subsection access
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Grant a paid subsection directly to a student without going through the mock UPI purchase flow.
        </p>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading options...</p> : null}
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

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel"
      >
        <div className="grid gap-5 md:grid-cols-3">
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>
          <select
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.catalog_title} · {section.title}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !students.length || !sections.length}
          className="mt-6 rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {submitting ? 'Assigning...' : 'Assign access'}
        </button>
      </form>
    </div>
  );
}
