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

// Pack 04, Space: the 22 designs of the Space batch and the observatory
// background. Every item here uses at most three colours of its own, besides
// the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import {
  c,
  type Draw,
  HEADBAND,
  line,
  type PackDrawings,
  type Scene,
  SHINE,
  torso,
} from "./kit.ts";

const HEAD: Record<string, Draw> = {
  // Common, Space. A rocket that is also a hat.
  "rocket-hat": (ctx) => ({
    front:
      [-1, 1]
        .map((s) =>
          outlined(
            "path",
            {
              d: `M${16 * s} -2 C${24 * s} -4 ${31 * s} 2 ${32 * s} 11 L${16 * s} 9 Z`,
              fill: c(ctx, 1),
            },
            2.8,
          ),
        )
        .join("") +
      outlined(
        "path",
        { d: "M-17 6 C-17 -18 -12 -34 0 -46 C12 -34 17 -18 17 6 Z", fill: c(ctx, 0) },
        3,
      ) +
      outlined("circle", { cx: 0, cy: -20, r: 7, fill: c(ctx, 2) }, 2.6) +
      line("M-4 -23 L-2 -24", "#FFFFFF", 1.8, { opacity: 0.9 }) +
      outlined("rect", { x: -20, y: 1, width: 40, height: 9, rx: 4.5, fill: c(ctx, 1) }, 2.8) +
      SHINE("M-11 -26 C-10 -32 -7 -37 -3 -41", 0.45),
  }),

  // Uncommon, Space. A comet with a tail, caught in a headband.
  "comet-headband": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      outlined(
        "path",
        { d: "M29 -22 C22 -16 15 -11 6 -5 C16 -9 24 -14 31 -20 Z", fill: c(ctx, 2) },
        2.2,
      ) +
      outlined("circle", { cx: 35, cy: -27, r: 7, fill: c(ctx, 1) }, 2.6) +
      line("M32 -30 L34 -32", "#FFFFFF", 1.8, { opacity: 0.9 }) +
      el("path", { d: sparkle(-30, -22, 3.6), fill: c(ctx, 1) }),
  }),

  // Rare, Space. A little crescent crown with stars that twinkle.
  "moon-crown": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-42 12 L-40 -4 L-22 -14 L-9 -2 L0 -18 L9 -2 L22 -14 L40 -4 L42 12 C20 16 -20 16 -42 12 Z",
          fill: c(ctx, 0),
        },
        3,
      ) +
      line("M-34 4 C-18 9 18 9 34 4", "#FFFFFF", 2, { opacity: 0.5 }) +
      outlined("circle", { cx: -22, cy: 3, r: 3, fill: c(ctx, 2) }, 1.8) +
      outlined("circle", { cx: 22, cy: 3, r: 3, fill: c(ctx, 2) }, 1.8) +
      outlined(
        "path",
        { d: "M4 -42 C-10 -40 -12 -24 3 -21 C-4 -28 -4 -36 4 -42 Z", fill: c(ctx, 1) },
        2.2,
      ) +
      el("path", { d: sparkle(-30, -24, 4.6), fill: c(ctx, 2), style: animate("mc-twinkle", 2) }) +
      el("path", { d: sparkle(30, -26, 4), fill: c(ctx, 2), style: animate("mc-twinkle", 2, 1) }),
  }),

  // Epic, Space. A small UFO that hovers over the buddy and beams a light down.
  "ufo-hat": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      el("path", {
        d: "M-12 -9 L-27 6 L27 6 L12 -9 Z",
        fill: c(ctx, 2),
        style: animate("mc-pulse", 2.2),
      }),
      outlined("path", { d: "M-13 -17 C-13 -33 13 -33 13 -17 Z", fill: c(ctx, 1) }, 2.6),
      SHINE("M-7 -25 C-5 -28 -2 -29 1 -29", 0.9),
      outlined("ellipse", { cx: 0, cy: -16, rx: 30, ry: 7, fill: c(ctx, 0) }, 2.8),
      [-16, 0, 16]
        .map((x, i) =>
          el("circle", {
            cx: x,
            cy: -12,
            r: 2.2,
            fill: c(ctx, 2),
            style: animate("mc-twinkle", 1.6, i * 0.4),
          }),
        )
        .join(""),
    ),
  }),

  // Uncommon, Space. A bubble helmet with a glass visor, for brave study.
  "astronaut-helmet": (ctx) => ({
    front:
      line("M0 -22 L0 -33", OUTLINE, 2) +
      outlined("circle", { cx: 0, cy: -36, r: 3.6, fill: c(ctx, 2) }, 2) +
      outlined("path", { d: "M-40 10 C-40 -36 40 -36 40 10 Z", fill: c(ctx, 0) }, 3.2) +
      outlined(
        "path",
        { d: "M-26 -2 C-26 -18 26 -18 26 -2 C26 4 -26 4 -26 -2 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      SHINE("M-18 -9 C-14 -13 -8 -14 -2 -14", 0.8) +
      outlined("rect", { x: -43, y: 7, width: 86, height: 6, rx: 3, fill: c(ctx, 2) }, 2.4),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Space. A comet streaking across one cheek.
  "comet-cheek-streak": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br - 2} ${ctx.geo.by - 4}) rotate(-24)` },
      tube("M-18 0 L4 0", c(ctx, 1), 6.5, 3.2),
      outlined("circle", { cx: 6, cy: 0, r: 4.6, fill: c(ctx, 0) }, 2.2),
      line("M4 -1.5 L5.5 -3", "#FFFFFF", 1.4, { opacity: 0.9 }),
      el("path", { d: sparkle(-19, -5, 3), fill: c(ctx, 2) }),
    ),
  }),

  // Uncommon, Space. Dots on the cheeks that join up into a constellation.
  "constellation-freckles": (ctx) => {
    const side = (pts: readonly (readonly [number, number])[]): string => {
      const [a = [0, 0], b = [0, 0], d = [0, 0]] = pts;
      return (
        line(`M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${d[0]} ${d[1]}`, c(ctx, 0), 1, { opacity: 0.7 }) +
        el("circle", { cx: a[0], cy: a[1], r: 1.5, fill: c(ctx, 0) }) +
        el("path", { d: sparkle(b[0], b[1], 2.8), fill: c(ctx, 1) }) +
        el("circle", { cx: d[0], cy: d[1], r: 1.5, fill: c(ctx, 0) })
      );
    };
    const { bl, br, by } = ctx.geo;
    return {
      front:
        side([
          [bl + 6, by - 3],
          [bl + 12, by + 2],
          [bl + 8, by + 8],
        ]) +
        side([
          [br - 6, by - 3],
          [br - 12, by + 2],
          [br - 8, by + 8],
        ]),
    };
  },

  // Rare, Space. A tiny spiral galaxy on one cheek.
  "galaxy-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br - 4} ${ctx.geo.by - 3}) rotate(-12)` },
      outlined("circle", { cx: 0, cy: 0, r: 8, fill: c(ctx, 0) }, 2.2),
      line("M-5 0 C-5 -5 1 -6 3 -2 C4 1 0 3 -2 1 C-3 -1 -1 -4 2 -4", c(ctx, 1), 1.6),
      el("path", { d: sparkle(4, 4, 2.2), fill: c(ctx, 2), style: animate("mc-twinkle", 2) }),
    ),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common, Space. A scarf with a ringed planet hanging from the end.
  "planet-scarf": (ctx) => ({
    front:
      outlined("rect", { x: 12, y: 2, width: 16, height: 30, rx: 5, fill: c(ctx, 0) }, 3) +
      outlined("rect", { x: -40, y: -8, width: 80, height: 16, rx: 8, fill: c(ctx, 0) }, 3) +
      el("rect", { x: -40, y: -1.5, width: 80, height: 3, fill: c(ctx, 2) }) +
      outlined("circle", { cx: 20, cy: 24, r: 5.5, fill: c(ctx, 1) }, 2) +
      el("ellipse", {
        cx: 20,
        cy: 24,
        rx: 10,
        ry: 2.8,
        fill: "none",
        stroke: c(ctx, 2),
        "stroke-width": 2,
        transform: "rotate(-18 20 24)",
      }),
  }),

  // Common, Space. A crescent moon on a chain, over the chest.
  "moon-pendant": (ctx) => ({
    torso: torso(
      ctx,
      tube("M78 124 Q100 140 122 124", c(ctx, 2), 4.2, 1.8) +
        outlined(
          "path",
          { d: "M102 134 C84 138 82 162 102 168 C93 158 93 144 102 134 Z", fill: c(ctx, 0) },
          2.4,
        ) +
        outlined("circle", { cx: 102, cy: 133, r: 2.2, fill: c(ctx, 2) }, 1.6) +
        el("path", { d: sparkle(114, 152, 3.6), fill: c(ctx, 1) }),
    ),
  }),

  // Uncommon, Space. A vest with mission patches, real or made up.
  "astronaut-vest": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M70 124 C63 146 66 170 80 179 L120 179 C134 170 137 146 130 124 L113 124 L100 146 L87 124 Z",
          fill: c(ctx, 0),
        },
        3.4,
      ) +
        line("M100 146 L100 178", OUTLINE, 1.4, { opacity: 0.3 }) +
        outlined("circle", { cx: 84, cy: 152, r: 6, fill: c(ctx, 1) }, 1.8) +
        el("path", { d: star(84, 152, 3.6), fill: c(ctx, 2) }) +
        outlined("rect", { x: 104, y: 158, width: 17, height: 9, rx: 2, fill: c(ctx, 2) }, 1.8) +
        line("M108 163 L117 163", OUTLINE, 1.2, { opacity: 0.4 }),
    ),
  }),

  // Rare, Space. A jetpack on the back, with two flames that flicker.
  jetpack: (ctx) => {
    const flame = (x: number): string =>
      outlined(
        "path",
        {
          d: `M${x - 6} 180 C${x - 9} 188 ${x - 4} 194 ${x} 200 C${x + 4} 194 ${x + 9} 188 ${x + 6} 180 Z`,
          fill: c(ctx, 2),
        },
        1.8,
      );
    return {
      back:
        outlined("rect", { x: 54, y: 120, width: 18, height: 58, rx: 8, fill: c(ctx, 0) }, 3) +
        outlined("rect", { x: 128, y: 120, width: 18, height: 58, rx: 8, fill: c(ctx, 0) }, 3) +
        outlined("rect", { x: 57, y: 172, width: 12, height: 8, rx: 3, fill: c(ctx, 1) }, 2.2) +
        outlined("rect", { x: 131, y: 172, width: 12, height: 8, rx: 3, fill: c(ctx, 1) }, 2.2) +
        g({ style: animate("mc-twinkle", 0.7) }, flame(63), flame(137)),
    };
  },
};

