// Headstart, a study companion that helps you get started, stay focused and keep going.
// Copyright (C) 2026  ChonkieMonkie
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Cover for the Café set: a corner café that gets furnished, then comes alive
// in the evening. Layers in a 320 x 180 box; see ./kit.ts.

import { glow, O, type SetCover, shadow, twinkle } from "./kit.ts";

/** A rod (chair leg, pedestal) with the dark outline around it. */
const rod = (d: string, color: string, w = 3): string =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** The striped awning outside, seen through the top of the glass. */
const AWNING = `<g stroke="${O}" stroke-width="1.4" stroke-linejoin="round">${[16, 32, 48, 64, 80].map((x, i) => `<path d="M${x} 22 H${x + 16} V32 C${x + 16} 36 ${x} 36 ${x} 32 Z" fill="${i % 2 ? "#F4EDE0" : "#C9685A"}"/>`).join("")}</g>`;
const FRAME = `<rect x="16" y="22" width="82" height="70" fill="none" stroke="#8E6136" stroke-width="5" stroke-linejoin="round"/>
   <rect x="13.5" y="19.5" width="87" height="75" rx="1" fill="none" stroke="${O}" stroke-width="1.4" opacity=".55"/>
   <path d="M57 22 V92 M16 40 H98" stroke="#8E6136" stroke-width="3.5"/>`;
const SILL = `<rect x="9" y="90" width="96" height="6" rx="2" fill="#A9763F" stroke="${O}" stroke-width="1.8"/>`;

/** A pendant lamp hanging from the ceiling at x. */
const pendant = (x: number, lit: boolean): string =>
  `<path d="M${x} 0 V20" stroke="${O}" stroke-width="1.4"/>
   <circle cx="${x}" cy="31" r="3.4" fill="${lit ? "#FFE08A" : "#F4EDE0"}" stroke="${O}" stroke-width="1.4"/>
   <path d="M${x - 12} 31 C${x - 12} 17 ${x + 12} 17 ${x + 12} 31 Z" fill="#5E8F8A" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
   <path d="M${x - 7} 26 C${x - 6} 22 ${x - 3} 21 ${x} 21" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".6" stroke-linecap="round"/>`;

/** A bentwood chair standing on the floor; the back is on the left unless flipped. */
const chair = (x: number, flip: boolean): string => {
  const s = flip ? -1 : 1;
  const X = (dx: number) => x + s * dx;
  return `${shadow(X(10), 140, 11)}
   ${rod(`M${X(3)} 120 L${X(1)} 140 M${X(19)} 120 L${X(21)} 140`, "#7A5333")}
   ${rod(`M${X(4)} 118 C${X(0)} 108 ${X(0)} 101 ${X(6)} 100.5 C${X(12)} 100 ${X(12)} 108 ${X(9)} 118`, "#7A5333")}
   <rect x="${Math.min(X(0), X(22))}" y="116" width="22" height="5" rx="2.5" fill="#A9763F" stroke="${O}" stroke-width="1.8"/>`;
};

const croissant = (x: number, y: number): string =>
  `<path d="M${x - 7} ${y} C${x - 5} ${y - 7} ${x + 5} ${y - 7} ${x + 7} ${y} C${x + 3} ${y - 2.5} ${x - 3} ${y - 2.5} ${x - 7} ${y} Z" fill="#E0A72E" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
   <path d="M${x - 2} ${y - 5} L${x - 1} ${y - 2.5} M${x + 2} ${y - 5} L${x + 1} ${y - 2.5}" stroke="#B57A1E" stroke-width="1"/>`;
const donut = (x: number, y: number, icing: string): string =>
  `<circle cx="${x}" cy="${y}" r="4.6" fill="#D9A55B" stroke="${O}" stroke-width="1.4"/>
   <circle cx="${x}" cy="${y - 0.6}" r="3.6" fill="${icing}"/><circle cx="${x}" cy="${y - 0.6}" r="1.4" fill="#E3F0F2" stroke="${O}" stroke-width="1"/>`;

/**
 * The street seen through the shop window glass (x 16 to 98, y 22 to 92).
 * Nothing stands in front of the glass, so the last layer can repaint it.
 */
const street = (sky: string, near: string, far: string, win: string, walk: string): string =>
  `<rect x="16" y="22" width="82" height="70" fill="${sky}"/>
   <rect x="16" y="50" width="24" height="34" fill="${far}"/><rect x="40" y="42" width="30" height="42" fill="${near}"/><rect x="70" y="54" width="28" height="30" fill="${far}"/>
   <g fill="${win}">${[
     [21, 56],
     [30, 56],
     [21, 68],
     [30, 68],
     [45, 48],
     [57, 48],
     [45, 60],
     [57, 60],
     [45, 72],
     [57, 72],
     [75, 60],
     [86, 60],
     [75, 72],
     [86, 72],
   ]
     .map(([x = 0, y = 0]) => `<rect x="${x}" y="${y}" width="6" height="7" rx="1"/>`)
     .join("")}</g>
   <rect x="16" y="84" width="82" height="8" fill="${walk}"/>`;

