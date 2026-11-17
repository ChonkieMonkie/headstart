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

// Plaques: small marks of things the user actually did. Most of them grow in
// five tiers as a count passes each number; a few happen once. What each one
// counts is worked out from the log here. A tier that has been reached is
// stored (`plaque.earned`), so changing a number later never takes it away.

import type { PlaqueDef, PlaqueMetric } from "@headstart/content";
import { LEARNED_STEP } from "./reviews.ts";
import { levelInfo } from "./rewards.ts";
import { type CoreContext, localDayKey, owns, type ProgressState } from "./state.ts";
import { weekStanding } from "./weeks.ts";

/** A study day this long after the first session, with most weeks met, is a habit. */
const HABIT_DAYS = 66;
const HABIT_SHARE = 0.6;

export interface PlaqueStanding {
  def: PlaqueDef;
  /** How far the count has come. */
  count: number;
  /** The tier held: the highest one earned, 0 for none. */
  tier: number;
  /** The tier the count has reached, which may be ahead of `tier` until it is recorded. */
  reached: number;
  /** What the next tier needs, or null at the top. */
  next: number | null;
  earnedAt: number | null;
}

/** The id of the Exam Ready plaque of a course, and of the plaque of a finished set. */
export const examPlaqueId = (courseId: string) => `exam:${courseId}`;
export const setPlaqueId = (setId: string) => `set:${setId}`;

/** Every count a plaque can ask for, worked out in one go. */
export function plaqueCounts(
  state: ProgressState,
  now: number,
  ctx: CoreContext,
): Record<PlaqueMetric, number> {
  const dayKey = ctx.dayKey ?? localDayKey;
  const weeks = weekStanding(state, now, ctx);
  const allWeeks = [...weeks.history, weeks.current];

  const perDay = new Map<string, { clean: number; qualifying: number }>();
  let onTimeStarts = 0;
  let longSessions = 0;
  let earlySessions = 0;
  let recalls = 0;
  let questions = 0;
  const modes = { mixed: 0, test: 0, explain: 0, read: 0 };
  let firstStart: number | null = null;
  for (const record of state.sessions.values()) {
    if (firstStart === null || record.startedAt < firstStart) firstStart = record.startedAt;
    if (record.score.onTime) onTimeStarts += 1;
    if (record.score.focusMinutes >= 50) longSessions += 1;
    if (record.recallText) recalls += 1;
    if (record.recallQuestion) questions += 1;
    if (record.mode) modes[record.mode] += 1;
    if (!record.score.qualifies) continue;
    if (new Date(record.startedAt).getHours() < 10) earlySessions += 1;
    const day = dayKey(record.startedAt);
    const tally = perDay.get(day) ?? { clean: 0, qualifying: 0 };
    perDay.set(day, tally);
    tally.qualifying += 1;
    if (record.score.distractionFree) tally.clean += 1;
  }
  let deepDays = 0;
  let bigDays = 0;
  for (const tally of perDay.values()) {
    if (tally.clean >= 4) deepDays += 1;
    if (tally.qualifying >= 6) bigDays += 1;
  }

  let dueReviews = 0;
  let learnedNotes = 0;
  for (const record of state.reviews.values()) {
    if (record.step >= LEARNED_STEP) learnedNotes += 1;
    for (const review of record.reviews) if (review.due) dueReviews += 1;
  }

  let tasksDone = 0;
  for (const task of state.tasks.values()) if (task.done) tasksDone += 1;

  const itemsOwned = ctx.catalog.filter((item) => !item.starter && owns(state, item.id)).length;

  const finished = weeks.history;
  const metWeeks = finished.filter((w) => w.met).length;
  const daysIn = firstStart === null ? 0 : (now - firstStart) / 86_400_000;
  const habitFormed =
    daysIn >= HABIT_DAYS && finished.length > 0 && metWeeks / finished.length >= HABIT_SHARE;

  return {
    sessions: state.sessions.size,
    focusHours: Math.floor(state.focusMinutes / 60),
    onTimeStreak: state.bestOnTimeStreak,
    onTimeStarts,
    deepDays,
    longSessions,
    earlySessions,
    recalls,
    questions,
    dueReviews,
    learnedNotes,
    mixedSessions: modes.mixed,
    testSessions: modes.test,
    explainSessions: modes.explain,
    weekRun: weeks.best,
    restedWeeks: finished.filter((w) => w.rested).length,
    reflections: state.reflections.size,
    plannedWeeks: state.lookaheadWeeks.size,
    tasksDone,
    thoughtsParked: state.thoughtsParked,
    itemsOwned,
    itemsCrafted: state.itemsCrafted,
    level: levelInfo(state.xp, ctx.rewards).level,
    habitFormed: habitFormed ? 1 : 0,
    comebacks: allWeeks.filter((w) => w.returnWeek && w.sessions >= 3).length,
    fullHouseWeeks: allWeeks.filter((w) => w.allModes).length,
    bigDays,
    perfectWeeks: finished.filter((w) => w.perfect).length,
  };
}

