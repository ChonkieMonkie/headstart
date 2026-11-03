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

// ULIDs: 26-character ids that sort by creation time and are unique across
// devices, so events from a laptop and a phone can be merged without clashes.

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const RANDOM_DIGITS = 16;

export type RandomFill = (bytes: Uint8Array) => void;

interface WebCrypto {
  getRandomValues(bytes: Uint8Array): Uint8Array;
}

export const secureRandomFill: RandomFill = (bytes) => {
  const crypto = (globalThis as { crypto?: WebCrypto }).crypto;
  if (!crypto) throw new Error("No secure random source is available");
  crypto.getRandomValues(bytes);
};

/**
 * Returns a ULID generator. Ids from one generator are strictly increasing,
 * even within the same millisecond or if the system clock steps backwards.
 */
export function createUlidFactory(randomFill: RandomFill = secureRandomFill) {
  let lastTime = -1;
  let lastRandom: number[] = [];

  return function ulid(now: number = Date.now()): string {
    if (now <= lastTime) {
      lastRandom = increment(lastRandom);
    } else {
      lastTime = now;
      const bytes = new Uint8Array(RANDOM_DIGITS);
      randomFill(bytes);
      lastRandom = Array.from(bytes, (b) => b & 31);
    }
    return encodeTime(lastTime) + lastRandom.map((d) => ENCODING[d]).join("");
  };
}

function encodeTime(time: number): string {
  let rest = time;
  let out = "";
  for (let i = 0; i < 10; i++) {
    out = ENCODING[rest % 32] + out;
    rest = Math.floor(rest / 32);
  }
  return out;
}

function increment(digits: number[]): number[] {
  const next = [...digits];
  for (let i = next.length - 1; i >= 0; i--) {
    const digit = next[i] ?? 0;
    if (digit < 31) {
      next[i] = digit + 1;
      return next;
    }
    next[i] = 0;
  }
  throw new Error("ULID random part overflowed within one millisecond");
}
