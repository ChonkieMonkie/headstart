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

<!--
  "To plan": open tasks that still need sessions, soonest due first. Drag one
  into the calendar, set its size, open it to see and add to-dos, or add a new
  task right here.
-->
<script lang="ts">
  import { daysUntil, type TaskSize, type TaskToPlan, tasksToPlan, updateTask } from "@headstart/core";
  import { courseColor } from "@headstart/ui";
  import { examLabel, plural, weekdayOf } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import Select from "../Select.svelte";
  import TaskForm from "../TaskForm.svelte";

  let {
    study,
    compact = false,
    onDragStart,
  }: {
    study: Study;
    /** Smaller cards, for the weekly look-ahead. */
    compact?: boolean;
    /** A task's handle was pressed: the page takes over the drag. */
    onDragStart: (row: TaskToPlan, event: PointerEvent) => void;
  } = $props();

  const rows = $derived.by(() => {
    const state = study.state;
    return state ? tasksToPlan(state, study.now) : [];
  });
  let open = $state<string | null>(null);
  let sizing = $state<string | null>(null);
  let adding = $state(false);
  let newCourse = $state("");
  let todoText = $state("");
  let error = $state<string | null>(null);

  const SIZES: { value: TaskSize; label: string }[] = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  function dueLabel(row: TaskToPlan): string {
    if (!row.due) return "";
    const days = daysUntil(row.due, study.now);
    if (row.dueIsExam) return examLabel(days);
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (days < 7) return `Due ${weekdayOf(row.due)}`;
    return `Due in ${days} days`;
  }

  function meta(row: TaskToPlan): string {
    const p = row.progress;
    if (p.estimate === null) return p.done + p.planned > 0 ? `${p.done} done · ${p.planned} planned` : "Not estimated";
    if (p.done + p.planned === 0) return `About ${plural(p.estimate, "session")}`;
    return `${p.done} done · ${p.planned} planned · about ${p.left} left`;
  }

  let own = $state<number | null>(null);

  function toggleSizer(row: TaskToPlan): void {
    sizing = sizing === row.task.id ? null : row.task.id;
    own = row.task.sessions ?? row.progress.estimate ?? 4;
  }

  async function setSize(row: TaskToPlan, size: TaskSize): Promise<void> {
    await study.run((s) => updateTask(s, row.task.id, { size, sessions: null }));
    sizing = null;
  }

  async function setOwn(row: TaskToPlan): Promise<void> {
    if (!own || own < 1) return;
    const result = await study.run((s) => updateTask(s, row.task.id, { sessions: Math.round(own ?? 1), size: null }));
    if (result.ok || result.reason === "Nothing changed") sizing = null;
    else error = result.reason;
  }

  async function addTodo(row: TaskToPlan): Promise<void> {
    if (!todoText.trim()) return;
    error = await study.addTodo({ courseId: row.course.id, taskId: row.task.id, text: todoText });
    if (!error) todoText = "";
  }

  const courseOptions = $derived([
    { label: "", options: study.courses.map((c) => ({ value: c.id, label: c.name, color: courseColor(c.color) })) },
  ]);
</script>

