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

<!-- Today: what is up next, how the day is going and the day's plan. -->
<script lang="ts">
  import { cancelPlan, daysUntil, formatDuration, formatMinutes, movePlan, TIMER_PRESETS } from "@headstart/core";
  import { Mascot, MASCOT_TINTS } from "@headstart/ui";
  import BuddyPicker from "$lib/components/BuddyPicker.svelte";
  import CourseName from "$lib/components/CourseName.svelte";
  import PlanForm from "$lib/components/PlanForm.svelte";
  import Select from "$lib/components/Select.svelte";
  import { taskGroups } from "$lib/options.ts";
  import { useApp } from "$lib/context.ts";
  import { clockTime, examLabel, plural } from "$lib/format.ts";

  const { study } = useApp();
  const shortcut = /Mac/.test(navigator.userAgent) ? "⌥⇧H" : "Alt+Shift+H";
  const MINUTE = 60_000;

  let planning = $state(false);
  let quickTask = $state("");
  let moveError = $state<string | null>(null);

  const today = $derived(
    new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(study.now),
  );
  const greeting = $derived.by(() => {
    const hour = new Date(study.now).getHours();
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  });

  const stats = $derived(study.stats(7));
  const plans = $derived(study.todayPlans);
  const next = $derived(study.upNext);
  const nextCourse = $derived(next ? study.course(next.courseId) : null);
  const nextTask = $derived(next ? study.task(next.taskId) : null);
  const nextTodos = $derived(next ? study.todosForPlan(next.id) : []);
  const quickTaskId = $derived(quickTask.startsWith("task:") ? quickTask.slice(5) : "");
  const plannedLeft = $derived(plans.filter((v) => v.status === "next" || v.status === "planned").length);
  const weekMinutes = $derived(stats?.days.reduce((sum, d) => sum + d.minutes, 0) ?? 0);

  const STATUS = {
    done: "Done",
    running: "Running",
    missed: "Missed",
    next: "Up next",
    planned: "Planned",
  } as const;

  async function move(planId: string, startAt: number, byMinutes: number): Promise<void> {
    const result = await study.run((s) => movePlan(s, planId, new Date(Math.max(Date.now(), startAt) + byMinutes * MINUTE)));
    moveError = result.ok ? null : result.reason;
  }
</script>

<header class="top">
  <div>
    <p class="date">{today}</p>
    <h1>{greeting}</h1>
  </div>
  <div class="top-actions">
    <span class="shortcut">Shortcut <kbd>{shortcut}</kbd></span>
    <button type="button" class="primary" disabled={!study.ready} onclick={() => study.start({ auto: true })}>
      Start session
    </button>
  </div>
</header>

