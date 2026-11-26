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

// Cover for the Rainy Day set: a window nook on a rainy day that gets cosy,
// until the rain stops and a rainbow shows. Layers in a 320 x 180 box; see
// ./kit.ts.

import { floor, glow, O, type SetCover, shadow, twinkle } from "./kit.ts";

/** The glass of the three-pane window. Only the last layer repaints it. */
const GLASS = "M200 84 V24 C200 20 202 18 206 18 H298 C302 18 304 20 304 24 V84 Z";
const FRAME = `<path d="${GLASS}" fill="none" stroke="#F4F5F7" stroke-width="6" stroke-linejoin="round"/>
   <path d="${GLASS}" fill="none" stroke="${O}" stroke-width="1.6" stroke-linejoin="round" opacity=".5"/>
   <path d="M235 18 V84 M269 18 V84" stroke="#F4F5F7" stroke-width="4"/>`;
/** The sill sits on top of the frame, so it is drawn after it. */
const SILL = `<rect x="194" y="83" width="116" height="6" rx="2" fill="#F4F5F7" stroke="${O}" stroke-width="1.6"/>`;
const CAT = `<g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M232 98 C230 88 258 86 262 96 Z" fill="#8C7A6B"/><circle cx="260" cy="91" r="6" fill="#8C7A6B"/>
   <path d="M256 86 L257 81 L260 85 M262 85 L264 81 L265 86" fill="#8C7A6B"/>
   <path d="M232 97 C226 95 226 101 234 100" fill="none" stroke="#8C7A6B" stroke-width="3.4"/></g>
   <path d="M240 90 L240 96 M247 89 L247 96" stroke="#6E5E50" stroke-width="1.2"/>
   <path d="M257 91 Q258.5 92.4 260 91 M261.6 91 Q263 92.4 264.4 91" stroke="${O}" stroke-width="1" fill="none"/>`;
