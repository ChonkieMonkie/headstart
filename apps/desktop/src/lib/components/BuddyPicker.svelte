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

<!-- Choose a study buddy. Shown until one is picked; it can be changed later in the wardrobe. -->
<script lang="ts">
  import { items, MASCOTS, type MascotId } from "@headstart/content";
  import { lookFor, Mascot, MASCOT_NAMES, MASCOT_SPECIES, MASCOT_TINTS } from "@headstart/ui";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const BLURBS: Record<MascotId, string> = {
    inky: "Calm and clever. Eight arms for eight subjects.",
    axo: "Cheerful and patient. Never stops growing.",
    maple: "Cosy and curious. Always up for one more chapter.",
  };
</script>

<section class="picker" aria-labelledby="picker-h">
  <h2 id="picker-h">Pick your study buddy</h2>
  <p class="meta">They cheer you on, nudge you when a session is due and wear what you earn from crates.</p>
  <div class="options">
    {#each MASCOTS as mascot (mascot)}
      <button type="button" class="option" onclick={() => study.chooseMascot(mascot)}>
        <span class="art" style:background={MASCOT_TINTS[mascot]}>
          <Mascot look={lookFor(mascot, {}, items)} mood="welcome" size={132} label="" />
        </span>
        <span class="name">{MASCOT_NAMES[mascot]}</span>
        <span class="species">the {MASCOT_SPECIES[mascot]}</span>
        <span class="blurb">{BLURBS[mascot]}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 18px;
    padding: 22px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.45rem;
  }

  .meta {
    margin: 0;
    color: var(--hs-ink-muted);
    line-height: 1.5;
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
    margin-top: 6px;
  }

  .option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 14px;
    border: 2px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
    font: inherit;
    color: var(--hs-ink);
    text-align: center;
    cursor: pointer;
  }

  .option:hover {
    border-color: var(--hs-accent);
  }

  .option:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  .art {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 8px;
    padding: 6px 0;
    border-radius: var(--hs-radius-md);
  }

  .name {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.2rem;
  }

  .species {
    font-size: 13px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .blurb {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.4;
    color: var(--hs-ink-muted);
  }
</style>
