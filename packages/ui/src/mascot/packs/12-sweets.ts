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

// Pack 12, sweets: cupcakes, ice cream, candy and sugar. A theme pack, not a
// set: no set id and no background. Every item uses at most three colours.

import { animate, el, g, heart, OUTLINE, outlined, tube } from "../svg.ts";
import { BODY, blob, c, type Draw, line, type PackDrawings, SHINE, torso } from "./kit.ts";

const HEAD: Record<string, Draw> = {
  // Common, Sweets. A cupcake with a cherry on top, worn as a hat.
  "cupcake-hat": (ctx) => ({
    front:
      outlined("path", { d: "M-30 6 L-24 -8 L24 -8 L30 6 Z", fill: c(ctx, 0) }, 2.8) +
      line("M-14 -4 L-12 4 M0 -4 L0 4 M14 -4 L12 4", OUTLINE, 1.4, { opacity: 0.3 }) +
      blob(
        [
          [-18, -12, 11],
          [0, -20, 14],
          [18, -12, 11],
          [-8, -6, 9],
          [8, -6, 9],
        ],
        c(ctx, 1),
        2.6,
      ) +
      line("M0 -41 C1 -45 3 -47 7 -48", OUTLINE, 1.8) +
      outlined("circle", { cx: 0, cy: -36, r: 5.5, fill: c(ctx, 2) }, 2.2) +
      SHINE("M-16 -18 C-12 -24 -6 -26 -2 -26", 0.5),
  }),

  // Common, Sweets. A pair of cherries on a little clip above the ear.
  "cherry-hairclip": (ctx) => ({
    front:
      line("M24 4 C25 0 28 -2 32 -4 M40 6 C39 2 36 0 32 -4", OUTLINE, 1.6) +
      outlined(
        "path",
        { d: "M32 -4 C35 -13 43 -13 46 -9 C42 -5 37 -4 32 -4 Z", fill: c(ctx, 1) },
        1.6,
      ) +
      outlined("circle", { cx: 24, cy: 12, r: 7, fill: c(ctx, 0) }, 2.2) +
      outlined("circle", { cx: 40, cy: 14, r: 7, fill: c(ctx, 0) }, 2.2) +
      line("M20 10 C20 8 21 7 22 7", "#FFFFFF", 1.8, { opacity: 0.8 }) +
      outlined("rect", { x: 16, y: -6, width: 26, height: 9, rx: 4.5, fill: c(ctx, 2) }, 2.2),
  }),

  // Uncommon, Sweets. A scoop of ice cream with sauce dripping down.
  "scoop-hat": (ctx) => ({
    front:
      outlined("path", { d: "M-32 4 C-36 -30 36 -30 32 4 Z", fill: c(ctx, 0) }, 3) +
      outlined(
        "path",
        {
          d: "M-32 2 C-34 14 -24 12 -20 7 C-16 16 -4 16 0 7 C4 15 14 16 18 7 C22 12 34 12 32 2 Z",
          fill: c(ctx, 1),
        },
        2.6,
      ) +
      line("M-14 -16 L-10 -20 M6 -22 L10 -26 M-2 -12 L2 -16 M20 -14 L24 -18", c(ctx, 1), 2.4) +
      SHINE("M-20 -16 C-16 -22 -10 -24 -4 -24", 0.5),
  }),

  // Rare, Sweets. A birthday candle clipped to the hair, its flame flickering.
  "birthday-candle-pin": (ctx) => ({
    front:
      outlined("rect", { x: -30, y: -6, width: 20, height: 8, rx: 4, fill: c(ctx, 0) }, 2.4) +
      outlined("rect", { x: -24, y: -26, width: 8, height: 21, rx: 2, fill: c(ctx, 1) }, 2.2) +
      line("M-24 -20 L-16 -16 M-24 -12 L-16 -8", "#FFFFFF", 1.8, { opacity: 0.7 }) +
      g(
        { style: animate("mc-twinkle", 1.6) },
        outlined(
          "path",
          { d: "M-20 -29 C-25 -36 -23 -40 -20 -44 C-17 -40 -15 -36 -20 -29 Z", fill: c(ctx, 2) },
          1.8,
        ),
      ),
  }),

  // Epic, Sweets. A glass dome of gumballs on a candy base; the gumballs bob.
  "gumball-dome": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-30 4 C-30 -34 30 -34 30 4 Z", fill: "#DDEBFF", opacity: 0.55 },
        2.6,
      ) +
      outlined("rect", { x: -34, y: 1, width: 68, height: 9, rx: 4.5, fill: c(ctx, 0) }, 2.6) +
      outlined(
        "circle",
        { cx: -13, cy: -8, r: 6.5, fill: c(ctx, 1), style: animate("mc-bob", 2.6) },
        2.2,
      ) +
      outlined(
        "circle",
        { cx: 6, cy: -10, r: 7, fill: c(ctx, 2), style: animate("mc-bob", 2.6, 0.7) },
        2.2,
      ) +
      outlined(
        "circle",
        { cx: -3, cy: -14, r: 4.8, fill: c(ctx, 2), style: animate("mc-bob", 2.6, 1.4) },
        2,
      ) +
      outlined(
        "circle",
        { cx: 15, cy: -2, r: 5.5, fill: c(ctx, 1), style: animate("mc-bob", 2.6, 1.1) },
        2,
      ) +
      SHINE("M-22 -8 C-20 -16 -14 -21 -6 -22", 0.7),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Sweets. A candy heart stuck on one cheek.
  "candy-heart": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br + 2} ${ctx.geo.by - 1}) rotate(-10)` },
      outlined("path", { d: heart(0, 0, 7), fill: c(ctx, 0) }, 2),
      line("M-3 -2 C-3 -4 -2 -5 -1 -5", "#FFFFFF", 1.6, { opacity: 0.9 }),
    ),
  }),

  // Uncommon, Sweets. A smear of jam on the cheek, with seeds.
  "jam-smudge": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl - 2} ${ctx.geo.by - 1})` },
      outlined(
        "path",
        {
          d: "M-8 0 C-8 -6 0 -7 3 -4 C7 -7 10 -2 7 2 C9 6 3 8 1 6 C-2 9 -9 5 -8 0 Z",
          fill: c(ctx, 0),
        },
        2,
      ),
      el("circle", { cx: -2, cy: 0, r: 1.2, fill: c(ctx, 1) }),
      el("circle", { cx: 3, cy: 2, r: 1, fill: c(ctx, 1) }),
    ),
  }),

  // Rare, Sweets. A bubble of pink gum, blown beside the mouth and bobbing.
  "bubble-gum": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.mx + 18} ${ctx.geo.my + 6})` },
      g(
        { style: animate("mc-bob", 3) },
        outlined("circle", { cx: 0, cy: 0, r: 8, fill: c(ctx, 0) }, 2.2),
        SHINE("M-4 -4 C-3 -6 -1 -6.5 1 -6.5", 0.8),
      ),
    ),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common, Sweets. A spiced vest, iced along the edges, with gumdrop buttons.
  "gingerbread-vest": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M74 124 L100 150 L126 124 C134 140 136 160 132 180 L68 180 C64 160 66 140 74 124 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
        line("M76 127 L100 151 L124 127", c(ctx, 1), 3.6) +
        line("M68 176 L132 176", c(ctx, 1), 3) +
        outlined("circle", { cx: 100, cy: 162, r: 3.4, fill: c(ctx, 2) }, 1.8) +
        outlined("circle", { cx: 100, cy: 174, r: 3.4, fill: c(ctx, 2) }, 1.8) +
        [76, 88, 112, 124]
          .map((x) => outlined("circle", { cx: x, cy: 178, r: 2.4, fill: c(ctx, 1) }, 1.2))
          .join(""),
    ),
  }),

  // Uncommon, Sweets. A chunky bead necklace with a gumdrop pendant.
  "candy-necklace": (ctx) => ({
    torso: torso(
      ctx,
      [-3, -2, -1, 0, 1, 2, 3]
        .map((k) => {
          const x = 100 + k * 8;
          const y = 122 + 16 * (1 - (k / 3) ** 2);
          return outlined("circle", { cx: x, cy: y, r: 3.6, fill: c(ctx, Math.abs(k) % 2) }, 1.4);
        })
        .join("") +
        outlined("circle", { cx: 100, cy: 152, r: 6, fill: c(ctx, 1) }, 2.2) +
        SHINE("M97 150 C97 148 99 147 101 147", 0.7),
    ),
  }),

  // Rare, Sweets. A knitted jumper with sprinkles that twinkle in the knit.
  "sprinkle-sweater": (ctx) => {
    const SPRINKLES: [number, number, number][] = [
      [82, 138, 20],
      [100, 132, -30],
      [118, 140, 15],
      [92, 150, 60],
      [110, 152, -10],
      [76, 156, -45],
      [124, 158, 35],
      [100, 164, 0],
    ];
    return {
      torso: torso(
        ctx,
        outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
          outlined(
            "path",
            {
              d: "M65 166 C70 170 80 171 100 171 C120 171 130 170 135 166 L135 180 L65 180 Z",
              fill: c(ctx, 1),
            },
            2.6,
          ) +
          SPRINKLES.map(([x = 0, y = 0, angle = 0], i) =>
            el("path", {
              d: `M${x - 2.5} ${y} L${x + 2.5} ${y}`,
              fill: "none",
              stroke: c(ctx, 2),
              "stroke-width": 2.6,
              "stroke-linecap": "round",
              transform: `rotate(${angle} ${x} ${y})`,
              style: animate("mc-twinkle", 2.2, i * 0.4),
            }),
          ).join(""),
      ),
    };
  },

  // Rare, Sweets. A paper cupcake liner worn as a frilly collar that bobs.
  "cupcake-liner-collar": (ctx) => {
    const frill: [number, number, number][] = [];
    const dots: string[] = [];
    for (let k = 0; k <= 8; k++) {
      const x = 70 + k * 7.5;
      const y = 124 + 12 * (1 - ((x - 100) / 30) ** 2);
      frill.push([x, y, 5.2]);
      dots.push(el("circle", { cx: x, cy: y + 1, r: 1.4, fill: c(ctx, 1) }));
    }
    return {
      torso: torso(
        ctx,
        g({ style: animate("mc-bob", 3.4) }, blob(frill, c(ctx, 0), 2.4) + dots.join("")),
      ),
    };
  },
};

const HELD: Record<string, Draw> = {
  // Common, Sweets. A swirl lollipop, held by the stick.
  lollipop: (ctx) => ({
    front:
      tube("M0 -2 L0 -16", "#FFFFFF", 4.6, 2.6) +
      outlined("circle", { cx: 0, cy: -26, r: 12, fill: c(ctx, 0) }, 2.8) +
      line("M0 -26 C0 -30 6 -30 6 -25 C6 -20 -5 -20 -5 -27 C-5 -33 6 -34 8 -28", c(ctx, 1), 2.2) +
      SHINE("M-7 -34 C-4 -37 0 -38 3 -38", 0.6),
  }),

  // Common, Sweets. A dipped popsicle with a stick.
  popsicle: (ctx) => ({
    front:
      tube("M0 -2 L0 8", "#FFFFFF", 4.6, 2.6) +
      outlined(
        "path",
        {
          d: "M-10 -4 L-10 -24 C-10 -34 10 -34 10 -24 L10 -4 C10 0 -10 0 -10 -4 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      outlined(
        "path",
        {
          d: "M-10 -22 L10 -22 L10 -16 C9 -11 7 -10 6 -15 C5 -9 2 -9 1 -15 C0 -10 -3 -9 -4 -15 C-5 -10 -8 -11 -10 -16 Z",
          fill: c(ctx, 1),
        },
        2,
      ) +
      SHINE("M-6 -28 C-5 -30 -3 -31 -1 -31", 0.6),
  }),

  // Uncommon, Sweets. A wedge of layer cake with frosting and a strawberry.
  "cake-slice": (ctx) => ({
    front:
      outlined("path", { d: "M-16 -12 L16 -12 L0 16 Z", fill: c(ctx, 0) }, 2.8) +
      outlined(
        "path",
        {
          d: "M-16 -12 L16 -12 L16 -6 C13 -2 10 -8 7 -5 C4 -1 1 -8 -2 -5 C-5 -1 -8 -8 -11 -5 C-13 -2 -16 -6 -16 -6 Z",
          fill: c(ctx, 1),
        },
        2.2,
      ) +
      outlined("circle", { cx: 0, cy: -18, r: 5, fill: c(ctx, 2) }, 2),
  }),

  // Uncommon, Sweets. A glass jar of gummy bears under a coloured lid.
  "gummy-jar": (ctx) => {
    const bear = (x: number, y: number): string =>
      outlined("circle", { cx: x - 3.2, cy: y - 3.6, r: 1.8, fill: c(ctx, 1) }, 1.2) +
      outlined("circle", { cx: x + 3.2, cy: y - 3.6, r: 1.8, fill: c(ctx, 1) }, 1.2) +
      outlined("circle", { cx: x, cy: y, r: 4, fill: c(ctx, 1) }, 1.4);
    return {
      front:
        el("rect", {
          x: -13,
          y: -28,
          width: 26,
          height: 30,
          rx: 7,
          fill: "#DDEBFF",
          opacity: 0.7,
        }) +
        bear(-5, -12) +
        bear(4, -18) +
        bear(5, -6) +
        outlined("rect", { x: -13, y: -28, width: 26, height: 30, rx: 7, fill: "none" }, 2.6) +
        outlined("rect", { x: -15, y: -34, width: 30, height: 8, rx: 3, fill: c(ctx, 0) }, 2.6) +
        line("M-8 -22 L-8 -10", "#FFFFFF", 2.2, { opacity: 0.8 }),
    };
  },

  // Uncommon, Sweets. An ice cream cone with a scoop on top.
  "ice-cream-cone": (ctx) => ({
    front:
      outlined("path", { d: "M-11 -6 L11 -6 L0 16 Z", fill: c(ctx, 0) }, 2.6) +
      line("M-7 -2 L5 8 M7 -2 L-5 8", OUTLINE, 1.2, { opacity: 0.35 }) +
      blob(
        [
          [-8, -12, 8],
          [8, -12, 8],
          [0, -18, 9],
        ],
        c(ctx, 1),
        2.4,
      ) +
      SHINE("M-8 -20 C-6 -24 -2 -25 1 -25", 0.6),
  }),

  // Rare, Sweets. A fluffy pink cloud of cotton candy on a paper cone, bobbing.
  "cotton-candy": (ctx) => ({
    front:
      outlined("path", { d: "M-9 -12 L9 -12 L2 4 L-2 4 Z", fill: c(ctx, 1) }, 2.4) +
      g(
        { style: animate("mc-bob", 3.2) },
        blob(
          [
            [0, -24, 11],
            [-12, -17, 9],
            [12, -17, 9],
            [-6, -32, 8],
            [7, -32, 8],
          ],
          c(ctx, 0),
          2.6,
        ),
        SHINE("M-8 -30 C-6 -35 -1 -37 3 -36", 0.7),
      ),
  }),

  // Epic, Sweets. A striped candy cane that sways from the hand, with a twinkle.
};

const AURA: Record<string, Draw> = {
  // Rare, Sweets. Sprinkles that drift down the sides, spinning as they fall.
  "falling-sprinkles": (ctx) => {
    const SPOTS: [number, number, number, number][] = [
      [30, 40, 20, 0],
      [46, 62, -40, 0.9],
      [26, 92, 70, 1.8],
      [54, 112, 10, 0.4],
      [34, 136, -25, 2.2],
      [160, 44, -30, 1.2],
      [176, 72, 50, 0.2],
      [150, 96, 15, 1.6],
      [172, 122, -60, 2.6],
      [156, 150, 35, 0.8],
    ];
    return {
      front: SPOTS.map(([x = 0, y = 0, rot = 0, delay = 0], i) =>
        g(
          { transform: `translate(${x} ${y}) rotate(${rot})` },
          g(
            { style: animate("mc-fall", 3.4, delay) },
            line("M-4 0 L4 0", OUTLINE, 4.4) + line("M-4 0 L4 0", c(ctx, i % 3), 2.2),
          ),
        ),
      ).join(""),
    };
  },

  // Epic, Sweets. Three wrapped candies bobbing around the buddy, with sparkles.

  // Legendary, Sweets. A ring of candies and sprinkles that orbits the buddy, with a faint glow behind.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
