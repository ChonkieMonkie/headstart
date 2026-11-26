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

// Pack 15, art: brushes, paint, sketchbooks and a self-painting finale for
// the studious artist. Every item here uses at most three colours of its own,
// besides the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, tube } from "../svg.ts";
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

const HEAD: Record<string, Draw> = {
  // Common, Art. A painter's cap with paint splashes on the dome.
  "paint-splash-cap": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-30 4 C-30 -24 -16 -34 0 -34 C16 -34 30 -24 30 4 Z", fill: c(ctx, 0) },
        3,
      ) +
      [
        [-14, -18, 4.5],
        [9, -24, 3.4],
        [17, -6, 3.2],
        [-4, -8, 2.6],
      ]
        .map(([x = 0, y = 0, r = 0]) =>
          outlined("circle", { cx: x, cy: y, r, fill: c(ctx, 2) }, 1.6),
        )
        .join("") +
      SHINE("M-22 -14 C-20 -22 -14 -28 -6 -30", 0.5) +
      outlined("path", { d: "M-38 6 C-20 12 20 12 38 6 C36 0 -36 0 -38 6 Z", fill: c(ctx, 1) }, 3),
  }),

  // Uncommon, Art. Three pencils standing up on a band, sharpened ends up.
  "pencil-crown": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      [
        [-20, 2, -22],
        [0, -1, 0],
        [20, 2, 22],
      ]
        .map(([x = 0, y = 0, a = 0]) =>
          g(
            { transform: `translate(${x} ${y}) rotate(${a})` },
            outlined(
              "rect",
              { x: -3.5, y: -22, width: 7, height: 22, rx: 1.2, fill: c(ctx, 1) },
              2,
            ),
            outlined("path", { d: "M-3.5 -22 L0 -30 L3.5 -22 Z", fill: "#E9C48A" }, 1.8),
            el("path", { d: "M-1.3 -27.2 L0 -30 L1.3 -27.2 Z", fill: OUTLINE }),
            outlined("rect", { x: -3.5, y: 0, width: 7, height: 4, rx: 1.5, fill: c(ctx, 0) }, 1.6),
          ),
        )
        .join(""),
  }),

  // Uncommon, Art. A painter's palette worn as a hat, with a thumb hole.
  "palette-hat": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-36 6 C-38 -12 -22 -26 0 -26 C24 -26 40 -14 38 4 C37 12 26 12 22 8 C18 4 12 6 8 10 C4 14 -4 12 -8 8 C-12 4 -16 10 -22 12 C-28 14 -35 12 -36 6 Z",
          fill: c(ctx, 0),
        },
        3,
      ) +
      outlined("circle", { cx: 26, cy: -4, r: 3.8, fill: "#DDEBFF" }, 1.8) +
      outlined("circle", { cx: -18, cy: -10, r: 4.6, fill: c(ctx, 1) }, 1.6) +
      outlined("circle", { cx: -2, cy: -17, r: 4.2, fill: c(ctx, 2) }, 1.6) +
      outlined("circle", { cx: 12, cy: -13, r: 3.6, fill: c(ctx, 1) }, 1.6) +
      SHINE("M-28 -6 C-28 -14 -22 -20 -14 -22", 0.5),
  }),

  // Rare, Art. A little paintbrush clip that sways when you pause.
  "brush-hairclip": (ctx) => ({
    front: g(
      { style: `transform-origin: 22px -6px; ${animate("mc-sway", 3)}` },
      tube("M22 -4 L36 -22", c(ctx, 0), 7, 3.6),
      outlined(
        "path",
        {
          d: "M33 -17 L40 -26 C43 -32 50 -36 56 -34 C56 -28 52 -22 46 -18 L38 -12 Z",
          fill: c(ctx, 1),
        },
        2.2,
      ),
      SHINE("M24 -6 L32 -16", 0.5),
    ),
  }),

  // Epic, Art. A tiny paint fountain that keeps spraying bright drops.
};

