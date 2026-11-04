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

<!-- Crates: open the Study Crates you have earned, with the odds shown before you open one. -->
<script lang="ts">
  import { formatPercent, type OddsRow } from "@headstart/core";
  import { lookFor, Mascot, MASCOT_NAMES, previewSpecies, rarityColorsLight as rarityColors, StardustIcon } from "@headstart/ui";
  import StudyCrate from "$lib/components/StudyCrate.svelte";
  import { useApp } from "$lib/context.ts";
  import { plural } from "$lib/format.ts";
  import type { OpenedCrate } from "$lib/study.svelte.ts";

  const { study } = useApp();
  const RARITY_LABEL = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary" };
  const reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let phase = $state<"closed" | "opening" | "revealed">("closed");
  let opened = $state<OpenedCrate | null>(null);
  let shown = $state(0);
  let error = $state<string | null>(null);
  let equipped = $state(false);

  const waiting = $derived(study.waitingCrates);
  const odds = $derived(study.summary?.studyCrateOdds ?? []);
  const plain = $derived(odds.filter((row) => row.guaranteedWithin === null));
  const guaranteed = $derived(odds.filter((row) => row.guaranteedWithin !== null));
  const drop = $derived(opened?.drops[shown] ?? null);
  const item = $derived(drop?.item ?? null);
  const species = $derived(item ? previewSpecies(item, study.mascot ?? "maple") : (study.mascot ?? "maple"));
  const fitsMine = $derived(!!item && !!study.mascot && species === study.mascot);
  const look = $derived(
    item
      ? lookFor(species, { ...(fitsMine ? study.equippedOf(species) : {}), [item.slot]: item.id }, study.catalog)
      : null,
  );
  const set = $derived(item ? study.setOf(item) : null);
  const onlyFor = $derived(item?.fits?.length === 1 ? item.fits[0] : null);
  const history = $derived(
    (study.state?.crates ?? [])
      .filter((c) => c.openedAt !== null)
      .slice(-5)
      .reverse(),
  );
  /** Crates still waiting besides the one on screen. */
  const more = $derived(waiting.length - (phase === "revealed" ? 0 : 1));

  const oddsColor = (row: OddsRow) => (row.rarity === "epic" ? "#C4B1FF" : "#F5B85A");

  async function open(): Promise<void> {
    error = null;
    equipped = false;
    phase = "opening";
    const [result] = await Promise.all([
      study.openCrate(),
      new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : 900)),
    ]);
    if (typeof result === "string") {
      error = result;
      phase = "closed";
      return;
    }
    opened = result;
    shown = 0;
    phase = "revealed";
  }

  async function equipNow(): Promise<void> {
    if (!item || !study.mascot) return;
    const reason = await study.equip(study.mascot, item.slot, item.id);
    error = reason;
    equipped = reason === null;
  }

  function next(): void {
    opened = null;
    phase = "closed";
    equipped = false;
    error = null;
  }
</script>

