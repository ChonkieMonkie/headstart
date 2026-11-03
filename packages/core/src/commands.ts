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

// Commands check what the user wants to do against the current state and
// return the event to record, or a reason why it is not allowed. They never
// change anything themselves.

import type { MascotId, Slot } from "@headstart/content";
import { craftBlocker, itemFits, rollCrate } from "./crates.ts";
import type { FocusRating, StudyEvent } from "./events.ts";
import { type CoreContext, owns, type Plan, type ProgressState } from "./state.ts";

export type CommandResult<E extends StudyEvent = StudyEvent> =
  | { ok: true; event: E }
  | { ok: false; reason: string };

const accept = <E extends StudyEvent>(event: E): CommandResult<E> => ({ ok: true, event });
const reject = (reason: string): CommandResult<never> => ({ ok: false, reason });

type EventOf<T extends StudyEvent["type"]> = Extract<StudyEvent, { type: T }>;

export const MAX_SESSION_MINUTES = 240;
export const MAX_EXTENSION_MINUTES = 60;
export const MAX_NAME_LENGTH = 60;
export const MAX_TITLE_LENGTH = 120;
export const MAX_STEP_LENGTH = 200;

export interface StartSessionInput {
  sessionId: string;
  plannedMinutes: number;
  plannedStartAt?: Date;
  /** Carry out a planned session: its time decides "on time", and it brings its task. */
  planId?: string;
  courseId?: string;
  taskId?: string;
}

export function startSession(
  state: ProgressState,
  input: StartSessionInput,
): CommandResult<EventOf<"session.started">> {
  if (state.active) return reject("A session is already running");
  const minutes = input.plannedMinutes;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_SESSION_MINUTES) {
    return reject(`A session is 1 to ${MAX_SESSION_MINUTES} minutes`);
  }
  const plan = input.planId ? state.plans.get(input.planId) : undefined;
  if (input.planId) {
    if (!plan || plan.cancelled) return reject("That planned session no longer exists");
    if (plan.sessionId !== null) return reject("That planned session has already started");
  }
  const plannedStartAt = plan ? new Date(plan.startAt) : input.plannedStartAt;
  const taskId = input.taskId ?? plan?.taskId ?? undefined;
  const task = taskId ? state.tasks.get(taskId) : undefined;
  if (taskId && !task) return reject("Unknown task");
  const courseId = input.courseId ?? task?.courseId ?? plan?.courseId ?? undefined;
  if (courseId && !state.courses.has(courseId)) return reject("Unknown course");
  return accept({
    type: "session.started",
    sessionId: input.sessionId,
    plannedMinutes: minutes,
    ...(plannedStartAt ? { plannedStartAt: plannedStartAt.toISOString() } : {}),
    ...(plan ? { planId: plan.id } : {}),
    ...(courseId ? { courseId } : {}),
    ...(taskId ? { taskId } : {}),
  });
}

export function pauseSession(state: ProgressState): CommandResult<EventOf<"session.paused">> {
  if (!state.active) return reject("No session is running");
  if (state.active.pausedAt !== null) return reject("The session is already paused");
  return accept({ type: "session.paused", sessionId: state.active.sessionId });
}

export function resumeSession(state: ProgressState): CommandResult<EventOf<"session.resumed">> {
  if (!state.active) return reject("No session is running");
  if (state.active.pausedAt === null) return reject("The session is not paused");
  return accept({ type: "session.resumed", sessionId: state.active.sessionId });
}

export function extendSession(
  state: ProgressState,
  minutes: number,
): CommandResult<EventOf<"session.extended">> {
  if (!state.active) return reject("No session is running");
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_EXTENSION_MINUTES) {
    return reject(`Extend by 1 to ${MAX_EXTENSION_MINUTES} minutes`);
  }
  return accept({ type: "session.extended", sessionId: state.active.sessionId, minutes });
}

export function completeSession(
  state: ProgressState,
  input: { distractions?: number; focusRating?: FocusRating } = {},
): CommandResult<EventOf<"session.completed">> {
  if (!state.active) return reject("No session is running");
  const distractions = input.distractions ?? 0;
  if (!Number.isInteger(distractions) || distractions < 0)
    return reject("Distractions must be 0 or more");
  return accept({
    type: "session.completed",
    sessionId: state.active.sessionId,
    distractions,
    ...(input.focusRating ? { focusRating: input.focusRating } : {}),
  });
}

export function abandonSession(state: ProgressState): CommandResult<EventOf<"session.abandoned">> {
  if (!state.active) return reject("No session is running");
  return accept({ type: "session.abandoned", sessionId: state.active.sessionId });
}

