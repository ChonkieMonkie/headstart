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

// Crates given for habits rather than sessions: a Weekly Gift for a met
// weekly goal, a Streak Chest for every four weeks met in a row and a
// Milestone Vault for a major plaque. Each becomes one `gift.granted` with a
// fixed id, so it is given exactly once and never changes afterwards.

import type { CrateType } from "@headstart/content";
import type { GiftReason } from "./events.ts";
import { addDays } from "./reviews.ts";
import type { CoreContext, ProgressState } from "./state.ts";
import { weekStanding } from "./weeks.ts";

/** A Streak Chest every this many weeks met in a row. */
export const STREAK_CHEST_WEEKS = 4;

/** Plaque tiers from this one up count as milestones. */
export const MILESTONE_TIER = 4;

/** One-off plaques that count as milestones (the 66-day habit). */
export const MILESTONE_PLAQUES: readonly string[] = ["habit-formed"];

export interface GiftDue {
  giftId: string;
  crateType: CrateType;
  reason: Exclude<GiftReason, "welcome-back">;
}

/** Whether a recorded plaque tier is big enough for a Milestone Vault. */
export function isMilestone(plaqueId: string, tier: number, tiers: number): boolean {
  if (plaqueId.startsWith("set:")) return true;
  if (MILESTONE_PLAQUES.includes(plaqueId)) return true;
  return tiers >= 5 && tier >= MILESTONE_TIER;
}

/**
 * Crates that have been earned and not given yet, oldest first. Weeks only
 * count for this week and last week, so the first launch after the update
 * gives at most a couple of crates instead of one for every old week.
 */
export function giftsDue(state: ProgressState, now: number, ctx: CoreContext): GiftDue[] {
  const given = new Set(state.crates.map((crate) => crate.id));
  const due: GiftDue[] = [];
  const add = (gift: GiftDue) => {
    if (!given.has(`gift:${gift.giftId}`)) due.push(gift);
  };

  const standing = weekStanding(state, now, ctx);
  const lastWeek = addDays(standing.current.week, -7);
  const recent = [...standing.history.filter((week) => week.week === lastWeek), standing.current];
  for (const week of recent) {
    if (week.run === 0) continue;
    add({ giftId: `weekly:${week.week}`, crateType: "weekly", reason: "weekly-goal" });
    if (week.run % STREAK_CHEST_WEEKS === 0) {
      add({ giftId: `streak:${week.week}`, crateType: "streak", reason: "streak" });
    }
  }

  const tiersOf = new Map((ctx.plaques ?? []).map((def) => [def.id, def.tiers.length]));
  const plaques = [...state.plaques].sort(([, a], [, b]) => a.at - b.at);
  for (const [plaqueId, held] of plaques) {
    const tiers = tiersOf.get(plaqueId) ?? 1;
    const from = tiers >= 5 ? MILESTONE_TIER : 1;
    for (let tier = from; tier <= held.tier; tier++) {
      if (isMilestone(plaqueId, tier, tiers)) {
        add({
          giftId: `milestone:${plaqueId}:${tier}`,
          crateType: "milestone",
          reason: "milestone",
        });
      }
    }
  }
  return due;
}

/** Lit flames on the Streak Chest: weeks of the current run towards the next chest (0 to 4). */
export function streakFlames(run: number): number {
  return run === 0 ? 0 : ((run - 1) % STREAK_CHEST_WEEKS) + 1;
}
