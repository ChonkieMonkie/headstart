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

// Spaced reviews of recall notes. Every saved note comes back on day 1, 3, 7,
// 14 and 30 after its session. Remembered moves it a step on; Forgot moves it
// one step back (never all the way to the start) and brings it back the next
// day. Everything here is derived from `recall.written` and `review.completed`,
// so the schedule can be tuned later and simply recomputed.

import type { CoreContext, Course, ProgressState, SessionRecord } from "./state.ts";
import { localDayKey } from "./state.ts";

/** Days after the session each review falls on, if every review is remembered on time. */
export const REVIEW_DAYS = [1, 3, 7, 14, 30] as const;
/** The step a note reaches after its last review: it is learned. */
export const LEARNED_STEP = REVIEW_DAYS.length;
/** Today shows at most this many reviews; the rest wait for the next days. */
export const MAX_REVIEWS_A_DAY = 10;
/** Learned notes of a course come back once in this many days before its exam. */
export const EXAM_REVIEW_DAYS = 7;

export interface ReviewEntry {
  at: number;
  day: string;
  remembered: boolean;
  /** A review of a learned note in the week before the exam. */
  exam: boolean;
  /** It was due when it was done, so it earned its XP. */
  due: boolean;
}

/** The review schedule of one session's recall note. */
export interface ReviewRecord {
  sessionId: string;
  courseId: string | null;
  taskId: string | null;
  /** Local day the session ended. */
  sessionDay: string;
  /** The next review, 0 to 4, or LEARNED_STEP. */
  step: number;
  /** Local day the next review is due, or null when learned. */
  dueDay: string | null;
  reviews: ReviewEntry[];
}

export type NoteStatus = "new" | "review" | "learned";

export interface DueReview {
  record: ReviewRecord;
  session: SessionRecord;
  kind: "step" | "exam";
  dueDay: string;
}

/** Midnight UTC of a "YYYY-MM-DD" day, plus some days. */
function utcDay(day: string, plusDays = 0): number {
  const [y = 1970, m = 1, d = 1] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d + plusDays);
}

/** Adds whole days to a "YYYY-MM-DD" day. */
export function addDays(day: string, days: number): string {
  return new Date(utcDay(day, days)).toISOString().slice(0, 10);
}

/** Days from `from` to `to`, both "YYYY-MM-DD". */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcDay(to) - utcDay(from)) / 86_400_000);
}

/** Days between review `step - 1` and review `step`. */
function gapBefore(step: number): number {
  return (REVIEW_DAYS[step] ?? 0) - (REVIEW_DAYS[step - 1] ?? 0);
}

/** Days until the next review if the review at `step` is remembered, or null when that makes the note learned. */
export function daysToNextReview(step: number): number | null {
  return step + 1 >= LEARNED_STEP ? null : gapBefore(step + 1);
}

const dayOf = (at: number, ctx: CoreContext) => (ctx.dayKey ?? localDayKey)(at);

/** Starts the schedule for a session's first saved note. Later notes keep the schedule. */
export function scheduleNote(state: ProgressState, session: SessionRecord, ctx: CoreContext): void {
  if (state.reviews.has(session.sessionId) || !session.recallText?.trim()) return;
  const sessionDay = dayOf(session.endedAt, ctx);
  state.reviews.set(session.sessionId, {
    sessionId: session.sessionId,
    courseId: session.courseId,
    taskId: session.taskId,
    sessionDay,
    step: 0,
    dueDay: addDays(sessionDay, REVIEW_DAYS[0]),
    reviews: [],
  });
}

/** Applies one answered review. A review that was due earns XP; an early one does not. */
export function applyReview(
  state: ProgressState,
  sessionId: string,
  remembered: boolean,
  at: number,
  ctx: CoreContext,
): void {
  const record = state.reviews.get(sessionId);
  if (!record) return;
  const day = dayOf(at, ctx);
  const course = record.courseId ? state.courses.get(record.courseId) : undefined;
  if (stepOn(record, day) >= LEARNED_STEP) {
    const due = examReviewDue(record, course, day);
    record.reviews.push({ at, day, remembered, exam: true, due });
    if (due) state.xp += ctx.rewards.reviewXp;
    if (!remembered) {
      // Forgot just before the exam: back to the last step, tomorrow.
      record.step = LEARNED_STEP - 1;
      record.dueDay = addDays(day, 1);
    } else {
      record.step = LEARNED_STEP;
      record.dueDay = null;
    }
    return;
  }
  const wasDue = record.dueDay !== null && record.dueDay <= day;
  record.reviews.push({ at, day, remembered, exam: false, due: wasDue });
  if (wasDue) state.xp += ctx.rewards.reviewXp;
  if (remembered) {
    record.step += 1;
    record.dueDay = record.step >= LEARNED_STEP ? null : addDays(day, gapBefore(record.step));
  } else {
    record.step = Math.max(0, record.step - 1);
    record.dueDay = addDays(day, 1);
  }
}

/**
 * The step a note is at on a day. Notes saved more than 30 days before they
 * were ever reviewed (written before reviews existed) count as learned, so an
 * old log does not bring every note back at once.
 */
