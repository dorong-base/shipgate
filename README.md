# Marketing Engineering — Starter

**The 4-layer AI marketing architecture — Brain · Visibility · Movement · Memory — as a forkable Claude Code starter.**

Clone it, fill in YOUR brand, and you have the framework running: a router that refuses to write without a brief, a writer that can't start before reading your voice guide, and a guardian that blocks anything below 9/10.

## This fork: shipgate (No proof. No post.)

The paragraph above makes three promises: a router that **refuses**, a writer that **can't start**, a guardian that **blocks**. Upstream, they are prose. In this fork they are gates: six deterministic checks that refuse instead of advising, plus an adversarial GO/NO-GO agent before anything publishes.

**Prove it on a fresh clone, zero API keys, zero installs:**

```bash
node shipgate/prove.mjs
```

20 proofs: every shortcut REFUSED, one legal path from brief to measured. Then `node shipgate/cli.mjs status` shows the board and the one number: how many published claims carry a cited source.

| Gate | Refuses when |
|---|---|
| G1 | a draft is requested without a complete, source-backed brief |
| G2 | the brand canon still contains placeholders |
| G3 | no brand-guardian verdict of 9+ is recorded (the existing gate, unmodified) |
| G4 | a number in the draft has no [P#] marker resolving to a sourced proof point |
| G5 | "shipped" is claimed without an evidence URL (approved is not shipped) |
| G6 | "done" is claimed without a real measurement (shipped is not done) |

Operator flow: `skills/shipgate/SKILL.md`. The gap, the forks reviewed, and every modified-file justification: `docs/DECISION.md`. This repository was imported rather than GitHub-forked so it could stay private during the assignment window; upstream is `blutrich/marketing-engineering-starter` @ `2e643ce`, pinned in `shipgate/upstream-manifest.json`. prove.mjs fails if more than 5 starter files change.

## The 4 layers, mapped to files

| Layer | The question | Where it lives here |
|---|---|---|
| 🧠 **Brain** | How does it think? | `skills/marketing-router/` + `agents/` — specialists with structural enforcement, not one mega-prompt |
| 👁 **Visibility** | How does the org see what it did? | `activity-log.md` — every run appends one line; share the file |
| 🦿 **Movement** | What does it actually DO? | `hooks/log-run.sh` — history writes itself; graduate to schedulers and triggers |
| 💾 **Memory** | What survives between runs? | `memory/` — read at start, updated at end; week 10 beats week 1 |

Plus: `brand/` (your voice + design canon — fill-in templates), `CLAUDE.md` (the LLM's operating contract, loaded automatically), `data/content-cards.example.jsonl` (the entity shape: status · guardian score · **evidence** — approved ≠ shipped), and `scorecard.md` (score your stack, find your next build).

## Quick start

```bash
git clone https://github.com/blutrich/marketing-engineering-starter.git
cd marketing-engineering-starter && claude
```

1. Fill `brand/voice-guide.md` and `brand/rules.md` (replace every bracket — or ask Claude to interview you; it will).
2. Ask for content. The router confirms a brief, the writer drafts, the guardian scores. You only see what passed.
3. When you reject something the guardian passed, say why — the second occurrence becomes a rule. That loop is the whole system.

## Build order

1. **Visibility** first — trust before autonomy
2. **Memory** second — cheap, compounds
3. **Brain** third — specialists, once you know what good means
4. **Movement** last — only automate what you already trust

## License

MIT — take it, fork it, build on it.

---

Built by [Ofer Blutrich](https://www.linkedin.com/in/ofer-blutrich). More free tools: [community-pulse](https://github.com/blutrich/community-pulse) · [weekly-competitor-news](https://github.com/blutrich/weekly-competitor-news)
