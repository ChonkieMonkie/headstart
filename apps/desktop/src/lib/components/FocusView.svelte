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
  import type { Study } from "$lib/study.svelte.ts";
  import HoldButton from "./HoldButton.svelte";

  let { study }: { study: Study } = $props();

  let confirmingEnd = $state(false);
  const course = $derived(study.course(study.active?.courseId ?? null));
  const task = $derived(study.task(study.active?.taskId ?? null));
  const sessionsToday = $derived(study.stats(1)?.todaySessions ?? 0);
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
        {#if course}<span class="dot" style:background={course.color} aria-hidden="true"></span>{/if}
        {course?.name ?? "Focus session"}
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

    {#if task}
      <p class="next-step"><span>Next step</span> {task.nextStep}</p>
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

  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 4px;
    border-radius: 999px;
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

  .next-step span {
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
