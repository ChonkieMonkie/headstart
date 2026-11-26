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

// The week is the unit of the study habit, not the day. A week is met when it
// has as many study days as the goal asks for, a missed day costs nothing, and
// weeks met in a row replace a daily streak. A freeze, earned by keeping the
// run going, can cover a missed week, but only if the user says so.
//
// Everything here is worked out from sessions and settings. The only things
// stored are the user's own choices: `freeze.used` and `freeze.declined`.

import { addDays, daysBetween } from "./reviews.ts";
import { DEFAULT_SETTINGS } from "./settings.ts";
import { type CoreContext, localDayKey, type ProgressState } from "./state.ts";

/** One week, Monday to Sunday, named by its Monday. */
export interface WeekResult {
  week: string;
  /** Days with at least one session long enough to count. */
  studyDays: number;
  /** Study days the week asked for, halved in a week of coming back. */
  goal: number;
  met: boolean;
  /** Missed, and covered by a freeze. */
  frozen: boolean;
  minutes: number;
  sessions: number;
  /** Its first session came after a week or more away, so its goal was halved. */
  returnWeek: boolean;
  /** It had a rest day, sessions on other days, and none on the rest day. */
  rested: boolean;
  /** All four work modes were used. */
  allModes: boolean;
  /** Met, with three or more planned sessions and every one started on time. */
  perfect: boolean;
  /** Weeks met in a row once this week counted, or 0 when it did not count (yet). */
  run: number;
}

export interface DayMark {
  day: string;
  kind: "studied" | "missed" | "ahead" | "rest";
  today: boolean;
}

export interface WeekStanding {
  today: string;
  /** The week going on now. */
  current: WeekResult;
  days: DayMark[];
  /** Weeks met in a row. A frozen week keeps the run without adding to it. */
  run: number;
  best: number;
  /** Freezes saved up. */
  freezes: number;
  /**
   * Missed weeks that the saved freezes can cover, oldest first: the user is
   * asked. Empty when there is nothing to ask, also when more weeks were
   * missed than there are freezes (then the run simply ended).
   */
  pending: string[];
  /** Finished weeks from the first session on, oldest first. */
  history: WeekResult[];
  /** Days since the last session, or null with no session yet. */
  awayDays: number | null;
  /** Back after a week or more away, with no session yet. */
  welcomeBack: boolean;
}

/** The Monday of the week a day is in. */
export function weekOf(day: string): string {
  return addDays(day, -((weekdayIndex(day) + 6) % 7));
}

