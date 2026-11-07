// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 6: version 5 with a reveal phase: the result stands when the countdown reaches
// 0:00, and after the entry close the round shows a visible reveal moment before the next round counts.
//   - After its entry close the round stays on the screen: both cards turn and a ring counts the reveal down (REVEAL_MS).
//   - Its result is the seats' own: an entry counts only signed and never provisional (the page's early guess from the two open moves), and it is
//     shown at the reveal's 0:00 - held until then if it came sooner, said to be waiting if it comes later. The table keeps it RESULT_HOLD_MS.
//   - Only then does the next round count; its pick opens.
// Written from client/index-v5.html, version 6's views (dist/rps-view-v6.js) inlined in place of version 5's; the file's hash is version 6's pin.
//
//   node tools/build-client-v6.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const V5 = new URL('../client/index-v5.html', import.meta.url);
const BUNDLE_V5 = new URL('../dist/rps-view-v5.js', import.meta.url);
const BUNDLE_V6 = new URL('../dist/rps-view-v6.js', import.meta.url);
const OUT = new URL('../client/index-v6.html', import.meta.url);

/** Exactly once, or the build stops: a marker version 5 no longer holds would leave version 6 half made. */
function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

export function buildV6(v5, bundleV5, bundleV6) {
  let s = v5;
  s = once(s, bundleV5.trim(), bundleV6.trim());
  // THE REVEAL'S LENGTH AND THE RESULT'S HOLD
  s = once(s, '    const CLOSING_MS = 1500;\n', '    const CLOSING_MS = 1500;\n    // THE REVEAL (version 6): the ring after the close, and how long the table keeps the result before the next round\n    const REVEAL_MS = 5000, RESULT_HOLD_MS = 2500;\n');
  // ONLY THE SEATS' OWN RESULT: signed and never provisional
  s = once(s, '          last.verdict = me && me.outcome && me.signedBy > 0\n',
    '          last.verdict = me && me.outcome && me.signedBy > 0 && !me.provisional\n');
  // HELD TO THE REVEAL'S 0:00
  s = once(s, "          last.phase = last.verdict ? 'result' : 'reveal';\n          if (last.verdict && bannerFor !== h.roundIdHex && Date.now() - closeMs < 60000) {",
    "          last.revealEndMs = closeMs + REVEAL_MS; last.revealing = Date.now() < last.revealEndMs;\n          if (last.revealing) last.verdict = null;\n          last.phase = last.verdict ? 'result' : 'reveal';\n          if (last.verdict && bannerFor !== h.roundIdHex && Date.now() - closeMs < 60000) {");
  // THE CLOSED ROUND STAYS ON THE TABLE through its reveal and its result's hold; only then the next round counts
  s = once(s, "      if (waiting) { lookHere(last.id); state = { ...last, phase: 'wait', openMs: last.closeMs - WINDOW_MS, scoreboard, here: hereAt(last.id) }; }\n      else {",
    "      const revealOn = last && (last.phase === 'reveal' || last.phase === 'result') && Date.now() >= last.closeMs\n        && (last.revealing || !last.verdict ? Date.now() - last.closeMs < 60000 : Date.now() < last.revealEndMs + RESULT_HOLD_MS);\n      if (waiting) { lookHere(last.id); state = { ...last, phase: 'wait', openMs: last.closeMs - WINDOW_MS, scoreboard, here: hereAt(last.id) }; }\n      else if (revealOn) state = { ...last, scoreboard, here: hereAt(last.id) };\n      else {");
  // A PAINT AT THE REVEAL'S 0:00 AND AT THE HOLD'S END, as at the close
  s = once(s, "      if (at && at !== switchAt && at > Date.now()) { switchAt = at; clearTimeout(switchTimer); switchTimer = setTimeout(paint, at - Date.now() + 20); }\n",
    "      if (at && at !== switchAt && at > Date.now()) { switchAt = at; clearTimeout(switchTimer); switchTimer = setTimeout(paint, at - Date.now() + 20); }\n      for (const t of state.revealEndMs ? [state.revealEndMs, state.revealEndMs + RESULT_HOLD_MS] : []) if (t > Date.now() && !revealPaints.has(t)) { revealPaints.add(t); setTimeout(paint, t - Date.now() + 20); }\n");
  s = once(s, '    let switchAt = null, switchTimer = null;\n', '    let switchAt = null, switchTimer = null;\n    const revealPaints = new Set();\n');
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV6(readFileSync(V5, 'utf8'), readFileSync(BUNDLE_V5, 'utf8'), readFileSync(BUNDLE_V6, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v6.html: ${out.length} bytes`);
}
