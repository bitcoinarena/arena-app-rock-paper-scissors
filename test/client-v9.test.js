// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 8'S CLIENT: version 8's with the result held RESULT_HOLD_MS from the moment it arrives (measured live: a signed result ~10 s after the
// close came after version 8's fixed 7.5 s window, so the table went from the reveal straight to the next pick). The file is what its tool writes;
// everything else is version 8's byte for byte.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildV9 } from '../tools/build-client-v9.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V8 = readFileSync(new URL('../client/index-v8.html', import.meta.url), 'utf8');
const V9 = readFileSync(new URL('../client/index-v9.html', import.meta.url), 'utf8');

test('the file is what the tool writes', () => { assert.equal(buildV9(V8), V9, 'client/index-v9.html is out of date: run tools/build-client-v9.mjs'); });

test('the score is read from the rounds before the newest', () => {
  const js = V9.slice(V9.lastIndexOf('<script>'));
  assert.match(js, /const prev = mine\.length > 1 \? mine\[mine\.length - 2\] : null;/);
  assert.match(js, /if \(!\(got\.held && got\.held\.match\)\) \{ const held = await A\.result\(prev\.roundIdHex\);/);
  assert.match(js, /kept = \{ me: m\.score\[mi\], them: m\.score\[1 - mi\]/);
  const v8lines = new Set(V8.split('\n')), changed = V9.split('\n').filter((l) => !v8lines.has(l));
  console.log('  MEASURED #1361 v9 changed lines:', changed.length);
  assert.ok(changed.length <= 12, `${changed.length} lines changed`);
});

test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V9.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});
