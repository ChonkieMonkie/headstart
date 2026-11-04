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

import { crateRules, items, rewardRules } from "@headstart/content";
import type { CoreContext } from "./state.ts";

export const APP_NAME = "Headstart";

/** The context built from the shipped content. */
export const defaultContext: CoreContext = {
  rewards: rewardRules,
  crates: crateRules,
  catalog: items,
};

export * from "./collection.ts";
export * from "./commands.ts";
export * from "./crates.ts";
export * from "./developer.ts";
export * from "./engine.ts";
export * from "./events.ts";
export * from "./ids.ts";
export * from "./planner.ts";
export * from "./rewards.ts";
export * from "./rng.ts";
export * from "./settings.ts";
export * from "./simulation.ts";
export * from "./state.ts";
export * from "./stats.ts";
export * from "./store.ts";
export { formatDuration, formatMinutes } from "./time.ts";
export * from "./timer.ts";
