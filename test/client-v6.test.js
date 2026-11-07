// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 6'S CLIENT: version 5's with the reveal phase. The file in the tree is what its tool writes from version 5 and the views' bundle; outside
// the reveal its round logic is version 5's line for line; a provisional entry never decides; the result waits for the reveal's 0:00; the closed
// round stays on the table through the reveal and the result's hold; nothing in it names a person, a ticket or the old project.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildV6 } from '../tools/build-client-v6.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V5 = readFileSync(new URL('../client/index-v5.html', import.meta.url), 'utf8');
const V6 = readFileSync(new URL('../client/index-v6.html', import.meta.url), 'utf8');
const B5 = new URL('../dist/rps-view-v5.js', import.meta.url), B6 = new URL('../dist/rps-view-v6.js', import.meta.url);
const part = (s, from, to) => { const a = s.indexOf(from); const b = s.indexOf(to, a); assert.ok(a > 0 && b > a, `${from} ... ${to}`); return s.slice(a, b); };

test('the file is what the tool writes (when the views are built here)', { skip: !(existsSync(B5) && existsSync(B6)) && 'tools/build-view.mjs not run' }, () => {
  assert.equal(buildV6(V5, readFileSync(B5, 'utf8'), readFileSync(B6, 'utf8')), V6, 'client/index-v6.html is out of date: run tools/build-client-v6.mjs');
});

test('outside the reveal the round logic is version 5\'s line for line: the seating, the reads, the taps', () => {
  for (const [from, to] of [['function seatAt(', '// SEATING END'], ['const refresh = async () => {', 'const TAPS = window.RPS_TAPS'],
    ['const settleTap = () => {', '    let touching = 0;'], ['const tap = async (id, i, closeMs) => {', '    const settleTap = () => {']])
    assert.equal(part(V6, from, to), part(V5, from, to), from);
});

test('the reveal: only a signed, never provisional entry decides; the verdict waits for the reveal\'s 0:00; the closed round stays on the table', () => {
  const js = V6.slice(V6.lastIndexOf('<script>'));
  assert.match(js, /const REVEAL_MS = 5000, RESULT_HOLD_MS = 2500;/);
  assert.match(js, /last\.verdict = me && me\.outcome && me\.signedBy > 0 && !me\.provisional/);
  assert.match(js, /last\.revealEndMs = closeMs \+ REVEAL_MS; last\.revealing = Date\.now\(\) < last\.revealEndMs;\n\s+if \(last\.revealing\) last\.verdict = null;/);
  assert.match(js, /else if \(revealOn\) state = \{ \.\.\.last, scoreboard, here: hereAt\(last\.id\) \};/);
  assert.match(js, /revealPaints\.add\(t\); setTimeout\(paint, t - Date\.now\(\) \+ 20\);/);
  // version 5 had none of it
  assert.ok(!V5.includes('REVEAL_MS') && !V5.includes('!me.provisional'));
});

test('no name, ticket number or old project name is left', () => {
  assert.deepEqual(V6.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});
