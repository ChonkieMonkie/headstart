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

<!-- Adds a task to a course, or renames one. A new task needs a first to-do: a concrete first action makes starting easy. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { createTask, type Task, updateTask } from "@headstart/core";
  import type { Study } from "$lib/study.svelte.ts";

  let {
    study,
    courseId,
    task = null,
    onDone,
  }: { study: Study; courseId: string; task?: Task | null; onDone: () => void } = $props();

  const initial = untrack(() => task);
  let title = $state(initial?.title ?? "");
  let nextStep = $state(initial?.nextStep ?? "");
  let error = $state<string | null>(null);

  async function submit(): Promise<void> {
    const result = initial
      ? await study.run((s) => updateTask(s, initial.id, { title }))
      : await study.run((s) => createTask(s, { taskId: study.newId(), courseId, title, nextStep }));
    if (result.ok || result.reason === "Nothing changed") onDone();
    else error = result.reason;
  }
</script>

<form
  class="form"
  onsubmit={(event) => {
    event.preventDefault();
    submit();
  }}
>
  <label>
    <span>Task</span>
    <input type="text" bind:value={title} maxlength="120" placeholder="Problems 4.12 to 4.15" required />
  </label>
  {#if !initial}
    <label>
      <span>First to-do: the very first thing you will do</span>
      <input
        type="text"
        bind:value={nextStep}
        maxlength="200"
        placeholder="Open chapter 4 and read the worked example"
        required
      />
    </label>
  {/if}
  <div class="actions">
    <button type="submit" class="primary">{initial ? "Save task" : "Add task"}</button>
    <button type="button" class="secondary" onclick={onDone}>Cancel</button>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-ground);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  input {
    min-height: 42px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
  }

  .actions {
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
    color: var(--hs-on-accent);
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .error {
    margin: 0;
    color: var(--hs-danger);
    font-weight: 700;
  }

  input:focus-visible,
  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
