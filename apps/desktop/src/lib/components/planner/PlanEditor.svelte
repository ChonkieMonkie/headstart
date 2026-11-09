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
  Plans one or more sessions, or changes one that is planned. Opens beside the
  time that was dragged or the session that was clicked, like a calendar app.
-->
<script lang="ts" module>
  export type EditorRequest =
    | {
        kind: "new";
        day: string;
        start: number;
        /** The end of a dragged stretch, or null for a click. */
        end: number | null;
        /** "task:<id>", "course:<id>" or "". */
        target?: string;
        /** Sessions to start with, when no stretch was dragged. */
        count?: number;
      }
    | { kind: "edit"; planId: string };

  export interface EditorGhost {
    day: string;
    start: number;
    end: number;
    label: string;
  }
</script>

<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    blockEnd,
    blockPlans,
    blockSlots,
    cancelPlan,
    fitSessions,
    localDayKey,
    movePlan,
    planSession,
    presetFor,
    updatePlan,
  } from "@headstart/core";
  import { clockTime, fromInputs, plural, toTimeInput } from "$lib/format.ts";
  import { taskGroups } from "$lib/options.ts";
  import type { Study } from "$lib/study.svelte.ts";
  import DatePicker from "../DatePicker.svelte";
  import Select from "../Select.svelte";

  const MINUTE = 60_000;
  const LENGTHS = [15, 20, 25, 30, 45, 50, 60, 90];
  const MAX_COUNT = 8;
  const WIDTH = 330;

  let {
    study,
    request,
    anchor = null,
    calendarNote = null,
    onDraft,
    onClose,
  }: {
    study: Study;
    request: EditorRequest;
    /** What it opens beside: the dragged time or the clicked session. */
    anchor?: DOMRect | null;
    /** "Adds to Calendar: Headstart (iCloud)" when Apple Calendar sync is on. */
    calendarNote?: string | null;
    /** The time being planned, drawn in the grid while the editor is open. */
    onDraft: (ghost: EditorGhost | null) => void;
    onClose: () => void;
  } = $props();

  const req = untrack(() => request);
  const plan = untrack(() => (req.kind === "edit" ? (study.state?.plans.get(req.planId) ?? null) : null));
  // A planned session is edited with the rest of its block. Sessions that have
  // started stay as they are; only the ones still to come change.
  const members = untrack(() => (plan && study.state ? blockPlans(study.state, plan) : []));
  const open = members.filter((p) => p.sessionId === null);
  const head = open[0] ?? plan;
  const focus = untrack(() => study.settings.focusMinutes);

  function initial(): { target: string; day: string; time: string; minutes: number; count: number; ifThen: string } {
    if (head) {
      return {
        target: head.taskId ? `task:${head.taskId}` : head.courseId ? `course:${head.courseId}` : "",
        day: localDayKey(head.startAt),
        time: toTimeInput(head.startAt),
        minutes: head.minutes,
        count: Math.max(1, open.length),
        ifThen: head.ifThen ?? "",
      };
    }
    const r = req as Extract<EditorRequest, { kind: "new" }>;
    const fit = r.end !== null ? fitSessions((r.end - r.start) / MINUTE, focus, presetFor(focus)) : { count: r.count ?? 1, minutes: focus };
    return { target: r.target ?? "", day: r.day, time: toTimeInput(r.start), minutes: fit.minutes, count: Math.min(MAX_COUNT, fit.count), ifThen: "" };
  }

  const start0 = initial();
  let target = $state(start0.target);
  let day = $state(start0.day);
  let time = $state(start0.time);
  let minutes = $state(start0.minutes);
  let count = $state(start0.count);
  let ifThen = $state(start0.ifThen);
  let showIfThen = $state(start0.ifThen !== "");
  let error = $state<string | null>(null);
  let saving = $state(false);
  let box: HTMLElement;

  const editable = plan === null || open.length > 0;
  const started = members.length - open.length;
  const lengths = $derived(
    LENGTHS.includes(minutes) ? LENGTHS : [...LENGTHS, minutes].sort((a, b) => a - b),
  );
  const startAt = $derived(time ? fromInputs(day, time) : Number.NaN);
  const slots = $derived(Number.isNaN(startAt) ? [] : blockSlots(startAt, count, minutes, presetFor(minutes)));
  const endAt = $derived(blockEnd(slots));
  const summary = $derived.by(() => {
    if (slots.length === 0) return "";
    if (slots.length === 1) return `Ends ${clockTime(endAt)}.`;
    const preset = presetFor(minutes);
    const long = slots.length > preset.longBreakEvery ? `, a ${preset.longBreakMinutes} min break after every ${preset.longBreakEvery}` : "";
    return `${preset.breakMinutes} min break between${long}. Ends ${clockTime(endAt)}.`;
  });
  const isToday = $derived(day === localDayKey(Date.now()));

  // Show what is being planned in the grid while the editor is open.
  $effect(() => {
    if (slots.length === 0) return onDraft(null);
    onDraft({
      day,
      start: startAt,
      end: endAt,
      label: slots.length > 1 ? `${slots.length} × ${minutes} min` : `${clockTime(startAt)} to ${clockTime(endAt)}`,
    });
  });

  function parts(): { taskId?: string; courseId?: string } {
    const [kind, id] = target.split(":");
    if (kind === "task" && id) return { taskId: id };
    if (kind === "course" && id) return { courseId: id };
    return {};
  }

  /** Runs a command; false (with the reason shown) when it was refused. */
  async function step(command: Parameters<Study["run"]>[0]): Promise<boolean> {
    const result = await study.run(command);
    if (result.ok || result.reason === "Nothing changed") return true;
    error = result.reason;
    return false;
  }

  async function save(): Promise<void> {
    if (Number.isNaN(startAt)) {
      error = "Pick a time";
      return;
    }
    saving = true;
    error = null;
    try {
      const p = parts();
      // Sessions planned together share a block; a single session needs none.
      const blockId = head?.blockId ?? (slots.length + started > 1 ? study.newId() : undefined);
      for (const [i, slot] of slots.entries()) {
        const existing = open[i];
        if (!existing) {
          const ok = await step((s) =>
            planSession(s, { planId: study.newId(), startAt: new Date(slot.startAt), minutes: slot.minutes, ...p, ifThen, blockId }),
          );
          if (!ok) return;
          continue;
        }
        if (existing.startAt !== slot.startAt && !(await step((s) => movePlan(s, existing.id, new Date(slot.startAt))))) return;
        const ok = await step((s) =>
          updatePlan(s, existing.id, {
            minutes: slot.minutes,
            taskId: p.taskId ?? null,
            courseId: p.courseId ?? (p.taskId ? undefined : null),
            ifThen,
            ...(blockId && existing.blockId !== blockId ? { blockId } : {}),
          }),
        );
        if (!ok) return;
      }
      // Fewer sessions than before: the last ones go.
      for (const extra of open.slice(slots.length)) {
        if (!(await step((s) => cancelPlan(s, extra.id)))) return;
      }
      onClose();
    } finally {
      saving = false;
    }
  }

  async function remove(): Promise<void> {
    for (const member of open) {
      if (!(await step((s) => cancelPlan(s, member.id)))) return;
    }
    onClose();
  }

  async function startNow(): Promise<void> {
    if (!head) return;
    onClose();
    await study.start({ planId: head.id });
  }

  // Beside the anchor when there is room, else on its other side; always on screen.
  const position = $derived.by(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!anchor) return { left: (vw - WIDTH) / 2, top: 80 };
    let left = anchor.right + 12;
    if (left + WIDTH > vw - 12) left = anchor.left - WIDTH - 12;
    left = Math.max(12, Math.min(left, vw - WIDTH - 12));
    const top = Math.max(12, Math.min(anchor.top - 60, vh - 540));
    return { left, top };
  });

  onMount(() => {
    box?.querySelector<HTMLElement>("button.trigger, input")?.focus();
    return () => onDraft(null);
  });
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onClose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onClose}></div>
<div
  class="editor"
  role="dialog"
  aria-modal="true"
  aria-labelledby="editor-title"
  bind:this={box}
  style:left="{position.left}px"
  style:top="{position.top}px"
  style:width="{WIDTH}px"
