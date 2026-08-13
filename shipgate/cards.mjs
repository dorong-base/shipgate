// shipgate/cards.mjs: the card store. JSONL, append-friendly, human-diffable.
// Same entity shape the starter already ships in data/content-cards.example.jsonl:
// status · guardian score · evidence: approved ≠ shipped. We add the proof chain.
// Every mutation appends one history line. No silent runs (CLAUDE.md, iron law).

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function loadCards(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l));
}

export function saveCards(path, cards) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, cards.map(c => JSON.stringify(c)).join('\n') + '\n');
}

export function getCard(cards, id) {
  return cards.find(c => c.id === id) || null;
}

export function newCard(cards, { id, channel, topic, brief_path }) {
  if (getCard(cards, id)) throw new Error(`card ${id} already exists`);
  const card = {
    id, channel, topic,
    status: 'briefed',
    guardian_score: null,
    created: today(),
    evidence: null,
    brief: brief_path,
    history: [stamp(`briefed: ${brief_path}`)],
  };
  cards.push(card);
  return card;
}

export function logHistory(card, line) {
  card.history.push(stamp(line));
}

// The Visibility layer feeds on this (hooks/log-run.sh format). Refusals are
// logged too: a gate that fires silently is a gate nobody trusts.
export function logActivity(repoRoot, channel, topic, status) {
  const log = `${repoRoot}/activity-log.md`;
  if (!existsSync(log)) {
    writeFileSync(log,
      '# Activity Log\n\n> One line per run, written by the system. This file IS the Visibility layer: share it, don\'t screenshot it.\n\n| Date | Channel | Topic | Status |\n|---|---|---|---|\n');
  }
  appendFileSync(log, `| ${today()} | ${channel} | ${topic} | ${status} |\n`);
}

function today() { return new Date().toISOString().slice(0, 10); }
function stamp(line) { return `${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${line}`; }
