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
  import { formatPercent, type OddsRow, rarityRank } from "@headstart/core";
  import { type CrateType, RARITIES, type Rarity } from "@headstart/content";
  import {
    COVERS,
    coverStage,
    InsightIcon,
    lookFor,
    Mascot,
    MASCOT_NAMES,
    previewSpecies,
    rarityColorsLight as rarityColors,
  } from "@headstart/ui";
  import Crate from "$lib/components/Crate.svelte";
  import RevealFx from "$lib/components/RevealFx.svelte";
  import { CRATE_INFO } from "$lib/crateArt.ts";
  import { crateSoundOn, playHop, playReveal, setCrateSound } from "$lib/crateSound.ts";
  import { useApp } from "$lib/context.ts";
  import { plural } from "$lib/format.ts";
  import type { OpenedCrate } from "$lib/study.svelte.ts";

  const { study } = useApp();
  const RARITY_LABEL = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary" };
  const reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** closed → charging (hops, the glow climbs) → tell (trembles) → open (lid, bow, chest lid, door) → revealed. */
  let phase = $state<"closed" | "charging" | "tell" | "open" | "revealed">("closed");
  let hop = $state(-1);
  let hopTime = $state(0.46);
  let level = $state(0);
  let bestRank = $state(0);
  let opened = $state<OpenedCrate | null>(null);
  let openedType = $state<CrateType>("study");
  let glow = $state("transparent");
  let shown = $state(0);
  /** Bumped for every reveal, so its effect plays again. */
  let revealKey = $state(0);
  let animate = $state(true);
  let error = $state<string | null>(null);
  let equipped = $state(false);
  let sound = $state(crateSoundOn());
  let timers: ReturnType<typeof setTimeout>[] = [];

  const waiting = $derived(study.waitingCrates);
  const current = $derived(waiting[0] ?? null);
  const shownType = $derived<CrateType>(phase === "closed" ? (current?.type ?? "study") : openedType);
  const info = $derived(CRATE_INFO[shownType]);
  const odds = $derived(study.oddsFor(shownType));
  const plain = $derived(odds.filter((row) => row.guaranteedWithin === null));
  const guaranteed = $derived(odds.filter((row) => row.guaranteedWithin !== null));
  /** Items of a crate are shown one at a time, the best one last. */
  const drops = $derived(
    opened ? [...opened.drops].sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity)) : [],
  );
  const drop = $derived(drops[shown] ?? null);
  const item = $derived(drop?.item ?? null);
  const species = $derived(item ? previewSpecies(item, study.mascot ?? "maple") : (study.mascot ?? "maple"));
  const fitsMine = $derived(!!item && !!study.mascot && species === study.mascot);
  const look = $derived(
    item
      ? lookFor(species, { ...(fitsMine ? study.equippedOf(species) : {}), [item.slot]: item.id }, study.catalog)
      : null,
  );
  const set = $derived(item ? study.setOf(item) : null);
  /** "the lamp lights up" when this find added a layer to the set's cover. */
  const newLayer = $derived.by(() => {
    if (!set || !drop || drop.duplicate) return null;
    const after = coverStage(set.owned, set.total);
    const before = coverStage(set.owned - 1, set.total);
    return after > before ? (COVERS[set.set.id]?.labels[after - 1] ?? null) : null;
  });
  const onlyFor = $derived(item?.fits?.length === 1 ? item.fits[0] : null);
  const history = $derived(
    (study.state?.crates ?? [])
      .filter((c) => c.openedAt !== null)
      .slice(-5)
      .reverse(),
  );
  /** Crates still waiting besides the one on screen. */
  // The crate on screen is still waiting only while it is closed.
  const more = $derived(waiting.length - (phase === "closed" ? 1 : 0));
  /** The reveal of Epic and Legendary items waits a moment for the effect. */
  const revealDelay = $derived(!animate || !drop ? 0 : drop.rarity === "legendary" ? 0.5 : drop.rarity === "epic" ? 0.3 : 0);
  const opening = $derived(phase === "charging" || phase === "tell" || phase === "open");
  /** How long the crate trembles before it opens, by the best rarity inside. */
  const TELL = [0.12, 0.15, 0.25, 0.45, 0.7];

  const oddsColor = (row: OddsRow) => (row.rarity === "epic" ? "#C4B1FF" : "#F5B85A");

  function clearTimers(): void {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function reveal(index: number): void {
    shown = index;
    revealKey += 1;
    phase = "revealed";
    const rarity = drops[index]?.rarity;
    if (rarity) playReveal(rarity);
  }

  async function open(): Promise<void> {
    if (!current) return;
    error = null;
    equipped = false;
    openedType = current.type;
    const result = await study.openCrate(current.id);
    if (typeof result === "string") {
      error = result;
      return;
    }
    opened = result;
    animate = !reducedMotion;
    if (!animate) {
      reveal(0);
      return;
    }
    const best = result.drops.reduce<Rarity>(
      (top, d) => (rarityRank(d.rarity) > rarityRank(top) ? d.rarity : top),
      "common",
    );
    // One hop per rarity step. The glow starts grey and takes the next rarity's
    // colour on every hop, so where it stops is the best item inside.
    const rank = rarityRank(best);
    const hops = rank + 1;
    bestRank = rank;
    hopTime = 0.46 - 0.025 * (hops - 1);
    phase = "charging";
    for (let i = 0; i < hops; i++) {
      timers.push(
        setTimeout(() => {
          hop = i;
          level = i;
          glow = rarityColors[RARITIES[i] ?? "common"].dot;
          playHop(i, hopTime * 0.76);
        }, i * hopTime * 1000),
      );
    }
    const charged = hops * hopTime;
    const tell = TELL[rank] ?? 0.2;
    timers.push(setTimeout(() => (phase = "tell"), charged * 1000));
    timers.push(setTimeout(() => (phase = "open"), (charged + tell) * 1000));
    timers.push(setTimeout(() => reveal(0), (charged + tell + 0.42) * 1000));
  }

  /** A click or Space during the opening skips straight to the result. */
  function skip(): void {
    if (!opening) return;
    clearTimers();
    animate = false;
    reveal(0);
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === " " && opening) {
      event.preventDefault();
      skip();
    }
  }

  function nextItem(): void {
    equipped = false;
    animate = !reducedMotion;
    reveal(shown + 1);
  }

  async function equipNow(): Promise<void> {
    if (!item || !study.mascot) return;
    const reason = await study.equip(study.mascot, item.slot, item.id);
    error = reason;
    equipped = reason === null;
  }

  function next(): void {
    clearTimers();
    opened = null;
    phase = "closed";
    hop = -1;
    level = 0;
    glow = "transparent";
    equipped = false;
    error = null;
  }

  function toggleSound(): void {
    sound = !sound;
    setCrateSound(sound);
  }

  $effect(() => () => clearTimers());
