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

import cratesJson from "../data/crates.json" with { type: "json" };
import itemsJson from "../data/items.json" with { type: "json" };
import plaquesJson from "../data/plaques.json" with { type: "json" };
import ranksJson from "../data/ranks.json" with { type: "json" };
import rewardsJson from "../data/rewards.json" with { type: "json" };
import setsJson from "../data/sets.json" with { type: "json" };
import { PACKS } from "./packs.ts";
import {
  catalogWithPacks,
  mergeShapes,
  validateCrateRules,
  validateItems,
  validatePlaques,
  validateRanks,
  validateRewardRules,
  validateSets,
} from "./validate.ts";

export { PACKS } from "./packs.ts";
export * from "./types.ts";
export {
  ContentError,
  catalogWithPacks,
  mergeShapes,
  PLAQUE_TIERS,
  validateCrateRules,
  validateItems,
  validatePlaques,
  validateRanks,
  validateRewardRules,
  validateSets,
} from "./validate.ts";

/** Themed item sets. */
export const sets = validateSets(setsJson);

/** Every shape and background scene the renderer can draw, packs included. */
export const shapeTables = mergeShapes(PACKS);

/** The item catalogue, packs included, validated when the module loads. */
export const items = validateItems(catalogWithPacks(itemsJson, PACKS), sets, shapeTables);

/** Crate definitions, odds, pity limits and Insight values. */
export const crateRules = validateCrateRules(cratesJson);

/** XP, bonus and level rules. */
export const rewardRules = validateRewardRules(rewardsJson);

/** The names that go with bands of levels. */
export const ranks = validateRanks(ranksJson);

/** The plaques: what each one counts and what its tiers need. */
export const plaques = validatePlaques(plaquesJson);
