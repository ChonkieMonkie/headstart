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

export { default as Logo } from "./Logo.svelte";
export {
  GEOMETRY,
  MASCOT_NAMES,
  MASCOT_SPECIES,
  MASCOT_TINTS,
  MOODS,
  type Mood,
} from "./mascot/geometry.ts";
export { itemPreview, lookFor, previewSpecies, starterSkin } from "./mascot/look.ts";
export { default as Mascot } from "./mascot/Mascot.svelte";
export { type MascotLook, mascotLabel, renderMascot } from "./mascot/render.ts";
export { default as StardustIcon } from "./StardustIcon.svelte";
export { colors, fonts, type Rarity, rarityColors } from "./tokens.ts";
