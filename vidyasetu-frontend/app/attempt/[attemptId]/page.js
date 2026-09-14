'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDuration, summarizeAttemptStates } from '@/lib/format';
import { useRequireAuth } from '@/lib/useRequireAuth';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'answered', label: 'Answered' },
  { key: 'marked', label: 'Marked' },
  { key: 'pending', label: 'Pending' },
];

export default function AttemptPage() {
  const ready = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitAlert, setShowSubmitAlert] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !params.attemptId) {
      return;
    }

    const fetchAttempt = async () => {
      try {
        const response = await api.get(`/student/attempts/${params.attemptId}`);
        setAttempt(response.data);
        setRemainingTime(response.data.remaining_time);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load attempt session');
      }
    };

    fetchAttempt();
  }, [params.attemptId, ready]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') {
      return;
    }

    const tick = window.setInterval(() => {
      setRemainingTime((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') {
      return;
    }

    const refresh = window.setInterval(async () => {
      try {
        const response = await api.get(`/student/attempts/${params.attemptId}`);
        setAttempt(response.data);
        setRemainingTime(response.data.remaining_time);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to sync attempt');
      }
    }, 30000);

    return () => window.clearInterval(refresh);
  }, [attempt, params.attemptId]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || remainingTime > 0 || submitting) {
      return;
    }

    handleSubmit(true);
  }, [attempt, remainingTime, submitting]);

  const summary = useMemo(
    () => summarizeAttemptStates(attempt?.questions || []),
    [attempt]
  );

  const filteredQuestionIndexes = useMemo(() => {
    if (!attempt) {
      return [];
    }

    return attempt.questions
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => {
        if (filter === 'all') {
          return true;
        }
        if (filter === 'answered') {
          return ['answered', 'answered_and_marked'].includes(question.state);
        }
        if (filter === 'marked') {
          return ['marked_for_review', 'answered_and_marked'].includes(question.state);
        }
        return ['not_visited', 'not_answered'].includes(question.state);
      })
      .map(({ index }) => index);
  }, [attempt, filter]);

  const activeQuestion = attempt?.questions?.[activeIndex] || null;

  const persistAnswer = async (questionId, optionIds) => {
    const response = await api.post(`/student/attempts/${params.attemptId}/answer`, {
      question_id: questionId,
      option_ids: optionIds,
    });
    return response.data.option_ids;
  };

  const persistState = async (questionId, status) => {
    await api.post(`/student/attempts/${params.attemptId}/state`, {
      question_id: questionId,
      status,
    });
  };

  const updateQuestionLocally = (questionId, updater) => {
    setAttempt((current) => ({
      ...current,
      questions: current.questions.map((question) => (
        question.id === questionId ? { ...question, ...updater(question) } : question
      )),
    }));
  };

  const handleOptionToggle = async (question, optionId) => {
    const selected = new Set(question.selected_option_ids);

    if (question.question_type === 'single_correct') {
      selected.clear();
      selected.add(optionId);
    } else if (selected.has(optionId)) {
      selected.delete(optionId);
    } else {
      selected.add(optionId);
    }

    const optionIds = [...selected];

    updateQuestionLocally(question.id, (current) => ({
      selected_option_ids: optionIds,
      state: optionIds.length
        ? (['marked_for_review', 'answered_and_marked'].includes(current.state)
          ? 'answered_and_marked'
          : 'answered')
        : (['marked_for_review', 'answered_and_marked'].includes(current.state)
          ? 'marked_for_review'
          : 'not_answered'),
    }));

    try {
      await persistAnswer(question.id, optionIds);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to auto-save answer');
    }
  };

  const handleMarkForReview = async () => {
    if (!activeQuestion) {
      return;
    }

    const nextState = activeQuestion.selected_option_ids.length
      ? (activeQuestion.state === 'answered_and_marked' ? 'answered' : 'answered_and_marked')
      : (activeQuestion.state === 'marked_for_review' ? 'not_answered' : 'marked_for_review');

    updateQuestionLocally(activeQuestion.id, () => ({ state: nextState }));

    try {
      await persistState(activeQuestion.id, nextState);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update review flag');
    }
  };

  const moveToQuestion = async (nextIndex) => {
    if (activeQuestion && activeQuestion.state === 'not_visited') {
      updateQuestionLocally(activeQuestion.id, () => ({ state: 'not_answered' }));
      try {
        await persistState(activeQuestion.id, 'not_answered');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to update question status');
      }
    }

    setActiveIndex(nextIndex);

    const nextQuestion = attempt.questions[nextIndex];
    if (nextQuestion?.state === 'not_visited') {
      updateQuestionLocally(nextQuestion.id, () => ({ state: 'not_answered' }));
      try {
        await persistState(nextQuestion.id, 'not_answered');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to update question status');
      }
    }
  };

  const handleSubmit = async (automatic = false) => {
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/student/attempts/${params.attemptId}/submit`);
      router.push(`/attempt/${params.attemptId}/review`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit test attempt');
      if (!automatic) {
        setShowSubmitAlert(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Validating test permissions...</span>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-600 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>Setting up test environment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left Column: Active Question & Case Studies */}
      <section className="space-y-5">
        {/* Test Header */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Attempt #{attempt.attempt_number}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {attempt.questions.length} Total Questions
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {attempt.test.title}
              </h1>
            </div>

            {/* Mobile timer pill */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-mono font-bold sm:hidden">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className={remainingTime < 300 ? 'text-red-600' : 'text-slate-800'}>
                {formatDuration(remainingTime)}
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {activeQuestion ? (
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-panel space-y-6">
            {/* Passage / Context (if available) */}
            {activeQuestion.passage ? (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{activeQuestion.passage.title || 'Case Context & Comprehension'}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {activeQuestion.passage.context_text}
                </p>
              </div>
            ) : null}

            {/* Question Header & Marks */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question {activeIndex + 1} of {attempt.questions.length}
                </span>
                <h2 className="mt-1.5 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
                  {activeQuestion.question_text}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  +{activeQuestion.marks || 1} / -{activeQuestion.negative_marks || 0.25}
                </span>
                <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 uppercase">
                  {activeQuestion.question_type === 'multiple_correct' ? 'Multiple Choice' : 'Single Choice'}
                </span>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {activeQuestion.options.map((option, optIdx) => {
                const checked = activeQuestion.selected_option_ids.includes(option.id);
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border p-4 transition-all ${
                      checked
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/10 shadow-sm'
                        : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type={activeQuestion.question_type === 'multiple_correct' ? 'checkbox' : 'radio'}
                      name={`question-${activeQuestion.id}`}
                      checked={checked}
                      onChange={() => handleOptionToggle(activeQuestion, option.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-600">
                      {letter}
                    </span>
                    <span className="text-sm text-slate-800 font-medium leading-relaxed">
                      {option.option_text}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Bottom Question Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handleMarkForReview}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  ['marked_for_review', 'answered_and_marked'].includes(activeQuestion.state)
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>
                  {['marked_for_review', 'answered_and_marked'].includes(activeQuestion.state)
                    ? 'Remove Review Flag'
                    : 'Mark for Review'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveToQuestion(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>

                {activeIndex < attempt.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => moveToQuestion(activeIndex + 1)}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <span>Save &amp; Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitAlert(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Mock Test</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ) : null}
      </section>

      {/* Right Column: Timer & Question Palette */}
      <aside className="space-y-5">
        {/* Timer Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-panel space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Time Remaining</span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>

          <div
            className={`text-4xl font-extrabold tracking-tight font-mono text-center py-2 rounded-2xl border ${
              remainingTime < 300
                ? 'border-red-200 bg-red-50 text-red-600 animate-pulse'
                : 'border-slate-100 bg-slate-50 text-slate-900'
            }`}
          >
            {formatDuration(remainingTime)}
          </div>

          {/* Progress Counters */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5">
              <span className="text-[11px] text-emerald-800 font-medium">Answered</span>
              <p className="text-base font-bold text-emerald-900">
                {summary.answered + summary.answered_and_marked}
              </p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-2.5">
              <span className="text-[11px] text-purple-800 font-medium">Marked</span>
              <p className="text-base font-bold text-purple-900">
                {summary.marked_for_review + summary.answered_and_marked}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-2.5">
              <span className="text-[11px] text-amber-800 font-medium">Unanswered</span>
              <p className="text-base font-bold text-amber-900">{summary.not_answered}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <span className="text-[11px] text-slate-600 font-medium">Not Visited</span>
              <p className="text-base font-bold text-slate-800">{summary.not_visited}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitAlert(true)}
            className="w-full rounded-full bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
          >
            Finish &amp; Submit Test
          </button>
        </div>

        {/* Question Palette Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Question Palette
            </h3>
            <span className="text-[11px] text-slate-400">Jump to item</span>
          </div>

          {/* Palette Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-medium">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`flex-1 rounded-lg py-1 text-center transition-all ${
                  filter === item.key
                    ? 'bg-white font-bold text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-[280px] overflow-y-auto pr-1">
            {filteredQuestionIndexes.map((index) => {
              const q = attempt.questions[index];
              const isCurrent = index === activeIndex;

              let btnClass = 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100';
              if (['answered', 'answered_and_marked'].includes(q.state)) {
                btnClass = 'border-emerald-300 bg-emerald-500 text-white font-bold';
              } else if (q.state === 'marked_for_review') {
                btnClass = 'border-purple-300 bg-purple-500 text-white font-bold';
              } else if (q.state === 'not_answered') {
                btnClass = 'border-amber-300 bg-amber-100 text-amber-900 font-semibold';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => moveToQuestion(index)}
                  className={`flex h-9 w-full items-center justify-center rounded-xl border text-xs transition-all ${btnClass} ${
                    isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : ''
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Submit Confirmation Modal */}
      {showSubmitAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
                Confirm Final Submission
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Submit your exam attempt?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Once submitted, you will immediately receive your final score, detailed solution keys, and performance breakdown.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Answered:</span>
                <span className="font-bold text-emerald-600">
                  {summary.answered + summary.answered_and_marked} questions
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Marked for Review:</span>
                <span className="font-bold text-purple-600">
                  {summary.marked_for_review + summary.answered_and_marked} questions
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Unanswered:</span>
                <span className="font-bold text-amber-600">
                  {summary.not_answered + summary.not_visited} questions
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitAlert(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Return to Test
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Calculating Score...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
