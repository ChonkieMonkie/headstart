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

// Pack 07, the rainy day set: hats for wet walks, a poncho, an umbrella on
// the hand, a rainbow with the sun peeking out, and a rainy window behind.
// Every item here uses at most three colours of its own, besides the shared
// outline and white shine.

import { animate, el, g, OUTLINE, outlined, tube } from "../svg.ts";
import {
  BODY,
  blob,
  c,
  type Draw,
  eyesOf,
  line,
  type PackDrawings,
  type Scene,
  SHINE,
  torso,
} from "./kit.ts";

/** A teardrop: its tip is at y - 1.5s and its round end at y + s. */
const drop = (x: number, y: number, s: number): string =>
  `M${x} ${y - 1.5 * s} C${x + s} ${y - 0.2 * s} ${x + s} ${y + s} ${x} ${y + s} C${x - s} ${y + s} ${x - s} ${y - 0.2 * s} ${x} ${y - 1.5 * s} Z`;

/** The top half of a circle of radius r, centred on (100, 170). */
const arc = (r: number): string => `M${100 - r} 170 A${r} ${r} 0 0 1 ${100 + r} 170`;

/** One rainbow band with its own outline. Draw the outer band first. */
const band = (r: number, width: number, color: string): string =>
  el("path", { d: arc(r), fill: "none", stroke: OUTLINE, "stroke-width": width + 3 }) +
  el("path", { d: arc(r), fill: "none", stroke: color, "stroke-width": width });

const CANOPY_OPEN =
  "M-42 4 C-42 -40 42 -40 42 4 Q35 12 28 4 Q21 12 14 4 Q7 12 0 4 Q-7 12 -14 4 Q-21 12 -28 4 Q-35 12 -42 4 Z";
const CANOPY_PANEL = "M-14 4 C-16 -10 -6 -22 0 -26 C6 -22 16 -10 14 4 Q7 12 0 4 Q-7 12 -14 4 Z";
const CANOPY_CLOSED = "M-9 10 C-9 -2 9 -2 9 10 C9 16 4 22 0 24 C-4 22 -9 16 -9 10 Z";

