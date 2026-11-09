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
  Adds a task to a course, or changes one. A new task needs a first to-do: a
  concrete first action makes starting easy. Size and date are optional; they
  tell the planner how much is left and what comes first.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import { createTask, formatMinutes, MAX_TASK_SESSIONS, type Task, type TaskSize, updateTask } from "@headstart/core";
  import { shortDate } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import DatePicker from "./DatePicker.svelte";

  let {
    study,
    courseId,
    task = null,
    onDone,
  }: { study: Study; courseId: string; task?: Task | null; onDone: () => void } = $props();

  const initial = untrack(() => task);
  let title = $state(initial?.title ?? "");
  let nextStep = $state(initial?.nextStep ?? "");
  let size = $state<TaskSize | null>(initial?.size ?? null);
  /** The user's own number of sessions; set, it replaces the size. */
  let custom = $state<number | null>(initial?.sessions ?? null);
  let customOpen = $state(initial?.sessions != null);
  let dueDay = $state(initial?.dueDay ?? "");
  let error = $state<string | null>(null);

  const SIZES: { value: TaskSize; label: string; hint: string }[] = [
    { value: "small", label: "Small", hint: "1 session" },
    { value: "medium", label: "Medium", hint: "2 to 3" },
    { value: "large", label: "Large", hint: "4 or more" },
  ];
  const exam = $derived(study.course(courseId)?.examDate ?? null);
  const focus = $derived(study.settings.focusMinutes);

  function pickSize(value: TaskSize): void {
    size = size === value && !customOpen ? null : value;
    customOpen = false;
    custom = null;
  }

  function pickCustom(): void {
    customOpen = !customOpen;
    if (customOpen) {
      size = null;
      custom ??= 4;
    } else custom = null;
  }

  async function submit(): Promise<void> {
    const due = dueDay || null;
    const sessions = customOpen && custom ? Math.round(custom) : null;
    const result = initial
      ? await study.run((s) =>
          updateTask(s, initial.id, { title, size, sessions, dueDay: due }),
        )
      : await study.run((s) =>
          createTask(s, {
            taskId: study.newId(),
            courseId,
            title,
            nextStep,
            size,
            sessions,
            dueDay: due,
          }),
        );
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
  <div class="field">
    <span id="size-label">How much work? <em>Optional</em></span>
    <div class="sizes" role="group" aria-labelledby="size-label">
      {#each SIZES as option (option.value)}
        <button
          type="button"
          class="size"
          aria-pressed={size === option.value && !customOpen}
          onclick={() => pickSize(option.value)}
        >
          <b>{option.label}</b><small>{option.hint}</small>
        </button>
      {/each}
      <button type="button" class="size" aria-pressed={customOpen} onclick={pickCustom}>
        <b>Own</b><small>{customOpen && custom ? `${custom} sessions` : "Set a number"}</small>
      </button>
    </div>
    {#if customOpen}
      <label class="custom">
        <input
          type="number"
          min="1"
          max={MAX_TASK_SESSIONS}
          step="1"
          bind:value={custom}
          aria-label="Sessions it takes"
        />
        <span>sessions{custom && custom > 0 ? `, about ${formatMinutes(custom * focus)} with ${focus}-minute sessions` : ""}</span>
      </label>
    {/if}
    <small class="hint">A rough guess is fine. Headstart counts the sessions you spend and shows what is left.</small>
  </div>
  <div class="field">
    <span>Done by <em>Optional</em></span>
    <DatePicker bind:value={dueDay} label="Done by" optional />
    {#if exam && !dueDay}
      <small class="hint">Leave it empty and the exam date is used ({shortDate(new Date(`${exam}T12:00`).getTime())}).</small>
    {/if}
  </div>
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

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field > span {
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  em {
    font-style: normal;
    font-weight: 600;
    color: var(--hs-ink-subtle);
  }

  .sizes {
    display: flex;
    gap: 8px;
  }

  .size {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-height: 52px;
    padding: 4px 8px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .custom {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }

  .custom input {
    width: 84px;
  }

  .size small {
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .size[aria-pressed="true"] {
    border: 2px solid var(--hs-accent);
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .hint {
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--hs-ink-subtle);
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
