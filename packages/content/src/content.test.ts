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

import { describe, expect, it } from "vitest";
import lockedIds from "../data/ids.lock.json" with { type: "json" };
import {
  ContentError,
  crateRules,
  items,
  MASCOTS,
  PACKS,
  RARITIES,
  rewardRules,
  sets,
  validateCrateRules,
  validateItems,
} from "./index.ts";

describe("shipped content", () => {
  it("has one starter skin per mascot", () => {
    for (const mascot of MASCOTS) {
      const starters = items.filter((i) => i.starter && i.fits?.includes(mascot));
      expect(starters, mascot).toHaveLength(1);
    }
  });

  it("has droppable items of every rarity", () => {
    for (const rarity of RARITIES) {
      expect(
        items.some((i) => i.rarity === rarity && !i.starter),
        rarity,
      ).toBe(true);
    }
  });

  it("makes every crate's odds add up to 100", () => {
    for (const crate of Object.values(crateRules.crates)) {
      const total = RARITIES.reduce((sum, r) => sum + crate.odds[r], 0);
      expect(total, crate.type).toBeCloseTo(100, 9);
    }
  });

  it("makes rarer things worth more Stardust and cost more to craft", () => {
    for (let i = 1; i < RARITIES.length; i++) {
      const [lower, higher] = [RARITIES[i - 1], RARITIES[i]] as const;
      if (!lower || !higher) continue;
      expect(crateRules.duplicateStardust[higher]).toBeGreaterThan(
        crateRules.duplicateStardust[lower],
      );
      expect(crateRules.craftCost[higher]).toBeGreaterThan(crateRules.craftCost[lower]);
    }
  });

  it("has a big enough starter catalogue, with every rarity in every slot but skins", () => {
    expect(items.length).toBeGreaterThanOrEqual(150);
    for (const slot of ["head", "face", "outfit", "held"] as const) {
      for (const rarity of RARITIES) {
        expect(
          items.some((i) => i.slot === slot && i.rarity === rarity),
          `${slot} ${rarity}`,
        ).toBe(true);
      }
    }
  });

  it("keeps every item id ever shipped (data/ids.lock.json)", () => {
    // Ids are permanent: inventories refer to them forever. A new item's id is
    // added to the lock file on purpose (scripts/lock-ids.ts); an id in the
    // lock file may never disappear from the catalogue.
    const locked: string[] = lockedIds;
    const ids = new Set(items.map((i) => i.id));
    for (const id of locked) expect(ids.has(id), `${id} is locked but missing`).toBe(true);
    const lockedSet = new Set(locked);
    const unlocked = items.filter((i) => !lockedSet.has(i.id)).map((i) => i.id);
    expect(unlocked, "new ids: run node packages/content/scripts/lock-ids.ts").toEqual([]);
  });

  it("follows the colourway rule in packs: at most 3 per Common design, 2 per Uncommon, 1 above", () => {
    const limit = { common: 3, uncommon: 2, rare: 1, epic: 1, legendary: 1, exotic: 1 };
    const packIds = new Set(PACKS.flatMap((p) => p.items.map((i) => (i as { id: string }).id)));
    const groups = new Map<string, number>();
    for (const item of items) {
      if (!packIds.has(item.id) || !("shape" in item.art)) continue;
      const key = `${item.slot}:${item.art.shape}:${item.rarity}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
      expect(groups.get(key), key).toBeLessThanOrEqual(limit[item.rarity]);
    }
  });

  it("puts at least five items in every set", () => {
    for (const set of sets) {
      expect(items.filter((i) => i.set === set.id).length, set.id).toBeGreaterThanOrEqual(5);
    }
  });

  it("gives 10 XP for a full 25-minute session", () => {
    expect(25 * rewardRules.xpPerFocusMinute).toBe(10);
  });
});

describe("validation", () => {
  const item = {
    id: "head.test",
    name: "Test",
    slot: "head",
    rarity: "common",
    art: { shape: "beanie", colors: ["#E5533D", "#F6E7D8"] },
  };
  const skinArt = { body: "#8A7CF2", shade: "#6A5BD6", light: "#B9B0F9", accent: "#F3C6E8" };

  it("rejects duplicate ids", () => {
    expect(() => validateItems([item, item])).toThrow(ContentError);
  });

  it("keeps Exotic for grant-only items that never drop or craft", () => {
    expect(validateItems([{ ...item, rarity: "exotic", grantOnly: true }])[0]?.grantOnly).toBe(
      true,
    );
    expect(() => validateItems([{ ...item, rarity: "exotic" }])).toThrow(/grant-only/);
    expect(() => validateItems([{ ...item, grantOnly: true }])).toThrow(/grant-only/);
    expect(() =>
      validateItems([{ ...item, rarity: "exotic", grantOnly: true, craftable: true }]),
    ).toThrow(/cannot drop/);
    expect(items.filter((i) => i.rarity === "exotic").every((i) => i.grantOnly)).toBe(true);
  });

  it("rejects unknown rarities and slots", () => {
    expect(() => validateItems([{ ...item, rarity: "mythic" }])).toThrow(/rarity/);
    expect(() => validateItems([{ ...item, slot: "tail" }])).toThrow(/slot/);
  });

  it("rejects skins that fit more than one mascot", () => {
    expect(() =>
      validateItems([
        { ...item, id: "skin.test", slot: "skin", fits: ["inky", "axo"], art: skinArt },
      ]),
    ).toThrow(/exactly one mascot/);
  });

  it("rejects art the renderer cannot draw", () => {
    expect(() => validateItems([{ ...item, art: { shape: "top-hat", colors: [] } }])).toThrow(
      /shape/,
    );
    expect(() =>
      validateItems([{ ...item, art: { shape: "beanie", colors: ["#E5533D"] } }]),
    ).toThrow(/exactly 2 colours/);
    expect(() =>
      validateItems([{ ...item, art: { shape: "beanie", colors: ["red", "#F6E7D8"] } }]),
    ).toThrow(/#RRGGBB/);
    expect(() =>
      validateItems([{ ...item, id: "skin.test", slot: "skin", fits: ["inky"], art: item.art }]),
    ).toThrow(/skin colours|colour/);
  });

  it("rejects items in a set that does not exist", () => {
    expect(() => validateItems([{ ...item, set: "nowhere" }], sets)).toThrow(/unknown set/);
    expect(validateItems([{ ...item, set: "library" }], sets)).toHaveLength(1);
  });

  it("rejects crate odds that do not add up to 100", () => {
    const broken = JSON.parse(JSON.stringify(crateRules)) as {
      crates: { study: { odds: { common: number } } };
    };
    broken.crates.study.odds.common = 61;
    expect(() => validateCrateRules(broken)).toThrow(/add up to 100/);
  });
});
