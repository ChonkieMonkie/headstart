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
import { type CoreContext, owns, type ProgressState } from "./state.ts";

export type CommandResult<E extends StudyEvent = StudyEvent> =
  | { ok: true; event: E }
  | { ok: false; reason: string };

const accept = <E extends StudyEvent>(event: E): CommandResult<E> => ({ ok: true, event });
const reject = (reason: string): CommandResult<never> => ({ ok: false, reason });

type EventOf<T extends StudyEvent["type"]> = Extract<StudyEvent, { type: T }>;

export const MAX_SESSION_MINUTES = 240;
export const MAX_EXTENSION_MINUTES = 60;

export interface StartSessionInput {
  sessionId: string;
  plannedMinutes: number;
  plannedStartAt?: Date;
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
  return accept({
    type: "session.started",
    sessionId: input.sessionId,
    plannedMinutes: minutes,
    ...(input.plannedStartAt ? { plannedStartAt: input.plannedStartAt.toISOString() } : {}),
    ...(input.courseId ? { courseId: input.courseId } : {}),
    ...(input.taskId ? { taskId: input.taskId } : {}),
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
