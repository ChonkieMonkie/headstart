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
  addCalendar,
  cleanCalendarUrl,
  completeSession,
  createCourse,
  createTask,
  planSession,
  removeCalendar,
  startSession,
  updatePlan,
  updateTask,
} from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import {
  blockEnd,
  blockPlans,
  blockSlots,
  fitSessions,
  groupBlocks,
  plansOn,
  taskProgress,
  tasksToPlan,
  upcomingReminders,
} from "./planner.ts";
import { checkSettings } from "./settings.ts";
import { MemoryEventStore } from "./store.ts";
import { TIMER_PRESETS } from "./timer.ts";

const MINUTE = 60_000;
/** 9 November 2026, 08:00 local time. */
const MORNING = new Date(2026, 10, 9, 8, 0).getTime();

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
      name: "Linear Algebra",
      color: "#255EBC",
      examDate: "2026-12-02",
    }),
  );
  await run((s) => createCourse(s, { courseId: "st", name: "Statistics", color: "#227702" }));
  return {
    engine,
    run,
    setNow: (ms: number) => {
      now = ms;
    },
  };
}

describe("task size and due date", () => {
  it("are optional, checked, and can be changed or removed", async () => {
    const { engine, run } = await setup();
    await run((s) =>
      createTask(s, {
        taskId: "t1",
        courseId: "st",
        title: "Exercises 3.5 to 3.9",
        nextStep: "Do 3.5",
        size: "medium",
        dueDay: "2026-11-12",
      }),
    );
    await run((s) =>
      createTask(s, {
        taskId: "t2",
        courseId: "la",
        title: "Read chapter 4",
        nextStep: "Skim 4.1",
      }),
    );
    expect(engine.state.tasks.get("t1")).toMatchObject({ size: "medium", dueDay: "2026-11-12" });
    expect(engine.state.tasks.get("t2")).toMatchObject({ size: null, dueDay: null });

    expect(
      createTask(engine.state, {
        taskId: "t3",
        courseId: "la",
        title: "X",
        nextStep: "Y",
        dueDay: "2026-02-30",
      }),
    ).toEqual({ ok: false, reason: "Pick a date" });
    await run((s) => updateTask(s, "t2", { size: "small" }));
    await run((s) => updateTask(s, "t1", { dueDay: null }));
    expect(engine.state.tasks.get("t2")?.size).toBe("small");
    expect(engine.state.tasks.get("t1")?.dueDay).toBeNull();
    expect(updateTask(engine.state, "t2", { size: "small" })).toEqual({
      ok: false,
      reason: "Nothing changed",
    });
  });
});

describe("a task's own guess of sessions", () => {
  it("wins over the size, is checked, and can be removed again", async () => {
    const { engine, run } = await setup();
    await run((s) =>
      createTask(s, {
        taskId: "t1",
        courseId: "la",
        title: "Lab report",
        nextStep: "Outline",
        size: "small",
        sessions: 7,
      }),
    );
    expect(taskProgress(engine.state, "t1", Date.now())).toMatchObject({ estimate: 7, left: 7 });
    expect(updateTask(engine.state, "t1", { sessions: 0 })).toEqual({
      ok: false,
      reason: "Sessions must be 1 to 99",
    });
    await run((s) => updateTask(s, "t1", { sessions: null }));
    // Without its own guess, the size counts again.
    expect(taskProgress(engine.state, "t1", Date.now()).estimate).toBe(1);
  });
});

