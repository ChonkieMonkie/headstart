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

import { items, sets } from "@headstart/content";
import { describe, expect, it } from "vitest";
import { collectionCount, setProgress, slotCount } from "./collection.ts";
import { defaultContext } from "./index.ts";
import { createInitialState } from "./state.ts";

describe("collection progress", () => {
  it("starts with only the three starter skins", () => {
    const state = createInitialState(defaultContext);
    expect(collectionCount(state, items)).toEqual({ owned: 3, total: items.length });
    expect(slotCount(state, items, "skin").owned).toBe(3);
    expect(slotCount(state, items, "head").owned).toBe(0);
  });

  it("counts set items as they are found", () => {
    const state = createInitialState(defaultContext);
    state.inventory.set("head.grad-cap", 1);
    state.inventory.set("held.pencil", 2);
    const library = setProgress(state, items, sets).find((p) => p.set.id === "library");
    expect(library?.owned).toBe(2);
    expect(library?.total).toBe(items.filter((i) => i.set === "library").length);
  });

  it("leaves retired items out until someone owns one", () => {
    const state = createInitialState(defaultContext);
    const retired = {
      ...items[40],
      id: "head.retired",
      dropsFromCrates: false,
    } as (typeof items)[number];
    expect(collectionCount(state, [...items, retired]).total).toBe(items.length);
    state.inventory.set("head.retired", 1);
    expect(collectionCount(state, [...items, retired]).total).toBe(items.length + 1);
  });
});
