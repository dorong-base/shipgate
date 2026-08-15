// shipgate/gates.mjs: the six gates. Each one enforces, in code, a sentence
// this repo already says in prose. The gate refuses; it does not advise.
//
//   G1  "a router that refuses to write without a brief"          (README ¶1)
//   G2  "a writer that can't start before reading your voice guide" (README ¶1, empty canon)
//   G3  "a guardian that blocks anything below 9/10"               (README ¶1)
//   G4  "No invented facts. Unverifiable claim = cut it"           (CLAUDE.md, iron law)
//   G5  "approved ≠ shipped"                                        (README, data/ entity shape)
//   G6  "carry one real measurement"                                (the loop's far end)
//
// Zero dependencies. Node stdlib only. Runs identically in CLI, tests and browser.

// Windows checkouts materialize CRLF; every text entry point normalizes to LF,
// because a line ending is not a semantic difference.
const lf = (s) => String(s).replace(/\r\n/g, '\n');

const BRIEF_FIELDS = ['channel', 'topic', 'audience', 'message', 'cta'];

// ---------- brief parsing (G1) ----------

export function parseBrief(text) {
  text = lf(text);
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { error: 'no frontmatter block (--- ... ---) found' };
  const lines = m[1].split('\n');
  const brief = { proof_points: [] };
  let inPoints = false;
  let point = null;
  for (const raw of lines) {
    if (/^proof_points\s*:/.test(raw)) { inPoints = true; continue; }
    if (inPoints && /^\s+-\s/.test(raw)) {
      if (point) brief.proof_points.push(point);
      point = {};
      const kv = raw.replace(/^\s+-\s*/, '');
      const p = kv.match(/^(\w+)\s*:\s*(.*)$/);
      if (p) point[p[1]] = unquote(p[2]);
      continue;
    }
    if (inPoints && /^\s+\w+\s*:/.test(raw)) {
      const p = raw.trim().match(/^(\w+)\s*:\s*(.*)$/);
      if (p && point) point[p[1]] = unquote(p[2]);
      continue;
    }
    const kv = raw.match(/^(\w+)\s*:\s*(.*)$/);
    if (kv) { inPoints = false; brief[kv[1]] = unquote(kv[2]); }
  }
  if (point) brief.proof_points.push(point);
  return brief;
}

