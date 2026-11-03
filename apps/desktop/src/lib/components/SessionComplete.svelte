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

<!-- Shown when a session ends: what it earned, then recall, a focus rating and the next step. Every field is optional. -->
<script lang="ts">
  import { untrack } from "svelte";
  import { formatDuration } from "@headstart/core";
  import { plural } from "$lib/format.ts";
  import type { Study } from "$lib/study.svelte.ts";

  let { study }: { study: Study } = $props();

  // The completion does not change while this screen is open.
  const done = untrack(() => study.completion);
  const RATINGS = ["Scattered", "Distracted", "Okay", "Focused", "In the zone"];

  let recall = $state("");
  let rating = $state<number | null>(null);
  let nextStep = $state(done?.task?.nextStep ?? "");
  let taskDone = $state(false);
  let error = $state<string | null>(null);
  let saving = $state(false);

  const recallCounts = $derived(done ? recall.trim().length >= done.minRecallChars : false);
  const level = $derived(study.summary?.level);

  const headline = $derived.by(() => {
    if (!done) return "";
    const what = done.course ? ` on ${done.course.name}` : "";
    const streak =
      done.onTime && done.onTimeStreak > 1
        ? ` That is ${plural(done.onTimeStreak, "on-time start")} in a row.`
        : done.onTime
          ? " You started on time."
          : "";
    return `${plural(done.focusMinutes, "minute")}${what}.${streak}`;
  });

  async function save(): Promise<void> {
    saving = true;
    error = await study.saveCompletion({ recall, rating, nextStep, taskDone });
    saving = false;
  }
</script>

{#if done}
  <main class="complete" aria-labelledby="complete-h">
    <div class="column">
      <header>
        <h1 id="complete-h">Session complete!</h1>
        <p class="lead">{headline}</p>
      </header>

      <section class="card" aria-label="What you earned">
        <ul class="earned">
          <li><span>Focus session</span><strong>+{done.baseXp} XP</strong></li>
          {#if done.onTimeXp > 0}
            <li><span>Started on time</span><strong>+{done.onTimeXp} XP</strong></li>
          {/if}
          {#if done.distractionFreeXp > 0}
            <li><span>No distractions</span><strong>+{done.distractionFreeXp} XP</strong></li>
          {/if}
          <li class:muted={!recallCounts}>
            <span>Recall written</span>
            <strong>{recallCounts ? `+${done.recallBonusXp} XP` : "Write a few lines"}</strong>
          </li>
        </ul>
        {#if level}
          <div class="level">
            <div class="level-row">
              <span>Level {level.level}</span>
              <span>{level.xpIntoLevel} / {level.xpForNextLevel} XP</span>
            </div>
            <div class="bar" aria-hidden="true">
              <div class="bar-fill" style:width="{(level.xpIntoLevel / level.xpForNextLevel) * 100}%"></div>
            </div>
          </div>
        {/if}
        <p class="crate">
          {#if done.crateEarned}
            <strong>Study Crate earned!</strong> Crates can be opened in an upcoming update.
          {:else}
            Next Study Crate: {study.summary?.crateProgress ?? 0} of {study.summary?.crateEvery ?? 3} sessions
          {/if}
        </p>
      </section>

      <form
        class="card"
        onsubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div class="field">
          <h2 id="recall-h">What do you remember?</h2>
          <p class="hint" id="recall-hint">
            Write down everything you can recall from this session, without looking. A minute is
            enough. This is the step that makes it stick.
          </p>
          <textarea rows="5" bind:value={recall} aria-labelledby="recall-h" aria-describedby="recall-hint"></textarea>
        </div>

        <fieldset class="field">
          <legend><h2>How focused were you?</h2></legend>
          <div class="ratings">
            {#each RATINGS as label, i (label)}
              <button
                type="button"
                class="rating"
                aria-pressed={rating === i + 1}
                onclick={() => (rating = rating === i + 1 ? null : i + 1)}
              >
                <span class="rating-n">{i + 1}</span>
                <span class="rating-label">{label}</span>
              </button>
            {/each}
          </div>
        </fieldset>

        {#if done.task}
          <div class="field">
            <h2 id="next-h">Next time, start with</h2>
            <p class="hint" id="next-hint">
              {done.task.title}. Leaving a clear thread makes the next start easier.
            </p>
            <input type="text" bind:value={nextStep} maxlength="200" aria-labelledby="next-h" aria-describedby="next-hint" />
            <label class="check">
              <input type="checkbox" bind:checked={taskDone} />
              This task is done
            </label>
          </div>
        {/if}

        {#if error}
          <p class="error" role="alert">{error}</p>
        {/if}

        <div class="actions">
          <button type="submit" class="primary" disabled={saving}>Save and continue</button>
          <button type="button" class="secondary" onclick={() => study.dismissCompletion()}>Skip</button>
          {#if study.breakTimer}
            <span class="break" aria-live="off">
              {study.breakTimer.long ? "Long break" : "Break"}: {formatDuration(study.remaining)} left
              <button type="button" class="link" onclick={() => study.skipBreak()}>Skip break</button>
            </span>
          {/if}
        </div>
      </form>
    </div>
  </main>
{/if}

<style>
  .complete {
    min-height: 100vh;
    box-sizing: border-box;
    padding: 36px 24px 48px;
    background: var(--hs-ground);
  }

  .column {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.2rem;
  }

  .lead {
    margin: 6px 0 0;
    font-size: 1.05rem;
    color: var(--hs-ink-muted);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 22px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .earned {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .earned li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-weight: 700;
  }

  .earned strong {
    color: var(--hs-success-strong);
  }

  .earned .muted strong {
    color: var(--hs-ink-subtle);
  }

  .level-row {
    display: flex;
    justify-content: space-between;
    font-weight: 800;
    font-size: 14px;
  }

  .bar {
    height: 10px;
    margin-top: 6px;
    border-radius: 999px;
    background: var(--hs-line);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--hs-accent);
  }

  .crate {
    margin: 0;
    color: var(--hs-ink-muted);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.25rem;
  }

  legend {
    padding: 0;
    margin-bottom: 8px;
  }

  .hint {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  textarea,
  input[type="text"] {
    box-sizing: border-box;
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #c9cfdc;
    border-radius: 12px;
    font: inherit;
    color: var(--hs-ink);
    background: var(--hs-surface);
  }

  textarea {
    resize: vertical;
    line-height: 1.5;
  }

  .ratings {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
    gap: 8px;
  }

  .rating {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 64px;
    padding: 8px;
    border: 2px solid var(--hs-line);
    border-radius: 12px;
    background: var(--hs-surface);
    font: inherit;
    cursor: pointer;
  }

  .rating[aria-pressed="true"] {
    border-color: var(--hs-accent);
    background: var(--hs-accent-soft);
  }

  .rating-n {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }

  .rating-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    font-weight: 700;
  }

  .check input {
    width: 18px;
    height: 18px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .actions button {
    min-height: 46px;
    padding: 0 20px;
    border-radius: 12px;
    font: inherit;
    font-weight: 800;
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

  .break {
    margin-left: auto;
    font-weight: 800;
    color: var(--hs-accent-strong);
    font-variant-numeric: tabular-nums;
  }

  .actions .link {
    min-height: 32px;
    padding: 0 0 0 6px;
    border: 0;
    background: none;
    color: var(--hs-accent-strong);
    text-decoration: underline;
    font-weight: 700;
  }

  .error {
    margin: 0;
    color: #b42318;
    font-weight: 700;
  }

  button:focus-visible,
  textarea:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
