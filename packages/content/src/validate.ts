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

// Checks content files when they load, so a typo in JSON fails loudly in tests
// and CI instead of quietly breaking crates in the app.

import {
  CRATE_TYPES,
  type CrateRules,
  ITEM_RARITIES,
  type Item,
  type ItemSet,
  MASCOTS,
  RARITIES,
  type RarityTable,
  type RewardRules,
  SKIN_ANIMATIONS,
  SKIN_PATTERNS,
  type SkinArt,
  SLOTS,
  type Slot,
  WEAR_SHAPES,
  type WearArt,
} from "./types.ts";

export class ContentError extends Error {
  override name = "ContentError";
}

type Json = Record<string, unknown>;

function fail(where: string, message: string): never {
  throw new ContentError(`${where}: ${message}`);
}

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, options: readonly T[], where: string): T {
  if (typeof value !== "string" || !(options as readonly string[]).includes(value)) {
    fail(where, `expected one of ${options.join(", ")}, got ${JSON.stringify(value)}`);
  }
  return value as T;
}

function nonNegative(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    fail(where, `expected a number ≥ 0, got ${JSON.stringify(value)}`);
  }
  return value;
}

function rarityTable(value: unknown, where: string): RarityTable {
  if (!isObject(value)) fail(where, "expected an object with one number per rarity");
  const table = {} as RarityTable;
  for (const rarity of RARITIES) table[rarity] = nonNegative(value[rarity], `${where}.${rarity}`);
  return table;
}

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function color(value: unknown, where: string): string {
  if (typeof value !== "string" || !HEX_COLOR.test(value)) {
    fail(where, `expected a "#RRGGBB" colour, got ${JSON.stringify(value)}`);
  }
  return value;
}

function text(value: unknown, where: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(where, "expected some text");
  return value;
}

function skinArt(value: unknown, where: string): SkinArt {
  if (!isObject(value)) fail(where, "expected skin colours");
  const art: SkinArt = {
    body: color(value.body, `${where}.body`),
    shade: color(value.shade, `${where}.shade`),
    accent: color(value.accent, `${where}.accent`),
  };
  for (const key of ["light", "cream", "limb", "spot"] as const) {
    if (value[key] !== undefined) art[key] = color(value[key], `${where}.${key}`);
  }
  if (art.light === undefined && art.cream === undefined) {
    fail(where, "needs a light or a cream colour");
  }
  if (value.pattern !== undefined) {
    art.pattern = oneOf(value.pattern, SKIN_PATTERNS, `${where}.pattern`);
  }
  if (value.animation !== undefined) {
    art.animation = oneOf(value.animation, SKIN_ANIMATIONS, `${where}.animation`);
  }
  return art;
}

function wearArt(value: unknown, slot: Exclude<Slot, "skin">, where: string): WearArt {
  if (!isObject(value)) fail(where, "expected { shape, colors }");
  const shapes: Record<string, number> = WEAR_SHAPES[slot];
  const shape = oneOf(value.shape, Object.keys(shapes), `${where}.shape`);
  const colors = value.colors;
  const count = shapes[shape] ?? 0;
  if (!Array.isArray(colors) || colors.length !== count) {
    fail(`${where}.colors`, `${shape} takes exactly ${count} colours`);
  }
  return { shape, colors: colors.map((c, i) => color(c, `${where}.colors[${i}]`)) };
}

export function validateSets(value: unknown): ItemSet[] {
  if (!Array.isArray(value)) fail("sets", "expected an array");
  const seen = new Set<string>();
  return value.map((raw, index) => {
    const where = `sets[${index}]`;
    if (!isObject(raw)) fail(where, "expected an object");
    const id = raw.id;
    if (typeof id !== "string" || !ID_PATTERN.test(id)) fail(where, "id must be lowercase");
    if (seen.has(id)) fail(where, `duplicate id "${id}"`);
    seen.add(id);
    return {
      id,
      name: text(raw.name, `sets.${id}.name`),
      description: text(raw.description, `sets.${id}.description`),
      tint: color(raw.tint, `sets.${id}.tint`),
      color: color(raw.color, `sets.${id}.color`),
    };
  });
}

