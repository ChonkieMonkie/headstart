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

// Every content pack's drawings, merged by slot. Add a pack's import here
// when its content file is added to packages/content/src/packs.ts.

import { pack as p01 } from "./01-first-wave.ts";
import { pack as p02 } from "./02-library.ts";
import { pack as p03 } from "./03-deep-sea.ts";
import { pack as p04 } from "./04-space.ts";
import { pack as p05 } from "./05-cosy.ts";
import { pack as p06 } from "./06-garden.ts";
import { pack as p07 } from "./07-rainy-day.ts";
import { pack as p08 } from "./08-cafe.ts";
import { pack as p09 } from "./09-student-life.ts";
import { pack as p10 } from "./10-music.ts";
import { pack as p11 } from "./11-sports.ts";
import { pack as p12 } from "./12-sweets.ts";
import { pack as p13 } from "./13-critters.ts";
import { pack as p14 } from "./14-winter.ts";
import { pack as p15 } from "./15-art.ts";
import { pack as p16 } from "./16-science.ts";
import { pack as p17 } from "./17-travel.ts";
import { pack as p18 } from "./18-fantasy.ts";
import { pack as p19 } from "./19-summer.ts";
import { pack as p20 } from "./20-fashion.ts";
import { pack as p21 } from "./21-outdoors.ts";
import { pack as p22 } from "./22-legacy.ts";
import { pack as p23 } from "./23-legendary.ts";
import { pack as p24 } from "./24-epic.ts";
import type { Draw, PackDrawings, Scene } from "./kit.ts";

const PACKS: readonly PackDrawings[] = [
  p01,
  p02,
  p03,
  p04,
  p05,
  p06,
  p07,
  p08,
  p09,
  p10,
  p11,
  p12,
  p13,
  p14,
  p15,
  p16,
  p17,
  p18,
  p19,
  p20,
  p21,
  p22,
  // Last, so the hand-drawn legendaries and epics replace the first drawings of the same shapes.
  p23,
  p24,
];

function merge<T>(pick: (pack: PackDrawings) => Record<string, T> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const pack of PACKS) Object.assign(out, pick(pack) ?? {});
  return out;
}

export const PACK_DRAWINGS: Record<
  "head" | "face" | "outfit" | "held" | "aura",
  Record<string, Draw>
> = {
  head: merge((p) => p.head),
  face: merge((p) => p.face),
  outfit: merge((p) => p.outfit),
  held: merge((p) => p.held),
  aura: merge((p) => p.aura),
};

export const SCENES: Record<string, Scene> = merge((p) => p.scenes);
