// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' CLIENT, VERSION 5: written from version 4's client (client/index-v4.html) - everything drawn by React. Version 4
// drew its table with React and still built by hand the FREE / PAID chip, the "tap did not go in" line, the big verdict, the demo's line
// and the line outside the Arena page; those are RpsChrome.jsx now (window.RpsView.chrome / .none, dist/rps-view-v5.js, inlined in place
// of version 4's bundle, so the file still fetches no code its hash does not pin). Version 4's unused helpers go (el, the steps, the
// clock and the seats it drew in version 3, and the result timer whose element nothing made any more); the round logic is version 4's
// line for line.
//
//   node packages/rock-paper-scissors/tools/build-view.mjs && node packages/rock-paper-scissors/tools/build-client-v5.mjs
// Writes client/index-v5.html; a new hash, so the manifest is signed next (tools/sign-manifest-v5.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { FORBIDDEN } from './build-client-v4.mjs';

const V4 = new URL('../client/index-v4.html', import.meta.url);
const OUT = new URL('../client/index-v5.html', import.meta.url);
const BUNDLE_V4 = new URL('../dist/rps-view.js', import.meta.url);
const BUNDLE_V5 = new URL('../dist/rps-view-v5.js', import.meta.url);

/** Replace exactly one occurrence, or stop: a v4 that changed under this tool is not rewritten blind. */
function once(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected one ${JSON.stringify(from.slice(0, 60))}, found ${n}`);
  return text.replace(from, () => to);
}
/** From one marker to another (the first included, the second not), replaced. */
function between(text, from, to, replacement) {
  const a = text.indexOf(from); const b = text.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`no ${JSON.stringify(from.slice(0, 40))} ... ${JSON.stringify(to.slice(0, 40))}`);
  return text.slice(0, a) + replacement + text.slice(b);
}

export function buildV5(v4, bundleV4, bundleV5) {
  let s = v4;
  // THE VIEWS' BUNDLE: version 5's in place of version 4's
  s = once(s, bundleV4.trim(), bundleV5.trim());
  // THE HOSTS: the chip's in the header, the overlays' after the table
  s = once(s, '<span class="chip" id="kind" hidden></span>', '<span id="kind-host" style="display:contents"></span>');
  s = once(s, '  <div id="view"></div>\n', '  <div id="view"></div>\n  <div id="overlays"></div>\n');
  // VERSION 4'S UNUSED HELPERS: from the ring's constants to the seat builder (the revealing set stays)
  s = once(s, '  const R = 36, C = 2 * Math.PI * R;\n', '');
  s = between(s, '  const mmss = (ms) =>', '\n  if (!A || !A.headToHead) {', '');
  s = once(s, '  const revealing = new Set();\n\n  if (!A || !A.headToHead) {', '  const revealing = new Set();\n\n  if (!A || !A.headToHead) {');
  // OUTSIDE THE ARENA PAGE
  s = once(s, "    $('view').append(el('div', 'none', '<span class=\"big\">✊✋✌️</span>This client runs inside the Bitcoin Arena page, which hands it the game.'));",
    "    window.RpsView.none($('view'));");
  // THE CHROME, as soon as the game is there
  s = once(s, '    window.RPS_CLIENT = { hash: A.clientHash, game: A.game.id };\n',
    "    window.RPS_CLIENT = { hash: A.clientHash, game: A.game.id };\n    const chrome = window.RpsView.chrome($('kind-host'), $('overlays'));\n");
  // THE VERDICT
  s = once(s, "      const b = el('div', 'verdict-big ' + kind, '<b>' + word + '</b>');\n      document.body.append(b);\n", '      chrome.verdict(kind, word);\n');
  s = once(s, '      setTimeout(() => b.remove(), 2800);\n', '');
  // A TAP THAT DID NOT GO IN
  s = once(s, "    const note = (text) => { const n = el('div', 'demo-label'); n.textContent = text; document.body.append(n); setTimeout(() => n.remove(), 2600); };",
    '    const note = (text) => chrome.toast(text);');
  // THE RESULT TIMER NOTHING MADE: `live` and `due` were only ever null
  s = once(s, '    let live = null;\n', '');
  s = once(s, '    let due = null;\n', '');
  s = once(s, '      if (live) tickClock(live.clock, live.closeMs, live.openMs);\n      tickDue();\n', '');
  s = between(s, '    const tickDue = () => {', "    const table = window.RpsView.mount(", '');
  s = once(s, '      live = null;\n      due = null;\n', '');
  // THE CHIP
  s = once(s, "      const kind = $('kind');\n      kind.hidden = s.phase === 'none';\n      kind.className = 'chip ' + (s.free ? 'free' : 'paid');\n      kind.textContent = s.free ? 'FREE' : 'PAID';\n",
    '      chrome.kind(s);\n');
  // THE DEMO'S LINE
  s = once(s, "      const label = el('div', 'demo-label'); document.body.append(label);\n", '');
  s = once(s, "          label.innerHTML = '<b>' + (n + 1) + ' / 9</b> You ' + MOVES[a][1] + ' ' + MOVES[a][0] + ' <i>vs</i> ' + MOVES[b][0] + ' ' + MOVES[b][1] + ' them';",
    '          chrome.demo({ n, a, b });');
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildV5(readFileSync(V4, 'utf8'), readFileSync(BUNDLE_V4, 'utf8'), readFileSync(BUNDLE_V5, 'utf8'));
  const left = out.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => FORBIDDEN.test(l));
  if (left.length) throw new Error(`still in the file: ${left.slice(0, 5).map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`).join(' | ')}`);
  writeFileSync(OUT, out);
  console.log(`client/index-v5.html: ${out.length} bytes`);
}