function unquote(s) { return s.replace(/^["']|["']$/g, '').trim(); }

// G1: No brief, no draft.
export function checkBrief(brief) {
  const refusals = [];
  if (brief.error) refusals.push(`G1: ${brief.error}`);
  for (const f of BRIEF_FIELDS) {
    if (!brief[f] || !String(brief[f]).trim()) {
      refusals.push(`G1: brief field "${f}" is missing or empty: a missing answer is a question, not a guess`);
    }
  }
  if (!brief.proof_points || brief.proof_points.length === 0) {
    refusals.push('G1: no proof points: every factual claim in the draft will need one (no source, no point)');
  } else {
    for (const p of brief.proof_points) {
      if (!p.id || !/^P\d+$/.test(p.id)) refusals.push(`G1: proof point missing a valid id (P1, P2, ...): ${JSON.stringify(p)}`);
      if (!p.claim) refusals.push(`G1: proof point ${p.id || '?'} has no claim`);
      if (!p.source || !String(p.source).trim()) refusals.push(`G1: proof point ${p.id || '?'} has no source: no source, no point`);
    }
  }
  return { gate: 'G1', ok: refusals.length === 0, refusals };
}

// ---------- canon check (G2) ----------

// G2: No canon, no content. An empty canon produces generic AI content,
// which is the failure this whole repo exists to prevent (CLAUDE.md, startup).
export function checkCanon(files, { visual = false } = {}) {
  const refusals = [];
  const required = ['brand/voice-guide.md', 'brand/rules.md'];
  if (visual) required.push('brand/DESIGN.md');
  for (const path of required) {
    const raw = files[path];
    if (raw == null) { refusals.push(`G2: ${path} is missing`); continue; }
    const content = lf(raw).replace(/```[\s\S]*?```/g, ''); // format examples are not placeholders
    // Placeholder = [bracketed text] that is not a markdown link, or CHANGE_ME.
    const brackets = [...content.matchAll(/\[([^\]\n]{1,80})\]/g)]
      .filter(x => {
        const after = content.slice(x.index + x[0].length, x.index + x[0].length + 1);
        return after !== '(';                       // exclude markdown links [text](url)
      })
      .filter(x => !/^(P\d+|no-claim|x| )$/i.test(x[1]));
    for (const b of brackets) refusals.push(`G2: ${path} still contains placeholder "[${b[1]}]"`);
    for (const c of content.matchAll(/CHANGE_ME/g)) refusals.push(`G2: ${path} still contains CHANGE_ME`);
  }
  return { gate: 'G2', ok: refusals.length === 0, refusals };
}

// ---------- guardian verdict (G3) ----------

// G3: No verdict, no approval. Parses the EXACT verdict block the existing
// agents/brand-guardian.md already promises to end with. We read its format;
// we never touch its file.
export function parseVerdict(text) {
  text = lf(text);
  const m = text.match(/Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10\s*[—–-]+\s*\[?\s*(approved|fixed-and-approved|rejected)\s*\]?/i);
  const failed = text.match(/Failed rules:\s*(.+)/i);
  if (!m) return { gate: 'G3', ok: false, refusals: ['G3: no verdict block found: the guardian must end with "Score: X/10 — [status]"'] };
  const score = parseFloat(m[1]);
  const status = m[2].toLowerCase();
  const refusals = [];
  if (!failed) refusals.push('G3: verdict has no "Failed rules:" line: "rule 3" without the offending sentence is not a finding');
  if (status === 'rejected') refusals.push(`G3: guardian rejected (score ${score}): one revision round, then escalate; never approve a rejection`);
  if (score < 9) refusals.push(`G3: score ${score} is below 9: nothing releases below 9 (README ¶1)`);
  return { gate: 'G3', ok: refusals.length === 0, refusals, score, status, failed_rules: failed ? failed[1].trim() : null };
}

// ---------- grounding (G4) ----------

// G4: Every number in the draft must carry its own [P#] marker resolving to a
// proof point with a source in the brief (sdd-kit's hard rule 12, transplanted).
// Markers attach positionally: a marker covers the numbers before it, back to
// the previous marker or waiver. A [no-claim: reason] waives the numbers before
// it; waived numbers are counted and shown, and never enter the sourced count.
// One marker cannot bless a whole paragraph; every number earns its own coverage.
export function checkGrounding(draft, brief) {
  const ids = new Set((brief.proof_points || []).map(p => p.id));
  const refusals = [];
  let claims = 0, grounded = 0, waived = 0;

  const cleaned = lf(draft)
    .replace(/```[\s\S]*?```/g, '')                 // code blocks are not claims
    .replace(/https?:\/\/\S+/g, '')                  // URLs are addresses, not claims
    .replace(/\]\([^)]*\)/g, ']');                   // markdown link targets

  for (const para of cleaned.split(/\n{2,}/)) {
    const events = [...para.matchAll(/(?<![\w/-])\$?\d[\d,.]*%?|\[(P\d+)\]|\[no-claim:[^\]]+\]/g)];
    let pending = [];
    for (const ev of events) {
      if (ev[1]) {                                   // a [P#] marker
        if (!ids.has(ev[1])) {
          refusals.push(`G4: marker [${ev[1]}] does not resolve to any proof point in the brief`);
          claims += pending.length; pending = [];
        } else {
          claims += pending.length; grounded += pending.length; pending = [];
        }
      } else if (ev[0].startsWith('[no-claim:')) {   // an explicit waiver
        waived += pending.length; pending = [];
      } else {
        pending.push(ev[0]);                          // a numeric claim awaiting coverage
      }
    }
    if (pending.length) {
      claims += pending.length;
      refusals.push(`G4: ungrounded number${pending.length > 1 ? 's' : ''} ${pending.map(t => `"${t}"`).join(', ')}: add a [P#] marker after each claim or waive it with [no-claim: reason] (no source = cut, don't soften)`);
    }
  }
  return { gate: 'G4', ok: refusals.length === 0, refusals, claims, grounded, waived };
}

// ---------- GO / NO-GO (final adversarial gate) ----------

