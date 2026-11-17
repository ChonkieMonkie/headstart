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

<!-- Park a thought, in the focus view: one line and Enter, and it waits for the break. T jumps to the field. -->
<script lang="ts">
  import { MAX_THOUGHT_LENGTH } from "@headstart/core";
  import type { Study } from "$lib/study.svelte.ts";
  import MathText from "./MathText.svelte";

  let { study }: { study: Study } = $props();

  let text = $state("");
  let error = $state<string | null>(null);
  let field = $state<HTMLInputElement>();

  // The thoughts parked in this session, newest last.
  const parked = $derived(study.thoughts.filter((t) => t.sessionId === study.active?.sessionId));
  const SHOWN = 3;

  async function park(): Promise<void> {
    if (!text.trim()) return;
    error = await study.parkThought(text);
    if (!error) text = "";
  }

  function typing(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || target.closest("input, textarea, select, [role='listbox'], [role='combobox']") !== null;
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key.toLowerCase() !== "t" || event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return;
    event.preventDefault();
    field?.focus();
  }
</script>

<svelte:window {onkeydown} />

<section class="park" aria-label="Park a thought">
  <label for="park-thought">Park a thought <span>It waits for your break · <kbd>T</kbd></span></label>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      park();
    }}
  >
    <input
      id="park-thought"
      type="text"
      bind:this={field}
      bind:value={text}
      maxlength={MAX_THOUGHT_LENGTH}
      placeholder="Anything on your mind, about your studies or not"
      autocomplete="off"
      onkeydown={(e) => {
        // Escape gives the keyboard back to the session (Space pauses again).
        if (e.key === "Escape") field?.blur();
      }}
    />
    <button type="submit" disabled={!text.trim()}>Park</button>
  </form>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if parked.length > 0}
    <p class="parked" aria-live="polite">
      <span class="count">Parked:</span>
      {#each parked.slice(-SHOWN) as thought (thought.id)}
        <span class="chip"><MathText text={thought.text} /></span>
      {/each}
      {#if parked.length > SHOWN}<span class="count">+ {parked.length - SHOWN} more</span>{/if}
    </p>
  {/if}
</section>

<style>
  .park {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(520px, 90vw);
  }

  label {
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-focus-text);
  }

  label span {
    margin-left: 6px;
    font-weight: 600;
    color: var(--hs-focus-text-muted);
  }

  kbd {
    padding: 0 5px;
    border: 1px solid #3a4070;
    border-radius: 5px;
    font: inherit;
    font-size: 12px;
  }

  form {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 14px;
    border: 1px solid #3a4070;
    border-radius: 12px;
    background: transparent;
    font: inherit;
    font-weight: 600;
    color: var(--hs-focus-text);
  }

  input::placeholder {
    color: var(--hs-focus-text-muted);
  }

  input:focus-visible {
    border-color: var(--hs-focus-accent);
    outline: 2px solid var(--hs-focus-accent);
    outline-offset: 1px;
  }

  button {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 12px;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  button:not(:disabled):hover {
    background: color-mix(in srgb, var(--hs-focus-accent) 82%, #fff);
  }

  button:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }

  .parked {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
  }

  .count {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--hs-focus-text-muted);
  }

  .chip {
    max-width: 100%;
    overflow: hidden;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--hs-focus-surface);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .error {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #ffb4a8;
  }
</style>