/**
 * Exam Ready: the exam day has come and no review of the course was left
 * undone by then. One plaque per course that has notes.
 */
function examReady(state: ProgressState, today: string): string[] {
  const ready: string[] = [];
  for (const course of state.courses.values()) {
    const exam = course.examDate;
    if (!exam || exam > today) continue;
    const notes = [...state.reviews.values()].filter(
      (r) => r.courseId === course.id && r.sessionDay <= exam,
    );
    if (notes.length === 0) continue;
    if (notes.every((r) => r.dueDay === null || r.dueDay > exam)) ready.push(course.id);
  }
  return ready;
}

/** The sets whose every item is owned. */
function finishedSets(state: ProgressState, ctx: CoreContext): string[] {
  const sets = new Map<string, boolean>();
  for (const item of ctx.catalog) {
    if (!item.set) continue;
    sets.set(item.set, (sets.get(item.set) ?? true) && owns(state, item.id));
  }
  return [...sets].filter(([, done]) => done).map(([id]) => id);
}

const tierFor = (count: number, tiers: readonly number[]) =>
  tiers.filter((needed) => count >= needed).length;

/** Where every shipped plaque stands, in the order they are listed. */
export function plaqueStandings(
  state: ProgressState,
  now: number,
  ctx: CoreContext,
): PlaqueStanding[] {
  const counts = plaqueCounts(state, now, ctx);
  return (ctx.plaques ?? []).map((def) => {
    const count = counts[def.metric];
    const earned = state.plaques.get(def.id);
    const reached = tierFor(count, def.tiers);
    const tier = Math.max(earned?.tier ?? 0, 0);
    return {
      def,
      count,
      tier,
      reached,
      next: def.tiers[Math.max(tier, reached)] ?? null,
      earnedAt: earned?.at ?? null,
    };
  });
}

/**
 * Tiers that have been reached and are not recorded yet, with the plaques made
 * per course and per set. Each entry becomes one `plaque.earned`.
 */
export function plaquesToEarn(
  state: ProgressState,
  now: number,
  ctx: CoreContext,
): { plaqueId: string; tier: number }[] {
  if (!ctx.plaques || ctx.plaques.length === 0) return [];
  const earn: { plaqueId: string; tier: number }[] = [];
  for (const standing of plaqueStandings(state, now, ctx)) {
    if (standing.reached > standing.tier) {
      earn.push({ plaqueId: standing.def.id, tier: standing.reached });
    }
  }
  const today = (ctx.dayKey ?? localDayKey)(now);
  const made = [
    ...examReady(state, today).map(examPlaqueId),
    ...finishedSets(state, ctx).map(setPlaqueId),
  ];
  for (const plaqueId of made) if (!state.plaques.has(plaqueId)) earn.push({ plaqueId, tier: 1 });
  return earn;
}
