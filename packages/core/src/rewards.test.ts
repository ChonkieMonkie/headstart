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

import { rewardRules as rules } from "@headstart/content";
import { describe, expect, it } from "vitest";
import {
  isOnTime,
  levelInfo,
  recallEarnsBonus,
  scoreSession,
  totalXpForLevel,
  xpToNextLevel,
} from "./rewards.ts";

const MINUTE = 60_000;
const PLAN = Date.UTC(2026, 10, 3, 9, 0);

describe("levels", () => {
  it("follow the 100 × n^1.4 curve, rounded to tens", () => {
    expect(xpToNextLevel(1, rules)).toBe(100);
    expect(xpToNextLevel(2, rules)).toBe(260);
    expect(xpToNextLevel(10, rules)).toBe(2510);
  });

  it("get steadily more expensive", () => {
    for (let l = 1; l < 100; l++) {
      expect(xpToNextLevel(l + 1, rules)).toBeGreaterThan(xpToNextLevel(l, rules));
    }
  });

  it("are computed from total XP", () => {
    expect(levelInfo(0, rules)).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      totalXp: 0,
    });
    expect(levelInfo(99, rules).level).toBe(1);
    expect(levelInfo(100, rules)).toMatchObject({ level: 2, xpIntoLevel: 0 });
    for (const level of [2, 5, 20, 50]) {
      const total = totalXpForLevel(level, rules);
      expect(levelInfo(total, rules)).toMatchObject({ level, xpIntoLevel: 0 });
      expect(levelInfo(total - 1, rules).level).toBe(level - 1);
    }
  });
});

describe("session XP", () => {
  it("counts starts from 10 minutes early to 5 minutes late as on time", () => {
    expect(isOnTime(PLAN - 10 * MINUTE, PLAN, rules)).toBe(true);
    expect(isOnTime(PLAN + 5 * MINUTE, PLAN, rules)).toBe(true);
    expect(isOnTime(PLAN - 11 * MINUTE, PLAN, rules)).toBe(false);
    expect(isOnTime(PLAN + 6 * MINUTE, PLAN, rules)).toBe(false);
  });

  it("gives 18 XP for a full, on-time, distraction-free session", () => {
    const score = scoreSession(
      { focusedMs: 25 * MINUTE, startedAt: PLAN, plannedStartAt: PLAN, distractions: 0 },
      rules,
    );
    expect(score).toMatchObject({
      baseXp: 10,
      onTimeXp: 5,
      distractionFreeXp: 3,
      totalXp: 18,
      qualifies: true,
    });
  });

  it("leaves out the on-time bonus for unplanned sessions", () => {
    const score = scoreSession(
      { focusedMs: 25 * MINUTE, startedAt: PLAN, plannedStartAt: null, distractions: 2 },
      rules,
    );
    expect(score).toMatchObject({ onTime: null, totalXp: 10, distractionFree: false });
  });

  it("still rewards a short 'just 5 minutes' session, without crate progress", () => {
    const score = scoreSession(
      { focusedMs: 5 * MINUTE, startedAt: PLAN, plannedStartAt: PLAN, distractions: 0 },
      rules,
    );
    expect(score).toMatchObject({ baseXp: 2, onTimeXp: 5, distractionFreeXp: 0, qualifies: false });
  });

  it("only rewards a recall with some real content", () => {
    expect(recallEarnsBonus("   short   ", rules)).toBe(false);
    expect(recallEarnsBonus("Eigenvectors keep their direction.", rules)).toBe(true);
  });
});
