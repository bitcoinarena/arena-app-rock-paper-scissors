// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 8'S CLIENT: version 7's with the result held RESULT_HOLD_MS from the moment it arrives (measured live: a signed result ~10 s after the
// close came after version 7's fixed 7.5 s window, so the table went from the reveal straight to the next pick). The file is what its tool writes;
// everything else is version 7's byte for byte.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildV8 } from '../tools/build-client-v8.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V7 = readFileSync(new URL('../client/index-v7.html', import.meta.url), 'utf8');
const V8 = readFileSync(new URL('../client/index-v8.html', import.meta.url), 'utf8');

test('the file is what the tool writes', () => { assert.equal(buildV8(V7), V8, 'client/index-v8.html is out of date: run tools/build-client-v8.mjs'); });

test('the result is held from its arrival, never shorter than version 7 held it', () => {
  const js = V8.slice(V8.lastIndexOf('<script>'));
  assert.match(js, /const verdictAt = new Map\(\);/);
  assert.match(js, /last\.resultUntil = last\.verdict \? Math\.max\(last\.revealEndMs, verdictAt\.get\(h\.roundIdHex\)\) \+ RESULT_HOLD_MS : null;/);
  assert.match(js, /: Date\.now\(\) < last\.resultUntil\);/);
  assert.ok(!V7.includes('verdictAt'));
  // the only difference to version 7 is in the round logic: the views' bundle is the same bytes
  const v7lines = new Set(V7.split('\n')), changed = V8.split('\n').filter((l) => !v7lines.has(l));
  console.log('  MEASURED #1361 v8 changed lines:', changed.length);
  assert.ok(changed.length <= 8, `${changed.length} lines changed`);
});

test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V8.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});
