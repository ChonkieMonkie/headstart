// Headstart, a study companion that helps you get started, stay focused and keep going.
// Copyright (C) 2026  ChonkieMonkie
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Two-way sync with Apple Calendar on macOS. Every planned session becomes an
// event in the user's chosen calendar (by default a new "Headstart" calendar
// in iCloud, so it shows on the phone too). Moving or deleting the event in
// Calendar moves or cancels the session here. Other chosen calendars show as
// busy time. Which session belongs to which event is stored on this device
// only, never in the event log.

import {
  blockKey,
  blockSlots,
  cancelPlan,
  fitSessions,
  movePlan,
  type Plan,
  planSession,
  presetFor,
  updatePlan,
} from "@headstart/core";
import { untrack } from "svelte";
import type { Calendars } from "./calendars.svelte.ts";
import { clockTime } from "./format.ts";
import { type AppleCalendarInfo, type AppleEvent, appleCalendar } from "./shell.ts";
import type { Study } from "./study.svelte.ts";
import { inTauri } from "./tauri.ts";

const KEY = "headstart.apple";
const LOG_KEY = "headstart.apple.log";
const LOG_SIZE = 40;
/** A linked event must be missing this many syncs in a row before its session is cancelled. */
const GONE_AFTER = 2;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const NEW_CALENDAR = "Headstart";
const SYNC_DELAY_MS = 1500;
const CHECK_MS = 5 * MINUTE;

interface Link {
  eventId: string;
  start: number;
  end: number;
  title: string;
  notes: string;
}

interface Saved {
  enabled: boolean;
  calendarId: string | null;
  twoWay: boolean;
  busyIds: string[];
  links: Record<string, Link>;
  /** Syncs in a row that a linked event could not be found, per plan. */
  missing: Record<string, number>;
}

const EMPTY: Saved = {
  enabled: false,
  calendarId: null,
  twoWay: true,
  busyIds: [],
  links: {},
  missing: {},
};

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Saved>) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

const second = (ms: number) => Math.round(ms / 1000) * 1000;

export class AppleSync {
  /** Only in the installed app on a Mac. */
  readonly available = inTauri && /Mac/.test(navigator.userAgent);
  status = $state("unknown");
  calendars = $state<AppleCalendarInfo[]>([]);
  saved = $state<Saved>(load());
  lastSync = $state<number | null>(null);
  error = $state<string | null>(null);
  #busy: AppleEvent[] = [];
  #busyKey = "";
  #running = false;
  #again = false;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #stop: (() => void)[] = [];

  constructor(
    private study: Study,
    private calendarsStore: Calendars,
  ) {}

  get on(): boolean {
    return this.available && this.saved.enabled && this.status === "granted";
  }

  get calendarName(): string {
    const cal = this.calendars.find((c) => c.id === this.saved.calendarId);
    return cal ? `${cal.title}${cal.icloud ? " (iCloud)" : ""}` : NEW_CALENDAR;
  }

  /** "Adds to Calendar: Headstart (iCloud)" for the plan editor, or null when off. */
  get note(): string | null {
    return this.on ? `Adds to Calendar: ${this.calendarName}` : null;
  }

  /** Whether a block (by its key) is in Apple Calendar. */
  synced(key: string): boolean {
    return this.on && key in this.saved.links;
  }

  async start(): Promise<void> {
    if (!this.available) return;
    this.calendarsStore.setAppleSource((from, to) => this.#busyBetween(from, to));
    try {
      this.status = await appleCalendar.status();
      if (this.status === "granted") this.calendars = await appleCalendar.list();
    } catch (error) {
      this.error = String(error);
    }
    this.#stop.push(appleCalendar.onChange(() => this.schedule()));
    const interval = setInterval(() => this.schedule(), CHECK_MS);
    this.#stop.push(() => clearInterval(interval));
    // Sync shortly after any change to the plan. Only the log version is
    // tracked: the sync saving its own state must not start another sync
    // (that made it loop every couple of seconds).
    this.#stop.push(
      $effect.root(() => {
        $effect(() => {
          this.study.version;
          untrack(() => this.schedule());
        });
      }),
    );
  }

