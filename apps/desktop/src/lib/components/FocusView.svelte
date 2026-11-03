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

<!-- The running session: a big countdown and the few controls a focused person needs. Used in the normal window and in full screen. -->
<script lang="ts">
  import { formatDuration } from "@headstart/core";
  import { Mascot } from "@headstart/ui";
  import type { Study } from "$lib/study.svelte.ts";
  import CourseName from "./CourseName.svelte";
  import Select from "./Select.svelte";
  import HoldButton from "./HoldButton.svelte";

  let { study }: { study: Study } = $props();

  let confirmingEnd = $state(false);
  const course = $derived(study.course(study.active?.courseId ?? null));
  const task = $derived(study.task(study.active?.taskId ?? null));
  const sessionsToday = $derived(study.stats(1)?.todaySessions ?? 0);
  const todos = $derived(study.sessionTodos);
  const fromList = $derived(
    course ? study.todosOf(course.id).filter((t) => !todos.some((own) => own.id === t.id)) : [],
  );
  let pickTodo = $state("");
  let newTodo = $state("");
  let todoError = $state<string | null>(null);

  async function addToSession(todoId: string): Promise<void> {
    const sessionId = study.active?.sessionId;
    if (!todoId || !sessionId) return;
    todoError = await study.assignTodo(todoId, { sessionId });
    pickTodo = "";
  }

  async function addNew(): Promise<void> {
    const sessionId = study.active?.sessionId;
    if (!course || !sessionId || !newTodo.trim()) return;
    todoError = await study.addTodo({ courseId: course.id, taskId: task?.id ?? null, text: newTodo, target: { sessionId } });
    if (!todoError) newTodo = "";
  }
  const RADIUS = 140;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const minutesDone = $derived(
    study.active ? Math.floor((study.active.plannedMs + study.active.extendedMs - study.remaining) / 60_000) : 0,
  );

  function onkeydown(event: KeyboardEvent): void {
    // Space pauses and resumes, unless a control has focus and wants it.
    if (event.key !== " " || event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    study.togglePause();
  }
</script>

<svelte:window {onkeydown} />

<section class="focus" aria-label="Focus session">
  <header>
    <div>
      <p class="eyebrow">
        {#if course}<CourseName {course} />{:else}Focus session{/if}
      </p>
      <p class="sub">{task ? `${task.title} · ` : ""}Session {sessionsToday + 1} today</p>
    </div>
    <div class="layout">
      {#if study.layout === "full"}
        <HoldButton label="Exit full screen" onhold={() => study.setLayout("normal")} />
      {:else}
        <button type="button" class="ghost" onclick={() => study.setLayout("full")}>Full screen</button>
        <button type="button" class="ghost" onclick={() => study.setLayout("compact")}>Compact timer</button>
      {/if}
    </div>
  </header>

  <div class="center">
    <div class="stage">
    {#if study.look}
      <div class="buddy">
        <Mascot look={study.look} mood={study.mood} size={200} />
      </div>
    {/if}
    <div class="ring">
      <svg viewBox="0 0 320 320" aria-hidden="true">
        <circle cx="160" cy="160" r={RADIUS} class="track" />
        <circle
          cx="160"
          cy="160"
          r={RADIUS}
          class="done"
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={CIRCUMFERENCE * (1 - study.progress)}
        />
      </svg>
      <div class="readout">
        <span class="clock" role="timer" aria-live="off">{formatDuration(study.remaining)}</span>
        <span class="label">{study.paused ? "Paused" : "until your break"}</span>
      </div>
    </div>
    </div>

    {#if todos.length > 0 || course}
      <section class="next-step" aria-label="To-dos for this session">
        <span>{todos.length > 0 ? "This session" : "Next step"}</span>
        {#if todos.length > 0}
          <ul class="todos">
            {#each todos as todo (todo.id)}
              <li>
                <label class:done={todo.done}>
                  <input type="checkbox" checked={todo.done} onchange={() => study.toggleTodo(todo)} />
                  {todo.text}
                </label>
              </li>
            {/each}
          </ul>
        {:else if task?.nextStep}
          <p class="plain">{task.nextStep}</p>
        {/if}
        {#if course}
          <div class="add">
            {#if fromList.length > 0}
              <Select
                dark
                bind:value={pickTodo}
                label="Add a to-do from your list"
                onchange={(id) => addToSession(id)}
                groups={[
                  { label: "", options: [{ value: "", label: "Add from your list…" }] },
                  { label: "", options: fromList.map((t) => ({ value: t.id, label: t.text, hint: t.taskId ? (study.task(t.taskId)?.title ?? "") : "" })) },
                ]}
              />
            {/if}
            <form
              onsubmit={(e) => {
                e.preventDefault();
                addNew();
              }}
            >
              <input type="text" bind:value={newTodo} maxlength="200" placeholder="Add a to-do" aria-label="New to-do for this session" />
            </form>
          </div>
          {#if todoError}<p class="todo-error" role="alert">{todoError}</p>{/if}
        {/if}
      </section>
    {/if}

    {#if confirmingEnd}
      <div class="confirm" role="group" aria-label="End the session">
        <p>
          {#if minutesDone < 1}
            End now? Under a minute is not saved.
          {:else}
            End now? You keep the {minutesDone} {minutesDone === 1 ? "minute" : "minutes"} you studied.
          {/if}
        </p>
        <div class="controls">
          <button type="button" class="primary" onclick={() => (confirmingEnd = false)}>Keep going</button>
          <button
            type="button"
            class="ghost"
            onclick={() => {
              confirmingEnd = false;
              study.end();
            }}>End session</button
          >
        </div>
      </div>
    {:else}
      <div class="controls">
        <button type="button" class="primary" onclick={() => study.togglePause()}>
          {study.paused ? "Resume" : "Pause"}
        </button>
        <button type="button" class="ghost" onclick={() => study.extend(5)}>+5 min</button>
        <button type="button" class="ghost" onclick={() => (confirmingEnd = true)}>End session</button>
      </div>
      <button type="button" class="link" onclick={() => study.logDistraction()}>
        Got distracted{study.distractions > 0 ? ` (${study.distractions})` : ""}
      </button>
    {/if}
  </div>
</section>

<style>
  .focus {
    min-height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 24px 28px 40px;
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .eyebrow {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--hs-focus-accent);
  }


  .next-step {
    max-width: 520px;
    margin: 0;
    padding: 12px 18px;
    border-radius: 14px;
    background: var(--hs-focus-surface);
    text-align: center;
    line-height: 1.5;
  }

  .next-step {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: min(420px, 90vw);
    text-align: left;
  }

  .todos {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .todos label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 32px;
    font-weight: 700;
    cursor: pointer;
  }

  .todos label.done {
    color: var(--hs-focus-text-muted);
    text-decoration: line-through;
  }

  .todos input {
    width: 18px;
    height: 18px;
    margin: 2px 0 0;
    flex: none;
    accent-color: var(--hs-focus-accent);
  }

  .plain {
    margin: 0;
  }

  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .add form {
    flex: 1 1 180px;
    display: flex;
  }

  .add input {
    flex: 1 1 auto;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #3a4070;
    border-radius: 12px;
    background: transparent;
    font: inherit;
    font-weight: 600;
    color: var(--hs-focus-text);
  }

  .add input::placeholder {
    color: var(--hs-focus-text-muted);
  }

  .todo-error {
    margin: 0;
    color: #ffb4a8;
    font-weight: 700;
  }

  .next-step > span {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hs-focus-accent);
  }

  .sub {
    margin: 2px 0 0;
    font-weight: 700;
    color: var(--hs-focus-text-muted);
  }

  .layout {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .center {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 26px;
  }

  .stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 40px;
  }

  .buddy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: #252a50;
  }

  .ring {
    position: relative;
    width: min(340px, 70vw);
    aspect-ratio: 1;
  }

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-width: 14;
  }

  .track {
    stroke: var(--hs-focus-surface);
  }

  .done {
    stroke: var(--hs-focus-accent);
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }

  .readout {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .clock {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: clamp(3rem, 9vw, 4.6rem);
    font-variant-numeric: tabular-nums;
  }

  .label {
    font-weight: 700;
    color: var(--hs-focus-text-muted);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .confirm {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .confirm p {
    margin: 0;
    font-weight: 700;
  }

  button {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 14px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    min-width: 132px;
    border: 0;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
  }

  .ghost {
    border: 1px solid #3a4070;
    background: transparent;
    color: var(--hs-focus-text);
  }

  .link {
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--hs-focus-text-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  button:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .done {
      transition: none;
    }
  }
</style>
