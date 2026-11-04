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

// Simulates weeks of studying through the real commands and projection. Used
// by tests and `pnpm simulate` to check that XP, levels and crate odds behave
// as intended over a whole semester.

import { RARITIES, type Rarity } from "@headstart/content";
import {
  completeSession,
  openCrate,
  pauseSession,
  resumeSession,
  startSession,
  writeRecall,
} from "./commands.ts";
import { atLeast } from "./crates.ts";
import { StudyEngine } from "./engine.ts";
import { createUlidFactory } from "./ids.ts";
import { type LevelInfo, levelInfo } from "./rewards.ts";
import { createRng, randomIndex } from "./rng.ts";
import { type CoreContext, owns, unopenedCrates } from "./state.ts";
import { type EventStore, MemoryEventStore } from "./store.ts";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export interface SimulationOptions {
  ctx: CoreContext;
  seed: string;
  weeks: number;
  /** Fewest and most sessions on a study day. */
  sessionsPerDay: [number, number];
  /** Weekdays without studying, 0 = Sunday. */
  restDays?: number[];
  /** Share of sessions started within the on-time window. */
  onTimeRate?: number;
  /** Share of sessions followed by a recall. */
  recallRate?: number;
  /** Share of sessions with at least one distraction. */
  distractionRate?: number;
  sessionMinutes?: number;
  /** Local midnight of the first day. */
  start?: Date;
  /** Where the events go. A fresh memory store by default. */
  store?: EventStore;
  /** Device id written on the events. */
  deviceId?: string;
  /** Open every crate as it is earned (default), or leave them waiting. */
  openCrates?: boolean;
}

export interface SimulationSummary {
  days: number;
  studyDays: number;
  sessions: number;
  focusHours: number;
  xp: number;
  level: LevelInfo;
  cratesOpened: number;
  drops: Record<Rarity, number>;
  /** Longest run of crates without an Epic or better. Pity caps it. */
  longestWithoutEpic: number;
  longestWithoutLegendary: number;
  stardust: number;
  itemsOwned: number;
  itemsInCatalog: number;
  bestOnTimeStreak: number;
}

export async function simulateStudy(
  options: SimulationOptions,
): Promise<{ engine: StudyEngine; summary: SimulationSummary }> {
  const { ctx } = options;
  const rng = createRng(`simulation:${options.seed}`);
  const chance = (p: number) => rng() < p;
  const between = (lo: number, hi: number) => lo + rng() * (hi - lo);

  let now = (options.start ?? new Date(2026, 8, 1)).getTime();
  const newId = createUlidFactory((bytes) => {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(rng() * 256);
  });
  const engine = await StudyEngine.open(
    options.store ?? new MemoryEventStore(),
    { deviceId: options.deviceId ?? "simulation", now: () => new Date(now), newId },
    ctx,
  );

  const first = now;
  const minutes = options.sessionMinutes ?? 25;
  const [fewest, most] = options.sessionsPerDay;
  let studyDays = 0;
  let sessionCounter = 0;

  for (let d = 0; d < options.weeks * 7; d++) {
    const dayStart = first + d * DAY;
    if (options.restDays?.includes(new Date(dayStart).getDay())) continue;
    const count = fewest + randomIndex(rng, most - fewest + 1);
    if (count > 0) studyDays += 1;

    for (let i = 0; i < count; i++) {
      const lunch = i >= 4 ? 60 * MINUTE : 0;
      const planned = dayStart + 9 * 60 * MINUTE + i * 35 * MINUTE + lunch;
      const offset = chance(options.onTimeRate ?? 0.75)
        ? between(-5, 4) * MINUTE
        : between(6, 30) * MINUTE;
      now = Math.max(now + 5 * MINUTE, planned + offset);

      const sessionId = `sim-${++sessionCounter}`;
      await engine.run((s) =>
        startSession(s, { sessionId, plannedMinutes: minutes, plannedStartAt: new Date(planned) }),
      );
      if (chance(0.1)) {
        now += 10 * MINUTE;
        await engine.run(pauseSession);
        now += 3 * MINUTE;
        await engine.run(resumeSession);
        now += (minutes - 10) * MINUTE;
      } else {
        now += minutes * MINUTE;
      }
      const distractions = chance(options.distractionRate ?? 0.3) ? 1 + randomIndex(rng, 2) : 0;
      await engine.run((s) => completeSession(s, { distractions }));

      if (chance(options.recallRate ?? 0.8)) {
        now += MINUTE;
        await engine.run((s) =>
          writeRecall(s, sessionId, "Eigenvalues come from det(A - λI) = 0."),
        );
      }
      for (const crate of options.openCrates === false ? [] : unopenedCrates(engine.state)) {
        await engine.run((s, c) => openCrate(s, crate.id, c));
      }
    }
  }

  return { engine, summary: summarize(engine, options.weeks * 7, studyDays) };
}

function summarize(engine: StudyEngine, days: number, studyDays: number): SimulationSummary {
  const { state, context } = engine;
  const drops = Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>;
  let withoutEpic = 0;
  let withoutLegendary = 0;
  let longestWithoutEpic = 0;
  let longestWithoutLegendary = 0;
  const opened = state.crates.filter((c) => c.openedAt !== null);

  for (const crate of opened) {
    for (const drop of crate.drops) drops[drop.rarity] += 1;
    const hasEpic = crate.drops.some((drop) => atLeast(drop.rarity, "epic"));
    const hasLegendary = crate.drops.some((drop) => drop.rarity === "legendary");
    withoutEpic = hasEpic ? 0 : withoutEpic + 1;
    withoutLegendary = hasLegendary ? 0 : withoutLegendary + 1;
    longestWithoutEpic = Math.max(longestWithoutEpic, withoutEpic);
    longestWithoutLegendary = Math.max(longestWithoutLegendary, withoutLegendary);
  }

  return {
    days,
    studyDays,
    sessions: state.completedSessions,
    focusHours: Math.round((state.focusMinutes / 60) * 10) / 10,
    xp: state.xp,
    level: levelInfo(state.xp, context.rewards),
    cratesOpened: opened.length,
    drops,
    longestWithoutEpic,
    longestWithoutLegendary,
    stardust: state.stardust,
    itemsOwned: context.catalog.filter((item) => owns(state, item.id)).length,
    itemsInCatalog: context.catalog.length,
    bestOnTimeStreak: state.bestOnTimeStreak,
  };
}
