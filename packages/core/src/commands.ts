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

import type { CrateType, MascotId, Rarity, Slot } from "@headstart/content";
import { craftBlocker, itemFits, rollCrate } from "./crates.ts";
import { DEVELOPER_KEYS, readGrant, type Signed } from "./developer.ts";
import type { FocusRating, StudyEvent } from "./events.ts";
import { checkSettings, type Settings } from "./settings.ts";
import {
  type CoreContext,
  openPlanFor,
  owns,
  type Plan,
  type ProgressState,
  type Todo,
} from "./state.ts";

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
export const MAX_CODE_LENGTH = 16;

export interface StartSessionInput {
  sessionId: string;
  plannedMinutes: number;
  plannedStartAt?: Date;
  /** Carry out a planned session: its time decides "on time", and it brings its task. */
  planId?: string;
  /**
   * Carry out the plan without scoring its start time. Used when a session for
   * the same task starts at another time than planned, so starting early or
   * late from a task neither earns nor breaks the on-time streak.
   */
  adoptPlan?: boolean;
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
  const plannedStartAt = plan && !input.adoptPlan ? new Date(plan.startAt) : input.plannedStartAt;
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

/**
 * Moves the running session to another course and task. The whole session
 * goes along: its time, recall and XP count for the new course.
 */
export function retargetSession(
  state: ProgressState,
  input: { courseId: string | null; taskId: string | null },
): CommandResult<EventOf<"session.retargeted">> {
  const active = state.active;
  if (!active) return reject("No session is running");
  const task = input.taskId ? state.tasks.get(input.taskId) : undefined;
  if (input.taskId && !task) return reject("Unknown task");
  const courseId = task ? task.courseId : input.courseId;
  if (courseId && !state.courses.has(courseId)) return reject("Unknown course");
  if (courseId === active.courseId && (input.taskId ?? null) === active.taskId) {
    return reject("The session is already for that");
  }
  return accept({
    type: "session.retargeted",
    sessionId: active.sessionId,
    courseId: courseId ?? null,
    taskId: input.taskId ?? null,
  });
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
  // craftBlocker has already turned away Exotic items, which have no price.
  return accept({
    type: "item.crafted",
    itemId,
    cost: ctx.crates.craftCost[item.rarity as Rarity],
  });
}

/** Claims a signed grant for a grant-only item, such as a developer item. */
export function claimGrant(
  state: ProgressState,
  grant: Signed,
  ctx: CoreContext,
  installId: string,
): CommandResult<EventOf<"item.granted">> {
  const checked = readGrant(grant, ctx.developerKeys ?? DEVELOPER_KEYS);
  if (!checked) return reject("That grant is not signed");
  if (checked.installId !== installId) return reject("That grant is for another installation");
  const item = ctx.catalog.find((i) => i.id === checked.itemId);
  if (!item?.grantOnly) return reject("Unknown item");
  if (owns(state, item.id)) return reject("You already have this item");
  return accept({ type: "item.granted", grant });
}

/** Developer tools, for the debug profile only. */
export const developer = {
  giveItem(itemId: string, ctx: CoreContext): CommandResult<EventOf<"dev.item.given">> {
    if (!ctx.debug) return reject("Only in the debug profile");
    if (!ctx.catalog.some((i) => i.id === itemId)) return reject("Unknown item");
    return accept({ type: "dev.item.given", itemId });
  },
  takeItem(
    state: ProgressState,
    itemId: string,
    ctx: CoreContext,
  ): CommandResult<EventOf<"dev.item.taken">> {
    if (!ctx.debug) return reject("Only in the debug profile");
    if (!owns(state, itemId)) return reject("Not owned");
    return accept({ type: "dev.item.taken", itemId });
  },
  addCrate(
    crateId: string,
    crateType: CrateType,
    ctx: CoreContext,
  ): CommandResult<EventOf<"dev.crate.added">> {
    if (!ctx.debug) return reject("Only in the debug profile");
    if (!ctx.crates.crates[crateType]) return reject("Unknown crate");
    return accept({ type: "dev.crate.added", crateId, crateType });
  },
  setStardust(amount: number, ctx: CoreContext): CommandResult<EventOf<"dev.stardust.set">> {
    if (!ctx.debug) return reject("Only in the debug profile");
    if (!Number.isInteger(amount) || amount < 0) return reject("A whole number, 0 or more");
    return accept({ type: "dev.stardust.set", amount });
  },
  addXp(xp: number, ctx: CoreContext): CommandResult<EventOf<"dev.xp.added">> {
    if (!ctx.debug) return reject("Only in the debug profile");
    if (!Number.isInteger(xp) || xp <= 0) return reject("A whole number above 0");
    return accept({ type: "dev.xp.added", xp });
  },
};

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

// Courses, tasks and to-dos

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

/** A course code without spaces at the ends, or a reason. "" means no code. */
function cleanCode(code: string): { code: string } | { reason: string } {
  const clean = code.trim().replace(/\s+/g, " ");
  if (clean.length > MAX_CODE_LENGTH) {
    return { reason: `The course code can be at most ${MAX_CODE_LENGTH} characters` };
  }
  return { code: clean };
}

export function createCourse(
  state: ProgressState,
  input: { courseId: string; name: string; color: string; code?: string; examDate?: string },
): CommandResult<EventOf<"course.created">> {
  if (state.courses.has(input.courseId)) return reject("That course already exists");
  const name = cleanText(input.name, "The course name", MAX_NAME_LENGTH);
  if ("reason" in name) return reject(name.reason);
  if (!isColor(input.color)) return reject("Pick a colour");
  const code = cleanCode(input.code ?? "");
  if ("reason" in code) return reject(code.reason);
  if (input.examDate !== undefined && !isDateKey(input.examDate))
    return reject("Unknown exam date");
  return accept({
    type: "course.created",
    courseId: input.courseId,
    name: name.text,
    color: input.color,
    ...(code.code ? { code: code.code } : {}),
    ...(input.examDate ? { examDate: input.examDate } : {}),
  });
}

export function updateCourse(
  state: ProgressState,
  courseId: string,
  changes: { name?: string; color?: string; code?: string | null; examDate?: string | null },
): CommandResult<EventOf<"course.updated">> {
  const course = state.courses.get(courseId);
  if (!course) return reject("Unknown course");
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
  if (changes.code !== undefined) {
    const code = cleanCode(changes.code ?? "");
    if ("reason" in code) return reject(code.reason);
    const next = code.code || null;
    if (next !== course.code) event.code = next;
  }
  if (changes.examDate !== undefined) {
    if (changes.examDate !== null && !isDateKey(changes.examDate))
      return reject("Unknown exam date");
    event.examDate = changes.examDate;
  }
  return accept(event);
}

/**
 * A course code typed at the end or start of a name, such as "MA1041" in
 * "Calculus 1 MA1041": letters followed by digits (and maybe one more
 * letter). Returns the code and the name without it, or null.
 */
export function codeInName(name: string): { code: string; name: string } | null {
  const pattern = /^[A-Za-zÅÄÖåäö]{2,6}\d{2,4}[A-Za-z]?$/;
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return null;
  for (const index of [words.length - 1, 0]) {
    const word = (words[index] ?? "").replace(/^[([]|[)\],:]$/g, "");
    if (!pattern.test(word)) continue;
    const rest = words
      .filter((_, i) => i !== index)
      .join(" ")
      .replace(/\s*[-–:,]\s*$/, "")
      .replace(/^\s*[-–:,]\s*/, "");
    if (rest) return { code: word.toUpperCase(), name: rest };
  }
  return null;
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

// To-dos

function openTodo(state: ProgressState, todoId: string): { todo: Todo } | { reason: string } {
  const todo = state.todos.get(todoId);
  if (!todo) return { reason: "Unknown to-do" };
  if (todo.done) return { reason: "That to-do is already done" };
  return { todo };
}

/** Where a to-do goes: a planned session, the running session, or nowhere (the course list). */
export type TodoTarget = { planId: string } | { sessionId: string } | null;

function checkTarget(
  state: ProgressState,
  courseId: string,
  target: TodoTarget,
): { planId?: string; sessionId?: string } | { reason: string } {
  if (target === null) return {};
  if ("planId" in target) {
    const plan = openPlanFor(state, target.planId);
    if (!plan) return { reason: "That session has already started or was removed" };
    if (plan.courseId && plan.courseId !== courseId) {
      return { reason: "That session is for another course" };
    }
    return { planId: plan.id };
  }
  const active = state.active;
  if (!active || active.sessionId !== target.sessionId) return { reason: "No session is running" };
  if (active.courseId && active.courseId !== courseId) {
    return { reason: "The running session is for another course" };
  }
  return { sessionId: active.sessionId };
}

export function createTodo(
  state: ProgressState,
  input: { todoId: string; courseId: string; taskId?: string; text: string; target?: TodoTarget },
): CommandResult<EventOf<"todo.created">> {
  if (state.todos.has(input.todoId)) return reject("That to-do already exists");
  const course = state.courses.get(input.courseId);
  if (!course || course.archived) return reject("Pick a course");
  if (input.taskId) {
    const task = state.tasks.get(input.taskId);
    if (!task || task.courseId !== input.courseId) return reject("Unknown task");
  }
  const text = cleanText(input.text, "The to-do", MAX_STEP_LENGTH);
  if ("reason" in text) return reject(text.reason);
  const target = checkTarget(state, input.courseId, input.target ?? null);
  if ("reason" in target) return reject(target.reason);
  return accept({
    type: "todo.created",
    todoId: input.todoId,
    courseId: input.courseId,
    ...(input.taskId ? { taskId: input.taskId } : {}),
    text: text.text,
    ...target,
  });
}

export function updateTodo(
  state: ProgressState,
  todoId: string,
  text: string,
): CommandResult<EventOf<"todo.updated">> {
  const todo = state.todos.get(todoId);
  if (!todo) return reject("Unknown to-do");
  const clean = cleanText(text, "The to-do", MAX_STEP_LENGTH);
  if ("reason" in clean) return reject(clean.reason);
  if (clean.text === todo.text) return reject("Nothing changed");
  return accept({ type: "todo.updated", todoId, text: clean.text });
}

/** Ticks a to-do off. During a session it counts for that session. */
export function completeTodo(
  state: ProgressState,
  todoId: string,
  sessionId?: string,
): CommandResult<EventOf<"todo.completed">> {
  const found = openTodo(state, todoId);
  if ("reason" in found) return reject(found.reason);
  const session = sessionId ?? found.todo.sessionId ?? undefined;
  return accept({ type: "todo.completed", todoId, ...(session ? { sessionId: session } : {}) });
}

export function reopenTodo(
  state: ProgressState,
  todoId: string,
): CommandResult<EventOf<"todo.reopened">> {
  const todo = state.todos.get(todoId);
  if (!todo) return reject("Unknown to-do");
  if (!todo.done) return reject("That to-do is not done");
  return accept({ type: "todo.reopened", todoId });
}

export function deleteTodo(
  state: ProgressState,
  todoId: string,
): CommandResult<EventOf<"todo.deleted">> {
  if (!state.todos.has(todoId)) return reject("Unknown to-do");
  return accept({ type: "todo.deleted", todoId });
}

/**
 * Moves a to-do between two neighbours in the list it is shown in (either can
 * be null at the ends). With `taskId` it also moves to another task of the
 * same course, or (null) to the course's other to-dos.
 */
export function moveTodo(
  state: ProgressState,
  todoId: string,
  input: { after: string | null; before: string | null; taskId?: string | null },
): CommandResult<EventOf<"todo.moved">> {
  const todo = state.todos.get(todoId);
  if (!todo) return reject("Unknown to-do");
  const after = input.after ? state.todos.get(input.after) : undefined;
  const before = input.before ? state.todos.get(input.before) : undefined;
  if ((input.after && !after) || (input.before && !before)) return reject("Unknown to-do");
  if (after?.id === todoId || before?.id === todoId) return reject("Pick another place");
  if (input.taskId) {
    const task = state.tasks.get(input.taskId);
    if (!task || task.courseId !== todo.courseId) return reject("Unknown task");
  }
  const order =
    after && before
      ? (after.order + before.order) / 2
      : after
        ? after.order + 1
        : before
          ? before.order - 1
          : todo.order;
  const taskChanges = input.taskId !== undefined && input.taskId !== todo.taskId;
  if (order === todo.order && !taskChanges) return reject("Nothing changed");
  return accept({
    type: "todo.moved",
    todoId,
    order,
    ...(taskChanges ? { taskId: input.taskId ?? null } : {}),
  });
}

/** Gives a to-do to a planned or running session, or (with null) back to the course list. */
export function assignTodo(
  state: ProgressState,
  todoId: string,
  target: TodoTarget,
): CommandResult<EventOf<"todo.assigned"> | EventOf<"todo.unassigned">> {
  const found = openTodo(state, todoId);
  if ("reason" in found) return reject(found.reason);
  const { todo } = found;
  if (target === null) {
    if (todo.planId === null && todo.sessionId === null) return reject("It is not in a session");
    return accept({ type: "todo.unassigned", todoId });
  }
  const checked = checkTarget(state, todo.courseId, target);
  if ("reason" in checked) return reject(checked.reason);
  if (checked.planId && checked.planId === todo.planId)
    return reject("It is already in that session");
  if (checked.sessionId && checked.sessionId === todo.sessionId) {
    return reject("It is already in that session");
  }
  return accept({ type: "todo.assigned", todoId, ...checked });
}

// Settings

export function changeSettings(
  state: ProgressState,
  changes: Partial<Settings>,
): CommandResult<EventOf<"settings.changed">> {
  const reason = checkSettings(changes);
  if (reason) return reject(reason);
  const changed: Partial<Settings> = {};
  for (const [key, value] of Object.entries(changes) as [keyof Settings, unknown][]) {
    if (value !== undefined && state.settings[key] !== value) {
      (changed as Record<string, unknown>)[key] = value;
    }
  }
  if (Object.keys(changed).length === 0) return reject("Nothing changed");
  return accept({ type: "settings.changed", changes: changed });
}
