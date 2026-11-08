// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 8: version 7 with the result held from the moment it arrives. Version 6 and 7 kept the result on the table
// until the reveal's end + RESULT_HOLD_MS (7.5 s after the close); a result the seats signed later than that - about 10 s after the close,
// measured on the live page - was never shown as the result: the table went from the reveal straight to the next pick. Now the result stays
// RESULT_HOLD_MS from the moment this tab first held it (and never before the reveal's end). Views unchanged (version 7's bundle).
//
//   node tools/build-client-v8.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const V7 = new URL('../client/index-v7.html', import.meta.url);
const OUT = new URL('../client/index-v8.html', import.meta.url);

function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

export function buildV8(v7) {
  let s = v7;
  // WHEN EACH ROUND'S RESULT WAS FIRST HELD HERE
  s = once(s, '    const seen = new Map();\n', '    const seen = new Map();\n    // THE RESULT HELD FROM ITS ARRIVAL (version 8): round id -> when this tab first held its signed result\n    const verdictAt = new Map();\n');
  s = once(s, "          if (last.verdict && bannerFor !== h.roundIdHex && Date.now() - closeMs < 60000) {",
    "          if (last.verdict && !verdictAt.has(h.roundIdHex)) { verdictAt.set(h.roundIdHex, Date.now()); if (verdictAt.size > 64) verdictAt.delete(verdictAt.keys().next().value); }\n          last.resultUntil = last.verdict ? Math.max(last.revealEndMs, verdictAt.get(h.roundIdHex)) + RESULT_HOLD_MS : null;\n          if (last.verdict && bannerFor !== h.roundIdHex && Date.now() - closeMs < 60000) {");
  s = once(s, ': Date.now() < last.revealEndMs + RESULT_HOLD_MS);', ': Date.now() < last.resultUntil);');
  // A PAINT WHEN THE HOLD ENDS, as at the reveal's end
  s = once(s, "      for (const t of state.revealEndMs ? [state.revealEndMs, state.revealEndMs + RESULT_HOLD_MS] : [])",
    "      for (const t of state.revealEndMs ? [state.revealEndMs, state.revealEndMs + RESULT_HOLD_MS, ...(state.resultUntil ? [state.resultUntil] : [])] : [])");
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV8(readFileSync(V7, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v8.html: ${out.length} bytes`);
}
