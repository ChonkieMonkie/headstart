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
  Reviews, one after another: the question you wrote for yourself and what the
  session covered, then your own note, then Forgot or Remembered. Trying to
  recall before looking is what makes it work, so the note stays hidden until
  asked for. Space shows the note, 1 is Forgot, 2 is Remembered.
-->
<script lang="ts">
  import {
    addDays,
    daysToNextReview,
    LEARNED_STEP,
    localDayKey,
    sessionCovered,
    stepOn,
    writeRecall,
  } from "@headstart/core";
  import { Mascot } from "@headstart/ui";
  import { plural, weekdayOf } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import CourseName from "./CourseName.svelte";
  import MathField from "./MathField.svelte";
  import MathText from "./MathText.svelte";

  let { study }: { study: Study } = $props();

  const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

  let revealed = $state(false);
  let hint = $state(false);
  let scratch = $state("");
  let editing = $state(false);
  let editText = $state("");
  let editQuestion = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);

  const reviewing = $derived(study.reviewing);
  const sessionId = $derived(reviewing?.queue[reviewing.index] ?? null);
  const finished = $derived(reviewing !== null && sessionId === null);

  const current = $derived.by(() => {
    const state = study.state;
    if (!state || !sessionId) return null;
    const session = state.sessions.get(sessionId);
    const record = state.reviews.get(sessionId);
    if (!session || !record) return null;
    const today = localDayKey(study.now);
    const course = session.courseId ? state.courses.get(session.courseId) ?? null : null;
    const task = session.taskId ? state.tasks.get(session.taskId) ?? null : null;
    const step = stepOn(record, today);
    const note = session.recallText ?? "";
    const firstLine = note.split("\n").map((l) => l.trim()).find((l) => l !== "") ?? "";
    return {
      session,
      course,
      task,
      note,
      question: session.recallQuestion,
      covered: sessionCovered(state, sessionId),
      hintText: hintOf(firstLine),
      exam: step >= LEARNED_STEP,
      next: step >= LEARNED_STEP ? null : daysToNextReview(step),
      today,
    };
  });

  /**
   * The start of the note's first line: about a third of its words (3 to 8),
   * never cutting a formula in half. Enough to get going, not the answer.
   */
  function hintOf(line: string): string {
    const words = line.split(/\s+/).filter(Boolean);
    let n = Math.min(8, Math.max(3, Math.ceil(words.length / 3)));
    if (n >= words.length) n = Math.max(1, Math.floor(words.length / 2));
    let cut = words.slice(0, n);
    while ((cut.join(" ").match(/(?<!\\)\$/g)?.length ?? 0) % 2 === 1 && n < words.length) {
      n += 1;
      cut = words.slice(0, n);
    }
    return `${cut.join(" ")} …`;
  }

  // A new review starts hidden.
  $effect(() => {
    sessionId;
    revealed = false;
    hint = false;
    scratch = "";
    editing = false;
    error = null;
  });

  const rememberedLabel = $derived.by(() => {
    if (!current) return "";
    if (current.exam) return "Ready for the exam";
    if (current.next === null) return "Learned";
    return `Next in ${plural(current.next, "day")}, ${weekdayOf(addDays(current.today, current.next))}`;
  });

  const summary = $derived.by(() => {
    const results = reviewing?.results.filter((r) => r.remembered !== null) ?? [];
    const remembered = results.filter((r) => r.remembered).length;
    const state = study.state;
    const rows = results.map((r) => {
      const s = state?.sessions.get(r.sessionId);
      const task = s?.taskId ? state?.tasks.get(s.taskId) : undefined;
      const course = s?.courseId ? state?.courses.get(s.courseId) : undefined;
      return { id: r.sessionId, title: task?.title ?? course?.name ?? "A session", remembered: r.remembered };
    });
    return { answered: results.length, remembered, rows };
  });

  async function answer(remembered: boolean): Promise<void> {
    if (busy) return;
    busy = true;
    error = await study.answerReview(remembered);
    busy = false;
  }

  function startEdit(): void {
    if (!current) return;
    editText = current.note;
    editQuestion = current.question ?? "";
    editing = true;
  }

  async function saveEdit(): Promise<void> {
    if (!sessionId) return;
    const id = sessionId;
    const result = await study.run((s) => writeRecall(s, id, editText.trim(), editQuestion));
    if (!result.ok) {
      error = result.reason;
      return;
    }
    editing = false;
  }

  function keydown(event: KeyboardEvent): void {
    if (!reviewing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      study.closeReviews();
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)) return;
    if (finished || !current || editing) return;
    if (!revealed && (event.key === " " || event.key === "Enter") && target?.tagName !== "BUTTON") {
      event.preventDefault();
      revealed = true;
    } else if (revealed && event.key === "1") {
      answer(false);
    } else if (revealed && event.key === "2") {
      answer(true);
    }
  }
