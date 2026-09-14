'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  FileText,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
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
        setError(requestError.response?.data?.message || 'Failed to load test review');
      }
    };

    fetchReview();
  }, [params.attemptId, ready]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Verifying student session...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Generating diagnostic score report...</span>
        </div>
      </div>
    );
  }

  const attemptedCount = review.summary.correct_count + review.summary.wrong_count;
  const accuracyRate = attemptedCount > 0
    ? Math.round((review.summary.correct_count / attemptedCount) * 100)
    : 0;

  return (
    <div className="space-y-10 pb-10">
      {/* Top Scorecard Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-panel backdrop-blur">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <Award className="h-3.5 w-3.5" />
              <span>Diagnostic Scorecard • Attempt #{review.attempt_number}</span>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Completed on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {review.test.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Comprehensive answer key breakdown with step-by-step solutions and accuracy metrics.
            </p>
          </div>

          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
            {/* Net Score */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 space-y-1">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Net Score</span>
              <p className="text-3xl font-black text-indigo-950">
                {review.score}
              </p>
              <span className="text-[11px] text-indigo-600/80">Marks Obtained</span>
            </div>

            {/* Accuracy */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</span>
              <p className="text-3xl font-black text-slate-900">
                {accuracyRate}%
              </p>
              <span className="text-[11px] text-slate-500">{review.summary.correct_count} of {attemptedCount} attempted</span>
            </div>

            {/* Correct Count */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 space-y-1">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Correct</span>
              <p className="text-3xl font-black text-emerald-900">
                {review.summary.correct_count}
              </p>
              <span className="text-[11px] text-emerald-600">+{review.summary.correct_count * 1} marks earned</span>
            </div>

            {/* Incorrect Count */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5 space-y-1">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Incorrect</span>
              <p className="text-3xl font-black text-rose-900">
                {review.summary.wrong_count}
              </p>
              <span className="text-[11px] text-rose-600">-{review.summary.wrong_count * 0.25} negative penalty</span>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes Callout (if any) */}
      {review.summary.common_mistakes?.length ? (
        <section className="rounded-3xl border border-amber-200/80 bg-amber-50/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <h2 className="text-lg font-bold">Recommended Review Topics (Common Knowledge Gaps)</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
            These questions were frequently missed or answered incorrectly. Review the key formulas and explanations below:
          </p>

          <div className="space-y-3 pt-1">
            {review.summary.common_mistakes.map((mistake) => (
              <div key={mistake.question_id} className="rounded-2xl border border-amber-200/60 bg-white p-5 space-y-2 shadow-sm">
                <p className="text-sm font-bold text-slate-900">{mistake.question_text}</p>
                <div className="flex items-start gap-2 pt-1">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-slate-600">{mistake.solution_text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Detailed Question Review List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <span>Question-by-Question Solution Breakdown</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {review.questions.length} Questions Scored
          </span>
        </div>

        <div className="space-y-5">
          {review.questions.map((question, index) => {
            const isUnattempted = !question.selected_option_ids || question.selected_option_ids.length === 0;

            return (
              <article
                key={question.id}
                className={`rounded-3xl border bg-white p-6 sm:p-8 shadow-panel space-y-5 transition-all ${
                  question.is_correct
                    ? 'border-emerald-200/80'
                    : isUnattempted
                    ? 'border-slate-200/80'
                    : 'border-rose-200/80'
                }`}
              >
                {/* Passage (if case study) */}
                {question.passage ? (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{question.passage.title || 'Case Context'}</span>
                    </span>
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                      {question.passage.context_text}
                    </p>
                  </div>
                ) : null}

                {/* Question Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Question {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {question.question_text}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    {question.is_correct ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Correct (+1.00)</span>
                      </span>
                    ) : isUnattempted ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                        <span>Unattempted (0.00)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Incorrect (-0.25)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Options List with Visual Feedback */}
                <div className="space-y-2.5 pt-1">
                  {question.options.map((option, optIdx) => {
                    const selected = question.selected_option_ids?.includes(option.id);
                    const letter = String.fromCharCode(65 + optIdx);

                    let cardClass = 'border-slate-200 bg-slate-50/50 text-slate-700';
                    let badge = null;

                    if (option.is_correct) {
                      cardClass = 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-400/20';
                      badge = (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                          Correct Answer
                        </span>
                      );
                    } else if (selected && !option.is_correct) {
                      cardClass = 'border-rose-300 bg-rose-50/80 text-rose-950 font-semibold ring-1 ring-rose-400/20';
                      badge = (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                          Your Answer
                        </span>
                      );
                    }

                    return (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 text-sm transition-all ${cardClass}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border text-xs font-bold text-slate-700">
                            {letter}
                          </span>
                          <span className="leading-relaxed">{option.option_text}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Explanation Box */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-800">
                    <Lightbulb className="h-4 w-4 text-indigo-600" />
                    <span>Step-by-Step Explanation &amp; Rationale</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {question.solution_text || 'Detailed rationale is prepared according to the official certification curriculum.'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Navigation CTA Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to My Learning Hub</span>
        </Link>

        <Link
          href={`/section/${review.test.section_id}`}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
        >
          <span>Retake or Practice Other Tests</span>
          <RotateCcw className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
