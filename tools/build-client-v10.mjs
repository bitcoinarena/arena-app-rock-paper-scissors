// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 10 (the owner's playtest 2026-11-11, in Brave): version 9 with version 10's views and three changes around them.
// - THE HANDS ARE DRAWN: every emoji (the three hands, the steps, the trophy, the lock) is an inline SVG - a browser without an emoji font drew boxes.
//   The header's hands are drawn by the views too (window.RpsView.hands).
// - NOTHING CUT OFF ABOVE THE TITLE: the title's gradient was clipped to the text of the whole heading, the wiggling hands inside it too, and the
//   browser painted the hands' outlines at the heading's left edge, above "Rock" (a cut-off line of glyph tops). The gradient is on the title's
//   own words now, and the hands sit beside it.
// - WHAT A PAID ROUND COSTS: each round's stake is handed to the views (state.stake, from the row's stakeSats - or, from a page that does not pass
//   it, the lobby's own row of that round), kept per round, so the chip says "PAID · 100 sat", the line under the moves what a round costs and what a
//   draw gives back, and the result a draw's "90 of your 100 sat back (10 sat fees)".
// The round logic is version 9's otherwise, line for line. Written from client/index-v9.html with dist/rps-view-v10.js inlined in place of version 7's.
//
//   node tools/build-view.mjs && node tools/build-client-v10.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const V9 = new URL('../client/index-v9.html', import.meta.url);
const BUNDLE_V7 = new URL('../dist/rps-view-v7.js', import.meta.url);
const BUNDLE_V10 = new URL('../dist/rps-view-v10.js', import.meta.url);
const OUT = new URL('../client/index-v10.html', import.meta.url);

function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

export const CSS_V10 = `  /* VERSION 10: the gradient on the title's own words, the hands beside it (drawn); every icon 1em square, sized as its emoji was */
  h1 { background: none; animation: none; color: #e6edf3; display: flex; align-items: center; gap: 8px; }
  h1 .ttl { background: linear-gradient(90deg, #ffc93c, #ff3cac, #9d4edd, #2bd2ff, #3cff9e, #ffc93c); background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: shimmer 7s linear infinite; }
  h1 { min-width: 0; } h1 .ttl { white-space: nowrap; } header .chip { letter-spacing: 0.03em; }
  h1 .icons { margin-left: 0; display: inline-flex; gap: 1px; font-size: 16px; line-height: 1; }
  @media (max-width: 399px) { h1 .icons { display: none; } }
  svg.ico { width: 1em; height: 1em; display: inline-block; vertical-align: -0.15em; flex: none; }
  .moves button span svg.ico { display: block; margin: 0 auto; }
  .slot svg.ico { width: 0.8em; height: 0.8em; } .step b svg.ico { width: 0.95em; height: 0.95em; vertical-align: 0; }
  .cost { margin-top: 6px; text-align: center; color: #ffc93c; font: 600 12px/1.35 system-ui, -apple-system, sans-serif; }
`;

export function buildV10(v9, bundleV7, bundleV10) {
  let s = once(v9, bundleV7.trim(), bundleV10.trim());
  // THE TITLE'S OWN WORDS CARRY THE GRADIENT; THE HANDS ARE DRAWN BESIDE THEM
  s = once(s, '<header><h1>Rock Paper Scissors<span class="icons">✊✋✌️</span></h1>',
    '<header><h1><span class="ttl">Rock Paper Scissors</span><span class="icons" aria-label="Rock, paper, scissors"></span></h1>');
  s = once(s, '</style>\n</head>', CSS_V10 + '</style>\n</head>');
  s = once(s, "  const MOVES = [['Rock', '✊'], ['Paper', '✋'], ['Scissors', '✌️']];\n", "  const MOVES = [['Rock'], ['Paper'], ['Scissors']];\n");
  s = once(s, "  if (!A || !A.headToHead) {\n", "  if (window.RpsView.hands) window.RpsView.hands(document.querySelector('h1 .icons'));\n  if (!A || !A.headToHead) {\n");
  // EACH ROUND'S STAKE, KEPT FROM THE FIRST TIME ITS ROW IS SEEN (a closed round's row leaves the list)
  s = once(s, '    const paint = () => {\n      settleTap();\n      const rows = A.allRows ? A.allRows() : A.rows();\n',
    '    const paint = () => {\n      settleTap();\n      const rows = A.allRows ? A.allRows() : A.rows();\n'
    + '      // WHAT A PAID ROUND COSTS (version 10): its row\'s stakeSats, else the lobby\'s own row of it (a page that does not pass it), kept per round\n'
    + '      for (const r of rows) if (r && r.id && !stakes.has(r.id)) {\n'
    + '        let n = Number(r.stakeSats) || 0;\n'
    + '        if (!r.free && !(n > 0)) { const o = (A.rows ? A.rows() : []).filter((x) => x && !x.free); const x = o.find((y) => y.id === r.id) || o[0]; n = x ? Number(x.stakeSats) || Number((String(x.line || \'\').match(/stake (\\d+) sat/) || [])[1]) || 0 : 0; }\n'
    + '        stakes.set(r.id, { free: !!r.free, stake: !r.free && n > 0 ? n : null }); if (stakes.size > 256) stakes.delete(stakes.keys().next().value);\n'
    + '      }\n');
  s = once(s, '    const revealPaints = new Set();\n', '    const revealPaints = new Set();\n    const stakes = new Map();\n');
  s = once(s, "free: row ? !!row.free : true, them: Math.max(0, entries.length - 1) };",
    "free: row ? !!row.free : stakes.has(h.roundIdHex) ? stakes.get(h.roundIdHex).free : true, stake: (stakes.get(h.roundIdHex) || {}).stake || null, them: Math.max(0, entries.length - 1) };");
  s = once(s, "verdict: last.verdict || null, score: last.score || null } : null;",
    "verdict: last.verdict || null, score: last.score || null, free: last.free, stake: last.stake } : null;");
  s = once(s, "openMs: row.entryCloseMs - WINDOW_MS, free: !!row.free, joined: joinedOf(row.line) > 0,",
    "openMs: row.entryCloseMs - WINDOW_MS, free: !!row.free, stake: row.free ? null : (stakes.get(row.id) || {}).stake || null, joined: joinedOf(row.line) > 0,");
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV10(readFileSync(V9, 'utf8'), readFileSync(BUNDLE_V7, 'utf8'), readFileSync(BUNDLE_V10, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v10.html: ${out.length} bytes`);
}
