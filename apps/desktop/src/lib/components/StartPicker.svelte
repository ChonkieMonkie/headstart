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

<!-- Before a task's session starts: tick the to-dos to bring along. The next step is ticked, so Enter just starts. -->
<script lang="ts">
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  let dialog = $state<HTMLDialogElement | null>(null);
  let startButton = $state<HTMLButtonElement | null>(null);
  let chosen = $state(new Set<string>());

  const choosing = $derived(study.choosing);
  const task = $derived(choosing ? study.task(choosing.taskId) : null);
  const todos = $derived(choosing ? study.startChoices(choosing.taskId) : []);
  const minutes = $derived(choosing?.options.minutes ?? study.settings.focusMinutes);

  $effect(() => {
    if (!dialog) return;
    if (choosing && !dialog.open) {
      chosen = new Set(todos.slice(0, 1).map((t) => t.id));
      dialog.showModal();
      startButton?.focus();
    } else if (!choosing && dialog.open) {
      dialog.close();
    }
  });

  function toggle(id: string, on: boolean): void {
    const next = new Set(chosen);
    if (on) next.add(id);
    else next.delete(id);
    chosen = next;
  }

  const start = (ids: string[]) => study.startChosen(ids);
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="start-picker-h"
  oncancel={(e) => {
    e.preventDefault();
    study.choosing = null;
  }}
  onclick={(e) => {
    // A click on the backdrop closes it.
    if (e.target === dialog) study.choosing = null;
  }}
>
  <form
    method="dialog"
    onsubmit={(e) => {
      e.preventDefault();
      start(todos.filter((t) => chosen.has(t.id)).map((t) => t.id));
    }}
  >
    <h2 id="start-picker-h">Bring along</h2>
    <p class="sub">{task?.title} · {minutes} min. Tick what this session is for.</p>
    <ul>
      {#each todos as todo (todo.id)}
        <li>
          <label>
            <input type="checkbox" checked={chosen.has(todo.id)} onchange={(e) => toggle(todo.id, e.currentTarget.checked)} />
            {todo.text}
          </label>
        </li>
      {/each}
    </ul>
    <div class="actions">
      <button type="submit" class="primary" bind:this={startButton}>
        Start{chosen.size > 0 ? ` with ${chosen.size}` : ""}
      </button>
      <button type="button" class="secondary" onclick={() => start([])}>Start without to-dos</button>
      <button type="button" class="link" onclick={() => (study.choosing = null)}>Cancel</button>
    </div>
  </form>
</dialog>

<style>
  dialog {
    width: min(420px, calc(100vw - 32px));
    padding: 22px 24px;
    border: 0;
    border-radius: 18px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    box-shadow: 0 18px 48px rgb(27 34 54 / 0.25);
  }

  dialog::backdrop {
    background: rgb(27 34 54 / 0.35);
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.35rem;
  }

  .sub {
    margin: 4px 0 14px;
    color: var(--hs-ink-muted);
  }

  ul {
    list-style: none;
    margin: 0 0 18px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 50vh;
    overflow-y: auto;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 36px;
    font-weight: 700;
    cursor: pointer;
  }

  input {
    width: 18px;
    height: 18px;
    flex: none;
    margin: 0;
    accent-color: var(--hs-accent);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  button {
    min-height: 44px;
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

  .primary:hover {
    background: var(--hs-accent-strong);
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .secondary:hover {
    background: var(--hs-ground);
  }

  .link {
    min-height: 32px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hs-accent-strong);
    text-decoration: underline;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