const LAMP_SHADE = `<path d="M165 64 L191 64 L185 50 L171 50 Z" fill="#F2D08A" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;

export const cover: SetCover = {
  labels: [
    "the window seat gets its cushions",
    "a plant, a lamp and a bookshelf arrive",
    "the tea is poured",
    "the cat curls up and the wellies come in",
    "the rain stops and a rainbow shows",
  ],
  layers: [
    // 0: a quiet room on a grey day; rain runs down a big three-pane window
    `<rect width="320" height="180" fill="#DCE2EA"/>
   <g fill="#CDD5E0">${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i % 12) * 28 + ((i / 12) % 2 ? 14 : 0) + 8}" cy="${Math.floor(i / 12) * 22 + 12}" r="1.6"/>`).join("")}</g>
   <rect y="134" width="320" height="4" fill="#C2C9D4"/>
   ${floor(138, 180, "#B9A58C", "#A08B72")}
   <path d="${GLASS}" fill="#A9BCD0"/><path d="M200 64 H304 V84 H200 Z" fill="#B8C9DA"/>
   <g stroke="#8297AE" stroke-width="1.6" stroke-linecap="round">${[
     [208, 26],
     [220, 40],
     [214, 58],
     [244, 30],
     [256, 52],
     [248, 72],
     [278, 24],
     [292, 44],
     [284, 66],
     [226, 66],
   ]
     .map(([x = 0, y = 0]) => `<path d="M${x} ${y} L${x - 4} ${y + 12}"/>`)
     .join("")}</g>
   <g fill="#D7E3EE" stroke="#8297AE" stroke-width=".8">${[
     [230, 48],
     [262, 36],
     [296, 72],
     [212, 76],
   ]
     .map(([x = 0, y = 0]) => `<circle cx="${x}" cy="${y}" r="2"/>`)
     .join("")}</g>
   ${FRAME}
   ${SILL}`,
    // 1: a built-in window seat with a cushion, pillows and a blanket
    `${shadow(250, 139, 62)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="190" y="104" width="122" height="34" rx="2" fill="#EDE6DA"/>
   <rect x="196" y="110" width="52" height="22" rx="2" fill="none" stroke="#C9BFAE" stroke-width="1.6"/><rect x="254" y="110" width="52" height="22" rx="2" fill="none" stroke="#C9BFAE" stroke-width="1.6"/>
   <rect x="188" y="97" width="126" height="9" rx="4" fill="#7DB8A8"/>
   <rect x="196" y="92" width="24" height="9" rx="4" fill="#E0A72E"/><rect x="284" y="92" width="22" height="9" rx="4" fill="#E7799B"/>
   <path d="M222 104 C236 100 252 102 262 106 L258 132 L226 128 Z" fill="#8FA4C7"/></g>
   <path d="M228 112 H256 M227 120 H256" stroke="#B3C2DC" stroke-width="1.6"/>`,
    // 2: a monstera, a low bookshelf and a floor lamp (off)
    `${shadow(152, 139, 20)}${shadow(100, 139, 34)}${shadow(178, 139, 12)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <g transform="translate(116 0)"><path d="M24 120 H48 L45 138 H27 Z" fill="#C46A45"/>
   <path d="M36 120 C22 108 12 92 18 78 C30 88 34 104 36 120 Z M36 120 C46 104 56 96 64 92 C62 106 50 116 36 120 Z M36 120 C34 100 38 84 44 74 C50 90 46 108 36 120 Z" fill="#4E8A4A"/></g>
   <rect x="68" y="98" width="64" height="40" rx="2" fill="#A9763F"/><rect x="72" y="102" width="56" height="15" fill="#6E4A2C"/><rect x="72" y="120" width="56" height="15" fill="#6E4A2C"/></g>
   <g stroke="${O}" stroke-width="1">${[
     [74, "#B5503D"],
     [80, "#3E6E8E"],
     [86, "#D9A33B"],
     [93, "#5E8F5A"],
     [99, "#8B5A8C"],
     [106, "#E6D2AE"],
   ]
     .map(([x = 0, c = 0]) => `<rect x="${x}" y="105" width="5" height="12" fill="${c}"/>`)
     .join("")}${[
     [76, "#5E8F5A"],
     [82, "#E6D2AE"],
     [88, "#B5503D"],
     [118, "#3E6E8E"],
   ]
     .map(([x = 0, c = 0]) => `<rect x="${x}" y="123" width="5" height="12" fill="${c}"/>`)
     .join("")}</g>
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round"><ellipse cx="178" cy="137" rx="10" ry="3" fill="#5E4630"/><path d="M178 136 V64" stroke="#5E4630" stroke-width="3"/></g>
   ${LAMP_SHADE}`,
    // 3: tea on the bookshelf, an open book on the cushion
    `<g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M78 98 C74 82 102 82 98 98 Z" fill="#D9774B"/>
   <path d="M97 92 L106 84 L108 88 L99 96 Z" fill="#D9774B"/>
   <path d="M77 88 C70 86 70 96 78 95" fill="none"/>
   <ellipse cx="88" cy="83" rx="5" ry="2" fill="#D9774B"/>
   <path d="M108 90 H120 L119 98 H109 Z" fill="#F4EDE0"/><path d="M120 92 C124 92 124 96 119 96" fill="none"/></g>
   <path d="M111 86 C109 82 113 80 111 76 M116 86 C114 82 118 80 116 76" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round"/>
   <path d="M268 97 L282 93 L296 97 V100 H268 Z" fill="#FFF7E3" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
   <path d="M282 93 V100" stroke="${O}" stroke-width="1"/>`,
    // 4: the cat curls up on the seat; wellies and an umbrella in a stand, a raincoat on a hook
    `${CAT}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M14 24 H34" stroke="#7A5333" stroke-width="4"/>
   <path d="M18 28 C12 34 10 60 13 74 H39 C42 60 40 34 34 28 Z" fill="#F5C542"/>
   <path d="M20 28 L26 40 L32 28" fill="#E0A72E"/></g>
   <path d="M26 40 V72" stroke="#C99A2A" stroke-width="1.4"/>
   ${shadow(30, 139, 30)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M18 116 L16 86 C16 80 24 80 24 86" fill="none" stroke="#3E6E8E" stroke-width="3"/>
   <path d="M14 114 L18 92 L24 114 Z" fill="#5B8FC0"/>
   <rect x="10" y="112" width="18" height="26" rx="3" fill="#9AA7B5"/>
   <path d="M34 116 H42 V132 L48 134 V138 H34 Z M44 116 H52 V132 L58 134 V138 H44 Z" fill="#B5476E"/></g>`,
    // 5: complete: the rain stops, a rainbow and the sun outside; the lamp is lit
    `<path d="${GLASS}" fill="#CFE5F5"/><path d="M200 68 H304 V84 H200 Z" fill="#BFDDB4"/>
   ${glow(284, 32, 14, "#FFE7A8", 0.9)}<circle cx="284" cy="32" r="8" fill="#FFE08A" stroke="${O}" stroke-width="1.4"/>
   <g fill="none" stroke-width="5" stroke-linecap="round" opacity=".9">
   <path d="M206 80 A46 46 0 0 1 298 80" stroke="#E98A8A"/><path d="M212 80 A40 40 0 0 1 292 80" stroke="#F2C46D"/>
   <path d="M218 80 A34 34 0 0 1 286 80" stroke="#9BD3A6"/><path d="M224 80 A28 28 0 0 1 280 80" stroke="#8FB8E0"/></g>
   ${twinkle(214, 30, 3)}${twinkle(250, 24, 2.4)}
   ${FRAME}${SILL}${CAT}
   ${glow(178, 60, 34, "#FFD98A")}${LAMP_SHADE}
   <rect width="320" height="180" fill="#FFD08A" opacity=".07"/>`,
  ],
};
