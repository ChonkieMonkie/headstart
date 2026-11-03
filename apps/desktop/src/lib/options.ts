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

// Options for the dropdowns that pick a task or a course.

import type { Course } from "@headstart/core";
import type { SelectGroup } from "./components/Select.svelte";
import type { Study } from "./study.svelte.ts";

/** "MA1041 · Calculus 1", or the name alone. */
export function courseLabel(course: Pick<Course, "name" | "code">): string {
  return course.code ? `${course.code} · ${course.name}` : course.name;
}

/**
 * Open tasks grouped by course. Values are "task:<id>", "course:<id>" (when
 * `courses` is set) or "" for the `none` option.
 */
export function taskGroups(
  study: Study,
  options: { none: string; courses?: boolean },
): SelectGroup<string>[] {
  const groups: SelectGroup<string>[] = [
    { label: "", options: [{ value: "", label: options.none }] },
  ];
  for (const course of study.courses) {
    const tasks = study.tasksOf(course.id).filter((t) => !t.done);
    const items = tasks.map((t) => ({ value: `task:${t.id}`, label: t.title }));
    if (options.courses)
      items.unshift({ value: `course:${course.id}`, label: "Whole course, no task" });
    if (items.length === 0) continue;
    groups.push({ label: course.name, tag: course.code, color: course.color, options: items });
  }
  return groups;
}
