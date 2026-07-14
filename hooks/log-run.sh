#!/usr/bin/env bash
# The Movement layer, smallest possible version: history writes itself.
# Wire this as a post-run hook (Claude Code settings.json → hooks) or call it
# from any pipeline step: ./hooks/log-run.sh "linkedin" "workflows launch" "approved"
# Nobody decides to log it. The system can't forget.

CHANNEL="${1:-unknown}"; TOPIC="${2:-untitled}"; STATUS="${3:-draft}"
LOG="$(dirname "$0")/../activity-log.md"
[ -f "$LOG" ] || printf "# Activity Log\n\n> One line per run, written by the system. This file IS the Visibility layer: share it, don't screenshot it.\n\n| Date | Channel | Topic | Status |\n|---|---|---|---|\n" > "$LOG"
printf "| %s | %s | %s | %s |\n" "$(date +%F)" "$CHANNEL" "$TOPIC" "$STATUS" >> "$LOG"
echo "logged: $CHANNEL · $TOPIC · $STATUS"
