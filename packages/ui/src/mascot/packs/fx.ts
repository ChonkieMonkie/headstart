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

// Shared drawing helpers for the hand-drawn epic and legendary items:
// soft light, orbits that keep things upright, bobbing, sparkles, faces.

import { animate, el, g, OUTLINE, outlined, sparkle } from "../svg.ts";
import { line } from "./kit.ts";

/** `color` mixed with white by `k` (0 to 1), so light reads as light on a dark card. */
export const tint = (color: string, k: number): string => {
  const n = Number.parseInt(color.slice(1), 16);
  const mix = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${mix((n >> 16) & 255)} ${mix((n >> 8) & 255)} ${mix(n & 255)})`;
};

/**
 * A soft light: three stacked circles, brightest in the middle. Screen
 * blending makes it lighten what is under it instead of greying it.
 */
export const aureole = (cx: number, cy: number, r: number, color: string, strength = 1): string =>
  g(
    { style: "mix-blend-mode: screen" },
    ...[1, 0.7, 0.42].map((k, i) =>
      el("circle", {
        cx,
        cy,
        r: r * k,
        fill: tint(color, 0.2),
        opacity: (0.08 + i * 0.06) * strength,
      }),
    ),
  );

/** Turns its children around the buddy's middle. */
export const orbit = (seconds: number, back: boolean, ...children: string[]): string =>
  g(
    {
      style: `transform-origin: 100px 104px; transform-box: view-box; ${animate(back ? "mc-spin-back" : "mc-spin", seconds, 0, "linear")}`,
    },
    ...children,
  );

/** Inside an `orbit`: turns the other way around its own middle, so it stays upright. */
export const upright = (seconds: number, back: boolean, ...children: string[]): string =>
  g(
    {
      style: `transform-origin: center; transform-box: fill-box; ${animate(back ? "mc-spin" : "mc-spin-back", seconds, 0, "linear")}`,
    },
    ...children,
  );

/** Places children at (x, y) and lets them bob up and down. */
export const bobAt = (
  x: number,
  y: number,
  seconds: number,
  delay: number,
  ...children: string[]
): string =>
  g(
    { transform: `translate(${x} ${y})` },
    g({ style: animate("mc-bob", seconds, delay) }, ...children),
  );

/** Twinkling four-pointed sparkles, given as [x, y, size]. */
export const twinkles = (
  list: readonly (readonly [number, number, number])[],
  color = "#FFF3C9",
): string =>
  list
    .map(([x, y, s], i) =>
      outlined(
        "path",
        { d: sparkle(x, y, s), fill: color, style: animate("mc-twinkle", 2.2, i * 0.5) },
        1.2,
      ),
    )
    .join("");

/** Small dots that drift upwards and fade, given as [x, y, r]. */
export const rising = (
  list: readonly (readonly [number, number, number])[],
  color: string,
  seconds = 2.6,
): string =>
  list
    .map(([cx, cy, r], i) =>
      el("circle", {
        cx,
        cy,
        r,
        fill: color,
        style: animate("mc-rise", seconds, i * (seconds / list.length), "ease-in"),
      }),
    )
    .join("");

/** Two dot eyes and a small smile, for friendly spirits. */
export const cuteFace = (x: number, y: number, s = 1): string =>
  el("circle", { cx: x - 4 * s, cy: y, r: 1.6 * s, fill: OUTLINE }) +
  el("circle", { cx: x + 4 * s, cy: y, r: 1.6 * s, fill: OUTLINE }) +
  line(
    `M${x - 2 * s} ${y + 3 * s} Q${x} ${y + 4.6 * s} ${x + 2 * s} ${y + 3 * s}`,
    OUTLINE,
    1.2 * s,
  );

/** A music note (a filled head on a stem with a flag). */
export const note = (x: number, y: number, color: string): string =>
  line(`M${x + 3.4} ${y} V${y - 13} Q${x + 8} ${y - 10} ${x + 9} ${y - 6}`, OUTLINE, 1.8) +
  outlined(
    "ellipse",
    { cx: x, cy: y, rx: 4, ry: 3, fill: color, transform: `rotate(-20 ${x} ${y})` },
    1.6,
  );

/** Points around the buddy's middle at the given angles (degrees, 0 = right, 90 = down). */
export const around = (r: number, ...angles: number[]): [number, number][] =>
  angles.map((a) => [
    100 + r * Math.cos((a * Math.PI) / 180),
    104 + r * Math.sin((a * Math.PI) / 180),
  ]);
