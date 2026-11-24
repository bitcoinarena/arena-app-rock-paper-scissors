// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 15'S CLIENT (bitcoin-arena kanban #3564, feedback #423): the line under the table that says a result is provisional or signed
// has its own row at the foot of the page. Version 11 to 14 fixed it 10 px above the bottom, over the pick panel's cost line
// ("100 sat a round ... a draw gives 90 back"): measured in Chrome at 1920x1000, cost 966.8-983 px, the line 973.2-990 px.
// RPS_CLIENT=client/index-v14.html runs the same checks on version 14 (they fail there).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V14 = readFileSync(new URL('../client/index-v14.html', import.meta.url), 'utf8');
const V15_URL = new URL('../client/index-v15.html', import.meta.url);
const UNDER = process.env.RPS_CLIENT ? readFileSync(new URL('../' + process.env.RPS_CLIENT, import.meta.url), 'utf8') : existsSync(V15_URL) ? readFileSync(V15_URL, 'utf8') : '';

test('the file is what the tool writes', async () => {
  const { buildV15 } = await import('../tools/build-client-v15.mjs');
  assert.equal(buildV15(V14), UNDER, 'client/index-v15.html is out of date: run tools/build-client-v15.mjs');
});
test('no name, ticket number or old project name is left in the file', () => {
  assert.ok(UNDER.length > 0, 'no client/index-v15.html');
  assert.deepEqual(UNDER.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});
test('the provisional / signed line is a row of its own, never fixed over the page', () => {
  const at = UNDER.indexOf("el.id = 'rps-signed'");
  assert.ok(at > 0, 'the client makes no #rps-signed line');
  const css = UNDER.slice(UNDER.indexOf('el.style.cssText = ', at), UNDER.indexOf('document.body.appendChild(el)', at));
  assert.doesNotMatch(css, /position:\s*(fixed|absolute)/, 'the line is laid over the page: ' + css);
  assert.match(css, /flex:\s*none/, 'the line is not a row of the page\'s column');
  assert.match(css, /min-height:\s*\d+px/, 'the row does not keep its height while empty (the page would jump when a result shows)');
});
test('the rest of the client is version 14\'s', () => {
  if (process.env.RPS_CLIENT) return;
  const strip = (s) => s.replace(/      \/\/ VERSION 15[^\n]*\n/g, '').replace(/el\.style\.cssText = '[^']*'/, '');
  assert.equal(strip(UNDER), strip(V14));
});
