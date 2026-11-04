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

<!-- Collection: dress up the mascot, browse every item (and craft missing ones with Stardust) and follow the sets. -->
<script lang="ts">
  import { ITEM_RARITIES, type Item, MASCOTS, type Slot, SLOTS } from "@headstart/content";
  import { craftBlocker, itemFits } from "@headstart/core";
  import {
    itemPreview,
    lookFor,
    Mascot,
    MASCOT_NAMES,
    MASCOT_SPECIES,
    MASCOT_TINTS,
    type Mood,
    previewSpecies,
    rarityColors,
    StardustIcon,
  } from "@headstart/ui";
  import BuddyPicker from "$lib/components/BuddyPicker.svelte";
  import LazyMascot from "$lib/components/LazyMascot.svelte";
  import Select from "$lib/components/Select.svelte";
  import { useApp } from "$lib/context.ts";

  const { study } = useApp();

  const TABS = [
    ["wardrobe", "Wardrobe"],
    ["items", "All items"],
    ["sets", "Sets"],
  ] as const;
  type Tab = (typeof TABS)[number][0];

  const SLOT_INFO: Record<Slot, { title: string; plural: string; note: string }> = {
    skin: { title: "Skin", plural: "Skins", note: "Each mascot has its own skins. Legendary ones are animated." },
    head: { title: "Head", plural: "Head", note: "Hats and headwear" },
    face: { title: "Face", plural: "Face", note: "Glasses and the like" },
    outfit: { title: "Outfit", plural: "Outfit", note: "Scarves, ties, medals, hoodies and capes" },
    held: { title: "Held item", plural: "Held", note: "Study gear in the right hand" },
    aura: { title: "Aura", plural: "Aura", note: "Effects around the mascot" },
  };
  const RARITY_LABEL = { common: "Common", uncommon: "Uncommon", rare: "Rare", epic: "Epic", legendary: "Legendary", exotic: "Exotic" };
  /** Stardust to craft an item. Exotic items are never crafted, so they have no price. */
  const craftCost = (item: Item) => (item.rarity === "exotic" ? 0 : study.context.crates.craftCost[item.rarity]);
  const TRY_MOODS: Mood[] = ["idle", "focus", "celebrate", "sleepy", "welcome"];

  let tab = $state<Tab>("wardrobe");
  let mood = $state<Mood>("idle");
  let slotFilter = $state<Slot | "all">("all");
  let found = $state<"all" | "found" | "missing">("all");
  let selectedId = $state<string | null>(null);
  let message = $state<string | null>(null);

  const mascot = $derived(study.mascot);
  const equipped = $derived(mascot ? study.equippedOf(mascot) : {});
  const stardust = $derived(study.summary?.stardust ?? 0);

  const sorted = $derived(
    [...study.catalog].sort(
      (a, b) =>
        SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) ||
        ITEM_RARITIES.indexOf(a.rarity) - ITEM_RARITIES.indexOf(b.rarity) ||
        a.name.localeCompare(b.name),
    ),
  );
  const shown = $derived(
    sorted.filter((item) => {
      if (slotFilter !== "all" && item.slot !== slotFilter) return false;
      const owned = study.owned(item.id) > 0;
      if (found === "found") return owned;
      if (found === "missing") return !owned;
      return item.dropsFromCrates !== false || owned;
    }),
  );
  const selected = $derived(study.item(selectedId));

  /** Owned items for one slot that the current mascot can wear. */
  function wearable(slot: Slot): Item[] {
    if (!mascot) return [];
    return sorted.filter((item) => item.slot === slot && study.owned(item.id) > 0 && itemFits(item, mascot));
  }

  function fitsLabel(item: Item): string | null {
    if (!item.fits) return null;
    if (item.fits.length === 1) return `${MASCOT_NAMES[item.fits[0] ?? "maple"]} only`;
    return `${item.fits.map((m) => MASCOT_NAMES[m]).join(" and ")} only`;
  }

  function preview(item: Item) {
    return itemPreview(item, previewSpecies(item, mascot ?? "maple"), study.catalog);
  }

  async function equip(slot: Slot, itemId: string | null): Promise<void> {
    if (!mascot) return;
    message = await study.equip(mascot, slot, itemId);
  }

  async function craft(item: Item): Promise<void> {
    const reason = await study.craft(item.id);
    message = reason ?? `${item.name} crafted for ${craftCost(item)} Stardust.`;
  }

  function onTabKey(event: KeyboardEvent, index: number): void {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    tab = TABS[next]?.[0] ?? "wardrobe";
    document.getElementById(`tab-${tab}`)?.focus();
  }
