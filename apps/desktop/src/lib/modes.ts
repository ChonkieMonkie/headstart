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

// The names of the work modes, as shown everywhere.

import type { WorkMode } from "@headstart/core";

export const MODE_LABELS: Record<WorkMode, { name: string; hint: string }> = {
  test: { name: "Test myself", hint: "Problems or old exams without the book" },
  mixed: { name: "Mixed practice", hint: "Different kinds of problems, shuffled" },
  explain: { name: "Explain", hint: "Teach it out loud or in your own words" },
  read: { name: "Read", hint: "New material from the book or notes" },
};
