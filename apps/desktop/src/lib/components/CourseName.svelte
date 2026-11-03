<!--
  Headstart, a study companion that helps you get started, stay focused and keep going.
  Copyright (C) 2026  ChonkieMonkie

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

<!-- A course as it is shown everywhere: colour dot, course code as a small tag, then the name. -->
<script lang="ts">
  import type { Course } from "@headstart/core";

  let {
    course,
    dot = true,
    short = false,
  }: {
    course: Pick<Course, "name" | "code" | "color">;
    dot?: boolean;
    /** Only the code (with the name as a tooltip) when there is one. For tight spaces. */
    short?: boolean;
  } = $props();
</script>

<span class="course" title={short && course.code ? course.name : undefined}>
  {#if dot}<span class="dot" style:background={course.color} aria-hidden="true"></span>{/if}
  {#if course.code}<span class="code">{course.code}</span>{/if}
  {#if !short || !course.code}<span class="name">{course.name}</span>{/if}
</span>

<style>
  .course {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    vertical-align: middle;
  }

  .dot {
    width: 0.7em;
    height: 0.7em;
    min-width: 9px;
    min-height: 9px;
    flex: none;
    border-radius: 999px;
  }

  .code {
    flex: none;
    padding: 0.1em 0.45em;
    border-radius: 6px;
    background: color-mix(in srgb, currentColor 10%, transparent);
    font-size: 0.72em;
    font-weight: 800;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
  }

  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
