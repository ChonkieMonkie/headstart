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

// The crates, drawn as SVG strings (viewBox 0 0 140 112). Every crate shares
// the Study Crate's box, outline and shadow and has three colours of its own.

import type { CrateType } from "@headstart/content";

const O = "#2A1F2D";
const shadow = (opacity: number) =>
  `<ellipse cx="70" cy="104" rx="52" ry="5" fill="#1B2236" opacity="${opacity}"/>`;
const wrap = (inner: string, label: string, opacity = 0.18): string =>
  `<svg viewBox="0 0 140 112" width="100%" height="100%" role="img" aria-label="${label}">${shadow(opacity)}<g stroke="${O}" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;
const shine = (d: string, o = 0.6): string =>
  `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="2.6" opacity="${o}"/>`;

export const STUDY = { wood: "#C08A52", dark: "#8E6136", plate: "#F4E3C3" };
export const GIFT = { teal: "#2A9D8F", light: "#8FD6CB", gold: "#F5C542" };
export const CHEST = { blue: "#3E5BA8", gold: "#F5C542", flame: "#F28A3A" };
export const VAULT = { steel: "#9AA3B5", light: "#D5DAE5", purple: "#8B5CF6" };
export const CAPSULE = { cream: "#F6E7D8", navy: "#2E3A6B", gold: "#F5C542" };

const FLAME = (x: number, y: number, s: number, fill: string, lit = true): string =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -9 C5 -4 8 0 6 5 C5 9 -5 9 -6 5 C-7 1 -3 -1 -2 -5 C-1 -2 0 -2 0 -9 Z" fill="${lit ? fill : "none"}" stroke-width="${lit ? 1.8 / s : 1.4 / s}" ${lit ? "" : `stroke-dasharray="${2.4 / s} ${2.4 / s}" opacity="0.45"`}/>`;

function study(o?: number): string {
  const c = STUDY;
  return wrap(
    `<rect x="22" y="36" width="96" height="64" rx="4" fill="${c.wood}" stroke-width="3"/>
    <path d="M22 57 L118 57 M22 78 L118 78" fill="none" stroke="${c.dark}" stroke-width="2.5"/>
    <polygon points="26,96 34,96 114,42 114,40 106,40 26,94" fill="#A9763F" stroke-width="2.4"/>
    <g class="lid"><rect x="16" y="28" width="108" height="13" rx="3" fill="#D29C62" stroke-width="3"/>
    ${shine("M30 32 L58 32", 0.5)}</g>
    <rect x="50" y="60" width="40" height="16" rx="3" fill="${c.plate}" stroke-width="2.4"/>
    <path d="M59 68 L81 68" fill="none" stroke="${c.dark}" stroke-width="2.4"/>
    <g fill="#5E4630" stroke="none"><circle cx="28" cy="46" r="2"/><circle cx="112" cy="46" r="2"/><circle cx="28" cy="90" r="2"/><circle cx="112" cy="90" r="2"/></g>`,
    "Study Crate: a wooden crate with a label plate",
    o,
  );
}

