// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 14: version 13 whose 3D table never draws a move the opponent did not show (bitcoin-arena kanban #3234,
// feedback #342 and #182). Version 13 drew the opponent's hand as a rock fist whenever their move was not known - in reveal and result
// always, even "You are alone in this round": a player who played paper read it as the opponent's rock.
// - WHO IS ACROSS, IN EVERY PHASE: reveal and result read the opponent as pick and wait do - 'in' once their move is in, 'here' when
//   someone is there, 'absent' (the ghost seat) when nobody came; version 13 said 'here' there whatever happened.
// - AN UNKNOWN MOVE IS NO MOVE: the opponent's hand rests open (the idle pose) until their move is known; the reveal still plays it.
// - THE "SEATS ARE SIGNING" LINE HAS A ROW OF ITS OWN (bitcoin-arena kanban #3564, feedback #423): version 11 to 13 fixed it 10 px above the
//   bottom of the window, where the pick panel's cost line also ends - drawn over each other at every window size (Chrome 1920x1000: cost
//   966.8-983 px, the line 973.2-990 px). It is a row of the page's column below the game, 17 px high while empty so nothing moves.
// Written from client/index-v13.html.
//
//   node tools/build-client-v14.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { FORBIDDEN } from './build-client-v4.mjs';

const V13 = new URL('../client/index-v13.html', import.meta.url);
const OUT = new URL('../client/index-v14.html', import.meta.url);

function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

const THEIRS_V13 = "      const theirs = s.phase === 'wait' || s.phase === 'pick' ? (s.phase === 'pick' ? (s.joined ? 'in' : present ? 'here' : 'absent') : (s.them > 0 ? 'in' : present ? 'here' : 'absent')) : 'here';\n";
const THEIRS_V14 = "      // VERSION 14: reveal and result read who is across as wait does - never 'here' for a seat nobody took\n"
  + "      const theirs = s.phase === 'pick' ? (s.joined ? 'in' : present ? 'here' : 'absent')\n"
  + "        : (s.theirs !== null && s.theirs !== undefined) || s.them > 0 ? 'in' : present ? 'here' : 'absent';\n";
const DRAW_V13 = "        me.set(want.mine); them.set(want.theirs === 'absent' || want.theirs === 'here' || want.theirs === 'in' ? 'rock' : want.theirs);\n";
const DRAW_V14 = "        // VERSION 14: a move not shown is drawn as no move - the open, resting hand - never as rock\n"
  + "        me.set(want.mine); them.set(want.theirs === 'absent' || want.theirs === 'here' || want.theirs === 'in' ? 'idle' : want.theirs);\n";

const SIGNED_V13 = "      { let el = document.getElementById('rps-signed'); if (!el) { el = document.createElement('div'); el.id = 'rps-signed'; el.setAttribute('role', 'status');\n"
  + "          el.style.cssText = 'position:fixed;left:0;right:0;bottom:10px;text-align:center;font:600 12px/1.4 system-ui,-apple-system,sans-serif;color:#8b95a5;pointer-events:none;z-index:5'; document.body.appendChild(el); }\n";
const SIGNED_V14 = "      // VERSION 14: the line is a row of its own below the game, never laid over the cost line at the foot of the pick panel\n"
  + "      { let el = document.getElementById('rps-signed'); if (!el) { el = document.createElement('div'); el.id = 'rps-signed'; el.setAttribute('role', 'status');\n"
  + "          el.style.cssText = 'flex:none;min-height:17px;margin-top:4px;text-align:center;font:600 12px/1.4 system-ui,-apple-system,sans-serif;color:#8b95a5;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; document.body.appendChild(el); }\n";

export function buildV14(v13) {
  let s = v13;
  s = once(s, THEIRS_V13, THEIRS_V14);
  s = once(s, DRAW_V13, DRAW_V14);
  s = once(s, SIGNED_V13, SIGNED_V14);
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV14(readFileSync(V13, 'utf8'));
  const left = out.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l));
  if (left.length) throw new Error(`still in the file: ${left.slice(0, 5).map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`).join(' | ')}`);
  writeFileSync(OUT, out);
  console.log(`client/index-v14.html written (${out.length} bytes)`);
}
