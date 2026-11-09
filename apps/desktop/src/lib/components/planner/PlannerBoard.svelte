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
  The planner's working area: "To plan" beside the calendar, with dragging
  tasks in, dragging over free time, moving sessions and the editor. Used by
  the Plan page and the weekly look-ahead.
-->
<script lang="ts">
  import {
    blockEnd,
    blockPlans,
    blockSlots,
    localDayKey,
    movePlan,
    presetFor,
    type TaskToPlan,
    tasksToPlan,
  } from "@headstart/core";
  import { courseColor } from "@headstart/ui";
  import { useApp } from "$lib/context.ts";
  import { clockTime, fromInputs, plural } from "$lib/format.ts";
  import PlanEditor, { type EditorGhost, type EditorRequest } from "./PlanEditor.svelte";
  import PlanGrid, { type GridSlot } from "./PlanGrid.svelte";
  import ToPlan from "./ToPlan.svelte";

  let {
    days,
    compact = false,
    onSwipe,
  }: {
    /** "YYYY-MM-DD" keys to show. */
    days: string[];
    /** Smaller, for the weekly look-ahead: narrower list, shorter grid, no legend. */
    compact?: boolean;
    /** A sideways two-finger swipe over the calendar: 1 for later, -1 for earlier. */
    onSwipe?: (direction: 1 | -1) => void;
  } = $props();

  const { study, calendars, apple } = useApp();
  const MINUTE = 60_000;
  const HOUR_PX = 56;
  let grid = $state<PlanGrid>();
  let root = $state<HTMLElement>();
  let calendarBox = $state<HTMLElement>();

  // Two fingers sideways on a trackpad, like Apple Calendar: swipe left for
  // later, right for earlier. One swipe moves once. The trackpad keeps sending
  // slowly shrinking "momentum" events for a second or two after the fingers
  // lift; a new swipe is told apart by speeding up again, or by turning around.
  const SWIPE_PX = 50;
  const SWIPE_END_MS = 150;
  $effect(() => {
    const box = calendarBox;
    if (!box || !onSwipe) return;
    let total = 0;
    let used = 0; // the direction already moved in this gesture, or 0
    let last = 0;
    let low = Number.POSITIVE_INFINITY;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = () => {
      total = 0;
      used = 0;
      low = Number.POSITIVE_INFINITY;
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(timer);
      timer = setTimeout(reset, SWIPE_END_MS);
      const size = Math.abs(e.deltaX);
      const sign = Math.sign(e.deltaX);
      if (used !== 0) {
        low = Math.min(low, size);
        const turned = sign !== used && size >= 3;
        const faster = size > last && size >= Math.max(6, low * 2.5);
        last = size;
        if (!turned && !faster) return;
        reset();
      }
      last = size;
      total += e.deltaX;
      if (Math.abs(total) >= SWIPE_PX) {
        const direction: 1 | -1 = total > 0 ? 1 : -1;
        used = direction;
        onSwipe?.(direction);
      }
    };
    box.addEventListener("wheel", wheel, { passive: false });
    return () => {
      clearTimeout(timer);
      box.removeEventListener("wheel", wheel);
    };
  });
  // "To plan" can fold into a slim strip, so the calendar gets the room.
  // Remembered on this device; the look-ahead always shows it open.
  const FOLD_KEY = "headstart.plan.toPlanFolded";
  function savedFold(): boolean {
    try {
      return localStorage.getItem(FOLD_KEY) === "1";
    } catch {
      return false;
    }
  }
  let folded = $state(savedFold());
  function setFolded(next: boolean): void {
    folded = next;
    try {
      localStorage.setItem(FOLD_KEY, next ? "1" : "0");
    } catch {
      // Remembering it is only a convenience.
    }
  }
  const toPlanCount = $derived(study.state ? tasksToPlan(study.state, study.now).length : 0);
  const headingId = `to-plan-${Math.random().toString(36).slice(2, 8)}`;

  const dayStart = (day: string) => fromInputs(day, "00:00");
  const addDays = (day: string, n: number) => {
    const [y, m, d] = day.split("-").map(Number);
    return localDayKey(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + n, 12).getTime());
  };
  const today = $derived(localDayKey(study.now));
  const plans = $derived(days.flatMap((day) => study.plansOn(day)));
  // The grid starts at 06:00, or earlier when a session is planned before that.
  const startHour = $derived(Math.min(6, ...plans.map((v) => new Date(v.plan.startAt).getHours())));
  const busy = $derived(calendars.between(dayStart(days[0] ?? today), dayStart(addDays(days[days.length - 1] ?? today, 1))));

  let request = $state<EditorRequest | null>(null);
  let anchorRect = $state<DOMRect | null>(null);
  let ghost = $state<EditorGhost | null>(null);
  let moveError = $state<string | null>(null);

  /** Opens the editor for a new session. Called by the page's "New session" button too. */
  export function openNew(slot: GridSlot, extra: { target?: string; count?: number } = {}): void {
    request = { kind: "new", day: slot.day, start: slot.start, end: slot.end, ...extra };
    anchorRect = columnRect(slot.day, slot.start);
  }

  /** The screen box of a time in the grid, for placing the editor beside it. */
  function columnRect(day: string, at: number): DOMRect | null {
    const col = root?.querySelector<HTMLElement>(`.col[data-day="${day}"]`);
    if (!col) return null;
    const box = col.getBoundingClientRect();
    const y = box.top + ((at - dayStart(day)) / MINUTE / 60 - startHour) * HOUR_PX;
    return new DOMRect(box.left, y, box.width, HOUR_PX);
  }

  /** Moves a whole block: every session in it shifts by the same amount. */
  async function move(planId: string, startAt: number): Promise<void> {
    const state = study.state;
    const plan = state?.plans.get(planId);
    if (!state || !plan) return;
    const members = blockPlans(state, plan).filter((p) => p.sessionId === null);
    const delta = startAt - (members[0]?.startAt ?? plan.startAt);
    moveError = null;
    for (const member of members) {
      const result = await study.run((s) => movePlan(s, member.id, new Date(member.startAt + delta)));
      if (!result.ok) moveError = result.reason;
    }
  }

  // Dragging a task from "To plan" into the grid.
  let dragging = $state<{ row: TaskToPlan; x: number; y: number } | null>(null);
  let drop = $state<{ day: string; start: number; end: number; count: number; label: string } | null>(null);

  function startTaskDrag(row: TaskToPlan, event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = { row, x: event.clientX, y: event.clientY };
    const focus = study.settings.focusMinutes;
    const count = Math.max(1, Math.min(4, row.progress.left ?? 1));
    const moveTo = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = { ...dragging, x: e.clientX, y: e.clientY };
      const slot = grid?.slotAt(e.clientX, e.clientY);
      if (!slot) {
        drop = null;
        return;
      }
      const quarter = 15 * MINUTE;
      const start = Math.round(slot.at / quarter) * quarter;
      const end = blockEnd(blockSlots(start, count, focus, presetFor(focus)));
      drop = { day: slot.day, start, end, count, label: `${count} × ${focus} min, ends ${clockTime(end)}` };
    };
    const finish = () => {
      window.removeEventListener("pointermove", moveTo);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("keydown", escape);
      const d = drop;
      const r = dragging?.row;
      dragging = null;
      drop = null;
      document.documentElement.classList.remove("reordering");
      if (d && r) openNew({ day: d.day, start: d.start, end: null }, { target: `task:${r.task.id}`, count: d.count });
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      drop = null;
      finish();
    };
    document.documentElement.classList.add("reordering");
    window.addEventListener("pointermove", moveTo);
    window.addEventListener("pointerup", finish);
    window.addEventListener("keydown", escape);
  }
