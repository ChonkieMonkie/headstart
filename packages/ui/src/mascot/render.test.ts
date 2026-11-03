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

import {
  items,
  MASCOTS,
  type MascotId,
  type SkinArt,
  SLOTS,
  WEAR_SHAPES,
  type WearArt,
  type WearSlot,
} from "@headstart/content";
import { describe, expect, it } from "vitest";
import { GEOMETRY, MOOD_LOOKS, MOODS } from "./geometry.ts";
import { itemPreview, lookFor } from "./look.ts";
import { renderMascot } from "./render.ts";
import { WEAR_DRAWINGS } from "./wear.ts";

/** Checks that every tag that opens also closes, in order. */
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  for (const [, closing, name, selfClosing] of svg.matchAll(/<(\/?)([a-z]+)[^>]*?(\/?)>/g)) {
    if (selfClosing) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else if (name) {
      stack.push(name);
    }
  }
  return stack.length === 0;
}

function expectClean(svg: string, what: string) {
  expect(wellFormed(svg), what).toBe(true);
  expect(svg, what).not.toMatch(/undefined|NaN|#FF00FF/);
}

const fitsOf = (fits: readonly MascotId[] | undefined) => fits ?? MASCOTS;

describe("mascot renderer", () => {
  it("draws every item on every mascot it fits, in every mood", () => {
    for (const item of items) {
      for (const species of fitsOf(item.fits)) {
        for (const mood of MOODS) {
          expectClean(
            renderMascot(itemPreview(item, species, items), mood),
            `${item.id} on ${species}, ${mood}`,
          );
        }
      }
    }
  });

  it("has a drawing for every shape the catalogue can use", () => {
    for (const slot of Object.keys(WEAR_SHAPES) as WearSlot[]) {
      const drawings: Record<string, unknown> = WEAR_DRAWINGS[slot];
      for (const shape of Object.keys(WEAR_SHAPES[slot])) {
        expect(typeof drawings[shape], `${slot}.${shape}`).toBe("function");
      }
    }
  });

  it("animates exactly the items marked as animated", () => {
    for (const item of items) {
      if (item.slot === "skin") {
        expect((item.art as SkinArt).animation !== undefined, item.id).toBe(item.animated === true);
        continue;
      }
      const art = item.art as WearArt;
      const draw = (WEAR_DRAWINGS[item.slot] as Record<string, typeof WEAR_DRAWINGS.head.beanie>)[
        art.shape
      ];
      const species = fitsOf(item.fits)[0] ?? "maple";
      const parts = draw?.({
        species,
        geo: GEOMETRY[species],
        mood: MOOD_LOOKS.idle,
        colors: art.colors,
      });
      const drawn = Object.values(parts ?? {}).join("");
      expect(drawn.includes("animation:"), item.id).toBe(item.animated === true);
    }
  });

  it("wears a full outfit at once", () => {
    for (const species of MASCOTS) {
      const equipped: Record<string, string> = {};
      for (const slot of SLOTS) {
        const item = items.find(
          (i) =>
            i.slot === slot && (!i.fits || i.fits.includes(species)) && i.rarity === "legendary",
        );
        if (item) equipped[slot] = item.id;
      }
      const svg = renderMascot(lookFor(species, equipped, items), "celebrate");
      expectClean(svg, species);
    }
  });

  it("skips items that do not fit and falls back to the starter skin", () => {
    const look = lookFor("inky", { skin: "skin.maple.wildfire", head: "head.headphones" }, items);
    expect(look.wear.head).toBeUndefined();
    expect(look.skin.body).toBe("#8A7CF2");
  });

  it("keeps the skin's colours in every mood", () => {
    for (const species of MASCOTS) {
      const look = lookFor(species, {}, items);
      for (const mood of MOODS) {
        const svg = renderMascot(look, mood);
        for (const color of [look.skin.body, look.skin.shade, look.skin.accent]) {
          expect(svg, `${species} ${mood}`).toContain(color);
        }
      }
    }
  });
});
