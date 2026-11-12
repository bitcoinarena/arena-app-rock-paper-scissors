// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 10'S CLIENT: version 9's with version 10's views. The file is what its tool writes; it holds no emoji (a browser without an emoji font drew
// boxes) - the hands and the other pictures are SVG; the title's gradient is on its own words, the hands beside it; a paid round's stake is handed to
// the views, which say what a round costs and what a draw gives back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildV10 } from '../tools/build-client-v10.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V9 = readFileSync(new URL('../client/index-v9.html', import.meta.url), 'utf8');
const V10 = readFileSync(new URL('../client/index-v10.html', import.meta.url), 'utf8');
const B7 = new URL('../dist/rps-view-v7.js', import.meta.url), B10 = new URL('../dist/rps-view-v10.js', import.meta.url);
const EMOJI = /[☀-➿]|[\uD83C-\uD83E][\uDC00-\uDFFF]|\\u27[0-9a-f]{2}|\\u\{1F[0-9a-f]+\}|\\ud83[c-e]/i;

test('the file is what the tool writes', { skip: !(existsSync(B7) && existsSync(B10)) && 'tools/build-view.mjs not run' }, () => {
  assert.equal(buildV10(V9, readFileSync(B7, 'utf8'), readFileSync(B10, 'utf8')), V10, 'client/index-v10.html is out of date: run tools/build-client-v10.mjs');
});

test('no emoji is left in the file: every picture is drawn', () => {
  const left = V10.split('\n').filter((l) => EMOJI.test(l)).map((l) => (l.match(EMOJI) || [''])[0]);
  assert.deepEqual(left, []);
  assert.ok(EMOJI.test(V9), 'version 9 had them');
});

test('the title carries the gradient on its own words; the hands sit beside it, drawn', () => {
  assert.match(V10, /<h1><span class="ttl">Rock Paper Scissors<\/span><span class="icons" aria-label="Rock, paper, scissors"><\/span><\/h1>/);
  assert.match(V10, /h1 \.ttl \{ background: linear-gradient/);
  assert.match(V10, /window\.RpsView\.hands\(document\.querySelector\('h1 \.icons'\)\)/);
});

test('each round\'s stake reaches the views, kept from its row', () => {
  const js = V10.slice(V10.lastIndexOf('<script>'));
  assert.match(js, /stakes\.set\(r\.id, \{ free: !!r\.free, stake: !r\.free && n > 0 \? n : null \}\)/);
  assert.match(js, /free: !!row\.free, stake: row\.free \? null : \(stakes\.get\(row\.id\) \|\| \{\}\)\.stake \|\| null,/);
  assert.match(js, /stake: \(stakes\.get\(h\.roundIdHex\) \|\| \{\}\)\.stake \|\| null/);
});

test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V10.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});

const views = async () => {
  const dir = mkdtempSync(new URL('../node_modules/', import.meta.url).pathname + '.rps10-');
  const out = join(dir, 'view.mjs'), chrome = join(dir, 'chrome.mjs');
  const opts = { bundle: true, format: 'esm', jsx: 'automatic', external: ['react', 'react-dom', 'react/jsx-runtime'], logLevel: 'silent' };
  await build({ ...opts, entryPoints: [new URL('../view/RpsView-v10.jsx', import.meta.url).pathname], outfile: out });
  await build({ ...opts, entryPoints: [new URL('../view/RpsChrome-v10.jsx', import.meta.url).pathname], outfile: chrome });
  return { ...(await import(out)), ...(await import(chrome)) };
};

test('a paid round says what it costs and what a draw gives back; a free one says nothing of sats', async () => {
  const { RpsView, KindChip, costLine, feeOf } = await views();
  const now = Date.now();
  const draw = (state) => renderToStaticMarkup(React.createElement(RpsView, { state, stage: null, stageFailed: true, onTap() {}, drawn: 1 }));
  const base = { id: 'r1', closeMs: now + 5000, openMs: now - 3000, prev: null, scoreboard: null, here: [] };
  assert.equal(feeOf(100), 10);
  assert.equal(costLine(100), '100 sat a round, from your balance · a draw gives 90 back (10 sat fees)');
  const pick = draw({ ...base, phase: 'pick', free: false, stake: 100, joined: false, chosen: null });
  assert.match(pick, /100 sat a round, from your balance · a draw gives 90 back \(10 sat fees\)/);
  assert.doesNotMatch(draw({ ...base, phase: 'pick', free: true, stake: null, joined: false, chosen: null }), /sat/);
  const res = { ...base, phase: 'result', move: 0, theirs: 0, closeMs: now - 8000, free: false, stake: 100 };
  assert.match(draw({ ...res, verdict: 'draw' }), /Draw · 90 of your 100 sat back \(10 sat fees\)/);
  assert.match(draw({ ...res, verdict: 'void' }), /Not played · your 100 sat come back/);
  assert.match(draw({ ...res, verdict: 'win', theirs: 2 }), /You win <svg/);
  assert.match(draw({ ...res, free: true, stake: null, verdict: 'draw' }), /Draw · stakes back/);
  assert.match(draw({ ...base, phase: 'pick', free: false, stake: 100, joined: false, chosen: null, prev: { id: 'r0', phase: 'result', move: 1, theirs: 1, verdict: 'draw', free: false, stake: 100 } }), /draw · 90 back/);
  assert.match(renderToStaticMarkup(React.createElement(KindChip, { phase: 'pick', free: false, stake: 100 })), />PAID · 100 sat</);
  assert.match(renderToStaticMarkup(React.createElement(KindChip, { phase: 'pick', free: true })), />FREE</);
  // every picture drawn: no emoji in any state's markup
  for (const s of [pick, draw({ ...res, verdict: 'draw' }), draw({ ...base, phase: 'wait', move: 2, them: 1, free: false, stake: 100 }), draw({ ...base, phase: 'none', prev: null })])
    assert.doesNotMatch(s, EMOJI);
  console.log('  MEASURED #1481 v10 pick line:', costLine(100));
});
