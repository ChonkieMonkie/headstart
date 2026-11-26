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

// Pack 14, winter: a theme batch with no set and no background. Snow, ice and
// cold-weather kit. Each item uses at most three colours of its own, besides
// the shared outline, white and the neutral greys.

import { animate, el, g, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import {
  BODY,
  c,
  type Draw,
  eyesOf,
  HEADBAND,
  line,
  type PackDrawings,
  SHINE,
  torso,
} from "./kit.ts";

const n = (v: number): number => Math.round(v * 100) / 100;

/** A six-armed snowflake centred on (x, y) with arm length r, as one path. */
function flake(x: number, y: number, r: number): string {
  let d = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 - Math.PI / 2;
    d += `M${n(x)} ${n(y)} L${n(x + r * Math.cos(a))} ${n(y + r * Math.sin(a))} `;
    const bx = x + r * 0.55 * Math.cos(a);
    const by = y + r * 0.55 * Math.sin(a);
    for (const side of [-1, 1]) {
      const b = a + (side * Math.PI) / 4;
      d += `M${n(bx)} ${n(by)} L${n(bx + r * 0.32 * Math.cos(b))} ${n(by + r * 0.32 * Math.sin(b))} `;
    }
  }
  return d.trim();
}

// ─── Head ──────────────────────────────────────────────────────────────────

const HEAD: Record<string, Draw> = {
  // Common, Winter. A hood with a fluffy trim all the way round.
  "fur-hood": (ctx) => ({
    front:
      outlined("path", { d: "M-39 10 C-41 -32 41 -32 39 10 Z", fill: c(ctx, 0) }, 3.2) +
      SHINE("M-22 -20 C-16 -26 -6 -28 2 -28", 0.3) +
      [-36, -24, -12, 0, 12, 24, 36]
        .map((x) => outlined("circle", { cx: x, cy: 8, r: 6, fill: c(ctx, 1) }, 2))
        .join(""),
  }),

  // Common, Winter. A snowflake hairclip above the ear.
  "snowflake-clip": (ctx) => ({
    front: g(
      { transform: "translate(28 8)" },
      tube(flake(0, 0, 11), c(ctx, 0), 5.6, 2.8),
      outlined("circle", { cx: 0, cy: 0, r: 3, fill: c(ctx, 1) }, 1.6),
    ),
  }),

  // Uncommon, Winter. A tall hat with a band, a snowman's favourite.
  "snowman-hat": (ctx) => ({
    front:
      outlined("rect", { x: -20, y: -40, width: 40, height: 38, rx: 4, fill: c(ctx, 0) }, 3) +
      outlined("rect", { x: -20.5, y: -18, width: 41, height: 8, rx: 2, fill: c(ctx, 1) }, 2) +
      SHINE("M-12 -33 L-12 -22", 0.35) +
      outlined("ellipse", { cx: 0, cy: 0, rx: 30, ry: 6.5, fill: c(ctx, 0) }, 3),
  }),

  // Uncommon, Winter. Antlers on a band, with the band in a second colour.
  "reindeer-antlers": (ctx) => {
    const side = (s: number): string =>
      tube(`M${12 * s} -2 C${16 * s} -14 ${14 * s} -24 ${22 * s} -38`, c(ctx, 0), 7, 3.8) +
      tube(`M${15 * s} -15 C${22 * s} -17 ${26 * s} -22 ${28 * s} -28`, c(ctx, 0), 6, 3.2) +
      tube(`M${18 * s} -25 C${21 * s} -27 ${24 * s} -30 ${25 * s} -35`, c(ctx, 0), 5, 2.6);
    return { front: side(-1) + side(1) + tube(HEADBAND, c(ctx, 1), 11, 7.5) };
  },

  // Rare, Winter. A crown of ice with a gem that twinkles.
  "ice-crown": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-25 4 L-25 -12 L-14 -3 L-6 -22 L0 -8 L6 -22 L14 -3 L25 -12 L25 4 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      SHINE("M-19 -2 L-19 -5", 0.6) +
      g(
        { style: animate("mc-twinkle", 2) },
        outlined("circle", { cx: 0, cy: -2, r: 3.4, fill: c(ctx, 1) }, 1.6),
      ),
  }),

  // Epic, Winter. A knitted hat with icicles that sway along the brim.
  "icicle-hat": (ctx) => ({
    front:
      outlined("path", { d: "M-39 8 C-39 -34 39 -34 39 8 Z", fill: c(ctx, 0) }, 3.2) +
      SHINE("M-22 -18 C-16 -25 -6 -27 2 -27", 0.35) +
      outlined("rect", { x: -40, y: 0, width: 80, height: 10, rx: 5, fill: c(ctx, 0) }, 3) +
      g(
        { style: `transform-origin: 0px 8px; ${animate("mc-sway", 3)}` },
        [-30, -15, 0, 15, 30]
          .map((x, i) =>
            outlined(
              "path",
              { d: `M${x - 5} 8 L${x + 5} 8 L${x} ${18 + (i % 2) * 6} Z`, fill: c(ctx, 1) },
              1.8,
            ),
          )
          .join(""),
      ),
  }),
};

