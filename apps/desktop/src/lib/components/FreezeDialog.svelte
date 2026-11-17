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

<!-- Asked when the app opens after a missed week that the saved freezes can cover. A freeze is never used without a yes. -->
<script lang="ts">
  import { plural } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const weeks = $derived(study.weeks);
  const count = $derived(weeks?.pending.length ?? 0);
  /** The latest of the missed weeks, to say how it went. */
  const last = $derived(weeks?.history.find((w) => w.week === weeks.pending.at(-1)) ?? null);
  let busy = $state(false);

  async function answer(use: boolean): Promise<void> {
    busy = true;
    await study.answerFreeze(use);
    busy = false;
  }
</script>

{#if weeks && count > 0}
  <div class="backdrop" role="presentation">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="fz-h" aria-describedby="fz-t">
      <div class="title">
        <span class="flake" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="20" height="20"><path d="M8 1.5v13M2.4 4.7l11.2 6.6M13.6 4.7L2.4 11.3M8 4l-1.8-1.6M8 4l1.8-1.6M8 12l-1.8 1.6M8 12l1.8 1.6" /></svg>
        </span>
        <h2 id="fz-h">{count === 1 ? "Use a freeze for last week?" : `Use ${count} freezes for the last ${count} weeks?`}</h2>
      </div>
      <p id="fz-t">
        {#if count === 1 && last}
          You studied <b>{last.studyDays} of {last.goal} days</b> last week. A freeze covers it and keeps your
          <b>{plural(weeks.run, "week")} in a row</b>.
        {:else}
          The last {count} weeks did not reach your goal. One freeze each covers them and keeps your
          <b>{plural(weeks.run, "week")} in a row</b>.
        {/if}
        You have {plural(weeks.freezes, "freeze")}.
      </p>
      <div class="buttons">
        <!-- svelte-ignore a11y_autofocus -->
        <button type="button" class="primary" autofocus disabled={busy} onclick={() => answer(true)}>
          {count === 1 ? "Use a freeze" : `Use ${count} freezes`}
        </button>
        <button type="button" class="secondary" disabled={busy} onclick={() => answer(false)}>No, start a new run</button>
      </div>
      <p class="small">Asked once. Saying no keeps {count === 1 ? "the freeze" : "the freezes"} for another week.</p>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 45;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--hs-backdrop);
  }

  .dialog {
    width: min(460px, calc(100vw - 40px));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px 24px;
    border-radius: 22px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    box-shadow: var(--hs-shadow-dialog);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .flake {
    flex: none;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: #e1eefb;
  }

  .flake path {
    fill: none;
    stroke: #2f7fd8;
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
    line-height: 1.2;
  }

  p {
    margin: 0;
    line-height: 1.5;
  }

  .small {
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
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

  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