export function parseGoNoGo(text) {
  text = lf(text);
  const m = text.match(/Verdict:\s*(GO|NO-GO)\b/i);
  if (!m) return { ok: false, refusals: ['GO/NO-GO: no "Verdict: GO" or "Verdict: NO-GO" line found'] };
  const go = m[1].toUpperCase() === 'GO';
  return { ok: go, refusals: go ? [] : ['GO/NO-GO: verdict is NO-GO: each failed gate is reported with evidence, never softened'], verdict: m[1].toUpperCase() };
}

// ---------- state machine (G5, G6 live in the transitions) ----------

export const STATES = ['briefed', 'drafted', 'gated', 'go', 'shipped', 'measured'];

export function transition(card, to, ctx = {}) {
  const from = card.status;
  const fromIdx = STATES.indexOf(from);
  const toIdx = STATES.indexOf(to);
  const refuse = (r) => ({ ok: false, refusals: Array.isArray(r) ? r : [r] });

  if (toIdx === -1) return refuse(`unknown state "${to}"`);
  if (toIdx !== fromIdx + 1) {
    return refuse(`state gate: ${from} → ${to} skips ${STATES.slice(fromIdx + 1, toIdx).join(' → ') || 'backwards'}: every transition passes its gate, none are skipped`);
  }
  switch (to) {
    case 'drafted': {
      if (!ctx.briefCheck?.ok) return refuse(ctx.briefCheck?.refusals || ['G1: no brief check supplied: no brief, no draft']);
      break;
    }
    case 'gated': {
      if (!ctx.verdict?.ok) return refuse(ctx.verdict?.refusals || ['G3: no guardian verdict recorded: approval is the gate\'s job, not the human\'s first read']);
      card.guardian_score = ctx.verdict.score;
      card.verdict = { score: ctx.verdict.score, status: ctx.verdict.status, failed_rules: ctx.verdict.failed_rules };
      break;
    }
    case 'go': {
      if (!ctx.grounding?.ok) return refuse(ctx.grounding?.refusals || ['G4: no grounding check recorded']);
      if (!ctx.gonogo?.ok) return refuse(ctx.gonogo?.refusals || ['GO/NO-GO: no adversarial verdict recorded: the final sign-off is never the checker grading its own work']);
      card.grounding = { claims: ctx.grounding.claims, grounded: ctx.grounding.grounded, waived: ctx.grounding.waived || 0 };
      break;
    }
    case 'shipped': {
      if (!ctx.evidence || !/^https?:\/\/\S+$/.test(ctx.evidence)) {
        return refuse('G5: no evidence URL: approved ≠ shipped; a card without evidence never claims it went out');
      }
      card.evidence = ctx.evidence;
      break;
    }
    case 'measured': {
      const m = ctx.measurement;
      const missing = [];
      if (!m || !Number.isFinite(Number(m.value))) missing.push('value');
      if (!m?.unit) missing.push('unit');
      if (!m?.source) missing.push('source (screenshot / export / API response)');
      if (!m?.recorded_by) missing.push('recorded_by');
      if (missing.length) return refuse(`G6: measurement missing ${missing.join(', ')}: zero is an answer; unknown isn't. shipped ≠ done`);
      card.measurement = { value: Number(m.value), unit: m.unit, source: m.source, recorded_by: m.recorded_by, at: m.at || new Date().toISOString() };
      break;
    }
  }
  card.status = to;
  return { ok: true, refusals: [] };
}

// ---------- the one number ----------

// Grounding rate: of the claims we published, how many carry a cited source.
// Legacy cards (shipped before shipgate, no proof chain) are named, not hidden.
export function groundingStats(cards) {
  let claims = 0, grounded = 0, waived = 0, unverifiable = 0;
  for (const c of cards) {
    if (!['shipped', 'measured'].includes(c.status)) continue;
    if (c.grounding) { claims += c.grounding.claims; grounded += c.grounding.grounded; waived += c.grounding.waived || 0; }
    else unverifiable++;
  }
  return {
    claims, grounded, waived, unverifiable,
    rate: claims === 0 ? null : grounded / claims,
    headline: (claims === 0
      ? 'no gated claims published yet'
      : `${grounded} of ${claims} published claims carry a cited source`) +
      (waived ? ` (${waived} waived: counted, shown, never sourced)` : '') +
      (unverifiable ? ` (${unverifiable} legacy card${unverifiable > 1 ? 's' : ''} shipped with no proof chain: named, not counted)` : ''),
  };
}
