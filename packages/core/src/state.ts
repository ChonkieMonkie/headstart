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

// Turns the event log into the state the app shows. Applying the same events
// with the same rules always gives the same state, so rules can be tuned later
// and everything is simply recomputed.

import {
  type CrateRules,
  type CrateType,
  type Item,
  MASCOTS,
  type MascotId,
  type RewardRules,
  type Slot,
} from "@headstart/content";
import { NO_PITY, nextPity, type PityState, rarityRank } from "./crates.ts";
import type { CrateDrop, EventEnvelope, FocusRating } from "./events.ts";
import {
  type LevelInfo,
  levelInfo,
  recallEarnsBonus,
  type SessionScore,
  scoreSession,
} from "./rewards.ts";
import { type ActiveSession, focusedMs, targetMs } from "./timer.ts";

const MINUTE = 60_000;

/** Rules and content the projection depends on. */
export interface CoreContext {
  rewards: RewardRules;
  crates: CrateRules;
  catalog: readonly Item[];
  /** Calendar day of a moment, for daily limits. Defaults to the local day. */
  dayKey?: (epochMs: number) => string;
}

export interface SessionRecord {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  plannedMinutes: number;
  score: SessionScore;
  distractions: number;
  recallXp: number;
  recallText: string | null;
  focusRating: FocusRating | null;
  planId: string | null;
  courseId: string | null;
  taskId: string | null;
}

export interface Course {
  id: string;
  name: string;
  color: string;
  /** Local date of the exam, "YYYY-MM-DD". */
  examDate: string | null;
  archived: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  courseId: string;
  title: string;
  nextStep: string;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
}

/** A session planned for a set time. */
export interface Plan {
  id: string;
  startAt: number;
  minutes: number;
  courseId: string | null;
  taskId: string | null;
  cancelled: boolean;
  /** The session that carries it out, once started. */
  sessionId: string | null;
}

export interface EarnedCrate {
  id: string;
  type: CrateType;
  /** Random seed for the roll, taken from the id of the event that earned it. */
  seed: string;
  earnedAt: number;
  openedAt: number | null;
  drops: CrateDrop[];
}

export interface ProgressState {
  xp: number;
  stardust: number;
  mascot: MascotId | null;
  active: ActiveSession | null;
  sessions: Map<string, SessionRecord>;
  completedSessions: number;
  focusMinutes: number;
  onTimeStreak: number;
  bestOnTimeStreak: number;
  /** Qualifying sessions since the last Study Crate. */
  crateProgress: number;
  /** Day → sessions that counted toward crates that day. */
  crateSessionsByDay: Map<string, number>;
  /** Every crate ever earned, oldest first. */
  crates: EarnedCrate[];
  pity: PityState;
  /** Item id → copies received, duplicates included. Owned means at least 1. */
  inventory: Map<string, number>;
  equipped: Record<MascotId, Partial<Record<Slot, string>>>;
  courses: Map<string, Course>;
  tasks: Map<string, Task>;
  plans: Map<string, Plan>;
  lastEventAt: number | null;
}

