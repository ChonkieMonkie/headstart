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
  First launch: say hello, pick light or dark, pick a study buddy, add a first
  course and task, turn on notifications, then start. Every step after the
  buddy can be skipped, and Back returns to the step before.
-->
<script lang="ts">
  import { items, MASCOTS, type MascotId } from "@headstart/content";
  import { COURSE_COLORS, createCourse, createTask, localDayKey, type Theme, updateCourse, updateTask } from "@headstart/core";
  import { lookFor, Logo, Mascot, MASCOT_NAMES, MASCOT_SPECIES, MASCOT_TINTS } from "@headstart/ui";
  import { tick } from "svelte";
  import { testNotification } from "$lib/shell.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import DatePicker from "./DatePicker.svelte";

  let { study, onDone }: { study: Study; onDone: () => void } = $props();

  type Step = "welcome" | "theme" | "buddy" | "course" | "task" | "notifications" | "ready";
  const STEPS: { id: Step; name: string }[] = [
    { id: "welcome", name: "Welcome" },
    { id: "theme", name: "Light or dark" },
    { id: "buddy", name: "Study buddy" },
    { id: "course", name: "First course" },
    { id: "task", name: "First task" },
    { id: "notifications", name: "Notifications" },
    { id: "ready", name: "Ready" },
  ];
  const THEMES: { value: Theme; label: string; hint: string }[] = [
    { value: "system", label: "System", hint: "Follows your computer, day and night" },
    { value: "light", label: "Light", hint: "Bright and airy" },
    { value: "dark", label: "Dark", hint: "Easy on the eyes in the evening" },
  ];
  const BLURBS: Record<MascotId, string> = {
    inky: "Calm and clever. Eight arms for eight subjects.",
    axo: "Cheerful and patient. Never stops growing.",
    maple: "Cosy and curious. Always up for one more chapter.",
  };
  const shortcut = /Mac/.test(navigator.userAgent) ? "⌥⇧H" : "Alt+Shift+H";

  let step = $state<Step>("welcome");
  /** The steps taken so far, so Back returns to the one before (skips included). */
  let trail = $state<Step[]>([]);
  let heading = $state<HTMLHeadingElement | null>(null);
  let error = $state<string | null>(null);

  let courseName = $state("");
  let courseCode = $state("");
  let examDate = $state("");
  let courseId = $state<string | null>(null);
  let taskTitle = $state("");
  let firstTodo = $state("");
  let taskId = $state<string | null>(null);
  /** What the notifications step says after the button, or null before it is pressed. */
  let notifyNote = $state<string | null>(null);

  const buddy = $derived(study.mascot);
  const index = $derived(STEPS.findIndex((s) => s.id === step));

  async function show(to: Step): Promise<void> {
    error = null;
    step = to;
    await tick();
    heading?.focus();
  }

  async function go(to: Step): Promise<void> {
    trail.push(step);
    await show(to);
  }

  async function back(): Promise<void> {
    const to = trail.pop();
    if (to) await show(to);
  }

  async function pickTheme(theme: Theme): Promise<void> {
    if (study.settings.theme !== theme) error = await study.saveSettings({ theme });
  }

  async function pickBuddy(mascot: MascotId): Promise<void> {
    await study.chooseMascot(mascot);
    await go("course");
  }

  /** Adds the course, or saves changes to it after coming back with Back. */
  async function saveCourse(): Promise<void> {
    const existing = courseId ? study.state?.courses.get(courseId) : undefined;
    if (existing && courseId) {
      const id = courseId;
      const changed =
        existing.name !== courseName.trim() || (existing.code ?? "") !== courseCode.trim() || (existing.examDate ?? "") !== examDate;
      if (changed) {
        const result = await study.run((s) =>
          updateCourse(s, id, { name: courseName, code: courseCode || null, examDate: examDate || null }),
        );
        if (!result.ok) {
          error = result.reason;
          return;
        }
      }
      await go("task");
      return;
    }
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
    await go("task");
  }

  /** Adds the task, or saves changes to it after coming back with Back. */
  async function saveTask(): Promise<void> {
    if (!courseId) return;
    const existing = taskId ? study.state?.tasks.get(taskId) : undefined;
    if (existing && taskId) {
      const id = taskId;
      if (existing.title !== taskTitle.trim() || existing.nextStep !== firstTodo.trim()) {
        const result = await study.run((s) => updateTask(s, id, { title: taskTitle, nextStep: firstTodo }));
        if (!result.ok) {
          error = result.reason;
          return;
        }
      }
      await go("notifications");
      return;
    }
    const id = study.newId();
    const result = await study.run((s) =>
      createTask(s, { taskId: id, courseId: courseId ?? "", title: taskTitle, nextStep: firstTodo }),
    );
    if (!result.ok) {
      error = result.reason;
      return;
    }
    taskId = id;
    await go("notifications");
  }

  /**
   * Sends a first notification. The computer asks whether Headstart may show
   * notifications the first time it sends one, so this brings that question up
   * now, instead of in the middle of the first session.
   */
  async function turnOnNotifications(): Promise<void> {
    const sent = await testNotification(study.settings.chime);
    notifyNote = sent
      ? "Sent. If your computer asked, choose Allow. You can change it later in your system's notification settings."
      : "Notifications only work in the installed app.";
  }

  async function startNow(): Promise<void> {
    onDone();
    await study.start(taskId ? { taskId } : {});
  }
