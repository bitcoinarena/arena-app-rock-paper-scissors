// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 6: the signed manifest names version 4's core and the version-6 client (the reveal phase) by their hashes, stands on
// version 8 as its parent, asks the same protocol version; its registration loads those files and plays with version 4's round fields.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';
import { MANIFEST_V9, GAME_ID_V9, GAME, RPS_ROUND_FIELDS_V9, RPS_CLIENT_V9_FILE } from '../plugin/rock-paper-scissors-v9.js';
import { MANIFEST_V8, GAME_ID_V8 } from '../plugin/rock-paper-scissors-v8.js';
import { MANIFEST_V4, GAME_ID_V4, RPS_DECIDE_V4_CORE, RPS_ROUND_FIELDS_V4 } from '../plugin/rock-paper-scissors-v4.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';

const sha = (u) => createHash('sha256').update(readFileSync(u)).digest('hex');
const hex = (b) => Buffer.from(b).toString('hex');

test('the signed manifest names version 4\'s core and version 9\'s client by their hashes, on version 8', () => {
  assert.equal(MANIFEST_V9.version, 9);
  assert.equal(hex(MANIFEST_V9.parentManifestId), hex(GAME_ID_V8));
  assert.equal(hex(MANIFEST_V9.cores[0].hash), sha(new URL('../plugin/decide-v4.js', import.meta.url)));
  assert.deepEqual(MANIFEST_V9.clients.map(hex), [sha(new URL('../client/index-v9.html', import.meta.url))]);
  assert.equal(MANIFEST_V9.requiredProtocolVersion, MANIFEST_V8.requiredProtocolVersion);
  assert.equal(hex(MANIFEST_V9.gameDevPubkey), hex(MANIFEST_V8.gameDevPubkey), 'the same developer');
  assert.equal(manifestStands(MANIFEST_V9, { verify: verifyEd25519, parentOf: (id) => (hex(id) === hex(GAME_ID_V8) ? MANIFEST_V8 : null) }).ok, true);
});

test('its registration loads what the manifest pins and plays with version 4\'s round fields', () => {
  assert.deepEqual([...GAME.cores.keys()], [RPS_DECIDE_V4_CORE.hash]);
  assert.equal(hex(GAME.gameId), hex(GAME_ID_V9));
  assert.deepEqual(GAME.clientUrls, [RPS_CLIENT_V9_FILE.href]);
  assert.deepEqual({ ...RPS_ROUND_FIELDS_V9, gameId: null }, { ...RPS_ROUND_FIELDS_V4, gameId: null });
  assert.equal(hex(RPS_ROUND_FIELDS_V9.gameId), hex(GAME_ID_V9));
  assert.deepEqual(readFileSync(new URL('../plugin/rock-paper-scissors-v9.js', import.meta.url), 'utf8').split('\n').filter((l) => FORBIDDEN.test(l)), []);
});
