// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 9: version 8 with the match score read from the rounds before the newest. The score came only from the newest
// round this tab played; the seats' match record of a round comes some seconds after its result, and by then the player had tapped the next round -
// so the finished round's score was never read and the board fell away (measured on the live page with version 8). Now the round before the newest is
// read again until its match record is there, and the board takes the newest score any recent round of this tab holds. Views unchanged (version 7's).
//
//   node tools/build-client-v9.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const V8 = new URL('../client/index-v8.html', import.meta.url);
const OUT = new URL('../client/index-v9.html', import.meta.url);

function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

export function buildV9(v8) {
  let s = v8;
  // THE ROUND BEFORE THE NEWEST, READ AGAIN UNTIL ITS MATCH RECORD IS THERE
  s = once(s, "          seen.set(id, { held, reveals, at: Date.now() });\n        }\n",
    "          seen.set(id, { held, reveals, at: Date.now() });\n        }\n"
    + "        // THE ROUND BEFORE (version 9): its match record comes after its result - read again until it is there, within a minute of its close\n"
    + "        const mine = A.hiddenAll().filter((x) => Date.now() < Number(x.entryCloseMs) + 60000);\n"
    + "        const prev = mine.length > 1 ? mine[mine.length - 2] : null;\n"
    + "        if (prev && Date.now() >= Number(prev.entryCloseMs)) { const got = seen.get(prev.roundIdHex) || {};\n"
    + "          if (!(got.held && got.held.match)) { const held = await A.result(prev.roundIdHex); if (held) seen.set(prev.roundIdHex, { ...got, held, at: Date.now() }); } }\n");
  // THE BOARD FROM THE NEWEST SCORE ANY RECENT ROUND OF THIS TAB HOLDS
  s = once(s, "      if (last && last.score && (!kept || last.closeMs >= kept.closeMs)) kept = { ...last.score, closeMs: last.closeMs };\n",
    "      if (last && last.score && (!kept || last.closeMs >= kept.closeMs)) kept = { ...last.score, closeMs: last.closeMs };\n"
    + "      for (const x of A.hiddenAll().filter((y) => Date.now() < Number(y.entryCloseMs) + 120000)) {\n"
    + "        const m = ((seen.get(x.roundIdHex) || {}).held || {}).match, close = Number(x.entryCloseMs);\n"
    + "        if (!m || !m.byEntry || !m.byEntry[x.entryIdHex] || (kept && close < kept.closeMs)) continue;\n"
    + "        const mi = m.identities.indexOf(m.byEntry[x.entryIdHex]); if (mi < 0) continue;\n"
    + "        kept = { me: m.score[mi], them: m.score[1 - mi], themName: (m.names || [])[1 - mi] || 'them', themKey: m.identities[1 - mi], played: m.played, closeMs: close };\n"
    + "      }\n");
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV9(readFileSync(V8, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v9.html: ${out.length} bytes`);
}