{#snippet oddsList()}
  <div class="odds">
    <p>{plain.map((row) => `${RARITY_LABEL[row.rarity]} ${formatPercent(row.percent)}`).join(" · ")}</p>
    {#each guaranteed as row (row.rarity)}
      <p>
        <strong style:color={oddsColor(row)}>{RARITY_LABEL[row.rarity]} {formatPercent(row.percent)}</strong>
        · guaranteed within {plural(row.guaranteedWithin ?? 0, "crate")}
      </p>
    {/each}
  </div>
{/snippet}

<div class="stage">
  <header class="top">
    <h1 class="visually-hidden">Crates</h1>
    <div class="chips">
      {#each guaranteed as row (row.rarity)}
        <span class="chip">Next {RARITY_LABEL[row.rarity]} within {plural(row.guaranteedIn ?? 0, "crate")}</span>
      {/each}
      {#if more > 0}
        <span class="chip">{plural(more, "more crate")} waiting</span>
      {/if}
    </div>
  </header>

  {#if phase === "revealed" && drop}
    <div class="reveal" style:--ray={rarityColors[drop.rarity].dot}>
      <div class="burst">
        <svg class="rays" viewBox="0 0 380 380" aria-hidden="true">
          <g fill="var(--ray)" opacity="0.22">
            <polygon points="190,190 180,0 200,0" />
            <polygon points="190,190 180,380 200,380" />
            <polygon points="190,190 0,180 0,200" />
            <polygon points="190,190 380,180 380,200" />
            <polygon points="190,190 50,40 64,30" />
            <polygon points="190,190 330,340 316,350" />
            <polygon points="190,190 340,50 330,36" />
            <polygon points="190,190 40,330 50,344" />
          </g>
          <circle cx="190" cy="190" r="130" fill="var(--ray)" opacity="0.18" />
        </svg>
        <div class="prize" style:background={rarityColors[drop.rarity].bg}>
          {#if look}
            <Mascot {look} mood="celebrate" size={240} />
          {:else}
            <StardustIcon size={140} label="Stardust" />
          {/if}
        </div>
      </div>

      <div class="details">
        <div class="tags">
          <span class="tag" style:background={rarityColors[drop.rarity].fg}>{RARITY_LABEL[drop.rarity]}</span>
          {#if onlyFor}<span class="tag light only">{MASCOT_NAMES[onlyFor]} only</span>{/if}
          {#if item && !drop.duplicate}<span class="tag light new">New</span>{/if}
          {#if drop.duplicate}<span class="tag light dup">Duplicate</span>{/if}
        </div>
        <h2 aria-live="polite">{item?.name ?? "Stardust"}</h2>
        {#if item?.description}<p class="text">{item.description}</p>{/if}
        {#if drop.stardust > 0}
          <p class="text dust">
            +{drop.stardust} <StardustIcon size={18} /> Stardust
            {#if drop.duplicate}<span>You already had this, so it turned into Stardust.</span>{/if}
          </p>
        {/if}
        {#if set && item}
          <p class="text">Part of the <b>{set.set.name}</b> set ({set.owned} of {set.total} found).</p>
          <div class="bar" aria-hidden="true"><div style:width="{(set.owned / set.total) * 100}%"></div></div>
        {/if}
        {#if opened && opened.drops.length > 1}
          <p class="text small">Item {shown + 1} of {opened.drops.length}</p>
        {/if}
        <div class="actions">
          {#if opened && shown < opened.drops.length - 1}
            <button type="button" class="gold" onclick={() => (shown += 1)}>Next item</button>
          {:else if waiting.length > 0}
            <button type="button" class="gold" onclick={next}>Open next crate</button>
          {/if}
          {#if item && fitsMine && !drop.duplicate}
            {#if equipped}
              <span class="done" role="status">Equipped on {MASCOT_NAMES[species]}</span>
            {:else}
              <button type="button" class="lavender" onclick={equipNow}>Equip now</button>
            {/if}
          {/if}
          <a class="ghost" href="/collection">See your collection</a>
        </div>
        {#if error}<p class="error" role="alert">{error}</p>{/if}
      </div>
    </div>
  {:else if waiting.length > 0 || phase === "opening"}
    <div class="closed">
      <p class="eyebrow">Earned for {plural(study.context.rewards.studyCrateEvery, "focus session")}</p>
      <h2>Study Crate</h2>
      <StudyCrate shaking={phase === "opening"} />
      {@render oddsList()}
      <button type="button" class="gold big" disabled={phase === "opening"} onclick={open}>
        {phase === "opening" ? "Opening…" : "Open crate"}
      </button>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
    </div>
  {:else}
    <div class="closed">
      <h2>No crates waiting</h2>
      <p class="text">
        You earn a Study Crate for every {plural(study.context.rewards.studyCrateEvery, "focus session")} of
        {study.context.rewards.minMinutesForCrate} minutes or more.
        {#if study.summary}
          {study.summary.crateProgress} of {study.summary.crateEvery} done towards the next one.
        {/if}
      </p>
      <div
        class="bar wide"
        role="progressbar"
        aria-label="Sessions towards the next crate"
        aria-valuemin={0}
        aria-valuemax={study.summary?.crateEvery ?? 3}
        aria-valuenow={study.summary?.crateProgress ?? 0}
      >
        <div style:width="{((study.summary?.crateProgress ?? 0) / (study.summary?.crateEvery ?? 3)) * 100}%"></div>
      </div>
      {@render oddsList()}
      <a class="lavender" href="/">Back to Today</a>
      {#if history.length > 0}
        <section class="history" aria-labelledby="history-h">
          <h3 id="history-h">Recently opened</h3>
          <ul>
            {#each history as crate (crate.id)}
              {#each crate.drops as d, i (i)}
                <li>
                  <span class="dot" style:background={rarityColors[d.rarity].dot} aria-hidden="true"></span>
                  {study.item(d.itemId)?.name ?? "Stardust"}
                  <span class="muted">{RARITY_LABEL[d.rarity]}{d.duplicate ? ` · +${d.stardust} Stardust` : ""}</span>
                </li>
              {/each}
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  {/if}
  <p class="footnote">Crates are earned by studying, never sold. Duplicates turn into Stardust automatically.</p>
</div>

<style>
  .stage {
    min-height: calc(100vh - 78px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    border-radius: var(--hs-radius-lg);
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
  }

  .top {
    display: flex;
    justify-content: flex-end;
    min-height: 34px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .chip {
    padding: 8px 12px;
    border-radius: 999px;
    background: #2a2f55;
    font-size: 13px;
    font-weight: 800;
  }

  .closed {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    text-align: center;
  }

  .eyebrow {
    margin: 0;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9c2ff;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.4rem;
    line-height: 1.05;
  }

  .odds {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .odds p,
  .text {
    margin: 0;
    max-width: 520px;
    font-size: 15px;
    line-height: 1.5;
    color: var(--hs-focus-text-muted);
  }

  .text b {
    color: var(--hs-focus-text);
  }

  .text.small {
    font-size: 13px;
  }

  .dust {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: #ffe08a;
    font-weight: 800;
  }

  .dust span {
    flex-basis: 100%;
    color: var(--hs-focus-text-muted);
    font-weight: 600;
  }

  .reveal {
    flex: 1 1 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 40px;
  }

  .burst {
    position: relative;
    width: 360px;
    max-width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rays {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    animation: cr-spin 30s linear infinite;
  }

  .prize {
    /* The prize card is light in both themes, so the mascot keeps the light shadow. */
    --hs-mascot-shadow: #1b2236;
    --hs-mascot-shadow-opacity: 0.13;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 260px;
    height: 260px;
    border: 4px solid var(--ray);
    border-radius: 28px;
    animation: cr-pop 0.6s ease-out both;
  }

  .details {
    flex: 0 1 420px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #fff;
  }

  .tag.light {
    letter-spacing: 0;
    text-transform: none;
    color: var(--hs-focus-ground);
  }

  .only {
    background: #ffe7a8;
  }

  .new {
    background: #9be7d5;
  }

  .dup {
    background: #d5dae5;
  }

  .bar {
    height: 8px;
    border-radius: 999px;
    background: #2a2f55;
    overflow: hidden;
  }

  .bar.wide {
    width: min(420px, 100%);
  }

  .bar div {
    height: 100%;
    background: #9be7d5;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
  }

  button,
  a.lavender,
  a.ghost {
    display: inline-flex;
    align-items: center;
    min-height: 50px;
    padding: 0 22px;
    border-radius: 14px;
    font: inherit;
    font-size: 15px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  .gold {
    border: 0;
    background: #f5c542;
    color: var(--hs-focus-ground);
  }

  .gold.big {
    min-height: 56px;
    padding: 0 34px;
    font-size: 18px;
  }

  .lavender {
    border: 0;
    background: var(--hs-focus-accent);
    color: var(--hs-focus-ground);
  }

  .ghost {
    border: 1px solid #3a4070;
    background: transparent;
    color: #dde1f0;
  }

  button:disabled {
    opacity: 0.7;
    cursor: default;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--hs-focus-accent);
    outline-offset: 2px;
  }

  .done {
    font-weight: 800;
    color: #9be7d5;
  }

  .error {
    margin: 0;
    color: #ffb4a8;
    font-weight: 700;
  }

  .history {
    width: min(420px, 100%);
    text-align: left;
  }

  h3 {
    margin: 10px 0 8px;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hs-focus-text-muted);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }

  .muted {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-focus-text-muted);
  }

  .footnote {
    margin: 0;
    font-size: 13px;
    text-align: center;
    color: var(--hs-focus-text-muted);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @keyframes cr-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes cr-pop {
    0% {
      transform: scale(0.6);
      opacity: 0;
    }
    70% {
      transform: scale(1.05);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }
</style>