  stop(): void {
    for (const stop of this.#stop) stop();
    this.#stop = [];
    clearTimeout(this.#timer);
  }

  /** Asks for access, picks or makes the calendar for sessions, and syncs. */
  async connect(): Promise<string | null> {
    try {
      if (this.status !== "granted") {
        const granted = await appleCalendar.request();
        this.status = await appleCalendar.status();
        if (!granted || this.status !== "granted") {
          return "Headstart has no access to your calendars. You can allow it in System Settings, Privacy & Security, Calendars.";
        }
      }
      this.calendars = await appleCalendar.list();
      let calendarId = this.saved.calendarId;
      if (!calendarId || !this.calendars.some((c) => c.id === calendarId && c.writable)) {
        const existing = this.calendars.find((c) => c.title === NEW_CALENDAR && c.writable);
        calendarId = existing?.id ?? (await appleCalendar.create(NEW_CALENDAR));
        this.calendars = await appleCalendar.list();
      }
      this.#save({ enabled: true, calendarId });
      this.error = null;
      await this.sync();
      return null;
    } catch (error) {
      return String(error);
    }
  }

  /** Stops syncing. Events already in Calendar stay there. */
  disconnect(): void {
    this.#save({ enabled: false, links: {}, missing: {} });
    this.#busy = [];
    this.calendarsStore.setAppleSource((from, to) => this.#busyBetween(from, to));
  }

  async setCalendar(id: string): Promise<string | null> {
    try {
      const calendarId = id === "new" ? await appleCalendar.create(NEW_CALENDAR) : id;
      this.calendars = await appleCalendar.list();
      // Sessions move with the choice: the old events are removed, new ones made.
      for (const link of Object.values(this.saved.links))
        await appleCalendar.delete(link.eventId).catch(() => {});
      this.#save({
        calendarId,
        links: {},
        missing: {},
        busyIds: this.saved.busyIds.filter((b) => b !== calendarId),
      });
      await this.sync();
      return null;
    } catch (error) {
      return String(error);
    }
  }

  setTwoWay(on: boolean): void {
    this.#save({ twoWay: on });
  }

  toggleBusy(id: string): void {
    const busyIds = this.saved.busyIds.includes(id)
      ? this.saved.busyIds.filter((b) => b !== id)
      : [...this.saved.busyIds, id];
    this.#save({ busyIds });
    this.schedule();
  }

  schedule(): void {
    if (!untrack(() => this.on)) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.sync(), SYNC_DELAY_MS);
  }

  /** One pass both ways. Safe to call often; overlapping calls run once more after. */
  async sync(): Promise<void> {
    if (!this.on || !this.saved.calendarId) return;
    if (this.#running) {
      this.#again = true;
      return;
    }
    this.#running = true;
    try {
      await this.#syncOnce(this.saved.calendarId);
      this.lastSync = Date.now();
      this.error = null;
    } catch (error) {
      this.error = String(error);
      this.#log({ error: String(error) });
    } finally {
      this.#running = false;
      if (this.#again) {
        this.#again = false;
        this.schedule();
      }
    }
  }

  async #syncOnce(calendarId: string): Promise<void> {
    const state = this.study.state;
    if (!state) return;
    const now = Date.now();
    const from = now - 2 * DAY;
    const to = now + 90 * DAY;

