// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT VERSION 12: version 11 with three fixes to its round logic, nothing else.
// - NO KNOWN MOVE IS PLAYED AGAIN: version 11 carried the move of a round this tab was alone in into the next round, as if it had stayed hidden.
//   It had not: the round is revealed after its close, and every seat serves the move. A free round now gets a fresh hidden move, a paid round
//   none (a paid round takes an entry only from a tap); the carried entry is checked as a tap is - the table waits only for an entry that went in.
// - THE TAB REVEALS ONLY A ROUND THE SEATS HOLD WITH EVERY PLAYER IN: version 11 also revealed while the seats' result was not yet read, so a
//   round it was alone in could be revealed by the tab itself.
// - ONLY ROCK, PAPER OR SCISSORS COUNT: the result from the open moves is computed only when both are 0, 1 or 2, as the rules' own decide
//   requires; another value is not shown as the opponent's move and gives no WON / LOST.
// Written from client/index-v11.html.
//
//   node tools/build-client-v12.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { FORBIDDEN } from './build-client-v4.mjs';

const V11 = new URL('../client/index-v11.html', import.meta.url);
const OUT = new URL('../client/index-v12.html', import.meta.url);
function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected once, found ${n}: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

export function buildV12(v11) {
  let s = v11;
  // a comment version 11 left with a ticket number
  s = once(s, "else the rules' over both open moves (provisional) - kanban #2864\n", "else the rules' over both open moves (provisional)\n");
  // ONLY ROCK, PAPER OR SCISSORS COUNT
  s = once(s, "  const revealing = new Set();\n",
    "  const revealing = new Set();\n"
    + "  // VERSION 12: a move is 0, 1 or 2 (rock, paper, scissors), as the rules' decide requires - nothing else is shown or counted\n"
    + "  const isMove = (m) => (typeof m === 'number' || (typeof m === 'string' && m.trim() !== '')) && Number.isInteger(Number(m)) && Number(m) >= 0 && Number(m) < MOVES.length;\n"
    + "  // VERSION 12: a fresh hidden move, uniform over the three\n"
    + "  const freshMove = () => { const b = new Uint8Array(1); do crypto.getRandomValues(b); while (b[0] >= 255); return b[0] % MOVES.length; };\n");
  s = once(s, "          last.theirs = theirs.length ? theirs[0] : null;\n", "          last.theirs = theirs.length && isMove(theirs[0]) ? theirs[0] : null;\n");
  s = once(s, "last.theirs !== null && last.theirs !== undefined && Number.isInteger(Number(last.theirs)) && Number.isInteger(Number(h.move))) {",
    "isMove(last.theirs) && isMove(h.move)) {");
  // THE TAB REVEALS ONLY A ROUND THE SEATS HOLD WITH EVERY PLAYER IN
  s = once(s, "            if (!revealing.has(id)) { revealing.add(id); A.reveal(id)",
    "            if (held && entries.length >= players && !revealing.has(id)) { revealing.add(id); A.reveal(id)");
  // NO KNOWN MOVE IS PLAYED AGAIN
  s = once(s, "        if (last && last.phase === 'alone' && company && row && row.id !== last.id && !tapped && (",
    "        // VERSION 12: the move of a round this tab was alone in is public after its close: never carried. A free round gets a fresh hidden move,\n"
    + "        // a paid round none (it takes an entry only from a tap); the entry is checked as a tap is\n"
    + "        if (last && last.phase === 'alone' && company && row && row.free && row.id !== last.id && !tapped && (");
  s = once(s, "          if (Date.now() - since < CARRY_MS) { carry = { move: last.move, since, toId: row.id, closeMs: row.entryCloseMs, at: Date.now() }; A.hide(row.id, last.move); }\n",
    "          if (Date.now() - since < CARRY_MS) { const move = carry && carry.toId === row.id ? carry.move : freshMove();\n"
    + "            let ok = false; try { ok = !!A.hide(row.id, move); } catch {  }\n"
    + "            carry = { move, since, toId: row.id, closeMs: row.entryCloseMs, at: Date.now(), ok }; }\n");
  s = once(s, "        if (carry && carry.toId === (row && row.id) && Date.now() - carry.at < CARRY_RETRY_MS && !(h && h.roundIdHex === carry.toId))\n",
    "        let carryJoin = null; try { carryJoin = window.parent.ARENA_JOIN; } catch {  }\n"
    + "        if (carry && carry.ok && !(carryJoin && carryJoin.round === carry.toId && carryJoin.state === 'refused')\n"
    + "          && carry.toId === (row && row.id) && Date.now() - carry.at < CARRY_RETRY_MS && !(h && h.roundIdHex === carry.toId))\n");
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV12(readFileSync(V11, 'utf8'));
  const left = out.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l));
  if (left.length) throw new Error(`still in the file: ${left.slice(0, 5).map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`).join(' | ')}`);
  writeFileSync(OUT, out);
  console.log(`client/index-v12.html written (${out.length} bytes)`);
}