function giftBox(o?: number): string {
  const c = GIFT;
  const dots = [
    [36, 58],
    [50, 70],
    [36, 84],
    [50, 94],
    [90, 58],
    [104, 70],
    [90, 84],
    [104, 94],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`)
    .join("");
  return wrap(
    `<rect x="26" y="46" width="88" height="54" rx="4" fill="${c.teal}" stroke-width="3"/>
    <g fill="${c.light}" stroke="none">${dots}</g>
    <rect x="62" y="46" width="16" height="54" fill="${c.gold}" stroke-width="2.4"/>
    <g class="lid"><rect x="20" y="34" width="100" height="16" rx="3" fill="${c.light}" stroke-width="3"/>
    <rect x="62" y="34" width="16" height="16" fill="${c.gold}" stroke-width="2.4"/>
    ${shine("M28 39 L54 39", 0.7)}
    <path d="M70 32 C58 12 38 16 45 29 C49 36 62 35 70 32 Z" fill="${c.gold}" stroke-width="2.6"/>
    <path d="M70 32 C82 12 102 16 95 29 C91 36 78 35 70 32 Z" fill="${c.gold}" stroke-width="2.6"/>
    <path d="M52 25 C56 27 60 29 64 31 M88 25 C84 27 80 29 76 31" fill="none" stroke="${O}" stroke-width="1.6" opacity="0.35"/>
    <rect x="63" y="26" width="14" height="11" rx="4" fill="${c.gold}" stroke-width="2.6"/></g>`,
    "Weekly Gift: a gift box with a golden bow",
    o,
  );
}

function chestFlames(lit: number, o?: number): string {
  const c = CHEST;
  return wrap(
    `<rect x="18" y="52" width="104" height="48" rx="5" fill="${c.blue}" stroke-width="3"/>
    <g class="lid"><path d="M58 26 L58 33 M82 26 L82 33" fill="none" stroke="${O}" stroke-width="2.4"/>
    <rect x="55" y="22" width="30" height="7" rx="3.5" fill="${c.gold}" stroke-width="2.4"/>
    <rect x="14" y="32" width="112" height="22" rx="5" fill="${c.blue}" stroke-width="3"/>
    ${shine("M24 38 L70 38", 0.45)}
    <rect x="14" y="49" width="112" height="7" rx="3" fill="${c.gold}" stroke-width="2.6"/></g>
    <path d="M18 92 L18 100 L28 100 Z M122 92 L122 100 L112 100 Z" fill="${c.gold}" stroke-width="2"/>
    ${[37, 59, 81, 103].map((x, i) => FLAME(x, 78, 1.25, c.flame, i < lit)).join("")}`,
    `Streak Chest: a chest with four flames, ${lit} lit`,
    o,
  );
}

function vaultSafe(o?: number): string {
  const c = VAULT;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const x1 = 66 + Math.cos(a) * 14,
      y1 = 62 + Math.sin(a) * 14;
    const x2 = 66 + Math.cos(a) * 17,
      y2 = 62 + Math.sin(a) * 17;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }).join(" ");
  return wrap(
    `<rect x="30" y="96" width="14" height="8" rx="2" fill="${c.steel}" stroke-width="2.4"/>
    <rect x="96" y="96" width="14" height="8" rx="2" fill="${c.steel}" stroke-width="2.4"/>
    <rect x="22" y="22" width="96" height="78" rx="10" fill="${c.steel}" stroke-width="3"/>
    ${shine("M32 27 L62 27", 0.55)}
    <rect x="30" y="30" width="80" height="62" rx="6" fill="#5A6378" stroke-width="2.6"/>
    <g class="door"><rect x="30" y="30" width="80" height="62" rx="6" fill="${c.light}" stroke-width="2.6"/>
    <rect x="25" y="40" width="7" height="11" rx="2" fill="${c.steel}" stroke-width="2"/>
    <rect x="25" y="72" width="7" height="11" rx="2" fill="${c.steel}" stroke-width="2"/>
    <g class="dial"><circle cx="66" cy="62" r="20" fill="${c.purple}" stroke-width="3"/>
    <path d="${ticks}" fill="none" stroke="#FFFFFF" stroke-width="1.8" opacity="0.8"/>
    <circle cx="66" cy="62" r="7" fill="${c.light}" stroke-width="2.4"/></g>
    <path d="M66 39 L62.5 34 L69.5 34 Z" fill="${c.purple}" stroke-width="1.8"/>
    <path d="M98 50 L98 74" fill="none" stroke="${O}" stroke-width="7"/>
    <path d="M98 50 L98 74" fill="none" stroke="${c.steel}" stroke-width="3.4"/></g>`,
    "Milestone Vault: a steel safe with a purple dial",
    o,
  );
}

function capsule(o?: number): string {
  const c = CAPSULE;
  return wrap(
    `<path d="M70 50 L42 50 A24 24 0 0 0 42 98 L70 98 Z" fill="${c.cream}" stroke="none"/>
    <path d="M70 50 L98 50 A24 24 0 0 1 98 98 L70 98 Z" fill="${c.navy}" stroke="none"/>
    <rect x="18" y="50" width="104" height="48" rx="24" fill="none" stroke-width="3"/>
    <path d="M70 50 L70 98" fill="none" stroke-width="2.6"/>
    ${shine("M32 62 C36 57 42 55 48 55", 0.8)}
    <path d="M52 34 L52 44 C60 49 80 49 88 44 L88 34" fill="${c.navy}" stroke-width="2.6"/>
    <path d="M70 18 L106 30 L70 42 L34 30 Z" fill="${c.navy}" stroke-width="2.6"/>
    <path d="M70 30 L100 34 L100 44" fill="none" stroke="${c.gold}" stroke-width="2.4"/>
    <rect x="97" y="43" width="6" height="7" rx="2" fill="${c.gold}" stroke-width="1.8"/>
    <circle cx="70" cy="30" r="2.6" fill="${c.gold}" stroke-width="1.6"/>`,
    "Exam Capsule: a round capsule with a graduation cap",
    o,
  );
}

/** The SVG of a crate. `flames` is how many of the Streak Chest's four flames are lit. */
export function crateSvg(
  type: CrateType,
  options: { flames?: number; shadow?: number } = {},
): string {
  const o = options.shadow;
  switch (type) {
    case "weekly":
      return giftBox(o);
    case "streak":
      return chestFlames(options.flames ?? 4, o);
    case "milestone":
      return vaultSafe(o);
    case "exam":
      return capsule(o);
    default:
      return study(o);
  }
}

/** What each crate is called and how it is earned. */
export const CRATE_INFO: Record<
  CrateType,
  { name: string; earned: string; tint: string; glow: string }
> = {
  study: {
    name: "Study Crate",
    earned: "Earned for 3 focus sessions",
    tint: "#F4EEE4",
    glow: "#D29C62",
  },
  weekly: {
    name: "Weekly Gift",
    earned: "Earned for reaching your weekly goal",
    tint: "#E3F2F0",
    glow: "#5CC2B4",
  },
  streak: {
    name: "Streak Chest",
    earned: "Earned for 4 weeks in a row",
    tint: "#E6EBFB",
    glow: "#F28A3A",
  },
  milestone: {
    name: "Milestone Vault",
    earned: "Earned for a milestone plaque",
    tint: "#ECEAF6",
    glow: "#8B5CF6",
  },
  exam: {
    name: "Exam Capsule",
    earned: "Earned for an exam period with the reviews done",
    tint: "#F1EEE8",
    glow: "#F5C542",
  },
};
