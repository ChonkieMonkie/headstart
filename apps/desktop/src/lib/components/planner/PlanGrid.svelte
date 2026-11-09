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
  The planner's time grid: one column per day. Drag over free time (or click)
  to plan, drag a session to move it, click it to change it. Busy time from
  calendars sits underneath; it never blocks planning.
-->
<script lang="ts" module>
  /** A stretch of time on one day. `end` is null after a plain click. */
  export interface GridSlot {
    day: string;
    start: number;
    end: number | null;
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { type BlockView, groupBlocks, type PlanStatus, type PlanView } from "@headstart/core";
  import { courseColor } from "@headstart/ui";
  import type { BusyEvent } from "$lib/calendars.svelte.ts";
  import { clockTime, fromInputs } from "$lib/format.ts";

  const MINUTE = 60_000;
  const SNAP = 15;
  /** Movement in pixels before a press counts as a drag. */
  const DRAG_PX = 4;

  let {
    days,
    plans,
    busy,
    now,
    today,
    startHour = 6,
    endHour = 24,
    hourPx = 56,
    ghost = null,
    synced = () => false,
    onCreate,
    onMove,
    onOpen,
  }: {
    /** "YYYY-MM-DD" keys, in order. */
    days: string[];
    plans: PlanView[];
    busy: BusyEvent[];
    now: number;
    today: string;
    startHour?: number;
    endHour?: number;
    hourPx?: number;
    /** A session being planned (from the editor or a dragged task), drawn dashed. */
    ghost?: { day: string; start: number; end: number; label: string } | null;
    /** Whether a block (by its key) is also in Apple Calendar. */
    synced?: (key: string) => boolean;
    onCreate: (slot: GridSlot) => void;
    onMove: (planId: string, startAt: number) => void;
    onOpen: (planId: string, anchor: DOMRect) => void;
  } = $props();

  let root: HTMLElement;
  let scroller: HTMLElement;
  const height = $derived((endHour - startHour) * hourPx);
  const hours = $derived(Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i));

  const dayStart = (day: string) => fromInputs(day, "00:00");
  const fromDay = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const dayEnd = (day: string) => fromInputs(day, "23:59") + MINUTE;
  const fmtDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });

  // Pixels from the top for a moment on a day, clamped to the visible hours.
  function yOf(day: string, ms: number): number {
    const minutes = (ms - dayStart(day)) / MINUTE - startHour * 60;
    return Math.min(height, Math.max(0, (minutes / 60) * hourPx));
  }

  interface Placed<T> {
    item: T;
    top: number;
    height: number;
    lane: number;
    lanes: number;
  }

  /** Side by side when they overlap: each group of overlapping items shares the width. */
  function layout<T>(items: { item: T; start: number; end: number }[], day: string): Placed<T>[] {
    const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
    const placed: (Placed<T> & { end: number })[] = [];
    let group: (Placed<T> & { end: number })[] = [];
    let groupEnd = -Infinity;
    const close = () => {
      const lanes = Math.max(1, ...group.map((p) => p.lane + 1));
      for (const p of group) p.lanes = lanes;
      group = [];
    };
    for (const it of sorted) {
      if (it.start >= groupEnd) close();
      const used = new Set(group.filter((p) => p.end > it.start).map((p) => p.lane));
      let lane = 0;
      while (used.has(lane)) lane++;
      const top = yOf(day, it.start);
      const p = { item: it.item, top, height: Math.max(14, yOf(day, it.end) - top), lane, lanes: 1, end: it.end };
      placed.push(p);
      group.push(p);
      groupEnd = Math.max(groupEnd, it.end);
    }
    close();
    return placed;
  }

  // Sessions planned together show as one block, with their breaks marked inside.
  type Cell = { kind: "block"; block: BlockView } | { kind: "busy"; event: BusyEvent };

  /** One status for a block: running wins, then up next, then done when all are. */
  function statusOf(block: BlockView): PlanStatus {
    const all = block.views.map((v) => v.status);
    if (all.includes("running")) return "running";
    // "Up next" is worked out per day; only today's is the real next session.
    if (all.includes("next")) return fromDay(block.start) === today ? "next" : "planned";
    if (all.every((s) => s === "done")) return "done";
    if (all.every((s) => s === "missed" || s === "done")) return "missed";
    return "planned";
  }

  /** A block can be dragged when none of its sessions has started. */
  const movable = (block: BlockView) =>
    block.views.every((v) => v.status === "planned" || v.status === "next" || v.status === "missed");

  /**
   * The rail on the left of a block: one rounded piece per session, so the
   * breaks show as gaps. Done pieces are green, the running one has a ring.
   * Offsets are in pixels from the top of the block.
   */
  function rail(block: BlockView): { id: string; top: number; height: number; status: PlanStatus }[] {
    return block.views.map((v) => {
      const top = ((v.plan.startAt - block.start) / MINUTE / 60) * hourPx;
      const height = (v.plan.minutes / 60) * hourPx;
      // The block is drawn 2 px shorter than its time (a gap to the next one),
      // so 3 px in from the top and 3 px up from the bottom keeps each piece
      // centred, with room for the running piece's ring.
      return { id: v.plan.id, top: top + 3, height: Math.max(3, height - 8), status: v.status };
    });
  }

  function blockLabel(block: BlockView): string {
    const first = block.views[0];
    const n = block.views.length;
    const length = n > 1 ? `${n} × ${first?.plan.minutes ?? 0} min` : `${first?.plan.minutes ?? 0} min`;
    return `${clockTime(block.start)} to ${clockTime(block.end)} · ${length}`;
  }

  const columns = $derived(
    days.map((day) => {
      const from = dayStart(day);
      const to = dayEnd(day);
      const items: { item: Cell; start: number; end: number }[] = [];
      for (const event of busy) {
        if (event.allDay || event.end <= from || event.start >= to) continue;
        items.push({ item: { kind: "busy", event }, start: Math.max(from, event.start), end: Math.min(to, event.end) });
      }
      for (const block of groupBlocks(plans)) {
        if (block.start < from || block.start >= to) continue;
        items.push({ item: { kind: "block", block }, start: block.start, end: block.end });
      }
      const allDay = busy.filter((e) => e.allDay && e.start < to && e.end > from);
      return { day, cells: layout(items, day), allDay };
    }),
  );
  const anyAllDay = $derived(columns.some((c) => c.allDay.length > 0));

  // Pointer work: creating by dragging over free time, or moving a session.
  let draft = $state<{ day: string; a: number; b: number } | null>(null);
  let moving = $state<{ key: string; planId: string; day: string; start: number; minutes: number } | null>(null);
  let press: {
    x: number;
    y: number;
    moved: boolean;
    offset: number;
    block?: BlockView;
    anchor?: HTMLElement;
  } | null = null;

  const snap = (ms: number) => Math.round(ms / (SNAP * MINUTE)) * SNAP * MINUTE;

  /** The day and time under a point, or null outside the grid. */
  export function slotAt(x: number, y: number): { day: string; at: number } | null {
    for (const col of root?.querySelectorAll<HTMLElement>(".col") ?? []) {
      const box = col.getBoundingClientRect();
      if (x < box.left || x >= box.right) continue;
      if (y < box.top - 8 || y > box.bottom + 8) return null;
      const day = col.dataset.day as string;
      const minutes = startHour * 60 + ((y - box.top) / hourPx) * 60;
      return { day, at: dayStart(day) + Math.max(0, minutes) * MINUTE };
    }
    return null;
  }

  function downOnColumn(event: PointerEvent, day: string): void {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".block")) return;
    const slot = slotAt(event.clientX, event.clientY);
    if (!slot) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const a = Math.floor(slot.at / (SNAP * MINUTE)) * SNAP * MINUTE;
    press = { x: event.clientX, y: event.clientY, moved: false, offset: 0 };
    draft = { day, a, b: a + SNAP * MINUTE };
  }

  function downOnBlock(event: PointerEvent, block: BlockView): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    const slot = slotAt(event.clientX, event.clientY);
    press = {
      x: event.clientX,
      y: event.clientY,
      moved: false,
      offset: slot ? slot.at - block.start : 0,
      block,
      anchor: event.currentTarget as HTMLElement,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent): void {
    if (!press) return;
    if (!press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_PX) return;
    press.moved = true;
    const slot = slotAt(event.clientX, event.clientY);
    if (!slot) return;
    if (draft) {
      const b = Math.ceil(slot.at / (SNAP * MINUTE)) * SNAP * MINUTE;
      draft = { ...draft, b: b === draft.a ? b + SNAP * MINUTE : b };
    } else if (press.block) {
      const block = press.block;
      if (!movable(block)) return;
      moving = {
        key: block.key,
        planId: block.views[0]?.plan.id ?? "",
        day: slot.day,
        start: snap(slot.at - press.offset),
        minutes: (block.end - block.start) / MINUTE,
      };
    }
  }

  function pointerUp(): void {
    const p = press;
    press = null;
    if (draft) {
      const d = draft;
      draft = null;
      if (!p?.moved) onCreate({ day: d.day, start: d.a, end: null });
      else onCreate({ day: d.day, start: Math.min(d.a, d.b), end: Math.max(d.a, d.b) });
      return;
    }
    if (p?.block) {
      const m = moving;
      moving = null;
      if (p.moved && m) {
        if (m.start !== p.block.start) onMove(m.planId, m.start);
      } else if (!p.moved && p.anchor) onOpen(p.block.views[0]?.plan.id ?? "", p.anchor.getBoundingClientRect());
    }
  }

  function cancel(): void {
    press = null;
    draft = null;
    moving = null;
  }

  onMount(() => {
    // Start at 08:00, or an hour before now when that is later.
    const hour = new Date(now).getHours();
    const first = Math.max(8, Math.min(hour - 1, endHour - 6));
    scroller.scrollTop = Math.max(0, (first - startHour) * hourPx);
  });
