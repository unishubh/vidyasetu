#!/bin/sh

set -eu

cleanup() {
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

(
  cd /Users/shubham.shukla/Documents/vidyaSetu/vidyasetu-backend
  PORT=4000 npm run dev
) &
BACKEND_PID=$!

(
  cd /Users/shubham.shukla/Documents/vidyaSetu/vidyasetu-frontend
  rm -rf .next
  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 npm run dev -- --port 3001
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
