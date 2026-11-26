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

// The content packs, in the order their items are listed. A pack's drawings
// live in @headstart/ui under mascot/packs/ with the same file name.

import p01 from "../data/packs/01-first-wave.json" with { type: "json" };
import p02 from "../data/packs/02-library.json" with { type: "json" };
import p03 from "../data/packs/03-deep-sea.json" with { type: "json" };
import p04 from "../data/packs/04-space.json" with { type: "json" };
import p05 from "../data/packs/05-cosy.json" with { type: "json" };
import p06 from "../data/packs/06-garden.json" with { type: "json" };
import p07 from "../data/packs/07-rainy-day.json" with { type: "json" };
import p08 from "../data/packs/08-cafe.json" with { type: "json" };
import p09 from "../data/packs/09-student-life.json" with { type: "json" };
import p10 from "../data/packs/10-music.json" with { type: "json" };
import p11 from "../data/packs/11-sports.json" with { type: "json" };
import p12 from "../data/packs/12-sweets.json" with { type: "json" };
import p13 from "../data/packs/13-critters.json" with { type: "json" };
import p14 from "../data/packs/14-winter.json" with { type: "json" };
import p15 from "../data/packs/15-art.json" with { type: "json" };
import p16 from "../data/packs/16-science.json" with { type: "json" };
import p17 from "../data/packs/17-travel.json" with { type: "json" };
import p18 from "../data/packs/18-fantasy.json" with { type: "json" };
import p19 from "../data/packs/19-summer.json" with { type: "json" };
import p20 from "../data/packs/20-fashion.json" with { type: "json" };
import p21 from "../data/packs/21-outdoors.json" with { type: "json" };
import p22 from "../data/packs/22-legacy.json" with { type: "json" };
import type { ContentPack } from "./types.ts";

export const PACKS: readonly ContentPack[] = [
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
];
