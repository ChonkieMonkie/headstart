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

// The focus timer works from timestamps, never by counting ticks, so sleep
// mode, a frozen UI or a closed laptop can never make it drift.

const MINUTE = 60_000;

/** A focus session in progress. All times are epoch milliseconds. */
export interface ActiveSession {
  sessionId: string;
  startedAt: number;
  plannedMs: number;
  extendedMs: number;
  /** Set while paused. */
  pausedAt: number | null;
  /** Total time spent paused before the current pause. */
  pausedMs: number;
  plannedStartAt: number | null;
  planId: string | null;
  courseId: string | null;
  taskId: string | null;
}

/** Time actually spent focusing so far (pauses excluded). */
export function focusedMs(session: ActiveSession, now: number): number {
  const end = session.pausedAt ?? now;
  return Math.max(0, end - session.startedAt - session.pausedMs);
}

/** The session's full length including any extensions. */
export function targetMs(session: ActiveSession): number {
  return session.plannedMs + session.extendedMs;
}

/** Time left of the session. Negative once the session runs over. */
export function remainingMs(session: ActiveSession, now: number): number {
  return targetMs(session) - focusedMs(session, now);
}

export function isTimeUp(session: ActiveSession, now: number): boolean {
  return remainingMs(session, now) <= 0;
}

/** Share of the session done, from 0 to 1. Handy for progress rings. */
export function progress(session: ActiveSession, now: number): number {
  const target = targetMs(session);
  return target <= 0 ? 1 : Math.min(1, focusedMs(session, now) / target);
}

export interface TimerPreset {
  id: string;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  /** A long break follows every n-th session. */
  longBreakEvery: number;
}

export const TIMER_PRESETS = {
  classic: {
    id: "classic",
    name: "Classic 25 / 5",
    focusMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    longBreakEvery: 4,
  },
  deep: {
    id: "deep",
    name: "Deep work 50 / 10",
    focusMinutes: 50,
    breakMinutes: 10,
    longBreakMinutes: 20,
    longBreakEvery: 3,
  },
  justFive: {
    id: "just-five",
    name: "Just 5 minutes",
    focusMinutes: 5,
    breakMinutes: 5,
    longBreakMinutes: 5,
    longBreakEvery: 4,
  },
} as const satisfies Record<string, TimerPreset>;

/** The break that follows the n-th session of a run (n starts at 1). */
export function breakAfter(
  sessionNumber: number,
  preset: TimerPreset,
): { minutes: number; long: boolean; ms: number } {
  const long = sessionNumber > 0 && sessionNumber % preset.longBreakEvery === 0;
  const minutes = long ? preset.longBreakMinutes : preset.breakMinutes;
  return { minutes, long, ms: minutes * MINUTE };
}
