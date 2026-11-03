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
import { formatDuration, formatMinutes } from "./time.ts";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(25 * 60 * 1000)).toBe("25:00");
    expect(formatDuration(4 * 60 * 1000 + 5000)).toBe("4:05");
  });

  it("adds hours when needed", () => {
    expect(formatDuration(3723 * 1000)).toBe("1:02:03");
  });

  it("rounds partial seconds up so a running timer never shows zero early", () => {
    expect(formatDuration(1)).toBe("0:01");
    expect(formatDuration(59_001)).toBe("1:00");
  });

  it("clamps negative durations to zero", () => {
    expect(formatDuration(-5000)).toBe("0:00");
  });
});

describe("formatMinutes", () => {
  it("shows minutes, hours, or both", () => {
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(180)).toBe("3 h");
    expect(formatMinutes(200)).toBe("3 h 20 min");
  });
});
