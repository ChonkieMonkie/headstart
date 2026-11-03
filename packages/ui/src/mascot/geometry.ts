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

// Where things sit on each mascot, and how each mood looks. Every mascot is
// drawn in a 200 × 200 box. Wearables are drawn around anchors (head top,
// neck, hand, eyes), so one shape fits all three mascots.

import type { MascotId } from "@headstart/content";

export type Point = readonly [number, number];
export type Pose = "down" | "up" | "hold" | "wave" | "point";

export interface Geometry {
  /** Eye centres (left, right x) and their shared y, and the eye scale. */
  ex1: number;
  ex2: number;
  ey: number;
  es: number;
  /** Mouth centre. */
  mx: number;
  my: number;
  /** Cheek x (left, right) and y. */
  bl: number;
  br: number;
  by: number;
  /** Head anchor: just under the top of the head, and the hat scale. */
  hx: number;
  hy: number;
  hs: number;
  /** Neck anchor, where scarves and ties sit. */
  nx: number;
  ny: number;
  /** Half the head's width at eye level, for straps that wrap around it. */
  headHalfWidth: number;
  /** Shoulders, arm thickness (outline, fill) and hand radius. */
  shoulders: readonly [Point, Point];
  armOuter: number;
  armInner: number;
  handR: number;
  hands: Record<Pose, readonly [Point, Point]>;
}

export const GEOMETRY: Record<MascotId, Geometry> = {
  inky: {
    ex1: 80,
    ex2: 120,
    ey: 80,
    es: 1,
    mx: 100,
    my: 98,
    bl: 66,
    br: 134,
    by: 94,
    hx: 100,
    hy: 28,
    hs: 1.05,
    nx: 100,
    ny: 118,
    headHalfWidth: 55,
    shoulders: [
      [64, 108],
      [136, 108],
    ],
    armOuter: 15,
    armInner: 10.5,
    handR: 5.5,
    hands: {
      down: [
        [44, 146],
        [156, 146],
      ],
      up: [
        [32, 72],
        [168, 72],
      ],
      hold: [
        [84, 140],
        [116, 140],
      ],
      wave: [
        [44, 146],
        [170, 78],
      ],
      point: [
        [44, 146],
        [164, 104],
      ],
    },
  },
  axo: {
    ex1: 72,
    ex2: 128,
    ey: 80,
    es: 0.85,
    mx: 100,
    my: 93,
    bl: 60,
    br: 140,
    by: 92,
    hx: 100,
    hy: 38,
    hs: 1.05,
    nx: 100,
    ny: 121,
    headHalfWidth: 57,
    shoulders: [
      [77, 130],
      [123, 130],
    ],
    armOuter: 13,
    armInner: 9,
    handR: 6,
    hands: {
      down: [
        [66, 154],
        [134, 154],
      ],
      up: [
        [42, 108],
        [158, 108],
      ],
      hold: [
        [88, 148],
        [112, 148],
      ],
      wave: [
        [66, 154],
        [160, 104],
      ],
      point: [
        [66, 154],
        [156, 120],
      ],
    },
  },
  maple: {
    ex1: 79,
    ex2: 121,
    ey: 82,
    es: 1,
    mx: 100,
    my: 102,
    bl: 66,
    br: 134,
    by: 97,
    hx: 100,
    hy: 40,
    hs: 1,
    nx: 100,
    ny: 129,
    headHalfWidth: 56,
    shoulders: [
      [78, 134],
      [122, 134],
    ],
    armOuter: 15,
    armInner: 10.5,
    handR: 7.5,
    hands: {
      down: [
        [64, 160],
        [136, 160],
      ],
      up: [
        [42, 114],
        [158, 114],
      ],
      hold: [
        [88, 152],
        [112, 152],
      ],
      wave: [
        [64, 160],
        [162, 110],
      ],
      point: [
        [64, 160],
        [154, 126],
      ],
    },
  },
};

export const MOODS = ["idle", "focus", "break", "celebrate", "sleepy", "welcome", "nudge"] as const;
export type Mood = (typeof MOODS)[number];

export interface MoodLook {
  eyes: "open" | "focus" | "happy" | "sleep" | "sparkle" | "side";
  mouth: "smile" | "flat" | "open" | "o";
  pose: Pose;
  bubble?: "cup" | "zz" | "heart" | "q";
  confetti?: boolean;
  /** Ears and gills stand up. */
  perk?: boolean;
  /** Ears and gills hang down. */
  droop?: boolean;
}

/** Mood never changes colour (skins own colour): only face, pose and a thought bubble. */
export const MOOD_LOOKS: Record<Mood, MoodLook> = {
  idle: { eyes: "open", mouth: "smile", pose: "down" },
  focus: { eyes: "focus", mouth: "flat", pose: "hold" },
  break: { eyes: "happy", mouth: "smile", pose: "down", bubble: "cup" },
  celebrate: { eyes: "happy", mouth: "open", pose: "up", confetti: true, perk: true },
  sleepy: { eyes: "sleep", mouth: "o", pose: "down", bubble: "zz", droop: true },
  welcome: { eyes: "sparkle", mouth: "open", pose: "wave", bubble: "heart", perk: true },
  nudge: { eyes: "side", mouth: "o", pose: "point", bubble: "q" },
};

export const MASCOT_NAMES: Record<MascotId, string> = {
  inky: "Inky",
  axo: "Axo",
  maple: "Maple",
};

export const MASCOT_SPECIES: Record<MascotId, string> = {
  inky: "octopus",
  axo: "axolotl",
  maple: "red panda",
};

/** Soft background tint that suits each mascot's starter colours. */
export const MASCOT_TINTS: Record<MascotId, string> = {
  inky: "#EEECFE",
  axo: "#FDEEF4",
  maple: "#FBEDE4",
};