</script>

<main class="onboarding" aria-labelledby="onboarding-h">
  <div class="card">
    <div class="top">
      {#if trail.length > 0}
        <button type="button" class="back" onclick={back}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          Back
        </button>
      {/if}
      <ol class="steps" aria-label="Steps">
        {#each STEPS as s, i (s.id)}
          <li class:done={i < index} class:current={i === index} aria-current={i === index ? "step" : undefined}>
            <span class="visually-hidden">{s.name}{i < index ? ", done" : ""}</span>
          </li>
        {/each}
      </ol>
    </div>

    {#if step === "welcome"}
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
          <button type="button" class="primary" onclick={() => go("theme")}>Get started</button>
        </div>
      </div>
    {:else if step === "theme"}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>Light or dark?</h1>
      <p class="lead">Pick how Headstart looks. You can change it any time in Settings.</p>
      <div class="themes" role="group" aria-label="Theme">
        {#each THEMES as t (t.value)}
          <button type="button" class="theme" aria-pressed={study.settings.theme === t.value} onclick={() => pickTheme(t.value)}>
            <span class="preview {t.value}" aria-hidden="true">
              <span class="half light"><span class="bar"></span><span class="line"></span><span class="line short"></span></span>
              <span class="half dark"><span class="bar"></span><span class="line"></span><span class="line short"></span></span>
            </span>
            <span class="name">{t.label}</span>
            <span class="blurb">{t.hint}</span>
          </button>
        {/each}
      </div>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <div class="actions">
        <button type="button" class="primary" onclick={() => go("buddy")}>Continue</button>
      </div>
    {:else if step === "buddy"}
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
    {:else if step === "course"}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>Your first course</h1>
      <p class="lead">Start with the course you have the most work in right now. You can add more later.</p>
      <form
        class="form"
        onsubmit={(e) => {
          e.preventDefault();
          saveCourse();
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
          <button type="submit" class="primary">{courseId ? "Continue" : "Add course"}</button>
          {#if !courseId}
            <button type="button" class="ghost" onclick={() => go("notifications")}>Skip for now</button>
          {/if}
        </div>
      </form>
    {:else if step === "task"}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>A first task</h1>
      <p class="lead">
        Something you will work on next, and the very first thing you will do. A concrete first to-do is
        what makes starting easy.
      </p>
      <form
        class="form"
        onsubmit={(e) => {
          e.preventDefault();
          saveTask();
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
          <button type="submit" class="primary">{taskId ? "Continue" : "Add task"}</button>
          {#if !taskId}
            <button type="button" class="ghost" onclick={() => go("notifications")}>Skip for now</button>
          {/if}
        </div>
      </form>
    {:else if step === "notifications"}
      <h1 id="onboarding-h" tabindex="-1" bind:this={heading}>Notifications</h1>
      <p class="lead">
        Headstart tells you when a session ends, when the break is over and just before a planned session.
        Your computer asks once whether that is OK.
      </p>
      <ul class="points">
        <li>Only about your own sessions and plans. You choose the reminders and nudges in Settings.</li>
        <li>Nothing else: no news, no streak warnings, no ads.</li>
      </ul>
      {#if notifyNote}<p class="note-box" role="status">{notifyNote}</p>{/if}
      <div class="actions">
        {#if notifyNote}
          <button type="button" class="primary" onclick={() => go("ready")}>Continue</button>
        {:else}
          <button type="button" class="primary" onclick={turnOnNotifications}>Turn on notifications</button>
          <button type="button" class="ghost" onclick={() => go("ready")}>Not now</button>
        {/if}
      </div>
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

  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 36px;
    margin: 0 0 6px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 12px 0 6px;
    border: 0;
    border-radius: 10px;
    background: none;
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .back:hover {
    background: var(--hs-raised);
    color: var(--hs-ink);
  }

  .back svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .steps {
    flex: 1;
    display: flex;
    gap: 6px;
    margin: 0;
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

  .themes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
  }

  .theme {
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

  .theme:hover,
  .theme[aria-pressed="true"] {
    border-color: var(--hs-accent);
  }

  /* A tiny window in the theme's colours; System shows both halves. */
  .preview {
    display: flex;
    width: 100%;
    height: 96px;
    margin-bottom: 8px;
    overflow: hidden;
    border-radius: var(--hs-radius-md);
    border: 1px solid var(--hs-line);
  }

  .preview.light .half.dark,
  .preview.dark .half.light {
    display: none;
  }

  .half {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 14px 12px;
  }

  .half.light {
    background: #f3f5fa;
  }

  .half.dark {
    background: #131417;
  }

  .half .bar {
    width: 46px;
    height: 12px;
    border-radius: 5px;
    background: #5b4bd6;
  }

  .half.dark .bar {
    background: #a99bff;
  }

  .half .line {
    height: 8px;
    border-radius: 4px;
    background: #e2e6ef;
  }

  .half.dark .line {
    background: #34373f;
  }

  .half .line.short {
    width: 60%;
  }

  .note-box {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--hs-raised);
    font-weight: 700;
    line-height: 1.45;
    color: var(--hs-ink-muted);
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
    border: 1px solid var(--hs-field-line);
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
    color: var(--hs-on-accent);
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
    color: var(--hs-danger);
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
