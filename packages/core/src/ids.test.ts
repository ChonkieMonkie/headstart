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
import { createUlidFactory } from "./ids.ts";

describe("ULIDs", () => {
  it("are 26 Crockford base32 characters", () => {
    const id = createUlidFactory()(Date.UTC(2026, 10, 3));
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("sort by time across generators (devices)", () => {
    const ids = [3, 1, 2].map((s) => createUlidFactory()(Date.UTC(2026, 0, 1, 0, 0, s)));
    expect([...ids].sort()).toEqual([ids[1], ids[2], ids[0]]);
  });

  it("stay strictly increasing within one millisecond and when the clock steps back", () => {
    const ulid = createUlidFactory();
    const t = Date.UTC(2026, 10, 3);
    const ids = [ulid(t), ulid(t), ulid(t), ulid(t - 5000)];
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("encode the timestamp in the first ten characters", () => {
    const zeros = createUlidFactory((bytes) => bytes.fill(0));
    expect(zeros(0)).toBe("0".repeat(26));
    expect(zeros(1).slice(0, 10)).toBe("0000000001");
  });
});