// ─── Face ──────────────────────────────────────────────────────────────────

const FACE: Record<string, Draw> = {
  // Uncommon, Winter. A little frost flake on each cheek.
  "frosty-cheeks": (ctx) => {
    const frost = (x: number, y: number): string =>
      outlined("path", { d: sparkle(x, y, 4.6), fill: c(ctx, 0) }, 1.2) +
      outlined("circle", { cx: x + 7, cy: y - 5, r: 1.8, fill: c(ctx, 1) }, 0.9);
    const { bl, br, by } = ctx.geo;
    return { front: frost(bl, by) + frost(br, by) };
  },

  // Rare, Winter. Goggles with tinted lenses that flash in the sun.
  "ski-goggles": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const lens = (x: number): string =>
      outlined("circle", { cx: x, cy: y, r: 13, fill: c(ctx, 0) }, 2.4) +
      el("circle", { cx: x, cy: y, r: 9.5, fill: c(ctx, 1), "fill-opacity": 0.55 }) +
      g(
        { style: animate("mc-twinkle", 2.4, x > 100 ? 1 : 0) },
        SHINE(`M${x - 5} ${y - 4} L${x - 2} ${y - 6.5}`, 0.9),
      );
    return {
      front:
        tube(`M${x1 + 12} ${y - 2} L${x2 - 12} ${y - 2}`, c(ctx, 0), 4.6, 2.2) +
        lens(x1) +
        lens(x2),
    };
  },
};

// ─── Outfit ────────────────────────────────────────────────────────────────

const OUTFIT: Record<string, Draw> = {
  // Common, Winter. A puffed jacket with baffles, a zip and a high collar.
  "puffer-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        line("M68 138 L132 138 M66 156 L134 156 M68 170 L132 170", OUTLINE, 1.6, {
          opacity: 0.25,
        }) +
        line("M100 132 L100 180", c(ctx, 1), 2.4) +
        outlined(
          "path",
          {
            d: "M82 124 C86 114 114 114 118 124 L122 134 C110 140 90 140 78 134 Z",
            fill: c(ctx, 1),
          },
          2.6,
        ),
    ),
  }),

  // Uncommon, Winter. A knitted jumper with snowflakes across the front.
  "snowflake-jumper": (ctx) => {
    const flakes: [number, number][] = [
      [84, 148],
      [100, 160],
      [116, 148],
      [84, 172],
      [116, 172],
    ];
    return {
      torso: torso(
        ctx,
        outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
          outlined(
            "path",
            {
              d: "M80 122 C88 130 112 130 120 122 L122 129 C112 137 88 137 78 129 Z",
              fill: c(ctx, 1),
            },
            2.4,
          ) +
          flakes.map(([x = 0, y = 0]) => tube(flake(x, y, 6), c(ctx, 1), 3.4, 1.6)).join(""),
      ),
    };
  },
};

// ─── Held ──────────────────────────────────────────────────────────────────

