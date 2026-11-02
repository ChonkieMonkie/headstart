// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { formatDuration } from "./time.ts";

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
