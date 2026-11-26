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

// Cover for the Cosy set: a living room on a winter evening that gets
// furnished, the fire is lit, and finally it snows outside. Layers in a
// 320 x 180 box; see ./kit.ts.

import { floor, glow, O, type SetCover, shadow, twinkle } from "./kit.ts";

/** The window glass between the curtains. Only the last layer repaints it. */
const GLASS = { x: 236, y: 20, w: 48, h: 68 };
const MULLIONS = `<path d="M260 20 V88 M236 54 H284" stroke="#7A5333" stroke-width="3.5"/>`;
const CURTAINS = `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M222 14 H240 C238 40 242 60 236 78 C234 88 238 96 240 102 H222 Z" fill="#A8455E"/>
   <path d="M298 14 H280 C282 40 278 60 284 78 C286 88 282 96 280 102 H298 Z" fill="#A8455E"/></g>
   <path d="M228 20 C230 46 228 72 230 96 M292 20 C290 46 292 72 290 96" stroke="#8C3049" stroke-width="1.6" fill="none"/>
   <rect x="214" y="10" width="92" height="5" rx="2.5" fill="#7A5333" stroke="${O}" stroke-width="1.8"/>`;
const FLAMES = `<g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <rect x="38" y="130" width="34" height="6" rx="3" fill="#7A5333" transform="rotate(-6 55 133)"/>
   <rect x="40" y="128" width="30" height="6" rx="3" fill="#8E6136" transform="rotate(8 55 131)"/>
   <path d="M44 128 C38 118 46 110 46 100 C54 108 52 114 56 118 C58 108 64 104 64 96 C72 106 72 118 66 128 Z" fill="#F28A3A"/>
   <path d="M50 128 C47 121 52 116 53 110 C57 116 57 120 60 122 C62 117 64 115 65 112 C68 118 67 124 62 128 Z" fill="#F7D35A"/></g>`;

