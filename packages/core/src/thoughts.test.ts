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
  clearThought,
  completeSession,
  createCourse,
  createTodo,
  MAX_OPEN_THOUGHTS,
  parkThought,
  startSession,
} from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import { project } from "./state.ts";
import { MemoryEventStore } from "./store.ts";

const START = new Date(2026, 10, 16, 9, 0).getTime();
const MINUTE = 60_000;

async function setup() {
  let now = START;
  const store = new MemoryEventStore();
  const engine = await StudyEngine.open(
    store,
    { deviceId: "test", now: () => new Date(now) },
    defaultContext,
  );
  return {
    engine,
    store,
    later: (minutes: number) => {
      now += minutes * MINUTE;
    },
  };
}

describe("parked thoughts", () => {
  it("parks a thought with no course, during a session or not", async () => {
    const { engine, later } = await setup();
    const first = await engine.run((s) =>
      parkThought(s, { thoughtId: "a", text: "  Buy   milk " }),
    );
    expect(first.ok).toBe(true);
    await engine.run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25 }));
    later(3);
    await engine.run((s) =>
      parkThought(s, { thoughtId: "b", text: "Call the dentist", sessionId: "s1" }),
    );
    expect([...engine.state.thoughts.values()]).toEqual([
      { id: "a", text: "Buy milk", parkedAt: START, sessionId: null },
      { id: "b", text: "Call the dentist", parkedAt: START + 3 * MINUTE, sessionId: "s1" },
    ]);
  });

  it("keeps thoughts after the session ends, until they are cleared", async () => {
    const { engine, later } = await setup();
    await engine.run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25 }));
    await engine.run((s) => parkThought(s, { thoughtId: "a", text: "Buy milk", sessionId: "s1" }));
    later(25);
    await engine.run((s) => completeSession(s, { distractions: 0 }));
    expect(engine.state.thoughts.size).toBe(1);
    later(24 * 60);
    expect((await engine.run((s) => clearThought(s, "a"))).ok).toBe(true);
    expect(engine.state.thoughts.size).toBe(0);
    expect(await engine.run((s) => clearThought(s, "a"))).toEqual({
      ok: false,
      reason: "That thought is already cleared",
    });
  });

  it("turns a thought into a to-do and clears it", async () => {
    const { engine } = await setup();
    await engine.run((s) =>
      createCourse(s, { courseId: "la", name: "Linear Algebra", color: "#255EBC" }),
    );
    await engine.run((s) => parkThought(s, { thoughtId: "a", text: "Look up Gram-Schmidt" }));
    const text = engine.state.thoughts.get("a")?.text ?? "";
    await engine.run((s) => createTodo(s, { todoId: "td", courseId: "la", text }));
    const cleared = await engine.run((s) => clearThought(s, "a", "td"));
    expect(cleared).toEqual({
      ok: true,
      event: { type: "thought.cleared", thoughtId: "a", todoId: "td" },
    });
    expect(engine.state.todos.get("td")?.text).toBe("Look up Gram-Schmidt");
    expect(engine.state.thoughts.size).toBe(0);
  });

  it("refuses empty, too long and too many thoughts", async () => {
    const { engine } = await setup();
    expect((await engine.run((s) => parkThought(s, { thoughtId: "a", text: "   " }))).ok).toBe(
      false,
    );
    expect(
      (await engine.run((s) => parkThought(s, { thoughtId: "a", text: "x".repeat(201) }))).ok,
    ).toBe(false);
    for (let i = 0; i < MAX_OPEN_THOUGHTS; i++) {
      await engine.run((s) => parkThought(s, { thoughtId: `t${i}`, text: `Thought ${i}` }));
    }
    expect(
      await engine.run((s) => parkThought(s, { thoughtId: "more", text: "One more" })),
    ).toEqual({ ok: false, reason: "Clear a few parked thoughts first" });
  });

  it("rebuilds the same list from the log", async () => {
    const { engine, store } = await setup();
    await engine.run((s) => parkThought(s, { thoughtId: "a", text: "Buy milk" }));
    await engine.run((s) => parkThought(s, { thoughtId: "b", text: "Book train tickets" }));
    await engine.run((s) => clearThought(s, "a"));
    const again = project(await store.load(), defaultContext);
    expect([...again.thoughts.keys()]).toEqual(["b"]);
  });
});