export function localDayKey(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function createInitialState(ctx: CoreContext): ProgressState {
  const inventory = new Map<string, number>();
  const equipped = {} as ProgressState["equipped"];
  for (const mascot of MASCOTS) equipped[mascot] = {};
  for (const item of ctx.catalog) {
    if (!item.starter) continue;
    inventory.set(item.id, 1);
    for (const mascot of item.fits ?? []) equipped[mascot][item.slot] = item.id;
  }
  return {
    xp: 0,
    stardust: 0,
    mascot: null,
    active: null,
    sessions: new Map(),
    completedSessions: 0,
    focusMinutes: 0,
    onTimeStreak: 0,
    bestOnTimeStreak: 0,
    crateProgress: 0,
    crateSessionsByDay: new Map(),
    crates: [],
    pity: NO_PITY,
    inventory,
    equipped,
    courses: new Map(),
    tasks: new Map(),
    plans: new Map(),
    lastEventAt: null,
  };
}

/**
 * Applies one event to the state, in place. Events that do not fit the current
 * state (for example a pause with no session running) are ignored, so a damaged
 * or merged log can never crash the app.
 */
export function applyEvent(state: ProgressState, envelope: EventEnvelope, ctx: CoreContext): void {
  const at = Date.parse(envelope.occurredAt);
  const event = envelope.event;
  state.lastEventAt = at;

  switch (event.type) {
    case "session.started": {
      if (state.active) return;
      const plan = event.planId ? state.plans.get(event.planId) : undefined;
      if (plan && plan.sessionId === null) plan.sessionId = event.sessionId;
      state.active = {
        sessionId: event.sessionId,
        startedAt: at,
        plannedMs: event.plannedMinutes * MINUTE,
        extendedMs: 0,
        pausedAt: null,
        pausedMs: 0,
        plannedStartAt: event.plannedStartAt ? Date.parse(event.plannedStartAt) : null,
        planId: plan ? plan.id : null,
        courseId: event.courseId ?? null,
        taskId: event.taskId ?? null,
      };
      return;
    }
    case "session.paused": {
      const active = matching(state, event.sessionId);
      if (active && active.pausedAt === null) active.pausedAt = at;
      return;
    }
    case "session.resumed": {
      const active = matching(state, event.sessionId);
      if (active && active.pausedAt !== null) {
        active.pausedMs += Math.max(0, at - active.pausedAt);
        active.pausedAt = null;
      }
      return;
    }
    case "session.extended": {
      const active = matching(state, event.sessionId);
      if (active) active.extendedMs += event.minutes * MINUTE;
      return;
    }
    case "session.abandoned": {
      const active = matching(state, event.sessionId);
      if (!active) return;
      // An abandoned session leaves its plan open, so it can be started again.
      const plan = active.planId ? state.plans.get(active.planId) : undefined;
      if (plan?.sessionId === active.sessionId) plan.sessionId = null;
      state.active = null;
      return;
    }
    case "session.completed": {
      const active = matching(state, event.sessionId);
      if (!active) return;
      completeSession(state, active, at, envelope.id, event.distractions, event.focusRating, ctx);
      return;
    }
    case "recall.written": {
      const record = state.sessions.get(event.sessionId);
      if (!record) return;
      record.recallText = event.text;
      if (record.recallXp === 0 && recallEarnsBonus(event.text, ctx.rewards)) {
        record.recallXp = ctx.rewards.recallBonusXp;
        state.xp += record.recallXp;
      }
      return;
    }
    case "session.rated": {
      const record = state.sessions.get(event.sessionId);
      if (record) record.focusRating = event.focusRating;
      return;
    }
    case "course.created": {
      if (state.courses.has(event.courseId)) return;
      state.courses.set(event.courseId, {
        id: event.courseId,
        name: event.name,
        color: event.color,
        examDate: event.examDate ?? null,
        archived: false,
        createdAt: at,
      });
      return;
    }
    case "course.updated": {
      const course = state.courses.get(event.courseId);
      if (!course) return;
      if (event.name !== undefined) course.name = event.name;
      if (event.color !== undefined) course.color = event.color;
      if (event.examDate !== undefined) course.examDate = event.examDate;
      return;
    }
    case "course.archived": {
      const course = state.courses.get(event.courseId);
      if (course) course.archived = true;
      return;
    }
    case "task.created": {
      if (state.tasks.has(event.taskId) || !state.courses.has(event.courseId)) return;
      state.tasks.set(event.taskId, {
        id: event.taskId,
        courseId: event.courseId,
        title: event.title,
        nextStep: event.nextStep,
        done: false,
        createdAt: at,
        completedAt: null,
      });
      return;
    }
    case "task.updated": {
      const task = state.tasks.get(event.taskId);
      if (!task) return;
      if (event.title !== undefined) task.title = event.title;
      if (event.nextStep !== undefined) task.nextStep = event.nextStep;
      return;
    }
    case "task.completed": {
      const task = state.tasks.get(event.taskId);
      if (task && !task.done) {
        task.done = true;
        task.completedAt = at;
      }
      return;
    }
    case "task.reopened": {
      const task = state.tasks.get(event.taskId);
      if (task) {
        task.done = false;
        task.completedAt = null;
      }
      return;
    }
    case "session.planned": {
      if (state.plans.has(event.planId)) return;
      state.plans.set(event.planId, {
        id: event.planId,
        startAt: Date.parse(event.startAt),
        minutes: event.minutes,
        courseId: event.courseId ?? null,
        taskId: event.taskId ?? null,
        cancelled: false,
        sessionId: null,
      });
      return;
    }
    case "plan.moved": {
      const plan = state.plans.get(event.planId);
      if (plan && plan.sessionId === null) plan.startAt = Date.parse(event.startAt);
      return;
    }
    case "plan.cancelled": {
      const plan = state.plans.get(event.planId);
      if (plan && plan.sessionId === null) plan.cancelled = true;
      return;
    }
    case "crate.opened": {
      const crate = state.crates.find((c) => c.id === event.crateId);
      if (!crate || crate.openedAt !== null) return;
      crate.openedAt = at;
      crate.drops = event.drops;
      let best = event.drops[0]?.rarity ?? "common";
      for (const drop of event.drops) {
        if (drop.itemId)
          state.inventory.set(drop.itemId, (state.inventory.get(drop.itemId) ?? 0) + 1);
        state.stardust += drop.stardust;
        if (rarityRank(drop.rarity) > rarityRank(best)) best = drop.rarity;
      }
      state.pity = nextPity(state.pity, best);
      return;
    }
    case "item.crafted": {
      state.stardust -= event.cost;
      state.inventory.set(event.itemId, (state.inventory.get(event.itemId) ?? 0) + 1);
      return;
    }
    case "item.equipped": {
      const slots = state.equipped[event.mascot];
      if (event.itemId === null) delete slots[event.slot];
      else slots[event.slot] = event.itemId;
      return;
    }
    case "mascot.chosen": {
      state.mascot = event.mascot;
      return;
    }
  }
}

function matching(state: ProgressState, sessionId: string): ActiveSession | null {
  return state.active?.sessionId === sessionId ? state.active : null;
}

function completeSession(
  state: ProgressState,
  active: ActiveSession,
  at: number,
  eventId: string,
  distractions: number,
  focusRating: FocusRating | undefined,
  ctx: CoreContext,
): void {
  // Time past the end is not counted: a session finished late (laptop asleep,
  // app closed) is worth exactly its planned length. Use +5 min to go longer.
  const score = scoreSession(
    {
      focusedMs: Math.min(focusedMs(active, at), targetMs(active)),
      startedAt: active.startedAt,
      plannedStartAt: active.plannedStartAt,
      distractions,
    },
    ctx.rewards,
  );

  state.xp += score.totalXp;
  state.completedSessions += 1;
  state.focusMinutes += score.focusMinutes;
  state.sessions.set(active.sessionId, {
    sessionId: active.sessionId,
    startedAt: active.startedAt,
    endedAt: at,
    plannedMinutes: Math.round(active.plannedMs / MINUTE),
    score,
    distractions,
    recallXp: 0,
    recallText: null,
    focusRating: focusRating ?? null,
    planId: active.planId,
    courseId: active.courseId,
    taskId: active.taskId,
  });

  if (score.onTime === true) {
    state.onTimeStreak += 1;
    state.bestOnTimeStreak = Math.max(state.bestOnTimeStreak, state.onTimeStreak);
  } else if (score.onTime === false) {
    state.onTimeStreak = 0;
  }

  if (score.qualifies) {
    const day = (ctx.dayKey ?? localDayKey)(active.startedAt);
    const countedToday = state.crateSessionsByDay.get(day) ?? 0;
    if (countedToday < ctx.rewards.maxCrateSessionsPerDay) {
      state.crateSessionsByDay.set(day, countedToday + 1);
      state.crateProgress += 1;
      if (state.crateProgress >= ctx.rewards.studyCrateEvery) {
        state.crateProgress = 0;
        state.crates.push({
          id: `study:${eventId}`,
          type: "study",
          seed: eventId,
          earnedAt: at,
          openedAt: null,
          drops: [],
        });
      }
    }
  }

  state.active = null;
}

/** Builds the state from scratch. Events must be sorted (see compareEvents). */
export function project(events: readonly EventEnvelope[], ctx: CoreContext): ProgressState {
  const state = createInitialState(ctx);
  for (const envelope of events) applyEvent(state, envelope, ctx);
  return state;
}

export function unopenedCrates(state: ProgressState): EarnedCrate[] {
  return state.crates.filter((crate) => crate.openedAt === null);
}

export function owns(state: ProgressState, itemId: string): boolean {
  return (state.inventory.get(itemId) ?? 0) > 0;
}

export function level(state: ProgressState, ctx: CoreContext): LevelInfo {
  return levelInfo(state.xp, ctx.rewards);
}
