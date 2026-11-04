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

<!-- The tray panel window. It renders a snapshot from the main window and sends actions back; it never touches the database. -->
<script lang="ts">
  import { items } from "@headstart/content";
  import { formatDuration, formatMinutes } from "@headstart/core";
  import { lookFor, Mascot } from "@headstart/ui";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { onMount } from "svelte";
  import {
    hidePanel,
    listenToPanelSnapshots,
    openMainWindow,
    type PanelSnapshot,
    quitApp,
    requestPanelSnapshot,
    sendAction,
    type TrayAction,
  } from "$lib/shell.ts";
  import { inTauri } from "$lib/tauri.ts";

  let snapshot = $state<PanelSnapshot | null>(null);
  let now = $state(Date.now());

  const timer = $derived(snapshot?.timer ?? null);
  const buddy = $derived(snapshot?.mascot ?? null);
  const look = $derived(buddy ? lookFor(buddy.species, buddy.equipped, items) : null);
  const remaining = $derived(timer ? (timer.endsAt === null ? timer.remainingMs : timer.endsAt - now) : 0);

  // The clock ticks only while the panel is open and a countdown runs.
  let visible = $state(!document.hidden);
  $effect(() => {
    if (!visible || !timer || timer.endsAt === null) return;
    now = Date.now();
    const tick = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(tick);
  });

  onMount(() => {
    const stop = listenToPanelSnapshots((next) => {
      snapshot = next;
    });
    const seen = () => (visible = !document.hidden);
    document.addEventListener("visibilitychange", seen);
    // Ask for a fresh snapshot every time the panel opens.
    const unfocus = inTauri
      ? getCurrentWindow().onFocusChanged(({ payload: focused }) => {
          if (focused) requestPanelSnapshot();
        })
      : null;
    return () => {
      stop();
      document.removeEventListener("visibilitychange", seen);
      unfocus?.then((fn) => fn());
    };
  });

  // "End session" asks once more, so a slip of the mouse does not end it.
  let confirmingEnd = $state(false);
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  function askEnd(): void {
    confirmingEnd = true;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => (confirmingEnd = false), 4000);
  }

  async function act(action: TrayAction, close = true): Promise<void> {
    confirmingEnd = false;
    await sendAction(action);
    if (close) await hidePanel();
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") hidePanel();
  }
</script>

<svelte:window {onkeydown} />

