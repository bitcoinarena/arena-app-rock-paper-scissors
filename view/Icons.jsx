// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// ROCK PAPER SCISSORS' ICONS, DRAWN (version 10): every picture the table showed as an emoji - the three hands, the steps, the trophy, the lock -
// is an inline SVG here. An emoji is a glyph of whatever emoji font the player's browser has; a browser without one (a playtest in Brave)
// drew empty boxes. An SVG needs no font. Each icon is 1em square, so the CSS font-size that sized the emoji sizes the icon.
import React from 'react';

const SKIN = { fill: '#ffc83d', stroke: '#a86b00', strokeWidth: 2.5, strokeLinejoin: 'round' };
const svg = (label, viewBox, children, extra = {}) => (
  <svg className="ico" viewBox={viewBox} width="1em" height="1em" role="img" aria-label={label} {...extra}>{children}</svg>);
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

/** A closed fist. */
export const Rock = ({ label = 'Rock' }) => svg(label, '0 0 64 64', <g {...SKIN}>
  <rect x="14" y="15" width="10" height="18" rx="5" /><rect x="23" y="12" width="10" height="20" rx="5" />
  <rect x="32" y="12" width="10" height="20" rx="5" /><rect x="41" y="15" width="9" height="18" rx="4.5" />
  <rect x="13" y="24" width="38" height="31" rx="11" />
  <path d="M13 36 q11 -3 20 3" fill="none" /><path d="M24 22 v6 M33 21 v6 M42 22 v6" fill="none" strokeWidth="1.6" /></g>);

/** An open hand. */
export const Paper = ({ label = 'Paper' }) => svg(label, '0 0 64 64', <g {...SKIN}>
  <rect x="6" y="29" width="8" height="22" rx="4" transform="rotate(-38 10 40)" />
  <rect x="17" y="11" width="8" height="30" rx="4" /><rect x="25.5" y="5" width="8" height="34" rx="4" />
  <rect x="34" y="6" width="8" height="33" rx="4" /><rect x="42.5" y="12" width="8" height="28" rx="4" />
  <rect x="16" y="28" width="35" height="29" rx="13" /></g>);

/** Two fingers up, a V. */
export const Scissors = ({ label = 'Scissors' }) => svg(label, '0 0 64 64', <g {...SKIN}>
  <rect x="17" y="5" width="9" height="34" rx="4.5" transform="rotate(-16 21.5 37)" />
  <rect x="33" y="5" width="9" height="34" rx="4.5" transform="rotate(14 37.5 37)" />
  <rect x="15" y="29" width="35" height="27" rx="11" />
  <rect x="38" y="27" width="11" height="13" rx="5.5" /><path d="M15 39 q10 -3 19 2" fill="none" /></g>);

/** The three hands by move index, as MOVES orders them. */
export const HANDS = Object.freeze([Rock, Paper, Scissors]);
export const Hand = ({ move }) => { const H = HANDS[move]; return H ? <H /> : null; };
export const Hands = () => <><Rock /><Paper /><Scissors /></>;

export const Hourglass = () => svg('Wait', '0 0 24 24', <path {...line} d="M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9s10 3 10 9" />);
export const Eye = () => svg('Reveal', '0 0 24 24', <g {...line}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></g>);
export const Flag = () => svg('Result', '0 0 24 24', <path {...line} d="M5 21V3M5 4h12l-3 4.5 3 4.5H5" />);
export const Check = () => svg('Done', '0 0 24 24', <path {...line} strokeWidth="3" d="M5 12.5l4.5 4.5L19 7" />);
export const Trophy = () => svg('Trophy', '0 0 24 24', <g {...line}><path d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4.5a3.5 3.5 0 0 0 4 5M16 5h3.5a3.5 3.5 0 0 1-4 5M12 13v4M8 21h8M9.5 17h5v4h-5z" /></g>);
export const Swords = () => svg('Playing', '0 0 24 24', <path {...line} d="M3 3l11 11M21 3L10 14M5 15l4 4M19 15l-4 4M3 21l3-3M21 21l-3-3" />);
export const Lock = () => svg('Locked in', '0 0 24 24', <g {...line}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></g>);
