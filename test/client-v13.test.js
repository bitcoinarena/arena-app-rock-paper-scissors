// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 13'S CLIENT: version 12 that asks the seats far less often, run here as the page runs it - the client's own script in a sandbox,
// the Arena page's ARENA_GAME, the seats' answers and the clock played by the test:
// - a tab in the lobby asks the seats only for the round on screen (and the one shown before it), a round at most every 4 s;
// - a round its seat has nothing for (404) is asked again after 3 s, then 6 s, then 10 s;
// - the tab's own round is read from the page's result at most every 3 s and not again once it is settled - and its result still shows;
// - a tap still reads its slot at once.
// RPS_CLIENT=client/index-v12.html runs the same checks on version 12 (the counts fail there).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildV13 } from '../tools/build-client-v13.mjs';
import { FORBIDDEN } from '../tools/build-client-v4.mjs';

const V12 = readFileSync(new URL('../client/index-v12.html', import.meta.url), 'utf8');
const V13 = readFileSync(new URL('../client/index-v13.html', import.meta.url), 'utf8');
const UNDER = process.env.RPS_CLIENT ? readFileSync(new URL('../' + process.env.RPS_CLIENT, import.meta.url), 'utf8') : V13;
const SCRIPT = UNDER.slice(UNDER.lastIndexOf('<script>') + 8, UNDER.lastIndexOf('</script>'));
const T = 1_000_000;

test('the file is what the tool writes', () => { assert.equal(buildV13(V12), V13, 'client/index-v13.html is out of date: run tools/build-client-v13.mjs'); });

test('no name, ticket number or old project name is left in the file', () => {
  assert.deepEqual(V13.split('\n').filter((l) => FORBIDDEN.test(l)).map((l) => l.trim().slice(0, 60)), []);
});

// The client in a sandbox: `A` is what the Arena page hands it, `seat` answers GET /api/round-result, the clock is the test's.
function client({ rows, hidden = () => [], result = async () => null, reveals = () => ({}), seat = () => null }) {
  let now = T;
  const drawn = [], intervals = [], asks = [], results = [];
  let onTap = null;
  const el = () => ({ addEventListener() {}, setAttribute() {}, style: {}, textContent: '', classList: { add() {}, remove() {} } });
  const A = {
    headToHead: { players: 2 }, clientHash: 'c', game: { id: 'g' }, back() {},
    rows: () => rows(now - T), allRows: () => rows(now - T),
    hiddenAll: () => hidden(now - T), hidden: (id) => hidden(now - T).some((x) => x.roundIdHex === id),
    result: async (id) => { results.push({ id, t: now - T }); return result(id, now - T); }, reveals: async (id) => reveals(id, now - T),
    reveal: async () => ({ ok: true }), hide: () => true, here: async () => ({ others: [] }),
  };
  const parent = { ARENA_GAME: A, ARENA_ROW_NODES: () => ['https://seat-1/'], ARENA_JOIN: null, location: { search: '' } };
  const window = { parent, RpsView: {
    hands() {}, none() {},
    chrome: () => ({ kind() {}, verdict() {}, toast() {}, demo() {} }),
    mount: (_, o) => { onTap = o.onTap; return { draw: (s) => drawn.push(JSON.parse(JSON.stringify(s))) }; },
  } };
  const fetch = async (url) => {
    const id = new URL(url).searchParams.get('round');
    asks.push({ id, t: now - T });
    const j = seat(id, now - T);
    return j ? { ok: true, json: async () => j } : { ok: false, status: 404 };
  };
  const document = { getElementById: () => el(), querySelector: () => el(), createElement: () => el(), addEventListener() {}, body: { appendChild() {}, classList: { add() {}, remove() {} } } };
  const ctx = vm.createContext({
    window, document, console: { log() {}, warn() {} }, fetch, AbortSignal: { timeout: () => null }, URLSearchParams,
    Uint8Array, Promise, JSON, Math, Number, String, Object, Array, Map, Set, Error,
    crypto: { getRandomValues: (b) => { b[0] = 0; return b; } },
    Date: { now: () => now },
    loadStage: () => new Promise(() => {}),
    setTimeout: () => 0, clearTimeout() {}, setInterval: (f, ms) => { intervals.push({ f, ms, next: now + ms }); return 0; },
  });
  vm.runInContext(SCRIPT, ctx);
  const flush = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r)); };
  // the page's timers at their own periods (paint every 250 ms, refresh every second) until `ms` after the start
  const until = async (ms) => { while (now - T < ms) { now += 250; for (const x of intervals) if (now >= x.next) { x.next += x.ms; x.f(); } await flush(); } };
  return { drawn, asks, results, until, flush, tap: (...a) => onTap(...a) };
}

// The lobby as the live RPS page shows it: a slot every 8 s with four rounds, the rounds of the slots from 8 s ago to 25 s ahead listed.
const lobby = (perSlot = 4) => (t) => {
  const out = [];
  for (let k = Math.floor((t - 8000) / 8000); k * 8000 <= t + 25000; k++) {
    const close = T + k * 8000 + 5000;
    if (close <= T + t - 8000) continue;
    for (let i = 0; i < perSlot; i++) out.push({ id: `r${k}x${i}`, joinable: true, entryCloseMs: close, line: '0 joined', free: true, stakeSats: 0 });
  }
  return out;
};

