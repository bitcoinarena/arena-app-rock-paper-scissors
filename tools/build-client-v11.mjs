// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 11 (kanban #2864, the owner 2026-11-15: "8s runden und dann 5-10s aufdecken"): version 10 with the result shown
// from the open moves as soon as both are revealed, and "signed" added when the seats' signed result arrives - never shown as signed before it is.
// - THE RESULT FROM THE OPEN MOVES: once this tab's move and the opponent's are both revealed (the seats serve them after the close + hold), the
//   verdict is the rules' (paper beats rock, scissors beat paper, rock beats scissors) and shown at the end of the reveal ring, marked provisional.
// - SIGNED LATER: a line under the table says "From the open moves - the seats are signing" until the seats' signed result is held, then "Signed by
//   the seats"; a signed verdict that differs (a reveal the seats did not count) replaces the shown one and its banner.
// The round logic is version 10's otherwise, line for line. Written from client/index-v10.html.
//
//   node tools/build-client-v11.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const V10 = new URL('../client/index-v10.html', import.meta.url);
const OUT = new URL('../client/index-v11.html', import.meta.url);
function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}
let s = readFileSync(V10, 'utf8');
s = once(s, "          last.verdict = me && me.outcome && me.signedBy > 0 && !me.provisional\n",
  "          // VERSION 11: the seats' signed verdict, else the rules' over both open moves (provisional) - kanban #2864\n          last.verdict = me && me.outcome && me.signedBy > 0 && !me.provisional\n");
s = once(s, "          last.revealEndMs = closeMs + REVEAL_MS;",
  "          last.signed = !!last.verdict; last.provisional = false;\n"
  + "          if (!last.verdict && all[h.entryIdHex] !== undefined && last.theirs !== null && last.theirs !== undefined && Number.isInteger(Number(last.theirs)) && Number.isInteger(Number(h.move))) {\n"
  + "            const a = Number(h.move), b = Number(last.theirs); last.verdict = a === b ? 'draw' : (a - b + 3) % 3 === 1 ? 'win' : 'loss'; last.provisional = true; }\n"
  + "          last.revealEndMs = closeMs + REVEAL_MS;");
s = once(s, "          if (last.verdict && bannerFor !== h.roundIdHex && Date.now() - closeMs < 60000) {\n            bannerFor = h.roundIdHex;\n",
  "          if (last.verdict && (bannerFor !== h.roundIdHex || bannerVerdict !== last.verdict) && Date.now() - closeMs < 60000) {\n            bannerFor = h.roundIdHex; bannerVerdict = last.verdict;\n");
s = once(s, "let bannerFor = null;", "let bannerFor = null;\n    let bannerVerdict = null;   // version 11: the verdict the banner showed (a signed one that differs shows again)");
s = once(s, "      const key = JSON.stringify(state);\n",
  "      // VERSION 11: provisional or signed, said under the table while a result is shown\n"
  + "      { let el = document.getElementById('rps-signed'); if (!el) { el = document.createElement('div'); el.id = 'rps-signed'; el.setAttribute('role', 'status');\n"
  + "          el.style.cssText = 'position:fixed;left:0;right:0;bottom:10px;text-align:center;font:600 12px/1.4 system-ui,-apple-system,sans-serif;color:#8b95a5;pointer-events:none;z-index:5'; document.body.appendChild(el); }\n"
  + "        const t = last && last.phase === 'result' ? (last.provisional ? 'From the open moves \\u00b7 the seats are signing' : 'Signed by the seats') : '';\n"
  + "        if (el.textContent !== t) el.textContent = t; el.style.color = last && last.phase === 'result' && !last.provisional ? '#2fd38a' : '#8b95a5'; }\n"
  + "      const key = JSON.stringify(state);\n");
writeFileSync(OUT, s);
console.log(`client/index-v11.html written (${s.length} bytes)`);
