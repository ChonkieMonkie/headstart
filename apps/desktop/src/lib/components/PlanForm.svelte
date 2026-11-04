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

<!-- Plans a session for a task (or just a course) at a set time, and which to-dos it is for. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { localDayKey, planSession } from "@headstart/core";
  import { fromInputs, toTimeInput } from "$lib/format.ts";
  import { taskGroups } from "$lib/options.ts";
  import { dragRow, type Drop, KeyboardMove } from "$lib/reorder.svelte.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import DatePicker from "./DatePicker.svelte";
  import DragHandle from "./DragHandle.svelte";
  import Select from "./Select.svelte";

  let {
    study,
    taskId = "",
    courseId = "",
    todoIds = [],
    onDone,
  }: {
    study: Study;
    /** Start with this task chosen. */
    taskId?: string;
    /** Or with this course chosen (when there is no task). */
    courseId?: string;
    /** To-dos ticked from the start. */
    todoIds?: string[];
    onDone: () => void;
  } = $props();

  const LENGTHS = [5, 15, 25, 30, 45, 50, 60, 90];
  const HALF_HOUR = 30 * 60_000;
  // Default to the next half hour that is at least ten minutes away.
  const soon = Math.ceil((Date.now() + 10 * 60_000) / HALF_HOUR) * HALF_HOUR;

  // "task:<id>" or "course:<id>" or "" for a session without a course.
  const initial = untrack(() => ({ taskId, courseId, todoIds }));
  let target = $state(initial.taskId ? `task:${initial.taskId}` : initial.courseId ? `course:${initial.courseId}` : "");
  let day = $state(localDayKey(soon));
  let time = $state(toTimeInput(soon));
  let minutes = $state(25);
  let error = $state<string | null>(null);
  let chosen = $state(new Set<string>(initial.todoIds));

  const picked = $derived.by(() => {
    const [kind, id] = target.split(":");
    if (kind === "task" && id) {
      const task = study.task(id);
      return task ? { courseId: task.courseId, taskId: id } : null;
    }
    return kind === "course" && id ? { courseId: id, taskId: null } : null;
  });
  // The task's to-dos first, then the rest of the course.
  const todos = $derived.by(() => {
    if (!picked) return [];
    const all = study.todosOf(picked.courseId).filter((t) => t.planId === null);
    return picked.taskId ? [...all.filter((t) => t.taskId === picked.taskId), ...all.filter((t) => t.taskId !== picked.taskId)] : all;
  });

  // Dragging sets the order the to-dos are done in, in every list.
  async function drop({ id, after, before }: Drop): Promise<void> {
    error = await study.moveTodo(id, { after, before });
  }
  const keys = new KeyboardMove(drop, (id) => todos.find((t) => t.id === id)?.text ?? "To-do");

  function choose(id: string, on: boolean): void {
    const next = new Set(chosen);
    if (on) next.add(id);
    else next.delete(id);
    chosen = next;
  }

  async function submit(): Promise<void> {
    const [kind, id] = target.split(":");
    const planId = study.newId();
    const result = await study.run((s) =>
      planSession(s, {
        planId,
        startAt: new Date(fromInputs(day, time)),
        minutes,
        ...(kind === "task" && id ? { taskId: id } : {}),
        ...(kind === "course" && id ? { courseId: id } : {}),
      }),
    );
    if (!result.ok) {
      error = result.reason;
      return;
    }
    for (const todo of todos) {
      if (chosen.has(todo.id)) await study.assignTodo(todo.id, { planId });
    }
    onDone();
  }
</script>

<form
  class="plan-form"
  onsubmit={(event) => {
    event.preventDefault();
    submit();
  }}
>
  <div class="wide field">
    <span>What</span>
    <Select bind:value={target} groups={taskGroups(study, { none: "Free session, no course", courses: true })} label="What" onchange={() => (chosen = new Set())} />
  </div>
  <div class="field">
    <span>Day</span>
    <DatePicker bind:value={day} label="Day" min={localDayKey(Date.now())} quick={[{ label: "Today", days: 0 }, { label: "Tomorrow", days: 1 }]} />
  </div>
  <label>
    <span>Start</span>
    <input type="time" bind:value={time} required />
  </label>
  <div class="field">
    <span>Length</span>
    <Select bind:value={minutes} groups={[{ label: "", options: LENGTHS.map((m) => ({ value: m, label: `${m} min` })) }]} label="Length" />
  </div>
  {#if todos.length > 0}
    <fieldset class="wide todos">
      <legend>To-dos for this session (optional)</legend>
      <ul class="rows" data-reorder="plan-form">
        {#each todos as todo (todo.id)}
          <li data-reorder-id={todo.id}>
            <DragHandle
              label={todo.text}
              held={keys.held?.id === todo.id}
              onpointerdown={(e) => dragRow(e, drop)}
              onkeydown={(e) => {
                if (keys.key(e, todos.map((t) => t.id), todo.id)) e.preventDefault();
              }}
            />
            <label class="check">
              <input type="checkbox" checked={chosen.has(todo.id)} onchange={(e) => choose(todo.id, e.currentTarget.checked)} />
              {todo.text}
              {#if todo.taskId && todo.taskId !== picked?.taskId}<span class="muted">{study.task(todo.taskId)?.title}</span>{/if}
            </label>
          </li>
        {/each}
      </ul>
      <p class="reorder-live" aria-live="polite">{keys.message}</p>
    </fieldset>
  {/if}
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

  label,
  .field,
  legend {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  input:not([type="checkbox"]) {
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

  .todos {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rows li {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  label.check {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 700;
    color: var(--hs-ink);
  }

  .check input {
    width: 18px;
    height: 18px;
    accent-color: var(--hs-accent);
  }

  .muted {
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-ink-subtle);
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
  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
