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
  sessionInBlock,
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
    planId: null,
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

describe("study blocks", () => {
  const preset = TIMER_PRESETS.classic;
  const at = (h: number, m: number) => new Date(2026, 10, 4, h, m).getTime();
  const session = (h: number, m: number) => ({
    startedAt: at(h, m),
    endedAt: at(h, m) + 25 * MINUTE,
  });

  it("counts four sessions in a row, so the 4th gets the long break", () => {
    const four = [session(9, 0), session(9, 30), session(10, 0), session(10, 30)];
    expect(sessionInBlock(four, preset)).toBe(4);
    expect(breakAfter(sessionInBlock(four, preset), preset).long).toBe(true);
  });

  it("starts again after a long gap", () => {
    const split = [session(9, 0), session(9, 30), session(18, 0), session(18, 30)];
    expect(sessionInBlock(split, preset)).toBe(2);
    expect(breakAfter(sessionInBlock(split, preset), preset).long).toBe(false);
  });

  it("allows the break plus 30 minutes, and a skipped break still counts", () => {
    // 09:25 end, 5 min break, then 30 minutes: 10:00 is still the same block.
    expect(sessionInBlock([session(9, 0), session(10, 0)], preset)).toBe(2);
    expect(sessionInBlock([session(9, 0), session(10, 1)], preset)).toBe(1);
    expect(sessionInBlock([session(9, 0), session(9, 25)], preset)).toBe(2);
  });

  it("starts a new block after done for today", () => {
    const four = [session(9, 0), session(9, 30), session(10, 0)];
    expect(sessionInBlock(four, preset, at(9, 56))).toBe(1);
    expect(sessionInBlock([], preset)).toBe(0);
  });
});
