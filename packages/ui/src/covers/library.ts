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

// Cover for the Library set: a reading room that gets furnished, then night
// falls and the lamp glows. Layers in a 320 x 180 box; see ./kit.ts.

import { floor, glow, O, type SetCover, shadow, stars, twinkle } from "./kit.ts";

const BOOKS = ["#B5503D", "#3E6E8E", "#D9A33B", "#5E8F5A", "#8B5A8C", "#E6D2AE", "#6E8FA8"];
/** A shelf row of books standing on y, from x0 to x1. */
function shelf(x0: number, x1: number, y: number, seed: number): string {
  let out = "";
  let x = x0;
  let i = seed;
  while (x < x1 - 5) {
    const w = 5 + (i % 3);
    const h = 16 + ((i * 7) % 6);
    const lean = i % 9 === 4 && x + w + 6 < x1;
    const color = BOOKS[i % BOOKS.length];
    out += lean
      ? `<rect x="${x + 2}" y="${y - h}" width="${w}" height="${h}" fill="${color}" transform="rotate(14 ${x + 2 + w} ${y})"/>`
      : `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${color}"/><path d="M${x + 1.5} ${y - h + 4} H${x + w - 1.5}" stroke="#FFFFFF" stroke-width="1" opacity=".5"/>`;
    x += w + (lean ? 7 : 0.6);
    i++;
  }
  return out;
}
const WINDOW = "M224 96 V52 C224 28 292 28 292 52 V96 Z";
const FRAME = `<path d="${WINDOW}" fill="none" stroke="#7A5333" stroke-width="5" stroke-linejoin="round"/>
   <path d="M258 30 V96 M224 64 H292" stroke="#7A5333" stroke-width="3.5"/>`;
const LAMP = `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <ellipse cx="210" cy="107" rx="9" ry="2.6" fill="#B8893F"/>
   <path d="M210 106 V92" stroke="#B8893F" stroke-width="3"/>
   <path d="M196 94 C196 84 224 84 224 94 Z" fill="#3E7A52"/></g>
   <path d="M201 88 C204 86 208 85 212 85" stroke="#FFFFFF" stroke-width="1.6" opacity=".55" fill="none" stroke-linecap="round"/>`;