const HEAD: Record<string, Draw> = {
  // Common, Rainy day. A sou'wester with a long brim and a band.
  souwester: (ctx) => ({
    front:
      outlined("path", { d: "M-30 4 C-32 -40 32 -40 30 4 Z", fill: c(ctx, 0) }, 3.2) +
      outlined(
        "path",
        {
          d: "M-44 4 C-42 -6 -34 -6 0 -6 C34 -6 42 -6 44 4 C40 14 -40 14 -44 4 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
      line("M-40 5 C-20 11 20 11 40 5", c(ctx, 1), 3.2) +
      SHINE("M-18 -14 C-15 -22 -9 -25 -3 -25", 0.45),
  }),

  // Common, Rainy day. A shower cap with a scalloped edge and dots.
  "polka-bonnet": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-38 6 C-40 -36 40 -36 38 6 Q30 14 22 6 Q14 14 6 6 Q-2 14 -10 6 Q-18 14 -26 6 Q-32 14 -38 6 Z",
          fill: c(ctx, 0),
        },
        3,
      ) +
      [
        [-20, -10],
        [0, -18],
        [20, -10],
        [-6, 0],
      ]
        .map(([x = 0, y = 0]) => el("circle", { cx: x, cy: y, r: 3.4, fill: c(ctx, 1) }))
        .join("") +
      SHINE("M-24 -12 C-22 -20 -14 -24 -6 -24", 0.5),
  }),

  // Uncommon, Rainy day. A little cloud clip on the side, with two drops.
  "cloud-clip": (ctx) => ({
    front: g(
      { transform: "translate(0 14)" },
      blob(
        [
          [30, -4, 7],
          [37, -9, 8],
          [44, -3, 6],
          [37, 1, 6],
        ],
        c(ctx, 0),
        1.6,
      ) +
        outlined("path", { d: drop(30, 12, 3.2), fill: c(ctx, 1) }, 1.4) +
        outlined("path", { d: drop(40, 15, 2.6), fill: c(ctx, 1) }, 1.4),
    ),
  }),

  // Rare, Rainy day. An open umbrella that rests on the head and sways.
  "umbrella-hat": (ctx) => ({
    front: g(
      {
        style: `transform-box: fill-box; transform-origin: center bottom; ${animate("mc-sway", 4)}`,
      },
      outlined("path", { d: CANOPY_OPEN, fill: c(ctx, 0) }, 3) +
        outlined("path", { d: CANOPY_PANEL, fill: c(ctx, 1) }, 1.4) +
        outlined("circle", { cx: 0, cy: -30, r: 2.6, fill: c(ctx, 2) }, 1.4) +
        SHINE("M-30 -8 C-28 -16 -22 -22 -14 -24", 0.5),
    ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Rainy day. A raindrop sticker on one cheek.
  "raindrop-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br + 2} ${ctx.geo.by - 1}) rotate(-12)` },
      outlined("path", { d: drop(0, 0, 7), fill: c(ctx, 0) }, 2.2),
      el("circle", { cx: 0, cy: 2, r: 2.2, fill: c(ctx, 1) }),
      line("M-3 -2 L-1 -4", "#FFFFFF", 1.6, { opacity: 0.9 }),
    ),
  }),

  // Uncommon, Rainy day. Fogged round goggles with a strap.
  "fogged-goggles": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const lens = (x: number): string =>
      el("circle", { cx: x, cy: y, r: 12, fill: c(ctx, 1), "fill-opacity": 0.55 }) +
      el("circle", { cx: x, cy: y, r: 12, fill: "none", stroke: OUTLINE, "stroke-width": 6 }) +
      el("circle", { cx: x, cy: y, r: 12, fill: "none", stroke: c(ctx, 0), "stroke-width": 3 }) +
      el("ellipse", { cx: x, cy: y - 4, rx: 7, ry: 3.4, fill: "#FFFFFF", opacity: 0.5 });
    return {
      front:
        lens(x1) +
        lens(x2) +
        tube(
          `M${x1 + 12} ${y - 2} Q${(x1 + x2) / 2} ${y - 6} ${x2 - 12} ${y - 2}`,
          c(ctx, 0),
          5.5,
          2.6,
        ) +
        tube(`M${x1 - 12} ${y - 2} L${x1 - 24} ${y - 4}`, c(ctx, 0), 4.6, 2) +
        tube(`M${x2 + 12} ${y - 2} L${x2 + 24} ${y - 4}`, c(ctx, 0), 4.6, 2),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Rainy day. A hooded poncho that falls over the shoulders.
  "rain-poncho": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M76 116 C88 128 112 128 124 116 C136 124 144 140 144 180 L56 180 C56 140 64 124 76 116 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
        outlined(
          "path",
          { d: "M80 118 C78 100 122 100 120 118 C112 124 88 124 80 118 Z", fill: c(ctx, 1) },
          2.6,
        ) +
        line("M100 132 L100 176", OUTLINE, 1.6, { opacity: 0.25 }) +
        line("M60 176 Q70 170 80 176 T100 176 T120 176 T140 176", OUTLINE, 1.6, { opacity: 0.3 }),
    ),
  }),

  // Uncommon, Rainy day. A knitted jumper with a raindrop print.
  "drop-jumper": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M84 124 Q100 136 116 124", OUTLINE, 2.4, { opacity: 0.4 }) +
        line("M70 168 L130 168", OUTLINE, 1.6, { opacity: 0.25 }) +
        [
          [80, 140],
          [100, 150],
          [120, 138],
          [90, 164],
          [112, 166],
        ]
          .map(([x = 0, y = 0]) => el("path", { d: drop(x, y, 3.4), fill: c(ctx, 1) }))
          .join(""),
    ),
  }),

  // Rare, Rainy day. A glass raindrop on a cord that sways when you nod.
  "raindrop-pendant": (ctx) => ({
    front: g(
      {
        style: `transform-box: fill-box; transform-origin: center top; ${animate("mc-sway", 3.5)}`,
      },
      line("M-14 -6 Q0 8 14 -6", OUTLINE, 1.8) +
        outlined("path", { d: drop(0, 12, 8), fill: c(ctx, 0) }, 2.4) +
        outlined("circle", { cx: 0, cy: 1, r: 2.2, fill: c(ctx, 1) }, 1.4) +
        SHINE("M-3 14 C-3 10 -1 8 1 7", 0.8),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Rainy day. A closed umbrella hanging from the hand.
  umbrella: (ctx) => ({
    front:
      tube("M0 -4 L0 36", c(ctx, 1), 3.6, 1.8) +
      outlined("path", { d: CANOPY_CLOSED, fill: c(ctx, 0) }, 2.4) +
      line("M-7 10 L7 10", c(ctx, 1), 2.2) +
      SHINE("M-5 4 C-4 1 -2 0 1 0", 0.6),
  }),

  // Common, Rainy day. A bowl of hot soup with steam.
  "soup-bowl": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-14 2 L14 2 C14 12 8 16 0 16 C-8 16 -14 12 -14 2 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      outlined("ellipse", { cx: 0, cy: 2, rx: 12, ry: 3, fill: c(ctx, 1) }, 1.8) +
      line("M-5 -3 C-8 -7 -2 -9 -5 -14 M3 -3 C0 -7 6 -9 3 -14", "#9AA3B5", 1.8, { opacity: 0.9 }) +
      SHINE("M-9 8 C-9 11 -7 12 -4 12", 0.6),
  }),

  // Uncommon, Rainy day. Wellies hanging by their straps.
  wellies: (ctx) => {
    const boot = (dx: number): string =>
      outlined(
        "path",
        {
          d: `M${dx - 5} 2 L${dx + 5} 2 L${dx + 5} 18 C${dx + 5} 22 ${dx + 10} 22 ${dx + 11} 25 C${dx + 12} 28 ${dx + 9} 29 ${dx + 7} 29 L${dx - 5} 29 Z`,
          fill: c(ctx, 0),
        },
        2.4,
      ) +
      el("path", { d: `M${dx - 5} 2 L${dx + 5} 2 L${dx + 5} 7 L${dx - 5} 7 Z`, fill: c(ctx, 1) });
    return {
      front: tube("M-9 2 Q-2 -10 5 2", c(ctx, 1), 4.4, 2.2) + boot(-9) + boot(5),
    };
  },

  // Uncommon, Rainy day. A boat folded from paper, with a sail.
  "paper-boat": (ctx) => ({
    front:
      line("M0 -21 L0 4", OUTLINE, 1.6) +
      outlined("path", { d: "M0 -20 L12 3 L0 3 Z", fill: c(ctx, 0) }, 2.2) +
      outlined("path", { d: "M-15 4 L15 4 L10 13 L-10 13 Z", fill: c(ctx, 1) }, 2.4) +
      line("M-11 9 L11 9", c(ctx, 0), 1.6),
  }),

  // Uncommon, Rainy day. A rain gauge with a little water in the tube.
  "rain-gauge": (ctx) => ({
    front:
      outlined("path", { d: "M-9 -18 L9 -18 L5 -12 L-5 -12 Z", fill: c(ctx, 0) }, 2.2) +
      outlined("rect", { x: -5, y: -12, width: 10, height: 26, rx: 5, fill: "#DDEBFF" }, 2.4) +
      el("rect", { x: -3.2, y: 2, width: 6.4, height: 10, rx: 3, fill: c(ctx, 1) }) +
      line("M-5 -4 L-2 -4 M-5 4 L-2 4", OUTLINE, 1, { opacity: 0.4 }) +
      outlined("rect", { x: -8, y: 14, width: 16, height: 3, rx: 1.5, fill: c(ctx, 0) }, 2) +
      SHINE("M2.5 -8 L2.5 -2", 0.9),
  }),

  // Rare, Rainy day. A weather vane whose propeller turns.
  "weather-vane": (ctx) => ({
    front:
      tube("M0 0 L0 -34", c(ctx, 1), 4.6, 2.4) +
      g(
        {
          style: `transform-box: fill-box; transform-origin: center; ${animate("mc-propeller", 0.9, 0, "linear")}`,
        },
        outlined("ellipse", { cx: 0, cy: -34, rx: 14, ry: 3.6, fill: c(ctx, 0) }, 2.2),
      ) +
      outlined("circle", { cx: 0, cy: -34, r: 3, fill: c(ctx, 1) }, 1.8),
  }),

  // Rare, Rainy day. A little snail that bobs its eyes, with a shell.
  "snail-friend": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.4) },
      line("M9 0 L11 -10", OUTLINE, 1.6) +
        line("M13 0 L16 -9", OUTLINE, 1.6) +
        outlined("circle", { cx: 11, cy: -11, r: 2.4, fill: c(ctx, 1) }, 1.4) +
        outlined("circle", { cx: 16, cy: -10, r: 2.4, fill: c(ctx, 1) }, 1.4) +
        outlined(
          "path",
          { d: "M-15 6 L13 6 C18 6 18 1 13 1 L-8 1 C-13 1 -15 3 -15 6 Z", fill: c(ctx, 1) },
          2.2,
        ) +
        outlined("circle", { cx: -4, cy: -4, r: 8, fill: c(ctx, 0) }, 2.6) +
        el("circle", {
          cx: -4,
          cy: -4,
          r: 4,
          fill: "none",
          stroke: OUTLINE,
          "stroke-width": 1.4,
          opacity: 0.5,
        }) +
        SHINE("M-9 -8 C-8 -10 -6 -11 -4 -11", 0.7),
    ),
  }),

  // Epic, Rainy day. A glass jar of rain with drops rising inside.
  "jar-of-rain": (ctx) => ({
    front:
      outlined(
        "rect",
        { x: -10, y: -12, width: 20, height: 26, rx: 8, fill: c(ctx, 0), "fill-opacity": 0.55 },
        2.6,
      ) +
      [
        [-4, 4, 0],
        [3, 8, 0.9],
        [0, -2, 1.7],
      ]
        .map(([x = 0, y = 0, d = 0]) =>
          el("circle", {
            cx: x,
            cy: y,
            r: 1.8,
            fill: "#FFFFFF",
            style: animate("mc-bubble", 2.6, d),
          }),
        )
        .join("") +
      outlined("rect", { x: -8, y: -17, width: 16, height: 6, rx: 2, fill: c(ctx, 1) }, 2.2) +
      SHINE("M-6 -6 L-6 4", 0.6),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Rainy day. A small rainbow behind you that shimmers.
  "rainbow-arc": (ctx) => ({
    back:
      band(92, 6, c(ctx, 0)) +
      band(84, 6, c(ctx, 1)) +
      band(76, 6, c(ctx, 2)) +
      el("path", {
        d: arc(88),
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 2,
        "stroke-linecap": "round",
        style: animate("mc-shimmer", 3.6),
      }),
  }),

  // Rare, Rainy day. Rings in a puddle under your feet, softly pulsing.
  "puddle-ripples": (ctx) => ({
    front: [
      [38, 0],
      [162, 1.4],
    ]
      .map(([cx = 0, delay = 0]) =>
        g(
          { style: animate("mc-pulse", 2.8, delay) },
          el("ellipse", { cx, cy: 182, rx: 18, ry: 5, fill: c(ctx, 0), opacity: 0.6 }) +
            el("ellipse", {
              cx,
              cy: 182,
              rx: 11,
              ry: 3,
              fill: "none",
              stroke: c(ctx, 1),
              "stroke-width": 1.6,
            }) +
            el("ellipse", {
              cx,
              cy: 182,
              rx: 24,
              ry: 7,
              fill: "none",
              stroke: c(ctx, 1),
              "stroke-width": 1.2,
              opacity: 0.7,
            }),
        ),
      )
      .join(""),
  }),

  // Epic, Rainy day. A tiny thunder cloud that bobs and flickers.

  // Epic, Rainy day. Gentle drops that fall around you.

  // Legendary, Rainy day. A big rainbow with the sun peeking out, glowing.
};

// Set background: a rainy window with a cosy sill. Muted, thin lines, nothing moves.

const rainyWindow: Scene = () =>
  `<rect width="200" height="200" fill="#E3EAF2"/>
<rect y="164" width="200" height="36" fill="#D9C2A0"/>
<rect y="164" width="200" height="4" fill="#B89E7A"/>
<g stroke="#8E9AB0" stroke-width="3"><rect x="6" y="18" width="46" height="122" rx="4" fill="#C9D9EA"/><path d="M29 18 L29 140 M6 79 L52 79" fill="none"/></g>
<g stroke="#8E9AB0" stroke-width="3"><rect x="148" y="18" width="46" height="122" rx="4" fill="#C9D9EA"/><path d="M171 18 L171 140 M148 79 L194 79" fill="none"/></g>
<g stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"><path d="M14 40 L14 48 M38 58 L38 66 M20 104 L20 112 M44 110 L44 118 M14 124 L14 130"/><path d="M156 50 L156 58 M180 70 L180 78 M160 118 L160 126 M186 124 L186 132"/></g>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { "rainy-window": rainyWindow },
};
