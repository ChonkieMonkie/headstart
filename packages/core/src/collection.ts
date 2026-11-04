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

// How far along the collection is: items found overall, per set and per slot.

import type { Item, ItemSet, Slot } from "@headstart/content";
import { owns, type ProgressState } from "./state.ts";

export interface CollectionCount {
  owned: number;
  total: number;
}

export interface SetProgress extends CollectionCount {
  set: ItemSet;
}

function count(state: ProgressState, items: readonly Item[]): CollectionCount {
  return { owned: items.filter((i) => owns(state, i.id)).length, total: items.length };
}

/**
 * Items found out of everything in the catalogue (retired items count once
 * found). Grant-only items are left out: they are shown on their own.
 */
export function collectionCount(state: ProgressState, catalog: readonly Item[]): CollectionCount {
  return count(
    state,
    catalog.filter((i) => !i.grantOnly && (i.dropsFromCrates !== false || owns(state, i.id))),
  );
}

export function slotCount(
  state: ProgressState,
  catalog: readonly Item[],
  slot: Slot,
): CollectionCount {
  return count(
    state,
    catalog.filter((i) => i.slot === slot),
  );
}

export function setProgress(
  state: ProgressState,
  catalog: readonly Item[],
  sets: readonly ItemSet[],
): SetProgress[] {
  return sets.map((set) => ({
    set,
    ...count(
      state,
      catalog.filter((i) => i.set === set.id),
    ),
  }));
}
