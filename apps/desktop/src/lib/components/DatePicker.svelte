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
  Picks a day from a small calendar. Weeks start on Monday.
  Keyboard: arrows move a day or a week, Page Up and Page Down a month,
  Home and End the start and end of the week, Enter picks, Escape closes.
-->
<script lang="ts">
  import { localDayKey } from "@headstart/core";
  import { onMount, tick } from "svelte";

  let {
    value = $bindable(""),
    label,
    id,
    optional = false,
    min,
    quick = [],
  }: {
    /** "YYYY-MM-DD", or "" for no date. */
    value: string;
    label: string;
    id?: string;
    /** Allow no date at all, with a "No date" choice. */
    optional?: boolean;
    /** Earliest day that can be picked, "YYYY-MM-DD". */
    min?: string;
    /** Shortcut buttons such as Today and Tomorrow: days from today. */
    quick?: { label: string; days: number }[];
  } = $props();

  const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const uid = Math.random().toString(36).slice(2, 8);
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
  const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const shortDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  let open = $state(false);
  /** Open towards the left when there is no room on the right. */
  let alignRight = $state(false);
  let root: HTMLDivElement;
  let button: HTMLButtonElement;
  let grid = $state<HTMLDivElement | null>(null);
  /** The day with keyboard focus inside the calendar. */
  let focused = $state(new Date());
  /** First day of the month shown. */
  let shown = $state(new Date());

  const parse = (key: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const addMonths = (d: Date, n: number) => {
    const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
  };
  const today = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const tooEarly = (d: Date) => (min ? localDayKey(d.getTime()) < min : false);

  const selected = $derived(parse(value));

  /** Six weeks of days, Monday first, around the month shown. */
  const days = $derived.by(() => {
    const first = new Date(shown.getFullYear(), shown.getMonth(), 1);
    const start = addDays(first, -((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  });

  async function show(): Promise<void> {
    focused = selected ?? (min ? (parse(min) ?? today()) : today());
    shown = new Date(focused.getFullYear(), focused.getMonth(), 1);
    alignRight = root.getBoundingClientRect().left + 300 > window.innerWidth;
    open = true;
    await tick();
    focusDay();
  }

  function close(focusButton = true): void {
    open = false;
    if (focusButton) button?.focus();
  }

  function pick(day: Date | null): void {
    if (day && tooEarly(day)) return;
    value = day ? localDayKey(day.getTime()) : "";
    close();
  }

  function focusDay(): void {
    grid?.querySelector<HTMLButtonElement>(`[data-day="${localDayKey(focused.getTime())}"]`)?.focus();
  }

  async function moveTo(day: Date): Promise<void> {
    focused = day;
    if (day.getMonth() !== shown.getMonth() || day.getFullYear() !== shown.getFullYear()) {
      shown = new Date(day.getFullYear(), day.getMonth(), 1);
    }
    await tick();
    focusDay();
  }

  function onGridKey(event: KeyboardEvent): void {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
      Home: () => addDays(focused, -((focused.getDay() + 6) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() + 6) % 7)),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      moveTo(move());
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function month(step: number): void {
    shown = new Date(shown.getFullYear(), shown.getMonth() + step, 1);
    focused = addMonths(focused, step);
  }

  onMount(() => {
    const away = (event: PointerEvent) => {
      if (open && !root.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });
</script>

<div class="picker" bind:this={root}>
  <button
    type="button"
    class="trigger"
    {id}
    bind:this={button}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-label="{label}: {selected ? longDay.format(selected) : 'no date'}"
    onclick={() => (open ? close() : show())}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5" /></svg>
    <span class="value" class:empty={!selected}>{selected ? shortDay.format(selected) : "No date"}</span>
  </button>

  {#if open}
    <div class="pop" class:right={alignRight} role="dialog" aria-modal="false" aria-label={label}>
      <div class="head">
        <button type="button" class="nav" aria-label="Previous month" onclick={() => month(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <span class="month" aria-live="polite">{monthName.format(shown)}</span>
        <button type="button" class="nav" aria-label="Next month" onclick={() => month(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div class="grid" role="grid" aria-label={monthName.format(shown)} bind:this={grid} tabindex="-1" onkeydown={onGridKey}>
        <div class="row" role="row">
          {#each WEEKDAYS as day (day)}
            <span class="weekday" role="columnheader" aria-label={day}>{day}</span>
          {/each}
        </div>
        {#each [0, 1, 2, 3, 4, 5] as week (week)}
          <div class="row" role="row">
            {#each days.slice(week * 7, week * 7 + 7) as day (day.getTime())}
              {@const key = localDayKey(day.getTime())}
              <span role="gridcell" aria-selected={key === value}>
                <button
                  type="button"
                  class="day"
                  class:outside={day.getMonth() !== shown.getMonth()}
                  class:today={key === localDayKey(today().getTime())}
                  class:chosen={key === value}
                  data-day={key}
                  tabindex={key === localDayKey(focused.getTime()) ? 0 : -1}
                  disabled={tooEarly(day)}
                  aria-label={longDay.format(day)}
                  onclick={() => pick(day)}
                >
                  {day.getDate()}
                </button>
              </span>
            {/each}
          </div>
        {/each}
      </div>

      {#if quick.length > 0 || optional}
        <div class="quick">
          {#each quick as q (q.label)}
            <button type="button" class="chip" onclick={() => pick(addDays(today(), q.days))}>{q.label}</button>
          {/each}
          {#if optional}
            <button type="button" class="chip" onclick={() => pick(null)}>No date</button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .picker {
    position: relative;
    display: block;
  }

  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid #c9cfdc;
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    color: var(--hs-ink);
    text-align: left;
    cursor: pointer;
  }

  .trigger:hover,
  .trigger[aria-expanded="true"] {
    border-color: var(--hs-accent);
  }

  .trigger[aria-expanded="true"] {
    box-shadow: 0 0 0 3px var(--hs-accent-soft);
  }

  .value.empty {
    font-weight: 600;
    color: var(--hs-ink-subtle);
  }

  svg {
    width: 18px;
    height: 18px;
    flex: none;
    color: var(--hs-ink-subtle);
  }

  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .pop {
    position: absolute;
    z-index: 20;
    top: calc(100% + 6px);
    left: 0;
    width: 292px;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid #c9cfdc;
    border-radius: 16px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-pop);
  }

  .pop.right {
    left: auto;
    right: 0;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .month {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 16px;
    color: var(--hs-ink);
  }

  .nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 10px;
    background: none;
    cursor: pointer;
  }

  .nav:hover {
    background: var(--hs-ground);
  }

  .row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .weekday {
    padding: 4px 0;
    text-align: center;
    font-size: 12px;
    font-weight: 800;
    color: var(--hs-ink-subtle);
  }

  .day {
    width: 100%;
    aspect-ratio: 1;
    border: 0;
    border-radius: 10px;
    background: none;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--hs-ink);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .day:hover:not(:disabled) {
    background: var(--hs-accent-soft);
  }

  .day.outside {
    color: #8a93a6;
    font-weight: 600;
  }

  .day.today {
    box-shadow: inset 0 0 0 2px var(--hs-accent);
  }

  .day.chosen {
    background: var(--hs-accent);
    color: #fff;
  }

  .day:disabled {
    color: #c9cfdc;
    cursor: default;
  }

  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--hs-line);
  }

  .chip {
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid var(--hs-line);
    border-radius: 999px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink);
    cursor: pointer;
  }

  .chip:hover {
    border-color: var(--hs-accent);
  }

  button:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
