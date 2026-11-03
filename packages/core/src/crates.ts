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

// Crate rolls, pity and crafting. Rolls are seeded per crate, so they are
// fair, reproducible and match the odds shown in the app.

import {
  type CrateDefinition,
  type CrateRules,
  type Item,
  type MascotId,
  RARITIES,
  type Rarity,
  type RarityTable,
} from "@headstart/content";
import type { CrateDrop } from "./events.ts";
import { createRng, type Rng, randomIndex } from "./rng.ts";

export function rarityRank(rarity: Rarity): number {
  return RARITIES.indexOf(rarity);
}

export function atLeast(rarity: Rarity, minimum: Rarity): boolean {
  return rarityRank(rarity) >= rarityRank(minimum);
}

function rarityAt(rank: number): Rarity {
  const rarity = RARITIES[rank];
  if (!rarity) throw new RangeError(`No rarity at rank ${rank}`);
  return rarity;
}

/** Picks a rarity using percentage odds that add up to 100. */
export function rollRarity(rng: Rng, odds: RarityTable): Rarity {
  let roll = rng() * 100;
  let last: Rarity = "common";
  for (const rarity of RARITIES) {
    if (odds[rarity] <= 0) continue;
    last = rarity;
    roll -= odds[rarity];
    if (roll < 0) return rarity;
  }
  return last; // only reachable through floating-point rounding
}

/** Crates opened in a row without an Epic+ and without a Legendary. */
export interface PityState {
  sinceEpic: number;
  sinceLegendary: number;
}

export const NO_PITY: PityState = { sinceEpic: 0, sinceLegendary: 0 };

/** The pity counters after opening a crate whose best item had `best` rarity. */
export function nextPity(pity: PityState, best: Rarity): PityState {
  return {
    sinceEpic: atLeast(best, "epic") ? 0 : pity.sinceEpic + 1,
    sinceLegendary: best === "legendary" ? 0 : pity.sinceLegendary + 1,
  };
}

export interface OddsRow {
  rarity: Rarity;
  /** Chance per item, as listed in the crate rules. */
  percent: number;
  /** Pity limit: at most this many crates in a row without this rarity, or null. */
  guaranteedWithin: number | null;
  /** Crates left until the guarantee kicks in, counting the next one, or null. */
  guaranteedIn: number | null;
}

/**
 * The odds to show for a crate. Epic and Legendary also carry the pity
 * guarantee, since pity makes them more common than the listed chance alone.
 */
export function crateOdds(
  definition: CrateDefinition,
  rules: CrateRules,
  pity: PityState = NO_PITY,
): OddsRow[] {
  const alwaysEpic = RARITIES.every((r) => atLeast(r, "epic") || definition.odds[r] <= 0);
  return RARITIES.filter((rarity) => definition.odds[rarity] > 0).map((rarity) => {
    const percent = definition.odds[rarity];
    let within: number | null = null;
    let since = 0;
    if (rarity === "epic" && !alwaysEpic) {
      within = rules.pity.epic;
      since = pity.sinceEpic;
    } else if (rarity === "legendary" && percent < 100) {
      within = rules.pity.legendary;
      since = pity.sinceLegendary;
    }
    return {
      rarity,
      percent,
      guaranteedWithin: within,
      guaranteedIn: within === null ? null : Math.max(1, within - since),
    };
  });
}

/** "3.2%", "62%". */
export function formatPercent(percent: number): string {
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
}

export function itemFits(item: Item, mascot: MascotId): boolean {
  return !item.fits || item.fits.includes(mascot);
}

/** Items a crate of this kind can drop. */
export function cratePool(definition: CrateDefinition, catalog: readonly Item[]): Item[] {
  return catalog.filter((item) => {
    if (item.starter || item.dropsFromCrates === false) return false;
    return definition.pool === "seasonal" ? item.season !== undefined : item.season === undefined;
  });
}