export const cover: SetCover = {
  labels: [
    "the shelves go up",
    "the books and the desk arrive",
    "the reading lamp lights up",
    "an armchair, a ladder and a cat move in",
    "night falls over the library",
  ],
  layers: [
    // 0: the empty room: panelled walls, a wooden floor, an arched window at dusk
    `<rect width="320" height="180" fill="#EBDCC5"/>
   <rect width="320" height="8" fill="#D9C4A3"/><path d="M0 8 H320" stroke="#BFA27C" stroke-width="2"/>
   <rect y="104" width="320" height="34" fill="#C59B70"/>
   <g fill="none" stroke="#A97E54" stroke-width="1.6">${[6, 52, 98, 144, 190, 236, 282].map((x) => `<rect x="${x}" y="110" width="38" height="22" rx="2"/>`).join("")}</g>
   <rect y="101" width="320" height="4" fill="#A9784A"/>
   ${floor(138, 180, "#9E6E45", "#86593A")}
   <path d="${WINDOW}" fill="#A8BCD9"/><path d="M226 96 V78 H290 V96 Z" fill="#E3C3BE" opacity=".7"/>
   <path d="M232 46 C238 40 246 36 254 35" stroke="#FFFFFF" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/>
   ${FRAME}
   <rect x="218" y="95" width="80" height="6" rx="2" fill="#8E6136" stroke="${O}" stroke-width="1.8"/>`,
    // 1: a tall bookcase and a rug
    `<ellipse cx="160" cy="160" rx="96" ry="13" fill="#9E3F38" stroke="${O}" stroke-width="2"/>
   <ellipse cx="160" cy="160" rx="80" ry="9" fill="none" stroke="#D9A65B" stroke-width="2"/>
   ${shadow(52, 141, 48)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="10" y="20" width="84" height="120" rx="2" fill="#8E6136"/>
   <rect x="16" y="30" width="72" height="106" fill="#5E3E24"/>
   ${[56, 82, 108].map((y) => `<rect x="14" y="${y}" width="76" height="4" fill="#A9763F"/>`).join("")}
   <rect x="6" y="15" width="92" height="8" rx="2" fill="#A9763F"/></g>
   <path d="M14 24 V136" stroke="#B88A57" stroke-width="2" opacity=".6"/>`,
    // 2: books on every shelf, and a desk under the window
    `<g stroke="${O}" stroke-width="1.1">${shelf(17, 88, 56, 0)}${shelf(17, 88, 82, 3)}${shelf(17, 88, 108, 6)}${shelf(17, 88, 136, 2)}</g>
   ${shadow(254, 141, 58)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="200" y="113" width="6" height="27" fill="#7A5333"/>
   <rect x="276" y="113" width="34" height="27" fill="#8E6136"/>
   <rect x="196" y="107" width="118" height="7" rx="2" fill="#A9763F"/>
   <rect x="281" y="119" width="24" height="7" rx="1.5" fill="#A9763F"/><rect x="281" y="129" width="24" height="7" rx="1.5" fill="#A9763F"/></g>
   <circle cx="293" cy="122.5" r="1.4" fill="${O}"/><circle cx="293" cy="132.5" r="1.4" fill="${O}"/>`,
    // 3: the reading lamp lights up; books and an open book on the desk
    `${glow(210, 100, 40, "#FFD98A")}
   ${LAMP}
   <g stroke="${O}" stroke-width="1.6" stroke-linejoin="round">
   <rect x="234" y="101" width="28" height="6" rx="1" fill="#3E6E8E"/><rect x="237" y="97" width="23" height="5" rx="1" fill="#B5503D"/>
   <path d="M268 106 L282 102 L296 106 L296 108 L268 108 Z" fill="#F7EEDC"/></g>
   <path d="M282 102 V108 M272 105 L280 103.4 M284 103.4 L292 105" stroke="${O}" stroke-width="1" opacity=".5"/>`,
    // 4: an armchair with a sleeping cat, a library ladder, a fern
    `<g stroke="${O}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
   <path d="M78 140 L96 18 M94 140 L110 22" stroke="#6E4A2C" stroke-width="3.2"/>
   <path d="M84 102 L99 104 M88 72 L103 75 M92 44 L106 47 M81 122 L97 124" stroke="#6E4A2C" stroke-width="2.6"/></g>
   ${shadow(136, 141, 34)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <path d="M112 122 V96 C112 86 160 86 160 96 V122 Z" fill="#3E6E8E"/>
   <rect x="104" y="112" width="14" height="26" rx="6" fill="#2F5A75"/><rect x="154" y="112" width="14" height="26" rx="6" fill="#2F5A75"/>
   <rect x="114" y="120" width="44" height="14" rx="5" fill="#4C81A3"/>
   <path d="M114 136 V141 M158 136 V141" stroke="#5E3E24" stroke-width="3"/></g>
   <path d="M118 92 C124 89 132 88 140 88" stroke="#FFFFFF" stroke-width="1.6" opacity=".45" fill="none" stroke-linecap="round"/>
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M122 121 C122 113 148 112 150 120 Z" fill="#9AA0A8"/><circle cx="148" cy="116" r="5" fill="#9AA0A8"/>
   <path d="M145 112 L146 108 L148.5 111 M150 111 L152 108 L152.6 112" fill="#9AA0A8"/>
   <path d="M122 120 C118 118 118 124 124 123" fill="none" stroke="#9AA0A8" stroke-width="3"/></g>
   <path d="M130 114 L130 119 M136 113 L136 119" stroke="#6E737B" stroke-width="1.2"/>
   <path d="M145.6 116 Q146.6 117 147.6 116 M149.4 116 Q150.4 117 151.4 116" stroke="${O}" stroke-width="1" fill="none"/>
   ${shadow(180, 141, 11)}
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M172 126 H188 L185 140 H175 Z" fill="#C46A45"/>
   <path d="M180 126 C170 118 166 108 168 102 C176 108 180 118 180 126 Z M180 126 C186 116 192 110 196 108 C194 118 188 124 180 126 Z M180 126 C178 114 180 104 184 98 C188 108 186 120 180 126 Z" fill="#5E9F5A"/></g>`,
    // 5: complete: night in the window, the lamp glows warm, golden dust in the air
    `<path d="${WINDOW}" fill="#2D3A66"/><path d="M226 96 V82 H290 V96 Z" fill="#3E4C7E"/>
   <circle cx="275" cy="46" r="7" fill="#FFF3D1"/><circle cx="278" cy="44" r="6" fill="#2D3A66"/>
   ${stars([
     [236, 42, 1.2],
     [246, 56, 1],
     [266, 74, 1.2],
     [282, 84, 1],
     [240, 82, 1],
     [252, 40, 0.9],
   ])}
   ${FRAME}
   ${glow(210, 100, 52, "#FFC96B", 1.2)}${LAMP}
   <rect width="320" height="180" fill="#3A2E5A" opacity=".08"/>
   ${twinkle(34, 12, 3, "#F5C542")}${twinkle(128, 40, 3.5, "#F5C542")}${twinkle(176, 24, 2.6, "#F5C542")}${twinkle(106, 70, 2.4, "#F5C542")}${twinkle(196, 58, 2.2, "#F5C542")}`,
  ],
};