export function stepOn(record: ReviewRecord, today: string): number {
  if (
    record.reviews.length === 0 &&
    daysBetween(record.sessionDay, today) > (REVIEW_DAYS.at(-1) ?? 30)
  ) {
    return LEARNED_STEP;
  }
  return record.step;
}

export function noteStatus(record: ReviewRecord, today: string): NoteStatus {
  if (stepOn(record, today) >= LEARNED_STEP) return "learned";
  return record.reviews.length === 0 ? "new" : "review";
}

/** True when a learned note should come back once before its course's exam. */
export function examReviewDue(
  record: ReviewRecord,
  course: Course | undefined,
  today: string,
): boolean {
  if (!course?.examDate || stepOn(record, today) < LEARNED_STEP) return false;
  const left = daysBetween(today, course.examDate);
  if (left < 0 || left > EXAM_REVIEW_DAYS) return false;
  const exam = course.examDate;
  const weekStart = addDays(exam, -EXAM_REVIEW_DAYS);
  return !record.reviews.some((r) => r.day >= weekStart && r.day <= exam);
}

/** Every review due today or earlier, soonest exam first, then the oldest. */
export function dueReviews(state: ProgressState, today: string): DueReview[] {
  const due: DueReview[] = [];
  for (const record of state.reviews.values()) {
    const session = state.sessions.get(record.sessionId);
    if (!session?.recallText?.trim()) continue;
    const course = record.courseId ? state.courses.get(record.courseId) : undefined;
    if (course?.archived) continue;
    if (stepOn(record, today) >= LEARNED_STEP) {
      if (examReviewDue(record, course, today)) {
        due.push({ record, session, kind: "exam", dueDay: today });
      }
    } else if (record.dueDay !== null && record.dueDay <= today) {
      due.push({ record, session, kind: "step", dueDay: record.dueDay });
    }
  }
  const examOf = (r: DueReview) => {
    const course = r.record.courseId ? state.courses.get(r.record.courseId) : undefined;
    return course?.examDate && course.examDate >= today ? course.examDate : "9999-12-31";
  };
  return due.sort(
    (a, b) =>
      examOf(a).localeCompare(examOf(b)) ||
      a.dueDay.localeCompare(b.dueDay) ||
      a.session.endedAt - b.session.endedAt,
  );
}

/** The reviews shown today: at most MAX_REVIEWS_A_DAY. */
export function reviewsForToday(state: ProgressState, today: string): DueReview[] {
  return dueReviews(state, today).slice(0, MAX_REVIEWS_A_DAY);
}

/** How many reviews fall on each of the next days (not counting what is due today). */
export function reviewForecast(
  state: ProgressState,
  today: string,
  days: number,
): { day: string; count: number }[] {
  const out = Array.from({ length: days }, (_, i) => ({ day: addDays(today, i + 1), count: 0 }));
  for (const record of state.reviews.values()) {
    if (record.dueDay === null || stepOn(record, today) >= LEARNED_STEP) continue;
    const slot = out.find((d) => d.day === record.dueDay);
    if (slot) slot.count += 1;
  }
  return out;
}

/**
 * Reviews of a course's notes still to come before its exam, if every one is
 * remembered on time: the remaining steps that fall before the exam, plus the
 * exam-week review of learned notes.
 */
export function reviewsLeftBeforeExam(
  state: ProgressState,
  courseId: string,
  today: string,
): number {
  const course = state.courses.get(courseId);
  if (!course?.examDate || course.examDate < today) return 0;
  const exam = course.examDate;
  let left = 0;
  for (const record of state.reviews.values()) {
    if (record.courseId !== courseId || !state.sessions.get(record.sessionId)?.recallText?.trim())
      continue;
    let step = stepOn(record, today);
    let due = record.dueDay && record.dueDay > today ? record.dueDay : today;
    while (step < LEARNED_STEP && due <= exam) {
      left += 1;
      step += 1;
      if (step < LEARNED_STEP) due = addDays(due, gapBefore(step));
    }
    if (step >= LEARNED_STEP) {
      const weekStart = addDays(exam, -EXAM_REVIEW_DAYS);
      const done = record.reviews.some((r) => r.day >= weekStart && r.day <= exam);
      if (!done) left += 1;
    }
  }
  return left;
}

/** The to-dos ticked off in a session: what it covered. */
export function sessionCovered(state: ProgressState, sessionId: string): string[] {
  const session = state.sessions.get(sessionId);
  if (!session) return [];
  const texts: string[] = [];
  for (const id of session.todoIds) {
    const todo = state.todos.get(id);
    if (todo?.done && todo.doneInSessionId === sessionId) texts.push(todo.text);
  }
  return texts;
}

/** Ideas for "A question for future you", made from what the session covered. */
export function questionIdeas(state: ProgressState, sessionId: string): string[] {
  const covered = sessionCovered(state, sessionId);
  const ideas = covered.slice(0, 2).map((text) => `What was the key step in "${clean(text)}"?`);
  if (ideas.length === 0) {
    const session = state.sessions.get(sessionId);
    const task = session?.taskId ? state.tasks.get(session.taskId) : undefined;
    if (task) ideas.push(`What is the main idea of "${clean(task.title)}"?`);
  }
  return ideas;
}

/** Text without end punctuation, so it fits inside a question. */
function clean(text: string): string {
  return text.trim().replace(/[.?!:;,]+$/, "");
}