export const cover: SetCover = {
  labels: [
    "the counter and the espresso machine arrive",
    "a bistro table, chairs and lamps move in",
    "the pastries and the menu board go up",
    "a plant moves in and the coffee is poured",
    "evening falls and the lamps glow",
  ],
  layers: [
    // 0: an empty corner shop: cream wall, tiled wainscot, a checked floor and a shop window on a grey morning
    `<rect width="320" height="180" fill="#F2E4CC"/>
   <rect width="320" height="6" fill="#E2CFAF"/>
   <rect y="100" width="320" height="38" fill="#E4E8E0"/>
   <path d="${Array.from({ length: 6 }, (_, r) => `M0 ${106 + r * 6.4} H320`).join(" ")}" stroke="#CDD3C9" stroke-width="1"/>
   <path d="${Array.from({ length: 6 }, (_, r) => Array.from({ length: 27 }, (_, c) => `M${c * 12 + (r % 2 ? 6 : 0)} ${100 + r * 6.4} v6.4`).join(" ")).join(" ")}" stroke="#CDD3C9" stroke-width="1"/>
   <rect y="97" width="320" height="4" fill="#A9763F"/>
   <rect y="138" width="320" height="42" fill="#E8D5B5"/>
   <g fill="#C9A27E">${Array.from({ length: 60 }, (_, i) => {
     const r = Math.floor(i / 20);
     const c = i % 20;
     return (r + c) % 2 ? "" : `<rect x="${c * 16}" y="${138 + r * 14}" width="16" height="14"/>`;
   }).join("")}</g>
   <path d="M0 138 H320" stroke="#A9763F" stroke-width="2.4"/>
   ${street("#DCE8EF", "#B5C2CC", "#C4CFD8", "#E6EEF3", "#C9C2B5")}
   <path d="M90 92 V60" stroke="#5E6A72" stroke-width="2"/><path d="M85 60 H95 L93 55 H87 Z" fill="#5E6A72"/>
   ${AWNING}
   <path d="M24 86 L40 46 M30 88 L44 58" stroke="#FFFFFF" stroke-width="2" opacity=".45"/>
   ${FRAME}${SILL}`,
    // 1: the counter along the right wall with an espresso machine on it
    `${shadow(262, 140, 62)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="204" y="98" width="122" height="40" fill="#5E8F8A"/>
   <rect x="198" y="91" width="128" height="8" rx="3" fill="#EDE8E0"/>
   <rect x="210" y="104" width="30" height="28" rx="2" fill="none" stroke="#4C7672" stroke-width="1.6"/><rect x="246" y="104" width="30" height="28" rx="2" fill="none" stroke="#4C7672" stroke-width="1.6"/><rect x="282" y="104" width="30" height="28" rx="2" fill="none" stroke="#4C7672" stroke-width="1.6"/>
   <rect x="256" y="50" width="8" height="6" rx="1" fill="#F4EDE0"/><rect x="268" y="50" width="8" height="6" rx="1" fill="#F4EDE0"/>
   <rect x="248" y="56" width="60" height="7" rx="3" fill="#8E9AA2"/>
   <rect x="252" y="62" width="52" height="24" rx="5" fill="#B8C2C8"/>
   <rect x="258" y="66" width="40" height="9" rx="2" fill="#8E9AA2"/>
   <rect x="263" y="75" width="8" height="6" fill="#5E6A72"/><rect x="285" y="75" width="8" height="6" fill="#5E6A72"/>
   <rect x="255" y="85" width="46" height="6" rx="1.5" fill="#5E6A72"/></g>
   <circle cx="278" cy="70.5" r="3" fill="#FFFFFF" stroke="${O}" stroke-width="1.2"/>
   <path d="M278 70.5 L279.6 69" stroke="${O}" stroke-width="1"/>
   <path d="M201 94 H226" stroke="#FFFFFF" stroke-width="1.6" opacity=".8" stroke-linecap="round"/>
   <path d="M256 66 V80" stroke="#FFFFFF" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>`,
    // 2: a bistro table with two chairs under the window, and two pendant lamps (still off)
    `${shadow(57, 139, 18)}
   ${chair(13, false)}${chair(101, true)}
   ${rod("M57 115 V136", "#5E6A72", 2.6)}${rod("M47 138 Q57 133 67 138", "#5E6A72", 2.6)}
   <rect x="33" y="110" width="48" height="5" rx="2.5" fill="#EDE8E0" stroke="${O}" stroke-width="2"/>
   ${pendant(136, false)}${pendant(184, false)}`,
    // 3: a pastry case on the counter and a chalk menu board on the wall
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <rect x="208" y="87" width="40" height="4" rx="1" fill="#A9763F"/>
   <rect x="210" y="65" width="36" height="22" rx="3" fill="#E3F0F2"/></g>
   <path d="M210 76 H246" stroke="${O}" stroke-width="1.4"/>
   ${croissant(219, 74)}${croissant(236, 74)}${donut(217, 82, "#E7799B")}${donut(228, 82, "#7A5333")}${donut(239, 82, "#9BD3A6")}
   <path d="M213 68 V73" stroke="#FFFFFF" stroke-width="1.6" opacity=".9" stroke-linecap="round"/>
   <path d="M236 10 L257 3 L278 10" fill="none" stroke="${O}" stroke-width="1.2"/><circle cx="257" cy="3" r="1.6" fill="${O}"/>
   <rect x="216" y="10" width="82" height="34" rx="3" fill="#3E4A44" stroke="#8E6136" stroke-width="3"/>
   <rect x="214" y="8" width="86" height="38" rx="4" fill="none" stroke="${O}" stroke-width="1.6"/>
   <g stroke="#F4F5F7" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".85">
   <path d="M223 18 H249 M223 25 H243 M223 32 H252 M223 38 H238"/>
   <path d="M256 18 H260 M256 25 H260 M256 32 H260"/>
   <path d="M270 24 H286 L284 34 H272 Z M286 26 C290 26 290 31 285 31 M274 20 C273 18 275 17 274 15 M280 20 C279 18 281 17 280 15"/></g>`,
    // 4: a fiddle-leaf plant beside the table, a cup steaming on the table and one on the counter
    `${shadow(130, 139, 10)}
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M130 122 V100" stroke="#5E4630" stroke-width="2"/>
   ${[
     [123, 108, -40],
     [137, 104, 40],
     [125, 98, -20],
     [135, 94, 25],
     [130, 90, 0],
   ]
     .map(
       ([x = 0, y = 0, a = 0]) =>
         `<ellipse cx="${x}" cy="${y}" rx="5" ry="8" transform="rotate(${a} ${x} ${y})" fill="#5E8F5A"/>`,
     )
     .join("")}
   <path d="M121 121 H139 L136 138 H124 Z" fill="#C46A45"/>
   <ellipse cx="50" cy="110" rx="8" ry="1.8" fill="#F4EDE0"/>
   <rect x="45" y="103" width="10" height="7" rx="1.5" fill="#F4EDE0"/><path d="M55 105 C59 105 59 109 55 109" fill="none"/>
   <rect x="306" y="84" width="10" height="7" rx="1.5" fill="#F4EDE0"/><path d="M306 86 C302 86 302 90 306 90" fill="none"/></g>
   <path d="M48 101 C46 99.5 50 99 48 97.5 M53 101 C51 99.5 55 99 53 97.5" stroke="#FFFFFF" stroke-width="1.4" fill="none" stroke-linecap="round"/>
   <path d="M309 81 C307 78 311 76 309 73 M314 81 C312 78 316 76 314 73" stroke="#9AA6AE" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    // 5: complete: evening outside, lit windows across the street, the lamps glow
    `${street("#3D4870", "#2C3456", "#353E62", "#2C3456", "#4A4E66")}
   <g fill="#F2C96A">${[
     [21, 56],
     [30, 68],
     [45, 48],
     [57, 60],
     [45, 72],
     [86, 60],
     [75, 72],
   ]
     .map(([x = 0, y = 0]) => `<rect x="${x}" y="${y}" width="6" height="7" rx="1"/>`)
     .join("")}</g>
   <circle cx="80" cy="46" r="4" fill="#F4EDE0"/><circle cx="82" cy="45" r="3.4" fill="#3D4870"/>
   ${glow(90, 61, 7, "#FFD98A", 0.9)}
   <path d="M90 92 V60" stroke="#20253C" stroke-width="2"/><path d="M85 60 H95 L93 55 H87 Z" fill="#20253C"/><circle cx="90" cy="61.5" r="2" fill="#FFE08A"/>
   ${AWNING}
   ${twinkle(27, 44, 1.8)}${twinkle(62, 38.5, 1.4)}
   ${FRAME}${SILL}
   ${glow(136, 34, 26, "#FFD98A")}${glow(184, 34, 26, "#FFD98A")}
   ${pendant(136, true)}${pendant(184, true)}
   <rect width="320" height="180" fill="#FFB347" opacity=".06"/>`,
  ],
};
