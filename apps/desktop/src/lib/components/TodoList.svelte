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
  The to-dos of a course, or of one task: tick them off, edit them in place
  and give them to a planned session (or the one that is running).
-->
<script lang="ts">
  import type { Todo } from "@headstart/core";
  import { clockTime, shortDate } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import Select from "./Select.svelte";

  let {
    study,
    courseId,
    taskId = null,
    addLabel = "Add a to-do",
  }: { study: Study; courseId: string; taskId?: string | null; addLabel?: string } = $props();

  let text = $state("");
  let editing = $state<string | null>(null);
  let draft = $state("");
  let showDone = $state(false);
  let error = $state<string | null>(null);

  const all = $derived(study.allTodosOf(courseId).filter((t) => t.taskId === taskId));
  const open = $derived(all.filter((t) => !t.done));
  const done = $derived(all.filter((t) => t.done));
  const course = $derived(study.course(courseId));

  /** Sessions a to-do can go to: the running one and planned ones for this course or none. */
  const sessionGroups = $derived.by(() => {
    const options: { value: string; label: string; hint?: string }[] = [{ value: "", label: "Add to a session" }];
    const active = study.active;
    if (active && (active.courseId === null || active.courseId === courseId)) {
      options.push({ value: `session:${active.sessionId}`, label: "The running session" });
    }
    const today = new Date(study.now).toDateString();
    for (const plan of study.openPlans) {
      if (plan.courseId !== null && plan.courseId !== courseId) continue;
      const day = new Date(plan.startAt).toDateString() === today ? "Today" : shortDate(plan.startAt);
      const what = plan.taskId ? (study.task(plan.taskId)?.title ?? "") : "";
      options.push({ value: `plan:${plan.id}`, label: `${day} ${clockTime(plan.startAt)}`, hint: what || `${plan.minutes} min` });
    }
    return [{ label: "", options }];
  });

  function placeOf(todo: Todo): string {
    if (todo.sessionId) return `session:${todo.sessionId}`;
    if (todo.planId) return `plan:${todo.planId}`;
    return "";
  }

  async function add(): Promise<void> {
    if (!text.trim()) return;
    error = await study.addTodo({ courseId, taskId, text });
    if (!error) text = "";
  }

  async function saveEdit(todo: Todo): Promise<void> {
    if (draft.trim() && draft !== todo.text) error = await study.editTodo(todo.id, draft);
    editing = null;
  }

  async function place(todo: Todo, value: string): Promise<void> {
    const [kind, id] = value.split(":");
    const target = kind === "plan" && id ? { planId: id } : kind === "session" && id ? { sessionId: id } : null;
    error = await study.assignTodo(todo.id, target);
  }
</script>

<div class="todo-list">
  {#if open.length > 0}
    <ul>
      {#each open as todo, i (todo.id)}
        <li>
          <input
            type="checkbox"
            aria-label="Done: {todo.text}"
            onchange={() => study.toggleTodo(todo)}
          />
          {#if editing === todo.id}
            <form
              class="edit"
              onsubmit={(e) => {
                e.preventDefault();
                saveEdit(todo);
              }}
            >
              <!-- svelte-ignore a11y_autofocus -->
              <input
                type="text"
                bind:value={draft}
                maxlength="200"
                aria-label="Edit to-do"
                autofocus
                onblur={() => saveEdit(todo)}
                onkeydown={(e) => {
                  if (e.key === "Escape") editing = null;
                }}
              />
            </form>
          {:else}
            <button
              type="button"
              class="text"
              title="Click to edit"
              onclick={() => {
                editing = todo.id;
                draft = todo.text;
              }}
            >
              {#if i === 0 && taskId}<span class="first">Next</span>{/if}
              {todo.text}
            </button>
          {/if}
          {#if (sessionGroups[0]?.options.length ?? 0) > 1}
            <span class="place">
              <Select
                value={placeOf(todo)}
                groups={sessionGroups}
                quiet={placeOf(todo) === ""}
                label="Session for {todo.text}"
                onchange={(v) => place(todo, v)}
              />
            </span>
          {/if}
          <button type="button" class="remove" aria-label="Remove {todo.text}" title="Remove" onclick={() => study.removeTodo(todo.id)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <form
    class="new"
    onsubmit={(e) => {
      e.preventDefault();
      add();
    }}
  >
    <input type="text" bind:value={text} maxlength="200" placeholder="{addLabel}, e.g. redo problem 3.7 d" aria-label="{addLabel}{course ? ` to ${course.name}` : ''}" />
    {#if text.trim()}<button type="submit" class="small">Add</button>{/if}
  </form>

  {#if done.length > 0}
    <button type="button" class="link" aria-expanded={showDone} onclick={() => (showDone = !showDone)}>
      {done.length} done
    </button>
    {#if showDone}
      <ul class="done">
        {#each done as todo (todo.id)}
          <li>
            <input type="checkbox" checked aria-label="Not done: {todo.text}" onchange={() => study.toggleTodo(todo)} />
            <s>{todo.text}</s>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    flex: none;
    margin: 0;
    accent-color: var(--hs-accent);
    cursor: pointer;
  }

  .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    padding: 0 6px;
    border: 0;
    border-radius: 8px;
    background: none;
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
    text-align: left;
    cursor: text;
  }

  .text:hover {
    background: var(--hs-ground);
  }

  .first {
    flex: none;
    padding: 1px 7px;
    border-radius: 6px;
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .place {
    flex: none;
    width: 200px;
    font-size: 14px;
  }

  .place :global(.select) {
    width: 100%;
  }

  .place :global(.trigger) {
    min-height: 36px;
  }

  .remove {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--hs-ink-subtle);
    cursor: pointer;
  }

  .remove:hover {
    background: #fdecea;
    color: #b42318;
  }

  .remove svg {
    width: 16px;
    height: 16px;
  }

  .remove path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
  }

  .edit {
    flex: 1 1 auto;
    display: flex;
  }

  .edit input,
  .new input {
    flex: 1 1 auto;
    min-height: 38px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid #c9cfdc;
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
  }

  .new {
    display: flex;
    gap: 8px;
  }

  .new input {
    border-style: dashed;
  }

  .small {
    min-height: 38px;
    padding: 0 14px;
    border: 0;
    border-radius: 10px;
    background: var(--hs-accent);
    color: #fff;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .link {
    align-self: flex-start;
    min-height: 28px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--hs-accent-strong);
    text-decoration: underline;
    cursor: pointer;
  }

  .done li {
    min-height: 32px;
    color: var(--hs-ink-subtle);
  }

  .error {
    margin: 0;
    color: #b42318;
    font-weight: 700;
  }

  .text:focus-visible,
  .remove:focus-visible,
  .link:focus-visible,
  .small:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    li {
      flex-wrap: wrap;
    }

    .place {
      width: 100%;
      padding-left: 26px;
    }
  }
</style>