export interface RollCrateInput {
  seed: string;
  definition: CrateDefinition;
  rules: CrateRules;
  pity: PityState;
  /** Item id → copies owned. Used to mark duplicates. */
  owned: ReadonlyMap<string, number>;
  catalog: readonly Item[];
}

export interface RollCrateResult {
  drops: CrateDrop[];
  pityAfter: PityState;
}

/**
 * Opens a crate. The same input always gives the same result.
 *
 * Guarantees, applied in this order to the first item:
 * 1. Legendary pity: the crate after `pity.legendary - 1` crates without one.
 * 2. Epic pity: likewise for Epic or better.
 * Then the last item is raised to the crate's guaranteed minimum if no
 * earlier item reached it.
 */
export function rollCrate(input: RollCrateInput): RollCrateResult {
  const { definition, rules, pity } = input;
  const rng = createRng(`crate:${input.seed}`);
  const pool = cratePool(definition, input.catalog);
  const owned = new Map(input.owned);
  const drops: CrateDrop[] = [];

  for (let i = 0; i < definition.items; i++) {
    let rarity = rollRarity(rng, definition.odds);

    if (i === 0) {
      if (pity.sinceLegendary >= rules.pity.legendary - 1) rarity = "legendary";
      else if (pity.sinceEpic >= rules.pity.epic - 1 && !atLeast(rarity, "epic")) rarity = "epic";
    }

    const minimum = definition.guaranteedMinRarity;
    const isLast = i === definition.items - 1;
    if (minimum && isLast && !atLeast(rarity, minimum)) {
      const alreadyMet = drops.some((drop) => atLeast(drop.rarity, minimum));
      if (!alreadyMet) rarity = minimum;
    }

    const drop = pickItem(rng, pool, rarity, owned, rules);
    if (drop.itemId) owned.set(drop.itemId, (owned.get(drop.itemId) ?? 0) + 1);
    drops.push(drop);
  }

  const best = drops.reduce<Rarity>(
    (top, drop) => (rarityRank(drop.rarity) > rarityRank(top) ? drop.rarity : top),
    "common",
  );
  return { drops, pityAfter: nextPity(pity, best) };
}

function pickItem(
  rng: Rng,
  pool: readonly Item[],
  rarity: Rarity,
  owned: ReadonlyMap<string, number>,
  rules: CrateRules,
): CrateDrop {
  // If nothing of the rolled rarity exists in this pool (a small or empty
  // season), fall back to the next rarer and then the next commoner tier.
  for (const rank of fallbackOrder(rarityRank(rarity))) {
    const tier = rarityAt(rank);
    const candidates = pool.filter((item) => item.rarity === tier);
    if (candidates.length === 0) continue;
    const item = candidates[randomIndex(rng, candidates.length)];
    if (!item) continue;
    const duplicate = (owned.get(item.id) ?? 0) > 0;
    return {
      itemId: item.id,
      rarity: tier,
      duplicate,
      stardust: duplicate ? rules.duplicateStardust[tier] : 0,
    };
  }
  return { itemId: null, rarity, duplicate: false, stardust: rules.duplicateStardust[rarity] };
}

function fallbackOrder(start: number): number[] {
  const order = [start];
  for (let r = start + 1; r < RARITIES.length; r++) order.push(r);
  for (let r = start - 1; r >= 0; r--) order.push(r);
  return order;
}

/** Why an item cannot be crafted, or null when it can. */
export function craftBlocker(
  item: Item | undefined,
  stardust: number,
  owned: ReadonlyMap<string, number>,
  rules: CrateRules,
): string | null {
  if (!item) return "Unknown item";
  if (item.starter) return "You already have this item";
  if (item.craftable === false || item.season !== undefined) return "This item cannot be crafted";
  if ((owned.get(item.id) ?? 0) > 0) return "You already have this item";
  const cost = rules.craftCost[item.rarity];
  if (stardust < cost) return `Needs ${cost} Stardust, you have ${stardust}`;
  return null;
}