/** Checks the catalogue. With `sets`, every item's set must be one of them. */
export function validateItems(value: unknown, sets?: readonly ItemSet[]): Item[] {
  if (!Array.isArray(value)) fail("items", "expected an array");
  const seen = new Set<string>();
  const starterSkins = new Set<string>();

  return value.map((raw, index) => {
    const where = `items[${index}]`;
    if (!isObject(raw)) fail(where, "expected an object");
    const id = raw.id;
    if (typeof id !== "string" || !ID_PATTERN.test(id))
      fail(where, "id must be lowercase, dot or dash separated");
    if (seen.has(id)) fail(where, `duplicate id "${id}"`);
    seen.add(id);
    if (typeof raw.name !== "string" || raw.name.trim() === "")
      fail(`items.${id}`, "name is required");

    const slot = oneOf(raw.slot, SLOTS, `items.${id}.slot`);
    const item: Item = {
      id,
      name: raw.name,
      slot,
      rarity: oneOf(raw.rarity, ITEM_RARITIES, `items.${id}.rarity`),
      art:
        slot === "skin"
          ? skinArt(raw.art, `items.${id}.art`)
          : wearArt(raw.art, slot, `items.${id}.art`),
    };
    if (raw.description !== undefined) {
      item.description = text(raw.description, `items.${id}.description`);
    }
    if (raw.fits !== undefined) {
      if (!Array.isArray(raw.fits) || raw.fits.length === 0)
        fail(`items.${id}.fits`, "expected a non-empty list");
      item.fits = raw.fits.map((m, i) => oneOf(m, MASCOTS, `items.${id}.fits[${i}]`));
    }
    for (const key of ["set", "season"] as const) {
      const v = raw[key];
      if (v !== undefined) {
        if (typeof v !== "string" || v === "") fail(`items.${id}.${key}`, "expected a string");
        item[key] = v;
      }
    }
    for (const key of [
      "animated",
      "starter",
      "craftable",
      "dropsFromCrates",
      "grantOnly",
    ] as const) {
      const v = raw[key];
      if (v !== undefined) {
        if (typeof v !== "boolean") fail(`items.${id}.${key}`, "expected true or false");
        item[key] = v;
      }
    }
    if (item.set !== undefined && sets && !sets.some((set) => set.id === item.set)) {
      fail(`items.${id}.set`, `unknown set "${item.set}"`);
    }
    // Exotic and grant-only go together, and such items can never be rolled or crafted.
    if ((item.rarity === "exotic") !== (item.grantOnly === true)) {
      fail(`items.${id}`, "Exotic items, and only those, are grant-only");
    }
    if (
      item.grantOnly &&
      (item.craftable === true || item.dropsFromCrates === true || item.set || item.season)
    ) {
      fail(`items.${id}`, "a grant-only item cannot drop, be crafted or belong to a set or season");
    }
    if (item.slot === "skin" && item.fits?.length !== 1) {
      fail(`items.${id}`, "a skin must fit exactly one mascot");
    }
    if (item.starter) {
      if (item.slot !== "skin") fail(`items.${id}`, "only skins can be starters");
      const mascot = item.fits?.[0] ?? "";
      if (starterSkins.has(mascot)) fail(`items.${id}`, `${mascot} already has a starter skin`);
      starterSkins.add(mascot);
    }
    return item;
  });
}

