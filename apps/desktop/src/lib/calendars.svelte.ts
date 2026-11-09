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

// Busy time for the planner: calendar links (such as a TimeEdit schedule),
// imported .ics files and, on macOS, Apple Calendar. Their events stay on this
// device and are never written to the event log; links are refreshed every
// hour.

import {
  type CalendarEvent,
  type CalendarLink,
  eventsBetween,
  type IcsCalendar,
  readCalendar,
} from "@headstart/core";
import { fetchCalendar } from "./shell.ts";
import type { Study } from "./study.svelte.ts";

const LINK_PREFIX = "headstart.calendar.link.";
const FILES_KEY = "headstart.calendar.files";
const REFRESH_MS = 60 * 60_000;
const CHECK_MS = 5 * 60_000;

export type BusyKind = "link" | "file" | "apple";

export interface BusyEvent extends CalendarEvent {
  sourceId: string;
  sourceName: string;
  kind: BusyKind;
}

export interface LinkStatus {
  fetchedAt: number | null;
  error: string | null;
  fetching: boolean;
  count: number;
}

interface StoredFile {
  id: string;
  name: string;
  text: string;
  addedAt: number;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): string | null {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch {
    return "Could not save the calendar on this device";
  }
}

/** Events of a calendar that has at least one event in the next year, counted. */
function upcomingCount(calendar: IcsCalendar): number {
  const now = Date.now();
  return eventsBetween(calendar, now - 7 * 86_400_000, now + 180 * 86_400_000).length;
}

export class Calendars {
  /** Bumped when any calendar changes, so views that read events update. */
  version = $state(0);
  files = $state<{ id: string; name: string; addedAt: number; count: number }[]>([]);
  #status = $state<Record<string, LinkStatus>>({});
  #parsed = new Map<string, IcsCalendar>();
  #names = new Map<string, string>();
  #timer: ReturnType<typeof setInterval> | null = null;
  /** Events from Apple Calendar's chosen calendars, set by the sync on macOS. */
  #apple: (from: number, to: number) => BusyEvent[] = () => [];

  constructor(private study: Study) {}

  /** Reads what is saved on this device and starts the hourly refresh. */
  start(): void {
    for (const file of read<StoredFile[]>(FILES_KEY) ?? [])
      this.#addParsed(file.id, file.name, file.text);
    this.#syncFiles();
    this.refreshDue();
    this.#timer ??= setInterval(() => this.refreshDue(), CHECK_MS);
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
  }

  get links(): CalendarLink[] {
    return [...(this.study.state?.calendars.values() ?? [])].sort((a, b) => a.addedAt - b.addedAt);
  }

  status(id: string): LinkStatus {
    return this.#status[id] ?? { fetchedAt: null, error: null, fetching: false, count: 0 };
  }

  /** Fetches links that were never fetched here, or not in the last hour. */
  refreshDue(): void {
    for (const link of this.links) {
      const status = this.status(link.id);
      if (status.fetching) continue;
      if (!this.#parsed.has(link.id)) {
        const saved = read<{ text: string; fetchedAt: number }>(LINK_PREFIX + link.id);
        if (saved) {
          this.#addParsed(link.id, link.name, saved.text);
          this.#setStatus(link.id, { fetchedAt: saved.fetchedAt, error: null, fetching: false });
        }
      }
      const fetchedAt = this.status(link.id).fetchedAt;
      if (fetchedAt === null || Date.now() - fetchedAt > REFRESH_MS) void this.refresh(link);
    }
  }

  /** Fetches one link now. Returns a reason when it fails. */
  async refresh(link: CalendarLink): Promise<string | null> {
    this.#setStatus(link.id, { fetching: true });
    try {
      const text = await fetchCalendar(link.url);
      const calendar = readCalendar(text);
      this.#parsed.set(link.id, calendar);
      this.#names.set(link.id, link.name);
      const fetchedAt = Date.now();
      write(LINK_PREFIX + link.id, { text, fetchedAt });
      this.#setStatus(link.id, {
        fetchedAt,
        error: null,
        fetching: false,
        count: upcomingCount(calendar),
      });
      this.version += 1;
      return null;
    } catch (error) {
      const reason = typeof error === "string" ? error : "Could not fetch the calendar";
      this.#setStatus(link.id, { error: reason, fetching: false });
      return reason;
    }
  }

  /** Forgets what was fetched for a link that was removed. */
  forget(linkId: string): void {
    this.#parsed.delete(linkId);
    write(LINK_PREFIX + linkId, null);
    const { [linkId]: _, ...rest } = this.#status;
    this.#status = rest;
    this.version += 1;
  }

  /** Adds an imported .ics file. Returns a reason when it is not a calendar. */
  addFile(name: string, text: string): string | null {
    if (!text.includes("BEGIN:VCALENDAR")) return "That file is not a calendar (.ics)";
    const calendar = readCalendar(text);
    if (calendar.events.length === 0) return "That calendar has no events";
    const file: StoredFile = {
      id: this.study.newId(),
      name: calendar.name || name.replace(/\.ics$/i, ""),
      text,
      addedAt: Date.now(),
    };
    const files = [...(read<StoredFile[]>(FILES_KEY) ?? []), file];
    const reason = write(FILES_KEY, files);
    if (reason) return reason;
    this.#addParsed(file.id, file.name, text);
    this.#syncFiles();
    return null;
  }

  removeFile(id: string): void {
    write(
      FILES_KEY,
      (read<StoredFile[]>(FILES_KEY) ?? []).filter((f) => f.id !== id),
    );
    this.#parsed.delete(id);
    this.#syncFiles();
  }

  /** Lets the Apple Calendar sync add its busy events. */
  setAppleSource(source: (from: number, to: number) => BusyEvent[]): void {
    this.#apple = source;
    this.version += 1;
  }

  /** Busy events from every source that overlap [from, to), sorted by start. */
  between(from: number, to: number): BusyEvent[] {
    this.version;
    const links = new Set(this.links.map((l) => l.id));
    const fileIds = new Set(this.files.map((f) => f.id));
    const out: BusyEvent[] = [];
    for (const [id, calendar] of this.#parsed) {
      const kind: BusyKind | null = links.has(id) ? "link" : fileIds.has(id) ? "file" : null;
      if (!kind) continue;
      const sourceName = this.#names.get(id) ?? "";
      for (const e of eventsBetween(calendar, from, to))
        out.push({ ...e, sourceId: id, sourceName, kind });
    }
    out.push(...this.#apple(from, to));
    return out.sort((a, b) => a.start - b.start || a.end - b.end);
  }

  #addParsed(id: string, name: string, text: string): void {
    this.#parsed.set(id, readCalendar(text));
    this.#names.set(id, name);
    this.version += 1;
  }

  #syncFiles(): void {
    this.files = (read<StoredFile[]>(FILES_KEY) ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      addedAt: f.addedAt,
      count: this.#parsed.has(f.id) ? upcomingCount(this.#parsed.get(f.id) as IcsCalendar) : 0,
    }));
    this.version += 1;
  }

  #setStatus(id: string, change: Partial<LinkStatus>): void {
    this.#status = { ...this.#status, [id]: { ...this.status(id), ...change } };
  }
}
