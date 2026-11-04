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

// The debug profile's own clock: the developer menu can move it forward by
// hours or days to test weekly rewards. Only the app's idea of "now" moves,
// never the computer's clock, and only in the debug profile.

const PROFILE_KEY = "headstart.profile";
const CLOCK_KEY = "headstart.debugClock";

export type Profile = "real" | "debug";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage can be unavailable; the app then stays on the real profile
  }
}

export const savedProfile = (): Profile => (read(PROFILE_KEY) === "debug" ? "debug" : "real");
export const saveProfile = (profile: Profile) =>
  write(PROFILE_KEY, profile === "debug" ? "debug" : null);

export const savedClockOffset = (): number => Number(read(CLOCK_KEY) ?? 0) || 0;
export const saveClockOffset = (ms: number) => write(CLOCK_KEY, ms ? String(ms) : null);

/** Moves this window's `Date` forward by `ms`. Called once, before the log opens. */
export function moveClock(ms: number): void {
  if (!ms) return;
  const Real = Date;
  class Moved extends Real {
    constructor(...args: ConstructorParameters<typeof Date> | []) {
      if (args.length === 0) super(Real.now() + ms);
      else super(...(args as ConstructorParameters<typeof Date>));
    }
    static override now(): number {
      return Real.now() + ms;
    }
  }
  globalThis.Date = Moved as DateConstructor;
}
