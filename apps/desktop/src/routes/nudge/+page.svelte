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

<!-- The distraction guard's nudge: a small card that floats above a guarded app. It only shows the session and sends the choice back. -->
<script lang="ts">
  import { items } from "@headstart/content";
  import { formatDuration } from "@headstart/core";
  import { lookFor, Mascot } from "@headstart/ui";
  import { onMount } from "svelte";
  import { guard, listenToPanelSnapshots, type PanelSnapshot, requestPanelSnapshot } from "$lib/shell.ts";

  let snapshot = $state<PanelSnapshot | null>(null);
  let now = $state(Date.now());

  const timer = $derived(snapshot?.timer?.kind === "focus" ? snapshot.timer : null);
  const buddy = $derived(snapshot?.mascot ?? null);
  const look = $derived(buddy ? lookFor(buddy.species, buddy.equipped, items) : null);
  const remaining = $derived(timer ? (timer.endsAt === null ? timer.remainingMs : timer.endsAt - now) : 0);
  const what = $derived(snapshot?.course ?? snapshot?.heading ?? "your session");

  // The clock ticks only while the card can be seen.
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
    // Ask for the session as it is now each time the card comes up.
    const stopShown = guard.onShown(() => {
      now = Date.now();
      requestPanelSnapshot();
    });
    const seen = () => (visible = !document.hidden);
    document.addEventListener("visibilitychange", seen);
    return () => {
      stop();
      stopShown();
      document.removeEventListener("visibilitychange", seen);
    };
  });
</script>

<div class="card" role="alertdialog" aria-labelledby="nudge-h" aria-describedby="nudge-left">
  <div class="top">
    {#if look}
      <div class="buddy"><Mascot {look} mood="nudge" size={46} label="" /></div>
    {/if}
    <div class="words">
      <h1 id="nudge-h">Back to {what}?</h1>
      <p id="nudge-left">
        {#if timer}{formatDuration(Math.max(0, remaining))} left in your session{:else}Your session is waiting{/if}
      </p>
    </div>
  </div>
  <button type="button" class="primary" onclick={() => guard.back()}>Back to studying</button>
  <button type="button" class="ghost" onclick={() => guard.allow()}>I need it for this session</button>
</div>

<style>
  /* The window is transparent; the card draws its own rounded box. */
  :global(html),
  :global(body) {
    background: transparent;
  }

  .card {
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 16px;
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
    user-select: none;
  }

  .top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 2px;
  }

  .buddy {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #252a50;
  }

  .words {
    min-width: 0;
  }

  h1 {
    margin: 0;
    overflow: hidden;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 17px;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  p {
    margin: 2px 0 0;
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    color: var(--hs-focus-text-muted);
  }

  button {
    border-radius: 10px;
    font: inherit;
    cursor: pointer;
  }

  .primary {
    min-height: 40px;
    border: 0;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
    font-weight: 800;
  }

  .primary:hover {
    background: color-mix(in srgb, var(--hs-focus-accent) 82%, #fff);
  }

  .ghost {
    min-height: 36px;
    border: 1px solid #3a4070;
    background: transparent;
    color: var(--hs-focus-text);
    font-size: 13px;
    font-weight: 700;
  }

  .ghost:hover {
    border-color: #5a6094;
    background: rgb(255 255 255 / 0.08);
  }

  button:active {
    transform: translateY(1px);
  }

  button:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }
</style>
