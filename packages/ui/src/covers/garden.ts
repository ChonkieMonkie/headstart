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

// Cover for the Garden set: an empty greenhouse that fills with seedlings,
// pots, blooms and visitors, then the sun pours in. Layers in a 320 x 180 box;
// see ./kit.ts.

import { glow, O, type SetCover, shadow } from "./kit.ts";

/** A tulip with its stem from (x, base) up to height h. */
const tulip = (x: number, base: number, h: number, color: string) =>
  `<path d="M${x} ${base} V${base - h}" stroke="#4E8A4A" stroke-width="2.4"/>
   <path d="M${x} ${base - 6} C${x - 8} ${base - 10} ${x - 8} ${base - 18} ${x - 3} ${base - 20}" stroke="#4E8A4A" stroke-width="2" fill="none"/>
   <path d="M${x - 5} ${base - h} L${x - 5} ${base - h - 8} L${x - 2} ${base - h - 5} L${x} ${base - h - 9} L${x + 2} ${base - h - 5} L${x + 5} ${base - h - 8} L${x + 5} ${base - h} C${x + 5} ${base - h + 4} ${x - 5} ${base - h + 4} ${x - 5} ${base - h} Z" fill="${color}" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>`;
/** A small daisy at (x, y). */
const daisy = (x: number, y: number, color = "#FFFFFF") =>
  `<g stroke="${O}" stroke-width="1">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 3}" rx="1.8" ry="3" fill="${color}" transform="rotate(${a} ${x} ${y})"/>`).join("")}<circle cx="${x}" cy="${y}" r="1.6" fill="#F5C542"/></g>`;
const sprout = (x: number, y: number) =>
  `<path d="M${x} ${y} V${y - 7}" stroke="#4E8A4A" stroke-width="1.8"/><path d="M${x} ${y - 6} C${x - 6} ${y - 10} ${x - 7} ${y - 5} ${x} ${y - 6} Z M${x} ${y - 6} C${x + 6} ${y - 10} ${x + 7} ${y - 5} ${x} ${y - 6} Z" fill="#7DC46A" stroke="${O}" stroke-width="1"/>`;
const butterfly = (x: number, y: number, color: string) =>
  `<g stroke="${O}" stroke-width="1.2"><ellipse cx="${x - 4}" cy="${y - 2}" rx="4.5" ry="3.6" fill="${color}"/><ellipse cx="${x + 4}" cy="${y - 2}" rx="4.5" ry="3.6" fill="${color}"/><ellipse cx="${x - 3}" cy="${y + 3}" rx="3" ry="2.4" fill="${color}"/><ellipse cx="${x + 3}" cy="${y + 3}" rx="3" ry="2.4" fill="${color}"/></g><path d="M${x} ${y - 4} V${y + 5}" stroke="${O}" stroke-width="1.8"/>`;

export const cover: SetCover = {
  labels: [
    "the first seedlings sprout",
    "the potting bench and vines go up",
    "the tulips and a sunflower bloom",
    "butterflies, a bee and a gnome arrive",
    "the sun pours in and everything blooms",
  ],
  layers: [
    // 0: an empty greenhouse: glass walls and roof, a brick base, two raised beds
    `<rect width="320" height="180" fill="#DDF0F2"/>
   <path d="M0 96 C50 84 110 92 160 86 C220 80 270 90 320 84 V100 H0 Z" fill="#BFDDB4"/>
   <rect y="100" width="320" height="38" fill="#B87A5A"/>
   <path d="M0 113 H320 M0 126 H320 ${Array.from({ length: 11 }, (_, i) => `M${i * 32 + 16} 100 V113 M${i * 32} 113 V126 M${i * 32 + 16} 126 V138`).join(" ")}" stroke="#9E634A" stroke-width="1.4" fill="none"/>
   <rect y="138" width="320" height="42" fill="#C98A6A"/>
   <path d="M0 152 H320 M0 166 H320 ${Array.from({ length: 9 }, (_, i) => `M${i * 40 + 20} 138 V152 M${i * 40} 152 V166 M${i * 40 + 20} 166 V180`).join(" ")}" stroke="#A86F52" stroke-width="1.4" fill="none"/>
   <g stroke="#6F9C80" stroke-width="4" fill="none" stroke-linejoin="round">
   <path d="M0 44 L160 8 L320 44"/><path d="M0 100 H320 M0 44 V100 M64 30 V100 M128 16 V100 M192 16 V100 M256 30 V100 M320 44 V100 M160 8 V100"/></g>
   <path d="M20 60 L44 40 M220 50 L250 34" stroke="#FFFFFF" stroke-width="2.4" opacity=".6" stroke-linecap="round"/>
   ${shadow(58, 151, 52)}${shadow(262, 151, 52)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="8" y="130" width="100" height="20" rx="2" fill="#A9763F"/><rect x="12" y="126" width="92" height="7" rx="2" fill="#6E4A2C"/>
   <rect x="212" y="130" width="100" height="20" rx="2" fill="#A9763F"/><rect x="216" y="126" width="92" height="7" rx="2" fill="#6E4A2C"/></g>
   <path d="M8 140 H108 M212 140 H312" stroke="#8E6136" stroke-width="1.4"/>`,
    // 1: seedlings in both beds, with little plant markers
    `${[22, 38, 54, 70, 86].map((x) => sprout(x, 127)).join("")}${[228, 244, 260, 276, 292].map((x) => sprout(x, 127)).join("")}
   <g stroke="${O}" stroke-width="1.2"><path d="M100 127 V112 M302 127 V112" stroke="#C59A68" stroke-width="2"/><rect x="95" y="108" width="10" height="7" rx="1" fill="#F2C14E"/><rect x="297" y="108" width="10" height="7" rx="1" fill="#E7799B"/></g>`,
    // 2: a potting bench with clay pots, vines up the posts, a watering can
    `<g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <path d="M22 100 V124 M106 100 V124" stroke="#7A5333" stroke-width="3.4"/>
   <rect x="16" y="94" width="96" height="7" rx="2" fill="#A9763F"/>
   <path d="M26 82 H44 L41 94 H29 Z M54 80 H74 L71 94 H57 Z M84 84 H100 L97 94 H87 Z" fill="#C46A45"/></g>
   <path d="M26 82 H44 M54 80 H74 M84 84 H100" stroke="#E08A60" stroke-width="2"/>
   ${[128, 192].map((x) => `<path d="M${x} 100 C${x - 6} 86 ${x + 6} 76 ${x} 62 C${x - 6} 50 ${x + 6} 40 ${x} 26" stroke="#4E8A4A" stroke-width="2.4" fill="none"/>${[90, 74, 58, 42].map((y, i) => `<ellipse cx="${x + (i % 2 ? -5 : 5)}" cy="${y}" rx="4.5" ry="2.6" fill="#7DC46A" stroke="${O}" stroke-width="1"/>`).join("")}`).join("")}
   ${shadow(130, 151, 16)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M120 138 H140 L142 150 H118 Z" fill="#6FA8C9"/>
   <path d="M140 141 L154 132 L156 135 L142 146 Z" fill="#6FA8C9"/>
   <path d="M124 138 C124 128 136 128 136 138" fill="none" stroke="#5B8FB0" stroke-width="3"/></g>`,
    // 3: tulips open in the left bed, roses in the pots, a sunflower in the right bed
    `${tulip(22, 127, 18, "#E5533D")}${tulip(38, 127, 22, "#F2C14E")}${tulip(54, 127, 19, "#E7799B")}${tulip(70, 127, 23, "#E5533D")}${tulip(86, 127, 18, "#F2C14E")}
   <g stroke="${O}" stroke-width="1.4">${[
     [35, 78],
     [64, 76],
     [92, 80],
   ]
     .map(
       ([x = 0, y = 0]) =>
         `<path d="M${x} ${y + 5} V${y + 2}" stroke="#4E8A4A" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4.6" fill="#E7799B"/><path d="M${x - 2} ${y} C${x} ${y - 3} ${x + 3} ${y} ${x} ${y + 2}" fill="none" stroke="#B5476E"/>`,
     )
     .join("")}</g>
   <path d="M270 127 V62" stroke="#4E8A4A" stroke-width="3.4"/>
   <path d="M270 100 C258 96 256 88 258 84 C266 88 270 94 270 100 Z M270 88 C282 84 284 76 282 72 C274 76 270 82 270 88 Z" fill="#62A85A" stroke="${O}" stroke-width="1.4"/>
   <g stroke="${O}" stroke-width="1.4">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="270" cy="47" rx="4" ry="9" fill="#F5C542" transform="rotate(${i * 30} 270 58)"/>`).join("")}</g>
   <circle cx="270" cy="58" r="8" fill="#8E5A2C" stroke="${O}" stroke-width="1.8"/>
   <g fill="#5E3A1C">${[
     [267, 55],
     [273, 56],
     [270, 61],
     [266, 60],
     [274, 61],
   ]
     .map(([x = 0, y = 0]) => `<circle cx="${x}" cy="${y}" r="1"/>`)
     .join("")}</g>`,
    // 4: butterflies, a bee by the sunflower, a garden gnome by the right bed
    `${butterfly(170, 64, "#F2A541")}${butterfly(96, 34, "#B39DDB")}
   <g stroke="${O}" stroke-width="1.2"><ellipse cx="292" cy="44" rx="5" ry="3.6" fill="#F5C542"/><ellipse cx="290" cy="39" rx="3" ry="2" fill="#FFFFFF"/><ellipse cx="295" cy="39" rx="3" ry="2" fill="#FFFFFF"/></g>
   <path d="M290 41 V47 M294 41 V47" stroke="${O}" stroke-width="1.4"/>
   ${shadow(204, 151, 10)}
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M196 150 V138 C196 132 212 132 212 138 V150 Z" fill="#5B7FC0"/>
   <circle cx="204" cy="130" r="6" fill="#F3D2B8"/>
   <path d="M196 129 L204 108 L212 129 Z" fill="#E5533D"/>
   <path d="M198 132 C200 142 208 142 210 132" fill="#FFFFFF"/></g>
   <path d="M201 116 L203 110" stroke="#FFFFFF" stroke-width="1.4" opacity=".6" stroke-linecap="round"/>`,
    // 5: complete: hanging baskets, daisies everywhere, soft sunbeams
    `<path d="M136 14 L152 12 L190 136 L166 136 Z" fill="#FFF6CF" opacity=".28"/>
   ${glow(146, 14, 30, "#FFF3B0", 0.8)}
   ${[64, 226]
     .map(
       (
         x,
       ) => `<path d="M${x} ${x === 64 ? 30 : 30} L${x - 8} 50 M${x} 30 L${x + 8} 50" stroke="${O}" stroke-width="1.2"/>
   <path d="M${x - 12} 50 H${x + 12} C${x + 12} 60 ${x - 12} 60 ${x - 12} 50 Z" fill="#8E6136" stroke="${O}" stroke-width="1.8"/>
   <path d="M${x - 9} 54 C${x - 12} 62 ${x - 8} 68 ${x - 10} 74 M${x + 9} 54 C${x + 12} 62 ${x + 8} 66 ${x + 10} 72" stroke="#4E8A4A" stroke-width="1.8" fill="none"/>
   ${[
     [x - 6, 49],
     [x, 47],
     [x + 6, 49],
     [x - 10, 72],
     [x + 10, 70],
   ]
     .map(
       ([cx = 0, cy = 0], i) =>
         `<circle cx="${cx}" cy="${cy}" r="3.2" fill="${["#E7799B", "#F2C14E", "#B39DDB"][i % 3]}" stroke="${O}" stroke-width="1"/>`,
     )
     .join("")}`,
     )
     .join("")}
   ${[230, 246, 262, 284, 300].map((x, i) => daisy(x, 124 - (i % 2) * 4)).join("")}${[14, 30, 46, 62, 78, 94].map((x, i) => daisy(x, 132 + (i % 2) * 2, i % 2 ? "#F7C6D9" : "#FFFFFF")).join("")}`,
  ],
};
