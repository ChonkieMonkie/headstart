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

// What the mascot feels and says. Mood follows what is going on (a session,
// a break, a planned session that is due); it never changes the mascot's colours.

import type { Mood } from "@headstart/ui";

export interface MoodInput {
  focusing: boolean;
  paused: boolean;
  onBreak: boolean;
  justFinished: boolean;
  /** A planned session is due now or was missed earlier today. */
  sessionDue: boolean;
  studiedToday: boolean;
  /** Local hour, 0 to 23. */
  hour: number;
}

export function mascotMood(input: MoodInput): Mood {
  if (input.justFinished) return "celebrate";
  if (input.focusing) return input.paused ? "idle" : "focus";
  if (input.onBreak) return "break";
  if (input.sessionDue) return "nudge";
  if (input.hour >= 23 || input.hour < 5) return "sleepy";
  if (!input.studiedToday) return "welcome";
  return "idle";
}

export interface LineInput {
  mood: Mood;
  name: string;
  /** What is up next or due, such as a task title or course name. */
  next: string | null;
  nextTime: string | null;
}

/** One friendly sentence for a speech bubble. */
export function mascotLine({ mood, name, next, nextTime }: LineInput): string {
  switch (mood) {
    case "welcome":
      return next ? `Hi! ${next} is up first today.` : "Hi! Ready for a session today?";
    case "nudge":
      return next
        ? `${next} was planned${nextTime ? ` for ${nextTime}` : ""}. How about just 5 minutes?`
        : "How about just 5 minutes? You can stop after that.";
    case "sleepy":
      return "It is late. A short review, then sleep?";
    case "break":
      return "Nice work. Stretch, drink some water.";
    case "focus":
      return `${name} is focusing with you.`;
    case "celebrate":
      return "You did it!";
    default:
      return next ? `Ready when you are. ${next} is up next.` : "Ready when you are.";
  }
}
