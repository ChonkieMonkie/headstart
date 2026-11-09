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

<!--
  The week planner: the next few days (or a whole week) as a calendar, with
  the tasks that still need sessions beside it. Plan by dragging over free
  time, by dragging a task in, or with "New session".
-->
<script lang="ts">
  import { localDayKey } from "@headstart/core";
  import PlannerBoard from "$lib/components/planner/PlannerBoard.svelte";
  import { useApp } from "$lib/context.ts";
  import { fromInputs, plural } from "$lib/format.ts";

  const { study, apple } = useApp();
  const MINUTE = 60_000;
  const VIEW_KEY = "headstart.plan.view";
  type View = "day" | "3days" | "week";
  const VIEWS: { value: View; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "3days", label: "3 days" },
    { value: "week", label: "Week" },
  ];

  function savedView(): View {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      return v === "day" || v === "week" ? v : "3days";
    } catch {
      return "3days";
    }
  }

  let view = $state<View>(savedView());
  let anchor = $state(localDayKey(Date.now()));
  let board = $state<PlannerBoard>();

  const addDays = (day: string, n: number) => {
    const [y, m, d] = day.split("-").map(Number);
    return localDayKey(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + n, 12).getTime());
  };
  const mondayOf = (day: string) => addDays(day, -((new Date(fromInputs(day, "12:00")).getDay() + 6) % 7));
  const dayStart = (day: string) => fromInputs(day, "00:00");

  const today = $derived(localDayKey(study.now));
  const days = $derived(
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(mondayOf(anchor), i))
      : Array.from({ length: view === "3days" ? 3 : 1 }, (_, i) => addDays(anchor, i)),
  );
  // Monday to Sunday of the first day shown. When the days shown run past Sunday
  // (3 days from a Saturday, say), the strip moves along so every one of them is in it.
  const week = $derived.by(() => {
    const last = days[days.length - 1] ?? anchor;
    let start = mondayOf(days[0] ?? anchor);
    if (addDays(start, 6) < last) start = addDays(last, -6);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  });
  const sessionsOn = (day: string) => study.plansOn(day).length;
  const dayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });

  const weekLabel = $derived.by(() => {
    const first = new Date(fromInputs(week[0] ?? today, "12:00"));
    const last = new Date(fromInputs(week[6] ?? today, "12:00"));
    // ISO week number: weeks start on Monday, and week 1 holds the year's first Thursday.
    const isoWeek = (d: Date) => {
      const thursday = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
      const year = new Date(thursday).getUTCFullYear();
      return 1 + Math.floor((thursday - Date.UTC(year, 0, 1)) / (7 * 86_400_000));
    };
    const a = isoWeek(first);
    const b = isoWeek(last);
    const number = a === b ? `Week ${a}` : `Weeks ${a} and ${b}`;
    const month = new Intl.DateTimeFormat("en-GB", { month: "long" });
    const range =
      first.getMonth() === last.getMonth()
        ? `${first.getDate()} to ${last.getDate()} ${month.format(last)}`
        : `${first.getDate()} ${month.format(first)} to ${last.getDate()} ${month.format(last)}`;
    return `${number} · ${range}`;
  });

  function setView(next: View): void {
    view = next;
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Remembering the view is only a convenience.
    }
  }

  function step(direction: number): void {
    anchor = addDays(anchor, direction * (view === "week" ? 7 : view === "3days" ? 3 : 1));
  }

  /** A new session at the next half hour that is at least ten minutes away. */
  function newSession(): void {
    const half = 30 * MINUTE;
    const start = Math.ceil((Date.now() + 10 * MINUTE) / half) * half;
    const day = localDayKey(start);
    if (!days.includes(day)) anchor = day;
    board?.openNew({ day, start, end: null });
  }

  // The weekly look-ahead is offered once, after a week of using Headstart.
  const offerLookahead = $derived.by(() => {
    const state = study.state;
    if (!state || state.settings.lookaheadOffered || state.settings.weeklyLookahead) return false;
    let oldest = Number.POSITIVE_INFINITY;
    for (const record of state.sessions.values()) oldest = Math.min(oldest, record.startedAt);
    return study.now - oldest > 6 * 86_400_000;
  });
</script>

