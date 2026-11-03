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

<!-- Plans a session for a task (or just a course) at a set time. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { localDayKey, planSession } from "@headstart/core";
  import { fromInputs, toTimeInput } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let {
    study,
    taskId = "",
    onDone,
  }: { study: Study; taskId?: string; onDone: () => void } = $props();

  const LENGTHS = [5, 15, 25, 30, 45, 50, 60, 90];
  const HALF_HOUR = 30 * 60_000;
  // Default to the next half hour that is at least ten minutes away.
  const soon = Math.ceil((Date.now() + 10 * 60_000) / HALF_HOUR) * HALF_HOUR;

  // "task:<id>" or "course:<id>" or "" for a session without a course.
  const initialTask = untrack(() => taskId);
  let target = $state(initialTask ? `task:${initialTask}` : "");
  let day = $state(localDayKey(soon));
  let time = $state(toTimeInput(soon));
  let minutes = $state(25);
  let error = $state<string | null>(null);

  async function submit(): Promise<void> {
    const [kind, id] = target.split(":");
    const result = await study.run((s) =>
      planSession(s, {
        planId: study.newId(),
        startAt: new Date(fromInputs(day, time)),
        minutes,
        ...(kind === "task" && id ? { taskId: id } : {}),
        ...(kind === "course" && id ? { courseId: id } : {}),
      }),
    );
    if (result.ok) onDone();
    else error = result.reason;
  }
</script>

<form
  class="plan-form"
  onsubmit={(event) => {
    event.preventDefault();
    submit();
  }}
>
  <label class="wide">
    <span>What</span>
    <select bind:value={target}>
      <option value="">Free session, no course</option>
      {#each study.courses as course (course.id)}
        <optgroup label={course.name}>
          <option value="course:{course.id}">{course.name}, no task</option>
          {#each study.tasksOf(course.id).filter((t) => !t.done) as task (task.id)}
            <option value="task:{task.id}">{task.title}</option>
          {/each}
        </optgroup>
      {/each}
    </select>
  </label>
  <label>
    <span>Day</span>
    <input type="date" bind:value={day} required />
  </label>
  <label>
    <span>Start</span>
    <input type="time" bind:value={time} required />
  </label>
  <label>
    <span>Length</span>
    <select bind:value={minutes}>
      {#each LENGTHS as length (length)}
        <option value={length}>{length} min</option>
      {/each}
    </select>
  </label>
  <div class="actions">
    <button type="submit" class="primary">Plan session</button>
    <button type="button" class="secondary" onclick={onDone}>Cancel</button>
  </div>
  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</form>

<style>
  .plan-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 16px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-ground);
  }

  .wide {
    grid-column: 1 / -1;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  input,
  select {
    min-height: 42px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid #c9cfdc;
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
  }

  .actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  button {
    min-height: 42px;
    padding: 0 18px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--hs-accent);
    color: #fff;
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .error {
    grid-column: 1 / -1;
    margin: 0;
    color: #b42318;
    font-weight: 700;
  }

  input:focus-visible,
  select:focus-visible,
  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
