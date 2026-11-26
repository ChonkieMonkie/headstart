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

// Every set's cover, the stage a set is at, and the square crop of the full
// cover that is the set's background behind the buddy.

import { cover as cafe } from "./cafe.ts";
import { cover as cosy } from "./cosy.ts";
import { cover as deepSea } from "./deep-sea.ts";
import { cover as garden } from "./garden.ts";
import type { SetCover } from "./kit.ts";
import { cover as library } from "./library.ts";
import { cover as rainyDay } from "./rainy-day.ts";
import { cover as space } from "./space.ts";
import { cover as studentLife } from "./student-life.ts";

export type { SetCover } from "./kit.ts";

export const COVERS: Record<string, SetCover> = {
  library,
  "deep-sea": deepSea,
  space,
  cosy,
  garden,
  "rainy-day": rainyDay,
  cafe,
  "student-life": studentLife,
};

/** Which background scene is the finished cover of which set. */
export const COVER_SCENES: Record<string, string> = {
  library: "library",
  aquarium: "deep-sea",
  observatory: "space",
  fireside: "cosy",
  greenhouse: "garden",
  "rainy-window": "rainy-day",
  cafe: "cafe",
  dorm: "student-life",
};

/**
 * The cover stage for a set: 0 with nothing found, then one more layer at
 * each fifth of the set (rounded up), and 5 only when it is complete.
 */
export function coverStage(owned: number, total: number): number {
  if (total <= 0 || owned <= 0) return 0;
  if (owned >= total) return 5;
  let stage = 0;
  for (let k = 1; k <= 4; k++) if (owned >= Math.ceil((k * total) / 5)) stage = k;
  return stage;
}

/** Items still needed for the next stage, or 0 when the set is complete. */
export function itemsToNextStage(owned: number, total: number): number {
  const stage = coverStage(owned, total);
  if (stage >= 5) return 0;
  const need = stage === 4 ? total : Math.ceil(((stage + 1) * total) / 5);
  return Math.max(1, need - owned);
}

/** Swaps colours for light greys, for the outline of the next layer. */
function ghost(svg: string): string {
  return svg.replace(/#([0-9A-Fa-f]{6})\b/g, (match, hex: string) => {
    if (match.toUpperCase() === "#2A1F2D") return "#8F8F8F";
    const n = Number.parseInt(hex, 16);
    const luma = 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    const v = Math.round(170 + (luma / 255) * 70)
      .toString(16)
      .padStart(2, "0");
    return `#${v}${v}${v}`;
  });
}

const FRAME =
  '<rect x="3" y="3" width="314" height="174" rx="10" fill="none" stroke="#F5C542" stroke-width="5"/>' +
  '<rect x="3" y="3" width="314" height="174" rx="10" fill="none" stroke="#FFF3C9" stroke-width="1.5" stroke-dasharray="2 6"/>';

/**
 * The inside of a `viewBox="0 0 320 180"` SVG: the layers reached so far, the
 * next one as a faint grey outline, and a gold frame when complete.
 */
export function renderCover(setId: string, stage: number): string {
  const cover = COVERS[setId];
  if (!cover) return "";
  const shown = Math.max(0, Math.min(5, stage));
  let svg = cover.layers.slice(0, shown + 1).join("");
  const next = cover.layers[shown + 1];
  if (next) svg += `<g opacity=".22">${ghost(next)}</g>`;
  if (shown === 5) svg += FRAME;
  return svg;
}

/** The full cover cropped to a square, for the 200 x 200 background box. */
export function coverBackground(setId: string): string | null {
  const cover = COVERS[setId];
  if (!cover) return null;
  return `<svg x="0" y="0" width="200" height="200" viewBox="70 0 180 180" preserveAspectRatio="xMidYMid slice">${cover.layers.join("")}</svg>`;
}
