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
  /** Start the next session by itself when a break ends, after a short countdown. */
  autoStartNext: boolean;
  /** Play a short sound when a session or a break ends. */
  chime: boolean;
  /** Minutes before a planned start for the first reminder, or null for none. */
  remindBeforeMinutes: number | null;
  /** Nudges a day at most when a planned session has not started (0 turns them off). */
  maxNudgesPerDay: number;
  /** "system" follows the computer's setting; "reduced" keeps the mascot and crates still. */
  motion: "system" | "reduced";
  /** "system" follows the computer's light or dark mode; "light" and "dark" stay put. */
  theme: Theme;
  /** The weekly look-ahead: a short guided look at the week. Off unless turned on. */
  weeklyLookahead: boolean;
  /** Day of the week it is offered, 0 = Sunday … 6 = Saturday. */
  lookaheadDay: number;
  /** Local time it is offered, "HH:MM". */
  lookaheadTime: string;
  /** The planner has asked once whether to turn the look-ahead on. */
  lookaheadOffered: boolean;
  /** Days a week to study, 1 to 7. Seven means no rest day. */
  studyDays: number;
  /** The planned rest day, 0 = Sunday … 6 = Saturday, or null for none. */
  restDay: number | null;
}

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  autoBreak: true,
  autoStartNext: false,
  chime: true,
  remindBeforeMinutes: 2,
  maxNudgesPerDay: 3,
  motion: "system",
  theme: "system",
  weeklyLookahead: false,
  lookaheadDay: 0,
  lookaheadTime: "18:00",
  lookaheadOffered: false,
  studyDays: 5,
  restDay: 0,
};

/** Choices offered on the settings screen. */
export const FOCUS_LENGTHS = [15, 20, 25, 30, 45, 50, 60, 90] as const;
export const REMIND_BEFORE = [1, 2, 5, 10, 15] as const;

/** A settings change, or a reason it is not allowed. */
export function checkSettings(changes: Partial<Settings>): string | null {
  const { focusMinutes, remindBeforeMinutes, maxNudgesPerDay, motion, theme } = changes;
  const { lookaheadDay, lookaheadTime, studyDays, restDay } = changes;
  const isWeekday = (d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6;
  if (lookaheadDay !== undefined && !isWeekday(lookaheadDay)) return "Pick a day of the week";
  if (lookaheadTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(lookaheadTime))) {
    return "Pick a time";
  }
  if (
    studyDays !== undefined &&
    !(Number.isInteger(studyDays) && studyDays >= 1 && studyDays <= 7)
  ) {
    return "Study days must be 1 to 7";
  }
  if (restDay !== undefined && restDay !== null && !isWeekday(restDay)) return "Pick a rest day";
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
  if (theme !== undefined && !(THEMES as readonly string[]).includes(theme)) return "Unknown theme";
  for (const key of [
    "autoBreak",
    "autoStartNext",
    "chime",
    "weeklyLookahead",
    "lookaheadOffered",
  ] as const) {
    if (changes[key] !== undefined && typeof changes[key] !== "boolean")
      return "Unknown on/off setting";
  }
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
