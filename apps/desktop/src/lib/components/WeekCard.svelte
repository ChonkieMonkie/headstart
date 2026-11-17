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

<!-- This week on Today: study days against the goal, with the focus time beside. Weeks met in a row take the place of a daily streak. -->
<script lang="ts">
  import { addDays, formatMinutes, MAX_REFLECTION_LENGTH } from "@headstart/core";
  import { plural } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const WORDS = { studied: "studied", missed: "no session", ahead: "to come", rest: "rest day" };

  const weeks = $derived(study.weeks);
  const week = $derived(weeks?.current ?? null);
  const left = $derived(week ? Math.max(0, week.goal - week.studyDays) : 0);
  const lastWeek = $derived(weeks ? addDays(weeks.current.week, -7) : null);
  /** The one change written in the look back at last week. */
  const change = $derived(lastWeek ? (study.reflection(lastWeek)?.change ?? "") : "");

  // With the look-ahead off, the look back is offered here early in the week.
  const canLookBack = $derived.by(() => {
    if (!weeks || !lastWeek || study.settings.weeklyLookahead || study.reflection(lastWeek)) return false;
    const before = weeks.history.at(-1);
    const dayOfWeek = weeks.days.findIndex((d) => d.today);
    return dayOfWeek >= 0 && dayOfWeek <= 2 && before?.week === lastWeek && before.sessions > 0;
  });
  let looking = $state(false);
  let well = $state("");
  let blocked = $state("");
  let oneChange = $state("");
  let error = $state<string | null>(null);

  async function save(): Promise<void> {
    if (!lastWeek) return;
    error = await study.saveReflection(lastWeek, { well, blocked, change: oneChange });
    if (!error) looking = false;
  }
</script>

{#if weeks && week && study.state && study.state.sessions.size > 0}
  <section class="card" aria-labelledby="wk-h">
    <div class="head">
      <h2 id="wk-h">This week</h2>
      <p class="count">
        <strong>{Math.min(week.studyDays, week.goal)} of {week.goal} study days</strong>
        {#if week.minutes > 0}<span>· {formatMinutes(week.minutes)} of focus</span>{/if}
      </p>
    </div>
    <ul class="days">
      {#each weeks.days as day, i (day.day)}
        <li aria-label="{SHORT[i]}: {WORDS[day.kind]}{day.today ? ', today' : ''}">
          <span class="box {day.kind}" class:today={day.today}>
            {#if day.kind === "studied"}
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
            {:else if day.kind === "rest"}
              <svg class="moon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M11.5 10.2A5 5 0 0 1 5.8 4.5a5 5 0 1 0 5.7 5.7z" /></svg>
            {:else if day.kind === "missed"}
              <span aria-hidden="true">–</span>
            {/if}
          </span>
          <span class="label" class:now={day.today}>{day.today ? "Today" : SHORT[i]}</span>
        </li>
      {/each}
    </ul>
    <div class="bar" aria-hidden="true"><span style:width="{Math.min(100, (week.studyDays / week.goal) * 100)}%"></span></div>
    <p class="line">
      {#if week.met}
        <strong>Week met.</strong> Anything more this week is extra.
      {:else}
        <strong>{plural(left, "more study day")}</strong> and the week is met. A day without a session changes nothing.
      {/if}
      {#if week.returnWeek}The goal is halved this week while you get going again.{/if}
    </p>
    <div class="foot">
      {#if weeks.run > 0}
        <span class="chip">{plural(weeks.run, "week")} in a row</span>
      {:else if weeks.best > 0}
        <span class="chip quiet">Best: {plural(weeks.best, "week")} in a row</span>
      {/if}
      {#if weeks.freezes > 0}
        <span class="freezes" role="img" aria-label="{plural(weeks.freezes, 'freeze')} saved">
          {#each { length: weeks.freezes } as _, i (i)}
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5v13M2.4 4.7l11.2 6.6M13.6 4.7L2.4 11.3M8 4l-1.8-1.6M8 4l1.8-1.6M8 12l-1.8 1.6M8 12l1.8 1.6" /></svg>
          {/each}
          {plural(weeks.freezes, "freeze")} saved
        </span>
      {/if}
      {#if change}
        <span class="change">Your change this week: <b>{change}</b></span>
      {:else if canLookBack && !looking}
        <button type="button" class="link" onclick={() => (looking = true)}>Look back at last week</button>
      {/if}
    </div>
    {#if looking}
      <form
        class="look"
        onsubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label>What went well?<input type="text" bind:value={well} maxlength={MAX_REFLECTION_LENGTH} /></label>
        <label>What got in the way?<input type="text" bind:value={blocked} maxlength={MAX_REFLECTION_LENGTH} /></label>
        <label>One thing to change this week<input type="text" bind:value={oneChange} maxlength={MAX_REFLECTION_LENGTH} /></label>
        {#if error}<p class="error" role="alert">{error}</p>{/if}
        <div class="buttons">
          <button type="button" class="secondary" onclick={() => (looking = false)}>Cancel</button>
          <button type="submit" class="primary">Save</button>
        </div>
      </form>
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

  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 6px 16px;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }

  .count {
    margin: 0;
    font-size: 15px;
  }

  .count span {
    color: var(--hs-ink-muted);
  }

  .days {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .days li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }

  .box {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    box-sizing: border-box;
    border: 2px solid var(--hs-field-line);
    border-radius: 16px;
    background: var(--hs-surface);
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .box.studied {
    border-color: var(--hs-success);
    background: var(--hs-success);
  }

  .box.studied path {
    fill: none;
    stroke: #fff;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .box.missed {
    border-color: transparent;
    background: var(--hs-ground);
  }

  .box.rest {
    border-style: dashed;
    background: var(--hs-ground);
  }

  .moon path {
    fill: var(--hs-ink-muted);
  }

  /* Today has a ring around whatever it holds. */
  .box.today {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  .label {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .label.now {
    color: var(--hs-accent-strong);
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

  .line {
    margin: 0;
    font-size: 14.5px;
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding-top: 10px;
    border-top: 1px solid var(--hs-line);
  }

  .foot:empty {
    display: none;
  }

  .chip {
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
    font-size: 13px;
    font-weight: 800;
  }

  .chip.quiet {
    background: var(--hs-ground);
    color: var(--hs-ink-muted);
  }

  .freezes {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 800;
  }

  .freezes path {
    fill: none;
    stroke: #2f7fd8;
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .change {
    margin-left: auto;
    font-size: 13.5px;
    color: var(--hs-ink-muted);
  }

  .change b {
    color: var(--hs-ink);
  }

  .link {
    margin-left: auto;
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hs-accent-strong);
    font: inherit;
    font-size: 13.5px;
    font-weight: 800;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .look {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .look label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    font-weight: 800;
  }

  .look input {
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 600;
    color: var(--hs-ink);
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .primary,
  .secondary {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
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

  .error {
    margin: 0;
    font-weight: 700;
    color: var(--hs-danger-strong);
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
