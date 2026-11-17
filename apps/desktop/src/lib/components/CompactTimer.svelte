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

<!-- The small floating timer. The whole window is a drag handle except its buttons. -->
<script lang="ts">
  import { formatDuration, MAX_THOUGHT_LENGTH } from "@headstart/core";
  import { Mascot } from "@headstart/ui";
  import { tick } from "svelte";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  // Park a thought: the bottom line turns into a one-line field.
  let parking = $state(false);
  let thought = $state("");
  let parkError = $state<string | null>(null);
  let field = $state<HTMLInputElement>();
  const parkedCount = $derived(study.thoughts.length);

  async function openPark(): Promise<void> {
    parking = true;
    parkError = null;
    await tick();
    field?.focus();
  }

  async function park(): Promise<void> {
    if (thought.trim()) {
      parkError = await study.parkThought(thought);
      if (parkError) return;
    }
    thought = "";
    parking = false;
  }

  const label = $derived(
    study.breakTimer ? "Break" : study.paused ? "Paused" : "until your break",
  );
</script>

<section class="compact" data-tauri-drag-region aria-label="Compact timer">
  <div class="bar" aria-hidden="true">
    <div class="bar-fill" style:width="{study.progress * 100}%"></div>
  </div>
  <div class="row" data-tauri-drag-region>
    {#if study.look}
      <div class="buddy" data-tauri-drag-region>
        <Mascot look={study.look} mood={study.mood} size={50} label="" />
      </div>
    {/if}
    <div class="readout" data-tauri-drag-region>
      <span class="clock" role="timer" data-tauri-drag-region>{formatDuration(study.remaining)}</span>
      <span class="label" data-tauri-drag-region>{label}</span>
    </div>
    <div class="buttons">
      {#if study.active}
        <button type="button" class="primary" onclick={() => study.togglePause()}>
          {study.paused ? "Resume" : "Pause"}
        </button>
      {:else if study.breakTimer}
        <button type="button" class="primary" onclick={() => study.skipBreak()}>Skip</button>
      {/if}
      <button
        type="button"
        class="icon"
        aria-label="Back to the full window"
        title="Back to the full window"
        onclick={() => study.setLayout("normal")}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
        </svg>
      </button>
    </div>
  </div>
  {#if parking}
    <form
      class="park"
      onsubmit={(e) => {
        e.preventDefault();
        park();
      }}
    >
      <input
        type="text"
        bind:this={field}
        bind:value={thought}
        maxlength={MAX_THOUGHT_LENGTH}
        placeholder="Park a thought, then Enter"
        aria-label="Park a thought"
        aria-invalid={parkError !== null}
        title={parkError ?? ""}
        autocomplete="off"
        onkeydown={(e) => {
          if (e.key === "Escape") {
            thought = "";
            parking = false;
          }
        }}
      />
      <button type="submit" class="small">Park</button>
    </form>
  {:else}
    <div class="foot" data-tauri-drag-region>
      <p class="hint" data-tauri-drag-region>
        {parkedCount > 0 ? `${parkedCount} parked · drag me anywhere` : "Stays on top. Drag it anywhere."}
      </p>
      {#if study.active}
        <button type="button" class="small ghost" onclick={openPark}>
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></svg>
          Park a thought
        </button>
      {/if}
    </div>
  {/if}
</section>

<style>
  .compact {
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
    cursor: grab;
    user-select: none;
  }

  .buddy {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #252a50;
  }

  /* Let drags on the mascot reach the drag region behind it. */
  .buddy :global(svg) {
    pointer-events: none;
  }

  .bar {
    height: 4px;
    border-radius: 999px;
    background: var(--hs-focus-surface);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--hs-focus-accent);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .readout {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .clock {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2rem;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .label,
  .hint {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-focus-text-muted);
  }

  .buttons {
    display: flex;
    gap: 6px;
  }

  .foot,
  .park {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
  }

  .park input {
    flex: 1 1 auto;
    min-width: 0;
    height: 28px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid #3a4070;
    border-radius: 8px;
    background: transparent;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-focus-text);
    cursor: text;
    user-select: text;
  }

  .park input::placeholder {
    color: var(--hs-focus-text-muted);
  }

  .park input:focus-visible {
    border-color: var(--hs-focus-accent);
    outline: 2px solid var(--hs-focus-accent);
    outline-offset: 0;
  }

  .park input[aria-invalid="true"] {
    border-color: #ffb4a8;
  }

  button.small {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 28px;
    min-width: 0;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
    font-size: 12px;
  }

  button.small.ghost {
    border: 1px solid #3a4070;
    background: transparent;
    color: var(--hs-focus-text);
  }

  button.small.ghost:not(:disabled):hover {
    border-color: #5a6094;
    background: rgb(255 255 255 / 0.08);
  }

  .small path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  button {
    min-height: 40px;
    min-width: 40px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    padding: 0 14px;
    border: 0;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
  }

  .icon {
    display: grid;
    place-items: center;
    border: 1px solid #3a4070;
    background: transparent;
    color: var(--hs-focus-text);
  }

  .icon path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Hover and press feedback, a little lighter on the dark surface. */
  button:not(:disabled):active {
    transform: translateY(1px);
  }

  .primary:not(:disabled):hover {
    background: color-mix(in srgb, var(--hs-focus-accent) 82%, #fff);
  }

  .icon:not(:disabled):hover {
    border-color: #5a6094;
    background: rgb(255 255 255 / 0.08);
  }

  button:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }
</style>
