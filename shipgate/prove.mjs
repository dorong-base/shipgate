#!/usr/bin/env node
// shipgate/prove.mjs: the one command. Run it on a fresh clone with zero API keys:
//
//     node shipgate/prove.mjs
//
// It attacks every gate with the exact shortcut the gate exists to refuse,
// expects REFUSED, then walks the only legal path: brief → draft → verdict →
// GO → shipped → measured. It runs against a throwaway copy of the pipeline;
// the repo you are proving is never mutated. Exit 0 means the README's first
// paragraph is true: the router refuses, the writer can't start, the guardian blocks.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { checkGrounding, parseBrief, parseVerdict, transition } from './gates.mjs';

const REPO = dirname(fileURLToPath(new URL('.', import.meta.url)));
const CLI = join(REPO, 'shipgate', 'cli.mjs');
const results = [];
let failures = 0;

function record(gate, name, ok, detail = '') {
  results.push({ gate, name, ok, detail });
  if (!ok) failures++;
}

// ---------- throwaway pipeline root ----------

const TMP = mkdtempSync(join(tmpdir(), 'shipgate-prove-'));
mkdirSync(join(TMP, 'data'), { recursive: true });
cpSync(join(REPO, 'brand'), join(TMP, 'brand'), { recursive: true });
cpSync(join(REPO, 'shipgate', 'fixtures'), join(TMP, 'shipgate', 'fixtures'), { recursive: true });

function cli(args, { expectRefused = false } = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    env: { ...process.env, SHIPGATE_ROOT: TMP, SHIPGATE_CARDS: join(TMP, 'data', 'cards.jsonl') },
    encoding: 'utf8',
  });
  const refused = r.status !== 0;
  return { asExpected: refused === expectRefused, out: (r.stdout + r.stderr).trim() };
}

// ---------- G1 · no brief, no draft ----------

let r = cli(['new-card', 'demo-000', '--brief', 'shipgate/fixtures/brief-incomplete.md'], { expectRefused: true });
record('G1', 'brief missing cta + proof points is REFUSED', r.asExpected, r.out.split('\n')[0]);

r = cli(['new-card', 'demo-001', '--brief', 'shipgate/fixtures/brief-demo.md']);
record('G1', 'complete brief (5 fields, sourced proof points) passes', r.asExpected);

// ---------- G2 · no canon, no content ----------

const realCanon = readFileSync(join(TMP, 'brand', 'voice-guide.md'), 'utf8');
writeFileSync(join(TMP, 'brand', 'voice-guide.md'), '# Brand Voice Guide: [YOUR BRAND]\n\n[One sentence: who are they?]\n');
r = cli(['draft', 'demo-001'], { expectRefused: true });
record('G2', 'canon with [placeholders] is REFUSED before the writer starts', r.asExpected, r.out.split('\n')[0]);

writeFileSync(join(TMP, 'brand', 'voice-guide.md'), realCanon);
r = cli(['draft', 'demo-001']);
record('G2', "this repo's actual canon is filled: writer may start", r.asExpected);

// ---------- state gate · approved ≠ shipped, no skipping ----------

r = cli(['ship', 'demo-001', '--evidence', 'https://example.com/post'], { expectRefused: true });
record('G5', 'drafted → shipped (skipping the guardian) is REFUSED', r.asExpected, r.out.split('\n')[0]);

// ---------- G3 · the guardian blocks below 9 ----------

r = cli(['verdict', 'demo-001', '--file', 'shipgate/fixtures/verdict-malformed.md'], { expectRefused: true });
record('G3', '"looks great, ship it" without a verdict block is REFUSED', r.asExpected);

r = cli(['verdict', 'demo-001', '--file', 'shipgate/fixtures/verdict-85.md'], { expectRefused: true });
record('G3', 'a recorded 8.5/10 is REFUSED: nothing releases below 9', r.asExpected);

r = cli(['verdict', 'demo-001', '--file', 'shipgate/fixtures/verdict-95.md']);
record('G3', '9.5/10 [approved] with a Failed-rules line is recorded and passes', r.asExpected);

// ---------- G4 · no source, no claim ----------

