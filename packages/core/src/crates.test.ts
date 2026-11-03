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
  type CrateRules,
  type CrateType,
  crateRules,
  type Item,
  items,
  RARITIES,
  type Rarity,
} from "@headstart/content";
import { describe, expect, it } from "vitest";
import {
  atLeast,
  craftBlocker,
  crateOdds,
  formatPercent,
  NO_PITY,
  nextPity,
  type PityState,
  rollCrate,
  rollRarity,
} from "./crates.ts";
import { createRng } from "./rng.ts";

function openMany(type: CrateType, count: number, rules: CrateRules = crateRules) {
  let pity: PityState = NO_PITY;
  const owned = new Map<string, number>();
  const results = [];
  for (let i = 0; i < count; i++) {
    const result = rollCrate({
      seed: `${type}-${i}`,
      definition: rules.crates[type],
      rules,
      pity,
      owned,
      catalog: items,
    });
    for (const drop of result.drops)
      if (drop.itemId) owned.set(drop.itemId, (owned.get(drop.itemId) ?? 0) + 1);
    pity = result.pityAfter;
    results.push(result);
  }
  return results;
}

function longestRun(results: ReturnType<typeof openMany>, hit: (r: Rarity) => boolean): number {
  let run = 0;
  let longest = 0;
  for (const { drops } of results) {
    run = drops.some((d) => hit(d.rarity)) ? 0 : run + 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

describe("rarity rolls", () => {
  it("match the published Study Crate odds over a million rolls", () => {
    const rng = createRng("odds");
    const counts = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>;
    const n = 1_000_000;
    for (let i = 0; i < n; i++) counts[rollRarity(rng, crateRules.crates.study.odds)] += 1;
    for (const rarity of RARITIES) {
      const percent = (counts[rarity] / n) * 100;
      expect(Math.abs(percent - crateRules.crates.study.odds[rarity]), rarity).toBeLessThan(0.2);
    }
  });

  it("never roll a rarity with zero odds", () => {
    const rng = createRng("zero");
    for (let i = 0; i < 50_000; i++) {
      expect(atLeast(rollRarity(rng, crateRules.crates.milestone.odds), "epic")).toBe(true);
    }
  });
});

describe("crates", () => {
  it("give the same result for the same seed", () => {
    const input = {
      seed: "same",
      definition: crateRules.crates.weekly,
      rules: crateRules,
      pity: NO_PITY,
      owned: new Map<string, number>(),
      catalog: items,
    };
    expect(rollCrate(input)).toEqual(rollCrate(input));
  });

  it("guarantee an Epic within 15 crates and a Legendary within 60", () => {
    const results = openMany("study", 30_000);
    expect(longestRun(results, (r) => atLeast(r, "epic"))).toBeLessThanOrEqual(
      crateRules.pity.epic - 1,
    );
    expect(longestRun(results, (r) => r === "legendary")).toBeLessThanOrEqual(
      crateRules.pity.legendary - 1,
    );
  });

  it("would have longer droughts without pity, so the guarantee really kicks in", () => {
    const noPity: CrateRules = { ...crateRules, pity: { epic: 10_000, legendary: 10_000 } };
    const results = openMany("study", 30_000, noPity);
    expect(longestRun(results, (r) => atLeast(r, "epic"))).toBeGreaterThan(crateRules.pity.epic);
  });

  it("put at least one Rare or better in every Streak Chest", () => {
    for (const { drops } of openMany("streak", 3_000)) {
      expect(drops).toHaveLength(3);
      expect(drops.some((d) => atLeast(d.rarity, "rare"))).toBe(true);
    }
  });

  it("only drop Epic or Legendary from a Milestone Vault", () => {
    for (const { drops } of openMany("milestone", 2_000)) {
      for (const drop of drops) expect(atLeast(drop.rarity, "epic")).toBe(true);
    }
  });

  it("never drop starter skins and turn duplicates into Stardust", () => {
    const starters = new Set(items.filter((i) => i.starter).map((i) => i.id));
    let duplicates = 0;
    for (const { drops } of openMany("study", 2_000)) {
      for (const drop of drops) {
        expect(starters.has(drop.itemId ?? "")).toBe(false);
        if (drop.duplicate) {
          duplicates += 1;
          expect(drop.stardust).toBe(crateRules.duplicateStardust[drop.rarity]);
        } else {
          expect(drop.stardust).toBe(0);
        }
      }
    }
    expect(duplicates).toBeGreaterThan(0);
  });

  it("only drop seasonal items from Exam Capsules, and Stardust when the season is empty", () => {
    const seasonal: Item = {
      id: "head.exam-cap",
      name: "Exam Cap",
      slot: "head",
      rarity: "rare",
      season: "2026-autumn",
    };
    const withSeason = rollCrate({
      seed: "exam",
      definition: crateRules.crates.exam,
      rules: crateRules,
      pity: NO_PITY,
      owned: new Map(),
      catalog: [...items, seasonal],
    });
    expect(withSeason.drops.every((d) => d.itemId === seasonal.id)).toBe(true);

    const empty = rollCrate({
      seed: "exam",
      definition: crateRules.crates.exam,
      rules: crateRules,
      pity: NO_PITY,
      owned: new Map(),
      catalog: items,
    });
    for (const drop of empty.drops) {
      expect(drop.itemId).toBeNull();
      expect(drop.stardust).toBe(crateRules.duplicateStardust[drop.rarity]);
    }
  });
});

describe("pity counters", () => {
  it("reset on Epic and Legendary and grow otherwise", () => {
    expect(nextPity({ sinceEpic: 3, sinceLegendary: 7 }, "rare")).toEqual({
      sinceEpic: 4,
      sinceLegendary: 8,
    });
    expect(nextPity({ sinceEpic: 3, sinceLegendary: 7 }, "epic")).toEqual({
      sinceEpic: 0,
      sinceLegendary: 8,
    });
    expect(nextPity({ sinceEpic: 3, sinceLegendary: 7 }, "legendary")).toEqual({
      sinceEpic: 0,
      sinceLegendary: 0,
    });
  });
});

describe("odds shown in the app", () => {
  const row = (type: CrateType, rarity: Rarity, pity: PityState = NO_PITY) =>
    crateOdds(crateRules.crates[type], crateRules, pity).find((r) => r.rarity === rarity);

  it("list the Study Crate chances with the Epic and Legendary guarantees", () => {
    expect(row("study", "epic")).toEqual({
      rarity: "epic",
      percent: 3.2,
      guaranteedWithin: 15,
      guaranteedIn: 15,
    });
    expect(row("study", "legendary")).toEqual({
      rarity: "legendary",
      percent: 0.8,
      guaranteedWithin: 60,
      guaranteedIn: 60,
    });
    expect(row("study", "rare")?.guaranteedWithin).toBeNull();
    expect(formatPercent(3.2)).toBe("3.2%");
    expect(formatPercent(62)).toBe("62%");
  });

  it("count down with the pity counters, and match when the roll is forced", () => {
    const pity = { sinceEpic: 14, sinceLegendary: 22 };
    expect(row("study", "epic", pity)?.guaranteedIn).toBe(1);
    expect(row("study", "legendary", pity)?.guaranteedIn).toBe(38);
    const forced = rollCrate({
      seed: "forced",
      definition: crateRules.crates.study,
      rules: crateRules,
      pity,
      owned: new Map(),
      catalog: items,
    });
    expect(atLeast(forced.drops[0]?.rarity ?? "common", "epic")).toBe(true);
  });

  it("skip the Epic guarantee where every item is already Epic or better", () => {
    expect(row("milestone", "epic")?.guaranteedWithin).toBeNull();
    expect(row("milestone", "legendary")?.guaranteedWithin).toBe(60);
    expect(row("milestone", "common")).toBeUndefined();
  });
});

describe("crafting", () => {
  const byId = (id: string) => items.find((i) => i.id === id);

  it("needs enough Stardust", () => {
    expect(craftBlocker(byId("head.headphones"), 399, new Map(), crateRules)).toMatch(/Needs 400/);
    expect(craftBlocker(byId("head.headphones"), 400, new Map(), crateRules)).toBeNull();
  });

  it("refuses items you own, starters and legendary skins", () => {
    expect(
      craftBlocker(byId("head.headphones"), 9999, new Map([["head.headphones", 1]]), crateRules),
    ).toMatch(/already/);
    expect(craftBlocker(byId("skin.maple.classic"), 9999, new Map(), crateRules)).toMatch(
      /already/,
    );
    expect(craftBlocker(byId("skin.maple.wildfire"), 9999, new Map(), crateRules)).toMatch(
      /cannot be crafted/,
    );
    expect(craftBlocker(undefined, 9999, new Map(), crateRules)).toMatch(/Unknown/);
  });
});
