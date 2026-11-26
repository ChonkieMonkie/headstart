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

// Set covers: a small scene per set that is furnished as the set fills up.
// Each cover has six layers drawn in a 320 x 180 box (layer 0 is the empty
// place, layers 1 to 5 are added at each fifth of the set, layer 5 when the
// set is complete) and five labels saying what layers 1 to 5 add. The full
// scene, cropped to a square, is also the set's background behind the buddy.

// Art direction for every cover:
// - Light comes from the upper left: one white highlight on bigger objects and
//   a soft shadow under everything that stands on the floor or a surface.
// - Everything stands on something or hangs from something.
// - Nothing stands in front of a window's glass, so the last layer may repaint
//   the glass (night, snow, a rainbow) without covering anything.
// - Walls and sky have no outline; objects have the dark outline O.
// - Washes and glows are low-opacity circles, never gradients.

/** The shared dark outline. */
export const O = "#2A1F2D";

/** A soft shadow under something standing at (cx, cy). */
export const shadow = (cx: number, cy: number, rx: number, ry = rx * 0.2): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${O}" opacity=".14"/>`;

/** A soft round light: three circles that fade out. */
export const glow = (cx: number, cy: number, r: number, color: string, strength = 1): string =>
  [1, 0.68, 0.4]
    .map(
      (k, i) =>
        `<circle cx="${cx}" cy="${cy}" r="${(r * k).toFixed(1)}" fill="${color}" opacity="${((0.14 + i * 0.08) * strength).toFixed(2)}"/>`,
    )
    .join("");

/** Floor boards from y0 to y1: a fill and seams. */
export function floor(y0: number, y1: number, fill: string, seam: string): string {
  let joins = "";
  const rows = [y0 + (y1 - y0) * 0.3, y0 + (y1 - y0) * 0.62];
  rows.forEach((y, r) => {
    for (let x = r % 2 ? 30 : 64; x < 320; x += 92)
      joins += `M${x} ${y.toFixed(1)} L${x - 4} ${(y + (y1 - y0) * 0.32).toFixed(1)} `;
  });
  return `<rect y="${y0}" width="320" height="${y1 - y0}" fill="${fill}"/>
   <path d="M0 ${rows[0]?.toFixed(1)} H320 M0 ${rows[1]?.toFixed(1)} H320 ${joins}" stroke="${seam}" stroke-width="1.4" fill="none"/>
   <path d="M0 ${y0} H320" stroke="${seam}" stroke-width="2.4"/>`;
}

/** Small white stars, given as [x, y, r]. */
export const stars = (
  list: readonly (readonly [number, number, number])[],
  color = "#FFFFFF",
): string =>
  `<g fill="${color}">${list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;

/** A four-pointed twinkle at (x, y). */
export const twinkle = (x: number, y: number, s: number, color = "#FFFFFF"): string =>
  `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z" fill="${color}"/>`;

export interface SetCover {
  /** What each of layers 1 to 5 adds, written to follow "3 more and …". */
  labels: readonly [string, string, string, string, string];
  /** Six SVG fragments for a 320 x 180 box, drawn on top of each other. */
  layers: readonly [string, string, string, string, string, string];
}
