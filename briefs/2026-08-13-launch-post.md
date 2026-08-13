---
channel: linkedin
topic: shipgate launch — a fail-closed harness for the marketing-engineering starter
audience: builders who ship with AI and don't fully trust what it writes
message: A gate that refuses beats a reviewer who suggests
cta: Clone the fork and run the prove command
proof_points:
  - id: P1
    claim: "shipgate adds six deterministic gates to the starter's content flow"
    source: "shipgate/gates.mjs (this repo) — G1 through G6, one exported check per gate"
  - id: P2
    claim: "the starter's README already promises a router that refuses, a writer that can't start, and a guardian that blocks — as prose"
    source: "README.md first paragraph, upstream blutrich/marketing-engineering-starter @ 2e643ce"
  - id: P3
    claim: "one command proves every gate with zero API keys: 20 proofs on a fresh clone"
    source: "node shipgate/prove.mjs — output table, runs offline, Node stdlib only"
  - id: P4
    claim: "the failure mode is already in the starter's own example data: card cc-003 stalled on an unverified metric"
    source: "data/content-cards.example.jsonl line 3 (upstream): 'guardian: 7 - unverified metric in tweet 3'"
  - id: P5
    claim: "this fork modified 3 of the 5 starter files the assignment allows; a gate enforces the budget"
    source: "shipgate/upstream-manifest.json + prove.mjs G7 output"
  - id: P6
    claim: "zero dependencies — plain markdown plus Node stdlib"
    source: "package.json: no dependencies field, no lockfile"
  - id: P7
    claim: "the first brand rule in this fork was born from a real human rejection on day one"
    source: "memory/patterns.md, voice learnings entry dated 2026-08-13 (the em dash ban)"
---
The launch post for shipgate itself. This card is the assignment's real marketing
artifact: it goes through the existing brand-guardian, its verdict is recorded here,
a human posts it on LinkedIn, and its real measurement (impressions) closes the loop.
The post that announces the gates cannot go out without passing them.
