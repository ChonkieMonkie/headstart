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

// Statistics computed from the projected state: focus time, on-time starts
// and distractions. Nothing is stored; every number is derived.

import { localDayKey, type ProgressState, type SessionRecord } from "./state.ts";

export interface DayFocus {
  day: string;
  minutes: number;
  sessions: number;
}

export interface CourseFocus {
  courseId: string | null;
  minutes: number;
  sessions: number;
}

export interface StudyStats {
  sessions: number;
  totalMinutes: number;
  todayMinutes: number;
  todaySessions: number;
  /** The last `days` days, oldest first, today last. */
  days: DayFocus[];
  /** Sessions that had a planned start. */
  plannedStarts: number;
  onTimeStarts: number;
  /** Share of planned starts that were on time, or null with none planned. */
  onTimeRate: number | null;
  onTimeStreak: number;
  bestOnTimeStreak: number;
  averageDistractions: number | null;
  /** Share of crate-length sessions without distractions. */
  distractionFreeRate: number | null;
  averageRating: number | null;
  /** Focus per course, most first. Sessions without a course have courseId null. */
  byCourse: CourseFocus[];
}

export interface StatsOptions {
  now: number;
  days?: number;
  dayKey?: (ms: number) => string;
}

/** The keys of the last `count` local days, oldest first. Safe across DST changes. */
export function lastDays(now: number, count: number, dayKey = localDayKey): string[] {
  const days: string[] = [];
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    days.unshift(dayKey(cursor.getTime()));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

const average = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length;

export function computeStats(state: ProgressState, options: StatsOptions): StudyStats {
  const dayKey = options.dayKey ?? localDayKey;
  const dayKeys = lastDays(options.now, options.days ?? 7, dayKey);
  const today = dayKey(options.now);
  const perDay = new Map(dayKeys.map((day) => [day, { day, minutes: 0, sessions: 0 }]));
  const perCourse = new Map<string | null, CourseFocus>();
  const records = [...state.sessions.values()];

  let totalMinutes = 0;
  let plannedStarts = 0;
  let onTimeStarts = 0;
  for (const record of records) {
    const minutes = record.score.focusMinutes;
    totalMinutes += minutes;
    const day = perDay.get(dayKey(record.startedAt));
    if (day) {
      day.minutes += minutes;
      day.sessions += 1;
    }
    const course = perCourse.get(record.courseId) ?? {
      courseId: record.courseId,
      minutes: 0,
      sessions: 0,
    };
    course.minutes += minutes;
    course.sessions += 1;
    perCourse.set(record.courseId, course);
    if (record.score.onTime !== null) {
      plannedStarts += 1;
      if (record.score.onTime) onTimeStarts += 1;
    }
  }

  const qualifying = records.filter((r: SessionRecord) => r.score.qualifies);
  const todayStats = perDay.get(today);
  return {
    sessions: records.length,
    totalMinutes,
    todayMinutes: todayStats?.minutes ?? 0,
    todaySessions: todayStats?.sessions ?? 0,
    days: dayKeys.map((day) => perDay.get(day) ?? { day, minutes: 0, sessions: 0 }),
    plannedStarts,
    onTimeStarts,
    onTimeRate: plannedStarts === 0 ? null : onTimeStarts / plannedStarts,
    onTimeStreak: state.onTimeStreak,
    bestOnTimeStreak: state.bestOnTimeStreak,
    averageDistractions: average(records.map((r) => r.distractions)),
    distractionFreeRate:
      qualifying.length === 0
        ? null
        : qualifying.filter((r) => r.score.distractionFree).length / qualifying.length,
    averageRating: average(records.flatMap((r) => (r.focusRating === null ? [] : [r.focusRating]))),
    byCourse: [...perCourse.values()].sort((a, b) => b.minutes - a.minutes),
  };
}