<div class="to-plan" class:compact>
  {#each rows as row (row.task.id)}
    {@const p = row.progress}
    <div class="card" class:open={open === row.task.id} style="--c: {courseColor(row.course.color)}">
      <div class="main">
        <button type="button" class="grip" aria-label="Drag {row.task.title} into the calendar" onpointerdown={(e) => onDragStart(row, e)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6" cy="4" r="1.2" /><circle cx="10" cy="4" r="1.2" /><circle cx="6" cy="8" r="1.2" /><circle cx="10" cy="8" r="1.2" /><circle cx="6" cy="12" r="1.2" /><circle cx="10" cy="12" r="1.2" /></svg>
        </button>
        <span class="bar" aria-hidden="true"></span>
        <button type="button" class="body" aria-expanded={open === row.task.id} onclick={() => (open = open === row.task.id ? null : row.task.id)}>
          <span class="top">
            <span class="course">{row.course.name}</span>
            {#if row.due}<span class="due" class:soon={!row.dueIsExam}>{dueLabel(row)}</span>{/if}
          </span>
          <span class="title">{row.task.title}</span>
        </button>
      </div>
      {#if !compact}
        <div class="meta">
          {#if p.estimate !== null}
            <button type="button" class="estimate" aria-expanded={sizing === row.task.id} aria-label="{meta(row)}. Change how much work it is" onclick={() => toggleSizer(row)}>
              <span class="pips" aria-hidden="true">
                {#each { length: Math.min(p.done, 12) } as _, i (i)}<span class="pip done"></span>{/each}
                {#each { length: Math.min(p.planned, 12) } as _, i (i)}<span class="pip planned"></span>{/each}
                {#each { length: Math.min(p.left ?? 0, 12) } as _, i (i)}<span class="pip left"></span>{/each}
              </span>
              <span class="meta-text">{meta(row)}</span>
            </button>
          {:else}
            <button type="button" class="set-size" aria-expanded={sizing === row.task.id} onclick={() => toggleSizer(row)}>Set size</button>
            <span class="meta-text">{meta(row)}</span>
          {/if}
        </div>
        {#if sizing === row.task.id}
          <div class="sizer" role="group" aria-label="How much work?">
            <span>How much work?</span>
            <div class="sizes">
              {#each SIZES as s (s.value)}
                <button type="button" aria-pressed={row.task.sessions === null && row.task.size === s.value} onclick={() => setSize(row, s.value)}>{s.label}</button>
              {/each}
            </div>
            <form
              class="own"
              onsubmit={(e) => {
                e.preventDefault();
                setOwn(row);
              }}
            >
              <span>Or your own:</span>
              <input type="number" min="1" max="99" step="1" bind:value={own} aria-label="Sessions it takes" />
              <span>sessions</span>
              <button type="submit">Set</button>
            </form>
          </div>
        {/if}
      {/if}
      {#if open === row.task.id}
        <div class="todos">
          {#each study.todosOf(row.course.id, row.task.id) as todo (todo.id)}
            <label class="todo">
              <input type="checkbox" checked={todo.done} onchange={() => study.toggleTodo(todo)} />
              <span>{todo.text}</span>
            </label>
          {:else}
            <p class="empty">No open to-dos.</p>
          {/each}
          <form
            class="add-todo"
            onsubmit={(e) => {
              e.preventDefault();
              addTodo(row);
            }}
          >
            <input type="text" bind:value={todoText} maxlength="200" placeholder="Add a to-do" aria-label="Add a to-do to {row.task.title}" />
          </form>
          {#if error}<p class="error" role="alert">{error}</p>{/if}
        </div>
      {/if}
    </div>
  {:else}
    <p class="empty">Nothing left to plan. Add a task, or drag over free time to plan without one.</p>
  {/each}

  {#if adding}
    <div class="new-task">
      <div class="field">
        <span>Course</span>
        <Select bind:value={newCourse} groups={courseOptions} label="Course" />
      </div>
      {#if newCourse}
        {#key newCourse}
          <TaskForm {study} courseId={newCourse} onDone={() => (adding = false)} />
        {/key}
      {:else}
        <button type="button" class="secondary" onclick={() => (adding = false)}>Cancel</button>
      {/if}
    </div>
  {:else if study.courses.length > 0}
    <button
      type="button"
      class="new"
      onclick={() => {
        newCourse = study.courses[0]?.id ?? "";
        adding = true;
      }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>New task
    </button>
  {/if}
</div>

<style>
  .to-plan {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 9px 10px 9px 6px;
    border: 1px solid var(--hs-line);
    border-radius: 12px;
    background: var(--hs-surface);
  }

  .card.open {
    border: 2px solid var(--hs-accent);
    padding: 8px 9px 8px 5px;
  }

  .main {
    display: flex;
    align-items: stretch;
    gap: 6px;
  }

  .grip {
    flex: none;
    width: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--hs-ink-disabled);
    cursor: grab;
    touch-action: none;
  }

  .grip:hover {
    background: var(--hs-raised);
  }

  .grip svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  .bar {
    flex: none;
    width: 4px;
    border-radius: 4px;
    background: var(--c);
  }

  .body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    text-align: left;
    color: var(--hs-ink);
    cursor: pointer;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: 12px;
    font-weight: 800;
  }

  .course {
    color: color-mix(in srgb, var(--c) 70%, var(--hs-ink));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .due {
    flex: none;
    color: var(--hs-ink-subtle);
  }

  .due.soon {
    color: var(--hs-warning-strong);
  }

  .title {
    font-size: 14px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .compact .title {
    font-size: 13px;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 38px;
    font-size: 12px;
    font-weight: 600;
    color: var(--hs-ink-subtle);
    min-width: 0;
  }

  .meta-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pips {
    display: inline-flex;
    gap: 3px;
    flex: none;
  }

  .pip {
    width: 14px;
    height: 6px;
    box-sizing: border-box;
    border-radius: 3px;
  }

  .pip.done {
    background: var(--hs-success);
  }

  .pip.planned {
    background: var(--hs-accent);
  }

  .pip.left {
    border: 1.5px solid var(--hs-ink-disabled);
  }

  .estimate {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 2px 4px;
    margin: -2px -4px;
    border: 0;
    border-radius: 6px;
    background: none;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .estimate:hover {
    background: var(--hs-raised);
  }

  .own {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }

  .own input {
    width: 56px;
    min-height: 30px;
    box-sizing: border-box;
    padding: 0 6px;
    border: 1px solid var(--hs-field-line);
    border-radius: 8px;
    background: var(--hs-surface);
    font: inherit;
    color: var(--hs-ink);
  }

  .own button {
    min-height: 30px;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .sizes button[aria-pressed="true"] {
    border: 2px solid var(--hs-accent);
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .set-size {
    flex: none;
    padding: 1px 8px;
    border: 1px dashed var(--hs-ink-disabled);
    border-radius: 999px;
    background: none;
    font: inherit;
    font-weight: 800;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .sizer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-left: 38px;
    padding: 10px;
    border-radius: 10px;
    background: var(--hs-raised);
    font-size: 12.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }


  .sizes {
    display: flex;
    gap: 6px;
  }

  .sizes button {
    flex: 1 1 0;
    min-height: 32px;
    border: 1px solid var(--hs-field-line);
    border-radius: 9px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 800;
    color: var(--hs-ink);
    cursor: pointer;
  }

  .todos {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 38px;
  }

  .todo {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
  }

  .todo input {
    width: 16px;
    height: 16px;
    margin: 1px 0 0;
    flex: none;
    accent-color: var(--hs-accent);
  }

  .add-todo input,
  .new-task :global(input) {
    width: 100%;
    min-height: 34px;
    box-sizing: border-box;
    padding: 0 8px;
    border: 1px solid var(--hs-field-line);
    border-radius: 8px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 13px;
    color: var(--hs-ink);
  }

  .empty {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--hs-ink-subtle);
  }

  .error {
    margin: 0;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--hs-danger);
  }

  .new {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    border: 1px dashed var(--hs-ink-disabled);
    border-radius: 12px;
    background: none;
    font: inherit;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .new svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .new-task {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .secondary {
    min-height: 38px;
    border: 1px solid var(--hs-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 800;
    color: var(--hs-ink);
    cursor: pointer;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