const HELD: Record<string, Draw> = {
  // Common, Winter. A round snowball with a few flecks of snow.
  snowball: (ctx) => {
    const flecks: [number, number, number][] = [
      [-4, 2, 1.8],
      [5, 4, 1.5],
      [2, -6, 1.3],
    ];
    return {
      front:
        outlined("circle", { cx: 0, cy: -2, r: 12, fill: c(ctx, 0) }, 2.6) +
        SHINE("M-7 -9 C-5 -12 -2 -13 1 -13", 0.7) +
        flecks
          .map(([x = 0, y = 0, r = 0]) => el("circle", { cx: x, cy: y, r, fill: c(ctx, 1) }))
          .join(""),
    };
  },

  // Common, Winter. One knitted mitten on a cord, with a cuff.
  mitten: (ctx) => ({
    front:
      outlined(
        "ellipse",
        { cx: 9, cy: 3, rx: 4.5, ry: 6, fill: c(ctx, 0), transform: "rotate(-20 9 3)" },
        2.4,
      ) +
      outlined(
        "path",
        { d: "M-9 -6 C-10 2 -10 8 -8 13 C-6 17 6 17 8 13 C10 8 10 2 9 -6 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      line("M-5 4 L5 4 M-5 9 L5 9", OUTLINE, 1.2, { opacity: 0.3 }) +
      outlined("rect", { x: -11, y: -12, width: 22, height: 7, rx: 3, fill: c(ctx, 1) }, 2.2),
  }),

  // Common, Winter. A little skate boot on a keyring.
  "skate-keyring": (ctx) => ({
    front:
      el("circle", {
        cx: 0,
        cy: -17,
        r: 3.8,
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 2.4,
      }) +
      line("M0 -13 L0 -9", OUTLINE, 1.8) +
      outlined(
        "path",
        { d: "M-6 -9 L6 -9 L7 4 C7 7 5 8 3 8 L-6 8 C-8 8 -8 6 -7 2 Z", fill: c(ctx, 0) },
        2.4,
      ) +
      line("M-4 -3 L4 -3", "#FFFFFF", 1.4) +
      outlined(
        "path",
        { d: "M-10 9 L11 9 C13 9 13 12 11 13 L-9 13 C-11 13 -11 10 -10 9 Z", fill: "#9AA3B5" },
        1.8,
      ),
  }),

  // Uncommon, Winter. A tiny snowman friend with a hat and a scarf.
  "little-snowman": (ctx) => ({
    front:
      outlined("circle", { cx: 0, cy: 8, r: 9, fill: "#FFFFFF" }, 2.4) +
      outlined("circle", { cx: 0, cy: -4, r: 7, fill: "#FFFFFF" }, 2.2) +
      outlined("circle", { cx: 0, cy: -14, r: 5.2, fill: "#FFFFFF" }, 2) +
      outlined("rect", { x: -5.5, y: -25, width: 11, height: 8, rx: 1.5, fill: c(ctx, 0) }, 1.8) +
      outlined("rect", { x: -8.5, y: -18.5, width: 17, height: 3, rx: 1.2, fill: c(ctx, 0) }, 1.6) +
      outlined("path", { d: "M-6 -9 L6 -9 L6 -5.5 L-6 -5.5 Z", fill: c(ctx, 1) }, 1.4) +
      el("circle", { cx: -2, cy: -12, r: 1, fill: OUTLINE }) +
      el("circle", { cx: 2, cy: -12, r: 1, fill: OUTLINE }),
  }),

  // Uncommon, Winter. A small shovel held by its grip.
  "snow-shovel": (ctx) => ({
    front:
      tube("M0 -22 L0 2", c(ctx, 1), 4.4, 2.2) +
      outlined("path", { d: "M-8 2 L8 2 L9 12 C9 16 -9 16 -9 12 Z", fill: c(ctx, 0) }, 2.6) +
      SHINE("M-4 7 C-4 9 -3 11 -1 12", 0.5) +
      outlined("circle", { cx: 0, cy: -22, r: 3.2, fill: c(ctx, 0) }, 1.8),
  }),

  // Rare, Winter. A tiny red sled on a cord, swaying as you walk.
  "mini-sled": (ctx) => ({
    front: g(
      { style: `transform-origin: 0px 0px; ${animate("mc-sway", 3)}` },
      tube("M0 0 L0 6", c(ctx, 1), 3.6, 1.8),
      outlined(
        "path",
        {
          d: "M-15 6 L15 6 L15 13 C15 16 13 17 10 17 L-10 17 C-13 17 -15 16 -15 13 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ),
      line("M-9 11 L9 11", "#FFFFFF", 1.8, { opacity: 0.6 }),
      outlined(
        "path",
        { d: "M-18 21 C-8 25 8 25 18 21 L16 25 C8 28 -8 28 -16 25 Z", fill: "#9AA3B5" },
        1.8,
      ),
    ),
  }),

  // Rare, Winter. A pair of figure skates tied together, swaying gently.
  "figure-skates": (ctx) => {
    const skate = (x: number): string =>
      tube(`M${x - 7} 18 L${x + 7} 18`, "#9AA3B5", 4.4, 2) +
      outlined("rect", { x: x - 5, y: -2, width: 10, height: 18, rx: 4, fill: c(ctx, 0) }, 2.4);
    return {
      front: g(
        { style: `transform-origin: 0px 0px; ${animate("mc-sway", 3.4)}` },
        tube("M-8 -2 Q0 -6 8 -2", c(ctx, 1), 3.4, 1.5) + skate(-8) + skate(8),
      ),
    };
  },

  // Epic, Winter. A wand with a snowflake on the tip that twinkles.
  "snowflake-wand": (ctx) => ({
    front:
      tube("M0 0 L0 -30", c(ctx, 0), 5.2, 2.6) +
      g({ style: animate("mc-twinkle", 2) }, tube(flake(0, -41, 11), c(ctx, 1), 5.6, 2.8)) +
      outlined("path", { d: sparkle(-16, -56, 4), fill: c(ctx, 1) }, 1.2) +
      g(
        { style: animate("mc-twinkle", 2.2, 1) },
        outlined("path", { d: sparkle(17, -30, 3.2), fill: c(ctx, 1) }, 1.2),
      ),
  }),
};

// ─── Aura ──────────────────────────────────────────────────────────────────

const AURA: Record<string, Draw> = {
  // Rare, Winter. Sparkles that twinkle around the edges.
  "frost-sparkle": (ctx) => {
    const spots: [number, number, number, number][] = [
      [30, 70, 8, 0],
      [176, 88, 7, 0.8],
      [58, 30, 6, 1.6],
      [150, 30, 6, 2.4],
      [22, 100, 6, 1.2],
      [180, 150, 8, 0.4],
    ];
    return {
      front: spots
        .map(([x = 0, y = 0, s = 0, d = 0]) =>
          g(
            { style: animate("mc-twinkle", 2.6, d) },
            outlined("path", { d: sparkle(x, y, s), fill: c(ctx, 0) }, 1.2) +
              el("circle", { cx: x, cy: y, r: 1.6, fill: c(ctx, 1) }),
          ),
        )
        .join(""),
    };
  },

  // Rare, Winter. Ice crystals that bob gently around you.
  "ice-crystals": (ctx) => {
    const crystals: [number, number, number, number][] = [
      [30, 122, 15, 0],
      [172, 118, -18, 1.1],
      [44, 172, 8, 2],
      [160, 170, -10, 0.6],
    ];
    return {
      front: crystals
        .map(([x = 0, y = 0, rot = 0, d = 0]) =>
          g(
            { transform: `translate(${x} ${y}) rotate(${rot})` },
            g(
              { style: animate("mc-bob", 3.4, d) },
              outlined(
                "path",
                { d: "M0 -11 L6 -4 L6 5 L0 11 L-6 5 L-6 -4 Z", fill: c(ctx, 0) },
                1.8,
              ) + line("M0 -11 L0 11 M-6 -4 L6 -4", c(ctx, 1), 1.2),
            ),
          ),
        )
        .join(""),
    };
  },

  // Legendary, Winter. Ribbons of northern lights that wave behind you.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
