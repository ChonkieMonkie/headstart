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
import { claimGift, completeSession, openCrate, startSession } from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { giftsDue, isMilestone, streakFlames } from "./gifts.ts";
import { defaultContext } from "./index.ts";
import { MemoryEventStore } from "./store.ts";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
/** Monday 2 November 2026, 09:00. */
const MONDAY = new Date(2026, 10, 2, 9, 0).getTime();

async function setup() {
  let now = MONDAY;
  let n = 0;
  const engine = await StudyEngine.open(
    new MemoryEventStore(),
    { deviceId: "test", now: () => new Date(now) },
    defaultContext,
  );
  const study = async (day: number) => {
    now = MONDAY + day * DAY;
    await engine.run((s) => startSession(s, { sessionId: `s${++n}`, plannedMinutes: 25 }));
    now += 25 * MINUTE;
    await engine.run((s) => completeSession(s, { distractions: 0 }));
  };
  /** Meets the default goal (5 study days) in week `index`. */
  const meet = async (index: number) => {
    for (let d = 0; d < 5; d++) await study(index * 7 + d);
  };
  /** Gives every gift that is due now, the way the app does after each change. */
  const settle = async () => {
    for (const gift of giftsDue(engine.state, now, defaultContext)) {
      await engine.run((s, c) => claimGift(s, c, { giftId: gift.giftId, now }));
    }
  };
  return {
    engine,
    meet,
    study,
    settle,
    setDay: (day: number) => {
      now = MONDAY + day * DAY;
    },
    due: () => giftsDue(engine.state, now, defaultContext),
    gifts: () => engine.state.crates.filter((c) => c.id.startsWith("gift:")).map((c) => c.id),
  };
}

describe("gifts", () => {
  it("gives a Weekly Gift once when the goal is met", async () => {
    const t = await setup();
    await t.study(0);
    expect(t.due()).toEqual([]);
    await t.meet(0);
    expect(t.due()).toEqual([
      { giftId: "weekly:2026-11-02", crateType: "weekly", reason: "weekly-goal" },
    ]);
    await t.settle();
    expect(t.due()).toEqual([]);
    expect(t.gifts()).toEqual(["gift:weekly:2026-11-02"]);
    // More sessions that week give nothing more.
    await t.study(5);
    expect(t.due()).toEqual([]);
  });

  it("still gives last week's gift after a week the app was closed, but not older ones", async () => {
    const t = await setup();
    await t.meet(0);
    await t.meet(1);
    await t.meet(2);
    t.setDay(23); // Wednesday of week 3
    expect(t.due().map((g) => g.giftId)).toEqual(["weekly:2026-11-16"]);
  });

  it("gives a Streak Chest every four weeks in a row, with the flames counting up", async () => {
    const t = await setup();
    for (let w = 0; w < 4; w++) {
      await t.meet(w);
      await t.settle();
    }
    expect(t.gifts()).toEqual([
      "gift:weekly:2026-11-02",
      "gift:weekly:2026-11-09",
      "gift:weekly:2026-11-16",
      "gift:weekly:2026-11-23",
      "gift:streak:2026-11-23",
    ]);
    expect(t.engine.state.crates.find((c) => c.id === "gift:streak:2026-11-23")?.type).toBe(
      "streak",
    );
    expect([0, 1, 2, 3, 4, 5, 8, 9].map(streakFlames)).toEqual([0, 1, 2, 3, 4, 1, 4, 1]);
  });

  it("gives a Milestone Vault for big plaques only", async () => {
    expect(isMilestone("session-stacker", 3, 5)).toBe(false);
    expect(isMilestone("session-stacker", 4, 5)).toBe(true);
    expect(isMilestone("habit-formed", 1, 1)).toBe(true);
    expect(isMilestone("first-dip", 1, 1)).toBe(false);
    expect(isMilestone("set:garden", 1, 1)).toBe(true);

    const t = await setup();
    await t.study(0);
    // Recorded tiers, as if they had been reached (the plaque rules are tested elsewhere).
    const record = (plaqueId: string, tier: number) =>
      t.engine.run(() => ({
        ok: true as const,
        event: { type: "plaque.earned" as const, plaqueId, tier },
      }));
    await record("session-stacker", 5);
    await record("first-dip", 1);
    expect(t.due().map((g) => g.giftId)).toEqual([
      "milestone:session-stacker:4",
      "milestone:session-stacker:5",
    ]);
  });

  it("refuses a gift that is not due, and opens a gift crate with its own odds", async () => {
    const t = await setup();
    const refused = await t.engine.run((s, c) =>
      claimGift(s, c, { giftId: "weekly:2026-11-02", now: MONDAY }),
    );
    expect(refused.ok).toBe(false);
    await t.meet(0);
    await t.settle();
    const opened = await t.engine.run((s, c) => openCrate(s, "gift:weekly:2026-11-02", c));
    expect(opened.ok && opened.event.drops.length).toBe(2);
  });
});