</script>

<div class="board" class:compact bind:this={root}>
  {#if folded && !compact}
    <button type="button" class="card fold-strip" aria-label="Show To plan, {plural(toPlanCount, 'task')}" title="Show To plan" onclick={() => setFolded(false)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
      <span class="fold-label">To plan</span>
      {#if toPlanCount > 0}<span class="fold-count">{toPlanCount}</span>{/if}
    </button>
  {:else}
    <aside class="card side" aria-labelledby={headingId}>
      <div class="side-head">
        <h2 id={headingId}>To plan</h2>
        {#if !compact}
          <span class="side-tools">
            <span>Soonest first</span>
            <button type="button" class="fold" aria-label="Hide To plan" title="Hide To plan" onclick={() => setFolded(true)}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8 10 12.5" /></svg>
            </button>
          </span>
        {/if}
      </div>
      {#if !compact}<p class="side-hint">Drag a task into the calendar, or drag over free time to plan without one.</p>{/if}
      <ToPlan {study} {compact} onDragStart={startTaskDrag} />
    </aside>
  {/if}

  <section class="card calendar" aria-label="Calendar" bind:this={calendarBox}>
    {#if moveError}<p class="error" role="alert">{moveError}</p>{/if}
    <PlanGrid
      bind:this={grid}
      {days}
      {plans}
      {busy}
      now={study.now}
      {today}
      {startHour}
      hourPx={HOUR_PX}
      ghost={drop ?? ghost}
      synced={(id) => apple.synced(id)}
      onCreate={(slot) => openNew(slot)}
      onMove={move}
      onOpen={(planId, rect) => {
        request = { kind: "edit", planId };
        anchorRect = rect;
      }}
    />
    {#if !compact}
      <div class="legend">
        <span><span class="key session"></span>Study session (colour of its course)</span>
        <span><span class="key link"></span>From a calendar link</span>
        <span><span class="key busy"></span>Busy in another calendar</span>
      </div>
    {/if}
  </section>
</div>

{#if dragging}
  {@const r = dragging.row}
  <div class="drag-card" style:left="{dragging.x + 14}px" style:top="{dragging.y - 18}px" style="--c: {courseColor(r.course.color)}" aria-hidden="true">
    <span class="drag-course">{r.course.name}</span>
    <span class="drag-title">{r.task.title}</span>
    {#if drop}<span class="drag-hint">Drop: {drop.label}</span>{/if}
  </div>
{/if}

{#if request}
  {#key request}
    <PlanEditor
      {study}
      {request}
      anchor={anchorRect}
      calendarNote={apple.note}
      onDraft={(g) => (ghost = g)}
      onClose={() => {
        request = null;
        ghost = null;
      }}
    />
  {/key}
{/if}

<style>
  .board {
    display: flex;
    gap: 18px;
    align-items: flex-start;
  }

  .compact {
    gap: 14px;
  }

  .card {
    box-sizing: border-box;
    border: 1px solid var(--hs-line);
    border-radius: 20px;
    background: var(--hs-surface);
  }

  .side {
    flex: 0 0 300px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    max-height: calc(100vh - 210px);
    overflow-y: auto;
  }

  .compact .side {
    flex-basis: 230px;
    padding: 2px;
    border: 0;
    max-height: 420px;
  }

  .compact .calendar {
    padding: 0;
    border: 0;
  }

  .compact .calendar :global(.scroller) {
    max-height: 360px;
  }

  h2 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.25rem;
  }

  .compact h2 {
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .side-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .side-tools {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .fold {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--hs-line);
    border-radius: 8px;
    background: var(--hs-surface);
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .fold svg,
  .fold-strip svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* "To plan" folded: a slim strip with the label written downwards. */
  .fold-strip {
    flex: 0 0 44px;
    align-self: stretch;
    max-height: calc(100vh - 210px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    font: inherit;
    color: var(--hs-ink-muted);
    cursor: pointer;
  }

  .fold-strip:hover {
    color: var(--hs-ink);
  }

  .fold-label {
    writing-mode: vertical-rl;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .fold-count {
    min-width: 22px;
    padding: 2px 6px;
    box-sizing: border-box;
    border-radius: 999px;
    background: var(--hs-accent-soft);
    color: var(--hs-accent-strong);
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }

  .side-head span {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .side-hint {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--hs-ink-muted);
  }

  .calendar {
    flex: 1 1 auto;
    min-width: 0;
    padding: 14px 16px;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 12px;
    font-size: 12.5px;
    color: var(--hs-ink-muted);
  }

  .legend > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .key {
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border-radius: 3px;
  }

  .key.session {
    background: color-mix(in srgb, var(--hs-accent) 16%, var(--hs-surface));
    border-left: 3px solid var(--hs-accent);
  }

  .key.link {
    background: var(--hs-neutral-soft);
    border: 1px dashed var(--hs-ink-disabled);
  }

  .key.busy {
    background: var(--hs-neutral-soft);
    border-left: 3px solid var(--hs-ink-disabled);
  }

  .error {
    margin: 0 0 8px;
    color: var(--hs-danger);
    font-weight: 700;
  }

  .drag-card {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 220px;
    box-sizing: border-box;
    padding: 9px 10px 9px 12px;
    border: 1px solid var(--hs-line);
    border-left: 4px solid var(--c);
    border-radius: 12px;
    background: var(--hs-surface);
    box-shadow: var(--hs-shadow-pop);
    transform: rotate(-2deg);
    pointer-events: none;
  }

  .drag-course {
    font-size: 12px;
    font-weight: 800;
    color: color-mix(in srgb, var(--c) 70%, var(--hs-ink));
  }

  .drag-title {
    font-size: 13.5px;
    font-weight: 800;
  }

  .drag-hint {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 800;
    color: var(--hs-accent-strong);
  }

  @media (max-width: 1100px) {
    .board:not(.compact) {
      flex-direction: column;
    }

    .board:not(.compact) .side {
      flex: none;
      width: 100%;
      max-height: none;
    }

    .board:not(.compact) .fold-strip {
      flex: none;
      width: 100%;
      flex-direction: row;
      justify-content: center;
      padding: 10px;
    }

    .board:not(.compact) .fold-label {
      writing-mode: horizontal-tb;
    }

    .board:not(.compact) .calendar {
      width: 100%;
    }
  }
</style>
