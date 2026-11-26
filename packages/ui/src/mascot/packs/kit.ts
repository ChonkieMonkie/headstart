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

// Shared helpers and types for content packs. A pack file exports one
// `PackDrawings` object: the drawings for the shapes and scenes its content
// file (packages/content/data/packs/<same name>.json) lists.

import { el, g, OUTLINE } from "../svg.ts";
import type { WearContext, WearParts } from "../wear.ts";

export type { WearContext, WearParts };
export type Draw = (ctx: WearContext) => WearParts;
/** A background scene: the inside of a 200 x 200 SVG, behind the mascot. */
export type Scene = (colors: readonly string[]) => string;

export interface PackDrawings {
  head?: Record<string, Draw>;
  face?: Record<string, Draw>;
  outfit?: Record<string, Draw>;
  held?: Record<string, Draw>;
  aura?: Record<string, Draw>;
  scenes?: Record<string, Scene>;
}

/** Colour `i` of the item, or a loud magenta that the tests catch. */
export const c = (ctx: WearContext, i: number): string => ctx.colors[i] ?? "#FF00FF";

/** A white highlight stroke. */
export const SHINE = (d: string, opacity = 0.35): string =>
  el("path", {
    d,
    fill: "none",
    stroke: "#FFFFFF",
    opacity,
    "stroke-width": 3,
    "stroke-linecap": "round",
  });

/** A round-capped stroke with no fill. */
export const line = (
  d: string,
  color: string = OUTLINE,
  width = 2,
  extra: Record<string, string | number> = {},
): string =>
  el("path", {
    d,
    fill: "none",
    stroke: color,
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    ...extra,
  });

/** The two eye centres, for face items. */
export const eyesOf = (ctx: WearContext): [[number, number], [number, number]] => [
  [ctx.geo.ex1, ctx.geo.ey],
  [ctx.geo.ex2, ctx.geo.ey],
];

/** Circles merged into one blob with one shared outline (clouds, bushes, foam). */
export function blob(
  circles: readonly (readonly [number, number, number])[],
  fill: string,
  width = 3,
): string {
  const shapes = (attrs: Record<string, string | number>) =>
    circles.map(([cx, cy, r]) => el("circle", { cx, cy, r, ...attrs })).join("");
  return g(
    {},
    shapes({ fill: OUTLINE, stroke: OUTLINE, "stroke-width": width * 2 }),
    shapes({ fill }),
  );
}

/** Moves torso drawings up a little on Axo, whose body sits higher. */
export const torso = (ctx: WearContext, body: string): string =>
  g({ transform: `translate(0 ${ctx.species === "axo" ? -6 : 0})` }, body);

/** The body shape the hoodie uses, for tops and coats: canvas coordinates. */
export const BODY = "M66 122 C60 146 64 172 80 180 L120 180 C136 172 140 146 134 122 Z";

/** The headband arc that sits on the top of every head (head coordinates). */
export const HEADBAND = "M-46 20 C-38 -6 38 -6 46 20";
