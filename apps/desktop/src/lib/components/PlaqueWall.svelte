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

<!-- The plaque wall: every plaque at the tier you hold, with a bar towards the next. Opening one shows all its tiers. -->
<script lang="ts">
  import { PLAQUE_GROUPS } from "@headstart/content";
  import { GROUP_NAMES, type PlaqueCard, plaqueCards, plaqueTitle, TIER_NUMERALS, tierWords } from "$lib/plaques.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import Plaque from "./Plaque.svelte";

  let { study }: { study: Study } = $props();

  const cards = $derived(plaqueCards(study));
  const groups = $derived(
    PLAQUE_GROUPS.map((group) => ({ group, cards: cards.filter((c) => c.def.group === group) })).filter((g) => g.cards.length > 0),
  );
  const tiersHeld = $derived(cards.reduce((sum, c) => sum + c.tier, 0));
  const tiersInAll = $derived(cards.reduce((sum, c) => sum + c.def.tiers.length, 0));

  let openId = $state<string | null>(null);
  const open = $derived(cards.find((c) => c.id === openId) ?? null);

  const pct = (c: PlaqueCard) => (c.next ? Math.min(100, Math.round((c.count / c.next) * 100)) : 100);
  const count = (n: number) => n.toLocaleString("en-GB");
</script>

<div class="wall" role="tabpanel" id="panel-plaques" aria-labelledby="tab-plaques">
  <p class="lead">
    {tiersHeld} of {tiersInAll} tiers earned. A plaque starts as a plain shield and gets grander each time you pass its next number.
  </p>
  {#each groups as { group, cards: list } (group)}
    <section aria-labelledby="pl-{group}">
      <h2 id="pl-{group}">{GROUP_NAMES[group]}</h2>
      <ul class="grid">
        {#each list as c (c.id)}
          <li>
            <button type="button" class="card" class:none={c.tier === 0} aria-haspopup="dialog" disabled={c.hidden} onclick={() => (openId = c.id)}>
              <Plaque group={c.def.group} icon={c.hidden ? "question" : c.def.icon} tier={c.tier} tiers={c.def.tiers.length} size={84} faded={c.tier === 0} />
              <span class="name">{c.hidden ? "Secret" : plaqueTitle(c.def, c.tier)}</span>
              <span class="what">{c.hidden ? "Keep studying to find out" : tierWords(c.def, c.tier + (c.next ? 1 : 0))}</span>
              {#if c.hidden}
                <span class="progress">Hidden</span>
              {:else if c.next !== null && c.def.tiers.length > 1}
                <span class="bar" aria-hidden="true"><span style:width="{pct(c)}%"></span></span>
                <span class="progress">{count(Math.min(c.count, c.next))} of {count(c.next)}</span>
              {:else if c.next !== null}
                <span class="progress">Not yet</span>
              {:else}
                <span class="progress done">{c.def.tiers.length > 1 ? "Top tier" : "Earned"}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

{#if open}
  <div class="backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && (openId = null)}>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plaque-title"
      tabindex="-1"
      onkeydown={(e) => {
        if (e.key === "Escape") openId = null;
      }}
    >
      <h2 id="plaque-title">{plaqueTitle(open.def, open.tier)}</h2>
      {#if open.def.tiers.length > 1}
        <p class="lead">
          {#if open.tier === 0}Not started yet.{:else if open.next === null}You hold the top tier.{:else}Tier {TIER_NUMERALS[open.tier - 1]} of five.{/if}
          {#if open.next !== null}You are at {count(open.count)} of {count(open.next)} for the next one.{/if}
        </p>
        <ol class="tiers">
          {#each open.def.tiers as _, i (i)}
            <li class:held={i < open.tier}>
              <Plaque group={open.def.group} icon={open.def.icon} tier={i + 1} size={78} faded={i >= open.tier} />
              <b>{TIER_NUMERALS[i]}</b>
              <span>{tierWords(open.def, i + 1)}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <div class="single">
          <Plaque group={open.def.group} icon={open.def.icon} tier={1} tiers={1} size={110} faded={open.tier === 0} />
          <p class="lead">{tierWords(open.def, 1)}. {open.tier > 0 ? "Earned." : "Not yet."}</p>
        </div>
      {/if}
      <div class="foot">
        <!-- svelte-ignore a11y_autofocus -->
        <button type="button" class="primary" autofocus onclick={() => (openId = null)}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .wall {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .lead {
    margin: 0;
    color: var(--hs-ink-muted);
  }

  h2 {
    margin: 0 0 10px;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.2rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .card {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 12px;
    border: 1px solid var(--hs-line);
    border-radius: 18px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font: inherit;
    text-align: center;
    cursor: pointer;
  }

  .card:disabled {
    cursor: default;
  }

  .card:not(:disabled):hover {
    border-color: var(--hs-accent);
  }

  .name {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 16px;
    line-height: 1.2;
  }

  .what {
    flex: 1 1 auto;
    font-size: 13px;
    line-height: 1.35;
    color: var(--hs-ink-muted);
  }

  .bar {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: var(--hs-line);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--hs-accent);
  }

  .progress {
    font-size: 12px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .progress.done {
    color: var(--hs-success-strong);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--hs-backdrop);
  }

  .dialog {
    width: min(640px, calc(100vw - 40px));
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 22px 24px;
    border-radius: 24px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    box-shadow: var(--hs-shadow-dialog);
  }

  .dialog h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .tiers {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tiers li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
    font-size: 12.5px;
    line-height: 1.3;
    color: var(--hs-ink-muted);
  }

  .tiers li.held {
    color: var(--hs-ink);
  }

  .tiers b {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 15px;
  }

  .single {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .foot {
    display: flex;
    justify-content: flex-end;
  }

  .primary {
    min-height: 44px;
    padding: 0 20px;
    border: 0;
    border-radius: 12px;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  @media (max-width: 620px) {
    .tiers {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