</script>

<div class="grid" bind:this={root}>
  <div class="heads">
    {#each days as day (day)}
      <div class="head" class:today={day === today}>
        {#if day === today}<span class="pill">Today</span>{/if}
        <span>{fmtDay.format(dayStart(day))}</span>
      </div>
    {/each}
  </div>
  {#if anyAllDay}
    <div class="all-day">
      {#each columns as col (col.day)}
        <div class="all-day-col">
          {#each col.allDay as event (event.id)}
            <span class="chip" title={event.title}>{event.title}</span>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
  <div class="scroller" bind:this={scroller}>
    <div class="body" style:height="{height}px">
      <div class="hours" aria-hidden="true">
        {#each hours as h, i (h)}
          {#if i > 0 && i < hours.length - 1}
            <span style:top="{i * hourPx}px">{String(h).padStart(2, "0")}:00</span>
          {/if}
        {/each}
      </div>
      <div class="lines" aria-hidden="true">
        {#each hours as h, i (h)}
          <span style:top="{i * hourPx}px"></span>
          <span class="half" style:top="{i * hourPx + hourPx / 2}px"></span>
        {/each}
      </div>
      <div class="cols">
        {#each columns as col (col.day)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="col"
            class:today={col.day === today}
            data-day={col.day}
            onpointerdown={(e) => downOnColumn(e, col.day)}
            onpointermove={pointerMove}
            onpointerup={pointerUp}
            onpointercancel={cancel}
          >
            {#each col.cells as cell (cell.item.kind === "block" ? cell.item.block.key : cell.item.event.id)}
              {@const style = `top: ${cell.top}px; height: ${cell.height - 2}px; left: calc(${(cell.lane / cell.lanes) * 100}% + 2px); width: calc(${100 / cell.lanes}% - 4px)`}
              {#if cell.item.kind === "busy"}
                {@const e = cell.item.event}
                <div class="busy {e.kind}" {style} title="{e.title}{e.location ? ` · ${e.location}` : ''}">
                  <span class="title">{#if e.kind === "link"}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.6 9.4l2.8-2.8M7.2 4.6l1.1-1.1a2.6 2.6 0 0 1 3.7 3.7l-1.1 1.1M8.8 11.4l-1.1 1.1a2.6 2.6 0 0 1-3.7-3.7l1.1-1.1" /></svg>{/if}{e.title || "Busy"}</span>
                  {#if cell.height > 34}<span class="sub">{e.location || e.sourceName}</span>{/if}
                  {#if cell.height > 54}<span class="sub">{clockTime(e.start)} to {clockTime(e.end)}</span>{/if}
                </div>
              {:else}
                {@const blk = cell.item.block}
                {@const first = blk.views[0]}
                {@const status = statusOf(blk)}
                {@const short = cell.height < 36}
                <button
                  type="button"
                  class="block {status}"
                  class:dragging={moving?.key === blk.key}
                  style="{style}; --c: {courseColor(first?.course?.color, 'var(--hs-accent)')}"
                  aria-label="{first?.course?.name ?? 'Free session'}{first?.task ? `, ${first.task.title}` : ''}, {blockLabel(blk)}"
                  onpointerdown={(e) => downOnBlock(e, blk)}
                  onpointermove={pointerMove}
                  onpointerup={pointerUp}
                  onpointercancel={cancel}
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(first?.plan.id ?? "", (e.currentTarget as HTMLElement).getBoundingClientRect());
                    }
                  }}
                  data-movable={movable(blk)}
                >
                  {#each rail(blk) as piece (piece.id)}
                    <span class="piece {piece.status}" style:top="{piece.top}px" style:height="{piece.height}px" aria-hidden="true"></span>
                  {/each}
                  <span class="title">
                    {#if status === "done"}<svg class="check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.4" /></svg>{/if}
                    <span class="name">{first?.course?.name ?? "Free session"}{#if short}<span class="inline"> · {clockTime(blk.start)}{first?.task ? ` · ${first.task.title}` : ""}</span>{/if}</span>
                    {#if synced(blk.key)}<svg class="cal" viewBox="0 0 16 16" aria-label="In Apple Calendar" role="img"><rect x="1.8" y="2.8" width="12.4" height="11.4" rx="2.4" /><path d="M1.8 6.2h12.4M5.2 1.6v2.4M10.8 1.6v2.4" /></svg>{/if}
                  </span>
                  {#if !short}
                    <span class="sub">{blockLabel(blk)}</span>
                    {#if first?.task && cell.height > 52}<span class="sub">{first.task.title}</span>{/if}
                  {/if}
                </button>
              {/if}
            {/each}
            {#if col.day === today && now >= dayStart(col.day) + startHour * 3_600_000 && now < dayStart(col.day) + endHour * 3_600_000}
              <div class="now" style:top="{yOf(col.day, now)}px" aria-hidden="true"></div>
            {/if}
            {#if draft && draft.day === col.day}
              {@const a = Math.min(draft.a, draft.b)}
              {@const b = Math.max(draft.a, draft.b)}
              <div class="ghost" style:top="{yOf(col.day, a)}px" style:height="{Math.max(14, yOf(col.day, b) - yOf(col.day, a)) - 2}px">
                <span>{clockTime(a)} to {clockTime(b)}</span>
              </div>
            {/if}
            {#if moving && moving.day === col.day}
              <div class="ghost" style:top="{yOf(col.day, moving.start)}px" style:height="{(moving.minutes / 60) * hourPx - 2}px">
                <span>Move to {clockTime(moving.start)}</span>
              </div>
            {/if}
            {#if ghost && ghost.day === col.day}
              <div class="ghost" style:top="{yOf(col.day, ghost.start)}px" style:height="{Math.max(14, yOf(col.day, ghost.end) - yOf(col.day, ghost.start)) - 2}px">
                <span>{ghost.label}</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .grid {
    --gutter: 52px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .heads,
  .all-day {
    display: flex;
    padding-left: var(--gutter);
  }

  .head {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px 8px;
    font-size: 13px;
    font-weight: 800;
    color: var(--hs-ink-muted);
  }

  .head.today {
    color: var(--hs-accent-strong);
  }

  .pill {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
    font-size: 12px;
  }

  .all-day {
    padding-bottom: 6px;
  }

  .all-day-col {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 2px;
  }

  .chip {
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--hs-neutral-soft);
    color: var(--hs-ink-muted);
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scroller {
    overflow-y: auto;
    max-height: calc(100vh - 290px);
    min-height: 320px;
    border-top: 1px solid var(--hs-line);
  }

  .body {
    position: relative;
  }

  .hours span {
    position: absolute;
    left: 0;
    width: calc(var(--gutter) - 8px);
    transform: translateY(-7px);
    text-align: right;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
    font-variant-numeric: tabular-nums;
  }

  .lines span {
    position: absolute;
    left: var(--gutter);
    right: 0;
    border-top: 1px solid var(--hs-line);
  }

  .lines .half {
    border-top-style: dotted;
    opacity: 0.6;
  }

  .cols {
    position: absolute;
    inset: 0 0 0 var(--gutter);
    display: flex;
  }

  .col {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    border-left: 1px solid var(--hs-line);
    cursor: cell;
    touch-action: none;
  }

  .col.today {
    background: color-mix(in srgb, var(--hs-accent) 4%, transparent);
  }

  .busy,
  .block,
  .ghost {
    position: absolute;
    box-sizing: border-box;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 3px 7px;
    text-align: left;
  }

  .busy {
    pointer-events: none;
    background: var(--hs-neutral-soft);
    border: 1px solid var(--hs-line);
    border-left: 3px solid var(--hs-ink-disabled);
    color: var(--hs-ink-muted);
  }

  .busy.link {
    border: 1px dashed var(--hs-ink-disabled);
  }

  .busy .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .busy .title svg {
    vertical-align: -1px;
    margin-right: 4px;
  }

  .busy svg {
    width: 11px;
    height: 11px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .block {
    --tint: color-mix(in srgb, var(--c) 16%, var(--hs-surface));
    z-index: 1;
    border: 0;
    padding-left: 17px;
    background: var(--tint);
    color: var(--hs-ink);
    font: inherit;
    cursor: pointer;
    touch-action: none;
  }

  .block[data-movable="true"] {
    cursor: grab;
  }

  .block.next {
    box-shadow: inset 0 0 0 2px var(--c);
  }

  .block.done {
    --tint: var(--hs-raised);
    color: var(--hs-ink-subtle);
  }

  .block.missed {
    --tint: var(--hs-surface);
    border: 1px dashed var(--hs-field-line);
    padding-left: 16px;
    color: var(--hs-ink-subtle);
  }

  /* The split rail: a rounded piece per session; the gaps are the breaks. */
  .piece {
    position: absolute;
    left: 5px;
    width: 5px;
    border-radius: 3px;
    background: var(--c);
    pointer-events: none;
  }

  .piece.done {
    background: var(--hs-success);
  }

  .piece.missed {
    background: var(--hs-field-line);
  }

  /* A missed block has a 1 px border: move its pieces back so they stay centred. */
  .block.missed .piece {
    margin-top: -1px;
  }

  /* The running session: a ring that stays inside the block. */
  .piece.running {
    box-shadow:
      0 0 0 1.5px var(--tint),
      0 0 0 3px var(--c);
  }

  .block .title,
  .block .sub {
    position: relative;
  }

  .block.dragging {
    opacity: 0.4;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    font-weight: 800;
    line-height: 1.25;
    min-width: 0;
  }

  .name {
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .inline {
    font-weight: 600;
  }

  .sub {
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.9;
  }

  .check,
  .cal {
    width: 11px;
    height: 11px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .now {
    position: absolute;
    left: -4px;
    right: 0;
    z-index: 2;
    border-top: 2px solid var(--hs-accent-strong);
    pointer-events: none;
  }

  .now::before {
    content: "";
    position: absolute;
    left: -1px;
    top: -5px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--hs-accent-strong);
  }

  .ghost {
    z-index: 3;
    left: 2px;
    right: 2px;
    pointer-events: none;
    border: 2px dashed var(--hs-accent);
    background: color-mix(in srgb, var(--hs-accent) 14%, var(--hs-surface));
    color: var(--hs-accent-strong);
    font-size: 12px;
    font-weight: 800;
    justify-content: flex-end;
  }

  .block:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 1px;
  }
</style>
