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

<!-- Rows that tell about plaque tiers earned just now: on Session complete, and on Today for the ones earned elsewhere. -->
<script lang="ts">
  import { plural } from "$lib/format.ts";
  import { plaqueCard, plaqueTitle, tierWords } from "$lib/plaques.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import Plaque from "./Plaque.svelte";

  let { study, limit = 3, dark = false }: { study: Study; limit?: number; dark?: boolean } = $props();

  // The newest tier of each plaque, in the order they came.
  const rows = $derived.by(() => {
    const latest = new Map<string, number>();
    for (const p of study.newPlaques) latest.set(p.plaqueId, Math.max(p.tier, latest.get(p.plaqueId) ?? 0));
    return [...latest].flatMap(([plaqueId, tier]) => {
      const card = plaqueCard(study, plaqueId);
      return card ? [{ card, tier }] : [];
    });
  });
</script>

{#if rows.length > 0}
  <ul class="news" class:dark aria-label="New plaques">
    {#each rows.slice(0, limit) as { card, tier } (card.id)}
      <li>
        <Plaque group={card.def.group} icon={card.def.icon} {tier} tiers={card.def.tiers.length} size={56} />
        <span class="words">
          <span class="eyebrow">{tier > 1 ? "Plaque upgraded" : "New plaque"}</span>
          <b>{plaqueTitle(card.def, tier)}</b>
          <span class="what">{tierWords(card.def, tier)}</span>
        </span>
      </li>
    {/each}
    {#if rows.length > limit}
      <li class="more">and {plural(rows.length - limit, "more plaque")}</li>
    {/if}
  </ul>
{/if}

<style>
  .news {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    border-radius: 16px;
    background: var(--hs-gold-soft);
    color: var(--hs-ink);
    text-align: left;
  }

  .dark li {
    background: var(--hs-focus-surface);
    color: var(--hs-focus-text);
  }

  .words {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-muted);
  }

  .dark .eyebrow,
  .dark .what {
    color: var(--hs-focus-text-muted);
  }

  b {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 18px;
    line-height: 1.2;
  }

  .what {
    font-size: 13.5px;
    color: var(--hs-ink-muted);
  }

  .more {
    padding: 4px 14px;
    background: none;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }
</style>
