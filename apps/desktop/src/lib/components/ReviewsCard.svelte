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

<!-- Today's reviews: the notes due, with where each is in its schedule, and what comes in the next days. -->
<script lang="ts">
  import {
    daysBetween,
    dueReviews,
    LEARNED_STEP,
    localDayKey,
    REVIEW_DAYS,
    reviewForecast,
    reviewsLeftBeforeExam,
    stepOn,
  } from "@headstart/core";
  import { courseColor } from "@headstart/ui";
  import { plural, weekdayOf } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import CourseName from "./CourseName.svelte";

  let { study }: { study: Study } = $props();

  const SHOWN = 5;
  const today = $derived(localDayKey(study.now));
  const due = $derived(study.reviewsToday);
  const later = $derived.by(() => {
    const state = study.state;
    return state ? Math.max(0, dueReviews(state, today).length - due.length - study.skippedReviews.length) : 0;
  });

  const rows = $derived.by(() => {
    const state = study.state;
    return due.slice(0, SHOWN).map((r) => {
      const course = r.record.courseId ? state?.courses.get(r.record.courseId) ?? null : null;
      const task = r.record.taskId ? state?.tasks.get(r.record.taskId) ?? null : null;
      const step = stepOn(r.record, today);
      const age = daysBetween(r.record.sessionDay, today);
      return {
        id: r.record.sessionId,
        title: task?.title ?? course?.name ?? "A session",
        course,
        from: age === 1 ? "yesterday" : age < 7 ? weekdayOf(r.record.sessionDay) : `${age} days ago`,
        step,
        label: r.kind === "exam" ? "Before the exam" : `Day ${REVIEW_DAYS[Math.min(step, LEARNED_STEP - 1)]}`,
      };
    });
  });

  const forecast = $derived.by(() => {
    const state = study.state;
    return state ? reviewForecast(state, today, 4).filter((d) => d.count > 0) : [];
  });

  /** The course with the soonest exam among today's reviews, and its reviews left. */
  const exam = $derived.by(() => {
    const state = study.state;
    if (!state) return null;
    const course = due
      .map((r) => (r.record.courseId ? state.courses.get(r.record.courseId) : undefined))
      .find((c) => c?.examDate && c.examDate >= today);
    if (!course?.examDate) return null;
    return { course, days: daysBetween(today, course.examDate), left: reviewsLeftBeforeExam(state, course.id, today) };
  });

  const dayName = (day: string) => (daysBetween(today, day) === 1 ? "Tomorrow" : weekdayOf(day));
</script>

{#if due.length > 0}
  <section class="card reviews" aria-labelledby="rv-h">
    <div class="head">
      <div>
        <h2 id="rv-h">Reviews due today</h2>
        <p class="sub">Your own notes, back on day 1, 3, 7, 14 and 30. About a minute each.</p>
      </div>
      <div class="buttons">
        {#if !study.active}
          <button type="button" class="secondary" onclick={() => study.start({ minutes: 5, mode: "test", withReviews: true })}>As a 5-min session</button>
        {/if}
        <button type="button" class="primary" onclick={() => study.openReviews()}>Start {plural(due.length, "review")}</button>
      </div>
    </div>
    <ul class="list">
      {#each rows as row (row.id)}
        <li>
          <span class="bar" style:background={row.course ? courseColor(row.course.color) : "var(--hs-line)"} aria-hidden="true"></span>
          <span class="what">
            <span class="title">{row.title}</span>
            <span class="from">{#if row.course}<CourseName course={row.course} dot={false} />{" · "}{/if}note from {row.from}</span>
          </span>
          <span class="dots" role="img" aria-label="Review {Math.min(row.step + 1, LEARNED_STEP)} of {LEARNED_STEP}">
            {#each REVIEW_DAYS as _, i (i)}
              <span class="dot" class:done={i < row.step} class:now={i === row.step}></span>
            {/each}
          </span>
          <span class="day">{row.label}</span>
        </li>
      {/each}
    </ul>
    {#if due.length > SHOWN || later > 0}
      <p class="more">
        {#if due.length > SHOWN}and {plural(due.length - SHOWN, "more review")} today{/if}{#if due.length > SHOWN && later > 0}, {/if}{#if later > 0}{plural(later, "review")} moved to the next days{/if}
      </p>
    {/if}
    {#if forecast.length > 0 || exam}
      <div class="foot">
        {#if forecast.length > 0}
          <span class="coming">Coming up: {forecast.map((d) => `${dayName(d.day)} ${d.count}`).join(" · ")}</span>
        {/if}
        {#if exam}
          <a href="/notes?course={exam.course.id}">{exam.course.name} exam in {plural(exam.days, "day")}: {plural(exam.left, "review")} left</a>
        {/if}
      </div>
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
    align-items: center;
    gap: 12px;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }

  .sub {
    margin: 2px 0 0;
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
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

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .list li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 54px;
    border-top: 1px solid var(--hs-line);
  }

  .bar {
    width: 4px;
    align-self: stretch;
    margin: 10px 0;
    border-radius: 4px;
  }

  .what {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .title {
    font-weight: 800;
  }

  .from {
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  .dots {
    flex: none;
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--hs-line);
  }

  .dot.done {
    background: var(--hs-success);
  }

  .dot.now {
    width: 18px;
    background: var(--hs-accent);
  }

  .day {
    flex: none;
    min-width: 64px;
    text-align: right;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .more {
    margin: 0;
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 16px;
    font-size: 13.5px;
  }

  .coming {
    color: var(--hs-ink-muted);
    font-weight: 700;
  }

  .foot a {
    font-weight: 800;
    color: var(--hs-accent-strong);
  }
</style>