    const busyIds = this.saved.busyIds.filter((id) => id !== calendarId);
    const busyKey = busyIds.join(",");
    const busy = busyIds.length > 0 ? await appleCalendar.events(busyIds, now - 14 * DAY, to) : [];
    // An empty answer for the same calendars that just had events is most likely
    // a hiccup in Calendar: keep what was there and look again next time.
    const hiccup = busy.length === 0 && this.#busy.length > 0 && busyKey === this.#busyKey;
    if (!hiccup) {
      this.#busy = busy;
      this.#busyKey = busyKey;
      this.calendarsStore.setAppleSource((a, b) => this.#busyBetween(a, b));
    }

    const own = await appleCalendar.events([calendarId], from - DAY, to + DAY);
    const events = new Map(
      own.map((e) => [e.id, { ...e, start: second(e.start), end: second(e.end) }]),
    );
    const links = { ...this.saved.links };
    const missing: Record<string, number> = {};
    const log = {
      busy: busy.length,
      own: own.length,
      created: 0,
      updated: 0,
      moved: 0,
      cancelled: 0,
      relinked: 0,
    };
    // One event per block (a session on its own is a block of one), from its
    // first session to the end of its last. Only sessions still to come count.
    const groups = new Map<string, Plan[]>();
    for (const p of state.plans.values()) {
      if (p.cancelled || p.sessionId !== null) continue;
      if (p.startAt + p.minutes * MINUTE < from || p.startAt >= to) continue;
      groups.set(blockKey(p), [...(groups.get(blockKey(p)) ?? []), p]);
    }
    for (const list of groups.values()) list.sort((x, y) => x.startAt - y.startAt);
    const linked = new Set(Object.values(links).map((l) => l.eventId));

    for (const [key, group] of groups) {
      const want = this.#desired(group);
      let link = links[key];
      let event = link ? events.get(link.eventId) : undefined;
      if (link && !event) {
        // Calendar can give an event a new id when it syncs with iCloud, so look
        // it up by id, then by title and time, before calling it gone.
        const old = link;
        const byId = await appleCalendar.get(old.eventId).catch(() => null);
        const found =
          byId ??
          [...events.values()].find(
            (e) =>
              !linked.has(e.id) &&
              e.title === old.title &&
              e.start === old.start &&
              e.end === old.end,
          );
        if (found) {
          event = { ...found, start: second(found.start), end: second(found.end) };
          link = { ...old, eventId: found.id };
          links[key] = link;
          linked.add(found.id);
          log.relinked += 1;
        } else {
          // Deleted in Calendar. Only once it has been missing a few syncs in a
          // row is the block cancelled here (or put back, when sync is one-way).
          const count = (this.saved.missing[key] ?? 0) + 1;
          if (count < GONE_AFTER) {
            missing[key] = count;
            continue;
          }
          delete links[key];
          link = undefined;
          if (this.saved.twoWay) {
            for (const p of group) await this.study.run((s) => cancelPlan(s, p.id));
            log.cancelled += 1;
            continue;
          }
        }
      }
      if (link && event) {
        const calendarMoved = event.start !== link.start || event.end !== link.end;
        if (calendarMoved && this.saved.twoWay) {
          await this.#applyFromCalendar(group, event);
          links[key] = { ...want, eventId: event.id, start: event.start, end: event.end };
          log.moved += 1;
          continue;
        }
        if (
          want.start !== link.start ||
          want.end !== link.end ||
          want.title !== link.title ||
          want.notes !== link.notes
        ) {
          const id = await appleCalendar.save({ id: event.id, calendarId, ...want });
          links[key] = { ...want, eventId: id };
          log.updated += 1;
        }
        continue;
      }
      // Not linked yet: find a lost link by time and title before making a new event.
      const match = [...events.values()].find(
        (e) => !linked.has(e.id) && e.start === want.start && e.title === want.title,
      );
      const id = match?.id ?? (await appleCalendar.save({ id: null, calendarId, ...want }));
      if (!match) log.created += 1;
      links[key] = { ...want, eventId: id };
      linked.add(id);
    }

    // Blocks that are no longer planned: a cancelled one leaves Calendar, one
    // that has started stays there as a record.
    for (const [key, link] of Object.entries(links)) {
      if (groups.has(key)) continue;
      const any = [...state.plans.values()].filter((p) => blockKey(p) === key);
      if (any.length === 0 || any.every((p) => p.cancelled))
        await appleCalendar.delete(link.eventId).catch(() => {});
      delete links[key];
    }
    // Save only real changes, so a quiet sync writes nothing.
    const changed =
      JSON.stringify(links) !== JSON.stringify(this.saved.links) ||
      JSON.stringify(missing) !== JSON.stringify(this.saved.missing);
    if (changed) this.#save({ links, missing });
    this.#log({ ...log, hiccup });
  }

