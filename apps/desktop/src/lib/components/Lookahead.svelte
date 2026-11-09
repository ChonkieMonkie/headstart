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
  The weekly look-ahead: about two minutes, every step can be skipped and the
  whole thing closed. Last week, the week ahead, a goal for the week, and
  then planning just the next two days.
-->
<script lang="ts">
  import { localDayKey, tasksToPlan } from "@headstart/core";
  import { Mascot } from "@headstart/ui";
  import { useApp } from "$lib/context.ts";
  import { formatMinutes } from "@headstart/core";
  import { fromInputs, plural } from "$lib/format.ts";
  import { markLookaheadDone } from "$lib/lookahead.ts";
  import PlannerBoard from "./planner/PlannerBoard.svelte";

  let { onClose }: { onClose: () => void } = $props();
  const { study, calendars } = useApp();
  const MINUTE = 60_000;
  const DAY = 24 * 60 * MINUTE;
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let step = $state(1);
  const addDays = (day: string, n: number) => {
    const [y, m, d] = day.split("-").map(Number);
    return localDayKey(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + n, 12).getTime());
  };
  const dayStart = (day: string) => fromInputs(day, "00:00");
  const today = localDayKey(Date.now());
  const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });

  // Step 1: the last seven days, today included.
  const lastWeek = $derived.by(() => {
    const state = study.state;
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const perDay = new Map(days.map((d) => [d, 0]));
    let sessions = 0;
    let minutes = 0;
    let planned = 0;
    let onTime = 0;
    const from = dayStart(days[0] ?? today);
    for (const r of state?.sessions.values() ?? []) {
      if (r.startedAt < from) continue;
      sessions += 1;
      minutes += r.score.focusMinutes;
      const key = localDayKey(r.startedAt);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
      if (r.score.onTime !== null) {
        planned += 1;
        if (r.score.onTime) onTime += 1;
      }
    }
    let tasksDone = 0;
    for (const t of state?.tasks.values() ?? []) if (t.completedAt !== null && t.completedAt >= from) tasksDone += 1;
    const bars = days.map((d) => ({ day: d, label: SHORT[new Date(dayStart(d) + 12 * 3_600_000).getDay()] ?? "", count: perDay.get(d) ?? 0 }));
    const studyDays = bars.filter((b) => b.count > 0).length;
    const best = bars.reduce((a, b) => (b.count > a.count ? b : a), bars[0] ?? { day: today, label: "", count: 0 });
    return { sessions, minutes, planned, onTime, tasksDone, bars, studyDays, best };
  });
  const maxBar = $derived(Math.max(1, ...lastWeek.bars.map((b) => b.count)));
  const lastWeekLine = $derived.by(() => {
    const w = lastWeek;
    if (w.sessions === 0) return "A quiet week. A fresh one starts now, and one session is enough to get going.";
    const best = w.best.count > 1 ? ` ${WEEKDAYS[new Date(dayStart(w.best.day) + 12 * 3_600_000).getDay()]} was your best day.` : "";
    return `${plural(w.studyDays, "study day")} out of seven.${best}`;
  });

  // Step 2: the next seven days, from tomorrow.
  const ahead = $derived.by(() => {
    const state = study.state;
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i + 1);
      const from = dayStart(day);
      const to = dayStart(addDays(day, 1));
      const events = calendars.between(from, to);
      // Busy minutes between 08:00 and 18:00, overlaps counted once.
      const lo = from + 8 * 60 * MINUTE;
      const hi = from + 18 * 60 * MINUTE;
      const spans = events
        .filter((e) => !e.allDay)
        .map((e) => [Math.max(lo, e.start), Math.min(hi, e.end)] as const)
        .filter(([a, b]) => b > a)
        .sort((a, b) => a[0] - b[0]);
      let busy = 0;
      let cursor = lo;
      for (const [a, b] of spans) {
        const start = Math.max(a, cursor);
        if (b > start) busy += b - start;
        cursor = Math.max(cursor, b);
      }
      const free = 600 - busy / MINUTE;
      const deadlines: string[] = [];
      for (const t of state?.tasks.values() ?? []) if (!t.done && t.dueDay === day) deadlines.push(`Due: ${t.title}`);
      for (const c of state?.courses.values() ?? []) if (!c.archived && c.examDate === day) deadlines.push(`Exam: ${c.name}`);
      const tag = events.length === 0 ? "Free" : free >= 420 ? "Lots of free time" : free >= 180 ? "Some free time" : "Busy";
      return { day, events: events.slice(0, 3), more: Math.max(0, events.length - 3), deadlines, tag, good: tag === "Free" || tag === "Lots of free time" };
    });
  });
  const deadlineNote = $derived.by(() => {
    const count = ahead.reduce((n, d) => n + d.deadlines.length, 0);
    if (count === 0) return null;
    const last = ahead[ahead.length - 1]?.day ?? today;
    const heavy = (study.state ? tasksToPlan(study.state, Date.now()) : []).find(
      (r) => r.task.dueDay !== null && r.task.dueDay <= last && (r.progress.left ?? 0) > 0,
    );
    const left = heavy ? ` ${heavy.task.title} has about ${plural(heavy.progress.left ?? 0, "session")} left.` : "";
    return `${count === 1 ? "One deadline" : `${count} deadlines`} this week.${left}`;
  });

  // Step 3: study days (1 to 7) and a rest day. Seven asks first.
  let studyDays = $state(study.settings.studyDays);
  let restDay = $state<number | null>(study.settings.restDay ?? 0);
  let askSeven = $state(false);
  function slide(value: number): void {
    if (value === 7 && studyDays < 7) {
      askSeven = true;
      return;
    }
    studyDays = value;
    if (value < 7 && restDay === null) restDay = 0;
  }
  const goalLine = $derived(
    studyDays === 7
      ? "Seven days. Keep one of them light, so you can keep going."
      : `${plural(studyDays, "day")}${restDay !== null ? ` with ${WEEKDAYS[restDay]} off` : ""}. ${studyDays >= 6 ? "A busy week, but you still get a break." : "Sounds just right."}`,
  );
  async function saveGoal(): Promise<void> {
    await study.saveSettings({ studyDays, restDay: studyDays === 7 ? null : restDay });
    step = 4;
  }

  // Step 4: plan just the next two days.
  const firstDays = [addDays(today, 1), addDays(today, 2)];

  function finish(): void {
    markLookaheadDone();
    onClose();
  }
