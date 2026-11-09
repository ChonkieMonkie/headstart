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
import type { TaskSize } from "./events.ts";
import {
  byOrder,
  type Course,
  localDayKey,
  type Plan,
  type ProgressState,
  type Task,
  type Todo,
} from "./state.ts";
import { breakAfter, type TimerPreset } from "./timer.ts";

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

/**
 * Today's open plan for a task, so a session started from the task carries out
 * that plan and brings its to-dos. A plan for the task wins over a plan for
 * just its course; between two, the one closest in time. Null when none.
 */
export function planForTask(
  state: ProgressState,
  taskId: string,
  now: number,
  dayKey: (ms: number) => string = localDayKey,
): Plan | null {
  const task = state.tasks.get(taskId);
  if (!task) return null;
  const today = dayKey(now);
  let best: Plan | null = null;
  let bestRank = 0;
  for (const plan of state.plans.values()) {
    if (plan.cancelled || plan.sessionId !== null || dayKey(plan.startAt) !== today) continue;
    const rank =
      plan.taskId === taskId ? 2 : plan.taskId === null && plan.courseId === task.courseId ? 1 : 0;
    if (rank === 0) continue;
    const closer = best !== null && Math.abs(plan.startAt - now) < Math.abs(best.startAt - now);
    if (rank > bestRank || (rank === bestRank && closer)) {
      best = plan;
      bestRank = rank;
    }
  }
  return best;
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
  /** How long before a planned start the first reminder comes, or null for none. */
  soonMinutes: number | null;
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
    // Within a block, only its first session reminds: the rest follow its breaks.
    if (plan.blockId !== null && blockStart(state, plan.blockId) < plan.startAt) continue;
    const soon = rules.soonMinutes === null ? null : plan.startAt - rules.soonMinutes * MINUTE;
    const late = plan.startAt + rules.lateMinutes * MINUTE;
    const day = dayKey(plan.startAt);
    const nudges = nudgesPerDay.get(day) ?? 0;
    // Count every nudge of the day in order, past ones included, so the limit holds.
    const nudgeAllowed =
      nudges < rules.maxNudgesPerDay && late < plan.startAt + plan.minutes * MINUTE;
    if (nudgeAllowed) nudgesPerDay.set(day, nudges + 1);
    if (soon !== null && soon >= now && soon < now + DAY)
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
  return [...state.todos.values()]
    .filter(
      (t) => !t.done && t.courseId === courseId && (taskId === undefined || t.taskId === taskId),
    )
    .sort(byOrder);
}

/** To-dos given to a planned session. */
export function todosForPlan(state: ProgressState, planId: string): Todo[] {
  return [...state.todos.values()].filter((t) => t.planId === planId).sort(byOrder);
}

/** To-dos of a session: the ones it carries now, and those ticked off in it. */
export function todosForSession(state: ProgressState, sessionId: string): Todo[] {
  const record = state.sessions.get(sessionId);
  const ids = new Set(record?.todoIds ?? []);
  return [...state.todos.values()]
    .filter((t) => t.sessionId === sessionId || t.doneInSessionId === sessionId || ids.has(t.id))
    .sort(byOrder);
}

// The week planner

/** Sessions a task size stands for: Small 1, Medium 2 to 3, Large 4 or more. */
export const SIZE_SESSIONS: Record<TaskSize, number> = { small: 1, medium: 3, large: 5 };

export interface TaskProgress {
  /** Sessions done for the task. */
  done: number;
  /** Sessions planned for it that can still be started. */
  planned: number;
  /** The user's own guess, else what the size stands for, or null when neither is set. */
  estimate: number | null;
  /** Sessions still to plan, or null when the task has no size. */
  left: number | null;
}

/** How far a task has come: sessions done, planned and still to plan. */
export function taskProgress(state: ProgressState, taskId: string, now: number): TaskProgress {
  let done = 0;
  for (const record of state.sessions.values()) if (record.taskId === taskId) done += 1;
  let planned = 0;
  for (const plan of state.plans.values()) {
    if (
      plan.taskId === taskId &&
      !plan.cancelled &&
      plan.sessionId === null &&
      !isMissed(plan, now)
    ) {
      planned += 1;
    }
  }
  const task = state.tasks.get(taskId);
  const estimate = task?.sessions ?? (task?.size ? SIZE_SESSIONS[task.size] : null);
  return {
    done,
    planned,
    estimate,
    left: estimate === null ? null : Math.max(0, estimate - done - planned),
  };
}

