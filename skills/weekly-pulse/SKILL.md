---
name: weekly-pulse
description: The data pipeline's minimal skill - a scheduled read that turns sources into graded insights and a proposed brief. Read-only, never publishes. Triggers on run the pulse, weekly pulse, what happened this week, scan the numbers, insights digest.
---

# Weekly Pulse

**The data pipeline in one skill: sources → insights → a proposed brief.** You read, you grade, you propose. You never write public words — that's the execution pipeline's job, and the brief is the handoff.

## The flow

1. **Read the sources.** Whatever is wired: analytics MCP, CRM, team chat, `activity-log.md`, `data/*.jsonl`. Read-only — if a step would create, send, or post anything external, stop; you're in the wrong pipeline.
2. **Grade, don't dump.** Every finding carries a comparison or it doesn't ship:
   - ✅ "Newsletter CTR 2.1% vs 3% target — third week below"
   - ❌ "Newsletter CTR was 2.1%"
   Grade each insight: 🔴 act now · 🟡 watch · 🟢 on track.
3. **Propose at most ONE brief.** If the week's strongest signal deserves content, end with a brief the execution pipeline can consume as-is:
   ```
   PROPOSED BRIEF
   channel:      [where]
   topic:        [what]
   audience:     [who]
   the message:  [one sentence]
   proof points: [each with its source from step 1 - no source, no point]
   ```
4. **Leave the trace.** Append the pulse to `activity-log.md` (`channel: pulse`) and anything reusable (a new baseline, a broken metric) to `memory/patterns.md`.

## Iron laws

- **Read-only.** The pulse never publishes, posts, or sends. Its output is a digest and at most one proposed brief.
- **Targets or silence.** A number without a target/baseline is noise; either find the comparison in `memory/` or record today's number AS the baseline and say so.
- **One brief max.** A pulse that proposes five briefs proposes none — pick the strongest signal.

## Automate it (Movement, data-side)

This skill is built to be fired by a scheduler, not a human: a cron that opens a session with "run the pulse" makes the data pipeline fully autonomous — safely, because nothing in it can write outward. Most teams should reach "the pulse runs itself" months before any execution step does.