<div class="panel">
  {#if buddy && look}
    <div class="buddy-row">
      <div class="buddy"><Mascot {look} mood={buddy.mood} size={66} /></div>
      <p class="bubble">{buddy.line}</p>
    </div>
  {/if}
  {#if timer?.kind === "focus"}
    <section class="now" aria-label="Session in progress">
      <p class="eyebrow">{timer.endsAt === null ? "Paused" : "Focusing"}</p>
      <p class="clock" role="timer">{formatDuration(remaining)}</p>
      <p class="heading">{snapshot?.heading}</p>
      {#if snapshot && snapshot.todos.length > 0}
        <ul class="step todos" aria-label="This session">
          {#each snapshot.todos.slice(0, 4) as todo, i (i)}
            <li class:done={todo.done}>
              {todo.text}
              {#if todo.task}<small>{todo.task}</small>{/if}
            </li>
          {/each}
        </ul>
      {:else if snapshot?.nextStep}<p class="step">Next step: {snapshot.nextStep}</p>{/if}
      <div class="buttons">
        {#if timer.endsAt === null}
          <button type="button" class="primary" onclick={() => act("resume", false)}>Resume</button>
        {:else}
          <button type="button" class="primary" onclick={() => act("pause", false)}>Pause</button>
        {/if}
        <button type="button" class="ghost" onclick={() => act("extend", false)}>+5 min</button>
        {#if confirmingEnd}
          <button type="button" class="ghost" onclick={() => act("end")}>Yes, end it</button>
        {:else}
          <button type="button" class="ghost" onclick={askEnd}>End session</button>
        {/if}
      </div>
      <div class="buttons">
        <button type="button" class="ghost" onclick={() => act("full")}>Full screen</button>
        <button type="button" class="ghost" onclick={() => act("compact")}>Compact timer</button>
      </div>
    </section>
  {:else if timer?.kind === "break"}
    <section class="now" aria-label="Break">
      <p class="eyebrow">Break</p>
      <p class="clock" role="timer">{formatDuration(remaining)}</p>
      <p class="step">Stand up, drink some water, look out of a window.</p>
      <div class="buttons">
        <button type="button" class="primary" onclick={() => act("start")}>
          Start session {(snapshot?.sessionsToday ?? 0) + 1}
        </button>
        <button type="button" class="ghost" onclick={() => act("skip-break", false)}>Skip break</button>
      </div>
      <div class="buttons">
        <button type="button" class="link" onclick={() => act("done-today", false)}>Done for today</button>
      </div>
    </section>
  {:else}
    <section class="now" aria-label="Start a session">
      {#if snapshot?.upNext}
        <p class="eyebrow">
          {snapshot.upNext.startsNow ? "Up now" : `Next up at ${snapshot.upNext.time}`}
        </p>
        <p class="heading">{snapshot.upNext.task ?? snapshot.upNext.course}</p>
        <p class="sub">{snapshot.upNext.course} · {snapshot.upNext.time}</p>
        {#if snapshot.nextStep}<p class="step">Next step: {snapshot.nextStep}</p>{/if}
      {:else}
        <p class="eyebrow">Ready when you are</p>
        <p class="heading">Nothing planned right now</p>
      {/if}
      <div class="buttons">
        <button type="button" class="primary" onclick={() => act("start")}>
          {snapshot?.upNext?.startsNow ? "Start session" : `Start ${snapshot?.focusMinutes ?? 25} min now`}
        </button>
        <button type="button" class="ghost" onclick={() => act("start-five")}>Just 5 minutes</button>
      </div>
    </section>
  {/if}

  {#if snapshot}
    <dl class="today">
      <div><dt>Focus today</dt><dd>{formatMinutes(snapshot.focusTodayMinutes)}</dd></div>
      <div><dt>Sessions</dt><dd>{snapshot.sessionsToday}</dd></div>
      {#if snapshot.cratesWaiting > 0}
        <div><dt>Crates</dt><dd>{snapshot.cratesWaiting} waiting</dd></div>
      {:else}
        <div><dt>Next crate</dt><dd>{snapshot.crateProgress} of {snapshot.crateEvery}</dd></div>
      {/if}
    </dl>
  {/if}

  <footer>
    <button type="button" class="link" onclick={() => openMainWindow()}>Open Headstart</button>
    <button type="button" class="link" onclick={() => quitApp()}>Quit</button>
  </footer>
</div>

<style>
  .buddy-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .buddy {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 74px;
    height: 74px;
    border-radius: 50%;
    background: #252a50;
  }

  .bubble {
    margin: 0;
    padding: 8px 12px;
    border-radius: 14px 14px 14px 4px;
    background: var(--hs-focus-surface);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
  }

  /* The window is transparent; the panel draws its own rounded box. */
  :global(html),
  :global(body) {
    background: transparent;
  }

  .panel {
    height: 100vh;
    box-sizing: border-box;
    border: 1px solid rgb(255 255 255 / 0.08);
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
    user-select: none;
  }

  .now {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  p {
    margin: 0;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--hs-focus-accent);
  }

  .clock {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 3rem;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }

  .heading {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }

  .sub,
  .step {
    font-size: 14px;
    line-height: 1.45;
    color: var(--hs-focus-text-muted);
  }

  .todos {
    margin: 0;
    padding-left: 28px;
    display: grid;
    gap: 4px;
  }

  .todos small {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-focus-text-muted);
  }

  .todos .done {
    text-decoration: line-through;
    color: var(--hs-focus-text-muted);
  }

  .step {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--hs-focus-surface);
    color: var(--hs-focus-text);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  button {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
  }

  .ghost {
    border: 1px solid #3a4070;
    background: transparent;
    color: var(--hs-focus-text);
  }

  .today {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 0;
    padding: 12px;
    border-radius: 12px;
    background: var(--hs-focus-surface);
  }

  dt {
    font-size: 11px;
    font-weight: 800;
    color: var(--hs-focus-text-muted);
  }

  dd {
    margin: 2px 0 0;
    font-weight: 800;
  }

  footer {
    display: flex;
    justify-content: space-between;
  }

  .link {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hs-focus-text-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Hover and press feedback, a little lighter on the dark surface. */
  button:not(:disabled):active {
    transform: translateY(1px);
  }

  .primary:not(:disabled):hover {
    background: color-mix(in srgb, var(--hs-focus-accent) 82%, #fff);
  }

  .ghost:not(:disabled):hover {
    border-color: #5a6094;
    background: rgb(255 255 255 / 0.08);
  }

  .link:not(:disabled):hover {
    color: var(--hs-focus-text);
  }

  button:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }
</style>
