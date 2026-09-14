'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function AttemptReviewPage() {
  const ready = useRequireAuth();
  const params = useParams();
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !params.attemptId) {
      return;
    }

    const fetchReview = async () => {
      try {
        const response = await api.get(`/student/attempts/${params.attemptId}/review`);
        setReview(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load review');
      }
    };

    fetchReview();
  }, [params.attemptId, ready]);

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking your session...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!review) {
    return <p className="text-sm text-slate-500">Loading review...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
          Review · Attempt #{review.attempt_number}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
          {review.test.title}
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Score</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{review.score}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm text-slate-500">Correct</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{review.summary.correct_count}</p>
          </div>
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-slate-500">Wrong</p>
            <p className="mt-2 text-2xl font-semibold text-red-700">{review.summary.wrong_count}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Not attempted</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{review.summary.not_attempted_count}</p>
          </div>
        </div>
      </section>

      {review.summary.common_mistakes.length ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-amber-900">Common mistakes</h2>
          <div className="mt-4 space-y-3">
            {review.summary.common_mistakes.map((mistake) => (
              <div key={mistake.question_id} className="rounded-3xl bg-white p-4">
                <p className="font-medium text-slate-800">{mistake.question_text}</p>
                <p className="mt-2 text-sm text-slate-600">{mistake.solution_text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        {review.questions.map((question, index) => (
          <article
            key={question.id}
            className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel"
          >
            {question.passage ? (
              <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  {question.passage.title || 'Case study'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {question.passage.context_text}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Question {index + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-ink">{question.question_text}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                question.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {question.is_correct ? 'Correct' : 'Review needed'}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {question.options.map((option) => {
                const selected = question.selected_option_ids.includes(option.id);

                return (
                  <div
                    key={option.id}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      option.is_correct
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : selected
                          ? 'border-red-200 bg-red-50 text-red-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {option.option_text}
                    {option.is_correct ? ' · Correct answer' : selected ? ' · Your choice' : ''}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Solution</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {question.solution_text || 'Solution will be added by the teacher.'}
              </p>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to dashboard
        </Link>
        <Link
          href={`/section/${review.test.section_id}`}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Explore section
        </Link>
      </div>
    </div>
  );
}
