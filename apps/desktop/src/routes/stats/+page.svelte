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

<!-- Basic stats: focus time, on-time starts, and focus per course. -->
<script lang="ts">
  import { courseLabel } from "$lib/options.ts";
  import { formatMinutes } from "@headstart/core";
  import { useApp } from "$lib/context.ts";
  import { plural, shortDate, weekdayOf } from "$lib/format.ts";

  const { study } = useApp();
  const stats = $derived(study.stats(7));
  const peak = $derived(Math.max(1, ...(stats?.days.map((d) => d.minutes) ?? [1])));
  const coursePeak = $derived(Math.max(1, ...(stats?.byCourse.map((c) => c.minutes) ?? [1])));

  let hovered = $state<number | null>(null);
  let asTable = $state(false);

  const percent = (share: number | null) => (share === null ? "–" : `${Math.round(share * 100)}%`);
  const dayDate = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).getTime();
  };
</script>

<header class="top">
  <h1>Stats</h1>
  <p class="lead">Everything here is counted from your own sessions, on this computer.</p>
</header>

{#if stats}
  <section class="tiles" aria-label="Totals">
    <div class="tile">
      <p class="label">Focus time</p>
      <p class="value">{formatMinutes(stats.totalMinutes)}</p>
      <p class="note">{plural(stats.sessions, "session")} in total</p>
    </div>
    <div class="tile">
      <p class="label">On-time starts</p>
      <p class="value">{percent(stats.onTimeRate)}</p>
      <p class="note">
        {stats.plannedStarts === 0
          ? "Plan a session to start counting"
          : `${stats.onTimeStarts} of ${plural(stats.plannedStarts, "planned start")}`}
      </p>
    </div>
    <div class="tile">
      <p class="label">On-time streak</p>
      <p class="value">{stats.onTimeStreak}</p>
      <p class="note">Best: {stats.bestOnTimeStreak}</p>
    </div>
    <div class="tile">
      <p class="label">Distraction-free</p>
      <p class="value">{percent(stats.distractionFreeRate)}</p>
      <p class="note">
        {stats.averageDistractions === null
          ? "Of sessions of 10 minutes or more"
          : `${stats.averageDistractions.toFixed(1)} distractions per session`}
      </p>
    </div>
    <div class="tile">
      <p class="label">Focus rating</p>
      <p class="value">{stats.averageRating === null ? "–" : `${stats.averageRating.toFixed(1)} / 5`}</p>
      <p class="note">Average of the sessions you rated</p>
    </div>
  </section>

  <section class="card" aria-labelledby="week-h">
    <div class="card-head">
      <div>
        <h2 id="week-h">Focus, last 7 days</h2>
        <p class="sub">Minutes of focus per day</p>
      </div>
      <button type="button" class="toggle" aria-pressed={asTable} onclick={() => (asTable = !asTable)}>
        {asTable ? "Show chart" : "Show as table"}
      </button>
    </div>

    {#if asTable}
      <table>
        <thead><tr><th scope="col">Day</th><th scope="col">Focus</th><th scope="col">Sessions</th></tr></thead>
        <tbody>
          {#each stats.days as day (day.day)}
            <tr><td>{shortDate(dayDate(day.day))}</td><td>{formatMinutes(day.minutes)}</td><td>{day.sessions}</td></tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="columns" role="group" aria-label="Focus per day, last 7 days">
        {#each stats.days as day, i (day.day)}
          {@const isToday = i === stats.days.length - 1}
          <button
            type="button"
            class="slot"
            aria-label="{shortDate(dayDate(day.day))}: {formatMinutes(day.minutes)}, {plural(day.sessions, 'session')}"
            onpointerenter={() => (hovered = i)}
            onpointerleave={() => (hovered = null)}
            onfocus={() => (hovered = i)}
            onblur={() => (hovered = null)}
          >
            {#if hovered === i}
              <div class="tooltip" role="presentation">
                <strong>{shortDate(dayDate(day.day))}</strong>
                <span>{formatMinutes(day.minutes)} · {plural(day.sessions, "session")}</span>
              </div>
            {/if}
            {#if isToday || (day.minutes === peak && day.minutes > 0)}
              <span class="cap">{formatMinutes(day.minutes)}</span>
            {/if}
            <div class="column" class:today={isToday} style:height="{(day.minutes / peak) * 100}%"></div>
            <span class="day" class:today={isToday}>{isToday ? "Today" : weekdayOf(day.day)}</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <section class="card" aria-labelledby="course-h">
    <h2 id="course-h">Focus per course</h2>
    {#if stats.byCourse.length === 0}
      <p class="sub">Finish a session on a course to see it here.</p>
    {:else}
      <ul class="bars">
        {#each stats.byCourse as row (row.courseId ?? "none")}
          {@const course = study.course(row.courseId)}
          <li>
            <span class="bar-name">
              <span class="dot" style:background={course?.color ?? "#8A93A6"} aria-hidden="true"></span>
              {course ? courseLabel(course) : "No course"}
            </span>
            <span class="bar-track">
              <span
                class="bar"
                style:width="{(row.minutes / coursePeak) * 100}%"
                style:background={course?.color ?? "#8A93A6"}
              ></span>
              <span class="bar-value">{formatMinutes(row.minutes)}</span>
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

{/if}

<style>
  .top {
    margin-bottom: 20px;
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.1rem;
  }

  .lead,
  .sub {
    margin: 4px 0 0;
    color: var(--hs-ink-muted);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }

  .tile {
    padding: 16px 18px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .tile p {
    margin: 0;
  }

  .label {
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-subtle);
  }

  .tile p.value {
    margin: 4px 0;
    font-weight: 800;
    font-size: 1.6rem;
    font-variant-numeric: tabular-nums;
  }

  .note {
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 18px;
    padding: 22px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .card-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.35rem;
  }

  .toggle {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--hs-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
  }

  .columns {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    height: 220px;
    padding-top: 28px;
    border-bottom: 1px solid var(--hs-line);
  }

  .slot {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    cursor: default;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    border-radius: 8px;
    outline: none;
  }

  .slot:hover,
  .slot:focus-visible {
    background: var(--hs-ground);
  }

  .slot:focus-visible {
    box-shadow: 0 0 0 3px var(--hs-accent);
  }

  .column {
    width: 24px;
    min-height: 0;
    border-radius: 4px 4px 0 0;
    background: #8f84e6;
  }

  .column.today {
    background: var(--hs-accent);
  }

  .cap {
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 800;
    color: var(--hs-ink-muted);
    white-space: nowrap;
  }

  .day {
    position: absolute;
    bottom: -26px;
    font-size: 13px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .day.today {
    color: var(--hs-ink);
    font-weight: 800;
  }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 4px);
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--hs-ink);
    color: #fff;
    font-size: 13px;
    white-space: nowrap;
    pointer-events: none;
  }

  .card:has(.columns) {
    padding-bottom: 44px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    max-width: 480px;
  }

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--hs-line);
    text-align: left;
  }

  th {
    font-size: 13px;
    color: var(--hs-ink-subtle);
  }

  .bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bars li {
    display: grid;
    grid-template-columns: minmax(120px, 200px) 1fr;
    align-items: center;
    gap: 12px;
  }

  .bar-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .bar-track {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bar {
    height: 18px;
    min-width: 2px;
    border-radius: 0 4px 4px 0;
  }

  .bar-value {
    font-size: 14px;
    font-weight: 800;
    color: var(--hs-ink-muted);
    white-space: nowrap;
  }







  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
