// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 12'S CLIENT: version 11's round logic with three fixes, run here as the page runs it - the client's own script in a sandbox, the Arena
// page's ARENA_GAME and the clock played by the test:
// - a move from a round the tab was alone in (public after its close) is never entered again: a free round gets a fresh move, a paid round none;
// - the carried entry is checked as a tap is: no "waiting" for an entry that did not go in;
// - the tab does not reveal a round before the seats' result says every player is in;
// - the result from the open moves is computed only from rock, paper or scissors (0, 1, 2).
// RPS_CLIENT=client/index-v11.html runs the same checks on version 11 (they fail there).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildV12 } from '../tools/build-client-v12.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V11 = readFileSync(new URL('../client/index-v11.html', import.meta.url), 'utf8');
const V12 = readFileSync(new URL('../client/index-v12.html', import.meta.url), 'utf8');
const UNDER = process.env.RPS_CLIENT ? readFileSync(new URL('../' + process.env.RPS_CLIENT, import.meta.url), 'utf8') : V12;
const SCRIPT = UNDER.slice(UNDER.lastIndexOf('<script>') + 8, UNDER.lastIndexOf('</script>'));

test('the file is what the tool writes', () => { assert.equal(buildV12(V11), V12, 'client/index-v12.html is out of date: run tools/build-client-v12.mjs'); });

test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V12.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});

// The client in a sandbox: `A` is what the Arena page hands it, the clock is the test's.
function client({ rows, hidden, result, reveals = () => ({}), hide = () => true, random = 0, join = null }) {
  let now = 1_000_000;
  const T0 = now;
  const hides = [], revealed = [], drawn = [], intervals = [];
  const el = () => ({ addEventListener() {}, setAttribute() {}, style: {}, textContent: '', classList: { add() {}, remove() {} } });
  const A = {
    headToHead: { players: 2 }, clientHash: 'c', game: { id: 'g' }, back() {},
    rows: () => rows(now - T0), allRows: () => rows(now - T0),
    hiddenAll: () => hidden(now - T0), hidden: (id) => hidden(now - T0).some((x) => x.roundIdHex === id),
    result: async (id) => result(id, now - T0), reveals: async (id) => reveals(id, now - T0),
    reveal: async (id) => { revealed.push(id); return { ok: true }; },
    hide: (id, move) => { hides.push({ id, move }); return hide(id, move); },
    here: async () => ({ others: ['Bob'] }),
  };
  const parent = { ARENA_GAME: A, ARENA_ROW_NODES: () => [], ARENA_JOIN: join, location: { search: '' } };
  const window = { parent, RpsView: {
    hands() {}, none() {},
    chrome: () => ({ kind() {}, verdict() {}, toast() {}, demo() {} }),
    mount: () => ({ draw: (s) => drawn.push(JSON.parse(JSON.stringify(s))) }),
  } };
  const document = { getElementById: () => el(), querySelector: () => el(), createElement: () => el(), addEventListener() {}, body: { appendChild() {}, classList: { add() {}, remove() {} } } };
  const ctx = vm.createContext({
    window, document, console: { log() {}, warn() {} }, fetch: async () => ({ ok: false }), AbortSignal: { timeout: () => null }, URLSearchParams,
    Uint8Array, Promise, JSON, Math, Number, String, Object, Array, Map, Set, Error,
    crypto: { getRandomValues: (b) => { b[0] = random; return b; } },
    Date: { now: () => now },
    loadStage: () => new Promise(() => {}),
    setTimeout: () => 0, clearTimeout() {}, setInterval: (f) => { intervals.push(f); return 0; },
  });
  vm.runInContext(SCRIPT, ctx);
  const flush = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r)); };
  // run the page's timers (paint every 250 ms, refresh every second) until `ms` after the start
  const until = async (ms) => { while (now - T0 < ms) { now += 250; for (const f of intervals) f(); await flush(); } };
  return { hides, revealed, drawn, until, flush };
}

// A round this tab was alone in (round a, closed 1 s after the start, move rock), then round b open in the next slot.
const alone = ({ free, hide, random, join }) => {
  const T = 1_000_000;
  const a = { roundIdHex: 'aa', entryIdHex: 'ea', entryCloseMs: T + 1000, move: 0 };
  return client({
    rows: (t) => [{ id: 'bb', joinable: true, entryCloseMs: T + 1000 + 8000, line: '0 joined', free, stakeSats: free ? 0 : 100 }],
    hidden: () => [a],
    result: async (id) => (id === 'aa' ? { entries: [{ entry: 'ea' }] } : null),
    reveals: async () => ({ ea: 0 }),
    hide, random, join,
  });
};

