// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS AROUND ITS TABLE, IN REACT (version 5's client): what version 4 still drew by hand - the FREE / PAID chip in the
// header, the line that says a tap did not go in, the big WON / LOST / DRAW over the stage, the demo's "n / 9" line, and the line shown
// when the client is opened outside the Arena page. The table itself is RpsView.jsx, as in version 4.
import React from 'react';
import { MOVES } from './RpsView.jsx';

/** The header's chip: { phase, free } - hidden before the first round is drawn and with no round ('none'). */
export const KindChip = ({ phase, free }) => (
  <span className={phase === undefined ? 'chip' : `chip ${free ? 'free' : 'paid'}`} id="kind" hidden={phase === undefined || phase === 'none'}>
    {phase === undefined ? '' : free ? 'FREE' : 'PAID'}</span>);

/** The verdict over the stage: { kind: 'win' | 'loss' | 'draw', word }. */
export const BigVerdict = ({ kind, word }) => <div className={`verdict-big ${kind}`}><b>{word}</b></div>;

/** The demo's line: { n, a, b } - the n-th of the nine pairs, the player's move a against b. */
export const DemoLine = ({ n, a, b }) => (
  <div className="demo-label"><b>{n + 1} / 9</b> You {MOVES[a][1]} {MOVES[a][0]} <i>vs</i> {MOVES[b][0]} {MOVES[b][1]} them</div>);

/** Everything over the page: { toasts: [{ id, text }], verdict: { id, kind, word } | null, demo: { n, a, b } | null }. */
export class Overlays extends React.Component {
  render() {
    const { toasts = [], verdict = null, demo = null } = this.props;
    return (
      <>
        {demo ? <DemoLine {...demo} /> : null}
        {toasts.map((t) => <div key={t.id} className="demo-label">{t.text}</div>)}
        {verdict ? <BigVerdict key={verdict.id} kind={verdict.kind} word={verdict.word} /> : null}
      </>);
  }
}

/** Opened outside the Arena page: nothing to play. */
export const NotInArena = () => (
  <div className="none"><span className="big">✊✋✌️</span>This client runs inside the Bitcoin Arena page, which hands it the game.</div>);
