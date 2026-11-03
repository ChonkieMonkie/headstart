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

// XP and levels. Rewards favour the behaviours that make studying work:
// starting on time, finishing the session, and recalling what you learned.

import type { RewardRules } from "@headstart/content";

const MINUTE = 60_000;

/** XP needed to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number, rules: RewardRules): number {
  const raw = rules.level.base * level ** rules.level.exponent;
  return Math.max(10, Math.round(raw / 10) * 10);
}

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP the current level needs in total. */
  xpForNextLevel: number;
  totalXp: number;
}

export function levelInfo(totalXp: number, rules: RewardRules): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let needed = xpToNextLevel(level, rules);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpToNextLevel(level, rules);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed, totalXp: Math.max(0, totalXp) };
}

/** Total XP needed to reach `level` from zero. */
export function totalXpForLevel(level: number, rules: RewardRules): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l, rules);
  return total;
}

/** Whether a start counts as on time compared with the plan. */
export function isOnTime(startedAt: number, plannedStartAt: number, rules: RewardRules): boolean {
  const { early, late } = rules.onTimeWindowMinutes;
  return (
    startedAt >= plannedStartAt - early * MINUTE && startedAt <= plannedStartAt + late * MINUTE
  );
}

export interface SessionScore {
  focusMinutes: number;
  baseXp: number;
  /** Null when the session was not planned, so "on time" does not apply. */
  onTime: boolean | null;
  onTimeXp: number;
  distractionFree: boolean;
  distractionFreeXp: number;
  /** Long enough to count toward crates and the distraction-free bonus. */
  qualifies: boolean;
  totalXp: number;
}

export interface SessionInput {
  focusedMs: number;
  startedAt: number;
  plannedStartAt: number | null;
  distractions: number;
}

export function scoreSession(input: SessionInput, rules: RewardRules): SessionScore {
  const focusMinutes = Math.floor(input.focusedMs / MINUTE);
  const qualifies = focusMinutes >= rules.minMinutesForCrate;
  const baseXp = Math.round(focusMinutes * rules.xpPerFocusMinute);
  const onTime =
    input.plannedStartAt === null ? null : isOnTime(input.startedAt, input.plannedStartAt, rules);
  const onTimeXp = onTime ? rules.onTimeBonusXp : 0;
  const distractionFree = qualifies && input.distractions === 0;
  const distractionFreeXp = distractionFree ? rules.distractionFreeBonusXp : 0;
  return {
    focusMinutes,
    baseXp,
    onTime,
    onTimeXp,
    distractionFree,
    distractionFreeXp,
    qualifies,
    totalXp: baseXp + onTimeXp + distractionFreeXp,
  };
}

/** A recall earns its bonus once it has some real content. */
export function recallEarnsBonus(text: string, rules: RewardRules): boolean {
  return text.trim().length >= rules.minRecallChars;
}
