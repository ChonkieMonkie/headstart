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

// Design tokens from the design canvas. styles.css mirrors these as CSS custom
// properties; use this file where a raw value is needed (SVG attributes, canvas).

export const colors = {
  ink: "#1B2236",
  inkMuted: "#4A5370",
  inkSubtle: "#5A6378",
  ground: "#F3F5FA",
  surface: "#FFFFFF",
  line: "#E2E6EF",
  accent: "#5B4BD6",
  accentStrong: "#4335B0",
  accentSoft: "#EEECFE",
  lavender: "#E9E6FD",
  success: "#2F9E6E",
  successStrong: "#1E6B4A",
  successSoft: "#E3F4EC",
  focusGround: "#1B1F3B",
  focusSurface: "#232850",
  focusAccent: "#A99BFF",
  focusText: "#F3F5FA",
  focusTextMuted: "#B8BFD6",
} as const;

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "exotic";

/** A rarity's colours: `dot` for markers, `fg` on `bg` for readable labels (4.5:1 contrast). */
export interface RarityColors {
  dot: string;
  fg: string;
  bg: string;
}

const RARITIES: readonly Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "exotic"];

/**
 * Rarity colours as CSS variables, so they follow the light or dark theme
 * (values in styles.css). Use them in styles; use `rarityColorsLight` where a
 * raw colour is needed or the surface is dark in both themes.
 */
export const rarityColors = Object.fromEntries(
  RARITIES.map((r) => [
    r,
    {
      dot: `var(--hs-rarity-${r}-dot)`,
      fg: `var(--hs-rarity-${r}-fg)`,
      bg: `var(--hs-rarity-${r}-bg)`,
    },
  ]),
) as Record<Rarity, RarityColors>;

/** The light-theme rarity colours as plain hex. */
export const rarityColorsLight: Record<Rarity, RarityColors> = {
  common: { dot: "#8A93A6", fg: "#4B5468", bg: "#ECEEF2" },
  uncommon: { dot: "#2F9E6E", fg: "#1E6B4A", bg: "#E3F4EC" },
  rare: { dot: "#2F7FD8", fg: "#1D5FA8", bg: "#E3EEFA" },
  epic: { dot: "#8B5CF6", fg: "#6D3FD6", bg: "#EFE9FE" },
  legendary: { dot: "#E8890C", fg: "#8F5300", bg: "#FDF0DC" },
  // Above Legendary and never in crates; label 6.6:1.
  exotic: { dot: "#D7263D", fg: "#9E1B2D", bg: "#FCE4E7" },
};

/**
 * How a stored course colour is shown. The log keeps the colour as picked; on a
 * dark surface the darker course colours are shown a step lighter (styles.css).
 * Colours without a dark step are shown as they are.
 */
export function courseColor(
  stored: string | null | undefined,
  fallback = "var(--hs-ink-disabled)",
): string {
  if (!stored) return fallback;
  if (!/^#[0-9a-f]{6}$/i.test(stored)) return stored;
  return `var(--hs-course-${stored.slice(1).toLowerCase()}, ${stored})`;
}

export const fonts = {
  display: "'Fredoka Variable', 'Fredoka', system-ui, sans-serif",
  body: "'Nunito Variable', 'Nunito', system-ui, sans-serif",
} as const;
