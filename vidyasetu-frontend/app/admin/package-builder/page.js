'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { parseQuestionCsv, sampleQuestionCsv, sampleQuestionCsvFiles } from '@/lib/csv';
import { useRequireStaff } from '@/lib/useRequireStaff';

function emptyTest() {
  return {
    localId: crypto.randomUUID(),
    title: '',
    description: '',
    duration_minutes: 30,
    attempt_limit: 3,
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
  const [maxAttempts, setMaxAttempts] = useState(3);
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

  const updateContentItem = (localId, updater) => {
    setContentItems((current) => current.map((item) => (
      item.localId === localId ? { ...item, ...updater(item) } : item
    )));
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
        csvError: uploadError.message || 'Failed to parse CSV',
        questions: [],
      }));
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!sectionTitle.trim()) {
      setError('Section title is required');
      return;
    }

    if (mode === 'new' && !catalogTitle.trim()) {
      setError('Catalog title is required when creating a new catalog');
      return;
    }

    if (mode === 'existing' && !catalogId) {
      setError('Select a catalog');
      return;
    }

    if (tests.some((test) => !test.title.trim() || !test.questions.length || test.csvError)) {
      setError('Each test needs a title and a valid CSV with at least one question');
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

      setSuccess(`Created subsection "${sectionTitle}" with ${tests.length} test(s).`);
      setSectionTitle('');
      setSectionDescription('');
      setContentItems([emptyContentItem()]);
      setTests([emptyTest()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to publish content');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking staff access...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Teacher / Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Content Studio
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Create a subsection, attach resources, and publish multiple demo or paid tests using CSV imports.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
          <h2 className="text-xl font-semibold text-ink">Catalog and subsection</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'existing' ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Use existing catalog
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'new' ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Create new catalog
            </button>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {mode === 'existing' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Catalog</span>
                <select
                  value={catalogId}
                  onChange={(event) => setCatalogId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
                >
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Catalog title</span>
                  <input
                    type="text"
                    value={catalogTitle}
                    onChange={(event) => setCatalogTitle(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Catalog description</span>
                  <input
                    type="text"
                    value={catalogDescription}
                    onChange={(event) => setCatalogDescription(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Subsection title</span>
              <input
                type="text"
                value={sectionTitle}
                onChange={(event) => setSectionTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Subsection description</span>
              <input
                type="text"
                value={sectionDescription}
                onChange={(event) => setSectionDescription(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Price (paise)</span>
              <input
                type="number"
                min="0"
                value={pricePaise}
                onChange={(event) => setPricePaise(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Validity days</span>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(event) => setValidityDays(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">Linked resources</h2>
            <button
              type="button"
              onClick={() => setContentItems((current) => [...current, emptyContentItem()])}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add resource
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {contentItems.map((item) => (
              <div
                key={item.localId}
                className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-4"
              >
                <select
                  value={item.type}
                  onChange={(event) => updateContentItem(item.localId, () => ({ type: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <option value="pdf">PDF</option>
                  <option value="ppt">PPT</option>
                  <option value="doc">DOC</option>
                  <option value="video">Video</option>
                </select>
                <input
                  type="text"
                  value={item.title}
                  onChange={(event) => updateContentItem(item.localId, () => ({ title: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Resource title"
                />
                <input
                  type="text"
                  value={item.url}
                  onChange={(event) => updateContentItem(item.localId, () => ({ url: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="https://..."
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(event) => updateContentItem(item.localId, () => ({ description: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  placeholder="Short description"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">Tests</h2>
            <button
              type="button"
              onClick={() => setTests((current) => [...current, emptyTest()])}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add test
            </button>
          </div>

          {tests.map((test, index) => (
            <article
              key={test.localId}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel"
            >
              <h3 className="text-lg font-semibold text-ink">Test {index + 1}</h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  value={test.title}
                  onChange={(event) => updateTest(test.localId, () => ({ title: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  placeholder="Test title"
                />
                <input
                  type="text"
                  value={test.description}
                  onChange={(event) => updateTest(test.localId, () => ({ description: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  placeholder="Test description"
                />
                <input
                  type="number"
                  min="1"
                  value={test.duration_minutes}
                  onChange={(event) => updateTest(test.localId, () => ({ duration_minutes: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  placeholder="Duration"
                />
                <input
                  type="number"
                  min="1"
                  value={test.attempt_limit}
                  onChange={(event) => updateTest(test.localId, () => ({ attempt_limit: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  placeholder="Attempt limit"
                />
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={test.is_demo}
                  onChange={(event) => updateTest(test.localId, () => ({ is_demo: event.target.checked }))}
                  className="h-4 w-4"
                />
                Mark as demo test
              </label>
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Question CSV</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Supports passage fields, multiple-correct questions, negative marks, and short solutions.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(event) => handleCsvUpload(test.localId, event.target.files?.[0])}
                    />
                  </label>
                </div>
                {test.csvFileName ? (
                  <p className="mt-3 text-sm text-slate-700">
                    {test.csvFileName} · {test.questions.length} parsed questions
                  </p>
                ) : null}
                {test.csvError ? (
                  <p className="mt-3 text-sm text-red-700">{test.csvError}</p>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">CSV template</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sampleQuestionCsvFiles.map((file) => (
              <a
                key={file.href}
                href={file.href}
                download
                className="rounded-3xl border border-amber-200 bg-white px-4 py-4 text-sm text-slate-800 transition hover:border-amber-300 hover:bg-amber-100/40"
              >
                <p className="font-semibold text-amber-950">{file.label}</p>
                <p className="mt-1 text-slate-600">{file.description}</p>
              </a>
            ))}
          </div>
          <pre className="mt-3 overflow-x-auto rounded-3xl bg-white px-4 py-4 text-sm text-slate-800">
            {sampleQuestionCsv}
          </pre>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-ember px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          {submitting ? 'Publishing...' : 'Publish subsection'}
        </button>
      </form>
    </div>
  );
}
