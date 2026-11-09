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

// When the weekly look-ahead is due: at the chosen day and time each week,
// and then on Today until the end of the next day, unless it was done.

import type { Settings } from "@headstart/core";

const DAY = 24 * 60 * 60_000;
const DONE_KEY = "headstart.lookahead.done";

/** The most recent planned moment at or before `now`. */
export function lastLookahead(settings: Settings, now: number): number {
  const [h, m] = settings.lookaheadTime.split(":").map(Number);
  const d = new Date(now);
  d.setHours(h ?? 18, m ?? 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() - settings.lookaheadDay + 7) % 7));
  if (d.getTime() > now) d.setDate(d.getDate() - 7);
  return d.getTime();
}

/** The next planned moment after `now`. */
export function nextLookahead(settings: Settings, now: number): number {
  const last = new Date(lastLookahead(settings, now));
  last.setDate(last.getDate() + 7);
  return last.getTime();
}

function doneAt(): number {
  try {
    return Number(localStorage.getItem(DONE_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function markLookaheadDone(now = Date.now()): void {
  try {
    localStorage.setItem(DONE_KEY, String(now));
  } catch {
    // Without storage the card shows again until the window passes; that is fine.
  }
}

/** True while the card on Today should show: from the moment until the end of the next day. */
export function lookaheadDue(settings: Settings, now: number): boolean {
  if (!settings.weeklyLookahead) return false;
  const last = lastLookahead(settings, now);
  const end = new Date(last + DAY);
  end.setHours(23, 59, 59, 999);
  return now < end.getTime() && doneAt() < last;
}
