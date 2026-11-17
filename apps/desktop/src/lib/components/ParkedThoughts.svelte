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

<!-- Parked thoughts on Today: what was written down during sessions, waiting to be dealt with. They belong to no course. -->
<script lang="ts">
  import { daysBetween, localDayKey, type Thought } from "@headstart/core";
  import { plural, weekdayOf } from "$lib/format.ts";
  import { taskGroups } from "$lib/options.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import MathText from "./MathText.svelte";
  import Select from "./Select.svelte";

  let { study }: { study: Study } = $props();

  const thoughts = $derived(study.thoughts);
  const today = $derived(localDayKey(study.now));
  const hasCourses = $derived(study.courses.length > 0);

  /** The thought whose course is being picked, when its session had none. */
  let picking = $state<string | null>(null);
  let message = $state<string | null>(null);
  let error = $state<string | null>(null);

  function when(thought: Thought): string {
    const day = localDayKey(thought.parkedAt);
    const age = daysBetween(day, today);
    return age <= 0 ? "today" : age === 1 ? "yesterday" : age < 7 ? weekdayOf(day) : `${age} days ago`;
  }

  async function done(thought: Thought): Promise<void> {
    message = null;
    error = null;
    if (picking === thought.id) picking = null;
    await study.clearThought(thought.id);
  }

  async function toTodo(thought: Thought, target: { courseId: string; taskId: string | null }): Promise<void> {
    error = await study.thoughtToTodo(thought.id, target);
    picking = null;
    if (error) return;
    const task = study.task(target.taskId);
    const course = study.course(target.courseId);
    message = `Added to the to-dos of ${task?.title ?? course?.name ?? "the course"}.`;
  }

  function makeTodo(thought: Thought): void {
    message = null;
    const home = study.thoughtHome(thought);
    if (home) toTodo(thought, { courseId: home.course.id, taskId: home.taskId });
    else picking = picking === thought.id ? null : thought.id;
  }

  function pick(thought: Thought, value: string): void {
    const [kind, id] = value.split(":");
    if (!id) return;
    if (kind === "course") toTodo(thought, { courseId: id, taskId: null });
    const task = kind === "task" ? study.task(id) : null;
    if (task) toTodo(thought, { courseId: task.courseId, taskId: task.id });
  }
</script>

{#if thoughts.length > 0}
  <section class="card" aria-labelledby="pt-h">
    <div>
      <h2 id="pt-h">
        {study.breakTimer ? `${plural(thoughts.length, "thought")} parked for your break` : "Parked thoughts"}
      </h2>
      <p class="sub">Written down during a session so you could keep going. Tick one off when it is handled.</p>
    </div>
    <ul>
      {#each thoughts as thought (thought.id)}
        <li>
          <div class="line">
            <button type="button" class="tick" aria-label="Done: {thought.text}" title="Done" onclick={() => done(thought)}>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
            </button>
            <span class="text"><MathText text={thought.text} /></span>
            <span class="when">{when(thought)}</span>
            {#if hasCourses}
              <button type="button" class="secondary" aria-expanded={study.thoughtHome(thought) ? undefined : picking === thought.id} onclick={() => makeTodo(thought)}>
                Make it a study to-do
              </button>
            {/if}
          </div>
          {#if picking === thought.id}
            <div class="pick">
              <Select
                value=""
                label="Where the to-do goes"
                groups={taskGroups(study, { none: "Pick a course or task…", courses: true })}
                onchange={(value) => pick(thought, value)}
              />
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <p class="note" aria-live="polite">{message ?? ""}</p>
  </section>
{/if}

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
    padding: 22px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }

  .sub {
    margin: 2px 0 0;
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    border-top: 1px solid var(--hs-line);
  }

  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-height: 54px;
    padding: 6px 0;
  }

  .tick {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 2px solid var(--hs-field-line);
    border-radius: 8px;
    background: var(--hs-surface);
    cursor: pointer;
  }

  .tick path {
    fill: none;
    stroke: transparent;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .tick:hover,
  .tick:focus-visible {
    border-color: var(--hs-success);
  }

  .tick:hover path,
  .tick:focus-visible path {
    stroke: var(--hs-success);
  }

  .text {
    flex: 1 1 200px;
    min-width: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .when {
    flex: none;
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  .secondary {
    flex: none;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .secondary:hover {
    background: var(--hs-ground);
  }

  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  .pick {
    max-width: 420px;
    padding: 0 0 12px 40px;
  }

  .note,
  .error {
    margin: 0;
    font-size: 13.5px;
    font-weight: 700;
  }

  .note {
    color: var(--hs-success-strong);
  }

  .note:empty {
    display: none;
  }

  .error {
    color: var(--hs-danger-strong);
  }
</style>
