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

// Cover for the Space set: a hill at night that becomes an observatory, then
// the Milky Way lights up. Layers in a 320 x 180 box; see ./kit.ts.

import { glow, O, type SetCover, shadow, stars, twinkle } from "./kit.ts";

/** Many tiny stars from a fixed pseudo-random spread inside a box. */
function starField(
  n: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  seed: number,
  r = 0.9,
): string {
  const list: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.sin((i + 1) * 12.9898 + seed) * 43758.5453;
    const b = Math.sin((i + 1) * 78.233 + seed * 3) * 12345.678;
    list.push([
      Math.round(x0 + (a - Math.floor(a)) * w),
      Math.round(y0 + (b - Math.floor(b)) * h),
      i % 4 === 0 ? r * 1.4 : r,
    ]);
  }
  return stars(list);
}

export const cover: SetCover = {
  labels: [
    "the observatory is built",
    "the dome opens and the stars come out",
    "a ringed planet and a comet pass by",
    "a rocket and a satellite are ready",
    "the Milky Way lights up the sky",
  ],
  layers: [
    // 0: a hill under a deep night sky, mountains far away
    `<rect width="320" height="180" fill="#1E2350"/>
   <rect y="64" width="320" height="40" fill="#272B62"/><rect y="104" width="320" height="30" fill="#353877"/>
   <path d="M0 132 L36 112 L58 122 L92 100 L124 120 L150 110 L188 126 L222 104 L256 120 L284 108 L320 124 V150 H0 Z" fill="#2A2F5E"/>
   <path d="M0 150 C60 128 140 132 200 142 C250 150 290 136 320 140 V180 H0 Z" fill="#2F4A57"/>
   <path d="M0 168 C80 160 200 172 320 162 V180 H0 Z" fill="#263C47"/>
   ${starField(14, 0, 4, 320, 90, 1, 0.7)}`,
    // 1: the observatory on the left hill
    `${shadow(52, 146, 40)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <rect x="22" y="108" width="60" height="38" rx="2" fill="#D8DDE6"/>
   <path d="M20 110 C20 76 84 76 84 110 Z" fill="#AEB8C8"/>
   <rect x="44" y="124" width="14" height="22" rx="6" fill="#5E6A7E"/>
   <rect x="66" y="118" width="10" height="9" rx="2" fill="#F2D27A"/></g>
   <path d="M30 98 C36 88 46 83 56 82" stroke="#FFFFFF" stroke-width="2" opacity=".5" fill="none" stroke-linecap="round"/>
   <path d="M38 88 L46 104 M62 84 L58 102" stroke="#8C97AA" stroke-width="1.4"/>
   <path d="M58 146 C70 150 80 154 92 160" stroke="#C9B48A" stroke-width="3" opacity=".6" fill="none" stroke-linecap="round"/>`,
    // 2: the dome opens, a telescope points up; stars and a crescent moon
    `<path d="M46 89 C49 87 55 87 58 88 L60 110 L46 110 Z" fill="#1E2350" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
   <path d="M52 100 L86 64" stroke="${O}" stroke-width="9"/><path d="M52 100 L86 64" stroke="#7F8CA8" stroke-width="5.6"/>
   <circle cx="87" cy="63" r="4" fill="#F2D27A"/></g>
   ${starField(40, 0, 2, 320, 100, 7)}
   ${glow(258, 36, 26, "#FFF3C9", 0.7)}
   <path d="M252 22 C240 30 240 50 254 56 C246 46 248 30 262 24 C258 22 255 22 252 22 Z" fill="#FFF0BF" stroke="${O}" stroke-width="1.8"/>`,
    // 3: a ringed planet and a comet
    `<g stroke="${O}" stroke-width="2" stroke-linejoin="round">
   <path d="M128 50 C128 42 176 40 182 46" fill="none" stroke="${O}" stroke-width="6"/><path d="M128 50 C128 42 176 40 182 46" fill="none" stroke="#E6CF96" stroke-width="3"/>
   <circle cx="155" cy="46" r="13" fill="#E89A5B"/>
   <path d="M128 50 C134 58 176 54 182 46" fill="none" stroke="${O}" stroke-width="6"/><path d="M128 50 C134 58 176 54 182 46" fill="none" stroke="#E6CF96" stroke-width="3"/></g>
   <path d="M146 40 C150 37 154 36 158 36" stroke="#FFFFFF" stroke-width="1.6" opacity=".6" fill="none" stroke-linecap="round"/>
   <path d="M150 50 C154 52 160 52 166 50" stroke="#C97A3E" stroke-width="1.4" fill="none"/>
   <path d="M188 58 L226 82" stroke="#BFD9FF" stroke-width="6" opacity=".3" stroke-linecap="round"/>
   <path d="M192 61 L226 82" stroke="#E6F1FF" stroke-width="2.4" opacity=".8" stroke-linecap="round"/>
   <circle cx="227" cy="83" r="4.5" fill="#FFFFFF" stroke="${O}" stroke-width="1.6"/>`,
    // 4: a rocket on its launch pad, a satellite overhead
    `${shadow(276, 142, 22)}
   <g stroke="${O}" stroke-width="2.2" stroke-linejoin="round">
   <path d="M256 132 L264 112 M296 132 L288 112" stroke="#7F8CA8" stroke-width="3"/>
   <path d="M266 118 L260 132 L268 128 Z M286 118 L292 132 L284 128 Z" fill="#E5533D"/>
   <path d="M266 130 V100 C266 86 276 76 276 76 C276 76 286 86 286 100 V130 Z" fill="#F4EEE2"/>
   <circle cx="276" cy="104" r="4.5" fill="#6FB7F0"/>
   <path d="M270 130 H282 L280 136 H272 Z" fill="#E5533D"/>
   <rect x="250" y="136" width="52" height="6" rx="2" fill="#5E6A7E"/></g>
   <path d="M271 96 C271 90 273 86 275 83" stroke="#FFFFFF" stroke-width="1.6" opacity=".7" fill="none" stroke-linecap="round"/>
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round" transform="rotate(-18 112 26)">
   <rect x="90" y="22" width="14" height="8" fill="#5B7FC0"/><rect x="120" y="22" width="14" height="8" fill="#5B7FC0"/>
   <rect x="105" y="20" width="14" height="12" rx="2" fill="#C9D1DE"/><path d="M112 20 V14" fill="none"/><circle cx="112" cy="13" r="2" fill="#E5533D"/></g>`,
    // 5: complete: the Milky Way, shooting stars and a UFO peeking in
    `<path d="M-10 92 C80 60 200 30 330 6" stroke="#C9B8FF" stroke-width="44" opacity=".07" fill="none"/>
   <path d="M-10 92 C80 60 200 30 330 6" stroke="#E6DBFF" stroke-width="18" opacity=".07" fill="none"/>
   ${starField(60, 0, 0, 320, 96, 21, 0.6)}
   <path d="M108 8 L132 18 M190 112 L206 118" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
   ${twinkle(132, 18, 3)}${twinkle(206, 118, 2.6)}
   ${glow(30, 40, 18, "#9BE7D5", 0.8)}
   <g stroke="${O}" stroke-width="1.8" stroke-linejoin="round">
   <path d="M20 34 C20 26 40 26 40 34 Z" fill="#9BE7D5"/>
   <ellipse cx="30" cy="36" rx="16" ry="5" fill="#C9D1DE"/></g>
   <circle cx="24" cy="36" r="1.4" fill="#F5C542"/><circle cx="30" cy="37" r="1.4" fill="#F5C542"/><circle cx="36" cy="36" r="1.4" fill="#F5C542"/>`,
  ],
};
