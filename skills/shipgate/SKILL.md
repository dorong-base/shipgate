---
name: shipgate
description: The fail-closed harness for the execution pipeline. Triggers on any request to approve, publish, ship, post, record a verdict, or measure content, and on "run the gates", "shipgate", "prove it". Gates refuse instead of advising; a REFUSED exit is a stop, not an obstacle.
---

# shipgate: No proof. No post.

The starter's content flow, with its promises enforced in code. The router still routes, the writer still writes, the brand-guardian still judges. shipgate is the harness underneath: every step's promise becomes a gate crossing, and the gate refuses instead of advising.

## The flow (each arrow is a gate)

```
brief ──G1──> card ──G2──> draft ──G3──> gated ──G4+GO/NO-GO──> go ──G5──> shipped ──G6──> measured
```

| Step | Command | The gate |
|---|---|---|
| Open a card from a brief | `node shipgate/cli.mjs new-card <id> --brief briefs/x.md` | G1: five fields + sourced proof points, or REFUSED |
| Clear the writer to start | `node shipgate/cli.mjs draft <id>` | G2: placeholders in the canon = REFUSED |
| Record the guardian's verdict | `node shipgate/cli.mjs verdict <id> --file verdicts/x.md` | G3: below 9, rejected, or malformed = REFUSED |
| Clear for publish | `node shipgate/cli.mjs go <id> --draft drafts/x.md --gonogo verdicts/x-gonogo.md` | G4: unsourced numbers = REFUSED · GO/NO-GO: `agents/go-nogo.md` must say GO |
| Record that it went out | `node shipgate/cli.mjs ship <id> --evidence <url>` | G5: no URL, no "shipped" |
| Close the loop | `node shipgate/cli.mjs measure <id> --value N --unit u --source s --by name` | G6: no source, no "done" |
| See the board + the number | `node shipgate/cli.mjs status` | grounding rate, legacy cards named |

## Iron laws

- The engine is the only writer of `data/cards.jsonl`. Never edit a card by hand; a PreToolUse hook blocks it.
- A REFUSED exit is a stop, not an obstacle. Fix the input; never fix the gate.
- Drafts live in `drafts/`, verdicts in `verdicts/`, briefs in `briefs/`. The writer writes drafts only after G2 clears.
- Publishing is a one-way door: a human posts, then records the evidence URL. The system never posts.
- The whole harness runs with zero API keys: `node shipgate/prove.mjs` proves every gate on a fresh clone.
