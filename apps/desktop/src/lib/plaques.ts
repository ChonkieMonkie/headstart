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
// How plaques look and read: the colour of each group, the pictures in the
// middle, and the words for a plaque at a tier. The rules live in
// `@headstart/content` and `@headstart/core`.

import { type PlaqueDef, type PlaqueGroup, sets } from "@headstart/content";
import type { PlaqueStanding } from "@headstart/core";
import type { Study } from "./study.svelte.ts";

/** Each group's own colour: the plaque's body and the lighter field inside it. */
export const GROUP_COLORS: Record<PlaqueGroup, { fill: string; inner: string }> = {
  start: { fill: "#F2C24B", inner: "#FBE8A6" },
  focus: { fill: "#8A6DD8", inner: "#DDD3F8" },
  memory: { fill: "#2F9E6E", inner: "#C9EBDC" },
  weeks: { fill: "#2F7FD8", inner: "#CFE2F8" },
  planning: { fill: "#E0813A", inner: "#F8DCC5" },
  collection: { fill: "#C0459A", inner: "#F3D0E7" },
  secret: { fill: "#8A93A6", inner: "#E2E6EF" },
};

export const GROUP_NAMES: Record<PlaqueGroup, string> = {
  start: "Getting going",
  focus: "Focus",
  memory: "Remembering",
  weeks: "Weeks",
  planning: "Planning and exams",
  collection: "Collection",
  secret: "Secret",
};

/** Line drawings on a 24 × 24 grid, by the name a plaque gives as its icon. */
export const PLAQUE_ICONS: Record<string, string> = {
  stack: "M4 8l8-4 8 4-8 4zM4 12l8 4 8-4M4 16l8 4 8-4",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18",
  flag: "M6 21V4M6 5h11l-2 4 2 4H6",
  wave: "M3 14c3-4 6 4 9 0s6 4 9 0M3 9c3-4 6 4 9 0s6 4 9 0",
  road: "M9 21L11 3M15 21L13 3M12 7v2M12 12v2M12 17v2",
  sun: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 3v2M12 19v2M3 12h2M19 12h2",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  question: "M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15M12 19h.01",
  repeat: "M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4",
  leaf: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8",
  mix: "M4 7h4l8 10h4M4 17h4l2-2.5M14 9.5L16 7h4",
  check: "M5 12l5 5 9-10",
  speech: "M4 5h16v11H10l-5 4v-4H4z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  mirror: "M12 3a6 7 0 1 0 0 14a6 7 0 1 0 0-14M12 17v4M8 21h8",
  map: "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14",
  tick: "M4 5h16v14H4zM8 12l3 3 5-6",
  note: "M5 4h14v12l-4 4H5zM15 20v-4h4",
  box: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  hammer: "M14 4l6 6-3 3-6-6zM12.5 8.5L4 17l3 3 8.5-8.5",
  crown: "M4 18h16M4 15l-1-8 5 4 4-7 4 7 5-4-1 8z",
  drop: "M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z",
  back: "M9 8L4 13l5 5M4 13h11a5 5 0 0 0 0-10h-3",
  cap: "M2 10l10-5 10 5-10 5zM6 12v5c4 2 8 2 12 0v-5",
  gem: "M6 4h12l4 6-10 11L2 10zM2 10h20M9 4l3 6 3-6",
};

export const TIER_NUMERALS = ["I", "II", "III", "IV", "V"];

/** What a plaque needs at a tier (1 is the first), in words. */
export function tierWords(def: PlaqueDef, tier: number): string {
  const needed = def.tiers[Math.min(Math.max(tier, 1), def.tiers.length) - 1] ?? 0;
  if (needed === 1 && def.whatOne) return def.whatOne;
  return def.what.replace("{n}", needed.toLocaleString("en-GB"));
}

/** "Deep Diver III", or the name alone for a one-time plaque or one not started. */
export function plaqueTitle(def: PlaqueDef, tier: number): string {
  return def.tiers.length > 1 && tier > 0
    ? `${def.name} ${TIER_NUMERALS[tier - 1] ?? ""}`
    : def.name;
}

/** A plaque as the wall and the news rows draw it. */
export interface PlaqueCard {
  id: string;
  def: PlaqueDef;
  /** The tier held, 0 for none. */
  tier: number;
  count: number;
  /** What the next tier needs, or null when there is no next one. */
  next: number | null;
  /** A secret plaque that is not earned yet: drawn as a question mark. */
  hidden: boolean;
}

const card = (standing: PlaqueStanding): PlaqueCard => ({
  id: standing.def.id,
  def: standing.def,
  tier: standing.tier,
  count: standing.count,
  next:
    standing.tier >= standing.def.tiers.length ? null : (standing.def.tiers[standing.tier] ?? null),
  hidden: standing.def.secret === true && standing.tier === 0,
});

/** The plaques made for each course with an exam and for each set of items. */
function madePlaques(study: Study): PlaqueCard[] {
  const one = (id: string, def: Omit<PlaqueDef, "id" | "metric" | "tiers">): PlaqueCard => {
    const tier = study.plaqueTier(id);
    return {
      id,
      def: { ...def, id, metric: "sessions", tiers: [1] },
      tier,
      count: tier,
      next: tier > 0 ? null : 1,
      hidden: false,
    };
  };
  const exams = [...study.courses, ...study.archivedCourses]
    .filter((course) => course.examDate !== null || study.plaqueTier(`exam:${course.id}`) > 0)
    .map((course) =>
      one(`exam:${course.id}`, {
        name: `Exam Ready: ${course.name}`,
        group: "planning",
        icon: "cap",
        what: "Reach the exam with every planned review done",
      }),
    );
  const finished = sets.map((set) =>
    one(`set:${set.id}`, {
      name: `${set.name} set`,
      group: "collection",
      icon: "gem",
      what: `Find every item of the ${set.name} set`,
    }),
  );
  return [...exams, ...finished];
}

/** Every plaque for the wall: the shipped ones in their order, then the made ones. */
export function plaqueCards(study: Study): PlaqueCard[] {
  return [...study.plaques.map(card), ...madePlaques(study)];
}

/** One plaque by id, for the rows that tell about a new tier. */
export function plaqueCard(study: Study, plaqueId: string): PlaqueCard | null {
  return plaqueCards(study).find((p) => p.id === plaqueId) ?? null;
}