/** 0 = Sunday … 6 = Saturday, like `Date.getDay`. */
export function weekdayIndex(day: string): number {
  const [y = 1970, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The seven days of a week, Monday first. */
export function daysOfWeek(week: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(week, i));
}

/**
 * The week a look back is about: the one that is ending or has just ended.
 * On a Sunday evening that is this week, on a Monday morning it is last week.
 */
export function reflectionWeek(today: string): string {
  return weekOf(addDays(today, -3));
}

interface Tally {
  studyDays: Set<string>;
  sessionDays: Set<string>;
  minutes: number;
  sessions: number;
  modes: Set<string>;
  planned: number;
  onTime: number;
}

const emptyTally = (): Tally => ({
  studyDays: new Set(),
  sessionDays: new Set(),
  minutes: 0,
  sessions: 0,
  modes: new Set(),
  planned: 0,
  onTime: 0,
});

/** The goal in effect for a week: what it was at the start, or higher if it was raised during it. */
function goalFor(
  state: ProgressState,
  week: string,
  dayKey: (ms: number) => string,
): { studyDays: number; restDay: number | null } {
  let studyDays = DEFAULT_SETTINGS.studyDays;
  let restDay = DEFAULT_SETTINGS.restDay;
  for (const change of state.goalHistory) {
    const changedIn = weekOf(dayKey(change.at));
    if (changedIn < week) {
      ({ studyDays, restDay } = change);
    } else if (changedIn === week) {
      // A lower goal waits for next week, so a week cannot be saved on its last day.
      if (change.studyDays >= studyDays) ({ studyDays, restDay } = change);
    } else break;
  }
  return { studyDays, restDay: studyDays >= 7 ? null : restDay };
}

export function weekStanding(state: ProgressState, now: number, ctx: CoreContext): WeekStanding {
  const dayKey = ctx.dayKey ?? localDayKey;
  const today = dayKey(now);
  const thisWeek = weekOf(today);
  const { daysAway } = ctx.rewards.welcomeBack;

  // One pass over the sessions: what each week holds, and which weeks began after time away.
  const sessions = [...state.sessions.values()].sort((a, b) => a.startedAt - b.startedAt);
  const tallies = new Map<string, Tally>();
  const returnWeeks = new Set<string>();
  let lastDay: string | null = null;
  for (const record of sessions) {
    const day = dayKey(record.startedAt);
    const week = weekOf(day);
    if (lastDay !== null && daysBetween(lastDay, day) >= daysAway) returnWeeks.add(week);
    lastDay = dayKey(record.endedAt);
    const tally = tallies.get(week) ?? emptyTally();
    tallies.set(week, tally);
    tally.sessions += 1;
    tally.minutes += record.score.focusMinutes;
    tally.sessionDays.add(day);
    if (record.score.qualifies) tally.studyDays.add(day);
    if (record.mode) tally.modes.add(record.mode);
    if (record.score.onTime !== null) {
      tally.planned += 1;
      if (record.score.onTime) tally.onTime += 1;
    }
  }
  const awayDays = lastDay === null ? null : Math.max(0, daysBetween(lastDay, today));
  const welcomeBack = awayDays !== null && awayDays >= daysAway;
  if (welcomeBack) returnWeeks.add(thisWeek);

  const resultOf = (week: string): WeekResult => {
    const tally = tallies.get(week) ?? emptyTally();
    const base = goalFor(state, week, dayKey);
    const returnWeek = returnWeeks.has(week);
    const goal = returnWeek ? Math.ceil(base.studyDays / 2) : base.studyDays;
    const met = tally.studyDays.size >= goal;
    const restDay = base.restDay;
    const rested =
      restDay !== null &&
      tally.sessions > 0 &&
      ![...tally.sessionDays].some((day) => weekdayIndex(day) === restDay);
    return {
      week,
      studyDays: tally.studyDays.size,
      goal,
      met,
      frozen: false,
      minutes: tally.minutes,
      sessions: tally.sessions,
      returnWeek,
      rested,
      allModes: tally.modes.size >= 4,
      perfect: met && tally.planned >= 3 && tally.onTime === tally.planned,
      run: 0,
    };
  };

  // Walk the finished weeks in order, keeping the run and the freezes.
  const { everyWeeks, max } = ctx.rewards.freeze;
  let run = 0;
  let best = 0;
  let freezes = 0;
  let open: string[] = [];
  const history: WeekResult[] = [];
  const count = (result: WeekResult) => {
    if (open.length > 0) {
      // Missed weeks nobody covered, with a week after them: the run ended there.
      run = 0;
      open = [];
    }
    run += 1;
    best = Math.max(best, run);
    if (run % everyWeeks === 0) freezes = Math.min(max, freezes + 1);
    result.run = run;
    return result;
  };
  const first = sessions[0] ? weekOf(dayKey(sessions[0].startedAt)) : thisWeek;
  for (let week = first; week < thisWeek; week = addDays(week, 7)) {
    const result = resultOf(week);
    history.push(result);
    if (result.met) count(result);
    else if (state.frozenWeeks.has(week) && freezes > 0 && run > 0) {
      freezes -= 1;
      result.frozen = true;
    } else if (state.frozenWeeks.has(week) || state.declinedWeeks.has(week) || run === 0) {
      // Answered already (or there was no run to save): the run ends here.
      run = 0;
      open = [];
    } else open.push(week);
  }
  // Missed weeks at the very end: a question for the user if the freezes
  // reach all of them. If they do not, nothing is asked and nothing is used.
  let pending: string[] = [];
  if (open.length > 0) {
    if (freezes >= open.length) pending = open;
    else run = 0;
  }

  const current = resultOf(thisWeek);
  // A week that is met already counts at once, unless a question is still open.
  if (current.met && pending.length === 0) count(current);

  const { restDay } = goalFor(state, thisWeek, dayKey);
  const studied = tallies.get(thisWeek)?.studyDays ?? new Set<string>();
  const days = daysOfWeek(thisWeek).map((day): DayMark => {
    const kind = studied.has(day)
      ? "studied"
      : weekdayIndex(day) === restDay
        ? "rest"
        : day < today
          ? "missed"
          : "ahead";
    return { day, kind, today: day === today };
  });

  return { today, current, days, run, best, freezes, pending, history, awayDays, welcomeBack };
}

/** True when a welcome-back crate may be given now: back after time away, and none given lately. */
export function welcomeGiftDue(state: ProgressState, now: number, ctx: CoreContext): boolean {
  const { giftEveryDays } = ctx.rewards.welcomeBack;
  if (!weekStanding(state, now, ctx).welcomeBack) return false;
  const last = state.lastWelcomeGiftAt;
  return last === null || now - last >= giftEveryDays * 86_400_000;
}
