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

<!-- Your weeks, on Stats: each finished week with its goal, and the look back written about it. -->
<script lang="ts">
  import { addDays, formatMinutes, type WeekResult } from "@headstart/core";
  import { plural, shortDate } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const SHOWN = 12;
  const weeks = $derived(study.weeks);
  const rows = $derived((weeks?.history ?? []).slice(-SHOWN).reverse());

  const localNoon = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, 12).getTime();
  };

  /** The ISO week number of a week named by its Monday. */
  function weekNumber(monday: string): number {
    const thursday = new Date(`${addDays(monday, 3)}T00:00:00Z`);
    const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
    return Math.floor((thursday.getTime() - yearStart) / (7 * 86_400_000)) + 1;
  }

  const status = (week: WeekResult) => (week.met ? "Met" : week.frozen ? "Freeze" : "Not met");
  const tone = (week: WeekResult) => (week.met ? "met" : week.frozen ? "frozen" : "plain");
</script>

{#if weeks && rows.length > 0}
  <section class="card" aria-labelledby="yw-h">
    <div>
      <h2 id="yw-h">Your weeks</h2>
      <p class="sub">
        {#if weeks.run > 0}{plural(weeks.run, "week")} in a row now.{/if}
        Best: {plural(weeks.best, "week")} in a row.
        {#if weeks.freezes > 0}{plural(weeks.freezes, "freeze")} saved.{/if}
      </p>
    </div>
    <ul>
      {#each rows as week (week.week)}
        {@const look = study.reflection(week.week)}
        <li>
          <details>
            <summary>
              <span class="when"><b>Week {weekNumber(week.week)}</b><small>{shortDate(localNoon(week.week))}</small></span>
              <span class="status {tone(week)}">{status(week)}</span>
              <span class="days">{week.studyDays} of {week.goal} days</span>
              <span class="change">
                {#if look?.change}Change: <b>{look.change}</b>{:else if look}Looked back{:else}No look back{/if}
              </span>
            </summary>
            <dl>
              <div><dt>Focus</dt><dd>{formatMinutes(week.minutes)} in {plural(week.sessions, "session")}</dd></div>
              {#if week.returnWeek}<div><dt>Goal</dt><dd>Halved, the week you came back</dd></div>{/if}
              {#if look?.well}<div><dt>What went well</dt><dd>{look.well}</dd></div>{/if}
              {#if look?.blocked}<div><dt>What got in the way</dt><dd>{look.blocked}</dd></div>{/if}
              {#if look?.change}<div><dt>One thing to change</dt><dd>{look.change}</dd></div>{/if}
            </dl>
          </details>
        </li>
      {/each}
    </ul>
    {#if (weeks.history.length ?? 0) > SHOWN}
      <p class="sub">The last {SHOWN} weeks are shown.</p>
    {/if}
  </section>
{/if}

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    font-size: 1.25rem;
  }

  .sub {
    margin: 2px 0 0;
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    border-top: 1px solid var(--hs-line);
  }

  summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    min-height: 52px;
    cursor: pointer;
  }

  summary:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  .when {
    flex: none;
    display: flex;
    flex-direction: column;
    width: 84px;
  }

  small {
    font-size: 12.5px;
    color: var(--hs-ink-muted);
  }

  .status {
    flex: none;
    min-width: 72px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--hs-ground);
    color: var(--hs-ink-muted);
    font-size: 12.5px;
    font-weight: 800;
    text-align: center;
  }

  .status.met {
    background: var(--hs-success-soft);
    color: var(--hs-success-strong);
  }

  .status.frozen {
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .days {
    flex: none;
    width: 92px;
    font-size: 13.5px;
    color: var(--hs-ink-muted);
  }

  .change {
    flex: 1 1 200px;
    font-size: 13.5px;
    color: var(--hs-ink-muted);
  }

  .change b {
    color: var(--hs-ink);
  }

  dl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 2px 0 14px 98px;
  }

  dt {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  dd {
    margin: 0;
  }
</style>