describe("tasks to plan", () => {
  it("count done and planned sessions and leave once everything is planned", async () => {
    const { engine, run, setNow } = await setup();
    await run((s) =>
      createTask(s, {
        taskId: "big",
        courseId: "la",
        title: "Old exam",
        nextStep: "Q1",
        size: "medium",
      }),
    );
    await run((s) =>
      createTask(s, { taskId: "free", courseId: "la", title: "Read chapter 4", nextStep: "4.1" }),
    );
    await run((s) =>
      createTask(s, {
        taskId: "soon",
        courseId: "st",
        title: "Exercises",
        nextStep: "3.5",
        size: "small",
        dueDay: "2026-11-12",
      }),
    );

    // One session done for the big task, one planned for tomorrow.
    await run((s) => startSession(s, { sessionId: "s1", plannedMinutes: 25, taskId: "big" }));
    setNow(MORNING + 26 * MINUTE);
    await run((s) => completeSession(s, { distractions: 0 }));
    await run((s) =>
      planSession(s, {
        planId: "p1",
        startAt: new Date(MORNING + 24 * 60 * MINUTE),
        minutes: 25,
        taskId: "big",
      }),
    );

    expect(taskProgress(engine.state, "big", Date.now())).toEqual({
      done: 1,
      planned: 1,
      estimate: 3,
      left: 1,
    });
    expect(taskProgress(engine.state, "free", Date.now()).left).toBeNull();

    // Soonest date first; the exam date counts when a task has none; no date last.
    const rows = tasksToPlan(engine.state, Date.now());
    expect(rows.map((r) => r.task.id)).toEqual(["soon", "big", "free"]);
    expect(rows[1]).toMatchObject({ due: "2026-12-02", dueIsExam: true });

    // Planning the small task's one session takes it off the list.
    await run((s) =>
      planSession(s, {
        planId: "p2",
        startAt: new Date(MORNING + 26 * 60 * MINUTE),
        minutes: 25,
        taskId: "soon",
      }),
    );
    expect(tasksToPlan(engine.state, Date.now()).map((r) => r.task.id)).toEqual(["big", "free"]);
  });
});

describe("blocks of sessions", () => {
  const classic = TIMER_PRESETS.classic;

  it("fill a dragged stretch with sessions and breaks", () => {
    expect(fitSessions(55, 25, classic)).toEqual({ count: 2, minutes: 25 });
    expect(fitSessions(90, 25, classic)).toEqual({ count: 3, minutes: 25 });
    // Too short for two: one session as long as the stretch.
    expect(fitSessions(40, 25, classic)).toEqual({ count: 1, minutes: 40 });
    expect(fitSessions(12, 25, classic)).toEqual({ count: 1, minutes: 10 });
  });

  it("place the sessions of a block with the right breaks", () => {
    const start = Date.UTC(2026, 10, 10, 13, 0);
    const slots = blockSlots(start, 5, 25, classic);
    const offsets = slots.map((s) => (s.startAt - start) / MINUTE);
    // A long break (15 min) after the fourth session.
    expect(offsets).toEqual([0, 30, 60, 90, 130]);
    expect((blockEnd(slots) - start) / MINUTE).toBe(155);
  });
});

describe("blocks", () => {
  it("group sessions planned together, keep later blocks apart, and remind once", async () => {
    const { engine, run } = await setup();
    await run((s) =>
      createTask(s, { taskId: "t1", courseId: "la", title: "Exercises", nextStep: "4.1" }),
    );
    const at = (h: number, m = 0) => new Date(new Date(MORNING).setHours(h, m));
    for (const [i, start] of [at(13), at(13, 30), at(14), at(14, 30)].entries()) {
      await run((s) =>
        planSession(s, {
          planId: `a${i}`,
          startAt: start,
          minutes: 25,
          taskId: "t1",
          blockId: "A",
        }),
      );
    }
    // A second block with the same task right after stays its own block.
    await run((s) =>
      planSession(s, { planId: "b0", startAt: at(15), minutes: 25, taskId: "t1", blockId: "B" }),
    );
    await run((s) =>
      planSession(s, { planId: "solo", startAt: at(17), minutes: 50, courseId: "la" }),
    );

    const blocks = groupBlocks(plansOn(engine.state, "2026-11-09", Date.now()));
    expect(blocks.map((b) => [b.key, b.views.length])).toEqual([
      ["A", 4],
      ["B", 1],
      ["solo", 1],
    ]);
    expect(
      new Date(blocks[0]?.end ?? 0).getHours() * 60 + new Date(blocks[0]?.end ?? 0).getMinutes(),
    ).toBe(14 * 60 + 55);
    expect(
      blockPlans(engine.state, engine.state.plans.get("a2") as never).map((p) => p.id),
    ).toEqual(["a0", "a1", "a2", "a3"]);

    // Only the first session of block A reminds, not the three after it.
    const soon = upcomingReminders(engine.state, Date.now())
      .filter((r) => r.kind === "soon")
      .map((r) => r.plan.id);
    expect(soon).toEqual(["a0", "b0", "solo"]);
  });
});