>
  <div class="top">
    <h2 id="editor-title">
      {#if !plan}New session{:else if !editable}{plan.cancelled ? "Removed session" : "Session"}{:else if members.length > 1}Planned block{:else}Planned session{/if}
    </h2>
    <button type="button" class="close" aria-label="Close" onclick={onClose}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
    </button>
  </div>

  {#if !editable && plan}
    <p class="info">
      {plan.cancelled ? "This session was removed." : "These sessions have started, so they can no longer be changed."}
    </p>
    <div class="buttons"><button type="button" class="secondary" onclick={onClose}>Close</button></div>
  {:else}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div class="field">
        <span>What</span>
        <Select bind:value={target} groups={taskGroups(study, { none: "Free session, no course", courses: true })} label="What" />
      </div>
      <div class="row">
        <div class="field grow">
          <span>Day</span>
          <DatePicker bind:value={day} label="Day" quick={[{ label: "Today", days: 0 }, { label: "Tomorrow", days: 1 }]} />
        </div>
        <label class="field">
          <span>From</span>
          <input type="time" bind:value={time} required />
        </label>
      </div>

      <div class="sessions">
        <div class="sessions-row">
          <span class="label">{started > 0 ? "Sessions left" : "Sessions"}</span>
          <span class="stepper">
            <button type="button" aria-label="Fewer sessions" disabled={count <= 1} onclick={() => (count = Math.max(1, count - 1))}>−</button>
            <span class="count" aria-live="polite">{count} ×</span>
            <button type="button" aria-label="More sessions" disabled={count >= MAX_COUNT} onclick={() => (count = Math.min(MAX_COUNT, count + 1))}>+</button>
          </span>
          <span class="length">
            <Select bind:value={minutes} groups={[{ label: "", options: lengths.map((m) => ({ value: m, label: `${m} min` })) }]} label="Length of each session" />
          </span>
        </div>
        {#if summary}<p class="summary">{summary}</p>{/if}
      </div>

      {#if showIfThen}
        <label class="field">
          <span>If-then plan</span>
          <input type="text" bind:value={ifThen} maxlength="200" placeholder="If it is 09:00 and I am at my desk, then I open problem 4.12" />
        </label>
      {:else}
        <button type="button" class="add" onclick={() => (showIfThen = true)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>Add an if-then plan
        </button>
      {/if}

      {#if calendarNote}
        <p class="calendar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.8" y="2.8" width="12.4" height="11.4" rx="2.4" /><path d="M1.8 6.2h12.4M5.2 1.6v2.4M10.8 1.6v2.4" /></svg>{calendarNote}
        </p>
      {/if}
      {#if error}<p class="error" role="alert">{error}</p>{/if}

      <div class="buttons">
        {#if plan}
          <button type="button" class="link danger" onclick={remove}>Remove</button>
          {#if isToday}<button type="button" class="secondary" onclick={startNow}>Start now</button>{/if}
        {:else}
          <button type="button" class="secondary" onclick={onClose}>Cancel</button>
        {/if}
        <button type="submit" class="primary" disabled={saving}>
          {plan ? "Save" : count > 1 ? `Plan ${plural(count, "session")}` : "Plan session"}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
  }

  .editor {
    position: fixed;
    z-index: 41;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--hs-line);
    border-radius: 16px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-dialog);
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display, inherit);
    font-size: 1.2rem;
    font-weight: 600;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .field > span,
  .label {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .row {
    display: flex;
    gap: 8px;
  }

  .grow {
    flex: 1 1 auto;
  }

  input {
    min-height: 40px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 1px solid var(--hs-field-line);
    border-radius: 10px;
    background: var(--hs-surface);
    font: inherit;
    font-weight: 700;
    color: var(--hs-ink);
  }

  .sessions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--hs-accent-soft);
  }

  .sessions-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sessions .label {
    color: var(--hs-accent-strong);
    margin-right: auto;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .stepper button {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid var(--hs-field-line);
    background: var(--hs-surface);
    color: var(--hs-accent-strong);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .stepper button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .count {
    min-width: 30px;
    text-align: center;
    font-weight: 800;
  }

  .length {
    min-width: 104px;
  }

  .summary {
    margin: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--hs-ink-muted);
  }

  .add {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--hs-accent-strong);
    cursor: pointer;
  }

  svg {
    width: 14px;
    height: 14px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  .calendar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding-top: 10px;
    border-top: 1px solid var(--hs-line);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--hs-success-strong);
  }

  .info {
    margin: 0;
    font-size: 14px;
    color: var(--hs-ink-muted);
  }

  .error {
    margin: 0;
    color: var(--hs-danger);
    font-weight: 700;
    font-size: 13.5px;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }

  .buttons button {
    min-height: 40px;
    padding: 0 14px;
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

  .primary:disabled {
    opacity: 0.6;
  }

  .secondary {
    border: 1px solid var(--hs-line);
    background: var(--hs-surface);
    color: var(--hs-ink);
  }

  .buttons .link {
    margin-right: auto;
    padding: 0;
    border: 0;
    background: none;
    text-decoration: underline;
  }

  .danger {
    color: var(--hs-danger);
  }

  .close {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
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
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