export function validateCrateRules(value: unknown): CrateRules {
  if (!isObject(value)) fail("crates", "expected an object");
  const cratesRaw = value.crates;
  if (!isObject(cratesRaw)) fail("crates.crates", "expected an object");

  const crates = {} as CrateRules["crates"];
  for (const type of CRATE_TYPES) {
    const where = `crates.${type}`;
    const raw = cratesRaw[type];
    if (!isObject(raw)) fail(where, "missing crate definition");
    if (raw.type !== type) fail(where, `type must be "${type}"`);
    if (typeof raw.name !== "string" || raw.name === "") fail(where, "name is required");
    const items = raw.items;
    if (typeof items !== "number" || !Number.isInteger(items) || items < 1)
      fail(where, "items must be a whole number ≥ 1");
    const odds = rarityTable(raw.odds, `${where}.odds`);
    const total = RARITIES.reduce((sum, r) => sum + odds[r], 0);
    if (Math.abs(total - 100) > 1e-9) fail(`${where}.odds`, `must add up to 100, got ${total}`);
    crates[type] = {
      type,
      name: raw.name,
      items,
      odds,
      pool: oneOf(raw.pool, ["standard", "seasonal"] as const, `${where}.pool`),
    };
    if (raw.guaranteedMinRarity !== undefined) {
      crates[type].guaranteedMinRarity = oneOf(
        raw.guaranteedMinRarity,
        RARITIES,
        `${where}.guaranteedMinRarity`,
      );
    }
  }

  const pity = value.pity;
  if (!isObject(pity)) fail("crates.pity", "expected { epic, legendary }");
  const epic = nonNegative(pity.epic, "crates.pity.epic");
  const legendary = nonNegative(pity.legendary, "crates.pity.legendary");
  if (!Number.isInteger(epic) || !Number.isInteger(legendary) || epic < 1 || legendary < epic) {
    fail("crates.pity", "expected whole numbers with 1 ≤ epic ≤ legendary");
  }

  return {
    crates,
    pity: { epic, legendary },
    duplicateStardust: rarityTable(value.duplicateStardust, "crates.duplicateStardust"),
    craftCost: rarityTable(value.craftCost, "crates.craftCost"),
  };
}

export function validateRewardRules(value: unknown): RewardRules {
  if (!isObject(value)) fail("rewards", "expected an object");
  const window = value.onTimeWindowMinutes;
  const level = value.level;
  if (!isObject(window)) fail("rewards.onTimeWindowMinutes", "expected { early, late }");
  if (!isObject(level)) fail("rewards.level", "expected { base, exponent }");

  const whole = (v: unknown, where: string) => {
    const n = nonNegative(v, where);
    if (!Number.isInteger(n)) fail(where, "expected a whole number");
    return n;
  };

  const rules: RewardRules = {
    xpPerFocusMinute: nonNegative(value.xpPerFocusMinute, "rewards.xpPerFocusMinute"),
    onTimeBonusXp: whole(value.onTimeBonusXp, "rewards.onTimeBonusXp"),
    recallBonusXp: whole(value.recallBonusXp, "rewards.recallBonusXp"),
    distractionFreeBonusXp: whole(value.distractionFreeBonusXp, "rewards.distractionFreeBonusXp"),
    onTimeWindowMinutes: {
      early: whole(window.early, "rewards.onTimeWindowMinutes.early"),
      late: whole(window.late, "rewards.onTimeWindowMinutes.late"),
    },
    minRecallChars: whole(value.minRecallChars, "rewards.minRecallChars"),
    minMinutesForCrate: whole(value.minMinutesForCrate, "rewards.minMinutesForCrate"),
    studyCrateEvery: whole(value.studyCrateEvery, "rewards.studyCrateEvery"),
    maxCrateSessionsPerDay: whole(value.maxCrateSessionsPerDay, "rewards.maxCrateSessionsPerDay"),
    level: {
      base: nonNegative(level.base, "rewards.level.base"),
      exponent: nonNegative(level.exponent, "rewards.level.exponent"),
    },
  };
  if (rules.studyCrateEvery < 1) fail("rewards.studyCrateEvery", "must be at least 1");
  if (rules.level.base <= 0) fail("rewards.level.base", "must be greater than 0");
  return rules;
}