</script>

<svelte:window onkeydown={keydown} />

{#if reviewing}
  <div class="backdrop" role="presentation">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="review-title">
      {#if finished}
        <div class="top end"><button type="button" class="close" aria-label="Close" onclick={() => study.closeReviews()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg></button></div>
        <div class="done">
          {#if study.look}<Mascot look={study.look} mood="celebrate" size={150} />{/if}
          <h2 id="review-title">Reviews done</h2>
          {#if summary.answered > 0}
            <p class="lead">
              You remembered {summary.remembered} of {summary.answered}.
              {#if summary.remembered < summary.answered}What you forgot comes back tomorrow, that is how it sticks.{:else}Nicely done.{/if}
            </p>
            <ul class="results">
              {#each summary.rows as row (row.id)}
                <li><span>{row.title}</span><strong class:again={!row.remembered}>{row.remembered ? "Remembered" : "Again tomorrow"}</strong></li>
              {/each}
            </ul>
          {:else}
            <p class="lead">Nothing answered this time. They wait for you.</p>
          {/if}
          <button type="button" class="primary wide-btn" onclick={() => study.closeReviews()}>Done</button>
        </div>
      {:else if current}
        <div class="top">
          <span class="eyebrow">Review {reviewing.index + 1} of {reviewing.queue.length}{current.exam ? " · before the exam" : ""}</span>
          <button type="button" class="close" aria-label="Close" onclick={() => study.closeReviews()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
        </div>
        <div class="title">
          <span class="meta">
            {#if current.course}<CourseName course={current.course} />{/if}
            <span>· session on {longDate.format(current.session.endedAt)}</span>
          </span>
          <h2 id="review-title">{current.task?.title ?? current.course?.name ?? "Your note"}</h2>
        </div>

        {#if !revealed}
          <div class="ask">
            {#if study.look}<div class="buddy"><Mascot look={study.look} mood="focus" size={84} /></div>{/if}
            <div class="bubble">
              {#if current.question}
                <span class="label">Your question</span>
                <span class="question"><MathText text={current.question} /></span>
              {:else}
                <span class="question">What do you remember from this session? Say it out loud, or jot it down.</span>
              {/if}
            </div>
          </div>
          {#if current.covered.length > 0}
            <div class="covered">
              <span class="label">In this session you did</span>
              <ul>
                {#each current.covered as text, i (i)}
                  <li><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" /><path d="M4.6 8.2l2.2 2.2 4.6-4.8" /></svg><span><MathText {text} /></span></li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if hint}
            <div class="hint">
              <span class="label">Hint · the first line of your note <button type="button" class="link" onclick={() => (hint = false)}>Hide</button></span>
              <span><MathText text={current.hintText} /></span>
            </div>
          {/if}
          <label class="scratch">
            <span>Scratch space <small>Optional, not saved</small></span>
            <textarea rows="3" bind:value={scratch}></textarea>
          </label>
          <div class="actions">
            <button type="button" class="link" onclick={() => study.skipReview()}>Skip for today</button>
            <span class="grow"></span>
            {#if !hint}<button type="button" class="secondary" onclick={() => (hint = true)}>Show a hint</button>{/if}
            <button type="button" class="primary" onclick={() => (revealed = true)}>Show my note</button>
          </div>
        {:else if editing}
          <div class="edit">
            <label for="edit-q" class="label">Your question <small>Optional</small></label>
            <input id="edit-q" type="text" bind:value={editQuestion} maxlength="240" />
            <span class="label">Your note</span>
            <MathField bind:value={editText} rows={6} label="Your note" />
            {#if error}<p class="error" role="alert">{error}</p>{/if}
            <div class="actions">
              <button type="button" class="secondary" onclick={() => (editing = false)}>Cancel</button>
              <span class="grow"></span>
              <button type="button" class="primary" onclick={saveEdit}>Save note</button>
            </div>
          </div>
        {:else}
          <div class="answer">
            {#if current.question}
              <span class="label accent">Your question</span>
              <p class="q"><MathText text={current.question} /></p>
              <span class="rule" aria-hidden="true"></span>
            {/if}
            <span class="label">Your note</span>
            <div class="note"><MathText text={current.note} /></div>
          </div>
          <p class="how">How did it go?</p>
          <div class="choices">
            <button type="button" class="choice" disabled={busy} onclick={() => answer(false)}>
              <span class="big">Forgot</span><span class="small">Again tomorrow</span>
            </button>
            <button type="button" class="choice yes" disabled={busy} onclick={() => answer(true)}>
              <span class="big">Remembered</span><span class="small">{rememberedLabel}</span>
            </button>
          </div>
          {#if error}<p class="error" role="alert">{error}</p>{/if}
          <button type="button" class="link edit-link" onclick={startEdit}>Edit note</button>
        {/if}
      {:else}
        <div class="top end"><button type="button" class="close" aria-label="Close" onclick={() => study.closeReviews()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg></button></div>
        <p class="lead" id="review-title">This note is no longer there.</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--hs-backdrop);
  }

  .dialog {
    position: relative;
    width: min(560px, calc(100vw - 40px));
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 22px 24px;
    border-radius: 24px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    box-shadow: var(--hs-shadow-dialog);
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .top.end {
    justify-content: flex-end;
  }

  .eyebrow,
  .label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-muted);
  }

  .label.accent {
    color: var(--hs-accent-strong);
  }

  .label small {
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
  }

  .close {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 9px;
    background: var(--hs-ground);
    cursor: pointer;
  }

  .close svg {
    width: 12px;
    height: 12px;
    stroke: var(--hs-ink);
    stroke-width: 1.9;
    stroke-linecap: round;
  }

  .title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    color: var(--hs-ink-muted);
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.55rem;
  }

  .ask {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .buddy {
    flex: none;
  }

  .bubble {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 16px 16px 16px 4px;
    background: var(--hs-accent-soft);
  }

  .bubble .label {
    color: var(--hs-accent-strong);
  }

  .question {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.1rem;
    line-height: 1.35;
  }

  .covered ul {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .covered li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-weight: 700;
    font-size: 14.5px;
  }

  .covered svg {
    flex: none;
    width: 15px;
    height: 15px;
    margin-top: 2px;
  }

  .covered rect {
    fill: var(--hs-success);
  }

  .covered path {
    fill: none;
    stroke: #fff;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .hint {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border: 1.5px dashed var(--hs-field-line);
    border-radius: 12px;
  }

  .hint .label {
    display: flex;
    justify-content: space-between;
  }

  .scratch {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
  }

  .scratch small {
    font-weight: 600;
    color: var(--hs-ink-muted);
  }

  textarea,
  input[type="text"] {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 12px;
    font: inherit;
    font-weight: 400;
    color: var(--hs-ink);
    background: var(--hs-surface);
    resize: vertical;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .grow {
    flex: 1;
  }

  .primary,
  .secondary {
    min-height: 44px;
    padding: 0 18px;
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

  .link {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: none;
    color: var(--hs-accent-strong);
    cursor: pointer;
  }

  .answer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border: 1px solid var(--hs-line);
    border-radius: 16px;
    background: var(--hs-ground);
  }

  .q {
    margin: 0;
    font-weight: 800;
  }

  .rule {
    height: 1px;
    background: var(--hs-line);
  }

  .note {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.55;
  }

  .how {
    margin: 0;
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .choice {
    min-height: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 8px 12px;
    border: 1px solid var(--hs-field-line);
    border-radius: 14px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font: inherit;
    cursor: pointer;
  }

  .choice.yes {
    border-color: transparent;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
  }

  .big {
    font-size: 15px;
    font-weight: 800;
  }

  .small {
    font-size: 12.5px;
    font-weight: 700;
    opacity: 0.85;
  }

  .edit-link {
    align-self: flex-start;
    font-size: 13.5px;
  }

  .edit {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .lead {
    margin: 0;
    max-width: 380px;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  .results {
    align-self: stretch;
    list-style: none;
    margin: 0;
    padding: 0;
    text-align: left;
  }

  .results li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 0;
    border-top: 1px solid var(--hs-line);
    font-size: 14px;
    font-weight: 700;
  }

  .results strong {
    color: var(--hs-success-strong);
  }

  .results strong.again {
    color: var(--hs-warning-strong);
  }

  .wide-btn {
    align-self: stretch;
  }

  .error {
    margin: 0;
    color: var(--hs-danger-strong);
    font-weight: 700;
  }
</style>