r = cli(['go', 'demo-001', '--draft', 'shipgate/fixtures/draft-ungrounded.md', '--gonogo', 'shipgate/fixtures/gonogo-go.md'], { expectRefused: true });
record('G4', 'draft with "3 forks", "87%" and no [P#] markers is REFUSED', r.asExpected, r.out.split('\n')[0]);

const unresolved = checkGrounding('We built 6 gates [P9].', parseBrief(readFileSync(join(TMP, 'shipgate/fixtures/brief-demo.md'), 'utf8')));
record('G4', 'a marker that resolves to no proof point is REFUSED', !unresolved.ok);

// ---------- GO/NO-GO · adversarial, never self-review ----------

r = cli(['go', 'demo-001', '--draft', 'shipgate/fixtures/draft-grounded.md', '--gonogo', 'shipgate/fixtures/gonogo-nogo.md'], { expectRefused: true });
record('GO/NO-GO', 'a NO-GO verdict blocks publish even when G4 passes', r.asExpected);

r = cli(['go', 'demo-001', '--draft', 'shipgate/fixtures/draft-grounded.md', '--gonogo', 'shipgate/fixtures/gonogo-go.md']);
record('GO/NO-GO', 'grounded draft + adversarial GO passes', r.asExpected);

// ---------- G5 · evidence or it didn't ship ----------

r = cli(['ship', 'demo-001', '--evidence', 'trust-me-it-went-out'], { expectRefused: true });
record('G5', '"trust me it went out" is not evidence: REFUSED', r.asExpected);

r = cli(['ship', 'demo-001', '--evidence', 'https://www.linkedin.com/posts/example-demo']);
record('G5', 'a real URL is recorded as evidence and passes', r.asExpected);

// ---------- G6 · shipped ≠ done ----------

r = cli(['measure', 'demo-001', '--value', '100', '--unit', 'impressions'], { expectRefused: true });
record('G6', 'a number with no source and no recorder is REFUSED', r.asExpected);

r = cli(['measure', 'demo-001', '--value', '100', '--unit', 'impressions', '--source', 'analytics-screenshot.png', '--by', 'prove.mjs']);
record('G6', 'value + unit + source + recorded_by closes the card as measured', r.asExpected);

// ---------- direct engine checks (no CLI in the way) ----------

record('G3', 'parseVerdict refuses a bare "10 out of 10"', !parseVerdict('10 out of 10, no notes').ok);
const skip = transition({ id: 'x', status: 'briefed', history: [] }, 'go', {});
record('state', 'briefed → go (three gates skipped) is refused in the engine itself', !skip.ok);

// ---------- the one number ----------

r = cli(['status']);
record('NUMBER', 'on the synthetic demo card, grounding rate reads "1 of 1 published claims carry a cited source"', r.out.includes('1 of 1 published claims carry a cited source'), r.out.match(/THE NUMBER.*/)?.[0]);

// ---------- G7 · the diff gate (we gate ourselves) ----------

const manifest = JSON.parse(readFileSync(join(REPO, 'shipgate', 'upstream-manifest.json'), 'utf8'));
const modified = [];
for (const [file, hash] of Object.entries(manifest.files)) {
  const p = join(REPO, file);
  if (!existsSync(p)) { modified.push(`${file} (deleted)`); continue; }
  // Normalize line endings before hashing: a Windows checkout (CRLF) is not a modification.
  const normalized = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  const actual = createHash('sha256').update(normalized, 'utf8').digest('hex');
  if (actual !== hash) modified.push(file);
}
record('G7', `starter files modified: ${modified.length} of ${manifest.max_modified} allowed${modified.length ? ' · ' + modified.join(', ') : ''}`, modified.length <= manifest.max_modified);

// ---------- verdict ----------

rmSync(TMP, { recursive: true, force: true });

console.log('\nshipgate prove: every shortcut refused, one legal path through\n');
for (const x of results) {
  console.log(`  ${x.ok ? '\x1b[32mPROVED\x1b[0m' : '\x1b[31mFAILED\x1b[0m'}  [${x.gate.padEnd(8)}] ${x.name}`);
  if (x.detail) console.log(`           ${x.detail.replace(/\x1b\[\d+m/g, '')}`);
}
console.log(`\n  ${results.length - failures} of ${results.length} proofs hold.${failures ? ' FIX BEFORE SHIPPING.' : ' The README\'s first paragraph is now true.'}\n`);
process.exit(failures ? 1 : 0);