export const cover: SetCover = {
  labels: [
    "the fireplace and the rug arrive",
    "the sofa and its blanket arrive",
    "the fire is lit and the cocoa is ready",
    "a cat, a picture and the yarn basket move in",
    "snow falls outside and the lights come on",
  ],
  layers: [
    // 0: an empty room: striped wallpaper, panelling, a curtained window at dusk
    `<rect width="320" height="180" fill="#E9D2B4"/>
   <g fill="#E0C49F" opacity=".7">${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 24 + 6}" y="8" width="8" height="92"/>`).join("")}</g>
   <rect width="320" height="8" fill="#CDAE86"/>
   <rect y="100" width="320" height="38" fill="#B98D63"/>
   <g fill="none" stroke="#A47853" stroke-width="1.6">${[6, 58, 110, 162, 214, 266].map((x) => `<rect x="${x}" y="106" width="46" height="26" rx="2"/>`).join("")}</g>
   <rect y="97" width="320" height="4" fill="#9A6E45"/>
   ${floor(138, 180, "#9B6B44", "#82583A")}
   <rect x="${GLASS.x - 6}" y="${GLASS.y - 2}" width="${GLASS.w + 12}" height="${GLASS.h + 4}" fill="#4A6696"/>
   <rect x="${GLASS.x - 6}" y="${GLASS.y + 44}" width="${GLASS.w + 12}" height="26" fill="#7C86AE"/>
   <rect x="${GLASS.x - 6}" y="${GLASS.y - 2}" width="${GLASS.w + 12}" height="${GLASS.h + 4}" fill="none" stroke="#7A5333" stroke-width="4"/>
   ${MULLIONS}
   <rect x="226" y="89" width="68" height="6" rx="2" fill="#8E6136" stroke="${O}" stroke-width="1.8"/>
   ${CURTAINS}`,
    // 1: a stone fireplace with a mantel, and a braided rug
    `<ellipse cx="170" cy="160" rx="94" ry="14" fill="#C98F7A" stroke="${O}" stroke-width="2"/>
   <ellipse cx="170" cy="160" rx="78" ry="10" fill="none" stroke="#E8C7A8" stroke-width="2.4"/>
   <ellipse cx="170" cy="160" rx="60" ry="7" fill="none" stroke="#B5476E" stroke-width="2.4" opacity=".7"/>
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="12" y="70" width="86" height="68" fill="#B9A596"/>
   <path d="M30 138 V108 C30 94 80 94 80 108 V138 Z" fill="#3A2E2A"/>
   <rect x="4" y="63" width="102" height="9" rx="2" fill="#8E6136"/>
   <rect x="6" y="136" width="98" height="5" rx="2" fill="#9A8A7C"/></g>
   <g fill="none" stroke="#9C8778" stroke-width="1.4">
   <path d="M12 86 H30 M80 86 H98 M12 102 H28 M82 102 H98 M12 120 H28 M82 120 H98 M20 70 V86 M90 86 V102 M20 102 V120 M90 120 V136 M44 72 V84 M66 72 V84 M12 78 H98"/></g>
   <path d="M8 66 H40" stroke="#B88A57" stroke-width="1.6" opacity=".7"/>`,
    // 2: a sofa under the window with a knitted blanket and cushions
    `${shadow(210, 141, 56)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="162" y="100" width="96" height="26" rx="8" fill="#7FA392"/>
   <rect x="150" y="110" width="18" height="30" rx="7" fill="#6B8F7E"/><rect x="252" y="110" width="18" height="30" rx="7" fill="#6B8F7E"/>
   <rect x="164" y="120" width="92" height="16" rx="5" fill="#8FB3A2"/>
   <rect x="170" y="104" width="22" height="18" rx="6" fill="#F3E3C6"/><rect x="226" y="104" width="22" height="18" rx="6" fill="#D9A55B"/>
   <path d="M196 106 C210 102 222 104 228 108 L226 138 L198 138 Z" fill="#C9685A"/>
   <path d="M156 140 V143 M264 140 V143" stroke="#5E3E24" stroke-width="3"/></g>
   <path d="M200 114 H224 M200 122 H225 M200 130 H226" stroke="#E8A08F" stroke-width="1.6"/>
   <path d="M168 104 C174 101 182 100 190 100" stroke="#FFFFFF" stroke-width="1.6" opacity=".45" fill="none" stroke-linecap="round"/>`,
    // 3: the fire is lit; a side table with a steaming mug of cocoa
    `${glow(56, 118, 50, "#FFB347", 0.7)}${FLAMES}
   ${shadow(126, 141, 14)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M126 120 V140 M118 140 H134" stroke="#7A5333" stroke-width="3"/>
   <ellipse cx="126" cy="119" rx="15" ry="4" fill="#A9763F"/>
   <path d="M120 104 H131 V116 C131 118 129 119 127 119 H124 C122 119 120 118 120 116 Z" fill="#E8DCC8"/>
   <path d="M131 107 C136 107 136 114 131 114" fill="none"/></g>
   <ellipse cx="125.5" cy="104" rx="5" ry="1.4" fill="#7A4A2E"/>
   <path d="M122 98 C119 94 125 91 122 86 M128 98 C125 94 131 91 128 86" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".9"/>`,
    // 4: a framed picture over the mantel, a cat asleep by the fire, a yarn basket
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <rect x="30" y="20" width="50" height="36" rx="2" fill="#A9763F"/>
   <rect x="35" y="25" width="40" height="26" fill="#BFD6C9"/>
   <path d="M35 51 L48 36 L58 46 L64 40 L75 51 Z" fill="#6B8F7E"/></g>
   <circle cx="68" cy="32" r="3.5" fill="#F7D35A"/>
   ${shadow(116, 155, 20)}
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M98 155 C96 144 128 142 132 152 Z" fill="#E09A5B"/><circle cx="130" cy="148" r="6" fill="#E09A5B"/>
   <path d="M126 143 L127 138 L130 142 M132 142 L134 138 L135 143" fill="#E09A5B"/>
   <path d="M98 154 C92 152 92 158 100 157" fill="none" stroke="#E09A5B" stroke-width="3.4"/></g>
   <path d="M108 146 L108 152 M115 145 L115 152 M122 146 L122 151" stroke="#B9703A" stroke-width="1.4"/>
   <path d="M127 148 Q128.5 149.4 130 148 M131.6 148 Q133 149.4 134.4 148" stroke="${O}" stroke-width="1" fill="none"/>
   ${shadow(290, 152, 16)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M274 136 H306 L302 152 H278 Z" fill="#C59A68"/>
   <circle cx="282" cy="132" r="6" fill="#B5476E"/><circle cx="296" cy="131" r="6" fill="#7DB8A8"/><circle cx="289" cy="125" r="5" fill="#E0A72E"/></g>
   <path d="M278 142 H302 M279 147 H301" stroke="#A47853" stroke-width="1.2"/>
   <path d="M298 133 C312 128 312 146 304 150" stroke="#7DB8A8" stroke-width="1.6" fill="none"/>`,
    // 5: complete: snow outside, a garland with lights and candles on the mantel
    `<rect x="${GLASS.x}" y="${GLASS.y}" width="${GLASS.w}" height="${GLASS.h}" fill="#2E3E6E"/>
   <path d="M${GLASS.x} 88 C246 80 256 84 262 82 C270 80 278 84 ${GLASS.x + GLASS.w} 80 V88 Z" fill="#F4F6FA"/>
   <g fill="#FFFFFF">${[
     [242, 28],
     [254, 40],
     [270, 30],
     [278, 46],
     [246, 62],
     [264, 68],
     [276, 74],
     [252, 52],
     [240, 76],
   ]
     .map(([x = 0, y = 0]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`)
     .join("")}</g>
   ${MULLIONS}${CURTAINS}
   ${glow(56, 118, 56, "#FFB347", 0.85)}${FLAMES}
   <path d="M6 66 C22 76 38 76 54 68 C70 76 86 76 104 66" fill="none" stroke="#4E7A40" stroke-width="3"/>
   ${[
     [14, 70, "#FFD27A"],
     [30, 74, "#FF9AD5"],
     [46, 71, "#9BE7D5"],
     [62, 71, "#FFD27A"],
     [78, 74, "#FF9AD5"],
     [94, 70, "#9BE7D5"],
   ]
     .map(
       ([x = 0, y = 0, c = 0]) =>
         `${glow(Number(x), Number(y), 6, String(c), 0.9)}<circle cx="${x}" cy="${y}" r="2.4" fill="${c}" stroke="${O}" stroke-width="1"/>`,
     )
     .join("")}
   <g stroke="${O}" stroke-width="1.6" stroke-linejoin="round"><rect x="86" y="50" width="6" height="13" fill="#F4EEE2"/><rect x="95" y="54" width="6" height="9" fill="#F4EEE2"/></g>
   <path d="M89 50 C87 46 89 43 89 41 C91 44 91 47 89 50 Z M98 54 C96 50 98 47 98 45 C100 48 100 51 98 54 Z" fill="#F7B547"/>
   ${twinkle(89, 44, 5, "#FFE7A8")}
   <rect width="320" height="180" fill="#FF9F43" opacity=".06"/>`,
  ],
};
