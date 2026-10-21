// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 5'S CLIENT: the file in the tree is what its tool writes from version 4 and the views' bundle; its round logic is version 4's line
// for line; everything it shows is drawn by React - no element built or written by hand is left in its round script; no name, ticket
// number or old project name; it seats players as version 4 does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildV5 } from '../tools/build-client-v5.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V4 = readFileSync(new URL('../client/index-v4.html', import.meta.url), 'utf8');
const V5 = readFileSync(new URL('../client/index-v5.html', import.meta.url), 'utf8');
const B4 = new URL('../dist/rps-view.js', import.meta.url), B5 = new URL('../dist/rps-view-v5.js', import.meta.url);
const part = (s, from, to) => { const a = s.indexOf(from); const b = s.indexOf(to, a); assert.ok(a > 0 && b > a, `${from} ... ${to}`); return s.slice(a, b); };
const roundScript = (s) => s.slice(s.lastIndexOf('<script>'));

test('the file is what the tool writes (when the views are built here)', { skip: !(existsSync(B4) && existsSync(B5)) && 'tools/build-view.mjs not run' }, () => {
  assert.equal(buildV5(V4, readFileSync(B4, 'utf8'), readFileSync(B5, 'utf8')), V5, 'client/index-v5.html is out of date: run tools/build-client-v5.mjs');
});

test('the round logic is version 4\'s line for line: the seating, the reads, the taps\' landing', () => {
  for (const [from, to] of [['function seatAt(', '// SEATING END'], ['const refresh = async () => {', 'const TAPS = window.RPS_TAPS'],
    ['const settleTap = () => {', '    let touching = 0;'], ['const tap = async (id, i, closeMs) => {', '    const settleTap = () => {']])
    assert.equal(part(V5, from, to), part(V4, from, to).replace("note('That tap", "note('That tap"), from);
});

test('everything is drawn by React: the table, the chip, a refused tap\'s line, the verdict, the demo\'s line, outside the page', () => {
  const js = roundScript(V5);
  for (const gone of ['innerHTML', '.textContent =', 'document.body.append', "createElement('div')", 'const el = ', "$('kind')", 'tickClock', 'tickDue'])
    assert.ok(!js.includes(gone), gone);
  assert.match(js, /window\.RpsView\.none\(\$\('view'\)\);/);
  assert.match(js, /const chrome = window\.RpsView\.chrome\(\$\('kind-host'\), \$\('overlays'\)\);/);
  assert.match(js, /const note = \(text\) => chrome\.toast\(text\);/);
  assert.match(js, /chrome\.verdict\(kind, word\);/);
  assert.match(js, /chrome\.kind\(s\);\n/);
  assert.match(js, /chrome\.demo\(\{ n, a, b \}\);/);
  assert.match(V5, /<span id="kind-host" style="display:contents"><\/span>/);
  assert.match(V5, /<div id="view"><\/div>\n  <div id="overlays"><\/div>/);
  assert.ok(/window\.RpsView\s*=\s*\{\s*mount\s*:?[^}]*chrome/.test(V5) || V5.includes('chrome:'), 'the views are inlined: nothing is fetched');
});

test('no name, ticket number or old project name is left', () => {
  assert.deepEqual(V5.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});

test('it seats as version 4 does', () => {
  const seat = (html) => new Function(html.slice(html.indexOf('// SEATING BEGIN'), html.indexOf('// SEATING END')) + '\nreturn seatAt;')();
  const [s4, s5] = [seat(V4), seat(V5)];
  const id = (n) => n.toString(16).padStart(64, '0');
  const slot = [{ id: id(1), joined: 1 }, { id: id(2), joined: 0 }, { id: id(3), joined: 2 }];
  for (const args of [[slot, {}], [slot, { prevSlot: [{ id: id(9), joined: 2 }], mineId: id(9) }], [[], {}], [slot.map((x) => ({ ...x, open: false })), {}]])
    assert.deepEqual(s5(...args), s4(...args));
});
