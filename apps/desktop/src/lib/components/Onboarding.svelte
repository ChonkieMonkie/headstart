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

<!-- First launch: say hello, pick a study buddy, add a first course and task, then start. Every step after the buddy can be skipped. -->
<script lang="ts">
  import { items, MASCOTS, type MascotId } from "@headstart/content";
  import { COURSE_COLORS, createCourse, createTask, localDayKey } from "@headstart/core";
  import { lookFor, Logo, Mascot, MASCOT_NAMES, MASCOT_SPECIES, MASCOT_TINTS } from "@headstart/ui";
  import { tick } from "svelte";
  import type { Study } from "$lib/study.svelte.ts";
  import DatePicker from "./DatePicker.svelte";

  let { study, onDone }: { study: Study; onDone: () => void } = $props();

  const STEPS = ["Welcome", "Study buddy", "First course", "First task", "Ready"] as const;
  const BLURBS: Record<MascotId, string> = {
    inky: "Calm and clever. Eight arms for eight subjects.",
    axo: "Cheerful and patient. Never stops growing.",
    maple: "Cosy and curious. Always up for one more chapter.",
  };
  const shortcut = /Mac/.test(navigator.userAgent) ? "⌥⇧H" : "Alt+Shift+H";

  let step = $state(0);
  let heading = $state<HTMLHeadingElement | null>(null);
  let error = $state<string | null>(null);

  let courseName = $state("");
  let courseCode = $state("");
  let examDate = $state("");
  let courseId = $state<string | null>(null);
  let taskTitle = $state("");
  let firstTodo = $state("");
  let taskId = $state<string | null>(null);

  const buddy = $derived(study.mascot);

  async function go(to: number): Promise<void> {
    error = null;
    step = to;
    await tick();
    heading?.focus();
  }

  async function pickBuddy(mascot: MascotId): Promise<void> {
    await study.chooseMascot(mascot);
    await go(2);
  }

  async function addCourse(): Promise<void> {
    const id = study.newId();
    const result = await study.run((s) =>
      createCourse(s, {
        courseId: id,
        name: courseName,
        code: courseCode,
        color: COURSE_COLORS[0],
        ...(examDate ? { examDate } : {}),
      }),
    );
    if (!result.ok) {
      error = result.reason;
      return;
    }
    courseId = id;
    await go(3);
  }

  async function addTask(): Promise<void> {
    if (!courseId) return;
    const id = study.newId();
    const result = await study.run((s) =>
      createTask(s, { taskId: id, courseId: courseId ?? "", title: taskTitle, nextStep: firstTodo }),
    );
    if (!result.ok) {
      error = result.reason;
      return;
    }
    taskId = id;
    await go(4);
  }

  async function startNow(): Promise<void> {
    onDone();
    await study.start(taskId ? { taskId } : {});
  }
</script>

