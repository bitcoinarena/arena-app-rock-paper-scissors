// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 14'S CLIENT (bitcoin-arena kanban #3234, feedback #342, #182): the 3D table never draws a move the opponent did not show.
// The client's own show() and draw line run here on the states the round goes through.
// RPS_CLIENT=client/index-v13.html runs the same checks on version 13 (they fail there: the alone seat is drawn as a rock fist).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildV14 } from '../tools/build-client-v14.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V13 = readFileSync(new URL('../client/index-v13.html', import.meta.url), 'utf8');
const V14 = readFileSync(new URL('../client/index-v14.html', import.meta.url), 'utf8');
const UNDER = process.env.RPS_CLIENT ? readFileSync(new URL('../' + process.env.RPS_CLIENT, import.meta.url), 'utf8') : V14;

test('the file is what the tool writes', () => { assert.equal(buildV14(V13), V14, 'client/index-v14.html is out of date: run tools/build-client-v14.mjs'); });
test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V14.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});

// what show() wants for the opponent's seat: its first lines, up to `want = ...`, run on a state
const wantOf = (() => {
  const a = UNDER.indexOf('    function show(s) {\n');
  const b = UNDER.indexOf('      want = { mine, theirs };\n', a);
  assert.ok(a > 0 && b > a, 'the client has show()');
  const body = UNDER.slice(a + '    function show(s) {\n'.length, b);
  return new Function('s', 'NAMES', 'preview', `${body}\nreturn theirs;`);
})();
// the pose the table draws the opponent's hand in for that
const drawnOf = (() => {
  const line = UNDER.split('\n').find((l) => l.includes('them.set(want.theirs ==='));
  const expr = line.slice(line.indexOf('them.set(') + 9, line.lastIndexOf(');'));
  return new Function('want', `return ${expr};`);
})();
const NAMES = ['rock', 'paper', 'scissors'];
const pose = (s) => drawnOf({ theirs: wantOf(s, NAMES, null) });

test('#3234: alone at the reveal, the seat across is empty, not a rock fist', () => {
  for (const phase of ['reveal', 'result']) {
    const s = { phase, move: 1, them: 0, here: [], theirs: null };
    assert.equal(wantOf(s, NAMES, null), 'absent', phase + ': the seat nobody took is read as someone there');
    assert.notEqual(pose(s), 'rock', phase + ': the empty seat is drawn as a rock fist');
  }
});

test('#3234: an opponent whose move is not known yet is drawn with no move', () => {
  for (const s of [{ phase: 'reveal', move: 1, them: 1, here: ['x'], theirs: null }, { phase: 'wait', move: 1, them: 1, here: ['x'] }, { phase: 'pick', joined: true, here: ['x'] }]) {
    const p = pose(s);
    assert.ok(!NAMES.includes(p), s.phase + ': an unknown move drawn as ' + p);
  }
});

test('#3234: a shown move is drawn as that move', () => {
  assert.equal(drawnOf({ theirs: 'scissors' }), 'scissors');
});

// THE "SEATS ARE SIGNING" LINE HAS A ROW OF ITS OWN (bitcoin-arena kanban #3564, feedback #423): versions 11-13 fixed it at bottom:10px, over the
// pick panel's cost line - Chrome at 1920x1000: cost 966.8-983 px, the line 973.2-990 px. RPS_CLIENT=client/index-v13.html fails here.
test('the provisional / signed line is a row of its own, never fixed over the page', () => {
  const at = UNDER.indexOf("el.id = 'rps-signed'");
  assert.ok(at > 0, 'the client makes no #rps-signed line');
  const css = UNDER.slice(UNDER.indexOf('el.style.cssText = ', at), UNDER.indexOf('document.body.appendChild(el)', at));
  assert.doesNotMatch(css, /position:\s*(fixed|absolute)/, 'the line is laid over the page: ' + css);
  assert.match(css, /flex:\s*none/, 'the line is not a row of the page\'s column');
  assert.match(css, /min-height:\s*\d+px/, 'the row does not keep its height while empty');
});
