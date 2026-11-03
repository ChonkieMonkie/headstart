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
  archiveCourse,
  cancelPlan,
  completeSession,
  completeTask,
  createCourse,
  createTask,
  isDateKey,
  movePlan,
  planSession,
  rateSession,
  reopenTask,
  startSession,
  updateCourse,
  updateTask,
} from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import {
  daysUntil,
  openTasks,
  plansOn,
  planToStartNow,
  upcomingPlan,
  upcomingReminders,
} from "./planner.ts";
import { computeStats, lastDays } from "./stats.ts";
import { MemoryEventStore } from "./store.ts";

/** 3 November 2026, 08:00 local time. */
const MORNING = new Date(2026, 10, 3, 8, 0).getTime();

async function setup() {
  let now = MORNING;
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
  await run((s) =>
    createCourse(s, {
      courseId: "la",
      name: "  Linear   Algebra ",
      color: "#5B4BD6",
      examDate: "2026-11-26",
    }),
  );
  await run((s) =>
    createTask(s, {
      taskId: "t1",
      courseId: "la",
      title: "Problem 4.12",
      nextStep: "Open chapter 4",
    }),
  );
  return {
    engine,
    run,
    get now() {
      return now;
    },
    at: (hours: number, minutes = 0) => {
      now = new Date(2026, 10, 3, hours, minutes).getTime();
      return now;
    },
  };
}

describe("courses and tasks", () => {
  it("are created with clean text and a required next step", async () => {
    const { engine } = await setup();
    expect(engine.state.courses.get("la")).toMatchObject({
      name: "Linear Algebra",
      examDate: "2026-11-26",
    });
    expect(engine.state.tasks.get("t1")).toMatchObject({
      courseId: "la",
      nextStep: "Open chapter 4",
      done: false,
    });
    const noStep = createTask(engine.state, {
      taskId: "t2",
      courseId: "la",
      title: "Lab",
      nextStep: "  ",
    });
    expect(noStep).toEqual({ ok: false, reason: "The next step cannot be empty" });
    expect(
      createTask(engine.state, { taskId: "t2", courseId: "nope", title: "Lab", nextStep: "Go" }).ok,
    ).toBe(false);
  });

  it("validate colours and exam dates", async () => {
    const { engine } = await setup();
    const base = { courseId: "c2", name: "Stats", color: "#2A9D8F" };
    expect(createCourse(engine.state, { ...base, color: "red" }).ok).toBe(false);
    expect(createCourse(engine.state, { ...base, examDate: "2026-02-30" }).ok).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2027-02-29")).toBe(false);
  });

  it("can be edited, finished, reopened and archived", async () => {
    const { engine, run } = await setup();
    await run((s) => updateCourse(s, "la", { examDate: null, name: "Lin Alg" }));
    expect(engine.state.courses.get("la")).toMatchObject({ name: "Lin Alg", examDate: null });
    await run((s) => updateTask(s, "t1", { nextStep: "Solve 4.13" }));
    expect(updateTask(engine.state, "t1", { nextStep: "Solve 4.13" }).ok).toBe(false);
    await run((s) => completeTask(s, "t1"));
    expect(openTasks(engine.state)).toHaveLength(0);
    await run((s) => reopenTask(s, "t1"));
    expect(openTasks(engine.state)).toHaveLength(1);
    await run((s) => archiveCourse(s, "la"));
    expect(openTasks(engine.state)).toHaveLength(0);
    expect(
      createTask(engine.state, { taskId: "t9", courseId: "la", title: "x", nextStep: "y" }).ok,
    ).toBe(false);
  });

  it("count down to the exam in whole local days", () => {
    expect(daysUntil("2026-11-26", MORNING)).toBe(23);
    expect(daysUntil("2026-11-03", new Date(2026, 10, 3, 23, 59).getTime())).toBe(0);
    expect(daysUntil("2026-11-01", MORNING)).toBe(-2);
  });
});

