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
  completeReview,
  completeSession,
  completeTodo,
  createCourse,
  createTask,
  setSessionMode,
  startSession,
  writeRecall,
} from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import {
  addDays,
  daysBetween,
  dueReviews,
  LEARNED_STEP,
  MAX_REVIEWS_A_DAY,
  noteStatus,
  questionIdeas,
  reviewForecast,
  reviewsForToday,
  reviewsLeftBeforeExam,
  sessionCovered,
} from "./reviews.ts";
import { localDayKey } from "./state.ts";
import { MemoryEventStore } from "./store.ts";

const MINUTE = 60_000;
const DAY = 86_400_000;
/** Monday 9 November 2026, 09:00 local time. */
const MONDAY = new Date(2026, 10, 9, 9, 0).getTime();

async function setup() {
  let now = MONDAY;
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
  await run((s) =>
    createTask(s, {
      taskId: "eig",
      courseId: "la",
      title: "Eigenvalues, chapter 5",
      nextStep: "Redo problem 5.7 d",
    }),
  );
  let n = 0;
  /** A finished 25-minute session on the eigenvalue task with a note. */
  const studyWithNote = async (
    text = "Eigenvalues come from det(A - λI) = 0, then solve for v.",
  ) => {
    const sessionId = `s${++n}`;
    await run((s) =>
      startSession(s, { sessionId, plannedMinutes: 25, taskId: "eig", mode: "test" }),
    );
    now += 25 * MINUTE;
    await run((s) => completeSession(s));
    await run((s) => writeRecall(s, sessionId, text, "  Why could 5.7 d skip the determinant?  "));
    return sessionId;
  };
  const at = (ms: number) => {
    now = ms;
  };
  const today = () => localDayKey(now);
  return { engine, run, studyWithNote, at, today, advanceDays: (d: number) => (now += d * DAY) };
}

describe("day helpers", () => {
  it("adds days across months and counts the days between", () => {
    expect(addDays("2026-11-29", 3)).toBe("2026-12-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-11-09", "2026-12-02")).toBe(23);
  });
});

describe("the review schedule", () => {
  it("starts a schedule on the first note, due the next day", async () => {
    const { engine, studyWithNote } = await setup();
    const id = await studyWithNote();
    const record = engine.state.reviews.get(id);
    expect(record?.sessionDay).toBe("2026-11-09");
    expect(record?.dueDay).toBe("2026-11-10");
    expect(record?.step).toBe(0);
    expect(engine.state.sessions.get(id)?.recallQuestion).toBe(
      "Why could 5.7 d skip the determinant?",
    );
    expect(engine.state.sessions.get(id)?.mode).toBe("test");
  });

  it("follows day 1, 3, 7, 14 and 30 when every review is remembered on time", async () => {
    const { engine, run, studyWithNote, at } = await setup();
    const id = await studyWithNote();
    const dues: string[] = [];
    for (const day of [1, 3, 7, 14, 30]) {
      at(MONDAY + day * DAY);
      dues.push(engine.state.reviews.get(id)?.dueDay ?? "");
      await run((s) => completeReview(s, id, true));
    }
    expect(dues).toEqual(["2026-11-10", "2026-11-12", "2026-11-16", "2026-11-23", "2026-12-09"]);
    expect(engine.state.reviews.get(id)?.step).toBe(LEARNED_STEP);
    expect(engine.state.reviews.get(id)?.dueDay).toBeNull();
  });

  it("moves one step back on Forgot and brings the note back the next day", async () => {
    const { engine, run, studyWithNote, at, today } = await setup();
    const id = await studyWithNote();
    at(MONDAY + 1 * DAY);
    await run((s) => completeReview(s, id, true)); // step 1, due day 3
    at(MONDAY + 3 * DAY);
    await run((s) => completeReview(s, id, false));
    const record = engine.state.reviews.get(id);
    expect(record?.step).toBe(0);
    expect(record?.dueDay).toBe(addDays(today(), 1));
  });

  it("moves on from the day a late review is done, so nothing piles up", async () => {
    const { engine, run, studyWithNote, at } = await setup();
    const id = await studyWithNote();
    at(MONDAY + 5 * DAY); // day 1 review done four days late
    await run((s) => completeReview(s, id, true));
    expect(engine.state.reviews.get(id)?.dueDay).toBe("2026-11-16"); // two days later
  });

  it("gives XP only for a review that was due", async () => {
    const { engine, run, studyWithNote, at } = await setup();
    const id = await studyWithNote();
    const before = engine.state.xp;
    await run((s) => completeReview(s, id, true)); // early: same day as the session
    expect(engine.state.xp).toBe(before);
    at(MONDAY + 3 * DAY);
    await run((s) => completeReview(s, id, true)); // due on day 3
    expect(engine.state.xp).toBe(before + defaultContext.rewards.reviewXp);
  });

  it("keeps the schedule when the note is edited", async () => {
    const { engine, run, studyWithNote, at } = await setup();
    const id = await studyWithNote();
    at(MONDAY + 1 * DAY);
    await run((s) => completeReview(s, id, true));
    await run((s) => writeRecall(s, id, "A clearer note about eigenvalues and the trace."));
    expect(engine.state.reviews.get(id)?.step).toBe(1);
    expect(engine.state.sessions.get(id)?.recallQuestion).toBeNull();
  });
});

