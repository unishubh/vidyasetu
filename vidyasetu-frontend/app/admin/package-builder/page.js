'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Upload,
  FileText,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
} from 'lucide-react';
import api from '@/lib/api';
import { parseQuestionCsv, sampleQuestionCsv, sampleQuestionCsvFiles } from '@/lib/csv';
import { useRequireStaff } from '@/lib/useRequireStaff';

function emptyTest() {
  return {
    localId: crypto.randomUUID(),
    title: '',
    description: '',
    duration_minutes: 45,
    attempt_limit: 5,
    is_demo: false,
    csvFileName: '',
    csvError: '',
    questions: [],
  };
}

function emptyContentItem() {
  return {
    localId: crypto.randomUUID(),
    type: 'pdf',
    title: '',
    url: '',
    description: '',
  };
}

export default function ContentStudioPage() {
  const ready = useRequireStaff();
  const [catalogs, setCatalogs] = useState([]);
  const [mode, setMode] = useState('existing');
  const [catalogId, setCatalogId] = useState('');
  const [catalogTitle, setCatalogTitle] = useState('');
  const [catalogDescription, setCatalogDescription] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [pricePaise, setPricePaise] = useState(29900);
  const [validityDays, setValidityDays] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [contentItems, setContentItems] = useState([emptyContentItem()]);
  const [tests, setTests] = useState([emptyTest()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }

    const fetchCatalogs = async () => {
      try {
        const response = await api.get('/admin/catalogs');
        const nextCatalogs = Array.isArray(response.data) ? response.data : [];
        setCatalogs(nextCatalogs);
        setCatalogId(nextCatalogs[0]?.id ? String(nextCatalogs[0].id) : '');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load catalogs');
      }
    };

    fetchCatalogs();
  }, [ready]);

  const updateTest = (localId, updater) => {
    setTests((current) => current.map((test) => (
      test.localId === localId ? { ...test, ...updater(test) } : test
    )));
  };

  const removeTest = (localId) => {
    setTests((current) => current.filter((test) => test.localId !== localId));
  };

  const updateContentItem = (localId, updater) => {
    setContentItems((current) => current.map((item) => (
      item.localId === localId ? { ...item, ...updater(item) } : item
    )));
  };

  const removeContentItem = (localId) => {
    setContentItems((current) => current.filter((item) => item.localId !== localId));
  };

  const handleCsvUpload = async (localId, file) => {
    if (!file) {
      return;
    }

    if (file.size === 0) {
      updateTest(localId, () => ({
        csvFileName: file.name,
        csvError: `The file "${file.name}" is empty (0 bytes). Please choose a CSV file with questions.`,
        questions: [],
      }));
      return;
    }

    try {
      const text = await file.text();
      const questions = parseQuestionCsv(text);
      updateTest(localId, () => ({
        csvFileName: file.name,
        csvError: '',
        questions,
      }));
    } catch (uploadError) {
      updateTest(localId, () => ({
        csvFileName: file.name,
        csvError: uploadError.message || 'Failed to parse CSV question bank',
        questions: [],
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!sectionTitle.trim()) {
      setError('Section/Module title is required');
      return;
    }

    if (mode === 'new' && !catalogTitle.trim()) {
      setError('Catalog program title is required when creating a new catalog');
      return;
    }

    if (mode === 'existing' && !catalogId) {
      setError('Please select an existing catalog');
      return;
    }

    if (tests.some((test) => !test.title.trim() || !test.questions.length || test.csvError)) {
      setError('Each test requires a title and a valid CSV question bank with at least one question');
      return;
    }

    setSubmitting(true);

    try {
      let nextCatalogId = Number(catalogId);

      if (mode === 'new') {
        const catalogResponse = await api.post('/admin/catalogs', {
          title: catalogTitle,
          description: catalogDescription,
        });
        nextCatalogId = catalogResponse.data.id;
      }

      const sectionResponse = await api.post('/admin/sections', {
        catalog_id: nextCatalogId,
        title: sectionTitle,
        description: sectionDescription,
        price_paise: Number(pricePaise),
        validity_days: Number(validityDays),
        max_attempts_per_test: Number(maxAttempts),
        is_demo_available: true,
      });
      const sectionId = sectionResponse.data.id;

      for (const item of contentItems.filter((content) => content.title.trim() && content.url.trim())) {
        await api.post('/admin/content', {
          section_id: sectionId,
          type: item.type,
          title: item.title,
          url: item.url,
          description: item.description,
        });
      }

      for (const test of tests) {
        await api.post('/admin/tests', {
          section_id: sectionId,
          title: test.title,
          description: test.description,
          duration_minutes: Number(test.duration_minutes),
          attempt_limit: Number(test.attempt_limit),
          is_demo: test.is_demo,
          questions: test.questions,
        });
      }

      setSuccess(`Successfully published module "${sectionTitle}" with ${tests.length} mock test(s).`);
      setSectionTitle('');
      setSectionDescription('');
      setContentItems([emptyContentItem()]);
      setTests([emptyTest()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to publish module content');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Verifying faculty &amp; staff permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-panel backdrop-blur">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Faculty &amp; Authoring Studio</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Exam Package &amp; <span className="text-indigo-600">Test Publishing Studio</span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Create new examination programs, configure sectional practice modules with pricing and attempt limits,
            and batch-upload question banks using CSV templates.
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Catalog & Module Configuration */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-panel space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              1. Program &amp; Module Details
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select or create the overarching exam category and define module parameters
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`rounded-full px-4 py-1.5 transition-all ${
                mode === 'existing'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Use Existing Catalog
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-full px-4 py-1.5 transition-all ${
                mode === 'new'
                  ? 'bg-white text-indigo-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create New Catalog
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {mode === 'existing' ? (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Target Exam Catalog</label>
                <select
                  value={catalogId}
                  onChange={(event) => setCatalogId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">New Catalog Program Title</label>
                  <input
                    type="text"
                    value={catalogTitle}
                    onChange={(event) => setCatalogTitle(event.target.value)}
                    placeholder="e.g. NISM Series VIII: Equity Derivatives"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Catalog Description / Syllabus</label>
                  <input
                    type="text"
                    value={catalogDescription}
                    onChange={(event) => setCatalogDescription(event.target.value)}
                    placeholder="Overview of certification requirements and topics"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Module / Section Title</label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(event) => setSectionTitle(event.target.value)}
                placeholder="e.g. Advanced Derivatives Practice Mock Series"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Module Description</label>
              <input
                type="text"
                value={sectionDescription}
                onChange={(event) => setSectionDescription(event.target.value)}
                placeholder="Detailed coverage of mocks, questions, and revision notes"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Price in Paise (e.g. 29900 = ₹299)</label>
              <input
                type="number"
                min="0"
                value={pricePaise}
                onChange={(event) => setPricePaise(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Access Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(event) => setValidityDays(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Curated Study Materials */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-panel space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                2. Reference Study Materials (Optional)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach PDFs, concept slides, formulas, or video lecture links
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContentItems((current) => [...current, emptyContentItem()])}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="space-y-4">
            {contentItems.map((item) => (
              <div
                key={item.localId}
                className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 md:grid-cols-5 items-center"
              >
                <select
                  value={item.type}
                  onChange={(event) => updateContentItem(item.localId, () => ({ type: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="ppt">Presentation (PPT)</option>
                  <option value="doc">Word Doc</option>
                  <option value="video">Video Lecture</option>
                </select>

                <input
                  type="text"
                  value={item.title}
                  onChange={(event) => updateContentItem(item.localId, () => ({ title: event.target.value }))}
                  placeholder="Resource Title"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />

                <input
                  type="text"
                  value={item.url}
                  onChange={(event) => updateContentItem(item.localId, () => ({ url: event.target.value }))}
                  placeholder="https://..."
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-mono"
                />

                <input
                  type="text"
                  value={item.description}
                  onChange={(event) => updateContentItem(item.localId, () => ({ description: event.target.value }))}
                  placeholder="Summary of contents"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeContentItem(item.localId)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    aria-label="Remove resource"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: Mock Tests & CSV Batch Upload */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-panel space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                3. Mock Tests &amp; CSV Question Bank Import
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure test parameters and import questions with passages, keys, and rationales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTests((current) => [...current, emptyTest()])}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Another Mock Test</span>
            </button>
          </div>

          <div className="space-y-6">
            {tests.map((test, index) => (
              <article
                key={test.localId}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-6 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Mock Test #{index + 1} Configuration</h3>
                  </div>

                  {tests.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeTest(test.localId)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      Delete Test
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Test Title</label>
                    <input
                      type="text"
                      value={test.title}
                      onChange={(event) => updateTest(test.localId, () => ({ title: event.target.value }))}
                      placeholder="e.g. Equity Derivatives Full Mock 1"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Test Description / Coverage</label>
                    <input
                      type="text"
                      value={test.description}
                      onChange={(event) => updateTest(test.localId, () => ({ description: event.target.value }))}
                      placeholder="e.g. 50 timed questions covering Greeks, margins, and settlements"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Test Duration (Minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={test.duration_minutes}
                      onChange={(event) => updateTest(test.localId, () => ({ duration_minutes: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Attempt Quota Per Student</label>
                    <input
                      type="number"
                      min="1"
                      value={test.attempt_limit}
                      onChange={(event) => updateTest(test.localId, () => ({ attempt_limit: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={test.is_demo}
                    onChange={(event) => updateTest(test.localId, () => ({ is_demo: event.target.checked }))}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mark as Free Diagnostic Demo Test (Accessible to all signed-in candidates without payment)</span>
                </label>

                {/* CSV File Dropzone */}
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Upload className="h-4 w-4 text-indigo-600" />
                        <span>Upload Question Bank CSV</span>
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        CSV columns supported: passage_title, passage_text, question_text, option_a, option_b, option_c, option_d, correct_answers, marks, negative_marks, solution_text.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0">
                      <span>Choose CSV File</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(event) => handleCsvUpload(test.localId, event.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {test.csvFileName ? (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{test.csvFileName} • Successfully parsed {test.questions.length} questions</span>
                    </div>
                  ) : null}

                  {test.csvError ? (
                    <div className="mt-3 text-xs font-medium text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{test.csvError}</span>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Step 4: CSV Specifications Reference Guide */}
        <section className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-900">
            <BookOpen className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold">Standard Question Bank CSV Format</h2>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Download standard templates below or verify that your CSV headers match the required structure:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {sampleQuestionCsvFiles.map((file) => (
              <a
                key={file.href}
                href={file.href}
                download
                className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white p-4 text-xs transition hover:bg-amber-50/60"
              >
                <div>
                  <p className="font-bold text-slate-900">{file.label}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{file.description}</p>
                </div>
                <Download className="h-4 w-4 text-amber-600 shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </section>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-indigo-600/35 transition-all disabled:opacity-50"
          >
            <span>{submitting ? 'Publishing Program & Tests...' : 'Publish Module & Mock Tests'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
