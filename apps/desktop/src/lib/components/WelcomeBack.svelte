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

<!-- Welcome back: shown on Today after a week or more without a session. Nothing about what was missed; the week's goal is halved and a crate waits. -->
<script lang="ts">
  import { MASCOT_TINTS, Mascot } from "@headstart/ui";
  import { plural } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const weeks = $derived(study.weeks);
  const goal = $derived(weeks?.current.goal ?? 0);
  const usual = $derived(study.settings.studyDays);
  const reviews = $derived(study.reviewsToday.length);
</script>

{#if weeks?.welcomeBack}
  <section class="card" aria-labelledby="wb-h">
    <div class="top">
      {#if study.look && study.mascot}
        <div class="buddy" style:background={MASCOT_TINTS[study.mascot]}>
          <Mascot look={study.look} mood="welcome" size={132} />
        </div>
      {/if}
      <div class="words">
        <p class="bubble">Good to see you again!</p>
        <h2 id="wb-h">Welcome back</h2>
        <p>Nothing to catch up on. We start from today.</p>
      </div>
    </div>
    <ul>
      {#if goal < usual}
        <li><b>This week's goal is halved:</b> {plural(goal, "study day")}, not {usual}. Next week it is back to yours.</li>
      {/if}
      {#if study.waitingCrates.length > 0}
        <li class="gift"><span><b>A Study Crate is waiting,</b> just for coming back.</span><a href="/crates">Open it</a></li>
      {/if}
      {#if reviews > 0}
        <li><b>Reviews do not pile up:</b> {plural(reviews, "review")} today at most, the rest are spread over the coming days.</li>
      {/if}
    </ul>
    <div class="buttons">
      <button type="button" class="primary" disabled={!study.ready} onclick={() => study.start({ auto: true, minutes: 5 })}>Start with just 5 minutes</button>
      <button type="button" class="secondary" disabled={!study.ready} onclick={() => study.start({ auto: true })}>Start {study.settings.focusMinutes} min</button>
    </div>
  </section>
{/if}

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 18px;
    padding: 22px;
    border: 2px solid var(--hs-accent);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
  }

  .buddy {
    flex: none;
    display: grid;
    place-items: center;
    width: 156px;
    height: 156px;
    border-radius: 22px;
  }

  .words {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .bubble {
    padding: 8px 14px;
    border-radius: 14px 14px 14px 4px;
    background: var(--hs-accent-soft);
    font-weight: 700;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.6rem;
  }

  p {
    margin: 0;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ul:empty {
    display: none;
  }

  li {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--hs-ground);
    font-size: 14.5px;
    line-height: 1.45;
  }

  .gift {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: var(--hs-gold-soft);
  }

  .gift a {
    font-weight: 800;
    color: var(--hs-accent-strong);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
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
    color: var(--hs-on-accent);
  }

  .secondary {
    border: 1px solid var(--hs-field-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