describe("planned sessions", () => {
  it("can carry an if-then plan and be changed before they start", async () => {
    const { engine, run } = await setup();
    await run((s) =>
      createTask(s, { taskId: "t1", courseId: "st", title: "Exercises", nextStep: "3.5" }),
    );
    await run((s) =>
      planSession(s, {
        planId: "p1",
        startAt: new Date(MORNING + 60 * MINUTE),
        minutes: 25,
        courseId: "la",
        ifThen: "  If it is 09:00,   then I open 4.12 ",
      }),
    );
    expect(engine.state.plans.get("p1")).toMatchObject({
      ifThen: "If it is 09:00, then I open 4.12",
      courseId: "la",
    });

    // A task of another course moves the plan to that course too.
    await run((s) => updatePlan(s, "p1", { taskId: "t1", minutes: 50, ifThen: "" }));
    expect(engine.state.plans.get("p1")).toMatchObject({
      taskId: "t1",
      courseId: "st",
      minutes: 50,
      ifThen: null,
    });

    // Another course drops a task that no longer fits.
    await run((s) => updatePlan(s, "p1", { courseId: "la" }));
    expect(engine.state.plans.get("p1")).toMatchObject({ taskId: null, courseId: "la" });
    expect(updatePlan(engine.state, "p1", { minutes: 50 })).toEqual({
      ok: false,
      reason: "Nothing changed",
    });
    expect(updatePlan(engine.state, "p1", { minutes: 0 }).ok).toBe(false);
  });
});

describe("calendar links", () => {
  it("must be https (webcal is read as https) and are added once", async () => {
    const { engine, run } = await setup();
    expect(cleanCalendarUrl("webcal://cloud.timeedit.net/x/schedule.ics")).toEqual({
      url: "https://cloud.timeedit.net/x/schedule.ics",
    });
    expect(cleanCalendarUrl("http://example.com/a.ics")).toEqual({
      reason: "The link must start with https://",
    });
    expect(cleanCalendarUrl("not a link")).toEqual({ reason: "That does not look like a link" });

    await run((s) =>
      addCalendar(s, {
        calendarId: "c1",
        name: "TimeEdit",
        url: "https://cloud.timeedit.net/x/schedule.ics",
      }),
    );
    expect(engine.state.calendars.get("c1")).toMatchObject({
      name: "TimeEdit",
      url: "https://cloud.timeedit.net/x/schedule.ics",
    });
    expect(
      addCalendar(engine.state, {
        calendarId: "c2",
        name: "Again",
        url: "webcal://cloud.timeedit.net/x/schedule.ics",
      }),
    ).toEqual({ ok: false, reason: "That link is already added" });
    await run((s) => removeCalendar(s, "c1"));
    expect(engine.state.calendars.size).toBe(0);
  });
});

describe("weekly look-ahead settings", () => {
  it("check days, times and study days", () => {
    expect(checkSettings({ studyDays: 7, restDay: null })).toBeNull();
    expect(checkSettings({ studyDays: 8 })).toBe("Study days must be 1 to 7");
    expect(checkSettings({ lookaheadTime: "24:00" })).toBe("Pick a time");
    expect(checkSettings({ lookaheadDay: 7 })).toBe("Pick a day of the week");
    expect(
      checkSettings({ weeklyLookahead: true, lookaheadDay: 0, lookaheadTime: "18:00" }),
    ).toBeNull();
  });
});
