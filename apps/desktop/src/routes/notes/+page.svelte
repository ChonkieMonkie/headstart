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

<!-- A course's recall notes for exam prep: every note, newest first, searchable, with where each is in its reviews. -->
<script lang="ts">
  import {
    daysBetween,
    dueReviews,
    LEARNED_STEP,
    localDayKey,
    noteStatus,
    REVIEW_DAYS,
    reviewsLeftBeforeExam,
    stepOn,
  } from "@headstart/core";
  import { page } from "$app/state";
  import CourseName from "$lib/components/CourseName.svelte";
  import MathText from "$lib/components/MathText.svelte";
  import { useApp } from "$lib/context.ts";
  import { examLabel, plural, weekdayOf } from "$lib/format.ts";
  import { MODE_LABELS } from "$lib/modes.ts";

  const { study } = useApp();
  const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

  let search = $state("");
  let taskFilter = $state<string | null>(null);

  const courseId = $derived(page.url.searchParams.get("course"));
  const course = $derived(study.course(courseId));
  const today = $derived(localDayKey(study.now));

  const notes = $derived.by(() => {
    const state = study.state;
    if (!state || !course) return [];
    return [...state.sessions.values()]
      .filter((s) => s.courseId === course.id && s.recallText?.trim())
      .sort((a, b) => b.endedAt - a.endedAt)
      .map((s) => {
        const record = state.reviews.get(s.sessionId) ?? null;
        const task = s.taskId ? state.tasks.get(s.taskId) ?? null : null;
        return { session: s, record, task, status: record ? noteStatus(record, today) : ("learned" as const) };
      });
  });

  const tasks = $derived.by(() => {
    const seen = new Map<string, string>();
    for (const n of notes) if (n.task) seen.set(n.task.id, n.task.title);
    return [...seen].map(([id, title]) => ({ id, title }));
  });

  const shown = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return notes.filter(
      (n) =>
        (taskFilter === null || n.task?.id === taskFilter) &&
        (!q ||
          (n.session.recallText ?? "").toLowerCase().includes(q) ||
          (n.session.recallQuestion ?? "").toLowerCase().includes(q) ||
          (n.task?.title ?? "").toLowerCase().includes(q)),
    );
  });

  const counts = $derived({
    learned: notes.filter((n) => n.status === "learned").length,
    review: notes.filter((n) => n.status === "review").length,
    fresh: notes.filter((n) => n.status === "new").length,
  });

  const dueHere = $derived.by(() => {
    const state = study.state;
    if (!state || !course) return [];
    return dueReviews(state, today)
      .filter((r) => r.record.courseId === course.id)
      .map((r) => r.record.sessionId);
  });

  const left = $derived(study.state && course ? reviewsLeftBeforeExam(study.state, course.id, today) : 0);
  const examDays = $derived(course?.examDate ? daysBetween(today, course.examDate) : null);

  /** "Due today · day 3", "Next: Fri, day 7" or "Learned". */
  function statusLabel(n: (typeof notes)[number]): { text: string; kind: "due" | "next" | "learned" } {
    if (!n.record || n.status === "learned") return { text: "Learned", kind: "learned" };
    const step = stepOn(n.record, today);
    const day = REVIEW_DAYS[Math.min(step, LEARNED_STEP - 1)];
    if (n.record.dueDay && n.record.dueDay <= today) return { text: `Due today · day ${day}`, kind: "due" };
    const when = n.record.dueDay ? (daysBetween(today, n.record.dueDay) === 1 ? "tomorrow" : weekdayOf(n.record.dueDay)) : "";
    return { text: `Next: ${when}, day ${day}`, kind: "next" };
  }
</script>

