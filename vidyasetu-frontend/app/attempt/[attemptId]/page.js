'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
        setError(requestError.response?.data?.message || 'Failed to load attempt');
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
        setError(requestError.response?.data?.message || 'Failed to refresh attempt');
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
      setError(requestError.response?.data?.message || 'Failed to save answer');
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
      setError(requestError.response?.data?.message || 'Failed to update review state');
    }
  };

  const moveToQuestion = async (nextIndex) => {
    if (activeQuestion && activeQuestion.state === 'not_visited') {
      updateQuestionLocally(activeQuestion.id, () => ({ state: 'not_answered' }));
      try {
        await persistState(activeQuestion.id, 'not_answered');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to update question state');
      }
    }

    setActiveIndex(nextIndex);

    const nextQuestion = attempt.questions[nextIndex];

    if (nextQuestion?.state === 'not_visited') {
      updateQuestionLocally(nextQuestion.id, () => ({ state: 'not_answered' }));
      try {
        await persistState(nextQuestion.id, 'not_answered');
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to update question state');
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
      setError(requestError.response?.data?.message || 'Failed to submit attempt');
      if (!automatic) {
        setShowSubmitAlert(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-slate-500">Checking your session...</p>;
  }

  if (!attempt) {
    return <p className="text-sm text-slate-500">Loading attempt...</p>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 px-6 py-5 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Attempt #{attempt.attempt_number}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {attempt.test.title}
          </h1>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {activeQuestion ? (
          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            {activeQuestion.passage ? (
              <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  {activeQuestion.passage.title || 'Case study'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {activeQuestion.passage.context_text}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Question {activeIndex + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  {activeQuestion.question_text}
                </h2>
              </div>
              <span className="rounded-full bg-skywash px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {activeQuestion.question_type === 'multiple_correct' ? 'Multiple correct' : 'Single correct'}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {activeQuestion.options.map((option) => {
                const checked = activeQuestion.selected_option_ids.includes(option.id);

                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-300 hover:bg-white"
                  >
                    <input
                      type={activeQuestion.question_type === 'multiple_correct' ? 'checkbox' : 'radio'}
                      name={`question-${activeQuestion.id}`}
                      checked={checked}
                      onChange={() => handleOptionToggle(activeQuestion, option.id)}
                      className="mt-1 h-4 w-4 border-slate-400 text-sky-700 focus:ring-sky-500"
                    />
                    <span className="text-sm leading-6 text-slate-700">{option.option_text}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleMarkForReview}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {['marked_for_review', 'answered_and_marked'].includes(activeQuestion.state)
                  ? 'Unmark review'
                  : 'Mark for review'}
              </button>
              {activeIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => moveToQuestion(activeIndex - 1)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Previous
                </button>
              ) : null}
              {activeIndex < attempt.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => moveToQuestion(activeIndex + 1)}
                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitAlert(true)}
                  className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Review before submit
                </button>
              )}
            </div>
          </article>
        ) : null}
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-ink/10 bg-ink p-6 text-white shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
            Attempt #{attempt.attempt_number}
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">
            {formatDuration(remainingTime)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <p>Answered: {summary.answered + summary.answered_and_marked}</p>
            <p>Marked: {summary.marked_for_review + summary.answered_and_marked}</p>
            <p>Not answered: {summary.not_answered}</p>
            <p>Not visited: {summary.not_visited}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-panel">
          <div className="flex flex-wrap gap-2">
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

          <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {filteredQuestionIndexes.map((questionIndex) => {
              const question = attempt.questions[questionIndex];
              const paletteClass = question.state === 'answered'
                ? 'bg-emerald-100 text-emerald-800'
                : question.state === 'answered_and_marked'
                  ? 'bg-amber-200 text-amber-900'
                  : question.state === 'marked_for_review'
                    ? 'bg-amber-100 text-amber-800'
                    : question.state === 'not_answered'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-700';

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => moveToQuestion(questionIndex)}
                  className={`rounded-2xl px-3 py-3 text-sm font-semibold ${paletteClass} ${
                    activeIndex === questionIndex ? 'ring-2 ring-ink/50' : ''
                  }`}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitAlert(true)}
            className="mt-5 w-full rounded-2xl bg-ember px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Submit test
          </button>
        </div>
      </aside>

      {showSubmitAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-panel">
            <h2 className="text-2xl font-semibold text-ink">Submit attempt?</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Answered: {summary.answered + summary.answered_and_marked}</p>
              <p>Marked for review: {summary.marked_for_review + summary.answered_and_marked}</p>
              <p>Not answered: {summary.not_answered}</p>
              <p>Not visited: {summary.not_visited}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitAlert(false)}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                {submitting ? 'Submitting...' : 'Submit now'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
