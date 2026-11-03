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

import { describe, expect, it } from "vitest";
import {
  type ActiveSession,
  breakAfter,
  focusedMs,
  isTimeUp,
  progress,
  remainingMs,
  TIMER_PRESETS,
} from "./timer.ts";

const MINUTE = 60_000;
const START = Date.UTC(2026, 10, 3, 9, 0);

function session(overrides: Partial<ActiveSession> = {}): ActiveSession {
  return {
    sessionId: "s1",
    startedAt: START,
    plannedMs: 25 * MINUTE,
    extendedMs: 0,
    pausedAt: null,
    pausedMs: 0,
    plannedStartAt: null,
    courseId: null,
    taskId: null,
    ...overrides,
  };
}

describe("focus timer", () => {
  it("counts down from the planned length", () => {
    const s = session();
    expect(remainingMs(s, START + 10 * MINUTE)).toBe(15 * MINUTE);
    expect(progress(s, START + 10 * MINUTE)).toBeCloseTo(0.4);
    expect(isTimeUp(s, START + 25 * MINUTE)).toBe(true);
  });

  it("stops counting while paused and skips earlier pauses", () => {
    const paused = session({ pausedAt: START + 10 * MINUTE });
    expect(focusedMs(paused, START + 60 * MINUTE)).toBe(10 * MINUTE);
    const resumed = session({ pausedMs: 5 * MINUTE });
    expect(focusedMs(resumed, START + 20 * MINUTE)).toBe(15 * MINUTE);
  });

  it("adds extensions to the target", () => {
    const s = session({ extendedMs: 5 * MINUTE });
    expect(remainingMs(s, START + 25 * MINUTE)).toBe(5 * MINUTE);
  });

  it("never reports negative focus time, even if the clock jumps back", () => {
    expect(focusedMs(session(), START - MINUTE)).toBe(0);
  });

  it("gives a long break after every fourth classic session", () => {
    const preset = TIMER_PRESETS.classic;
    expect(breakAfter(1, preset)).toMatchObject({ minutes: 5, long: false });
    expect(breakAfter(4, preset)).toMatchObject({ minutes: 15, long: true });
    expect(breakAfter(8, preset).long).toBe(true);
  });
});
