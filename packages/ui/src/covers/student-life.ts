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

// Cover for the Student Life set: a dorm room that gets moved into, decorated
// and finally lit up for a late night. Layers in a 320 x 180 box; see ./kit.ts.

import { floor, glow, O, type SetCover, shadow, twinkle } from "./kit.ts";

/** A rod (leg, stem, lamp arm) with the dark outline around it. */
const rod = (d: string, color: string, w = 3): string =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** The window above the bed (glass x 20 to 96, y 18 to 82). Nothing stands in front of it. */
const view = (sky: string, tree: string, grass: string, brick: string, win: string): string =>
  `<rect x="20" y="18" width="76" height="64" fill="${sky}"/>
   <rect x="20" y="74" width="76" height="8" fill="${grass}"/>
   <rect x="62" y="44" width="34" height="34" fill="${brick}"/><path d="M60 44 H96 L96 38 H66 Z" fill="${brick}"/>
   <g fill="${win}">${[
     [66, 50],
     [76, 50],
     [86, 50],
     [66, 62],
     [76, 62],
     [86, 62],
   ]
     .map(([x = 0, y = 0]) => `<rect x="${x}" y="${y}" width="6" height="7" rx="1"/>`)
     .join("")}</g>
   <path d="M34 80 V64" stroke="${tree}" stroke-width="3"/>
   <circle cx="32" cy="58" r="11" fill="${tree}"/><circle cx="43" cy="64" r="8" fill="${tree}"/>`;
const FRAME = `<rect x="20" y="18" width="76" height="64" fill="none" stroke="#F4F5F7" stroke-width="5" stroke-linejoin="round"/>
   <rect x="17.5" y="15.5" width="81" height="69" rx="1" fill="none" stroke="${O}" stroke-width="1.4" opacity=".5"/>
   <path d="M58 18 V82 M20 50 H96" stroke="#F4F5F7" stroke-width="3.5"/>`;
const SILL = `<rect x="14" y="81" width="88" height="6" rx="2" fill="#F4F5F7" stroke="${O}" stroke-width="1.6"/>`;

/** String lights pinned at both ends above the desk. */
const P = [
  [206, 10],
  [240, 24],
  [282, 24],
  [316, 10],
] as const;
const along = (t: number): [number, number] => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((a) => P.reduce((sum, p, i) => sum + (k[i] ?? 0) * (p[a] ?? 0), 0)) as [
    number,
    number,
  ];
};
const BULBS = Array.from({ length: 9 }, (_, i) => along(0.08 + i * 0.105));
const BULB_COLORS = ["#F5C86B", "#E58F7B", "#9CC3A6", "#8FB8E0"];
const lights = (lit: boolean): string =>
  `<path d="M${P[0][0]} ${P[0][1]} C${P[1][0]} ${P[1][1]} ${P[2][0]} ${P[2][1]} ${P[3][0]} ${P[3][1]}" fill="none" stroke="#6E5E50" stroke-width="1.2"/>
   <circle cx="206" cy="10" r="1.8" fill="${O}"/><circle cx="316" cy="10" r="1.8" fill="${O}"/>
   ${BULBS.map(([x, y], i) => `${lit ? glow(x, y + 3.4, 6, BULB_COLORS[i % 4] ?? "#F5C86B", 0.8) : ""}<rect x="${x - 1.6}" y="${y}" width="3.2" height="1.8" fill="${O}"/><ellipse cx="${x}" cy="${y + 4}" rx="2.4" ry="3" fill="${BULB_COLORS[i % 4]}" stroke="${O}" stroke-width="1" opacity="${lit ? 1 : 0.75}"/>`).join("")}`;

/** A stack of books on the desk; drawn again over the lamp glow. */
const BOOKS = `<g stroke="${O}" stroke-width="2" stroke-linejoin="round"><rect x="274" y="88" width="18" height="7" rx="1" fill="#5E8F8A"/><rect x="276" y="81" width="15" height="7" rx="1" fill="#F5C86B"/><rect x="273" y="75" width="17" height="6" rx="1" fill="#B5476E"/></g>
   <path d="M278 91.5 H290 M279 84.5 H289" stroke="#FFFFFF" stroke-width="1" opacity=".6"/>`;