</script>

<header class="top">
  <div>
    <p class="eyebrow">Everything you have earned by studying</p>
    <h1>Collection</h1>
  </div>
  <div class="pills">
    <span class="pill">{study.collection.owned} of {study.collection.total} items</span>
    <span class="pill">{stardust} <StardustIcon size={14} /> Stardust</span>
  </div>
</header>

<div class="tabs" role="tablist" aria-label="Collection">
  {#each TABS as [id, label], i (id)}
    <button
      type="button"
      role="tab"
      id="tab-{id}"
      aria-selected={tab === id}
      aria-controls="panel-{id}"
      tabindex={tab === id ? 0 : -1}
      onclick={() => (tab = id)}
      onkeydown={(e) => onTabKey(e, i)}
    >
      {label}
    </button>
  {/each}
</div>

{#if message}
  <p class="notice" role="status">
    {message}
    <button type="button" class="link" onclick={() => (message = null)}>Dismiss</button>
  </p>
{/if}

{#if tab === "wardrobe"}
  <div class="wardrobe" role="tabpanel" id="panel-wardrobe" aria-labelledby="tab-wardrobe">
    {#if !mascot || !study.look}
      <BuddyPicker {study} />
    {:else}
      <section class="card stagebox" aria-label="{MASCOT_NAMES[mascot]} preview">
        <div class="preview" style:background={MASCOT_TINTS[mascot]}>
          <Mascot look={study.look} {mood} size={280} />
        </div>
        <div class="group">
          <h2>Mascot</h2>
          <div class="chips">
            {#each MASCOTS as m (m)}
              <button type="button" class="chip" aria-pressed={m === mascot} onclick={() => study.chooseMascot(m)}>
                {MASCOT_NAMES[m]} <span class="muted">the {MASCOT_SPECIES[m]}</span>
              </button>
            {/each}
          </div>
          <p class="note">Each mascot keeps its own outfit, so switching back brings it all back.</p>
        </div>
        <div class="group">
          <h2>Try a mood</h2>
          <div class="chips">
            {#each TRY_MOODS as m (m)}
              <button type="button" class="chip" aria-pressed={m === mood} onclick={() => (mood = m)}>
                {m[0]?.toUpperCase()}{m.slice(1)}
              </button>
            {/each}
          </div>
        </div>
      </section>

      <section class="card slots" aria-label="What {MASCOT_NAMES[mascot]} wears">
        {#each SLOTS as slot (slot)}
          {@const options = wearable(slot)}
          <div class="slot">
            <div class="slot-head">
              <h2>{SLOT_INFO[slot].title}</h2>
              <p class="note">{SLOT_INFO[slot].note}</p>
            </div>
            <div class="chips">
              {#if slot !== "skin"}
                <button type="button" class="chip" aria-pressed={!equipped[slot]} onclick={() => equip(slot, null)}>None</button>
              {/if}
              {#each options as item (item.id)}
                <button
                  type="button"
                  class="chip"
                  aria-pressed={equipped[slot] === item.id || (slot === "skin" && !equipped.skin && item.starter)}
                  onclick={() => equip(slot, item.id)}
                >
                  <span class="dot" style:background={rarityColors[item.rarity].dot} aria-hidden="true"></span>
                  {item.name}
                  <span class="rarity" style:color={rarityColors[item.rarity].fg} style:background={rarityColors[item.rarity].bg}>
                    {RARITY_LABEL[item.rarity]}
                  </span>
                </button>
              {/each}
              {#if options.length === 0 && slot !== "skin"}
                <p class="note">Nothing yet. Open crates to find some.</p>
              {/if}
            </div>
          </div>
        {/each}
      </section>
    {/if}
  </div>
{:else if tab === "items"}
  <div class="items" role="tabpanel" id="panel-items" aria-labelledby="tab-items">
    <div class="filters">
      <div class="chips" role="group" aria-label="Slot">
        <button type="button" class="chip" aria-pressed={slotFilter === "all"} onclick={() => (slotFilter = "all")}>All</button>
        {#each SLOTS as slot (slot)}
          <button type="button" class="chip" aria-pressed={slotFilter === slot} onclick={() => (slotFilter = slot)}>
            {SLOT_INFO[slot].plural}
          </button>
        {/each}
      </div>
      <div class="show">
        <span id="show-label">Show</span>
        <Select
          bind:value={found}
          id="show-select"
          label="Show"
          groups={[{ label: "", options: [
            { value: "all", label: "Everything" },
            { value: "found", label: "Found" },
            { value: "missing", label: "Not found yet" },
          ] }]}
        />
      </div>
    </div>

    <div class="browse">
      <ul class="grid" aria-label="Items">
        {#each shown as item (item.id)}
          {@const owned = study.owned(item.id) > 0}
          <li>
            <button
              type="button"
              class="item"
              class:exotic={item.rarity === "exotic"}
              aria-pressed={selectedId === item.id}
              style:border-bottom-color={rarityColors[item.rarity].dot}
              onclick={() => (selectedId = item.id)}
            >
              <span class="thumb" style:background={owned ? MASCOT_TINTS[previewSpecies(item, mascot ?? "maple")] : "#ECEEF2"}>
                <LazyMascot look={preview(item)} size={96} grey={!owned} />
              </span>
              <span class="item-name">{item.name}</span>
              <span class="item-rarity" style:color={rarityColors[item.rarity].fg}>
                {RARITY_LABEL[item.rarity]}{owned ? "" : " · not found"}
              </span>
            </button>
          </li>
        {/each}
      </ul>

      <aside class="card detail" aria-live="polite">
        {#if selected}
          {@const owned = study.owned(selected.id) > 0}
          {@const blocker = craftBlocker(selected, stardust, study.state?.inventory ?? new Map(), study.context.crates)}
          {@const set = study.setOf(selected)}
          <div class="detail-art" style:background={MASCOT_TINTS[previewSpecies(selected, mascot ?? "maple")]}>
            <Mascot look={preview(selected)} size={200} grey={!owned} />
          </div>
          <div class="tags">
            <span class="rarity" style:color={rarityColors[selected.rarity].fg} style:background={rarityColors[selected.rarity].bg}>
              {RARITY_LABEL[selected.rarity]}
            </span>
            <span class="tag">{SLOT_INFO[selected.slot].title}</span>
            {#if fitsLabel(selected)}<span class="tag only">{fitsLabel(selected)}</span>{/if}
            {#if selected.animated}<span class="tag">Animated</span>{/if}
          </div>
          <h2>{selected.name}</h2>
          {#if selected.description}<p class="note">{selected.description}</p>{/if}
          {#if set}<p class="note">Part of the <b>{set.set.name}</b> set, {set.owned} of {set.total} found.</p>{/if}
          {#if owned}
            <p class="have">In your collection</p>
            {#if mascot && itemFits(selected, mascot)}
              {#if equipped[selected.slot] === selected.id}
                <p class="note">{MASCOT_NAMES[mascot]} is wearing it.</p>
              {:else}
                <button type="button" class="primary" onclick={() => equip(selected.slot, selected.id)}>
                  Put it on {MASCOT_NAMES[mascot]}
                </button>
              {/if}
            {/if}
          {:else if selected.grantOnly}
            <p class="note">Exotic items are never in crates. They are only given, one by one.</p>
          {:else if selected.craftable === false || selected.season}
            <p class="note">Only found in crates. It cannot be crafted.</p>
          {:else}
            <button type="button" class="primary" disabled={blocker !== null} onclick={() => craft(selected)}>
              Craft for {craftCost(selected)} <StardustIcon size={16} />
            </button>
            {#if blocker}<p class="note">{blocker}.</p>{/if}
          {/if}
        {:else}
          <h2>Pick an item</h2>
          <p class="note">
            See where it belongs, put it on your mascot, or craft it with Stardust if you have not found it yet.
            Duplicates from crates turn into Stardust.
          </p>
        {/if}
      </aside>
    </div>
  </div>
{:else}
  <div class="sets" role="tabpanel" id="panel-sets" aria-labelledby="tab-sets">
    {#each study.sets as progress (progress.set.id)}
      {@const members = sorted.filter((i) => i.set === progress.set.id)}
      {@const foundNames = members.filter((i) => study.owned(i.id) > 0).map((i) => i.name)}
      <article class="card set">
        <div class="set-art" style:background={progress.set.tint}>
          {#each members.filter((i) => study.owned(i.id) > 0).slice(0, 4) as item (item.id)}
            <LazyMascot look={preview(item)} size={72} />
          {:else}
            <span class="note">Nothing found yet</span>
          {/each}
        </div>
        <div class="set-head">
          <h2>{progress.set.name}</h2>
          <span class="count">{progress.owned} of {progress.total}</span>
        </div>
        <div
          class="bar"
          role="progressbar"
          aria-label="{progress.set.name} set"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.owned}
        >
          <div style:width="{(progress.owned / progress.total) * 100}%" style:background={progress.set.color}></div>
        </div>
        <p class="note">{progress.set.description}</p>
        <p class="members">
          {[...foundNames, `${members.length - foundNames.length} more to find`].join(" · ")}
        </p>
      </article>
    {/each}
  </div>
{/if}

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 18px;
  }

  .eyebrow {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.1rem;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.15rem;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    border: 1px solid var(--hs-line);
    border-radius: 999px;
    background: var(--hs-surface);
    font-size: 13px;
    font-weight: 800;
  }

  .tabs {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 18px;
    padding: 5px;
    border-radius: 14px;
    background: #e6e9f1;
  }

  .tabs button {
    min-height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    font: inherit;
    font-weight: 800;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .tabs button[aria-selected="true"] {
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .card {
    padding: 20px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .wardrobe {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 18px;
  }

  .stagebox {
    flex: 1 1 320px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 320px;
    border-radius: 16px;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .slots {
    flex: 999 1 460px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .slot {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .slot-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 10px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 6px 12px;
    box-sizing: border-box;
    border: 2px solid var(--hs-line);
    border-radius: 12px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--hs-ink);
    cursor: pointer;
  }

  .chip[aria-pressed="true"] {
    border-color: var(--hs-accent);
    background: #f1efff;
  }

  .dot {
    width: 10px;
    height: 10px;
    flex: none;
    border-radius: 999px;
  }

  .rarity,
  .tag {
    padding: 3px 7px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .tag {
    background: #eceef2;
    color: #4b5468;
  }

  .tag.only {
    background: #ffe7a8;
    color: var(--hs-ink);
    letter-spacing: 0;
    text-transform: none;
  }

  .note {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--hs-ink-muted);
  }

  .muted {
    font-weight: 600;
    color: var(--hs-ink-subtle);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .show {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }

  /* The detail sits beside the grid, or above it when the window is narrow.
     With wrap-reverse the cross axis runs bottom to top, so flex-end means top. */
  .browse {
    display: flex;
    flex-wrap: wrap-reverse;
    align-items: flex-end;
    gap: 18px;
  }

  .grid {
    flex: 999 1 420px;
    min-width: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
    gap: 12px;
  }

  .item {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 8px 12px;
    border: 1px solid var(--hs-line);
    border-bottom: 4px solid;
    border-radius: 16px;
    background: var(--hs-surface);
    font: inherit;
    color: var(--hs-ink);
    cursor: pointer;
  }

  /* Exotic: a slowly shifting ruby and gold frame. */
  .item.exotic {
    border: 2px solid transparent;
    background:
      linear-gradient(var(--hs-surface), var(--hs-surface)) padding-box,
      linear-gradient(120deg, #d7263d, #f5c542, #d7263d, #f5c542) border-box;
    background-size: 100% 100%, 300% 300%;
    animation: exotic-frame 6s ease-in-out infinite;
  }

  @keyframes exotic-frame {
    0%,
    100% {
      background-position: 0 0, 0% 50%;
    }
    50% {
      background-position: 0 0, 100% 50%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .item.exotic {
      animation: none;
    }
  }

  .item[aria-pressed="true"] {
    outline: 3px solid var(--hs-accent);
    outline-offset: 1px;
  }

  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 104px;
    height: 104px;
    border-radius: 12px;
  }

  .item-name {
    font-size: 14px;
    font-weight: 800;
    text-align: center;
  }

  .item-rarity {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .detail {
    flex: 1 1 260px;
    position: sticky;
    top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .detail-art {
    display: flex;
    justify-content: center;
    padding: 8px 0;
    border-radius: 14px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .have {
    margin: 0;
    font-weight: 800;
    color: var(--hs-success-strong);
  }

  .primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 46px;
    padding: 0 18px;
    border: 0;
    border-radius: 12px;
    background: var(--hs-accent);
    color: #fff;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .sets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .set {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .set-art {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 90px;
    border-radius: 12px;
  }

  .set-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .count {
    font-size: 13px;
    font-weight: 800;
  }

  .bar {
    height: 8px;
    border-radius: 999px;
    background: #eceef2;
    overflow: hidden;
  }

  .bar div {
    height: 100%;
  }

  .members {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--hs-ink-subtle);
  }

  .notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: 0 0 18px;
    padding: 12px 16px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-accent-soft);
    font-weight: 700;
  }

  .link {
    min-height: 28px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--hs-accent-strong);
    text-decoration: underline;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