test('a tab in the lobby asks only for the round on screen and the one before it, a round at most every 4 s', async () => {
  // half the rounds are not at the first seat yet (404), the others answer with no player
  const c = client({ rows: lobby(4), seat: (id) => (id.endsWith('x1') || id.endsWith('x3') ? null : { players: [] }) });
  await c.until(60000);
  const ids = new Set(c.asks.map((a) => a.id));
  const gaps = [];
  for (const id of ids) { const ts = c.asks.filter((a) => a.id === id).map((a) => a.t); for (let i = 1; i < ts.length; i++) gaps.push(ts[i] - ts[i - 1]); }
  console.log('  MEASURED 60 s in the lobby: GET /api/round-result', c.asks.length, 'over', ids.size, 'rounds; smallest gap for one round', Math.min(...gaps), 'ms');
  assert.ok(c.asks.length > 0, 'the round on screen is still counted');
  assert.ok(c.asks.length <= 40, `at most two rounds every 3 s: ${c.asks.length}`);
  assert.ok(Math.min(...gaps) >= 3000, 'no round asked again within 3 s');
  assert.ok(c.drawn.some((s) => s.phase === 'pick'), 'the player is offered a round');
});

test('a round its seat has nothing for is asked again after 3 s, then 6 s, then 10 s', async () => {
  // one round a slot, long open: entries close 30 s on and the lobby lists it from the start
  const rows = (t) => [{ id: 'long', joinable: true, entryCloseMs: T + 30000, line: '0 joined', free: true, stakeSats: 0 }]
    .map((r) => ({ ...r, entryCloseMs: t < 21000 ? T + t + 9000 : T + 30000 }));
  const c = client({ rows, seat: () => null });
  await c.until(30000);
  const ts = c.asks.filter((a) => a.id === 'long').map((a) => a.t);
  const gaps = ts.slice(1).map((x, i) => x - ts[i]);
  console.log('  MEASURED 404 asks at', JSON.stringify(ts), 'gaps', JSON.stringify(gaps));
  assert.ok(ts.length >= 3, 'still asked');
  assert.ok(gaps[0] >= 3000 && gaps[1] >= 6000 && gaps.slice(2).every((g) => g >= 10000), `back-off 3 s, 6 s, 10 s: ${JSON.stringify(gaps)}`);
});

test('a round with both players in is not asked again', async () => {
  const rows = (t) => [{ id: 'full', joinable: true, entryCloseMs: T + t + 9000, line: '0 joined', free: true, stakeSats: 0 }];
  const c = client({ rows, seat: () => ({ players: [{ entry: 'e1' }, { entry: 'e2' }] }) });
  await c.until(20000);
  console.log('  MEASURED asks for a full round:', c.asks.length);
  assert.equal(c.asks.length, 1);
});

test('the tab\'s own round: read from the page at most every 3 s, not again once settled, and its result shows', async () => {
  const mine = { roundIdHex: 'aa', entryIdHex: 'ea', entryCloseMs: T + 1000, move: 1 };
  const signed = {
    entries: [{ entry: 'ea', outcome: 'DELIVERED', score: 2, signedBy: 3 }, { entry: 'eb', outcome: 'DELIVERED', score: 0, signedBy: 3 }],
    match: { identities: ['i1', 'i2'], score: [1, 0], played: 1, byEntry: { ea: 'i1', eb: 'i2' }, names: ['me', 'Bob'] },
  };
  const c = client({
    rows: () => [], hidden: () => [mine],
    result: async (id, t) => (t < 2500 ? { entries: [{ entry: 'ea' }, { entry: 'eb' }] } : signed),
    reveals: async () => ({ ea: 1, eb: 0 }),
  });
  await c.until(20000);
  const at20 = c.results.length;
  await c.until(40000);
  const ts = c.results.map((r) => r.t);
  console.log('  MEASURED page result() calls for the own round at', JSON.stringify(ts));
  assert.ok(ts.slice(1).every((x, i) => x - ts[i] >= 1000), 'never twice in a second');
  assert.ok(ts.length <= 6, `a few reads, not one a second: ${ts.length}`);
  assert.equal(c.results.length, at20, 'not read again once settled');
  const last = c.drawn.filter((s) => s.verdict).at(-1);
  assert.ok(last, 'a result is shown');
  assert.equal(last.verdict, 'win'); assert.equal(last.signed, true);
});

test('a tap reads its slot at once', async () => {
  const rows = (t) => [0, 1].map((i) => ({ id: 's' + i, joinable: true, entryCloseMs: T + 9000, line: '0 joined', free: true, stakeSats: 0 }));
  const c = client({ rows, seat: () => ({ players: [] }) });
  await c.until(2000);
  const before = c.asks.length;
  const shown = c.drawn.filter((s) => s.phase === 'pick').at(-1);
  await c.tap(shown.id, 0, shown.closeMs);
  await c.flush();
  console.log('  MEASURED asks before / after the tap:', before, c.asks.length);
  assert.deepEqual(c.asks.slice(before).map((a) => a.id).sort(), ['s0', 's1'], 'both rounds of the slot read at the tap');
});
