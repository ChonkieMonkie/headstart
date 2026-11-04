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

// Everything that happens is stored as an immutable event. Everything shown in
// the app (XP, level, inventory, streaks) is computed from these events.
//
// Rules for changing this file:
// - Never change the meaning of an existing event type or field.
// - Add new event types or optional fields freely.
// - A breaking change needs a new EVENT_SCHEMA and an upgrade step for old events.

import type { CrateType, MascotId, Rarity, Slot } from "@headstart/content";
import type { Settings } from "./settings.ts";

export const EVENT_SCHEMA = 1;

export type FocusRating = 1 | 2 | 3 | 4 | 5;

/** One item that came out of a crate. Stored in the event so results never change later. */
export interface CrateDrop {
  /** Null when no item of the rolled rarity existed; the drop then became Stardust. */
  itemId: string | null;
  rarity: Rarity;
  duplicate: boolean;
  stardust: number;
}

export type StudyEvent =
  | {
      type: "session.started";
      sessionId: string;
      plannedMinutes: number;
      /** When the session was planned to start, if it was planned. Decides "on time". */
      plannedStartAt?: string;
      /** The planned session this one carries out, if any. */
      planId?: string;
      courseId?: string;
      taskId?: string;
    }
  | { type: "session.paused"; sessionId: string }
  | { type: "session.resumed"; sessionId: string }
  | { type: "session.extended"; sessionId: string; minutes: number }
  /** The running session moved to another course or task. The whole session follows. */
  | {
      type: "session.retargeted";
      sessionId: string;
      courseId: string | null;
      taskId: string | null;
    }
  | {
      type: "session.completed";
      sessionId: string;
      distractions: number;
      focusRating?: FocusRating;
    }
  | { type: "session.abandoned"; sessionId: string }
  | { type: "recall.written"; sessionId: string; text: string }
  /** How focused the session felt, given on the "session complete" screen. */
  | { type: "session.rated"; sessionId: string; focusRating: FocusRating }
  | {
      type: "course.created";
      courseId: string;
      name: string;
      color: string;
      /** Short code such as "MA1234", shown beside the name. */
      code?: string;
      /** Local date of the exam, "YYYY-MM-DD". */
      examDate?: string;
    }
  | {
      type: "course.updated";
      courseId: string;
      name?: string;
      color?: string;
      /** A code sets it, null removes it. */
      code?: string | null;
      /** A date sets the exam, null removes it. */
      examDate?: string | null;
    }
  | { type: "course.archived"; courseId: string }
  | {
      type: "task.created";
      taskId: string;
      courseId: string;
      title: string;
      /** The concrete first action, so starting never needs a decision. It
       * becomes the task's first to-do, with the id `<taskId>:first`. */
      nextStep: string;
    }
  /** Older logs change the first to-do through `nextStep`; new code uses `todo.*`. */
  | { type: "task.updated"; taskId: string; title?: string; nextStep?: string }
  | { type: "task.completed"; taskId: string }
  | { type: "task.reopened"; taskId: string }
  | {
      type: "session.planned";
      planId: string;
      startAt: string;
      minutes: number;
      courseId?: string;
      taskId?: string;
    }
  | { type: "plan.moved"; planId: string; startAt: string }
  | { type: "plan.cancelled"; planId: string }
  /** A to-do under a course (and maybe a task), such as "Redo problem 3.7 d". */
  | {
      type: "todo.created";
      todoId: string;
      courseId: string;
      taskId?: string;
      text: string;
      /** Assign it right away to a planned session or the running one. */
      planId?: string;
      sessionId?: string;
    }
  | { type: "todo.updated"; todoId: string; text: string }
  /**
   * Dragged to a new place: `order` sorts it among the other to-dos. With
   * `taskId` it also moved to another task of its course (null: no task).
   */
  | { type: "todo.moved"; todoId: string; order: number; taskId?: string | null }
  /** Ticked off, during or after the session given, if any. */
  | { type: "todo.completed"; todoId: string; sessionId?: string }
  | { type: "todo.reopened"; todoId: string }
  | { type: "todo.deleted"; todoId: string }
  /** Give the to-do to a planned session or the running session. */
  | { type: "todo.assigned"; todoId: string; planId?: string; sessionId?: string }
  | { type: "todo.unassigned"; todoId: string }
  | { type: "crate.opened"; crateId: string; crateType: CrateType; drops: CrateDrop[] }
  | { type: "item.crafted"; itemId: string; cost: number }
  | { type: "item.equipped"; mascot: MascotId; slot: Slot; itemId: string | null }
  | { type: "mascot.chosen"; mascot: MascotId }
  /** Only the settings that changed. */
  | { type: "settings.changed"; changes: Partial<Settings> };

export type StudyEventType = StudyEvent["type"];

export interface EventEnvelope<E extends StudyEvent = StudyEvent> {
  /** ULID: unique across devices and sortable by time. */
  id: string;
  deviceId: string;
  /** Per-device counter, used to sync only what another device has not seen. */
  seq: number;
  /** ISO 8601 time the event happened. */
  occurredAt: string;
  schema: number;
  event: E;
}

/** Orders events by time, then by id, which is the order they are applied in. */
export function compareEvents(a: EventEnvelope, b: EventEnvelope): number {
  if (a.occurredAt !== b.occurredAt) return a.occurredAt < b.occurredAt ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}