describe("planned sessions", () => {
  it("make a start on time and carry their task", async () => {
    const { engine, run, at } = await setup();
    await run((s) =>
      planSession(s, { planId: "p1", startAt: new Date(at(9)), minutes: 25, taskId: "t1" }),
    );
    at(8, 55);
    const plan = planToStartNow(engine.state, at(8, 55), defaultContext.rewards);
    expect(plan?.id).toBe("p1");
    await run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25, planId: "p1" }));
    expect(engine.state.active).toMatchObject({ planId: "p1", taskId: "t1", courseId: "la" });
    expect(plansOn(engine.state, "2026-11-03", MORNING)[0]?.status).toBe("running");
    at(9, 20);
    await run((s) => completeSession(s));
    const record = engine.state.sessions.get("s1");
    expect(record?.score.onTime).toBe(true);
    expect(record).toMatchObject({ planId: "p1", courseId: "la", taskId: "t1" });
    expect(plansOn(engine.state, "2026-11-03", at(9, 30))[0]?.status).toBe("done");
    expect(
      startSession(engine.state, { sessionId: "s2", plannedMinutes: 25, planId: "p1" }).ok,
    ).toBe(false);
  });

  it("open up again when the session is abandoned", async () => {
    const { engine, run, at } = await setup();
    await run((s) => planSession(s, { planId: "p1", startAt: new Date(at(9)), minutes: 25 }));
    await run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25, planId: "p1" }));
    await run(abandonSession);
    expect(engine.state.plans.get("p1")?.sessionId).toBeNull();
    expect(upcomingPlan(engine.state, at(9, 1))?.id).toBe("p1");
  });

  it("show done, next, planned and missed in time order", async () => {
    const { engine, run, at } = await setup();
    for (const [id, hour] of [
      ["late", 13],
      ["early", 8],
      ["mid", 10],
    ] as const) {
      await run((s) => planSession(s, { planId: id, startAt: new Date(at(hour)), minutes: 25 }));
    }
    await run((s) => planSession(s, { planId: "gone", startAt: new Date(at(11)), minutes: 25 }));
    await run((s) => cancelPlan(s, "gone"));
    const views = plansOn(engine.state, "2026-11-03", at(9, 0));
    expect(views.map((v) => [v.plan.id, v.status])).toEqual([
      ["early", "missed"],
      ["mid", "next"],
      ["late", "planned"],
    ]);
    await run((s) => movePlan(s, "early", new Date(at(15))));
    expect(plansOn(engine.state, "2026-11-03", at(9, 0)).map((v) => v.plan.id)).toEqual([
      "mid",
      "late",
      "early",
    ]);
    expect(planToStartNow(engine.state, at(9, 0), defaultContext.rewards)).toBeNull();
    expect(planToStartNow(engine.state, at(9, 51), defaultContext.rewards)?.id).toBe("mid");
  });

  it("remind before the start and nudge once, at most three times a day", async () => {
    const { engine, run, at } = await setup();
    for (const hour of [9, 10, 11, 12]) {
      await run((s) =>
        planSession(s, { planId: `p${hour}`, startAt: new Date(at(hour)), minutes: 25 }),
      );
    }
    const reminders = upcomingReminders(engine.state, at(8));
    expect(reminders.filter((r) => r.kind === "soon")).toHaveLength(4);
    expect(reminders.filter((r) => r.kind === "late").map((r) => r.plan.id)).toEqual([
      "p9",
      "p10",
      "p11",
    ]);
    expect(reminders[0]).toMatchObject({ id: "p9:soon", at: at(8, 58) });
    // Past reminders are not repeated, and the daily limit still counts them.
    expect(upcomingReminders(engine.state, at(11, 30)).map((r) => r.id)).toEqual(["p12:soon"]);
  });
});

describe("stats", () => {
  it("add up focus per day and course and the on-time rate", async () => {
    const { engine, run, at } = await setup();
    await run((s) =>
      planSession(s, { planId: "p1", startAt: new Date(at(9)), minutes: 25, taskId: "t1" }),
    );
    at(9, 12);
    await run((s) => startSession(s, { sessionId: "late", plannedMinutes: 25, planId: "p1" }));
    at(9, 37);
    await run((s) => completeSession(s, { distractions: 2 }));
    await run((s) => rateSession(s, "late", 3));
    await run((s) => startSession(s, { sessionId: "free", plannedMinutes: 25 }));
    at(10, 2);
    await run((s) => completeSession(s));
    await run((s) => rateSession(s, "free", 5));

    const stats = computeStats(engine.state, { now: at(18) });
    expect(stats).toMatchObject({
      sessions: 2,
      totalMinutes: 50,
      todayMinutes: 50,
      plannedStarts: 1,
      onTimeStarts: 0,
      onTimeRate: 0,
      averageDistractions: 1,
      distractionFreeRate: 0.5,
      averageRating: 4,
    });
    expect(stats.days).toHaveLength(7);
    expect(stats.days.at(-1)).toEqual({ day: "2026-11-03", minutes: 50, sessions: 2 });
    expect(stats.byCourse).toEqual([
      { courseId: "la", minutes: 25, sessions: 1 },
      { courseId: null, minutes: 25, sessions: 1 },
    ]);
    expect(rateSession(engine.state, "free", 6).ok).toBe(false);
  });

  it("list the last days across a daylight saving change", () => {
    // Europe moves its clocks back on 25 October 2026.
    expect(lastDays(new Date(2026, 9, 27, 0, 30).getTime(), 4)).toEqual([
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
  });
});
