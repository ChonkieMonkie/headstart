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

/** Rarities from most to least common. The order matters: it is used for ranking. */
export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export const SLOTS = ["skin", "head", "face", "outfit", "held", "aura"] as const;
export type Slot = (typeof SLOTS)[number];

export const MASCOTS = ["inky", "axo", "maple"] as const;
export type MascotId = (typeof MASCOTS)[number];

export const CRATE_TYPES = ["study", "weekly", "streak", "milestone", "exam"] as const;
export type CrateType = (typeof CRATE_TYPES)[number];

export interface Item {
  /** Permanent id. Never rename or reuse one: inventories refer to it forever. */
  id: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  /** Mascots the item fits. Missing means it fits every mascot. */
  fits?: MascotId[];
  /** Themed set the item belongs to. */
  set?: string;
  /** Season id for items that only drop from Exam Capsules. */
  season?: string;
  /** Legendary skins and other showpieces are animated. */
  animated?: boolean;
  /** Owned from the start (the default skin of each mascot). Never drops. */
  starter?: boolean;
  /** Defaults to true. Seasonal items and legendary skins cannot be crafted. */
  craftable?: boolean;
  /** Defaults to true. False keeps an item out of every crate (for example retired items). */
  dropsFromCrates?: boolean;
}

export type RarityTable = Record<Rarity, number>;

export interface CrateDefinition {
  type: CrateType;
  name: string;
  /** Number of items in one crate. */
  items: number;
  /** Drop chance per item in percent. Must add up to 100. */
  odds: RarityTable;
  /** At least one item in the crate is this rare or rarer. */
  guaranteedMinRarity?: Rarity;
  /** "standard" items, or the current season's items only. */
  pool: "standard" | "seasonal";
}

export interface CrateRules {
  crates: Record<CrateType, CrateDefinition>;
  /** An Epic (or better) is guaranteed within this many crates, a Legendary within the other. */
  pity: { epic: number; legendary: number };
  /** Stardust you get for a duplicate, by rarity. */
  duplicateStardust: RarityTable;
  /** Stardust it costs to craft an item, by rarity. */
  craftCost: RarityTable;
}

export interface RewardRules {
  /** XP per fully focused minute. 0.4 gives 10 XP for a 25-minute session. */
  xpPerFocusMinute: number;
  onTimeBonusXp: number;
  recallBonusXp: number;
  distractionFreeBonusXp: number;
  /** A start counts as on time from this many minutes before to this many after the plan. */
  onTimeWindowMinutes: { early: number; late: number };
  /** A recall shorter than this (in characters, trimmed) earns no bonus. */
  minRecallChars: number;
  /** Sessions shorter than this count for XP but not for crates or the distraction-free bonus. */
  minMinutesForCrate: number;
  /** One Study Crate per this many qualifying sessions. */
  studyCrateEvery: number;
  /** Only this many sessions per day count toward crates, so long days are not overrewarded. */
  maxCrateSessionsPerDay: number;
  /** XP needed to go from level n to n + 1 is base × n ^ exponent, rounded to tens. */
  level: { base: number; exponent: number };
}