<header class="top">
  <div>
    <p class="eyebrow">{weekLabel}</p>
    <h1>Plan</h1>
  </div>
  <div class="top-actions">
    {#if apple.on}
      <span class="synced">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.8" y="2.8" width="12.4" height="11.4" rx="2.4" /><path d="M1.8 6.2h12.4M5.2 1.6v2.4M10.8 1.6v2.4" /></svg>
        Synced with Calendar · {apple.calendarName}
      </span>
    {/if}
    <button type="button" class="secondary" disabled={!study.ready} onclick={() => (study.lookaheadOpen = true)}>Look ahead</button>
    <button type="button" class="primary" disabled={!study.ready} onclick={newSession}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>New session
    </button>
  </div>
</header>

{#if offerLookahead}
  <section class="offer" aria-label="Weekly look-ahead">
    <div>
      <p class="offer-title">Want a short look at your week each Sunday?</p>
      <p>Two minutes: last week, what is coming up, and a nudge to plan. You can turn it off any time.</p>
    </div>
    <div class="offer-actions">
      <button type="button" class="primary" onclick={() => study.saveSettings({ weeklyLookahead: true, lookaheadOffered: true })}>Yes, Sunday 18:00</button>
      <button type="button" class="secondary" onclick={() => study.saveSettings({ lookaheadOffered: true })}>No thanks</button>
    </div>
  </section>
{/if}

<div class="toolbar">
  <div class="strip" role="group" aria-label="This week">
    {#each week as day (day)}
      {@const count = sessionsOn(day)}
      <button
        type="button"
        class="day"
        class:shown={days.includes(day)}
        class:today={day === today}
        aria-current={day === today ? "date" : undefined}
        onclick={() => (anchor = day)}
      >
        <span class="day-name">{day === today ? "Today" : dayLabel.format(dayStart(day) + 12 * 3_600_000)}</span>
        <span class="day-count">{day === today ? `${dayLabel.format(dayStart(day) + 12 * 3_600_000)} · ` : ""}{count ? plural(count, "session") : "Not planned"}</span>
      </button>
    {/each}
  </div>
  <div class="nav">
    <button type="button" class="icon" aria-label="Earlier" onclick={() => step(-1)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8 10 12.5" /></svg>
    </button>
    <button type="button" class="secondary small" onclick={() => (anchor = today)}>Today</button>
    <button type="button" class="icon" aria-label="Later" onclick={() => step(1)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
    </button>
    <div class="segments" role="group" aria-label="How many days">
      {#each VIEWS as v (v.value)}
        <button type="button" aria-pressed={view === v.value} onclick={() => setView(v.value)}>{v.label}</button>
      {/each}
    </div>
  </div>
</div>

<PlannerBoard bind:this={board} {days} onSwipe={step} />

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 16px;
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
    font-size: 2rem;
  }


  .top-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .primary,
  .secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    font-weight: 800;
  }

  .primary {
    border: 0;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
  }

  .primary:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .small {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 10px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .synced {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--hs-success-soft);
    color: var(--hs-success-strong);
    font-size: 13px;
    font-weight: 800;
  }

  .offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
    padding: 16px 18px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-md, 16px);
    background: var(--hs-surface);
  }

  .offer p {
    margin: 0;
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  .offer .offer-title {
    font-size: 16px;
    font-weight: 800;
    color: var(--hs-ink);
  }

  .offer-actions {
    display: flex;
    gap: 8px;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .day {
    min-width: 78px;
    min-height: 46px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 5px 10px;
    border: 1px solid var(--hs-line);
    border-radius: 12px;
    background: var(--hs-surface);
    text-align: left;
    color: var(--hs-ink-muted);
  }

  .day.shown {
    border: 2px solid var(--hs-accent);
    padding: 4px 9px;
  }

  .day-name {
    font-size: 13px;
    font-weight: 800;
  }

  /* Today is filled, so it stands out from the days that are only shown. */
  .day.today {
    background: var(--hs-accent);
    border-color: var(--hs-accent);
    color: var(--hs-on-accent);
  }

  .day.today.shown {
    box-shadow: 0 0 0 2px var(--hs-surface), 0 0 0 4px var(--hs-accent);
  }

  .day.today .day-count {
    color: var(--hs-on-accent);
    opacity: 0.9;
  }

  .day-count {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .icon {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--hs-line);
    border-radius: 10px;
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .segments {
    display: inline-flex;
    gap: 2px;
    margin-left: 4px;
    padding: 3px;
    border-radius: 12px;
    background: var(--hs-tabs);
  }

  .segments button {
    min-height: 32px;
    padding: 0 12px;
    border: 0;
    border-radius: 9px;
    background: none;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .segments button[aria-pressed="true"] {
    background: var(--hs-surface);
    color: var(--hs-accent-strong);
    box-shadow: 0 1px 2px rgb(27 34 54 / 0.14);
  }



















  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

</style>