export function writeRecall(
  state: ProgressState,
  sessionId: string,
  text: string,
): CommandResult<EventOf<"recall.written">> {
  if (!state.sessions.has(sessionId)) return reject("That session is not finished");
  if (text.trim() === "") return reject("Write at least a few words");
  return accept({ type: "recall.written", sessionId, text });
}

export function openCrate(
  state: ProgressState,
  crateId: string,
  ctx: CoreContext,
): CommandResult<EventOf<"crate.opened">> {
  const crate = state.crates.find((c) => c.id === crateId);
  if (!crate) return reject("No such crate");
  if (crate.openedAt !== null) return reject("That crate is already open");
  const { drops } = rollCrate({
    seed: crate.seed,
    definition: ctx.crates.crates[crate.type],
    rules: ctx.crates,
    pity: state.pity,
    owned: state.inventory,
    catalog: ctx.catalog,
  });
  return accept({ type: "crate.opened", crateId, crateType: crate.type, drops });
}

export function craftItem(
  state: ProgressState,
  itemId: string,
  ctx: CoreContext,
): CommandResult<EventOf<"item.crafted">> {
  const item = ctx.catalog.find((i) => i.id === itemId);
  const blocker = craftBlocker(item, state.stardust, state.inventory, ctx.crates);
  if (blocker || !item) return reject(blocker ?? "Unknown item");
  return accept({ type: "item.crafted", itemId, cost: ctx.crates.craftCost[item.rarity] });
}

export function equipItem(
  state: ProgressState,
  mascot: MascotId,
  slot: Slot,
  itemId: string | null,
  ctx: CoreContext,
): CommandResult<EventOf<"item.equipped">> {
  if (itemId === null) {
    if (slot === "skin") return reject("A mascot always wears a skin");
    return accept({ type: "item.equipped", mascot, slot, itemId: null });
  }
  const item = ctx.catalog.find((i) => i.id === itemId);
  if (!item) return reject("Unknown item");
  if (item.slot !== slot) return reject(`${item.name} does not go in the ${slot} slot`);
  if (!owns(state, itemId)) return reject(`You do not have ${item.name} yet`);
  if (!itemFits(item, mascot)) return reject(`${item.name} does not fit this mascot`);
  return accept({ type: "item.equipped", mascot, slot, itemId });
}

export function chooseMascot(mascot: MascotId): CommandResult<EventOf<"mascot.chosen">> {
  return accept({ type: "mascot.chosen", mascot });
}

export function rateSession(
  state: ProgressState,
  sessionId: string,
  focusRating: number,
): CommandResult<EventOf<"session.rated">> {
  if (!state.sessions.has(sessionId)) return reject("That session is not finished");
  if (!isFocusRating(focusRating)) return reject("Pick a rating from 1 to 5");
  return accept({ type: "session.rated", sessionId, focusRating });
}

