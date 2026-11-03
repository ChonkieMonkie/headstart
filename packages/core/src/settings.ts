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

// Your settings. They live in the event log like everything else, so they
// move with your data when syncing arrives.

import type { ReminderRules } from "./planner.ts";

export interface Settings {
  /** Length of a session started without a plan, in minutes. */
  focusMinutes: number;
  /** Start the break by itself when a session ends. */
  autoBreak: boolean;
  /** Minutes before a planned start for the first reminder, or null for none. */
  remindBeforeMinutes: number | null;
  /** Nudges a day at most when a planned session has not started (0 turns them off). */
  maxNudgesPerDay: number;
  /** "system" follows the computer's setting; "reduced" keeps the mascot and crates still. */
  motion: "system" | "reduced";
}

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  autoBreak: true,
  remindBeforeMinutes: 2,
  maxNudgesPerDay: 3,
  motion: "system",
};

/** Choices offered on the settings screen. */
export const FOCUS_LENGTHS = [15, 20, 25, 30, 45, 50, 60, 90] as const;
export const REMIND_BEFORE = [1, 2, 5, 10, 15] as const;

/** A settings change, or a reason it is not allowed. */
export function checkSettings(changes: Partial<Settings>): string | null {
  const { focusMinutes, remindBeforeMinutes, maxNudgesPerDay, motion, autoBreak } = changes;
  if (focusMinutes !== undefined && !(FOCUS_LENGTHS as readonly number[]).includes(focusMinutes)) {
    return "Pick one of the session lengths";
  }
  if (
    remindBeforeMinutes !== undefined &&
    remindBeforeMinutes !== null &&
    !(REMIND_BEFORE as readonly number[]).includes(remindBeforeMinutes)
  ) {
    return "Pick one of the reminder times";
  }
  if (
    maxNudgesPerDay !== undefined &&
    (!Number.isInteger(maxNudgesPerDay) || maxNudgesPerDay < 0 || maxNudgesPerDay > 10)
  ) {
    return "Nudges must be a whole number from 0 to 10";
  }
  if (motion !== undefined && motion !== "system" && motion !== "reduced")
    return "Unknown motion setting";
  if (autoBreak !== undefined && typeof autoBreak !== "boolean") return "Unknown break setting";
  return null;
}

/** Applies a change that passed `checkSettings`. Unknown keys from newer versions are ignored. */
export function mergeSettings(current: Settings, changes: Partial<Settings>): Settings {
  if (checkSettings(changes) !== null) return current;
  const next = { ...current };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (changes[key] !== undefined) (next as Record<string, unknown>)[key] = changes[key];
  }
  return next;
}

export function reminderRules(settings: Settings): ReminderRules {
  return {
    soonMinutes: settings.remindBeforeMinutes,
    lateMinutes: 10,
    maxNudgesPerDay: settings.maxNudgesPerDay,
  };
}
