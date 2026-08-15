# Decision doc: shipgate

> No proof. No post. A fail-closed harness for the marketing-engineering starter.
> Fork: github.com/dorong-base/shipgate (public fork of blutrich/marketing-engineering-starter) · Live: https://shipgate-five.vercel.app · Prove it: `node shipgate/prove.mjs`

## The gap, and why this one first

The starter's README opens with three promises: a router that **refuses** to write without a brief, a writer that **can't start** before reading the voice guide, a guardian that **blocks** anything below 9/10. Upstream, all three are prose. The agent files ask politely; nothing in the code can refuse. Every other gap we considered (autonomous pulse, canon onboarding, more channels) sits downstream of an unenforced pipeline, and a pipeline that can be skipped makes everything it feeds decorative. So the first gap is the harness itself: make the README's first paragraph true. shipgate adds six deterministic gates (G1 brief, G2 canon, G3 verdict, G4 grounding, G5 evidence, G6 measurement), an adversarial GO/NO-GO agent, and a state machine where every transition passes its gate or gets a quoted refusal.

## What already exists, upstream and in the forks

Upstream ships the 4-layer architecture, prompt-level agents, a fill-in brand canon, a jsonl entity shape (status · guardian score · evidence) that no code reads, and one logging hook that nothing wires. The repo's own opinions point at what is missing: the entity shape says "approved is not shipped", the iron laws say "no invented facts", and the first paragraph promises refusal. None of it is enforced.

Public forks reviewed (excluding this one): exactly two, both by the same author. `ori-a-cohen/base44-marketing-os` ("Roundtrip") is a strong, complete build: content-level lint hooks (vocabulary, design tokens), a rendering pipeline, measurement adapters, and a loop-closure metric on a hosted board. `oriqualia/base44-marketing-os` is an untouched fork. Roundtrip enforces **content** and measures **outcomes**. Nobody, upstream or fork, enforces **process**: brief before draft, verdict before approval, evidence before shipped, measurement before done. Roundtrip answers "did it work?"; shipgate answers "did it deserve to ship?". That is why this gap is next, not a duplicate.

## The one number

**Grounding rate: of the claims we published, how many carry a cited source.** Reported live on the board as "N of M published claims carry a cited source", alongside the count of refusals fired on real runs, because a gate that never fires proves nothing: the refusals are the evidence the engine is alive, the rate is the evidence it works. It starts at zero with a confession: one legacy card (the starter's own example) shipped with no proof chain, and the board names it rather than hiding it. The number can only rise by shipping through the gates, because G4 refuses any number in a draft that lacks a [P#] marker resolving to a sourced proof point in the brief. G4 is not a rule we invented: it is `brand/rules.md` rule 4 ("every number traces to a real source, no source = cut"), which until now was a polite request to an LLM. Rule 4 existed as a request; shipgate makes it a refusal.

**Measurement, landed:** card launch-001 closed as measured on 2026-08-15. The real launch post did 478 impressions in its first 24 hours (unit: impressions · source: `data/launch-001-linkedin-analytics-2026-08-15.xlsx`, the official LinkedIn analytics export, checked into this repo · recorded_by: Doron Gomel). The G6 crossing happened live, on camera, in the submission recording, right after the same command was refused for missing a source.

## What we deliberately did NOT build

1. **No auto-publishing.** Publishing is a one-way door, so a human posts and records the evidence URL; the system can refuse to bless, it never acts outward.
2. **No LLM inside the gates.** Deterministic checks only, so the entire harness proves itself on a fresh clone with zero API keys, zero flakiness, in one command.
3. **No board or measurement suite.** Roundtrip already built that well; duplicating it would add surface area, not proof. Our console shows exactly one number and the cards behind it.

## The broken promises, named

**First, and the one we fix as the core of this fork.** README, first paragraph: "a router that refuses… a writer that can't start… a guardian that blocks anything below 9/10." The code does none of it. Worse, the promise contradicts the repo's own spec: `brand/rules.md` and `agents/brand-guardian.md` both say a 7 to 8 draft gets fixed inline by the guardian and released. So "blocks anything below 9/10" was not just unenforced, it was disagreed with, in writing, two files away. Our call: **fix it, and side with the README.** G1 makes the router's refusal real, G2 makes the writer's hard gate real, G3 makes the guardian's block real: it parses the existing brand-guardian verdict format (its file untouched) and refuses any recorded score below 9, including a "fixed-and-approved" 8. The first paragraph is true in this fork for the first time. And it fired on our own work: this fork's launch post scored 8 on its first pass, exactly the score upstream's spec releases, and G3 refused it. The refusal, the revision and the 9.5 that followed are recorded on card launch-001, which is also why the refusals counter on the board starts at 1 and not at 0. `node shipgate/prove.mjs` attacks every gate with the exact shortcut it exists to refuse and expects REFUSED, twenty proofs, offline.

**Second, fixed with zero modified files.** The README maps the entire Visibility layer to `activity-log.md` ("every run appends one line") and `hooks/log-run.sh` claims "history writes itself. Nobody decides to log it. The system can't forget." But `activity-log.md` does not exist in the starter, nothing calls log-run.sh, and there is no `.claude/settings.json` to wire it. A documented layer that never ran. In this fork every CLI gate crossing, including refusals, appends to `activity-log.md` in log-run.sh's own format, and a PreToolUse hook blocks hand-edits to the card store. log-run.sh itself: untouched.

## Modified starter files: 3 of the 5 allowed, one line each

| File | Why |
|---|---|
| `brand/voice-guide.md` | The quick start's own step 1; an empty canon means G2 refuses all content work. |
| `memory/patterns.md` | The learning loop in action: three real operator rejections recorded on day one (em dashes banned, a too-pointed quote rewritten, off-token console colors caught and fixed). |
| `README.md` | The assignment requires naming the prove command in the README; added the shipgate section and the gate map. |

G7, the diff gate inside prove.mjs, pins all 14 upstream files by hash (line-ending safe) and fails the build past 5 modifications. We gate ourselves.

## Inside knowledge, declared

I work in technical support at Base44. Everything used here is public: the starter repo, both public forks, the sdd-kit repo and landing page, and Ofer Blutrich's public LinkedIn post about sdd-kit (2026-08-12). That post is where the fail-closed framing came from, and the transplant is deliberate and credited in the README, the console footer, and here: spec becomes brief, code becomes content, merge becomes publish, "no spec no code" becomes "no proof no post".

## The 24-hour input

At the 24-hour mark (2026-08-14 07:56), nothing arrived. I flagged it in writing at 10:29. The reply came at 11:48, four words: "You can keep building." We treated that as the input, because it is one: the most realistic brief update there is, the stakeholder gives you nothing and the decision stays yours. So it is recorded here with its timestamps, nothing was changed that we could not justify ourselves, and the pipeline kept moving. If a fuller input still lands before submission, this section gets a dated update and the commits that absorbed it.

## Workflow

Claude (Anthropic's Cowork) drove research, planning and code. A second, independent Claude session served as an adversarial reviewer: its only job was to attack the plan and the deliverables between milestones, and its best catches are on the record, including the walk-back to revision 3 after a GO, the crossings-name-their-files fix, and the pre-publish scrub. The same never-self-review principle the system enforces on content was applied to the workflow that built it. I drove every decision, rejection, commit and the publish button. The rejections are in `memory/patterns.md`; the plan-first workflow is visible in the commit history.