test('a move from a round the tab was alone in is never entered again: a free round gets a fresh move, a paid round none', async () => {
  const free = alone({ free: true, random: 2 });
  await free.until(3000);
  console.log('  MEASURED free round, hides:', JSON.stringify(free.hides));
  assert.ok(free.hides.length >= 1, 'a free round is still entered for the player');
  assert.ok(free.hides.every((x) => x.id === 'bb' && x.move !== 0), 'the public move (rock) is not played again');
  assert.equal(free.hides[0].move, 2, 'the fresh move is the random one');

  const paid = alone({ free: false, random: 2 });
  await paid.until(3000);
  console.log('  MEASURED paid round, hides:', JSON.stringify(paid.hides));
  assert.deepEqual(paid.hides, [], 'no entry into a paid round without a tap');
  assert.ok(!paid.drawn.some((s) => s.carried), 'and no "waiting" for one');
});

test('a carried entry that did not go in is not shown as waiting for the opponent', async () => {
  const refused = alone({ free: true, random: 1, hide: () => false });
  await refused.until(3000);
  console.log('  MEASURED refused carry, phases:', JSON.stringify(refused.drawn.map((s) => s.phase + (s.carried ? '(carried)' : ''))));
  assert.ok(refused.hides.length >= 1);
  assert.ok(!refused.drawn.some((s) => s.carried), 'the table waits only for an entry that went in');
  assert.equal(refused.drawn.at(-1).phase, 'pick', 'the player can tap');

  const later = alone({ free: true, random: 1, join: { round: 'bb', state: 'refused', why: 'stake' } });
  await later.until(3000);
  assert.ok(!later.drawn.some((s) => s.carried), 'nor one the page says was refused');
});

test('the tab reveals a round only once the seats\' result says every player is in', async () => {
  const T = 1_000_000;
  let held = null;
  const c = client({
    rows: () => [], hidden: () => [{ roundIdHex: 'aa', entryIdHex: 'ea', entryCloseMs: T + 1000, move: 1 }],
    result: async () => held,
  });
  await c.until(3000);
  console.log('  MEASURED reveals while the result is unknown:', JSON.stringify(c.revealed));
  assert.deepEqual(c.revealed, [], 'not revealed while it is not known whether the player was alone');
  held = { entries: [{ entry: 'ea' }] };
  await c.until(5000);
  assert.deepEqual(c.revealed, [], 'never revealed when the player was alone');
  held = { entries: [{ entry: 'ea' }, { entry: 'eb' }] };
  await c.until(7000);
  assert.deepEqual(c.revealed, ['aa'], 'revealed once both are in');
});

test('the result from the open moves counts only rock, paper or scissors', async () => {
  const T = 1_000_000;
  for (const [mine, theirs] of [[0, 5], [0, -1], [0, 1.5], [7, 1], [0, '']]) {
    const c = client({
      rows: () => [], hidden: () => [{ roundIdHex: 'aa', entryIdHex: 'ea', entryCloseMs: T + 1000, move: mine }],
      result: async () => ({ entries: [{ entry: 'ea' }, { entry: 'eb' }] }),
      reveals: async () => ({ ea: mine, eb: theirs }),
    });
    await c.until(8000);   // past the reveal ring (5 s after the close)
    const verdicts = c.drawn.map((s) => s.verdict || null).filter(Boolean);
    console.log('  MEASURED moves', JSON.stringify([mine, theirs]), 'verdicts:', JSON.stringify(verdicts), 'theirs shown:', JSON.stringify(c.drawn.at(-1).theirs));
    assert.deepEqual(verdicts, [], `no WON / LOST / DRAW from ${mine} against ${JSON.stringify(theirs)}`);
    if (mine === 0) assert.ok(c.drawn.at(-1).theirs === null || c.drawn.at(-1).theirs === undefined, 'a value that is no move is not shown as one');
  }
  // the honest case still reads at once: paper beats rock
  const ok = client({
    rows: () => [], hidden: () => [{ roundIdHex: 'aa', entryIdHex: 'ea', entryCloseMs: T + 1000, move: 1 }],
    result: async () => ({ entries: [{ entry: 'ea' }, { entry: 'eb' }] }),
    reveals: async () => ({ ea: 1, eb: 0 }),
  });
  await ok.until(8000);
  assert.equal(ok.drawn.at(-1).verdict, 'win');
  assert.equal(ok.drawn.at(-1).provisional, true);
});
