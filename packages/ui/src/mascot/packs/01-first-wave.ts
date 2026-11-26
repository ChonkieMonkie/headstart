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

// Pack 01, the first wave: the 22 shapes from the M13 design board and the
// two first set backgrounds. Every item here uses at most three colours of
// its own, besides the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import {
  BODY,
  blob,
  c,
  type Draw,
  eyesOf,
  HEADBAND,
  line,
  type PackDrawings,
  type Scene,
  SHINE,
  torso,
} from "./kit.ts";

const BUCKET_BRIM = "M-50 12 C-44 2 -30 2 0 2 C30 2 44 2 50 12 C36 20 -36 20 -50 12 Z";

const HEAD: Record<string, Draw> = {
  // Uncommon, Garden. A bucket hat that is also a frog.
  "frog-bucket": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-27 6 C-27 -16 -21 -28 0 -28 C21 -28 27 -16 27 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      [-13, 13]
        .map(
          (x) =>
            outlined("circle", { cx: x, cy: -27, r: 9.5, fill: c(ctx, 0) }, 3) +
            el("circle", { cx: x, cy: -27, r: 6, fill: c(ctx, 2) }) +
            el("circle", { cx: x + 1, cy: -26, r: 3.2, fill: OUTLINE }) +
            el("circle", { cx: x + 2.2, cy: -27.6, r: 1.1, fill: "#FFFFFF" }),
        )
        .join("") +
      line("M-7 -13 Q0 -8 7 -13", OUTLINE, 2.2) +
      outlined("rect", { x: -28, y: -7, width: 56, height: 9, fill: c(ctx, 1) }, 2.6) +
      outlined("path", { d: BUCKET_BRIM, fill: c(ctx, 0) }, 3.2) +
      line("M-40 13 C-20 17 20 17 40 13", OUTLINE, 1.8, {
        opacity: 0.22,
        "stroke-dasharray": "3 3",
      }),
  }),

  // Common, Cosy. A knitted hat with ear flaps and braids.
  "earflap-hat": (ctx) => ({
    front:
      [-1, 1]
        .map(
          (s) =>
            tube(`M${34 * s} 28 L${34 * s} 44`, c(ctx, 1), 6.5, 3.4) +
            outlined("circle", { cx: 34 * s, cy: 47, r: 3.6, fill: c(ctx, 1) }, 2.2) +
            outlined(
              "path",
              {
                d: `M${41 * s} 2 L${41 * s} 24 C${41 * s} 33 ${27 * s} 33 ${27 * s} 24 L${27 * s} 2 Z`,
                fill: c(ctx, 0),
              },
              3,
            ),
        )
        .join("") +
      outlined("path", { d: "M-38 8 C-38 -36 38 -36 38 8 Z", fill: c(ctx, 0) }, 3.2) +
      line("M-32 -7 L-24 -14 L-16 -7 L-8 -14 L0 -7 L8 -14 L16 -7 L24 -14 L32 -7", c(ctx, 1), 4) +
      el(
        "g",
        { fill: c(ctx, 1) },
        [-20, 0, 20].map((x) => el("circle", { cx: x, cy: -22, r: 2 })).join(""),
      ) +
      SHINE("M-22 -24 C-16 -29 -8 -31 0 -31", 0.3) +
      outlined("rect", { x: -41, y: 0, width: 82, height: 11, rx: 5.5, fill: c(ctx, 1) }, 3) +
      outlined("circle", { cx: 0, cy: -33, r: 8, fill: c(ctx, 1) }, 3),
  }),

  // Rare, Garden. A big spotted mushroom cap.
  "mushroom-cap": (ctx) => ({
    front:
      outlined("ellipse", { cx: 0, cy: 8, rx: 42, ry: 7, fill: c(ctx, 2) }, 2.8) +
      line(
        "M-30 9 L-28 12 M-18 10 L-17 14 M-6 10 L-6 14 M6 10 L6 14 M18 10 L17 14 M30 9 L28 12",
        OUTLINE,
        1.6,
        { opacity: 0.3 },
      ) +
      outlined(
        "path",
        {
          d: "M-50 8 C-53 -30 -24 -46 0 -46 C24 -46 53 -30 50 8 C30 1 -30 1 -50 8 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
      el(
        "g",
        { fill: c(ctx, 1) },
        [
          [-30, -16, 7.5],
          [-6, -34, 6],
          [19, -23, 8.5],
          [38, -6, 4.5],
          [-14, -4, 4],
          [4, -10, 3],
          [-38, -2, 3],
        ]
          .map(([cx = 0, cy = 0, r = 0]) => el("circle", { cx, cy, r }))
          .join(""),
      ) +
      SHINE("M-34 -30 C-26 -39 -16 -43 -8 -43", 0.4),
  }),

  // Common. A headband with cat ears.
  "cat-ears": (ctx) => ({
    front:
      [-1, 1]
        .map(
          (s) =>
            outlined(
              "path",
              { d: `M${39 * s} 10 L${33 * s} -24 L${13 * s} 2 Z`, fill: c(ctx, 0) },
              3,
            ) + el("path", { d: `M${33 * s} 3 L${30.5 * s} -14 L${20 * s} 0 Z`, fill: c(ctx, 1) }),
        )
        .join("") + tube(HEADBAND, c(ctx, 0), 9.5, 5.5),
  }),

  // Uncommon, Space. Springy antennae with glowing tips.
  "space-boppers": (ctx) => ({
    front:
      [-1, 1]
        .map(
          (s, i) =>
            tube(
              `M${14 * s} 2 C${12 * s} -8 ${22 * s} -12 ${18 * s} -20 C${14 * s} -28 ${26 * s} -30 ${24 * s} -36`,
              c(ctx, 0),
              5,
              2.4,
            ) +
            el("circle", {
              cx: 24 * s,
              cy: -40,
              r: 12,
              fill: c(ctx, 1),
              opacity: 0.4,
              style: animate("mc-twinkle", 2, i),
            }) +
            outlined("circle", { cx: 24 * s, cy: -40, r: 6.5, fill: c(ctx, 1) }, 2.6) +
            el("circle", { cx: 24 * s - 2, cy: -42, r: 1.8, fill: "#FFFFFF" }),
        )
        .join("") + tube(HEADBAND, c(ctx, 0), 9.5, 5.5),
  }),

  // Epic, Space. A tiny ringed planet that floats above the head.
  "saturn-hat": (ctx) => ({
    front:
      el("path", {
        d: sparkle(-34, -40, 5.5),
        fill: c(ctx, 2),
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-twinkle", 2.2),
      }) +
      el("path", {
        d: sparkle(34, -52, 4.5),
        fill: c(ctx, 2),
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-twinkle", 2.2, 1.1),
      }) +
      g(
        { style: animate("mc-bob", 3) },
        el("ellipse", { cx: 0, cy: 6, rx: 16, ry: 3, fill: OUTLINE, opacity: 0.12 }),
        g(
          { transform: "rotate(-16 0 -26)" },
          tube("M-31 -26 A31 8 0 0 1 31 -26", c(ctx, 1), 7, 3.6),
          outlined("circle", { cx: 0, cy: -26, r: 16, fill: c(ctx, 0) }, 3),
          line("M-14 -30 C-5 -27 5 -27 14 -30 M-15 -21 C-5 -18 5 -18 15 -21", OUTLINE, 2, {
            opacity: 0.18,
          }),
          tube("M-31 -26 A31 8 0 0 0 31 -26", c(ctx, 1), 7, 3.6),
        ),
        SHINE("M-9 -36 C-5 -39 -1 -40 3 -40", 0.6),
      ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common. A curly moustache.
  moustache: (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.mx} ${ctx.geo.my - 6})` },
      outlined(
        "path",
        {
          d: "M0 -1 C-5 -7 -13 -7 -17 -1 C-19 3 -24 4 -26 0 C-24 9 -11 9 0 3 C11 9 24 9 26 0 C24 4 19 3 17 -1 C13 -7 5 -7 0 -1 Z",
          fill: c(ctx, 0),
        },
        2.4,
      ),
    ),
  }),

  // Uncommon, Deep Sea. A dive mask with a snorkel.
  "snorkel-mask": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const left = x1 - 18;
    const width = x2 - x1 + 36;
    const right = left + width;
    return {
      front:
        tube(
          `M${right - 4} ${y + 18} C${right + 12} ${y + 18} ${right + 12} ${y + 2} ${right + 12} ${y - 30}`,
          c(ctx, 0),
          9,
          5,
        ) +
        outlined(
          "rect",
          { x: right + 7, y: y - 38, width: 10, height: 8, rx: 3, fill: c(ctx, 0) },
          2.4,
        ) +
        el("rect", {
          x: left,
          y: y - 13,
          width,
          height: 27,
          rx: 13,
          fill: c(ctx, 1),
          opacity: 0.5,
        }) +
        el("rect", {
          x: left,
          y: y - 13,
          width,
          height: 27,
          rx: 13,
          fill: "none",
          stroke: OUTLINE,
          "stroke-width": 8.5,
        }) +
        el("rect", {
          x: left,
          y: y - 13,
          width,
          height: 27,
          rx: 13,
          fill: "none",
          stroke: c(ctx, 0),
          "stroke-width": 4.5,
        }) +
        line(`M${left + 8} ${y - 4} L${left + 14} ${y - 8}`, "#FFFFFF", 2.4, { opacity: 0.9 }),
    };
  },

  // Common, Library. The teacher's gold star, on one cheek.
  "gold-star": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br + 2} ${ctx.geo.by - 1}) rotate(14)` },
      outlined("path", { d: star(0, 0, 10), fill: c(ctx, 0) }, 2.2),
      line("M-3 -4 L-1 -6", "#FFFFFF", 1.8, { opacity: 0.9 }),
    ),
  }),

  // Uncommon, Cosy. A sleep mask with closed eyes printed on it.
  "sleep-mask": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const half = ctx.geo.headHalfWidth;
    return {
      front:
        tube(`M${100 - half + 2} ${y - 6} L${100 + half - 2} ${y - 6}`, c(ctx, 0), 6.5, 3) +
        outlined(
          "rect",
          { x: x1 - 20, y: y - 14, width: x2 - x1 + 40, height: 26, rx: 13, fill: c(ctx, 0) },
          3,
        ) +
        [x1, x2]
          .map((x) =>
            line(
              `M${x - 8} ${y - 1} Q${x} ${y + 6} ${x + 8} ${y - 1} M${x - 6} ${y + 3} L${x - 9} ${y + 6} M${x} ${y + 5} L${x} ${y + 9} M${x + 6} ${y + 3} L${x + 9} ${y + 6}`,
              c(ctx, 1),
              2.2,
            ),
          )
          .join(""),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Rainy day. A yellow raincoat with toggles.
  raincoat: (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        line("M100 128 L100 178", OUTLINE, 2, { opacity: 0.25 }) +
        [140, 154, 168]
          .map(
            (y) =>
              line(`M93 ${y} L100 ${y}`, OUTLINE, 1.6, { opacity: 0.5 }) +
              outlined(
                "rect",
                { x: 100, y: y - 2.5, width: 11, height: 5, rx: 2.5, fill: c(ctx, 1) },
                1.8,
              ),
          )
          .join("") +
        line("M72 158 L88 158 M112 158 L128 158", OUTLINE, 2, { opacity: 0.3 }) +
        outlined(
          "path",
          { d: "M68 124 L100 140 L132 124 C126 116 74 116 68 124 Z", fill: c(ctx, 2) },
          3,
        ),
    ),
  }),

  // Uncommon, Library. A knitted vest with diamonds.
  "argyle-vest": (ctx) => ({
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
        el(
          "g",
          { fill: c(ctx, 1), stroke: OUTLINE, "stroke-width": 1.6, "stroke-linejoin": "round" },
          [
            [83, 147],
            [117, 147],
            [100, 162],
          ]
            .map(([x = 0, y = 0]) =>
              el("path", { d: `M${x} ${y - 10} L${x + 8} ${y} L${x} ${y + 10} L${x - 8} ${y} Z` }),
            )
            .join(""),
        ) +
        line(
          "M72 136 L96 168 M128 136 L104 168 M86 170 L112 140 M114 170 L88 140",
          c(ctx, 2),
          1.6,
          { "stroke-dasharray": "3 3" },
        ) +
        outlined("rect", { x: 74, y: 171, width: 52, height: 9, rx: 4, fill: c(ctx, 0) }, 2.6) +
        line(
          "M80 173 L80 178 M88 173 L88 178 M96 173 L96 178 M104 173 L104 178 M112 173 L112 178 M120 173 L120 178",
          OUTLINE,
          1.4,
          { opacity: 0.25 },
        ),
    ),
  }),

  // Uncommon, Deep Sea. A life ring around the middle.
  "life-ring": (ctx) => {
    const ring = (d: string) =>
      el("path", { d, fill: "none", stroke: OUTLINE, "stroke-width": 17 }) +
      el("path", { d, fill: "none", stroke: c(ctx, 0), "stroke-width": 12 }) +
      el("path", {
        d,
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 12,
        "stroke-dasharray": "15 17",
      }) +
      el("path", {
        d,
        fill: "none",
        stroke: c(ctx, 2),
        "stroke-width": 1.6,
        "stroke-dasharray": "4 3",
        opacity: 0.9,
      });
    return {
      back: ring("M53 158 A47 15 0 0 1 147 158"),
      torso: ring("M53 158 A47 15 0 0 0 147 158"),
    };
  },

  // Common, Cafe. An apron with a pocket.
  apron: (ctx) => ({
    torso: torso(
      ctx,
      line("M84 128 C84 118 116 118 116 128", OUTLINE, 6) +
        line("M84 128 C84 118 116 118 116 128", c(ctx, 0), 3) +
        outlined(
          "path",
          {
            d: "M83 128 L117 128 L117 142 C128 146 133 160 131 179 L69 179 C67 160 72 146 83 142 Z",
            fill: c(ctx, 0),
          },
          3.2,
        ) +
        outlined("rect", { x: 87, y: 152, width: 26, height: 15, rx: 3, fill: c(ctx, 1) }, 2.4) +
        line("M100 152 L100 167", OUTLINE, 1.6, { opacity: 0.35 }) +
        line("M72 146 L62 152 M128 146 L138 152", c(ctx, 0), 3),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Garden.
  "watering-can": (ctx) => ({
    front:
      tube("M-7 -7 C-7 -19 7 -19 7 -7", c(ctx, 0), 6.5, 3.2) +
      outlined("path", { d: "M10 1 L25 -12 L28 -9 L12 7 Z", fill: c(ctx, 0) }, 2.4) +
      outlined(
        "ellipse",
        { cx: 27, cy: -11, rx: 3.4, ry: 4.4, fill: c(ctx, 0), transform: "rotate(45 27 -11)" },
        2.2,
      ) +
      outlined(
        "path",
        {
          d: "M-11 -7 L11 -7 L12 11 C12 13 10 14 8 14 L-8 14 C-10 14 -12 13 -12 11 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      line("M-6 -1 L5 -1", "#FFFFFF", 2.4, { opacity: 0.6 }) +
      el(
        "g",
        { fill: c(ctx, 1), stroke: OUTLINE, "stroke-width": 1.2 },
        [
          [33, -5, 0],
          [36, 3, 0.5],
          [31, 8, 1],
        ]
          .map(([x = 0, y = 0, d = 0]) =>
            el("path", {
              d: `M${x} ${y - 3.5} C${x + 2.5} ${y} ${x + 2.5} ${y + 2.5} ${x} ${y + 2.5} C${x - 2.5} ${y + 2.5} ${x - 2.5} ${y} ${x} ${y - 3.5} Z`,
              style: animate("mc-twinkle", 1.4, d),
            }),
          )
          .join(""),
      ),
  }),

  // Common. A balloon on a string.
  balloon: (ctx) => ({
    front:
      line("M0 2 C-5 -14 12 -30 8 -52", OUTLINE, 1.6) +
      g(
        { style: animate("mc-bob", 3.2) },
        outlined("path", { d: "M5.5 -50 L10.5 -50 L8 -54 Z", fill: c(ctx, 0) }, 1.8),
        outlined("ellipse", { cx: 8, cy: -70, rx: 14, ry: 17, fill: c(ctx, 0) }, 2.8),
        SHINE("M0 -77 C1 -82 4 -84 7 -84", 0.7),
      ),
  }),

  // Uncommon, Garden. A cactus in a pot, with one flower.
  "potted-cactus": (ctx) => ({
    front:
      tube("M-5 -10 L-12 -10 L-12 -19", c(ctx, 1), 8.5, 4.5) +
      tube("M5 -16 L11 -16 L11 -23", c(ctx, 1), 8.5, 4.5) +
      outlined("rect", { x: -6.5, y: -28, width: 13, height: 30, rx: 6.5, fill: c(ctx, 1) }, 2.6) +
      line("M-2 -20 L-4 -21 M2 -12 L4 -13 M-2 -6 L-4 -7 M2 -24 L4 -25", OUTLINE, 1.2, {
        opacity: 0.45,
      }) +
      outlined("circle", { cx: 0, cy: -29, r: 3.6, fill: c(ctx, 2) }, 1.8) +
      outlined("path", { d: "M-11 0 L11 0 L8 15 L-8 15 Z", fill: c(ctx, 0) }, 2.6) +
      outlined("rect", { x: -13, y: -3, width: 26, height: 6, rx: 2, fill: c(ctx, 0) }, 2.4),
  }),

  // Common, Student life. Instant noodles with chopsticks.
  "instant-noodles": (ctx) => ({
    front:
      tube("M1 -6 L13 -28", c(ctx, 2), 5, 2.6) +
      tube("M5 -6 L19 -25", c(ctx, 2), 5, 2.6) +
      line("M-6 -16 C-9 -20 -3 -22 -6 -27 M-1 -18 C-4 -22 2 -24 -1 -29", "#9AA3B5", 2) +
      outlined("path", { d: "M-11 -8 L11 -8 L8 14 L-8 14 Z", fill: c(ctx, 0) }, 2.8) +
      el("path", { d: "M-10.1 -1 L10.1 -1 L9.2 6 L-9.2 6 Z", fill: c(ctx, 1) }) +
      outlined("ellipse", { cx: 0, cy: -8, rx: 11.5, ry: 3, fill: c(ctx, 0) }, 2.2),
  }),

  // Common. A rubber duck.
  "rubber-duck": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-15 4 C-15 15 -4 16 4 16 C14 16 18 10 17 1 C16 -3 13 -1 11 1 C6 4 2 -1 -2 -1 C-9 -1 -15 -2 -15 4 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
      outlined("circle", { cx: -5, cy: -8, r: 8.5, fill: c(ctx, 0) }, 2.6) +
      outlined(
        "path",
        { d: "M-13 -8 C-18 -9 -20 -6 -19 -4 C-17 -3 -14 -4 -12 -5 Z", fill: c(ctx, 1) },
        2,
      ) +
      el("circle", { cx: -7, cy: -10, r: 1.7, fill: OUTLINE }) +
      line("M0 5 C4 9 9 8 11 5", OUTLINE, 1.8, { opacity: 0.45 }) +
      line("M-3 -13 L0 -15", "#FFFFFF", 2, { opacity: 0.8 }),
  }),

  // Rare, Deep Sea. A fishing rod with a small fish on the line.
  "fishing-rod": (ctx) => ({
    front:
      tube("M-4 10 L30 -46", c(ctx, 0), 7, 4) +
      outlined("circle", { cx: 1, cy: 1, r: 4.5, fill: c(ctx, 0) }, 2.2) +
      line("M30 -46 Q38 -34 30 -12", OUTLINE, 1.4) +
      g(
        { style: animate("mc-bob", 2.4) },
        outlined(
          "path",
          {
            d: "M30 -12 C24 -10 22 -2 26 3 C28 6 32 6 34 3 C38 -2 36 -10 30 -12 Z",
            fill: c(ctx, 1),
          },
          2.2,
        ),
        outlined("path", { d: "M30 4 L25 11 L35 11 Z", fill: c(ctx, 1) }, 2),
        el("circle", { cx: 28, cy: -6, r: 1.3, fill: OUTLINE }),
        line("M26 -1 C29 1 32 1 34 -1", OUTLINE, 1.2, { opacity: 0.4 }),
      ),
  }),

  // Epic, Cosy. A snow globe where it keeps snowing.
  "snow-globe": (ctx) => ({
    front:
      el("circle", { cx: 0, cy: -12, r: 16, fill: c(ctx, 2), opacity: 0.6 }) +
      outlined(
        "path",
        { d: "M0 -23 L7 -12 L3 -12 L8 -4 L-8 -4 L-3 -12 L-7 -12 Z", fill: c(ctx, 1) },
        1.6,
      ) +
      el("ellipse", { cx: 0, cy: -2, rx: 13, ry: 3.4, fill: "#FFFFFF" }) +
      el(
        "g",
        { fill: "#FFFFFF" },
        [
          [-8, -18, 0],
          [6, -22, 0.7],
          [10, -12, 1.4],
          [-10, -10, 2.1],
          [2, -16, 1.1],
        ]
          .map(([cx = 0, cy = 0, d = 0]) =>
            el("circle", { cx, cy, r: 1.4, style: animate("mc-bubble", 2.8, d) }),
          )
          .join(""),
      ) +
      el("circle", { cx: 0, cy: -12, r: 16, fill: "none", stroke: OUTLINE, "stroke-width": 2.8 }) +
      SHINE("M-10 -20 C-8 -24 -4 -26 0 -26", 0.8) +
      outlined("path", { d: "M-14 3 L14 3 L16 14 L-16 14 Z", fill: c(ctx, 0) }, 2.6) +
      line("M-11 8 L11 8", "#FFFFFF", 1.6, { opacity: 0.35 }),
  }),

  // Legendary, Deep Sea. A glowing jellyfish on a leash.
};

const AURA: Record<string, Draw> = {
  // Rare, Rainy day. A small cloud that rains next to you.
  "rain-cloud": (ctx) => ({
    front:
      g(
        { style: animate("mc-bob", 4) },
        blob(
          [
            [142, 34, 11],
            [157, 25, 14],
            [173, 34, 11],
            [149, 40, 10],
            [166, 40, 10],
          ],
          c(ctx, 0),
          1.6,
        ),
        SHINE("M147 24 C151 18 157 16 162 16", 0.7),
      ) +
      el(
        "g",
        { fill: c(ctx, 1), stroke: OUTLINE, "stroke-width": 1.2 },
        [
          [144, 58, 0],
          [157, 62, 0.6],
          [170, 58, 1.2],
          [150, 72, 1.8],
          [164, 74, 0.9],
        ]
          .map(([x = 0, y = 0, d = 0]) =>
            el("path", {
              d: `M${x} ${y - 4} C${x + 2.6} ${y} ${x + 2.6} ${y + 2.6} ${x} ${y + 2.6} C${x - 2.6} ${y + 2.6} ${x - 2.6} ${y} ${x} ${y - 4} Z`,
              style: animate("mc-bubble", 1.6, d, "ease-in"),
            }),
          )
          .join(""),
      ),
  }),

  // Epic, Garden. Fireflies that blink around you.

  // Rare, Library. Paper planes that glide around you.
  "paper-planes": (ctx) => {
    const plane = (x: number, y: number, angle: number, flip: number, delay: number) =>
      g(
        { transform: `translate(${x} ${y}) rotate(${angle}) scale(${1.6 * flip} 1.6)` },
        g(
          { style: animate("mc-bob", 2.6, delay) },
          line("M-6 4 C-16 6 -24 2 -32 6", c(ctx, 1), 1.6, { "stroke-dasharray": "3 4" }),
          outlined("path", { d: "M-6 0 L16 -6 L-2 8 Z", fill: c(ctx, 0) }, 2),
          outlined("path", { d: "M-2 8 L16 -6 L2 3 Z", fill: c(ctx, 0) }, 2),
          line("M-6 0 L2 3", OUTLINE, 1.2, { opacity: 0.4 }),
        ),
      );
    return {
      front: plane(36, 50, -12, 1, 0) + plane(170, 92, 10, -1, 1) + plane(30, 146, -4, 1, 1.8),
    };
  },
};

// Set backgrounds: muted, about four tones, thin lines, nothing moves.

const library: Scene = () =>
  `<rect width="200" height="200" fill="#EFE3CF"/>
<rect y="158" width="200" height="42" fill="#DCC7A4"/>
<ellipse cx="100" cy="186" rx="70" ry="10" fill="#C98F7A" opacity=".45"/>
<g stroke="#8E6136" stroke-width="2"><rect x="8" y="26" width="58" height="132" rx="3" fill="#C59A68"/>
<path d="M8 58 L66 58 M8 92 L66 92 M8 126 L66 126" fill="none"/></g>
<g fill="#C98F7A" stroke="#8E6136" stroke-width="1.4"><rect x="14" y="36" width="8" height="22"/><rect x="24" y="40" width="7" height="18"/><rect x="42" y="34" width="9" height="24"/><rect x="18" y="104" width="8" height="22"/><rect x="48" y="102" width="9" height="24"/></g>
<g fill="#8FA7B8" stroke="#8E6136" stroke-width="1.4"><rect x="33" y="38" width="7" height="20"/><rect x="54" y="40" width="7" height="18"/><rect x="14" y="70" width="9" height="22"/><rect x="25" y="72" width="7" height="20"/><rect x="40" y="68" width="8" height="24"/><rect x="30" y="106" width="8" height="20"/></g>
<path d="M50 74 L60 92 L52 92 Z" fill="#8FA7B8" stroke="#8E6136" stroke-width="1.4"/>
<g stroke="#8E6136" stroke-width="2"><path d="M134 92 L134 50 C134 30 182 30 182 50 L182 92 Z" fill="#B7C6DD"/><path d="M158 34 L158 92 M134 64 L182 64" fill="none"/></g>
<circle cx="170" cy="48" r="6" fill="#FFF7E3"/>
<g fill="#FFFFFF" opacity=".8"><circle cx="144" cy="44" r="1.2"/><circle cx="150" cy="78" r="1"/><circle cx="174" cy="78" r="1.2"/></g>`;

const aquarium: Scene = () =>
  `<rect width="200" height="200" fill="#A9D4EB"/>
<rect width="200" height="90" fill="#C9E8F4"/>
<path d="M30 0 L60 0 L40 160 Z M110 0 L130 0 L118 160 Z" fill="#FFFFFF" opacity=".16"/>
<path d="M0 168 C30 160 60 172 100 166 C140 160 170 170 200 164 L200 200 L0 200 Z" fill="#EBD8B2"/>
<g fill="none" stroke="#6FAF8A" stroke-width="6" stroke-linecap="round"><path d="M22 172 C14 150 30 136 20 112 C14 98 24 86 20 74"/><path d="M36 172 C42 152 30 140 38 122"/><path d="M174 170 C182 148 168 134 178 110 C184 96 174 86 178 76"/></g>
<ellipse cx="160" cy="172" rx="18" ry="9" fill="#A9B7C4"/>
<g fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".75"><circle cx="164" cy="60" r="4"/><circle cx="170" cy="44" r="2.6"/><circle cx="160" cy="32" r="2"/><circle cx="40" cy="50" r="3"/><circle cx="34" cy="36" r="2"/></g>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { library, aquarium },
};