/** The anglepoise lamp's base, arm and shade; lit, it gets a bulb and a glow behind it. */
const shade = (lit: boolean): string =>
  `${lit ? glow(296, 80, 24, "#FFD98A") : ""}
   ${lit ? BOOKS : ""}
   <ellipse cx="303" cy="94" rx="8" ry="2.4" fill="#5E6A72" stroke="${O}" stroke-width="2"/>
   ${rod("M302 93 L310 79 L304 67", "#5E6A72", 2.4)}
   <g transform="rotate(30 304 66)"><path d="M293 70 C293 58 315 58 315 70 Z" fill="#E58F7B" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
   <circle cx="304" cy="71" r="3" fill="${lit ? "#FFE08A" : "#F4EDE0"}" stroke="${O}" stroke-width="1.2"/></g>`;

export const cover: SetCover = {
  labels: [
    "the bed, the desk and a rug move in",
    "the laptop, the books and a lamp come out",
    "a corkboard and a poster go up",
    "a plant, a backpack and string lights",
    "night falls and the lights glow",
  ],
  layers: [
    // 0: an empty dorm room with a window on the campus
    `<rect width="320" height="180" fill="#E6DEEC"/>
   <g fill="#DCD2E4">${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 20 + 8}" y="0" width="4" height="133"/>`).join("")}</g>
   <rect y="132" width="320" height="6" fill="#F4F1EA"/>
   ${floor(138, 180, "#C8A98A", "#B08E70")}
   ${view("#CFE4F2", "#7FAE7A", "#A9C98F", "#C98F7A", "#EAD7CC")}
   <ellipse cx="40" cy="30" rx="10" ry="4" fill="#FFFFFF" opacity=".9"/><ellipse cx="48" cy="27" rx="7" ry="4" fill="#FFFFFF" opacity=".9"/>
   ${FRAME}${SILL}`,
    // 1: a bed under the window, a desk with drawers and an office chair, a round rug
    `<ellipse cx="164" cy="160" rx="54" ry="10" fill="#D8A7A0" stroke="${O}" stroke-width="2"/>
   <ellipse cx="164" cy="160" rx="42" ry="7" fill="none" stroke="#F4EDE0" stroke-width="2" stroke-dasharray="4 4"/>
   ${shadow(60, 140, 56)}${shadow(262, 140, 54)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="4" y="92" width="10" height="48" rx="3" fill="#A9763F"/>
   <rect x="108" y="104" width="8" height="36" rx="3" fill="#A9763F"/>
   <rect x="12" y="112" width="98" height="9" fill="#8E6136"/>
   <rect x="14" y="104" width="94" height="9" rx="2" fill="#F4F1EA"/>
   <rect x="16" y="97" width="24" height="10" rx="4" fill="#F4EDE0"/>
   <path d="M40 103 C42 97 60 97 74 98.5 C90 97 102 98 106 102 V118 H40 Z" fill="#6E9BC4"/></g>
   <path d="M48 108 H102 M48 113 H102" stroke="#A7C3DE" stroke-width="1.6" stroke-dasharray="5 4"/>
   ${rod("M18 121 V139 M102 121 V139", "#8E6136", 3)}
   ${rod("M216 102 V139", "#8E6136", 3.4)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="276" y="101" width="36" height="38" fill="#B98C64"/>
   <path d="M276 114 H312 M276 127 H312" fill="none"/>
   <rect x="208" y="95" width="108" height="7" rx="2" fill="#C9A27E"/></g>
   <path d="M290 108 H298 M290 121 H298 M290 134 H298" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>
   ${rod("M249 122 V132", "#5E6A72", 3)}${rod("M236 136 L249 132 L262 136", "#5E6A72", 3)}
   <g stroke="${O}" stroke-width="1.6"><circle cx="236" cy="138" r="2.4" fill="#3E4A55"/><circle cx="262" cy="138" r="2.4" fill="#3E4A55"/><circle cx="249" cy="139" r="2.4" fill="#3E4A55"/></g>
   <rect x="234" y="104" width="30" height="20" rx="6" fill="#5E8F8A" stroke="${O}" stroke-width="2.2"/>
   <path d="M239 108 C241 106 245 106 248 106" stroke="#FFFFFF" stroke-width="1.4" opacity=".55" fill="none" stroke-linecap="round"/>
   <path d="M211 98 H236" stroke="#FFFFFF" stroke-width="1.4" opacity=".6" stroke-linecap="round"/>`,
    // 2: a laptop (seen from behind, with a sticker), a stack of books and an anglepoise lamp
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M234 95 L238 91 H268 L272 95 Z" fill="#8E9AA2"/>
   <rect x="239" y="72" width="28" height="20" rx="2.5" fill="#B7BFCB"/>
   <circle cx="253" cy="82" r="4" fill="#E58F7B" stroke-width="1.4"/>
</g>
   ${BOOKS}
   ${shade(false)}`,
    // 3: a corkboard with notes and a photo, and a mountain poster
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <rect x="214" y="27" width="58" height="38" rx="2" fill="#C9A178" stroke="#8E6136" stroke-width="3"/>
   <rect x="212" y="25" width="62" height="42" rx="3" fill="none" stroke-width="1.4"/>
   <rect x="220" y="32" width="14" height="13" fill="#F5E08A" stroke-width="1.2" transform="rotate(-6 227 38)"/>
   <rect x="238" y="34" width="16" height="13" fill="#FFFFFF" stroke-width="1.2" transform="rotate(4 246 40)"/>
   <rect x="258" y="31" width="10" height="12" fill="#9CC3A6" stroke-width="1.2"/>
   <rect x="222" y="49" width="20" height="11" fill="#FFFFFF" stroke-width="1.2"/>
   <rect x="250" y="50" width="16" height="11" fill="#E7A3B8" stroke-width="1.2" transform="rotate(-5 258 55)"/>
   <rect x="280" y="22" width="32" height="32" rx="1.5" fill="#2E5E6B"/></g>
   <rect x="240.5" y="36.5" width="11" height="7" fill="#8FB8E0" transform="rotate(4 246 40)"/>
   <path d="M224 56 L230 52 L235 56" stroke="#5E8F5A" stroke-width="1.4" fill="none"/>
   <path d="M282 52 L292 36 L298 44 L302 38 L310 52 Z" fill="#F4F1EA"/><path d="M292 36 L295 41 L289 41 Z" fill="#FFFFFF"/>
   <circle cx="303" cy="29" r="3.2" fill="#F5C86B"/>
   <path d="M224 37 H230 M224 40 H229 M260 36 H266 M253 54 H262" stroke="${O}" stroke-width=".9" opacity=".6"/>
   <g fill="#B5476E" stroke="${O}" stroke-width=".8">${[
     [227, 33],
     [246, 35],
     [263, 32],
     [232, 50],
     [258, 51],
   ]
     .map(([x = 0, y = 0]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`)
     .join("")}</g>`,
    // 4: a trailing pothos on the desk, a backpack by the bed, string lights above the desk
    `${lights(false)}
   <g stroke="${O}" stroke-width="1.6" stroke-linejoin="round">
   ${[
     [218, 80, -30],
     [226, 78, 25],
     [222, 74, 0],
     [214, 92, -10],
     [211, 102, 10],
     [212, 111, 0],
   ]
     .map(
       ([x = 0, y = 0, a = 0]) =>
         `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="5" transform="rotate(${a} ${x} ${y})" fill="#5E8F5A"/>`,
     )
     .join("")}
   <path d="M215 85 H229 L227 95 H217 Z" fill="#C46A45" stroke-width="2"/></g>
   <path d="M216 88 C212 94 210 104 212 114" stroke="#4E7A4A" stroke-width="1.2" fill="none"/>
   ${shadow(99, 140, 12)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M92 116 C92 110 96 108 99 108 C102 108 106 110 106 116" fill="none" stroke-width="3"/>
   <rect x="88" y="114" width="22" height="26" rx="6" fill="#D9774B"/>
   <rect x="92" y="126" width="14" height="10" rx="3" fill="#C46A45"/></g>
   <path d="M95 126 H103" stroke="${O}" stroke-width="1.2"/>`,
    // 5: complete: night outside, the moon, string lights and the lamp glow
    `${view("#2E3A5C", "#2F4A45", "#34484A", "#4A3F55", "#3A3350")}
   <g fill="#F2C96A">${[
     [66, 50],
     [86, 50],
     [76, 62],
   ]
     .map(([x = 0, y = 0]) => `<rect x="${x}" y="${y}" width="6" height="7" rx="1"/>`)
     .join("")}</g>
   <circle cx="40" cy="32" r="6" fill="#F4EDE0"/><circle cx="43" cy="30" r="5" fill="#2E3A5C"/>
   ${twinkle(30, 26, 2)}${twinkle(52, 40, 1.6)}${twinkle(82, 26, 2)}
   ${FRAME}${SILL}
   <rect width="320" height="180" fill="#34405F" opacity=".08"/>
   ${lights(true)}
   ${shade(true)}`,
  ],
};