<main class="onboarding" aria-labelledby="onboarding-h">
  <div class="card">
    <ol class="steps" aria-label="Steps">
      {#each STEPS as name, i (name)}
        <li class:done={i < step} class:current={i === step} aria-current={i === step ? "step" : undefined}>
          <span class="visually-hidden">{name}{i < step ? ", done" : ""}</span>
        </li>
      {/each}
    </ol>

    {#if step === 0}
      <div class="hello">
        <Logo size={64} />
        <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>Welcome to Headstart</h1>
        <p class="lead">A study companion that helps you get started, stay focused and keep going.</p>
        <ul class="points">
          <li><b>Start in one click.</b> Every task begins with a concrete first to-do.</li>
          <li><b>Focus sessions</b> with breaks, in a full window, full screen or a small floating timer.</li>
          <li><b>Earn crates by studying</b>, never by paying, and dress up your study buddy.</li>
        </ul>
        <p class="note">Everything stays on this computer.</p>
        <div class="actions">
          <button type="button" class="primary" onclick={() => go(1)}>Get started</button>
        </div>
      </div>
    {:else if step === 1}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>Pick your study buddy</h1>
      <p class="lead">They cheer you on, nudge you when a session is due and wear what you find in crates. You can switch any time.</p>
      <div class="buddies">
        {#each MASCOTS as m (m)}
          <button type="button" class="buddy" aria-pressed={buddy === m} onclick={() => pickBuddy(m)}>
            <span class="art" style:background={MASCOT_TINTS[m]}>
              <Mascot look={lookFor(m, {}, items)} mood="welcome" size={124} label="" />
            </span>
            <span class="name">{MASCOT_NAMES[m]}</span>
            <span class="species">the {MASCOT_SPECIES[m]}</span>
            <span class="blurb">{BLURBS[m]}</span>
          </button>
        {/each}
      </div>
    {:else if step === 2}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>Your first course</h1>
      <p class="lead">Start with the course you have the most work in right now. You can add more later.</p>
      <form
        class="form"
        onsubmit={(e) => {
          e.preventDefault();
          addCourse();
        }}
      >
        <label class="wide">
          <span>Course name</span>
          <input type="text" bind:value={courseName} maxlength="60" placeholder="Linear Algebra" required />
        </label>
        <label>
          <span>Course code (optional)</span>
          <input type="text" bind:value={courseCode} maxlength="16" placeholder="MA1234" autocomplete="off" spellcheck="false" />
        </label>
        <div class="field">
          <span>Exam date (optional)</span>
          <DatePicker bind:value={examDate} label="Exam date" optional min={localDayKey(Date.now())} />
        </div>
        {#if error}<p class="error wide" role="alert">{error}</p>{/if}
        <div class="actions wide">
          <button type="submit" class="primary">Add course</button>
          <button type="button" class="ghost" onclick={() => go(4)}>Skip for now</button>
        </div>
      </form>
    {:else if step === 3}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>A first task</h1>
      <p class="lead">
        Something you will work on next, and the very first thing you will do. A concrete first to-do is
        what makes starting easy.
      </p>
      <form
        class="form"
        onsubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <label class="wide">
          <span>Task</span>
          <input type="text" bind:value={taskTitle} maxlength="120" placeholder="Problems 4.12 to 4.15" required />
        </label>
        <label class="wide">
          <span>First to-do</span>
          <input type="text" bind:value={firstTodo} maxlength="200" placeholder="Open chapter 4 and read the worked example" required />
        </label>
        {#if error}<p class="error wide" role="alert">{error}</p>{/if}
        <div class="actions wide">
          <button type="submit" class="primary">Add task</button>
          <button type="button" class="ghost" onclick={() => go(4)}>Skip for now</button>
        </div>
      </form>
    {:else}
      <div class="hello">
        {#if study.look && buddy}
          <span class="art big" style:background={MASCOT_TINTS[buddy]}>
            <Mascot look={study.look} mood="celebrate" size={150} />
          </span>
        {/if}
        <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>You are ready</h1>
        <ul class="points">
          <li><b>{shortcut}</b> starts a session from anywhere, even when Headstart is hidden.</li>
          <li>The <b>menu bar or tray icon</b> shows the timer and starts sessions too.</li>
          <li><b>Plan sessions</b> on Today to get a reminder and an on-time bonus.</li>
          <li>Every <b>{study.context.rewards.studyCrateEvery} sessions</b> of {study.context.rewards.minMinutesForCrate} minutes or more earn a Study Crate.</li>
        </ul>
        <div class="actions">
          <button type="button" class="primary" onclick={startNow}>
            Start your first {study.settings.focusMinutes} minutes
          </button>
          <button type="button" class="secondary" onclick={onDone}>Go to Today</button>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .onboarding {
    min-height: 100vh;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    background: var(--hs-ground);
  }

  .card {
    width: min(760px, 100%);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 28px 32px 32px;
    border: 1px solid var(--hs-line);
    border-radius: 24px;
    background: var(--hs-surface);
  }

  .steps {
    display: flex;
    gap: 6px;
    margin: 0 0 6px;
    padding: 0;
    list-style: none;
  }

  .steps li {
    flex: 1 1 0;
    height: 6px;
    border-radius: 999px;
    background: var(--hs-line);
  }

  .steps li.done,
  .steps li.current {
    background: var(--hs-accent);
  }

  .steps li.current {
    opacity: 0.55;
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2rem;
  }

  h1:focus {
    outline: none;
  }

  .lead {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  .hello {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .points {
    margin: 4px 0 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    line-height: 1.5;
  }

  .note {
    margin: 0;
    font-size: 14px;
    color: var(--hs-ink-subtle);
  }

  .buddies {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
  }

  .buddy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 14px;
    border: 2px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
    font: inherit;
    color: var(--hs-ink);
    text-align: center;
    cursor: pointer;
  }

  .buddy:hover,
  .buddy[aria-pressed="true"] {
    border-color: var(--hs-accent);
  }

  .art {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 8px;
    padding: 6px 0;
    border-radius: var(--hs-radius-md);
  }

  .art.big {
    width: auto;
    padding: 8px 18px;
  }

  .name {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.2rem;
  }

  .species {
    font-size: 13px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .blurb {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.4;
    color: var(--hs-ink-muted);
  }

  .form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }

  .wide {
    grid-column: 1 / -1;
  }

  label,
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  input {
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #c9cfdc;
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    color: var(--hs-ink);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
  }

  .primary,
  .secondary,
  .ghost {
    min-height: 48px;
    padding: 0 22px;
    border-radius: 14px;
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

  .ghost {
    border: 0;
    background: none;
    color: var(--hs-ink-subtle);
    text-decoration: underline;
    text-underline-offset: 3px;
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
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
