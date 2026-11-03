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

// Formatting shared by the screens. The app is in English with 24-hour times.

const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

/** "09:00" */
export const clockTime = (ms: number) => time.format(ms);

/** "Tue 3 Nov" */
export const shortDate = (ms: number) => dayMonth.format(ms);

/** "Tue" for a "YYYY-MM-DD" day key. */
export function weekdayOf(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return weekday.format(new Date(y ?? 0, (m ?? 1) - 1, d ?? 1));
}

/** "1 session", "3 sessions" */
export const plural = (n: number, word: string, many = `${word}s`) =>
  `${n} ${n === 1 ? word : many}`;

/** "Exam today", "Exam in 23 days" */
export function examLabel(days: number): string {
  if (days < 0) return "Exam passed";
  if (days === 0) return "Exam today";
  if (days === 1) return "Exam tomorrow";
  return `Exam in ${days} days`;
}

/** "HH:MM" for an <input type="time"> from epoch ms, local time. */
export function toTimeInput(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Epoch ms from a "YYYY-MM-DD" day and an "HH:MM" time, local time. */
export function fromInputs(day: string, clock: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const [h, min] = clock.split(":").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0).getTime();
}
