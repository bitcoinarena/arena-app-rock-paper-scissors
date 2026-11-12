// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' VIEWS FOR VERSION 10 (version 7's with the hands drawn as SVG and a paid round's stake and fees said), MOUNTED: version 4's table (window.RpsView.mount, ./main.jsx) and what is around it -
// window.RpsView.chrome(kindHost, overlayHost) answers { kind(state), toast(text), verdict(kind, word), demo({ n, a, b }) }, and
// window.RpsView.none(view) says the client runs only inside the Arena page. Built as one plain script (dist/rps-view-v10.js) and
// inlined into client/index-v10.html, whose hash its manifest pins.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { mount } from './main10.jsx';
import { KindChip, Overlays, NotInArena } from './RpsChrome-v10.jsx';
import { Hands } from './Icons.jsx';

export const TOAST_MS = 2600, VERDICT_MS = 2800;
export function chrome(kindHost, overlayHost, { later = setTimeout } = {}) {
  const kindRoot = createRoot(kindHost), ovRoot = createRoot(overlayHost);
  let toasts = [], verdict = null, demo = null, n = 0;
  const drawOv = () => flushSync(() => ovRoot.render(<Overlays toasts={toasts} verdict={verdict} demo={demo} />));
  flushSync(() => kindRoot.render(<KindChip />));
  return {
    // AT ONCE, as the client's own drawing was
    kind(s) { flushSync(() => kindRoot.render(<KindChip phase={s.phase} free={s.free} stake={s.stake} />)); },
    toast(text) { const t = { id: ++n, text }; toasts = [...toasts, t]; drawOv(); later(() => { toasts = toasts.filter((x) => x !== t); drawOv(); }, TOAST_MS); },
    verdict(kind, word) { const v = { id: ++n, kind, word }; verdict = v; drawOv(); later(() => { if (verdict === v) { verdict = null; drawOv(); } }, VERDICT_MS); },
    demo(step) { demo = step; drawOv(); },
  };
}
export function none(view) { const root = createRoot(view); flushSync(() => root.render(<NotInArena />)); }
/** The header's three hands, drawn (version 10: they were emoji, boxes in a browser without an emoji font). */
export function hands(el) { if (!el) return; const root = createRoot(el); flushSync(() => root.render(<Hands />)); }
if (typeof window !== 'undefined') window.RpsView = { mount, chrome, none, hands };
