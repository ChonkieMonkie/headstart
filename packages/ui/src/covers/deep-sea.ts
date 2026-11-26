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

// Cover for the Deep Sea set: open water that fills with life, then light
// pours down and a whale passes far away. Layers in a 320 x 180 box; see ./kit.ts.

import { glow, O, type SetCover, shadow } from "./kit.ts";

/** A swaying kelp strand from (x, base) up to height h, drawn with an outline. */
function kelp(x: number, base: number, h: number, sway: number): string {
  const d = `M${x} ${base} C${x + sway} ${base - h * 0.3} ${x - sway} ${base - h * 0.6} ${x + sway * 0.5} ${base - h}`;
  const leaves = [0.3, 0.55, 0.8]
    .map((k, i) => {
      const y = base - h * k;
      const lx = x + (i % 2 ? -sway * 0.6 : sway * 0.6);
      return `<ellipse cx="${lx + (i % 2 ? -4 : 4)}" cy="${y}" rx="5" ry="2.4" transform="rotate(${i % 2 ? 30 : -30} ${lx} ${y})"/>`;
    })
    .join("");
  return `<path d="${d}" stroke="${O}" stroke-width="8.4" fill="none" stroke-linecap="round"/>
   <path d="${d}" stroke="#4E9A6A" stroke-width="5" fill="none" stroke-linecap="round"/>
   <g fill="#62B07C" stroke="${O}" stroke-width="1.4">${leaves}</g>`;
}
/** A small fish at (x, y), facing right unless flip. */
const fish = (x: number, y: number, color: string, flip = false) =>
  `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)" stroke="${O}" stroke-width="1.4" stroke-linejoin="round">
   <path d="M-6 0 L-11 -4 L-11 4 Z" fill="${color}"/><path d="M-7 0 C-4 -5 4 -5 7 0 C4 5 -4 5 -7 0 Z" fill="${color}"/>
   <circle cx="3.6" cy="-0.6" r="1" fill="${O}" stroke="none"/></g>`;

