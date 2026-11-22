// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 13: version 12 that asks the seats far less often, nothing else.
// - HOW MANY ARE IN A ROUND: version 12 asked the first seat of every round near the clock (three to five of them) every second for its
//   players - most of a tab's GET /api/round-result, about 45 % of them answered 404. Now only the round on screen and the one shown
//   before it, a round at most every 4 s; a round its seat has nothing for (404, no answer) again after 3 s, 6 s, then every 10 s; never
//   again once both players are in, or 10 s after its close; one ask per round at a time. The tab's own round is counted from the page's
//   result, which the client reads anyway. A tap still reads its slot once, at once (the table it seats the player at).
// - THE TAB'S OWN ROUND: version 12 read the page's result every second, for two minutes after the close. Now at most every 3 s (one that
//   has nothing yet: after 3 s, 6 s, then 10 s), and at once after the close and before the reveal ring ends; never again once the result
//   is signed by the seats with both moves open, nor a minute after the close.
// Written from client/index-v12.html.
//
//   node tools/build-client-v13.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { FORBIDDEN } from './build-client-v4.mjs';

const V12 = new URL('../client/index-v12.html', import.meta.url);
const OUT = new URL('../client/index-v13.html', import.meta.url);
function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

const COUNT_V12 = `    const liveCount = (ids, timeoutMs = 2000) => Promise.all(ids.map(async (id) => {
      const n = seatsOf(id)[0];
      if (!n) return;
      try {
        const r = await fetch(String(n).replace(/\\/+$/, '') + '/api/round-result?round=' + id, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
        if (r.ok) { const j = await r.json(); liveSeat.set(id, (j.players || []).length); }
      } catch {  }
    }));
`;
const COUNT_V13 = `    // VERSION 13: HOW MANY ARE IN A ROUND, ASKED SPARINGLY - only the rounds asked for (the one on screen and the one shown before it), a round
    // at most every 4 s; a round its seat has nothing for (404, no answer) again after 3 s, 6 s, then every 10 s; never again once every player
    // is in; one ask per round at a time (a call while it is out waits for it). \`force\` (a tap) asks at once unless one is out or all are in
    const COUNT_EVERY_MS = 4000, BACKOFF_MS = [3000, 6000, 10000], COUNT_AFTER_CLOSE_MS = 10000;
    const backoff = (misses) => BACKOFF_MS[Math.min(misses, BACKOFF_MS.length) - 1];
    const counts = new Map();
    let shownIds = [];
    const liveCount = (ids, timeoutMs = 2000, force = false) => Promise.all(ids.map(async (id) => {
      let c = counts.get(id);
      if (c && c.pending) return c.pending;
      if (c && (c.done || (!force && Date.now() < c.until))) return;
      const n = seatsOf(id)[0];
      if (!n) return;
      if (!c) { c = { pending: null, until: 0, misses: 0, done: false }; counts.set(id, c); if (counts.size > 256) counts.delete(counts.keys().next().value); }
      c.pending = (async () => {
        let got = null;
        try {
          const r = await fetch(String(n).replace(/\\/+$/, '') + '/api/round-result?round=' + id, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
          if (r.ok) { const j = await r.json(); got = (j.players || []).length; }
        } catch {  }
        if (got === null) { c.misses += 1; c.until = Date.now() + backoff(c.misses); }
        else { c.misses = 0; c.until = Date.now() + COUNT_EVERY_MS; liveSeat.set(id, got); if (got >= ((A.headToHead && A.headToHead.players) || 2)) c.done = true; }
        c.pending = null;
      })();
      return c.pending;
    }));
`;