function isFocusRating(n: number): n is FocusRating {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

// Courses and tasks

/** Trims text and checks its length; returns the clean text or a reason. */
function cleanText(text: string, what: string, max: number): { text: string } | { reason: string } {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean === "") return { reason: `${what} cannot be empty` };
  if (clean.length > max) return { reason: `${what} can be at most ${max} characters` };
  return { text: clean };
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const isColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export function createCourse(
  state: ProgressState,
  input: { courseId: string; name: string; color: string; examDate?: string },
): CommandResult<EventOf<"course.created">> {
  if (state.courses.has(input.courseId)) return reject("That course already exists");
  const name = cleanText(input.name, "The course name", MAX_NAME_LENGTH);
  if ("reason" in name) return reject(name.reason);
  if (!isColor(input.color)) return reject("Pick a colour");
  if (input.examDate !== undefined && !isDateKey(input.examDate))
    return reject("Unknown exam date");
  return accept({
    type: "course.created",
    courseId: input.courseId,
    name: name.text,
    color: input.color,
    ...(input.examDate ? { examDate: input.examDate } : {}),
  });
}

export function updateCourse(
  state: ProgressState,
  courseId: string,
  changes: { name?: string; color?: string; examDate?: string | null },
): CommandResult<EventOf<"course.updated">> {
  if (!state.courses.has(courseId)) return reject("Unknown course");
  const event: EventOf<"course.updated"> = { type: "course.updated", courseId };
  if (changes.name !== undefined) {
    const name = cleanText(changes.name, "The course name", MAX_NAME_LENGTH);
    if ("reason" in name) return reject(name.reason);
    event.name = name.text;
  }
  if (changes.color !== undefined) {
    if (!isColor(changes.color)) return reject("Pick a colour");
    event.color = changes.color;
  }
  if (changes.examDate !== undefined) {
    if (changes.examDate !== null && !isDateKey(changes.examDate))
      return reject("Unknown exam date");
    event.examDate = changes.examDate;
  }
  return accept(event);
}

export function archiveCourse(
  state: ProgressState,
  courseId: string,
): CommandResult<EventOf<"course.archived">> {
  const course = state.courses.get(courseId);
  if (!course) return reject("Unknown course");
  if (course.archived) return reject("That course is already archived");
  return accept({ type: "course.archived", courseId });
}

export function createTask(
  state: ProgressState,
  input: { taskId: string; courseId: string; title: string; nextStep: string },
): CommandResult<EventOf<"task.created">> {
  if (state.tasks.has(input.taskId)) return reject("That task already exists");
  const course = state.courses.get(input.courseId);
  if (!course || course.archived) return reject("Pick a course");
  const title = cleanText(input.title, "The task", MAX_TITLE_LENGTH);
  if ("reason" in title) return reject(title.reason);
  const nextStep = cleanText(input.nextStep, "The next step", MAX_STEP_LENGTH);
  if ("reason" in nextStep) return reject(nextStep.reason);
  return accept({
    type: "task.created",
    taskId: input.taskId,
    courseId: input.courseId,
    title: title.text,
    nextStep: nextStep.text,
  });
}

export function updateTask(
  state: ProgressState,
  taskId: string,
  changes: { title?: string; nextStep?: string },
): CommandResult<EventOf<"task.updated">> {
  const task = state.tasks.get(taskId);
  if (!task) return reject("Unknown task");
  const event: EventOf<"task.updated"> = { type: "task.updated", taskId };
  if (changes.title !== undefined) {
    const title = cleanText(changes.title, "The task", MAX_TITLE_LENGTH);
    if ("reason" in title) return reject(title.reason);
    if (title.text !== task.title) event.title = title.text;
  }
  if (changes.nextStep !== undefined) {
    const nextStep = cleanText(changes.nextStep, "The next step", MAX_STEP_LENGTH);
    if ("reason" in nextStep) return reject(nextStep.reason);
    if (nextStep.text !== task.nextStep) event.nextStep = nextStep.text;
  }
  if (event.title === undefined && event.nextStep === undefined) return reject("Nothing changed");
  return accept(event);
}

export function completeTask(
  state: ProgressState,
  taskId: string,
): CommandResult<EventOf<"task.completed">> {
  const task = state.tasks.get(taskId);
  if (!task) return reject("Unknown task");
  if (task.done) return reject("That task is already done");
  return accept({ type: "task.completed", taskId });
}

export function reopenTask(
  state: ProgressState,
  taskId: string,
): CommandResult<EventOf<"task.reopened">> {
  const task = state.tasks.get(taskId);
  if (!task) return reject("Unknown task");
  if (!task.done) return reject("That task is not done");
  return accept({ type: "task.reopened", taskId });
}

// Planned sessions

export function planSession(
  state: ProgressState,
  input: { planId: string; startAt: Date; minutes: number; taskId?: string; courseId?: string },
): CommandResult<EventOf<"session.planned">> {
  if (state.plans.has(input.planId)) return reject("That session is already planned");
  if (Number.isNaN(input.startAt.getTime())) return reject("Pick a time");
  const { minutes } = input;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_SESSION_MINUTES) {
    return reject(`A session is 1 to ${MAX_SESSION_MINUTES} minutes`);
  }
  const task = input.taskId ? state.tasks.get(input.taskId) : undefined;
  if (input.taskId && !task) return reject("Unknown task");
  const courseId = input.courseId ?? task?.courseId;
  if (courseId && !state.courses.has(courseId)) return reject("Unknown course");
  return accept({
    type: "session.planned",
    planId: input.planId,
    startAt: input.startAt.toISOString(),
    minutes,
    ...(courseId ? { courseId } : {}),
    ...(input.taskId ? { taskId: input.taskId } : {}),
  });
}

function openPlan(state: ProgressState, planId: string): { plan: Plan } | { reason: string } {
  const plan = state.plans.get(planId);
  if (!plan || plan.cancelled) return { reason: "That planned session no longer exists" };
  if (plan.sessionId !== null) return { reason: "That planned session has already started" };
  return { plan };
}

export function movePlan(
  state: ProgressState,
  planId: string,
  startAt: Date,
): CommandResult<EventOf<"plan.moved">> {
  const found = openPlan(state, planId);
  if ("reason" in found) return reject(found.reason);
  if (Number.isNaN(startAt.getTime())) return reject("Pick a time");
  return accept({ type: "plan.moved", planId, startAt: startAt.toISOString() });
}

export function cancelPlan(
  state: ProgressState,
  planId: string,
): CommandResult<EventOf<"plan.cancelled">> {
  const found = openPlan(state, planId);
  if ("reason" in found) return reject(found.reason);
  return accept({ type: "plan.cancelled", planId });
}
