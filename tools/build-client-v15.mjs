// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 15: version 14 whose line "From the open moves · the seats are signing" / "Signed by the seats" has a
// row of its own at the foot of the page (bitcoin-arena kanban #3564, feedback #423). Versions 11 to 14 fixed it 10 px above the bottom
// of the window, where the pick panel's cost line ("100 sat a round, from your balance · a draw gives 90 back") also ends: the two were
// drawn over each other at every window size (Chrome, 1920x1000: cost 966.8-983 px, the line 973.2-990 px).
// - THE LINE IS A ROW: a child of the page's column below the game, 17 px high even while it is empty, so the page does not move when a
//   result shows.
// Written from client/index-v14.html.
//
//   node tools/build-client-v15.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { FORBIDDEN } from './build-client-v4.mjs';

const V14 = new URL('../client/index-v14.html', import.meta.url);
const OUT = new URL('../client/index-v15.html', import.meta.url);

function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

const SIGNED_V14 = "      { let el = document.getElementById('rps-signed'); if (!el) { el = document.createElement('div'); el.id = 'rps-signed'; el.setAttribute('role', 'status');\n"
  + "          el.style.cssText = 'position:fixed;left:0;right:0;bottom:10px;text-align:center;font:600 12px/1.4 system-ui,-apple-system,sans-serif;color:#8b95a5;pointer-events:none;z-index:5'; document.body.appendChild(el); }\n";
const SIGNED_V15 = "      // VERSION 15: the line is a row of its own below the game, never laid over the cost line at the foot of the pick panel\n"
  + "      { let el = document.getElementById('rps-signed'); if (!el) { el = document.createElement('div'); el.id = 'rps-signed'; el.setAttribute('role', 'status');\n"
  + "          el.style.cssText = 'flex:none;min-height:17px;margin-top:4px;text-align:center;font:600 12px/1.4 system-ui,-apple-system,sans-serif;color:#8b95a5;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; document.body.appendChild(el); }\n";

export function buildV15(v14) {
  return once(v14, SIGNED_V14, SIGNED_V15);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV15(readFileSync(V14, 'utf8'));
  const left = out.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l));
  if (left.length) throw new Error(`still in the file: ${left.slice(0, 5).map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`).join(' | ')}`);
  writeFileSync(OUT, out);
  console.log(`client/index-v15.html written (${out.length} bytes)`);
}
