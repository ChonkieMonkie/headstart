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

// Turns what a mascot has equipped (item ids) into what the renderer draws.

import type { Item, MascotId, SkinArt, Slot, WearArt, WearSlot } from "@headstart/content";
import type { MascotLook } from "./render.ts";

const WEAR_SLOTS: readonly WearSlot[] = ["head", "face", "outfit", "held", "aura"];

function fits(item: Item, species: MascotId): boolean {
  return !item.fits || item.fits.includes(species);
}

/** The starter skin of a mascot, used when nothing else is equipped. */
export function starterSkin(species: MascotId, catalog: readonly Item[]): SkinArt {
  const item = catalog.find((i) => i.starter && i.slot === "skin" && fits(i, species));
  return (
    (item?.art as SkinArt | undefined) ?? {
      body: "#C9CED8",
      shade: "#9AA3B5",
      accent: "#FFFFFF",
      light: "#ECEEF2",
    }
  );
}

/** What a mascot looks like with these items equipped. Unknown or unfitting ids are skipped. */
export function lookFor(
  species: MascotId,
  equipped: Partial<Record<Slot, string>>,
  catalog: readonly Item[],
): MascotLook {
  const byId = (id: string | undefined) => {
    const item = id ? catalog.find((i) => i.id === id) : undefined;
    return item && fits(item, species) ? item : undefined;
  };
  const skin = byId(equipped.skin);
  const wear: MascotLook["wear"] = {};
  for (const slot of WEAR_SLOTS) {
    const item = byId(equipped[slot]);
    if (item && item.slot === slot) wear[slot] = item.art as WearArt;
  }
  return {
    species,
    skin: skin?.slot === "skin" ? (skin.art as SkinArt) : starterSkin(species, catalog),
    wear,
  };
}

/** A look that shows off one item: the item on its own, or the skin with nothing else. */
export function itemPreview(item: Item, species: MascotId, catalog: readonly Item[]): MascotLook {
  if (item.slot === "skin") return { species, skin: item.art as SkinArt, wear: {} };
  return {
    species,
    skin: starterSkin(species, catalog),
    wear: { [item.slot]: item.art as WearArt },
  };
}

/** The mascot an item is best shown on: the first one it fits, preferring `preferred`. */
export function previewSpecies(item: Item, preferred: MascotId): MascotId {
  if (!item.fits || item.fits.includes(preferred)) return preferred;
  return item.fits[0] ?? preferred;
}
