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
import { changeSettings, createCourse, planSession } from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import { upcomingReminders } from "./planner.ts";
import { DEFAULT_SETTINGS, mergeSettings, reminderRules } from "./settings.ts";
import { MemoryEventStore } from "./store.ts";

const NOW = new Date(2026, 10, 3, 8, 0).getTime();

async function setup() {
  const engine = await StudyEngine.open(
    new MemoryEventStore(),
    { deviceId: "test", now: () => new Date(NOW) },
    defaultContext,
  );
  const run = async (command: Parameters<StudyEngine["run"]>[0]) => {
    const result = await engine.run(command);
    if (!result.ok) throw new Error(result.reason);
    return result;
  };
  return { engine, run };
}

describe("settings", () => {
  it("start with the defaults and change one at a time", async () => {
    const { engine, run } = await setup();
    expect(engine.state.settings).toEqual(DEFAULT_SETTINGS);
    await run((s) => changeSettings(s, { focusMinutes: 50, autoBreak: false }));
    expect(engine.state.settings).toMatchObject({
      focusMinutes: 50,
      autoBreak: false,
      maxNudgesPerDay: 3,
    });
    expect(changeSettings(engine.state, { focusMinutes: 50 })).toMatchObject({
      ok: false,
      reason: "Nothing changed",
    });
  });

  it("refuse values the screen does not offer", async () => {
    const { engine } = await setup();
    expect(changeSettings(engine.state, { focusMinutes: 7 }).ok).toBe(false);
    expect(changeSettings(engine.state, { remindBeforeMinutes: 3 }).ok).toBe(false);
    expect(changeSettings(engine.state, { maxNudgesPerDay: -1 }).ok).toBe(false);
    expect(mergeSettings(DEFAULT_SETTINGS, { focusMinutes: 7 })).toEqual(DEFAULT_SETTINGS);
  });

  it("turn reminders and nudges off", async () => {
    const { engine, run } = await setup();
    await run((s) => createCourse(s, { courseId: "c", name: "Calculus", color: "#255EBC" }));
    await run((s) =>
      planSession(s, {
        planId: "p",
        startAt: new Date(NOW + 60 * 60_000),
        minutes: 25,
        courseId: "c",
      }),
    );
    const kinds = () =>
      upcomingReminders(engine.state, NOW, reminderRules(engine.state.settings)).map((r) => r.kind);
    expect(kinds()).toEqual(["soon", "late"]);
    await run((s) => changeSettings(s, { remindBeforeMinutes: null }));
    expect(kinds()).toEqual(["late"]);
    await run((s) => changeSettings(s, { maxNudgesPerDay: 0 }));
    expect(kinds()).toEqual([]);
  });
});