const HELD: Record<string, Draw> = {
  // Common, Space. A small tin rocket to hold up.
  "toy-rocket": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-6 -6 L-6 -24 C-6 -34 0 -42 0 -42 C0 -42 6 -34 6 -24 L6 -6 Z", fill: c(ctx, 0) },
        2.4,
      ) +
      outlined("path", { d: "M-6 -10 L-13 -2 L-6 -2 Z", fill: c(ctx, 1) }, 1.8) +
      outlined("path", { d: "M6 -10 L13 -2 L6 -2 Z", fill: c(ctx, 1) }, 1.8) +
      outlined("circle", { cx: 0, cy: -23, r: 3.8, fill: c(ctx, 1) }, 1.8) +
      outlined(
        "path",
        { d: "M-3.5 -6 C-3.5 -2 0 2 0 5 C0 2 3.5 -2 3.5 -6 Z", fill: c(ctx, 2) },
        1.4,
      ) +
      line("M-3 -32 L-2 -36", "#FFFFFF", 1.8, { opacity: 0.8 }),
  }),

  // Common, Space. A lumpy moon rock with craters.
  "moon-rock": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-12 2 C-15 -8 -9 -17 1 -16 C11 -16 15 -8 13 2 C9 6 -8 6 -12 2 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      el("circle", { cx: -4, cy: -8, r: 3, fill: c(ctx, 1) }) +
      el("circle", { cx: 5, cy: -4, r: 2.2, fill: c(ctx, 1) }) +
      el("circle", { cx: 2, cy: 0, r: 1.5, fill: c(ctx, 2) }) +
      SHINE("M-8 -10 C-7 -13 -4 -14 -1 -14", 0.6),
  }),

  // Uncommon, Space. A folded star map with the constellations drawn on it.
  "star-map": (ctx) => {
    const stars: [number, number][] = [
      [-7, -23],
      [1, -19],
      [6, -27],
      [-2, -11],
      [7, -12],
    ];
    return {
      front: g(
        { transform: "rotate(-8 0 -17)" },
        outlined("rect", { x: -14, y: -30, width: 28, height: 26, rx: 3, fill: c(ctx, 0) }, 2.4),
        line("M-7 -23 L1 -19 L6 -27 M1 -19 L-2 -11 L7 -12", c(ctx, 1), 1.2),
        stars
          .map(([x = 0, y = 0]) => el("circle", { cx: x, cy: y, r: 1.7, fill: c(ctx, 1) }))
          .join(""),
        el("path", { d: star(-9, -26, 2.6), fill: c(ctx, 2) }),
      ),
    };
  },

  // Epic, Space. A satellite that blinks as it circles the buddy.

  // Rare, Space. An astronaut ice cream cone, with a visor on the scoop.
  "astronaut-ice-cream": (ctx) => ({
    front:
      outlined("path", { d: "M-10 -12 L0 14 L10 -12 Z", fill: c(ctx, 0) }, 2.4) +
      line("M-6 -7 L4 -1 M5 -7 L-3 5 M-7 -2 L-1 4", OUTLINE, 1, { opacity: 0.35 }) +
      outlined("circle", { cx: 0, cy: -16, r: 12, fill: c(ctx, 1) }, 2.6) +
      outlined(
        "path",
        { d: "M-7 -17 C-7 -24 7 -24 7 -17 C7 -14 -7 -14 -7 -17 Z", fill: c(ctx, 2) },
        1.8,
      ) +
      el("path", {
        d: sparkle(7, -4, 2.6),
        fill: c(ctx, 2),
        style: animate("mc-twinkle", 2, 0.4),
      }) +
      el("path", {
        d: sparkle(-7, -6, 2.2),
        fill: c(ctx, 2),
        style: animate("mc-twinkle", 2, 1.2),
      }),
  }),

  // Uncommon, Space. A jar of glitter from the galaxy.
  "stardust-jar": (ctx) => ({
    front:
      outlined(
        "rect",
        { x: -11, y: -20, width: 22, height: 26, rx: 7, fill: c(ctx, 0), "fill-opacity": 0.6 },
        2.6,
      ) +
      el("path", { d: sparkle(-4, -9, 3.6), fill: c(ctx, 1) }) +
      el("path", { d: sparkle(4, -1, 3), fill: c(ctx, 2) }) +
      el("path", { d: sparkle(-3, 5, 2.6), fill: c(ctx, 1) }) +
      el("path", { d: sparkle(5, 9, 2), fill: c(ctx, 2) }) +
      outlined("rect", { x: -12, y: -25, width: 24, height: 7, rx: 2.5, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-7 -14 L-7 2", 0.7),
  }),

  // Legendary, Space. A whole galaxy in the hand, turning while you focus.
};

const AURA: Record<string, Draw> = {
  // Rare, Space. Two shooting stars zip past the edges of the picture.
  "shooting-stars": (ctx) => {
    const streak = (x: number, y: number, delay: number, flip: number): string =>
      g(
        { transform: `translate(${x} ${y}) scale(${flip} 1)` },
        g(
          { style: animate("mc-fall", 2.6, delay) },
          line("M-3 -3 L-20 -15", c(ctx, 1), 2.6),
          outlined("path", { d: star(0, 0, 6), fill: c(ctx, 0) }, 1.6),
        ),
      );
    return {
      front:
        streak(36, 34, 0, 1) +
        streak(164, 40, 1.3, -1) +
        el("path", { d: sparkle(26, 104, 3), fill: c(ctx, 2), style: animate("mc-twinkle", 2) }) +
        el("path", {
          d: sparkle(176, 118, 2.8),
          fill: c(ctx, 2),
          style: animate("mc-twinkle", 2, 1),
        }),
    };
  },

  // Epic, Space. Two moons on an orbit ring, bobbing as they go round.

  // Rare, Space. Soft clouds of colour drifting in the corners of the sky.
  "nebula-mist": (ctx) => ({
    back:
      el("ellipse", {
        cx: 32,
        cy: 66,
        rx: 22,
        ry: 32,
        fill: c(ctx, 0),
        style: animate("mc-pulse", 4),
      }) +
      el("ellipse", {
        cx: 28,
        cy: 138,
        rx: 18,
        ry: 24,
        fill: c(ctx, 1),
        style: animate("mc-pulse", 4, 2),
      }) +
      el("ellipse", {
        cx: 170,
        cy: 72,
        rx: 22,
        ry: 30,
        fill: c(ctx, 1),
        style: animate("mc-pulse", 4, 1),
      }) +
      el("ellipse", {
        cx: 172,
        cy: 140,
        rx: 18,
        ry: 26,
        fill: c(ctx, 2),
        style: animate("mc-pulse", 4, 3),
      }) +
      el("path", { d: sparkle(30, 98, 3), fill: "#FFFFFF", style: animate("mc-twinkle", 2.4) }) +
      el("path", {
        d: sparkle(170, 104, 2.6),
        fill: "#FFFFFF",
        style: animate("mc-twinkle", 2.4, 1.2),
      }),
  }),
};

// Set background: muted, a few soft tones, thin lines, nothing moves.
// The middle stays calm for the buddy.
const observatory: Scene = () =>
  `<rect width="200" height="200" fill="#DCD7FB"/>
<g fill="#5B4BD6" opacity=".5"><circle cx="16" cy="20" r="1.6"/><circle cx="34" cy="48" r="1.3"/><circle cx="184" cy="22" r="1.4"/><circle cx="186" cy="62" r="1.2"/><circle cx="20" cy="92" r="1.2"/><circle cx="180" cy="104" r="1.4"/></g>
<path d="M34 16 C22 20 20 38 34 42 C27 34 27 24 34 16 Z" fill="#FFF7E3" stroke="#5B4BD6" stroke-width="1.4"/>
<g stroke="#5B4BD6" stroke-width="1.6" fill="none"><ellipse cx="170" cy="40" rx="17" ry="4" transform="rotate(-14 170 40)"/></g>
<circle cx="170" cy="40" r="9" fill="#F3C98B" stroke="#5B4BD6" stroke-width="1.6"/>
<rect y="176" width="200" height="24" fill="#B9A8F5"/>
<rect x="6" y="140" width="40" height="36" fill="#B9A8F5" stroke="#5B4BD6" stroke-width="2"/>
<path d="M4 142 C4 120 48 120 48 142 Z" fill="#B9A8F5" stroke="#5B4BD6" stroke-width="2"/>
<path d="M26 121 L26 140" stroke="#5B4BD6" stroke-width="1.6"/>
<path d="M26 128 L44 104" stroke="#5B4BD6" stroke-width="4" stroke-linecap="round"/>
<circle cx="44" cy="104" r="2.5" fill="#5B4BD6"/>
<rect x="18" y="156" width="12" height="20" rx="2" fill="#DCD7FB" stroke="#5B4BD6" stroke-width="1.4"/>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { observatory },
};