  /** A short record of recent syncs on this device, to find out what went wrong. */
  #log(entry: Record<string, number | boolean | string>): void {
    try {
      const old = JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]") as unknown[];
      const next = [...old.slice(-(LOG_SIZE - 1)), { at: new Date().toISOString(), ...entry }];
      localStorage.setItem(LOG_KEY, JSON.stringify(next));
    } catch {
      // The log is only a help.
    }
  }

  /** The event a block should be: title, notes and time. */
  #desired(group: Plan[]): Omit<Link, "eventId"> {
    const first = group[0] as Plan;
    const last = group[group.length - 1] ?? first;
    const course = this.study.course(first.courseId);
    const task = this.study.task(first.taskId);
    const title =
      course && task
        ? `${course.name} · ${task.title}`
        : (course?.name ?? task?.title ?? "Study session");
    const todos = group.flatMap((p) => this.study.todosForPlan(p.id)).map((t) => `• ${t.text}`);
    const sessions =
      group.length > 1
        ? `${group.length} × ${first.minutes} min with breaks: ${group.map((p) => clockTime(p.startAt)).join(", ")}`
        : "";
    const lines = [
      first.ifThen ?? "",
      sessions,
      todos.length > 0
        ? `To-dos:\n${todos.join("\n")}`
        : task?.nextStep
          ? `Next step: ${task.nextStep}`
          : "",
      "Planned in Headstart.",
    ].filter(Boolean);
    return {
      title,
      notes: lines.join("\n\n"),
      start: first.startAt,
      end: last.startAt + last.minutes * MINUTE,
    };
  }

  /**
   * The event was moved or resized in Calendar. Moving shifts every session of
   * the block; a new length changes how many sessions fit (or, for a single
   * session, its length).
   */
  async #applyFromCalendar(group: Plan[], event: AppleEvent): Promise<void> {
    const first = group[0] as Plan;
    const delta = event.start - first.startAt;
    if (delta !== 0) {
      for (const p of group)
        await this.study.run((s) => movePlan(s, p.id, new Date(p.startAt + delta)));
    }
    const total = Math.round((event.end - event.start) / MINUTE);
    if (group.length === 1 && first.blockId === null) {
      if (total !== first.minutes && total >= 1 && total <= 240) {
        await this.study.run((s) => updatePlan(s, first.id, { minutes: total }));
      }
      return;
    }
    const preset = presetFor(first.minutes);
    const count = Math.max(1, fitSessions(total, first.minutes, preset).count);
    if (count < group.length) {
      for (const p of group.slice(count)) await this.study.run((s) => cancelPlan(s, p.id));
    } else if (count > group.length) {
      const blockId = first.blockId ?? this.study.newId();
      const slots = blockSlots(event.start, count, first.minutes, preset);
      for (const slot of slots.slice(group.length)) {
        await this.study.run((s) =>
          planSession(s, {
            planId: this.study.newId(),
            startAt: new Date(slot.startAt),
            minutes: first.minutes,
            ...(first.taskId
              ? { taskId: first.taskId }
              : first.courseId
                ? { courseId: first.courseId }
                : {}),
            ...(first.ifThen ? { ifThen: first.ifThen } : {}),
            blockId,
          }),
        );
      }
    }
  }

  #busyBetween(from: number, to: number) {
    if (!this.on) return [];
    const names = new Map(this.calendars.map((c) => [c.id, c.title]));
    return this.#busy
      .filter((e) => e.end > from && e.start < to)
      .map((e) => ({
        id: `apple:${e.id}:${e.start}`,
        title: e.title,
        location: e.location,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        sourceId: e.calendarId,
        sourceName: names.get(e.calendarId) ?? "Calendar",
        kind: "apple" as const,
      }));
  }

  #save(change: Partial<Saved>): void {
    this.saved = { ...this.saved, ...change };
    try {
      localStorage.setItem(KEY, JSON.stringify(this.saved));
    } catch {
      this.error = "Could not save the calendar sync settings on this device";
    }
  }
}