const REFRESH_V12 = `        const near = (A.allRows ? A.allRows() : A.rows()).filter((r) => r.entryCloseMs && r.entryCloseMs > Date.now() - WINDOW_MS && r.entryCloseMs <= Date.now() + 2 * WINDOW_MS + CLOSING_MS);
        await liveCount(near.map((r) => r.id));
        const h = lastHidden();
        if (h) {
          const id = h.roundIdHex, players = (A.headToHead && A.headToHead.players) || 2;
          const held = await A.result(id);
`;
const REFRESH_V13 = `        // VERSION 13: only the round on screen and the one shown before it are counted, while open or just closed - not the tab's own (its result says it)
        const closeOf = new Map((A.allRows ? A.allRows() : A.rows()).map((r) => [r.id, Number(r.entryCloseMs) || 0]));
        await liveCount(shownIds.filter((id) => closeOf.get(id) > Date.now() - COUNT_AFTER_CLOSE_MS && !A.hidden(id)));
        const h = lastHidden();
        if (h && due(h.roundIdHex)) {
          const id = h.roundIdHex, players = (A.headToHead && A.headToHead.players) || 2;
          const held = await A.result(id);
`;
const SEEN_V12 = `          seen.set(id, { held, reveals, at: Date.now() });
        }
`;
const SEEN_V13 = `          seen.set(id, { held, reveals, at: Date.now() });
          if (held && held.entries) liveSeat.set(id, held.entries.length);
          read(id, Number(h.entryCloseMs), !!(held && held.entries && held.entries.length), settled(held, reveals, players));
        }
`;
const PREV_V12 = `        if (prev && Date.now() >= Number(prev.entryCloseMs)) { const got = seen.get(prev.roundIdHex) || {};
          if (!(got.held && got.held.match)) { const held = await A.result(prev.roundIdHex); if (held) seen.set(prev.roundIdHex, { ...got, held, at: Date.now() }); } }
`;
const PREV_V13 = `        if (prev && Date.now() >= Number(prev.entryCloseMs) && due(prev.roundIdHex)) { const got = seen.get(prev.roundIdHex) || {};
          if (!(got.held && got.held.match)) { const held = await A.result(prev.roundIdHex); if (held) seen.set(prev.roundIdHex, { ...got, held, at: Date.now() });
            read(prev.roundIdHex, Number(prev.entryCloseMs), !!(held && held.entries && held.entries.length), !!(held && held.match)); } }
`;
const READS_V13 = `    // VERSION 13: THE TAB'S OWN ROUNDS READ SPARINGLY - the page's result at most every 3 s (one that has nothing yet: after 3 s, 6 s, then
    // 10 s), and at once after the close and before the reveal ring ends; never again once it is settled (every entry signed by the seats, both
    // moves open, the match record there) or a minute after the close
    const RESULT_EVERY_MS = 3000;
    const reads = new Map();   // round -> { next, misses, stop }
    const due = (id) => { const r = reads.get(id); return !r || (!r.stop && Date.now() >= r.next); };
    const read = (id, closeMs, got, stop) => {
      const now = Date.now(), r = reads.get(id) || { next: 0, misses: 0, stop: false };
      r.misses = got ? 0 : r.misses + 1;
      let next = now + (got ? RESULT_EVERY_MS : backoff(r.misses));
      for (const t of [closeMs + 250, closeMs + REVEAL_MS - 500]) if (t > now && t < next) next = t;
      r.next = next; r.stop = !!stop || now > closeMs + 60000;
      reads.delete(id); reads.set(id, r); if (reads.size > 128) reads.delete(reads.keys().next().value);
    };
    const settled = (held, reveals, players) => !!held && !!held.entries && held.entries.length > 0
      && held.entries.every((e) => e.outcome && Number(e.signedBy) > 0 && !e.provisional)
      && (held.entries.length < players || (!!held.match && Object.keys(reveals || {}).length >= players));
    const refresh = async () => {
`;

export function buildV13(v12) {
  let s = v12;
  s = once(s, COUNT_V12, COUNT_V13);
  s = once(s, '    const refresh = async () => {\n', READS_V13);
  s = once(s, REFRESH_V12, REFRESH_V13);
  s = once(s, SEEN_V12, SEEN_V13);
  s = once(s, PREV_V12, PREV_V13);
  // a tap reads its slot once, at once
  s = once(s, '      await liveCount(sameSlot.map((r) => r.id), 400);\n', '      await liveCount(sameSlot.map((r) => r.id), 400, true);\n');
  // the round on screen and the one shown before it: the rounds counted
  s = once(s, '      const key = JSON.stringify(state);\n',
    '      // VERSION 13: the round on screen, and the one shown before it, are the rounds counted\n'
    + "      if ((state.phase === 'pick' || state.phase === 'wait') && state.id && state.id !== shownIds[0]) shownIds = [state.id, ...shownIds.slice(0, 1)];\n"
    + '      const key = JSON.stringify(state);\n');
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV13(readFileSync(V12, 'utf8'));
  const left = out.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l));
  if (left.length) throw new Error(`still in the file: ${left.slice(0, 5).map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`).join(' | ')}`);
  writeFileSync(OUT, out);
  console.log(`client/index-v13.html written (${out.length} bytes)`);
}
