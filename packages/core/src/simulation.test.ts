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
import { defaultContext } from "./index.ts";
import { simulateStudy } from "./simulation.ts";
import { type CoreContext, project } from "./state.ts";

const ctx: CoreContext = {
  ...defaultContext,
  dayKey: (ms) => new Date(ms).toISOString().slice(0, 10),
};

describe("a simulated semester", () => {
  it("adds up: XP, crates and pity all follow the rules", { timeout: 30_000 }, async () => {
    const { engine, summary } = await simulateStudy({
      ctx,
      seed: "semester",
      weeks: 20,
      sessionsPerDay: [2, 6],
      restDays: [0],
    });
    const { state } = engine;

    // XP is exactly the sum of what each session and recall earned.
    let expectedXp = 0;
    for (const record of state.sessions.values())
      expectedXp += record.score.totalXp + record.recallXp;
    expect(state.xp).toBe(expectedXp);

    // Every session is 25 minutes and at most 6 a day, so all count toward crates.
    expect(summary.cratesOpened).toBe(Math.floor(summary.sessions / 3));
    expect(summary.longestWithoutEpic).toBeLessThan(ctx.crates.pity.epic);
    expect(summary.longestWithoutLegendary).toBeLessThan(ctx.crates.pity.legendary);
    expect(summary.level.level).toBeGreaterThan(5);

    // Replaying the log gives the same result.
    const replayed = project(engine.events, ctx);
    expect(replayed.xp).toBe(state.xp);
    expect(replayed.stardust).toBe(state.stardust);
  });

  it("is reproducible from its seed", async () => {
    const run = () => simulateStudy({ ctx, seed: "same", weeks: 2, sessionsPerDay: [1, 4] });
    const [a, b] = await Promise.all([run(), run()]);
    expect(a.summary).toEqual(b.summary);
  });
});
