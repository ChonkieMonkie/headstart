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

// A small reader for iCalendar (.ics) files, enough for schedules from
// TimeEdit, Canvas and ordinary calendar apps: events, weekly and daily
// repeats, exceptions, moved occurrences and time zones. The events are shown
// as busy time in the planner and never written to the event log.

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
/** Stop expanding a repeat after this many occurrences, whatever the rule says. */
const MAX_OCCURRENCES = 2000;

/** One event in the planner's time range. */
export interface CalendarEvent {
  /** Unique per occurrence: the event's UID and its start. */
  id: string;
  title: string;
  location: string;
  start: number;
  end: number;
  allDay: boolean;
}

/** A wall-clock time, read as written in the file. */
interface WallTime {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

/** A date or time from the file: in UTC, in a named zone, floating (local) or a whole day. */
interface IcsTime {
  wall: WallTime;
  zone: "utc" | "local" | "date" | string;
}

interface RRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | string;
  interval: number;
  count: number | null;
  until: number | null;
  byDay: number[];
}

interface IcsEvent {
  uid: string;
  title: string;
  location: string;
  start: IcsTime;
  end: IcsTime | null;
  durationMs: number | null;
  rrule: RRule | null;
  exdates: number[];
  recurrenceId: number | null;
  cancelled: boolean;
}

export interface IcsCalendar {
  /** The calendar's own name (X-WR-CALNAME), or "". */
  name: string;
  events: IcsEvent[];
}

interface Property {
  name: string;
  params: Record<string, string>;
  value: string;
}

/** Joins folded lines: a line that starts with a space or tab continues the one before. */
function unfold(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
    } else if (raw !== "") {
      lines.push(raw);
    }
  }
  return lines;
}

function parseLine(line: string): Property | null {
  // The value starts at the first colon outside quotes.
  let quoted = false;
  let split = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === ":" && !quoted) {
      split = i;
      break;
    }
  }
  if (split < 0) return null;
  const [name = "", ...rawParams] = line.slice(0, split).split(";");
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params, value: line.slice(split + 1) };
}

function unescapeText(value: string): string {
  return value
    .replace(/\\([nN,;\\])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c))
    .trim();
}

function parseTime(prop: Property): IcsTime | null {
  const value = prop.value.trim();
  const date = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (date || prop.params.VALUE === "DATE") {
    const m = date ?? /^(\d{4})(\d{2})(\d{2})/.exec(value);
    if (!m) return null;
    return {
      wall: { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]), h: 0, mi: 0, s: 0 },
      zone: "date",
    };
  }
  const t = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
  if (!t) return null;
  const wall = {
    y: Number(t[1]),
    m: Number(t[2]),
    d: Number(t[3]),
    h: Number(t[4]),
    mi: Number(t[5]),
    s: Number(t[6]),
  };
  if (t[7] === "Z") return { wall, zone: "utc" };
  const tzid = prop.params.TZID;
  return { wall, zone: tzid && validZone(tzid) ? tzid : "local" };
}

const zoneCache = new Map<string, Intl.DateTimeFormat | null>();

function zoneFormat(zone: string): Intl.DateTimeFormat | null {
  if (!zoneCache.has(zone)) {
    try {
      zoneCache.set(
        zone,
        new Intl.DateTimeFormat("en-US", {
          timeZone: zone,
          hourCycle: "h23",
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        }),
      );
    } catch {
      zoneCache.set(zone, null);
    }
  }
  return zoneCache.get(zone) ?? null;
}

function validZone(zone: string): boolean {
  return zoneFormat(zone) !== null;
}

