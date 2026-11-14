#!/usr/bin/env bash
# Starts the production build and checks that key routes do not return 5xx.
# Used by CI to catch runtime crashes that a successful `next build` misses.
set -u
PORT="${PORT:-3100}"
LOG="$(mktemp)"
npx next start -H 127.0.0.1 -p "$PORT" >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:$PORT/robots.txt" && break
  sleep 1
done

failed=0
for path in / /announcements /events /sermons /admin/login /api/live-status /sitemap.xml; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "http://127.0.0.1:$PORT$path")
  echo "$path -> $code"
  if [ "$code" -ge 500 ] || [ "$code" = "000" ]; then
    echo "::error title=Smoke test::$path returned $code"
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  # Surface server output as annotations (readable without log access).
  grep -iE "error|cannot|failed|exception|at " "$LOG" | head -40 | while IFS= read -r line; do
    echo "::error title=Server log::${line//%/%25}"
  done
  echo "----- server log -----"
  cat "$LOG"
fi
exit "$failed"