{#if study.notice}
  <p class="notice" role="status">
    {study.notice}
    <button type="button" class="link" onclick={() => (study.notice = null)}>Dismiss</button>
  </p>
{/if}

{#if study.breakTimer}
  <section class="card break" aria-label="Break">
    <p>
      <strong>{study.breakTimer.long ? "Long break" : "Break"}: {formatDuration(study.remaining)} left.</strong>
      Stand up, drink some water, look out of a window.
    </p>
    <div class="actions">
      <button type="button" class="secondary" onclick={() => study.setLayout("compact")}>Compact timer</button>
      <button type="button" class="secondary" onclick={() => study.skipBreak()}>Skip break</button>
    </div>
  </section>
{/if}

{#if study.ready && !study.mascot}
  <BuddyPicker {study} />
{/if}

{#if study.waitingCrates.length > 0}
  <a class="crate-banner" href="/crates">
    <strong>{study.waitingCrates.length === 1 ? "A Study Crate is" : `${study.waitingCrates.length} Study Crates are`} waiting</strong>
    <span>Open it</span>
  </a>
{/if}

<section class="card up-next" aria-labelledby="next-h">
  <div class="up-next-row">
  {#if study.look && study.mascot}
    <div class="buddy" style:background={MASCOT_TINTS[study.mascot]}>
      <Mascot look={study.look} mood={study.mood} size={176} />
    </div>
  {/if}
  <div class="up-next-body">
  {#if study.look}
    <p class="bubble">{study.mascotLine}</p>
  {/if}
  {#if next}
    <p class="eyebrow">Next session · {clockTime(next.startAt)} to {clockTime(next.startAt + next.minutes * MINUTE)}</p>
    <h2 id="next-h">
      {#if nextCourse}<span class="dot" style:background={nextCourse.color} aria-hidden="true"></span>{/if}
      {nextTask?.title ?? nextCourse?.name ?? "Study session"}
    </h2>
    <p class="meta">
      {#if nextCourse}<CourseName course={nextCourse} dot={false} />{:else}No course{/if}{nextCourse?.examDate
        ? ` · ${examLabel(daysUntil(nextCourse.examDate, study.now))}`
        : ""}
    </p>
    {#if nextTodos.length > 0}
      <div class="step">
        <span>In this session</span>
        <ul class="todos">
          {#each nextTodos as todo (todo.id)}<li>{todo.text}</li>{/each}
        </ul>
      </div>
    {:else if nextTask?.nextStep}
      <p class="step"><span>Next step</span> {nextTask.nextStep}</p>
    {/if}
    <div class="actions">
      <button type="button" class="primary" onclick={() => study.start({ planId: next.id })}>Start now</button>
      <button
        type="button"
        class="secondary"
        onclick={() => study.start({ planId: next.id, minutes: TIMER_PRESETS.justFive.focusMinutes })}
      >
        Just 5 minutes
      </button>
      <button type="button" class="secondary" onclick={() => move(next.id, next.startAt, 30)}>Move 30 min later</button>
    </div>
    {#if moveError}<p class="error" role="alert">{moveError}</p>{/if}
  {:else if study.courses.length > 0}
    <h2 id="next-h">Nothing planned right now</h2>
    <p class="meta">Pick a task and go, or plan your next session below.</p>
    <div class="actions">
      <Select bind:value={quickTask} groups={taskGroups(study, { none: "No task" })} label="Task" />
      <button type="button" class="primary" onclick={() => study.start(quickTaskId ? { taskId: quickTaskId } : {})}>
        Start {study.settings.focusMinutes} min
      </button>
      <button
        type="button"
        class="secondary"
        onclick={() => study.start({ ...(quickTaskId ? { taskId: quickTaskId } : {}), minutes: TIMER_PRESETS.justFive.focusMinutes })}
      >
        Just 5 minutes
      </button>
      {#if study.settings.focusMinutes < TIMER_PRESETS.deep.focusMinutes}
      <button
        type="button"
        class="secondary"
        onclick={() => study.start({ ...(quickTaskId ? { taskId: quickTaskId } : {}), minutes: TIMER_PRESETS.deep.focusMinutes })}
      >
        Deep work 50 min
      </button>
      {/if}
    </div>
  {:else}
    <h2 id="next-h">Welcome to Headstart</h2>
    <p class="meta">
      Add your courses and a first task with a concrete next step. Then starting is one click, and
      sessions you plan come with a reminder.
    </p>
    <div class="actions">
      <a class="primary button" href="/courses">Add your first course</a>
      <button type="button" class="secondary" onclick={() => study.start()}>Just start {study.settings.focusMinutes} min</button>
    </div>
  {/if}
  </div>
  </div>
</section>

{#if stats}
  <section class="tiles" aria-label="Today at a glance">
    <div class="tile">
      <p class="tile-label">Focus today</p>
      <p class="tile-value">{formatMinutes(stats.todayMinutes)}</p>
      <p class="tile-note">
        {plural(stats.todaySessions, "session")} done{plannedLeft > 0 ? `, ${plannedLeft} more planned` : ""}
      </p>
    </div>
    <div class="tile">
      <p class="tile-label">On-time starts</p>
      <p class="tile-value">{stats.onTimeStreak} in a row</p>
      <p class="tile-note">Best: {stats.bestOnTimeStreak}</p>
    </div>
    <div class="tile">
      <p class="tile-label">Next Study Crate</p>
      <p class="tile-value">{study.summary?.crateProgress ?? 0} of {study.summary?.crateEvery ?? 3}</p>
      <p class="tile-note">
        {#if study.waitingCrates.length > 0}<a href="/crates">Open your crate</a>{:else}Sessions of 10 minutes or more{/if}
      </p>
    </div>
    <div class="tile">
      <p class="tile-label">Last 7 days</p>
      <p class="tile-value">{formatMinutes(weekMinutes)}</p>
      <p class="tile-note"><a href="/stats">See all stats</a></p>
    </div>
  </section>
{/if}

<section class="card" aria-labelledby="plan-h">
  <div class="card-head">
    <h2 id="plan-h">Today's plan</h2>
    {#if !planning}
      <button type="button" class="secondary" onclick={() => (planning = true)}>Plan a session</button>
    {/if}
  </div>
  {#if planning}
    <PlanForm {study} onDone={() => (planning = false)} />
  {/if}
  {#if plans.length === 0}
    <p class="meta">
      Nothing planned for today yet. A planned start time is what makes an on-time start count, and
      Headstart reminds you two minutes before.
    </p>
  {:else}
    <ol class="plan">
      {#each plans as view (view.plan.id)}
        <li class:is-next={view.status === "next"}>
          <span class="time">{clockTime(view.plan.startAt)}</span>
          <span class="bar" style:background={view.course?.color ?? "#8A93A6"} aria-hidden="true"></span>
          <span class="what">
            <strong>{#if view.course}<CourseName course={view.course} dot={false} />{:else}Study session{/if}</strong>
            <span>
              {view.task?.title ?? `${view.plan.minutes} min`}{#if study.todosForPlan(view.plan.id).length > 0}
                · {plural(study.todosForPlan(view.plan.id).length, "to-do")}{/if}
            </span>
          </span>
          <span class="status status-{view.status}">{STATUS[view.status]}</span>
          {#if view.status === "next" || view.status === "planned" || view.status === "missed"}
            <span class="row-actions">
              <button type="button" class="small" onclick={() => study.start({ planId: view.plan.id })}>Start</button>
              <button
                type="button"
                class="small ghost"
                aria-label="Remove the {clockTime(view.plan.startAt)} session"
                onclick={() => study.run((s) => cancelPlan(s, view.plan.id))}
              >
                Remove
              </button>
            </span>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
  }

  .date {
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

  .top-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .shortcut {
    font-size: 13px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  kbd {
    padding: 1px 6px;
    border: 1px solid var(--hs-line);
    border-bottom-width: 2px;
    border-radius: 6px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 800;
  }

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

  .card-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.45rem;
  }

  .up-next {
    border-color: var(--hs-accent);
    box-shadow: 0 0 0 3px var(--hs-accent-soft);
  }

  .up-next-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 22px;
  }

  .up-next-body {
    flex: 1 1 320px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .buddy {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 196px;
    height: 196px;
    border-radius: 18px;
  }

  .bubble {
    align-self: flex-start;
    margin: 0;
    padding: 10px 16px;
    border-radius: 16px 16px 16px 4px;
    background: var(--hs-accent-soft);
    font-weight: 700;
    line-height: 1.4;
  }

  .crate-banner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    padding: 14px 18px;
    border-radius: var(--hs-radius-md);
    background: var(--hs-focus-ground);
    color: var(--hs-focus-text);
    text-decoration: none;
  }

  .crate-banner span {
    padding: 8px 16px;
    border-radius: 10px;
    background: #f5c542;
    color: var(--hs-focus-ground);
    font-weight: 800;
  }

  .eyebrow {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hs-accent-strong);
  }

  .dot {
    width: 12px;
    height: 12px;
    flex: none;
    border-radius: 999px;
  }

  .meta {
    margin: 0;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  .step {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--hs-ground);
    line-height: 1.5;
  }

  .todos {
    margin: 4px 0 0;
    padding-left: 20px;
  }

  .step span {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-subtle);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  button,
  .button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--hs-accent);
    color: #fff;
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
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
    color: var(--hs-accent-strong);
    text-decoration: underline;
  }

  .break {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    background: var(--hs-success-soft);
    border-color: transparent;
  }

  .break p {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
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

  .tile-label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-subtle);
  }

  .tile p.tile-value {
    margin: 4px 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.5rem;
  }

  .tile-note {
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  .tile-note a {
    color: var(--hs-accent-strong);
    font-weight: 700;
  }

  .plan {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .plan li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 6px 10px;
    border-radius: 12px;
  }

  .plan li.is-next {
    background: var(--hs-accent-soft);
  }

  .time {
    width: 48px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .bar {
    width: 4px;
    height: 34px;
    border-radius: 4px;
  }

  .what {
    flex: 1 1 180px;
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .what span {
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  .status {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }

  .status-done {
    background: var(--hs-success-soft);
    color: var(--hs-success-strong);
  }

  .status-running,
  .status-next {
    background: var(--hs-accent);
    color: #fff;
  }

  .status-planned {
    background: #eceef2;
    color: #4b5468;
  }

  .status-missed {
    background: #fdf0dc;
    color: #8f5300;
  }

  .row-actions {
    display: flex;
    gap: 6px;
  }

  .small {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
    font-size: 14px;
  }

  .small.ghost {
    border-color: transparent;
    background: transparent;
    color: var(--hs-ink-subtle);
  }

  .error {
    margin: 0;
    color: #b42318;
    font-weight: 700;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
