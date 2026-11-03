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
  import { formatDuration } from "@headstart/core";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const label = $derived(
    study.breakTimer ? "Break" : study.paused ? "Paused" : "until your break",
  );
</script>

<section class="compact" data-tauri-drag-region aria-label="Compact timer">
  <div class="bar" aria-hidden="true">
    <div class="bar-fill" style:width="{study.progress * 100}%"></div>
  </div>
  <div class="row" data-tauri-drag-region>
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
  <p class="hint" data-tauri-drag-region>Stays on top. Drag it anywhere.</p>
</section>

<style>
  .compact {
    height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
    cursor: grab;
    user-select: none;
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

  button:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }
</style>