</script>

<svelte:window onkeydown={onKey} />

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

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (Space skips too) -->
<div class="stage" onclick={skip}>
  <header class="top">
    <h1 class="visually-hidden">Crates</h1>
    <div class="chips">
      {#each guaranteed as row (row.rarity)}
        <span class="chip">Next {RARITY_LABEL[row.rarity]} within {plural(row.guaranteedIn ?? 0, "crate")}</span>
      {/each}
      {#if more > 0}
        <span class="chip">{plural(more, "more crate")} waiting</span>
      {/if}
      <button type="button" class="chip sound" aria-pressed={sound} onclick={toggleSound}>
        Sound {sound ? "on" : "off"}
      </button>
    </div>
  </header>

  {#if phase === "revealed" && drop}
    <div class="reveal" style:--ray={rarityColors[drop.rarity].dot}>
      <div class="burst">
        {#key revealKey}
          {#if animate}<RevealFx rarity={drop.rarity} color={rarityColors[drop.rarity].dot} />{/if}
        {/key}
        {#key revealKey}
        <div
          class="prize {drop.rarity}"
          class:fade={!animate}
          style:background={rarityColors[drop.rarity].bg}
          style:--delay="{revealDelay}s"
        >
          {#if animate && rarityRank(drop.rarity) >= 2}<span class="shine" aria-hidden="true"></span>{/if}
          {#if look}
            <Mascot {look} mood="celebrate" size={240} />
          {:else}
            <InsightIcon size={140} label="Insight" />
          {/if}
        </div>
        {/key}
      </div>

      <div class="details">
        <div class="tags">
          {#key revealKey}
            <span class="tag" class:stamp={animate} style:background={rarityColors[drop.rarity].fg} style:--delay="{revealDelay}s">{RARITY_LABEL[drop.rarity]}</span>
          {/key}
          {#if onlyFor}<span class="tag light only">{MASCOT_NAMES[onlyFor]} only</span>{/if}
          {#if item && !drop.duplicate}<span class="tag light new">New</span>{/if}
          {#if drop.duplicate}<span class="tag light dup">Duplicate</span>{/if}
        </div>
        <h2 aria-live="polite">{item?.name ?? "Insight"}</h2>
        {#if item?.description}<p class="text">{item.description}</p>{/if}
        {#if drop.stardust > 0}
          <p class="text dust">
            +{drop.stardust} <InsightIcon size={18} /> Insight
            {#if drop.duplicate}<span>You already had this, so it turned into Insight.</span>{/if}
          </p>
        {/if}
        {#if set && item}
          <p class="text">Part of the <b>{set.set.name}</b> set ({set.owned} of {set.total} found).</p>
          {#if newLayer}<p class="text layer"><b>{set.set.name}:</b> {newLayer}.</p>{/if}
          <div class="bar" aria-hidden="true"><div style:width="{(set.owned / set.total) * 100}%"></div></div>
        {/if}
        {#if drops.length > 1}
          <p class="text small">Item {shown + 1} of {drops.length}{shown < drops.length - 1 ? ", the best comes last" : ""}</p>
        {/if}
        <div class="actions">
          {#if shown < drops.length - 1}
            <button type="button" class="gold" onclick={nextItem}>Next item</button>
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
  {:else if waiting.length > 0 || opening}
    <div class="closed">
      <p class="eyebrow">{info.earned}</p>
      <h2>{info.name}</h2>
      <Crate
        type={shownType}
        phase={phase === "charging" || phase === "tell" || phase === "open" ? phase : "idle"}
        {hop}
        {hopTime}
        {glow}
        {level}
        float={bestRank === 4}
        gather={bestRank >= 2}
        gatherTime={(bestRank + 1) * hopTime + (TELL[bestRank] ?? 0.2)}
      />
      {@render oddsList()}
      {#if phase === "closed"}
        <button type="button" class="gold big" onclick={open}>
          Open {info.name}
        </button>
      {:else}
        <p class="text small">Click or press Space to skip</p>
      {/if}
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
                  {study.item(d.itemId)?.name ?? "Insight"}
                  <span class="muted">{RARITY_LABEL[d.rarity]}{d.duplicate ? ` · +${d.stardust} Insight` : ""}</span>
                </li>
              {/each}
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  {/if}
  <p class="footnote">Crates are earned by studying, never sold. Duplicates turn into Insight automatically.</p>
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
    align-items: center;
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

  .layer {
    color: #ffe08a;
    font-weight: 800;
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


  .chips .sound {
    min-height: 0;
    padding: 8px 12px;
    border-radius: 999px;
    line-height: inherit;
  }

  .sound {
    border: 0;
    color: inherit;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
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
    z-index: 1;
    overflow: hidden;
    /* Out of the crate: up from below, overshoot, settle, then float. */
    animation:
      cr-emerge 0.6s var(--delay, 0s) cubic-bezier(0.2, 0.8, 0.3, 1.1) both,
      cr-bob 3.2s calc(var(--delay, 0s) + 0.7s) ease-in-out infinite;
  }

  .prize.epic {
    animation-name: cr-emerge-tilt, cr-bob;
  }

  .prize.legendary {
    animation-name: cr-emerge-spin, cr-bob;
  }

  .shine {
    position: absolute;
    top: -20%;
    left: 50%;
    width: 50px;
    height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
    opacity: 0;
    animation: cr-shine 0.7s calc(var(--delay, 0s) + 0.55s) ease-in-out both;
  }

  .stamp {
    animation: cr-stamp 0.35s calc(var(--delay, 0s) + 0.45s) ease-out both;
  }

  .prize.fade {
    animation: cr-fade 0.3s ease-out both;
  }

  .details {
    position: relative;
    z-index: 1;
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


  @keyframes cr-fade {
    from {
      opacity: 0;
    }
  }

  @keyframes cr-emerge {
    0% {
      opacity: 0;
      transform: translateY(90px) scale(0.2);
    }
    55% {
      opacity: 1;
      transform: translateY(-26px) scale(1.12);
    }
    80% {
      transform: translateY(4px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes cr-emerge-tilt {
    0% {
      opacity: 0;
      transform: translateY(90px) scale(0.2) rotate(0);
    }
    55% {
      opacity: 1;
      transform: translateY(-26px) scale(1.12) rotate(-12deg);
    }
    80% {
      transform: translateY(4px) scale(0.96) rotate(3deg);
    }
    100% {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes cr-emerge-spin {
    0% {
      opacity: 0;
      transform: translateY(90px) scale(0.2) rotate(0);
    }
    55% {
      opacity: 1;
      transform: translateY(-26px) scale(1.12) rotate(300deg);
    }
    80% {
      transform: translateY(4px) scale(0.96) rotate(370deg);
    }
    100% {
      opacity: 1;
      transform: rotate(360deg);
    }
  }

  @keyframes cr-bob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -6px;
    }
  }

  @keyframes cr-shine {
    0% {
      opacity: 0;
      transform: translateX(-200px) skewX(-20deg);
    }
    20% {
      opacity: 0.85;
    }
    100% {
      opacity: 0;
      transform: translateX(200px) skewX(-20deg);
    }
  }

  @keyframes cr-stamp {
    0% {
      opacity: 0;
      transform: scale(2.2);
    }
    70% {
      opacity: 1;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
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