const FACE: Record<string, Draw> = {
  // Common, Art. A dab of paint on one cheek.
  "paint-smudge": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl} ${ctx.geo.by}) rotate(-16)` },
      outlined(
        "path",
        {
          d: "M-9 0 C-9 -4 -3 -5 0 -4 C4 -5 9 -4 9 0 C9 4 4 5 0 4 C-4 5 -9 4 -9 0 Z",
          fill: c(ctx, 0),
        },
        1.8,
      ),
      outlined("circle", { cx: 8, cy: 6, r: 2.4, fill: c(ctx, 0) }, 1.4),
      line("M-5 -2 L1 -2", "#FFFFFF", 1.4, { opacity: 0.7 }),
    ),
  }),

  // Uncommon, Art. Two bold brush-stroke brows, painted on in one go.
  "brush-brows": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    return {
      front:
        tube(`M${x1 - 10} ${y - 13} Q${x1} ${y - 21} ${x1 + 10} ${y - 14}`, c(ctx, 0), 6, 3.2) +
        tube(`M${x2 - 10} ${y - 14} Q${x2} ${y - 21} ${x2 + 10} ${y - 13}`, c(ctx, 0), 6, 3.2),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Art. A loose painter's smock with a pocket and splashes.
  "splattered-smock": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M84 124 L100 142 L116 124", OUTLINE, 2.2) +
        outlined("rect", { x: 85, y: 150, width: 30, height: 16, rx: 3, fill: c(ctx, 1) }, 2.2) +
        line("M100 150 L100 166", OUTLINE, 1.4, { opacity: 0.3 }) +
        [
          [80, 164, 3.2],
          [122, 134, 2.6],
          [116, 172, 2.2],
        ]
          .map(([x = 0, y = 0, r = 0]) =>
            outlined("circle", { cx: x, cy: y, r, fill: c(ctx, 2) }, 1.4),
          )
          .join(""),
    ),
  }),

  // Uncommon, Art. A satchel on one hip with a sketchbook peeking out.
  "sketchbook-satchel": (ctx) => ({
    torso: torso(
      ctx,
      tube("M72 124 L120 174", c(ctx, 1), 5.5, 2.6) +
        g(
          { transform: "rotate(-8 128 164)" },
          outlined("rect", { x: 114, y: 150, width: 32, height: 26, rx: 5, fill: c(ctx, 0) }, 2.8),
          outlined("rect", { x: 118, y: 140, width: 20, height: 12, rx: 2, fill: "#FFFFFF" }, 2),
          outlined("circle", { cx: 130, cy: 164, r: 2.2, fill: "#FFFFFF" }, 1.4),
        ),
    ),
  }),

  // Rare, Art. A white tee with tie-dye swirls, one for every study session.
  "tie-dye-tee": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M84 124 Q100 136 116 124", OUTLINE, 2.4) +
        outlined("circle", { cx: 88, cy: 150, r: 9, fill: c(ctx, 1) }, 1.8) +
        outlined("circle", { cx: 112, cy: 164, r: 8, fill: c(ctx, 2) }, 1.8) +
        outlined("circle", { cx: 98, cy: 170, r: 5, fill: c(ctx, 1) }, 1.6) +
        outlined("circle", { cx: 110, cy: 140, r: 4, fill: c(ctx, 2) }, 1.6),
    ),
  }),

  // Rare, Art. A denim jacket with paint splats, buttons and lapels.
  "denim-art-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        outlined("path", { d: "M84 122 L100 158 L116 122 Z", fill: "#DDEBFF" }, 2.2) +
        outlined("rect", { x: 74, y: 146, width: 14, height: 12, rx: 2, fill: c(ctx, 0) }, 1.8) +
        outlined("rect", { x: 112, y: 146, width: 14, height: 12, rx: 2, fill: c(ctx, 0) }, 1.8) +
        outlined("circle", { cx: 100, cy: 166, r: 2, fill: "#FFFFFF" }, 1.4) +
        outlined("circle", { cx: 100, cy: 176, r: 2, fill: "#FFFFFF" }, 1.4) +
        outlined("circle", { cx: 80, cy: 160, r: 3, fill: c(ctx, 1) }, 1.4) +
        outlined("circle", { cx: 121, cy: 158, r: 2.6, fill: c(ctx, 1) }, 1.4) +
        outlined("circle", { cx: 118, cy: 172, r: 2, fill: c(ctx, 1) }, 1.4),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Art. A wooden paintbrush with bright bristles.
  paintbrush: (ctx) => ({
    front: g(
      { transform: "rotate(22)" },
      tube("M0 8 L0 -26", c(ctx, 0), 7, 3.6),
      line("M-1.5 -2 L-1.5 -16", "#FFFFFF", 1.6, { opacity: 0.6 }),
      outlined("rect", { x: -3.6, y: -30, width: 7.2, height: 10, rx: 2, fill: "#9AA3B5" }, 2),
      outlined(
        "path",
        { d: "M-4.4 -30 C-6 -38 -3 -46 0 -50 C3 -46 6 -38 4.4 -30 Z", fill: c(ctx, 1) },
        2.2,
      ),
    ),
  }),

  // Common, Art. A crayon with its paper wrapper on.
  crayon: (ctx) => ({
    front: g(
      { transform: "rotate(-20)" },
      outlined("path", { d: "M-5 -30 L0 -40 L5 -30 Z", fill: c(ctx, 0) }, 2),
      outlined("rect", { x: -5, y: -30, width: 10, height: 38, rx: 2, fill: c(ctx, 0) }, 2.4),
      outlined("rect", { x: -5, y: -18, width: 10, height: 12, fill: c(ctx, 1) }, 1.8),
      SHINE("M-2 -26 L-2 -22", 0.6),
    ),
  }),

  // Common, Art. A glue stick with a coloured cap.
  "glue-stick": (ctx) => ({
    front: g(
      { transform: "rotate(14)" },
      outlined("rect", { x: -6.5, y: -26, width: 13, height: 32, rx: 3, fill: c(ctx, 0) }, 2.6),
      outlined("rect", { x: -6.5, y: -36, width: 13, height: 12, rx: 3, fill: c(ctx, 1) }, 2.6),
      SHINE("M-3 -20 L-3 -6", 0.6),
    ),
  }),

  // Uncommon, Art. A small sketchbook with a band and a page sticking out.
  sketchbook: (ctx) => ({
    front: g(
      { transform: "rotate(-6)" },
      outlined("rect", { x: -14, y: -30, width: 26, height: 34, rx: 3, fill: c(ctx, 0) }, 2.8),
      outlined("rect", { x: 9, y: -27, width: 4, height: 28, rx: 1, fill: "#FFFFFF" }, 1.4),
      outlined("rect", { x: -11, y: -14, width: 16, height: 9, rx: 2, fill: c(ctx, 1) }, 1.6),
      line("M-8 -9 C-5 -12 -2 -6 1 -10", OUTLINE, 1.2),
      el("circle", { cx: -14, cy: -24, r: 2.2, fill: "#DDEBFF" }),
      el("circle", { cx: -14, cy: -10, r: 2.2, fill: "#DDEBFF" }),
    ),
  }),

  // Uncommon, Art. Blunt safety scissors with round finger loops.
  "safety-scissors": (ctx) => ({
    front: g(
      { transform: "rotate(-18)" },
      tube("M-5 -22 L5 4", "#9AA3B5", 4.8, 2.4),
      tube("M5 -22 L-5 4", "#9AA3B5", 4.8, 2.4),
      outlined("circle", { cx: -9, cy: -30, r: 6, fill: c(ctx, 0) }, 2.2),
      outlined("circle", { cx: 9, cy: -30, r: 6, fill: c(ctx, 0) }, 2.2),
      el("circle", { cx: -9, cy: -30, r: 2.4, fill: "#FFFFFF" }),
      el("circle", { cx: 9, cy: -30, r: 2.4, fill: "#FFFFFF" }),
      el("circle", { cx: 0, cy: -9, r: 2, fill: OUTLINE }),
    ),
  }),

  // Rare, Art. A squeezed paint tube with one drop that bobs under the cap.
  "paint-tube": (ctx) => ({
    front: g(
      { transform: "rotate(-24)" },
      outlined("path", { d: "M-8 -36 L8 -36 L5 -8 L-5 -8 Z", fill: c(ctx, 0) }, 2.6),
      line("M-7 -33 L7 -33", OUTLINE, 1.4, { opacity: 0.5 }),
      outlined("rect", { x: -4.5, y: -8, width: 9, height: 9, rx: 2, fill: c(ctx, 1) }, 2.2),
      g(
        { style: animate("mc-bob", 2.6) },
        outlined(
          "path",
          {
            d: "M0 0 C-3 5 -4.5 8 -4.5 10.5 C-4.5 14 4.5 14 4.5 10.5 C4.5 8 3 5 0 0 Z",
            fill: c(ctx, 0),
          },
          1.6,
        ),
      ),
    ),
  }),

  // Rare, Art. A clay pot on a turntable, wobbling gently as it spins.
  "clay-pot": (ctx) => ({
    front: g(
      { style: `transform-origin: 0px 6px; ${animate("mc-sway", 3.2)}` },
      outlined("ellipse", { cx: 0, cy: 6, rx: 15, ry: 3.6, fill: c(ctx, 1) }, 2.2),
      outlined(
        "path",
        {
          d: "M-9 -24 C-9 -14 -16 -10 -14 -2 C-12 4 12 4 14 -2 C16 -10 9 -14 9 -24 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ),
      outlined("rect", { x: -11, y: -29, width: 22, height: 6, rx: 3, fill: c(ctx, 0) }, 2.2),
      line("M-12 -10 Q0 -6 12 -10", c(ctx, 1), 2.2),
    ),
  }),

  // Rare, Art. A tiny easel with a tiny painting. Masterpiece pending.
  "tiny-easel": (ctx) => ({
    front:
      tube("M-6 -14 L-11 8", c(ctx, 0), 4.6, 2.2) +
      tube("M6 -14 L11 8", c(ctx, 0), 4.6, 2.2) +
      outlined("rect", { x: -13, y: -34, width: 26, height: 22, rx: 2.5, fill: c(ctx, 0) }, 2.6) +
      el("rect", { x: -8.5, y: -29.5, width: 17, height: 13, rx: 1, fill: "#FFFFFF" }) +
      el("circle", { cx: 3, cy: -25, r: 3, fill: c(ctx, 1) }) +
      el("path", {
        d: "M-8.5 -18 L-3 -24 L2 -19 L5 -22 L8.5 -18.5 L8.5 -16.5 L-8.5 -16.5 Z",
        fill: c(ctx, 2),
      }),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Art. Paint splashes that bob gently around you.
  "paint-splashes": (ctx) => {
    const splashes: [number, number, number, number, number][] = [
      [34, 80, 8, 0, 0],
      [26, 128, 5, 1, 0.8],
      [170, 96, 7, 1, 1.5],
      [176, 146, 5, 0, 2.2],
    ];
    return {
      front: splashes
        .map(([x = 0, y = 0, r = 0, colour = 0, delay = 0]) =>
          g(
            { style: animate("mc-bob", 3, delay) },
            outlined("circle", { cx: x, cy: y, r, fill: c(ctx, colour) }, 2.2),
            outlined(
              "circle",
              { cx: x + r * 0.9, cy: y - r * 0.9, r: r * 0.32, fill: c(ctx, colour) },
              1.2,
            ),
          ),
        )
        .join(""),
    };
  },

  // Epic, Art. Three coloured brush trails that sway around you.
  "rainbow-brush-trail": (ctx) => ({
    front: g(
      { style: `transform-origin: 100px 100px; ${animate("mc-sway", 3.5)}` },
      tube("M46 30 C26 60 22 110 34 150", c(ctx, 0), 8.5, 4.8),
      tube("M38 40 C20 66 17 110 28 146", c(ctx, 1), 8.5, 4.8),
      tube("M154 30 C174 60 178 110 166 150", c(ctx, 2), 8.5, 4.8),
      outlined("circle", { cx: 34, cy: 154, r: 4, fill: c(ctx, 0) }, 1.6),
      outlined("circle", { cx: 166, cy: 154, r: 4, fill: c(ctx, 2) }, 1.6),
    ),
  }),

  // Legendary, Art. Brushstrokes that paint themselves around you and glow.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