/** How far a zone is ahead of UTC at a moment, in ms. */
function zoneOffset(ms: number, zone: string): number {
  const format = zoneFormat(zone);
  if (!format) return 0;
  const parts: Record<string, number> = {};
  for (const p of format.formatToParts(new Date(ms))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(
    parts.year ?? 1970,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** The moment a wall-clock time stands for. */
function toInstant(wall: WallTime, zone: IcsTime["zone"]): number {
  if (zone === "local" || zone === "date") {
    return new Date(wall.y, wall.m - 1, wall.d, wall.h, wall.mi, wall.s).getTime();
  }
  const guess = Date.UTC(wall.y, wall.m - 1, wall.d, wall.h, wall.mi, wall.s);
  if (zone === "utc") return guess;
  // Twice, so a time near a daylight saving change lands on the right offset.
  const first = guess - zoneOffset(guess, zone);
  return guess - zoneOffset(first, zone);
}

/** Moves a wall-clock time by whole days (the clock time stays the same). */
function addDays(wall: WallTime, days: number): WallTime {
  const d = new Date(Date.UTC(wall.y, wall.m - 1, wall.d + days));
  return { ...wall, y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

/** Day of the week of a wall date, 0 = Monday … 6 = Sunday. */
function weekday(wall: WallTime): number {
  return (new Date(Date.UTC(wall.y, wall.m - 1, wall.d)).getUTCDay() + 6) % 7;
}

const DAY_CODES = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

function parseDuration(value: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value.trim(),
  );
  if (!m) return null;
  const ms =
    (Number(m[2] ?? 0) * 7 + Number(m[3] ?? 0)) * DAY +
    Number(m[4] ?? 0) * 60 * MINUTE +
    Number(m[5] ?? 0) * MINUTE +
    Number(m[6] ?? 0) * 1000;
  return m[1] === "-" ? -ms : ms;
}

function parseRRule(value: string, start: IcsTime): RRule {
  const parts: Record<string, string> = {};
  for (const p of value.split(";")) {
    const [k, v] = p.split("=");
    if (k && v) parts[k.toUpperCase()] = v;
  }
  let until: number | null = null;
  if (parts.UNTIL) {
    const t = parseTime({ name: "UNTIL", params: {}, value: parts.UNTIL });
    // A floating UNTIL is read in the event's own zone.
    if (t) {
      const at = toInstant(t.wall, t.zone === "local" ? start.zone : t.zone);
      until = t.zone === "date" ? at + DAY - 1 : at;
    }
  }
  const byDay = (parts.BYDAY ?? "")
    .split(",")
    .map((code) => DAY_CODES.indexOf(code.replace(/^[+-]?\d+/, "").toUpperCase()))
    .filter((d) => d >= 0);
  return {
    freq: (parts.FREQ ?? "").toUpperCase(),
    interval: Math.max(1, Number(parts.INTERVAL ?? 1) || 1),
    count: parts.COUNT ? Math.max(0, Number(parts.COUNT) || 0) : null,
    until,
    byDay,
  };
}

/** Reads an .ics file. Lines and events it does not understand are skipped. */
export function readCalendar(text: string): IcsCalendar {
  const events: IcsEvent[] = [];
  let name = "";
  let props: Property[] | null = null;
  let depth = 0;
  for (const line of unfold(text)) {
    const prop = parseLine(line);
    if (!prop) continue;
    if (prop.name === "BEGIN") {
      if (prop.value.toUpperCase() === "VEVENT" && props === null) {
        props = [];
        depth = 0;
      } else if (props !== null) depth += 1;
      continue;
    }
    if (prop.name === "END") {
      if (props !== null && depth > 0) depth -= 1;
      else if (props !== null && prop.value.toUpperCase() === "VEVENT") {
        const event = toEvent(props);
        if (event) events.push(event);
        props = null;
      }
      continue;
    }
    if (props !== null) {
      if (depth === 0) props.push(prop);
    } else if (prop.name === "X-WR-CALNAME") name = unescapeText(prop.value);
  }
  return { name, events };
}

function toEvent(props: Property[]): IcsEvent | null {
  const get = (n: string) => props.find((p) => p.name === n);
  const startProp = get("DTSTART");
  const start = startProp ? parseTime(startProp) : null;
  if (!start) return null;
  const endProp = get("DTEND");
  const durationProp = get("DURATION");
  const exdates: number[] = [];
  for (const p of props.filter((q) => q.name === "EXDATE")) {
    for (const v of p.value.split(",")) {
      const t = parseTime({ ...p, value: v });
      if (t) exdates.push(toInstant(t.wall, t.zone === "local" ? start.zone : t.zone));
    }
  }
  const ridProp = get("RECURRENCE-ID");
  const rid = ridProp ? parseTime(ridProp) : null;
  const rruleProp = get("RRULE");
  return {
    uid: get("UID")?.value.trim() ?? "",
    title: unescapeText(get("SUMMARY")?.value ?? ""),
    location: unescapeText(get("LOCATION")?.value ?? ""),
    start,
    end: endProp ? parseTime(endProp) : null,
    durationMs: durationProp ? parseDuration(durationProp.value) : null,
    rrule: rruleProp ? parseRRule(rruleProp.value, start) : null,
    exdates,
    recurrenceId: rid ? toInstant(rid.wall, rid.zone === "local" ? start.zone : rid.zone) : null,
    cancelled: (get("STATUS")?.value.trim().toUpperCase() ?? "") === "CANCELLED",
  };
}

/** The wall-clock starts of an event's repeats, in order, up to `untilMs`. */
function repeatStarts(event: IcsEvent, untilMs: number): WallTime[] {
  const first = event.start.wall;
  const rule = event.rrule;
  if (!rule) return [first];
  const zone = event.start.zone;
  const starts: WallTime[] = [];
  const firstMs = toInstant(first, zone);
  const done = (wall: WallTime) => {
    const ms = toInstant(wall, zone);
    return (rule.until !== null && ms > rule.until) || ms > untilMs;
  };
  const push = (wall: WallTime) => {
    starts.push(wall);
    return (rule.count !== null && starts.length >= rule.count) || starts.length >= MAX_OCCURRENCES;
  };
  if (rule.freq === "DAILY") {
    for (let i = 0; ; i++) {
      const wall = addDays(first, i * rule.interval);
      if (done(wall) || push(wall)) break;
    }
  } else if (rule.freq === "WEEKLY") {
    const days = rule.byDay.length > 0 ? [...rule.byDay].sort((a, b) => a - b) : [weekday(first)];
    const monday = addDays(first, -weekday(first));
    outer: for (let week = 0; week < MAX_OCCURRENCES; week++) {
      for (const day of days) {
        const wall = addDays(monday, week * 7 * rule.interval + day);
        if (toInstant(wall, zone) < firstMs) continue;
        if (done(wall) || push(wall)) break outer;
      }
    }
  } else if (rule.freq === "MONTHLY" || rule.freq === "YEARLY") {
    const step = rule.freq === "MONTHLY" ? rule.interval : rule.interval * 12;
    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      const months = first.m - 1 + i * step;
      const wall = { ...first, y: first.y + Math.floor(months / 12), m: (months % 12) + 1 };
      // Skip months without that day, such as the 31st in April.
      if (new Date(Date.UTC(wall.y, wall.m - 1, wall.d)).getUTCDate() !== wall.d) continue;
      if (done(wall) || push(wall)) break;
    }
  } else {
    starts.push(first);
  }
  return starts;
}

/**
 * Every event that overlaps [from, to), with repeats expanded, exceptions left
 * out and moved occurrences in their new place. Sorted by start.
 */
export function eventsBetween(calendar: IcsCalendar, from: number, to: number): CalendarEvent[] {
  // Occurrences that were moved or cancelled one by one, per UID.
  const overridden = new Map<string, Set<number>>();
  for (const e of calendar.events) {
    if (e.recurrenceId === null) continue;
    const set = overridden.get(e.uid) ?? new Set<number>();
    set.add(e.recurrenceId);
    overridden.set(e.uid, set);
  }
  const out: CalendarEvent[] = [];
  for (const e of calendar.events) {
    const allDay = e.start.zone === "date";
    const firstStart = toInstant(e.start.wall, e.start.zone);
    let length = DAY;
    if (e.end) length = toInstant(e.end.wall, e.end.zone) - firstStart;
    else if (e.durationMs !== null) length = e.durationMs;
    else if (!allDay) length = 0;
    length = Math.max(0, length);
    const starts = e.recurrenceId === null ? repeatStarts(e, to) : [e.start.wall];
    const skip = e.recurrenceId === null ? overridden.get(e.uid) : undefined;
    const exdates = new Set(e.exdates);
    for (const wall of starts) {
      const start = toInstant(wall, e.start.zone);
      if (exdates.has(start) || skip?.has(start)) continue;
      if (e.cancelled) continue;
      const end = allDay
        ? toInstant(addDays(wall, Math.max(1, Math.round(length / DAY))), "date")
        : start + length;
      if (end <= from || start >= to) continue;
      out.push({
        id: `${e.uid}@${start}`,
        title: e.title,
        location: e.location,
        start,
        end,
        allDay,
      });
    }
  }
  return out.sort((a, b) => a.start - b.start || a.end - b.end);
}
