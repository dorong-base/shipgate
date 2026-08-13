#!/usr/bin/env node
// shipgate/hook-guard.mjs: PreToolUse hook. The Movement layer's smallest
// fail-closed unit: some files are the engine's to write, not the model's.
// Exit 2 blocks the tool call and hands the model the rule it broke.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkCanon } from './gates.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');

let input = '';
try { input = readFileSync(0, 'utf8'); } catch { process.exit(0); }
let filePath = '';
try { filePath = JSON.parse(input)?.tool_input?.file_path || ''; } catch { process.exit(0); }
const rel = filePath.replace(/\\/g, '/');

// 1. The card store and the manifest are engine-only.
if (/data\/cards\.jsonl$|shipgate\/upstream-manifest\.json$/.test(rel)) {
  console.error('REFUSED by shipgate: the engine is the only writer of ' + rel.split('/').slice(-2).join('/') +
    '. Cards change through gate crossings (shipgate/cli.mjs), never by hand: a number nobody typed is the whole point.');
  process.exit(2);
}

// 2. No canon, no content: drafts are blocked while the canon has placeholders.
if (/(^|\/)drafts\/.+\.md$/.test(rel)) {
  const files = {};
  for (const p of ['brand/voice-guide.md', 'brand/rules.md']) {
    if (existsSync(`${ROOT}/${p}`)) files[p] = readFileSync(`${ROOT}/${p}`, 'utf8');
  }
  const canon = checkCanon(files);
  if (!canon.ok) {
    console.error('REFUSED by shipgate (G2): ' + canon.refusals[0] +
      ': an empty canon produces generic AI content, which is the failure this repo exists to prevent.');
    process.exit(2);
  }
}
process.exit(0);
