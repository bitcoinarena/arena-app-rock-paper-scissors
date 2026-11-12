// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 10: the signed manifest names version 4's core and the version-10 client (the hands drawn, the stake said) by their hashes, stands on
// version 9 as its parent, asks the same protocol version; its registration loads those files and plays with version 4's round fields.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';
import { MANIFEST_V10, GAME_ID_V10, GAME, RPS_ROUND_FIELDS_V10, RPS_CLIENT_V10_FILE } from '../plugin/rock-paper-scissors-v10.js';
import { MANIFEST_V9, GAME_ID_V9 } from '../plugin/rock-paper-scissors-v9.js';
import { MANIFEST_V4, GAME_ID_V4, RPS_DECIDE_V4_CORE, RPS_ROUND_FIELDS_V4 } from '../plugin/rock-paper-scissors-v4.js';
import { manifestStands } from 'arena-sdk/manifest';
import { verifyEd25519 } from 'arena-sdk/ed25519';

const sha = (u) => createHash('sha256').update(readFileSync(u)).digest('hex');
const hex = (b) => Buffer.from(b).toString('hex');

test('the signed manifest names version 4\'s core and version 10\'s client by their hashes, on version 9', () => {
  assert.equal(MANIFEST_V10.version, 10);
  assert.equal(hex(MANIFEST_V10.parentManifestId), hex(GAME_ID_V9));
  assert.equal(hex(MANIFEST_V10.cores[0].hash), sha(new URL('../plugin/decide-v4.js', import.meta.url)));
  assert.deepEqual(MANIFEST_V10.clients.map(hex), [sha(new URL('../client/index-v10.html', import.meta.url))]);
  assert.equal(MANIFEST_V10.requiredProtocolVersion, MANIFEST_V9.requiredProtocolVersion);
  assert.equal(hex(MANIFEST_V10.gameDevPubkey), hex(MANIFEST_V9.gameDevPubkey), 'the same developer');
  assert.equal(manifestStands(MANIFEST_V10, { verify: verifyEd25519, parentOf: (id) => (hex(id) === hex(GAME_ID_V9) ? MANIFEST_V9 : null) }).ok, true);
});

test('its registration loads what the manifest pins and plays with version 4\'s round fields', () => {
  assert.deepEqual([...GAME.cores.keys()], [RPS_DECIDE_V4_CORE.hash]);
  assert.equal(hex(GAME.gameId), hex(GAME_ID_V10));
  assert.deepEqual(GAME.clientUrls, [RPS_CLIENT_V10_FILE.href]);
  assert.deepEqual({ ...RPS_ROUND_FIELDS_V10, gameId: null }, { ...RPS_ROUND_FIELDS_V4, gameId: null });
  assert.equal(hex(RPS_ROUND_FIELDS_V10.gameId), hex(GAME_ID_V10));
  assert.deepEqual(readFileSync(new URL('../plugin/rock-paper-scissors-v10.js', import.meta.url), 'utf8').split('\n').filter((l) => FORBIDDEN.test(l)), []);
});