describe("what is due", () => {
  it("lists due notes, caps today at the daily limit and forecasts the next days", async () => {
    const { engine, studyWithNote, at, today } = await setup();
    for (let i = 0; i < MAX_REVIEWS_A_DAY + 2; i++) await studyWithNote();
    at(MONDAY + DAY);
    expect(dueReviews(engine.state, today())).toHaveLength(MAX_REVIEWS_A_DAY + 2);
    expect(reviewsForToday(engine.state, today())).toHaveLength(MAX_REVIEWS_A_DAY);
    at(MONDAY);
    expect(reviewForecast(engine.state, today(), 3)[0]).toEqual({
      day: "2026-11-10",
      count: MAX_REVIEWS_A_DAY + 2,
    });
  });

  it("treats notes written over 30 days before their first review as learned", async () => {
    const { engine, studyWithNote, at, today } = await setup();
    const id = await studyWithNote();
    at(MONDAY + 40 * DAY);
    const record = engine.state.reviews.get(id);
    expect(record && noteStatus(record, today())).toBe("learned");
    expect(dueReviews(engine.state, today())).toHaveLength(0);
  });

  it("brings learned notes back once in the week before the exam", async () => {
    const { engine, run, studyWithNote, at, today } = await setup();
    const id = await studyWithNote();
    for (const day of [1, 3, 7, 14]) {
      at(MONDAY + day * DAY);
      await run((s) => completeReview(s, id, true));
    }
    // Not learned yet on 26 Nov (day 30 is 9 Dec, after the exam): a step review is due then.
    at(new Date(2026, 10, 30, 9).getTime());
    expect(dueReviews(engine.state, today())).toHaveLength(0);
    // Pretend it was learned: answer the last step early, then it comes back before the exam.
    await run((s) => completeReview(s, id, true));
    expect(engine.state.reviews.get(id)?.step).toBe(LEARNED_STEP);
    expect(dueReviews(engine.state, today())).toHaveLength(0); // reviewed this week already
  });

  it("counts the reviews left before the exam", async () => {
    const { engine, studyWithNote, today } = await setup();
    await studyWithNote();
    // Days 1, 3, 7 and 14 fall before 2 December; day 30 does not.
    expect(reviewsLeftBeforeExam(engine.state, "la", today())).toBe(4);
  });
});

describe("work modes and question ideas", () => {
  it("changes the mode during and after a session", async () => {
    const { engine, run, studyWithNote } = await setup();
    const id = await studyWithNote();
    await run((s) => setSessionMode(s, id, "explain"));
    expect(engine.state.sessions.get(id)?.mode).toBe("explain");
    await run((s) => setSessionMode(s, id, null));
    expect(engine.state.sessions.get(id)?.mode).toBeNull();
    expect(setSessionMode(engine.state, id, "nap" as never).ok).toBe(false);
  });

  it("suggests questions from the to-dos ticked off in the session", async () => {
    const { engine, run } = await setup();
    await run((s) => startSession(s, { sessionId: "q", plannedMinutes: 25, taskId: "eig" }));
    await run((s) => completeTodo(s, "eig:first", "q"));
    await run((s) => completeSession(s));
    expect(sessionCovered(engine.state, "q")).toEqual(["Redo problem 5.7 d"]);
    expect(questionIdeas(engine.state, "q")).toEqual([
      'What was the key step in "Redo problem 5.7 d"?',
    ]);
  });
});
