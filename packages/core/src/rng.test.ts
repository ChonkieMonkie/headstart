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
import { createRng, randomIndex } from "./rng.ts";

describe("seeded random numbers", () => {
  it("repeat exactly for the same seed", () => {
    const a = createRng("crate:42");
    const b = createRng("crate:42");
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("differ between seeds", () => {
    const a = createRng("crate:1");
    const b = createRng("crate:2");
    const same = Array.from({ length: 50 }, () => a() === b()).filter(Boolean).length;
    expect(same).toBe(0);
  });

  it("stay in [0, 1) and are evenly spread", () => {
    const rng = createRng("spread");
    const buckets = new Array(10).fill(0);
    const n = 200_000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
      buckets[Math.floor(x * 10)] += 1;
    }
    expect(sum / n).toBeCloseTo(0.5, 2);
    for (const count of buckets) expect(Math.abs(count / n - 0.1)).toBeLessThan(0.005);
  });

  it("picks indexes inside the range", () => {
    const rng = createRng("index");
    for (let i = 0; i < 10_000; i++) {
      const index = randomIndex(rng, 7);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(7);
    }
  });
});
