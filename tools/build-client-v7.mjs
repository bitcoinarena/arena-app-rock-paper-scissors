// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 7 (kanban #1361, the owner's playtest 2026-11-08): version 6 with version 7's views - one countdown, and only
// while a move is missing (the pick, and the wait for the opponent's move); none once both moves are in, through the reveal, its animation and
// the result; and the match's opponent kept at the table between two rounds ("You are playing against <name>", never "You are alone").
// The round logic is version 6's line for line. Written from client/index-v6.html with dist/rps-view-v7.js inlined in place of version 6's.
//
//   node tools/build-view.mjs && node tools/build-client-v7.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const V6 = new URL('../client/index-v6.html', import.meta.url);
const BUNDLE_V6 = new URL('../dist/rps-view-v6.js', import.meta.url);
const BUNDLE_V7 = new URL('../dist/rps-view-v7.js', import.meta.url);
const OUT = new URL('../client/index-v7.html', import.meta.url);

function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

export function buildV7(v6, bundleV6, bundleV7) {
  return once(v6, bundleV6.trim(), bundleV7.trim());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV7(readFileSync(V6, 'utf8'), readFileSync(BUNDLE_V6, 'utf8'), readFileSync(BUNDLE_V7, 'utf8'));
  writeFileSync(OUT, out);
  console.log(`client/index-v7.html: ${out.length} bytes`);
}
