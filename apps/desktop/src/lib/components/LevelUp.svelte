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

<!-- A new level: a short celebration with what it gave. Shown after Session complete, never during a session. -->
<script lang="ts">
  import { InsightIcon, Mascot } from "@headstart/ui";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const up = $derived(study.levelUp);
  const level = $derived(study.summary?.level ?? null);

  function onkeydown(event: KeyboardEvent): void {
    if (up && event.key === "Escape") study.dismissLevelUp();
  }
</script>

<svelte:window {onkeydown} />

{#if up}
  <div class="backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && study.dismissLevelUp()}>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="lv-h">
      {#if study.look}
        <div class="buddy"><Mascot look={study.look} mood="celebrate" size={128} label="" /></div>
      {/if}
      <p class="eyebrow">Level up</p>
      <h2 id="lv-h">
        {#if up.to - up.from > 1}Level {up.from} <span aria-label="to">→</span> {up.to}{:else}Level {up.to}{/if}
      </h2>
      {#if up.rank}<p class="chip rank">New rank: {up.rank.name}</p>{/if}
      <p class="chip insight">+{up.insight} <InsightIcon size={14} /> Insight</p>
      {#if level}
        <div class="next">
          <div class="bar" aria-hidden="true"><span style:width="{(level.xpIntoLevel / level.xpForNextLevel) * 100}%"></span></div>
          <span>{level.xpIntoLevel.toLocaleString("en-GB")} / {level.xpForNextLevel.toLocaleString("en-GB")} XP to level {level.level + 1}</span>
        </div>
      {/if}
      <!-- svelte-ignore a11y_autofocus -->
      <button type="button" class="primary" autofocus onclick={() => study.dismissLevelUp()}>Nice!</button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 44;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--hs-backdrop);
  }

  .dialog {
    width: min(380px, calc(100vw - 40px));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px;
    border-radius: 24px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    text-align: center;
    box-shadow: var(--hs-shadow-dialog);
  }

  .buddy {
    display: grid;
    place-items: center;
    width: 148px;
    height: 148px;
    border-radius: 50%;
    background: var(--hs-ground);
  }

  .eyebrow {
    margin: 4px 0 0;
    font-size: 12.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hs-accent-strong);
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.6rem;
    line-height: 1;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
  }

  .rank {
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .insight {
    background: var(--hs-gold-soft);
    color: var(--hs-ink);
  }

  .next {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }

  .bar {
    height: 8px;
    border-radius: 999px;
    background: var(--hs-line);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--hs-accent);
  }

  .primary {
    align-self: stretch;
    min-height: 46px;
    margin-top: 4px;
    border: 0;
    border-radius: 12px;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
