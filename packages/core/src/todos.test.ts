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
  abandonSession,
  assignTodo,
  codeInName,
  completeSession,
  completeTodo,
  createCourse,
  createTask,
  createTodo,
  deleteTodo,
  planSession,
  reopenTodo,
  startSession,
  updateCourse,
  updateTask,
  updateTodo,
} from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import { COURSE_COLORS, openTodos, todosForPlan, todosForSession } from "./planner.ts";
import { currentCourseColor, firstTodoId } from "./state.ts";
import { MemoryEventStore } from "./store.ts";

const START = new Date(2026, 10, 3, 8, 0).getTime();
const MINUTE = 60_000;

async function setup() {
  let now = START;
  const engine = await StudyEngine.open(
    new MemoryEventStore(),
    { deviceId: "test", now: () => new Date(now) },
    defaultContext,
  );
  const run = async (command: Parameters<StudyEngine["run"]>[0]) => {
    const result = await engine.run(command);
    if (!result.ok) throw new Error(result.reason);
    return result;
  };
  await run((s) => createCourse(s, { courseId: "la", name: "Linear Algebra", color: "#255EBC" }));
  await run((s) => createCourse(s, { courseId: "st", name: "Statistics", color: "#F28F29" }));
  await run((s) =>
    createTask(s, { taskId: "t1", courseId: "la", title: "Chapter 3", nextStep: "Read 3.1" }),
  );
  return {
    engine,
    run,
    later: (minutes: number) => {
      now += minutes * MINUTE;
    },
    get now() {
      return now;
    },
  };
}

describe("to-dos", () => {
  it("turns a task's next step into its first to-do", async () => {
    const { engine, run } = await setup();
    expect(engine.state.todos.get(firstTodoId("t1"))).toMatchObject({
      text: "Read 3.1",
      taskId: "t1",
    });
    await run((s) =>
      createTodo(s, { todoId: "d2", courseId: "la", taskId: "t1", text: "Redo 3.7 d" }),
    );
    await run((s) => completeTodo(s, firstTodoId("t1")));
    expect(engine.state.tasks.get("t1")?.nextStep).toBe("Redo 3.7 d");
    await run((s) => completeTodo(s, "d2"));
    expect(engine.state.tasks.get("t1")?.nextStep).toBe("");
    await run((s) => reopenTodo(s, "d2"));
    expect(engine.state.tasks.get("t1")?.nextStep).toBe("Redo 3.7 d");
  });

  it("keeps old logs working: a changed next step edits the first to-do", async () => {
    const { engine, run } = await setup();
    await run((s) => updateTask(s, "t1", { nextStep: "Read 3.2" }));
    expect(engine.state.todos.get(firstTodoId("t1"))?.text).toBe("Read 3.2");
    await run((s) => completeTodo(s, firstTodoId("t1")));
    await run((s) => updateTask(s, "t1", { nextStep: "Read 3.3" }));
    expect(openTodos(engine.state, "la").map((t) => t.text)).toEqual(["Read 3.3"]);
  });

  it("checks text, course and task", async () => {
    const { engine } = await setup();
    const s = engine.state;
    expect(createTodo(s, { todoId: "x", courseId: "la", text: "   " }).ok).toBe(false);
    expect(createTodo(s, { todoId: "x", courseId: "nope", text: "Hi" }).ok).toBe(false);
    expect(createTodo(s, { todoId: "x", courseId: "st", taskId: "t1", text: "Hi" }).ok).toBe(false);
    expect(createTodo(s, { todoId: "x", courseId: "la", text: "Hi" }).ok).toBe(true);
    expect(updateTodo(s, firstTodoId("t1"), "Read 3.1").ok).toBe(false);
    expect(deleteTodo(s, "missing").ok).toBe(false);
  });

  it("goes along with a planned session and comes back if it is not done", async () => {
    const { engine, run, later } = await setup();
    await run((s) =>
      planSession(s, {
        planId: "p1",
        startAt: new Date(START + 30 * MINUTE),
        minutes: 25,
        courseId: "la",
      }),
    );
    await run((s) => createTodo(s, { todoId: "d2", courseId: "la", text: "Redo 3.7 d" }));
    await run((s) => assignTodo(s, firstTodoId("t1"), { planId: "p1" }));
    await run((s) => assignTodo(s, "d2", { planId: "p1" }));
    expect(todosForPlan(engine.state, "p1")).toHaveLength(2);
    expect(assignTodo(engine.state, "d2", { planId: "p1" }).ok).toBe(false);

    later(30);
    await run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25, planId: "p1" }));
    expect(engine.state.todos.get("d2")?.sessionId).toBe("s1");
    await run((s) => completeTodo(s, "d2"));
    later(25);
    await run((s) => completeSession(s, { distractions: 0 }));

    const done = engine.state.todos.get("d2");
    expect(done).toMatchObject({ done: true, doneInSessionId: "s1", sessionId: null });
    expect(engine.state.todos.get(firstTodoId("t1"))).toMatchObject({
      done: false,
      sessionId: null,
      planId: null,
    });
    expect(engine.state.sessions.get("s1")?.todoIds.sort()).toEqual(
      ["d2", firstTodoId("t1")].sort(),
    );
    expect(todosForSession(engine.state, "s1")).toHaveLength(2);
  });

  it("returns to its plan when the session is abandoned", async () => {
    const { engine, run, later } = await setup();
    await run((s) =>
      planSession(s, {
        planId: "p1",
        startAt: new Date(START + 10 * MINUTE),
        minutes: 25,
        courseId: "la",
      }),
    );
    await run((s) => assignTodo(s, firstTodoId("t1"), { planId: "p1" }));
    later(10);
    await run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25, planId: "p1" }));
    await run((s) => abandonSession(s));
    expect(engine.state.todos.get(firstTodoId("t1"))).toMatchObject({
      planId: "p1",
      sessionId: null,
    });
  });

  it("can be added straight to the running session, but only for its course", async () => {
    const { engine, run } = await setup();
    await run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25, taskId: "t1" }));
    await run((s) =>
      createTodo(s, {
        todoId: "d2",
        courseId: "la",
        text: "Check answers",
        target: { sessionId: "s1" },
      }),
    );
    expect(engine.state.todos.get("d2")?.sessionId).toBe("s1");
    expect(
      createTodo(engine.state, {
        todoId: "d3",
        courseId: "st",
        text: "Other",
        target: { sessionId: "s1" },
      }).ok,
    ).toBe(false);
    await run((s) => assignTodo(s, "d2", null));
    expect(engine.state.todos.get("d2")?.sessionId).toBeNull();
  });
});

