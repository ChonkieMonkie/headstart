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

import { describe, expect, it } from "vitest";
import { eventsBetween, readCalendar } from "./ics.ts";

const ics = (...events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-CALNAME:Spring term", ...events, "END:VCALENDAR"].join(
    "\r\n",
  );

const RANGE = [Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1)] as const;
const iso = (ms: number) => new Date(ms).toISOString();

describe("reading .ics files", () => {
  it("reads a single event in UTC, with folded lines and escaped text", () => {
    const cal = readCalendar(
      ics(
        "BEGIN:VEVENT",
        "UID:a1",
        "DTSTART:20261109T071500Z",
        "DTEND:20261109T090000Z",
        "SUMMARY:Lecture\\, Linear Al",
        " gebra",
        "LOCATION:Hall B",
        "END:VEVENT",
      ),
    );
    expect(cal.name).toBe("Spring term");
    const [event] = eventsBetween(cal, ...RANGE);
    expect(event?.title).toBe("Lecture, Linear Algebra");
    expect(event?.location).toBe("Hall B");
    expect(iso(event?.start ?? 0)).toBe("2026-11-09T07:15:00.000Z");
    expect(iso(event?.end ?? 0)).toBe("2026-11-09T09:00:00.000Z");
  });

  it("keeps a weekly lecture at the same local time across a daylight saving change", () => {
    const cal = readCalendar(
      ics(
        "BEGIN:VEVENT",
        "UID:weekly",
        "DTSTART;TZID=Europe/Stockholm:20261019T081500",
        "DTEND;TZID=Europe/Stockholm:20261019T100000",
        "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3",
        "SUMMARY:Lecture",
        "END:VEVENT",
      ),
    );
    const starts = eventsBetween(cal, ...RANGE).map((e) => iso(e.start));
    // Summer time (UTC+2) on 19 October, winter time (UTC+1) after 25 October.
    expect(starts).toEqual([
      "2026-10-19T06:15:00.000Z",
      "2026-10-26T07:15:00.000Z",
      "2026-11-02T07:15:00.000Z",
    ]);
  });

  it("repeats on several weekdays until a date, and leaves out exceptions", () => {
    const cal = readCalendar(
      ics(
        "BEGIN:VEVENT",
        "UID:twice",
        "DTSTART:20261102T120000Z",
        "DTEND:20261102T130000Z",
        "RRULE:FREQ=WEEKLY;BYDAY=MO,TH;UNTIL=20261112T235959Z",
        "EXDATE:20261105T120000Z",
        "SUMMARY:Exercise class",
        "END:VEVENT",
      ),
    );
    const starts = eventsBetween(cal, ...RANGE).map((e) => iso(e.start).slice(0, 10));
    expect(starts).toEqual(["2026-11-02", "2026-11-09", "2026-11-12"]);
  });

  it("moves one occurrence and skips cancelled ones", () => {
    const cal = readCalendar(
      ics(
        "BEGIN:VEVENT",
        "UID:lab",
        "DTSTART:20261110T120000Z",
        "DTEND:20261110T140000Z",
        "RRULE:FREQ=DAILY;INTERVAL=7;COUNT=3",
        "SUMMARY:Lab",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:lab",
        "RECURRENCE-ID:20261117T120000Z",
        "DTSTART:20261118T080000Z",
        "DTEND:20261118T100000Z",
        "SUMMARY:Lab (moved)",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:gone",
        "DTSTART:20261111T080000Z",
        "DTEND:20261111T090000Z",
        "STATUS:CANCELLED",
        "SUMMARY:Cancelled lecture",
        "END:VEVENT",
      ),
    );
    const events = eventsBetween(cal, ...RANGE).map(
      (e) => `${iso(e.start).slice(0, 13)} ${e.title}`,
    );
    expect(events).toEqual(["2026-11-10T12 Lab", "2026-11-18T08 Lab (moved)", "2026-11-24T12 Lab"]);
  });

  it("returns only events that overlap the range, and reads whole days and durations", () => {
    const cal = readCalendar(
      ics(
        "BEGIN:VEVENT",
        "UID:day",
        "DTSTART;VALUE=DATE:20261113",
        "SUMMARY:Exam week",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:dur",
        "DTSTART:20261110T080000Z",
        "DURATION:PT1H30M",
        "SUMMARY:Seminar",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:old",
        "DTSTART:20250110T080000Z",
        "DTEND:20250110T090000Z",
        "SUMMARY:Last year",
        "END:VEVENT",
      ),
    );
    const events = eventsBetween(cal, Date.UTC(2026, 10, 9), Date.UTC(2026, 10, 16));
    expect(events.map((e) => e.title)).toEqual(["Seminar", "Exam week"]);
    expect((events[0]?.end ?? 0) - (events[0]?.start ?? 0)).toBe(90 * 60_000);
    expect(events[1]?.allDay).toBe(true);
  });

  it("ignores lines and parts it does not understand", () => {
    const cal = readCalendar(
      [
        "BEGIN:VCALENDAR",
        "garbage line",
        "BEGIN:VTIMEZONE",
        "TZID:Europe/Stockholm",
        "END:VTIMEZONE",
        "BEGIN:VEVENT",
        "UID:x",
        "DTSTART:not a date",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:y",
        "DTSTART:20261109T080000Z",
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "END:VALARM",
        "SUMMARY:With an alarm",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
    );
    expect(cal.events.map((e) => e.title)).toEqual(["With an alarm"]);
  });
});
