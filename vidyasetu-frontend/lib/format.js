export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatCurrency(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

export function summarizeAttemptStates(questions) {
  return questions.reduce((summary, question) => {
    const status = question.state || 'not_visited';
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, {
    not_visited: 0,
    not_answered: 0,
    answered: 0,
    marked_for_review: 0,
    answered_and_marked: 0,
  });
}

export function formatDateTime(value) {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDateOnly(value) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatRelativeDays(value) {
  if (!value) {
    return 'No recent activity';
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return '1 day ago';
  }

  return `${days} days ago`;
}