export interface TaskToPlan {
  task: Task;
  course: Course;
  progress: TaskProgress;
  /** The task's own date, or else its course's exam date ("YYYY-MM-DD"), or null. */
  due: string | null;
  dueIsExam: boolean;
}

/**
 * Open tasks that still need sessions: without a size, or with sessions left
 * to plan. The soonest date first; tasks without one last, oldest first.
 */
export function tasksToPlan(state: ProgressState, now: number): TaskToPlan[] {
  const rows: TaskToPlan[] = [];
  for (const task of openTasks(state)) {
    const course = state.courses.get(task.courseId);
    if (!course) continue;
    const progress = taskProgress(state, task.id, now);
    if (progress.left === 0) continue;
    const due = task.dueDay ?? course.examDate;
    rows.push({ task, course, progress, due, dueIsExam: task.dueDay === null && due !== null });
  }
  return rows.sort((a, b) => {
    if (a.due !== b.due) {
      if (a.due === null) return 1;
      if (b.due === null) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return a.task.createdAt - b.task.createdAt;
  });
}

/** One planned session of a block. */
export interface BlockSlot {
  startAt: number;
  minutes: number;
}

/** `count` sessions of `minutes` from `startAt`, with the preset's breaks between them. */
export function blockSlots(
  startAt: number,
  count: number,
  minutes: number,
  preset: TimerPreset,
): BlockSlot[] {
  const slots: BlockSlot[] = [];
  let at = startAt;
  for (let i = 1; i <= count; i++) {
    slots.push({ startAt: at, minutes });
    at += minutes * MINUTE + breakAfter(i, preset).ms;
  }
  return slots;
}

/** When the last session of a block ends. */
export function blockEnd(slots: readonly BlockSlot[]): number {
  const last = slots[slots.length - 1];
  return last ? last.startAt + last.minutes * MINUTE : 0;
}

/**
 * How a stretch of free time fills with sessions. Room for two or more gives
 * sessions of the usual length with breaks between them (55 minutes: 2 × 25);
 * less gives one session as long as the stretch, in steps of 5 minutes.
 */
export function fitSessions(
  totalMinutes: number,
  sessionMinutes: number,
  preset: TimerPreset,
): { count: number; minutes: number } {
  let count = 0;
  let used = 0;
  while (true) {
    const next = used + (count > 0 ? breakAfter(count, preset).minutes : 0) + sessionMinutes;
    if (next > totalMinutes) break;
    used = next;
    count += 1;
  }
  if (count >= 2) return { count, minutes: sessionMinutes };
  const minutes = Math.min(240, Math.max(5, Math.round(totalMinutes / 5) * 5));
  return { count: 1, minutes };
}

// Blocks: sessions planned together

/** The key that groups plans: their block, or the plan itself when on its own. */
export const blockKey = (plan: Plan): string => plan.blockId ?? plan.id;

/** The earliest start of a block's sessions that are not cancelled. */
function blockStart(state: ProgressState, blockId: string): number {
  let first = Number.POSITIVE_INFINITY;
  for (const p of state.plans.values()) {
    if (p.blockId === blockId && !p.cancelled) first = Math.min(first, p.startAt);
  }
  return first;
}

/** A block's sessions that are not cancelled, in time order. A plan on its own is a block of one. */
export function blockPlans(state: ProgressState, plan: Plan): Plan[] {
  if (plan.blockId === null) return plan.cancelled ? [] : [plan];
  return [...state.plans.values()]
    .filter((p) => p.blockId === plan.blockId && !p.cancelled)
    .sort((a, b) => a.startAt - b.startAt);
}

export interface BlockView {
  key: string;
  /** Its sessions in time order. */
  views: PlanView[];
  start: number;
  end: number;
}

/** Groups a day's plans into blocks (a plan on its own is a block of one). */
export function groupBlocks(views: readonly PlanView[]): BlockView[] {
  const groups = new Map<string, PlanView[]>();
  for (const view of views) {
    const key = blockKey(view.plan);
    groups.set(key, [...(groups.get(key) ?? []), view]);
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => a.plan.startAt - b.plan.startAt);
      const last = sorted[sorted.length - 1] ?? sorted[0];
      return {
        key,
        views: sorted,
        start: sorted[0]?.plan.startAt ?? 0,
        end: last ? last.plan.startAt + last.plan.minutes * MINUTE : 0,
      };
    })
    .sort((a, b) => a.start - b.start);
}