</script>

<svelte:window
  onkeydown={(e) => {
    // Escape closes the plan editor first when it is open.
    if (e.key === "Escape" && !askSeven && !document.querySelector(".editor")) onClose();
  }}
/>

<div class="backdrop" role="presentation">
<div class="flow" role="dialog" aria-modal="true" aria-labelledby="flow-title" class:wide={step === 4}>
  <div class="head">
    <div class="head-left">
      <span class="eyebrow">Week look-ahead</span>
      <span class="dots" role="img" aria-label="Step {step} of 4">
        {#each [1, 2, 3, 4] as i (i)}<span class="dot" class:on={i <= step} class:current={i === step}></span>{/each}
      </span>
    </div>
    <button type="button" class="close" aria-label="Close" onclick={onClose}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
    </button>
  </div>

  {#if step === 1}
    <h2 id="flow-title">Last week</h2>
    <div class="mascot-row">
      {#if study.look}<div class="mascot"><Mascot look={study.look} mood="celebrate" size={104} /></div>{/if}
      <p class="bubble">{lastWeekLine}</p>
    </div>
    <div class="tiles">
      <div class="tile"><span>Sessions</span><b>{lastWeek.sessions}</b></div>
      <div class="tile"><span>Focus</span><b>{formatMinutes(lastWeek.minutes)}</b></div>
      <div class="tile"><span>On time</span><b>{lastWeek.planned ? `${lastWeek.onTime} of ${lastWeek.planned}` : "–"}</b></div>
      <div class="tile"><span>Tasks done</span><b>{lastWeek.tasksDone}</b></div>
    </div>
    <div class="bars" role="img" aria-label="Sessions per day: {lastWeek.bars.map((b) => `${b.label} ${b.count}`).join(', ')}">
      {#each lastWeek.bars as bar (bar.day)}
        <div class="bar-col">
          <span class="bar-value">{bar.count || ""}</span>
          <span class="bar" class:empty={bar.count === 0} style:height="{bar.count ? (bar.count / maxBar) * 64 : 2}px"></span>
          <span class="bar-label">{bar.label}</span>
        </div>
      {/each}
    </div>
    <div class="foot">
      <button type="button" class="link" onclick={() => (step = 2)}>Skip</button>
      <button type="button" class="primary" onclick={() => (step = 2)}>Next: the week ahead</button>
    </div>
  {:else if step === 2}
    <h2 id="flow-title">The week ahead</h2>
    <p class="sub">From your calendars and your task dates.</p>
    <div class="days">
      {#each ahead as d (d.day)}
        <div class="day-row">
          <span class="day-name">{dayName.format(dayStart(d.day) + 12 * 3_600_000)}</span>
          <span class="chips">
            {#each d.events as e (e.id)}
              <span class="chip" class:link={e.kind === "link"}>{e.title || "Busy"}{e.allDay ? "" : ` ${new Date(e.start).toTimeString().slice(0, 5)}`}</span>
            {/each}
            {#if d.more}<span class="chip">+{d.more} more</span>{/if}
            {#each d.deadlines as text (text)}<span class="chip due">{text}</span>{/each}
            {#if d.events.length === 0 && d.deadlines.length === 0}<span class="nothing">Nothing yet</span>{/if}
          </span>
          <span class="tag" class:good={d.good}>{d.tag}</span>
        </div>
      {/each}
    </div>
    {#if deadlineNote}<p class="note">{deadlineNote}</p>{/if}
    <div class="foot">
      <button type="button" class="link" onclick={() => (step = 1)}>Back</button>
      <button type="button" class="primary" onclick={() => (step = 3)}>Next: your goal</button>
    </div>
  {:else if step === 3}
    <h2 id="flow-title">Your goal for the week</h2>
    <div class="goal">
      <div class="goal-head">
        <label for="study-days">How many days do you want to study?</label>
        <b class:seven={studyDays === 7}>{plural(studyDays, "day")}</b>
      </div>
      <input
        id="study-days"
        type="range"
        min="1"
        max="7"
        step="1"
        value={studyDays}
        class:seven={studyDays === 7}
        oninput={(e) => {
          const v = Number((e.currentTarget as HTMLInputElement).value);
          slide(v);
          if (askSeven) (e.currentTarget as HTMLInputElement).value = String(studyDays);
        }}
      />
      <div class="ticks" aria-hidden="true">{#each [1, 2, 3, 4, 5, 6, 7] as n (n)}<span class:on={n === studyDays}>{n}</span>{/each}</div>
      <p class="sub">Last week you studied {plural(lastWeek.studyDays, "day")}.</p>
    </div>
    <div class="goal">
      <span class="label" id="rest-label">Rest day{#if studyDays === 7}<span class="none"> · none this week</span>{/if}</span>
      <div class="rest" role="group" aria-labelledby="rest-label">
        {#each [1, 2, 3, 4, 5, 6, 0] as d (d)}
          <button type="button" aria-pressed={studyDays < 7 && restDay === d} disabled={studyDays === 7} onclick={() => (restDay = d)}>{SHORT[d]}</button>
        {/each}
      </div>
      <p class="sub">You can change this any time.</p>
    </div>
    <div class="mascot-row">
      {#if study.look}<div class="mascot small"><Mascot look={study.look} mood="idle" size={76} /></div>{/if}
      <p class="bubble">{goalLine}</p>
    </div>
    <div class="foot">
      <button type="button" class="link" onclick={() => (step = 2)}>Back</button>
      <span class="foot-right">
        <button type="button" class="link" onclick={() => (step = 4)}>Skip</button>
        <button type="button" class="primary" onclick={saveGoal}>Next: plan the first days</button>
      </span>
    </div>
    {#if askSeven}
      <div class="ask-backdrop">
        <div class="ask" role="alertdialog" aria-modal="true" aria-labelledby="ask-title" aria-describedby="ask-text">
          <h3 id="ask-title">A week with no rest day?</h3>
          <p id="ask-text">Rest is when what you studied sinks in, and it keeps you going for the whole term. Even in exam periods, six days with one day off usually gets more done than seven.</p>
          <p class="sub">If you go for seven, keep one day light.</p>
          <div class="ask-buttons">
            <button
              type="button"
              class="secondary"
              onclick={() => {
                studyDays = 7;
                askSeven = false;
              }}>Study all 7 days</button>
            <button
              type="button"
              class="primary"
              onclick={() => {
                studyDays = 6;
                if (restDay === null) restDay = 0;
                askSeven = false;
              }}>Keep a rest day</button>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <h2 id="flow-title">Plan the first days</h2>
    <p class="sub">Just the next two days. Add tasks, to-dos and sessions right here. Plan the rest as you go.</p>
    <PlannerBoard days={firstDays} compact />
    <div class="foot">
      <button type="button" class="link" onclick={finish}>I'll plan as I go</button>
      <button type="button" class="primary" onclick={finish}>Done</button>
    </div>
  {/if}
</div>
</div>

<style>
  /* Centred with flex, not a transform: the plan editor inside is position: fixed. */
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--hs-backdrop);
  }

  .flow {
    position: relative;
    width: min(660px, calc(100vw - 40px));
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 22px 24px;
    border-radius: 24px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-dialog);
  }

  .flow.wide {
    width: min(980px, calc(100vw - 40px));
    overflow: visible;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .eyebrow {
    font-size: 12.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hs-ink-subtle);
  }

  .dots {
    display: inline-flex;
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--hs-field-line);
  }

  .dot.on {
    background: var(--hs-accent);
  }

  .dot.current {
    width: 22px;
  }

  .close {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 9px;
    background: var(--hs-raised);
    color: var(--hs-ink-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .close svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.6rem;
  }

  .sub {
    margin: 0;
    font-size: 13.5px;
    color: var(--hs-ink-muted);
  }

  .mascot-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mascot {
    flex: none;
  }

  .bubble {
    margin: 0;
    padding: 10px 14px;
    border-radius: 16px 16px 16px 4px;
    background: var(--hs-accent-soft);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--hs-raised);
  }

  .tile span {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--hs-ink-subtle);
  }

  .tile b {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 22px;
  }

  .bars {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    height: 104px;
  }

  .bar-col {
    flex: 1 1 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }

  .bar {
    width: 100%;
    max-width: 30px;
    border-radius: 4px 4px 0 0;
    background: var(--hs-accent);
  }

  .bar.empty {
    background: var(--hs-line);
  }

  .bar-value,
  .bar-label {
    font-size: 11.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .bar-label {
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .days {
    display: flex;
    flex-direction: column;
  }

  .day-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 40px;
    padding: 4px 0;
    border-top: 1px solid var(--hs-line);
  }

  .day-name {
    flex: none;
    width: 64px;
    font-size: 14px;
    font-weight: 800;
  }

  .chips {
    flex: 1 1 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }

  .chip {
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--hs-line);
    background: var(--hs-raised);
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-ink-muted);
  }

  .chip.link {
    border-style: dashed;
    border-color: var(--hs-ink-disabled);
    background: var(--hs-neutral-soft);
  }

  .chip.due {
    border-color: transparent;
    background: var(--hs-warning-soft);
    color: var(--hs-warning-strong);
    font-weight: 800;
  }

  .nothing {
    font-size: 13px;
    color: var(--hs-ink-disabled);
  }

  .tag {
    flex: none;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--hs-raised);
    font-size: 12px;
    font-weight: 800;
    color: var(--hs-ink-subtle);
  }

  .tag.good {
    background: var(--hs-success-soft);
    color: var(--hs-success-strong);
  }

  .note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--hs-warning-soft);
    font-size: 13.5px;
    font-weight: 700;
    color: var(--hs-warning-strong);
  }

  .goal {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .goal-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .goal-head label,
  .label {
    font-size: 15px;
    font-weight: 800;
  }

  .goal-head b {
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 22px;
    color: var(--hs-accent-strong);
  }

  .goal-head b.seven,
  .none {
    color: var(--hs-warning-strong);
  }

  input[type="range"] {
    width: 100%;
    margin: 6px 0 0;
    accent-color: var(--hs-accent);
  }

  input[type="range"].seven {
    accent-color: #b35c00;
  }

  .ticks {
    display: flex;
    justify-content: space-between;
    padding: 0 2px;
  }

  .ticks span {
    width: 16px;
    text-align: center;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-disabled);
  }

  .ticks span.on {
    color: var(--hs-accent-strong);
  }

  .rest {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .rest button {
    min-width: 54px;
    min-height: 40px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .rest button[aria-pressed="true"] {
    border: 2px solid var(--hs-success);
    background: var(--hs-success-soft);
    color: var(--hs-success-strong);
  }

  .rest button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-top: 4px;
  }

  .foot-right {
    display: inline-flex;
    align-items: center;
    gap: 12px;
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
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 800;
    color: var(--hs-accent-strong);
    cursor: pointer;
  }

  .ask-backdrop {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    background: var(--hs-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .ask {
    width: min(420px, 100%);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 22px;
    border-radius: 20px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-dialog);
  }

  .ask h3 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }

  .ask p {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  .ask-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    .tiles {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