{#if !course}
  <header class="top">
    <div>
      <a class="back" href="/courses">← Courses</a>
      <h1>Notes</h1>
    </div>
  </header>
  <ul class="course-list">
    {#each study.courses as c (c.id)}
      {@const n = study.recallsOf(c.id, 1000).length}
      {#if n > 0}
        <li><a href="/notes?course={c.id}"><CourseName course={c} /> <span>{plural(n, "note")}</span></a></li>
      {/if}
    {:else}
      <li class="empty">No courses yet.</li>
    {/each}
  </ul>
{:else}
  <header class="top">
    <div>
      <a class="back" href="/courses">← Courses</a>
      <h1><CourseName {course} /> <span class="dim">· notes</span></h1>
    </div>
    {#if dueHere.length > 0}
      <button type="button" class="primary" onclick={() => study.openReviews(dueHere)}>Review the {dueHere.length} due</button>
    {/if}
  </header>

  {#if notes.length > 0}
    <section class="card overview" aria-label="Overview">
      {#if course.examDate && examDays !== null}
        <div class="exam">
          <span class="label">Exam</span>
          <strong>{examLabel(examDays).replace("Exam ", "").replace(/^in /, "In ")}</strong>
          <span class="muted">{longDate.format(new Date(`${course.examDate}T12:00:00`))}</span>
        </div>
      {/if}
      <div class="progress">
        <div class="row">
          <strong>{plural(notes.length, "note")} · {counts.learned} learned</strong>
          {#if course.examDate && examDays !== null && examDays >= 0}<strong class="accent">{plural(left, "review")} left before the exam</strong>{/if}
        </div>
        <div class="stack" role="img" aria-label="{counts.learned} learned, {counts.review} in review, {counts.fresh} new">
          {#if counts.learned}<span class="learned" style:flex={counts.learned}></span>{/if}
          {#if counts.review}<span class="review" style:flex={counts.review}></span>{/if}
          {#if counts.fresh}<span class="fresh" style:flex={counts.fresh}></span>{/if}
        </div>
        <div class="legend">
          <span><i class="learned"></i>Learned</span><span><i class="review"></i>In review</span><span><i class="fresh"></i>New</span>
        </div>
      </div>
    </section>

    <div class="filters">
      <label class="search">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" /><path d="M10.5 10.5l3 3" /></svg>
        <span class="sr">Search notes</span>
        <input type="search" bind:value={search} placeholder="Search the notes" />
      </label>
      {#if tasks.length > 1}
        <div class="chips" role="group" aria-label="Filter by task">
          <button type="button" aria-pressed={taskFilter === null} onclick={() => (taskFilter = null)}>All tasks</button>
          {#each tasks as t (t.id)}
            <button type="button" aria-pressed={taskFilter === t.id} onclick={() => (taskFilter = taskFilter === t.id ? null : t.id)}>{t.title}</button>
          {/each}
        </div>
      {/if}
    </div>
    {#if search.trim()}<p class="muted small">{plural(shown.length, "note")} match "{search.trim()}". Newest first.</p>{/if}

    <ul class="notes">
      {#each shown as n (n.session.sessionId)}
        {@const status = statusLabel(n)}
        <li class="card note">
          <div class="note-head">
            <span>
              <strong>{longDate.format(n.session.endedAt)}</strong>
              {#if n.task}· <span class="task">{n.task.title}</span>{/if}
              <span class="muted">· {n.session.score.focusMinutes} min{n.session.mode ? ` · ${MODE_LABELS[n.session.mode].name}` : ""}</span>
            </span>
            <span class="status {status.kind}">{status.text}</span>
          </div>
          {#if n.session.recallQuestion}<p class="question"><MathText text={n.session.recallQuestion} /></p>{/if}
          <p class="text"><MathText text={n.session.recallText ?? ""} /></p>
        </li>
      {:else}
        <li class="muted">No notes match.</li>
      {/each}
    </ul>
  {:else}
    <p class="muted">No notes for {course.name} yet. They are written at Session complete, under "What do you remember?".</p>
  {/if}
{/if}

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 18px;
  }

  .back {
    font-size: 14px;
    font-weight: 800;
    color: var(--hs-accent-strong);
    text-decoration: none;
  }

  h1 {
    margin: 2px 0 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dim {
    color: var(--hs-ink-muted);
  }

  .primary {
    min-height: 44px;
    padding: 0 18px;
    border: 0;
    border-radius: 12px;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .card {
    padding: 18px 22px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .overview {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
    margin-bottom: 16px;
  }

  .exam {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 150px;
  }

  .exam strong {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.45rem;
  }

  .label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-muted);
  }

  .progress {
    flex: 1 1 360px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progress .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
  }

  .accent {
    color: var(--hs-accent-strong);
  }

  .stack {
    display: flex;
    gap: 2px;
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--hs-line);
  }

  .learned {
    background: var(--hs-success);
  }

  .review {
    background: var(--hs-accent);
  }

  .fresh {
    background: var(--hs-field-line);
  }

  .legend {
    display: flex;
    gap: 16px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .legend i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 8px;
  }

  .search {
    flex: 1 1 300px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    background: var(--hs-surface);
  }

  .search svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: var(--hs-ink-muted);
    stroke-width: 1.7;
    stroke-linecap: round;
  }

  .search input {
    flex: 1;
    border: 0;
    outline: none;
    background: transparent;
    font: inherit;
    color: var(--hs-ink);
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chips button {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid var(--hs-field-line);
    border-radius: 999px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font: inherit;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
  }

  .chips button[aria-pressed="true"] {
    border: 1.5px solid var(--hs-accent);
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .notes,
  .course-list {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .course-list a {
    display: flex;
    justify-content: space-between;
    padding: 14px 18px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
    color: var(--hs-ink);
    font-weight: 800;
    text-decoration: none;
  }

  .note {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .note-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 12px;
    align-items: center;
    font-size: 14px;
  }

  .task {
    font-weight: 800;
  }

  .status {
    font-size: 12.5px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 999px;
  }

  .status.due {
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
  }

  .status.next {
    background: var(--hs-ground);
    color: var(--hs-ink-muted);
  }

  .status.learned {
    background: var(--hs-success-soft);
    color: var(--hs-success-strong);
  }

  .question {
    margin: 0;
    font-weight: 800;
  }

  .text {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.6;
  }

  .muted {
    color: var(--hs-ink-muted);
  }

  .small {
    font-size: 13px;
    margin: 0;
  }
</style>