export const cover: SetCover = {
  labels: [
    "rocks and seaweed settle in",
    "the coral reef grows",
    "a school of fish and a sunken chest arrive",
    "a sea turtle and jellyfish drift in",
    "light pours down and a whale swims by",
  ],
  layers: [
    // 0: open water in bands of blue over a sandy floor
    `<rect width="320" height="180" fill="#7DB7DB"/>
   <rect width="320" height="44" fill="#A9D4EC"/><rect y="44" width="320" height="36" fill="#93C6E4"/><rect y="118" width="320" height="40" fill="#6AA6CF"/>
   <path d="M20 14 C40 10 60 18 80 13 M150 20 C170 15 190 23 210 18 M240 10 C258 6 276 13 296 9" stroke="#FFFFFF" stroke-width="1.6" opacity=".35" fill="none" stroke-linecap="round"/>
   <path d="M0 132 C30 116 60 124 84 118 C110 112 130 128 160 122 C190 116 214 126 240 118 C270 110 294 124 320 116 V150 H0 Z" fill="#5F96BE" opacity=".7"/>
   <path d="M0 146 C40 138 90 150 140 144 C200 136 250 150 320 142 V180 H0 Z" fill="#E9D3A6"/>
   <path d="M0 160 C50 154 100 164 160 158 C220 152 270 162 320 156" stroke="#D8BE8C" stroke-width="2" fill="none"/>
   <path d="M30 170 C34 168 38 170 42 168 M200 172 C204 170 208 172 212 170 M262 166 C266 164 270 166 274 164" stroke="#C9AD7A" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    // 1: rocks and kelp on both sides
    `${kelp(16, 140, 106, 8)}${kelp(34, 140, 72, -6)}${kelp(300, 138, 98, -8)}${kelp(284, 138, 60, 6)}
   ${shadow(40, 151, 38)}${shadow(272, 149, 44)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <path d="M8 150 C6 134 22 124 38 128 C50 120 70 128 70 150 Z" fill="#8D9BAA"/>
   <path d="M236 148 C232 126 254 112 276 118 C296 110 316 122 316 148 Z" fill="#7F8E9E"/>
   </g>
   ${shadow(64, 160, 9)}<path d="M54 160 C54 152 72 150 74 160 Z" fill="#9AA7B5" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
   <path d="M20 134 C26 130 32 129 38 130 M248 124 C256 118 266 117 274 119" stroke="#FFFFFF" stroke-width="1.6" opacity=".4" fill="none" stroke-linecap="round"/>`,
    // 2: the coral reef: branch coral, a fan, brain coral, a starfish and shells
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
   <path d="M86 148 V130 M86 136 L76 124 M86 134 L96 120 M76 124 L72 114 M76 124 L82 114 M96 120 L92 110 M96 120 L102 112" stroke="#E7799B" stroke-width="6" fill="none"/>
   <path d="M210 146 C196 130 198 108 214 100 C230 108 232 130 218 146 Z" fill="#9E7FD6"/>
   <path d="M214 146 V106 M214 132 L204 120 M214 126 L224 114 M214 118 L206 108" stroke="#7A5CB8" stroke-width="1.4" fill="none"/>
   <path d="M232 148 C230 136 250 132 258 140 C262 144 260 148 258 148 Z" fill="#F2A541"/>
   <path d="M172 152 L176 144 L180 152 L188 152 L182 157 L184 165 L176 160 L168 165 L170 157 L164 152 Z" fill="#F28A3A"/>
   <path d="M194 158 C194 152 206 152 206 158 Z" fill="#F7E1D0"/><path d="M150 164 C152 158 162 160 160 166 Z" fill="#F7C6D9"/></g>
   <path d="M86 148 V130 M86 136 L76 124 M86 134 L96 120 M76 124 L72 114 M76 124 L82 114 M96 120 L92 110 M96 120 L102 112" stroke="#F49AB5" stroke-width="3.2" fill="none" stroke-linecap="round"/>
   <path d="M236 140 C240 137 246 137 250 139 M235 144 C240 141 248 141 254 144" stroke="#C97F1E" stroke-width="1.2" fill="none"/>`,
    // 3: a school of fish in the open water, a chest half sunk in the sand
    `${fish(150, 66, "#F28A3A")}${fish(166, 58, "#F5C542")}${fish(170, 72, "#F28A3A")}${fish(186, 64, "#F5C542")}${fish(198, 54, "#F28A3A")}${fish(202, 74, "#F5C542")}
   ${shadow(118, 151, 22)}
   <g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M98 150 V136 H138 V150 Z" fill="#8E6136" transform="rotate(-6 118 150)"/>
   <path d="M98 137 C98 126 138 126 138 137 Z" fill="#A9763F" transform="rotate(-6 118 150)"/>
   <rect x="114" y="134" width="8" height="8" rx="1" fill="#F5C542" transform="rotate(-6 118 150)"/>
   <circle cx="144" cy="149" r="3" fill="#F5C542"/><circle cx="150" cy="151" r="2.6" fill="#F5C542"/><circle cx="141" cy="153" r="2.4" fill="#F5C542"/></g>
   <path d="M99 148 C112 146 126 145 140 144" stroke="#E9D3A6" stroke-width="5" opacity=".9"/>`,
    // 4: a sea turtle swimming, two glowing jellyfish
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M52 52 L40 44 L44 56 Z M74 64 L84 74 L72 72 Z M50 66 L42 76 L54 72 Z M74 50 L84 42 L80 54 Z" fill="#7FBF8E"/>
   <ellipse cx="62" cy="58" rx="16" ry="11" fill="#5E8F5A"/><circle cx="82" cy="56" r="5.5" fill="#7FBF8E"/></g>
   <path d="M54 52 L62 58 L70 52 M54 64 L62 58 L70 64 M62 48 V68" stroke="#3E6B3C" stroke-width="1.2" fill="none"/>
   <circle cx="84" cy="55" r="1" fill="${O}"/>
   ${glow(262, 40, 20, "#FFB3DC")}
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M250 42 C250 26 274 26 274 42 C270 45 266 41 262 44 C258 41 254 45 250 42 Z" fill="#FF9AD5"/>
   <path d="M254 44 C252 52 258 56 254 64 M262 45 C260 54 266 58 262 68 M270 44 C268 52 274 56 270 62" fill="none" stroke="#FF9AD5" stroke-width="2"/>
   <path d="M286 72 C286 62 300 62 300 72 C297 74 295 72 293 74 C291 72 289 74 286 72 Z" fill="#C9A8FF"/>
   <path d="M289 74 C288 80 292 82 289 88 M296 74 C295 80 299 82 296 86" fill="none" stroke="#C9A8FF" stroke-width="1.6"/></g>
   <path d="M255 34 C258 31 262 30 266 30" stroke="#FFFFFF" stroke-width="1.4" opacity=".7" fill="none" stroke-linecap="round"/>`,
    // 5: complete: light rays from the surface, a whale far away, bubbles
    `<path d="M44 0 L70 0 L92 92 L70 92 Z M138 0 L156 0 L170 96 L154 96 Z M226 0 L248 0 L242 70 L226 70 Z" fill="#FFFFFF" opacity=".16"/>
   <path d="M110 26 C130 14 190 14 214 24 C222 18 230 14 238 14 C234 22 232 28 226 32 C200 44 134 42 110 26 Z" fill="#3E6F9E" opacity=".5"/>
   <path d="M118 28 C140 36 190 36 210 30" stroke="#5E8DBA" stroke-width="2" opacity=".5" fill="none"/>
   <g fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".85"><circle cx="124" cy="118" r="3"/><circle cx="128" cy="104" r="2.2"/><circle cx="122" cy="92" r="1.6"/><circle cx="92" cy="98" r="2.4"/><circle cx="96" cy="84" r="1.6"/><circle cx="224" cy="92" r="2.2"/><circle cx="220" cy="80" r="1.6"/></g>`,
  ],
};