describe("course codes", () => {
  it("are optional, trimmed and can be removed", async () => {
    const { engine, run } = await setup();
    await run((s) =>
      createCourse(s, { courseId: "c3", name: "Calculus", code: " MA1041 ", color: "#227702" }),
    );
    expect(engine.state.courses.get("c3")?.code).toBe("MA1041");
    expect(engine.state.courses.get("la")?.code).toBeNull();
    await run((s) => updateCourse(s, "c3", { code: null }));
    expect(engine.state.courses.get("c3")?.code).toBeNull();
    expect(updateCourse(engine.state, "c3", { code: "X".repeat(17) }).ok).toBe(false);
  });

  it("are found in names typed before the code field existed", () => {
    expect(codeInName("Calculus 1 MA1041")).toEqual({
      code: "MA1041",
      name: "Calculus 1",
    });
    expect(codeInName("Engineering Project EP2051")).toEqual({
      code: "EP2051",
      name: "Engineering Project",
    });
    expect(codeInName("MA1234 - Linear Algebra")).toEqual({
      code: "MA1234",
      name: "Linear Algebra",
    });
    expect(codeInName("Linear Algebra")).toBeNull();
    expect(codeInName("MA1041")).toBeNull();
  });
});

describe("course colours", () => {
  it("shows retired colours as the nearest new one, keeping different courses apart", () => {
    expect(currentCourseColor("#2F9E6E")).not.toBe(currentCourseColor("#2A9D8F"));
    for (const old of [
      "#5B4BD6",
      "#B35C00",
      "#2A9D8F",
      "#8A6D00",
      "#C2417A",
      "#2F7FD8",
      "#2F9E6E",
      "#B4462E",
    ]) {
      expect(COURSE_COLORS as readonly string[]).toContain(currentCourseColor(old));
    }
    for (const color of COURSE_COLORS) expect(currentCourseColor(color)).toBe(color);
  });
});
