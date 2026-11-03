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

// Read-only views over plans, courses and tasks for the Today screen, the
// tray and reminders.

import type { RewardRules } from "@headstart/content";
import {
  type Course,
  localDayKey,
  type Plan,
  type ProgressState,
  type Task,
  type Todo,
} from "./state.ts";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * Course colours offered in the app. Checked with a palette validator on every
 * pair, since any two courses can sit side by side: easy to tell apart with
 * normal vision (ΔE 21.7, floor 15) and for colour-blind readers (ΔE 10.9,
 * target 8). Three are lighter than 3:1 on white, so a course name or code
 * always sits beside the colour.
 */
export const COURSE_COLORS = [
  "#255EBC",
  "#F28F29",
  "#227702",
  "#C24976",
  "#B897F0",
  "#53C48E",
] as const;

export type PlanStatus = "done" | "running" | "missed" | "next" | "planned";

export interface PlanView {
  plan: Plan;
  status: PlanStatus;
  course: Course | null;
  task: Task | null;
}

/** A plan counts as missed once its whole slot has passed without a start. */
function isMissed(plan: Plan, now: number): boolean {
  return plan.sessionId === null && now >= plan.startAt + plan.minutes * MINUTE;
}

function statusOf(state: ProgressState, plan: Plan, now: number): PlanStatus {
  if (plan.sessionId !== null) {
    return state.active?.sessionId === plan.sessionId ? "running" : "done";
  }
  return isMissed(plan, now) ? "missed" : "planned";
}

/** The day's planned sessions in time order. The first open one is "next". */
export function plansOn(
  state: ProgressState,
  day: string,
  now: number,
  dayKey: (ms: number) => string = localDayKey,
): PlanView[] {
  const views = [...state.plans.values()]
    .filter((plan) => !plan.cancelled && dayKey(plan.startAt) === day)
    .sort((a, b) => a.startAt - b.startAt)
    .map((plan) => ({
      plan,
      status: statusOf(state, plan, now),
      course: plan.courseId ? (state.courses.get(plan.courseId) ?? null) : null,
      task: plan.taskId ? (state.tasks.get(plan.taskId) ?? null) : null,
    }));
  const next = views.find((v) => v.status === "planned");
  if (next && !state.active) next.status = "next";
  return views;
}

/** The next plan that can still be started: not started, not cancelled, not missed. */
export function upcomingPlan(state: ProgressState, now: number): Plan | null {
  let best: Plan | null = null;
  for (const plan of state.plans.values()) {
    if (plan.cancelled || plan.sessionId !== null || isMissed(plan, now)) continue;
    if (!best || plan.startAt < best.startAt) best = plan;
  }
  return best;
}

/**
 * The plan to carry out when the user simply presses "start" now: one whose
 * slot has begun or begins within the on-time window. Null otherwise.
 */
export function planToStartNow(state: ProgressState, now: number, rules: RewardRules): Plan | null {
  const plan = upcomingPlan(state, now);
  if (!plan) return null;
  return now >= plan.startAt - rules.onTimeWindowMinutes.early * MINUTE ? plan : null;
}

/** Whole days from today until a "YYYY-MM-DD" date. Negative once it has passed. */
export function daysUntil(dateKey: string, now: number): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const target = Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  const today = new Date(now);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - start) / DAY);
}

export type ReminderKind = "soon" | "late";

export interface Reminder {
  /** Stable id, so a reminder is only shown once. */
  id: string;
  kind: ReminderKind;
  at: number;
  plan: Plan;
}

export interface ReminderRules {
  /** How long before a planned start the first reminder comes. */
  soonMinutes: number;
  /** How long after a missed start the one gentle nudge comes. */
  lateMinutes: number;
  /** Nudges per day at most. Reminders before a start do not count. */
  maxNudgesPerDay: number;
}

export const DEFAULT_REMINDER_RULES: ReminderRules = {
  soonMinutes: 2,
  lateMinutes: 10,
  maxNudgesPerDay: 3,
};

/** Reminders for plans that have not started, from `now` up to a day ahead. */
export function upcomingReminders(
  state: ProgressState,
  now: number,
  rules: ReminderRules = DEFAULT_REMINDER_RULES,
  dayKey: (ms: number) => string = localDayKey,
): Reminder[] {
  const reminders: Reminder[] = [];
  const nudgesPerDay = new Map<string, number>();
  const plans = [...state.plans.values()]
    .filter((plan) => !plan.cancelled && plan.sessionId === null)
    .sort((a, b) => a.startAt - b.startAt);
  for (const plan of plans) {
    const soon = plan.startAt - rules.soonMinutes * MINUTE;
    const late = plan.startAt + rules.lateMinutes * MINUTE;
    const day = dayKey(plan.startAt);
    const nudges = nudgesPerDay.get(day) ?? 0;
    // Count every nudge of the day in order, past ones included, so the limit holds.
    const nudgeAllowed =
      nudges < rules.maxNudgesPerDay && late < plan.startAt + plan.minutes * MINUTE;
    if (nudgeAllowed) nudgesPerDay.set(day, nudges + 1);
    if (soon >= now && soon < now + DAY)
      reminders.push({ id: `${plan.id}:soon`, kind: "soon", at: soon, plan });
    if (nudgeAllowed && late >= now && late < now + DAY) {
      reminders.push({ id: `${plan.id}:late`, kind: "late", at: late, plan });
    }
  }
  return reminders.sort((a, b) => a.at - b.at);
}

/** Open tasks of active courses, newest course first and oldest task first. */
export function openTasks(state: ProgressState): Task[] {
  return [...state.tasks.values()]
    .filter((task) => !task.done && state.courses.get(task.courseId)?.archived === false)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** Open to-dos of a course (or one task), oldest first. */
export function openTodos(state: ProgressState, courseId: string, taskId?: string | null): Todo[] {
  return [...state.todos.values()].filter(
    (t) => !t.done && t.courseId === courseId && (taskId === undefined || t.taskId === taskId),
  );
}

/** To-dos given to a planned session. */
export function todosForPlan(state: ProgressState, planId: string): Todo[] {
  return [...state.todos.values()].filter((t) => t.planId === planId);
}

/** To-dos of a session: the ones it carries now, and those ticked off in it. */
export function todosForSession(state: ProgressState, sessionId: string): Todo[] {
  const record = state.sessions.get(sessionId);
  const ids = new Set(record?.todoIds ?? []);
  return [...state.todos.values()].filter(
    (t) => t.sessionId === sessionId || t.doneInSessionId === sessionId || ids.has(t.id),
  );
}
