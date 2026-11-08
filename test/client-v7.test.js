// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 7'S CLIENT: version 6's with version 7's views. The file is what its tool writes; the round logic is version 6's byte for byte outside the
// views' bundle; the countdown runs only while a move is missing (the pick, the wait for the opponent's move), never once both moves are in, in
// the reveal or at the result; between two rounds of a match the opponent is still at the table.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildV7 } from '../tools/build-client-v7.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V6 = readFileSync(new URL('../client/index-v6.html', import.meta.url), 'utf8');
const V7 = readFileSync(new URL('../client/index-v7.html', import.meta.url), 'utf8');
const B6 = new URL('../dist/rps-view-v6.js', import.meta.url), B7 = new URL('../dist/rps-view-v7.js', import.meta.url);

test('the file is what the tool writes, and outside the views\' bundle it is version 6\'s byte for byte', { skip: !(existsSync(B6) && existsSync(B7)) && 'tools/build-view.mjs not run' }, () => {
  const b6 = readFileSync(B6, 'utf8').trim(), b7 = readFileSync(B7, 'utf8').trim();
  assert.equal(buildV7(V6, b6, b7), V7, 'client/index-v7.html is out of date: run tools/build-client-v7.mjs');
  assert.equal(V7.replace(b7, ''), V6.replace(b6, ''));
});

const views = async () => {
  // built inside the package, so its react is the one the test renders with
  const out = join(mkdtempSync(new URL('../node_modules/', import.meta.url).pathname + '.rps7-'), 'view.mjs');
  await build({ entryPoints: [new URL('../view/RpsView-v7.jsx', import.meta.url).pathname], bundle: true, format: 'esm', jsx: 'automatic', outfile: out,
    external: ['react', 'react-dom', 'react/jsx-runtime'], logLevel: 'silent' });
  return import(out);
};
const clockIn = (h) => /class="clock"/.test(h);

test('one countdown, only while a move is missing; none once both are in, in the reveal or at the result', async () => {
  const { RpsView, clockRuns } = await views();
  const now = Date.now();
  const draw = (state) => renderToStaticMarkup(React.createElement(RpsView, { state, stage: null, stageFailed: true, onTap() {}, drawn: 1 }));
  const base = { id: 'r1', closeMs: now + 5000, openMs: now - 3000, free: false, prev: null, scoreboard: null, here: [] };
  const pick = draw({ ...base, phase: 'pick', joined: false, chosen: null });
  const waitAlone = draw({ ...base, phase: 'wait', move: 0, them: 0 });
  const waitBoth = draw({ ...base, phase: 'wait', move: 0, them: 1 });
  const reveal = draw({ ...base, phase: 'reveal', move: 0, theirs: 2, them: 1, closeMs: now - 1000, revealEndMs: now + 4000, revealing: true, verdict: null });
  const result = draw({ ...base, phase: 'result', move: 0, theirs: 2, them: 1, closeMs: now - 6000, revealEndMs: now - 1000, revealing: false, verdict: 'win' });
  console.log('  MEASURED #1361 clock:', JSON.stringify({ pick: clockIn(pick), waitAlone: clockIn(waitAlone), waitBoth: clockIn(waitBoth), reveal: clockIn(reveal), result: clockIn(result) }));
  assert.equal(clockIn(pick), true); assert.equal(clockIn(waitAlone), true);
  assert.equal(clockIn(waitBoth), false, 'both moves are in: no countdown');
  assert.equal(clockIn(reveal), false, 'the reveal and its animation: no countdown');
  assert.equal(clockIn(result), false);
  assert.match(reveal, /Revealing both moves/);
  assert.equal(clockRuns({ phase: 'wait', them: 2 }), false);
});

test('between two rounds of a match the opponent stays at the table: never "You are alone"', async () => {
  const { RpsView } = await views();
  const now = Date.now();
  const draw = (state) => renderToStaticMarkup(React.createElement(RpsView, { state, stage: null, stageFailed: true, onTap() {}, drawn: 1 }));
  const s = { phase: 'pick', id: 'r2', closeMs: now + 6000, openMs: now - 2000, free: false, joined: false, chosen: null, prev: null, here: [] };
  const inMatch = draw({ ...s, scoreboard: { me: 2, them: 1, themName: 'Test bot', themKey: 'ab', played: true, closeMs: now - 9000 } });
  const fresh = draw({ ...s, scoreboard: null });
  console.log('  MEASURED #1361 presence:', JSON.stringify({ inMatch: /You are playing against Test bot/.test(inMatch), alone: /You are alone/.test(inMatch), fresh: /You are alone/.test(fresh) }));
  assert.match(inMatch, /You are playing against Test bot/);
  assert.doesNotMatch(inMatch, /You are alone/);
  assert.match(inMatch, /<b>2<\/b><i>:<\/i><b>1<\/b>/, 'the score stays on the board');
  assert.match(fresh, /You are alone in this round/, 'with no match going on, alone is still said');
});

test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V7.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});
