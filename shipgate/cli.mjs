#!/usr/bin/env node
// shipgate/cli.mjs: the operator's console. Every command is a gate crossing;
// a failed gate prints REFUSED with the rule it quotes, and exits non-zero.
//
//   node shipgate/cli.mjs status
//   node shipgate/cli.mjs new-card <id> --brief briefs/x.md
//   node shipgate/cli.mjs draft <id> (runs G1)
//   node shipgate/cli.mjs verdict <id> --file verdicts/x.md (runs G3)
//   node shipgate/cli.mjs go <id> --draft <file> --gonogo <file> (runs G2+G4+GO/NO-GO)
//   node shipgate/cli.mjs ship <id> --evidence <url> (runs G5)
//   node shipgate/cli.mjs measure <id> --value N --unit impressions --source <file/url> --by <name> (runs G6)

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseBrief, checkBrief, checkCanon, parseVerdict, checkGrounding, parseGoNoGo, transition, groundingStats } from './gates.mjs';
import { loadCards, saveCards, getCard, newCard, logHistory, logActivity } from './cards.mjs';

// SHIPGATE_ROOT lets prove.mjs run the whole pipeline in a throwaway copy :
// the acceptance test never mutates the repo it is proving.
const ROOT = process.env.SHIPGATE_ROOT || fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const CARDS = process.env.SHIPGATE_CARDS || `${ROOT}/data/cards.jsonl`;

const [, , cmd, id, ...rest] = process.argv;
const opts = {};
for (let i = 0; i < rest.length; i += 2) opts[rest[i]?.replace(/^--/, '')] = rest[i + 1];

function refuse(result, card, cards) {
  for (const r of result.refusals) console.error(`\x1b[31mREFUSED\x1b[0m  ${r}`);
  if (card) {
    logHistory(card, `REFUSED: ${result.refusals[0]}`);
    saveCards(CARDS, cards);
    logActivity(ROOT, card.channel, card.topic, 'REFUSED');
  }
  process.exit(1);
}

function pass(card, cards, line) {
  logHistory(card, line);
  saveCards(CARDS, cards);
  logActivity(ROOT, card.channel, card.topic, card.status);
  console.log(`\x1b[32mPASS\x1b[0m     ${card.id} → ${card.status} · ${line}`);
}

function readBrief(card) {
  const p = `${ROOT}/${card.brief}`;
  if (!existsSync(p)) refuse({ refusals: [`G1: brief file ${card.brief} not found`] }, null, null);
  return parseBrief(readFileSync(p, 'utf8'));
}

function canonFiles() {
  const files = {};
  for (const p of ['brand/voice-guide.md', 'brand/rules.md', 'brand/DESIGN.md']) {
    if (existsSync(`${ROOT}/${p}`)) files[p] = readFileSync(`${ROOT}/${p}`, 'utf8');
  }
  return files;
}

const cards = loadCards(CARDS);

switch (cmd) {
  case 'status': {
    const stats = groundingStats(cards);
    console.log(`\nshipgate: No proof. No post.\n`);
    for (const c of cards) {
      const g = c.grounding ? `${c.grounding.grounded}/${c.grounding.claims} grounded` : 'no proof chain';
      console.log(`  ${c.id}  [${c.status.padEnd(8)}]  ${c.channel} · ${c.topic} · score:${c.guardian_score ?? '?'} · ${g}${c.measurement ? ` · ${c.measurement.value} ${c.measurement.unit}` : ''}`);
    }
    console.log(`\n  THE NUMBER: ${stats.headline}`);
    const fired = cards.reduce((n, c) => n + (c.history || []).filter(h => h.includes('REFUSED')).length, 0);
    console.log(`  REFUSALS FIRED: ${fired} on real runs, each one logged on its card (a gate that never fires proves nothing)\n`);
    break;
  }

  case 'new-card': {
    if (!id || !opts.brief) { console.error('usage: new-card <id> --brief <file>'); process.exit(1); }
    const briefCheck = checkBrief(parseBrief(readFileSync(`${ROOT}/${opts.brief}`, 'utf8')));
    if (!briefCheck.ok) refuse(briefCheck, null, null);
    const brief = parseBrief(readFileSync(`${ROOT}/${opts.brief}`, 'utf8'));
    const card = newCard(cards, { id, channel: brief.channel, topic: brief.topic, brief_path: opts.brief });
    saveCards(CARDS, cards);
    logActivity(ROOT, card.channel, card.topic, 'briefed');
    console.log(`\x1b[32mPASS\x1b[0m     G1 · card ${id} created (briefed): ${brief.proof_points.length} sourced proof points`);
    break;
  }

  case 'draft': {
    const card = must(id);
    const canon = checkCanon(canonFiles());
    if (!canon.ok) refuse(canon, card, cards);            // G2: no canon, no content
    const briefCheck = checkBrief(readBrief(card));
    const t = transition(card, 'drafted', { briefCheck });
    if (!t.ok) refuse(t, card, cards);
    pass(card, cards, 'G1+G2 passed: writer may start (canon read, brief complete)');
    break;
  }

  case 'verdict': {
    const card = must(id);
    if (!opts.file) { console.error('usage: verdict <id> --file <guardian-verdict.md>'); process.exit(1); }
    const verdict = parseVerdict(readFileSync(`${ROOT}/${opts.file}`, 'utf8'));
    const t = transition(card, 'gated', { verdict });
    if (!t.ok) refuse(t, card, cards);
    pass(card, cards, `G3 passed: guardian verdict ${verdict.score}/10 (${verdict.status}) recorded from ${opts.file}`);
    break;
  }

  case 'go': {
    const card = must(id);
    if (!opts.draft || !opts.gonogo) { console.error('usage: go <id> --draft <file> --gonogo <file>'); process.exit(1); }
    const grounding = checkGrounding(readFileSync(`${ROOT}/${opts.draft}`, 'utf8'), readBrief(card));
    if (!grounding.ok) refuse(grounding, card, cards);    // G4
    const gonogo = parseGoNoGo(readFileSync(`${ROOT}/${opts.gonogo}`, 'utf8'));
    const t = transition(card, 'go', { grounding, gonogo });
    if (!t.ok) refuse(t, card, cards);
    card.draft = opts.draft;
    pass(card, cards, `G4 + GO/NO-GO passed: ${grounding.grounded}/${grounding.claims} claims grounded, adversarial verdict GO`);
    break;
  }

  case 'ship': {
    const card = must(id);
    const t = transition(card, 'shipped', { evidence: opts.evidence });
    if (!t.ok) refuse(t, card, cards);
    pass(card, cards, `G5 passed: evidence: ${opts.evidence}`);
    break;
  }

  case 'measure': {
    const card = must(id);
    const t = transition(card, 'measured', { measurement: { value: opts.value, unit: opts.unit, source: opts.source, recorded_by: opts.by } });
    if (!t.ok) refuse(t, card, cards);
    pass(card, cards, `G6 passed: ${opts.value} ${opts.unit} (source: ${opts.source}, by ${opts.by})`);
    console.log(`\n  ${groundingStats(cards).headline}\n`);
    break;
  }

  default:
    console.log('shipgate: No proof. No post.\ncommands: status · new-card · draft · verdict · go · ship · measure');
    process.exit(cmd ? 1 : 0);
}

function must(cardId) {
  const c = getCard(cards, cardId);
  if (!c) { console.error(`no card "${cardId}": run: new-card ${cardId} --brief <file>`); process.exit(1); }
  return c;
}
