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

// Pack 13, the critters: bears, ducks, foxes, sharks and the small friends
// that come with them. Every item here uses at most three colours of its
// own, besides the shared outline and white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import { c, type Draw, HEADBAND, line, type PackDrawings, SHINE, torso } from "./kit.ts";

// A dome that sits over the top of the head, used by the hoods.
const HOOD = "M-40 8 C-42 -30 42 -30 40 8 Z";

const HEAD: Record<string, Draw> = {
  // Common. A round hood with fluffy bear ears.
  "bear-ear-hood": (ctx) => ({
    front:
      [-1, 1]
        .map(
          (s) =>
            outlined("circle", { cx: 29 * s, cy: -22, r: 11, fill: c(ctx, 0) }, 2.6) +
            el("circle", { cx: 29 * s, cy: -21, r: 6, fill: c(ctx, 1) }),
        )
        .join("") +
      outlined("path", { d: HOOD, fill: c(ctx, 0) }, 3.2) +
      SHINE("M-24 -6 C-22 -14 -14 -20 -4 -22", 0.4),
  }),

  // Common. A yellow duck bill that sits over the fringe.
  "duck-hat": (ctx) => ({
    front:
      outlined("path", { d: "M-34 6 C-34 -30 34 -30 34 6 Z", fill: c(ctx, 0) }, 3.2) +
      line("M0 -21 C2 -28 8 -30 12 -26", c(ctx, 1), 2.6) +
      SHINE("M-22 -6 C-20 -14 -14 -19 -6 -21", 0.4) +
      outlined(
        "path",
        {
          d: "M-30 2 C-12 12 12 12 30 2 C38 8 42 14 34 17 C14 22 -14 22 -34 17 C-42 14 -38 8 -30 2 Z",
          fill: c(ctx, 1),
        },
        2.8,
      ),
  }),

  // Uncommon. A hood with pointed fox ears and a white blaze.
  "fox-hood": (ctx) => ({
    front:
      [-1, 1]
        .map(
          (s) =>
            outlined(
              "path",
              { d: `M${40 * s} 4 L${38 * s} -34 L${12 * s} -8 Z`, fill: c(ctx, 0) },
              2.8,
            ) + el("path", { d: `M${35 * s} 0 L${34 * s} -22 L${21 * s} -8 Z`, fill: c(ctx, 1) }),
        )
        .join("") +
      outlined("path", { d: HOOD, fill: c(ctx, 0) }, 3.2) +
      el("path", { d: "M0 -14 C6 -8 6 0 0 4 C-6 0 -6 -8 0 -14 Z", fill: c(ctx, 1) }) +
      SHINE("M-26 -4 C-24 -10 -18 -14 -12 -16", 0.35),
  }),

  // Uncommon. A hood with a shark fin on top and a pale belly band.
  "shark-hood": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-14 -6 C-10 -26 4 -36 16 -40 C12 -28 14 -14 22 -6 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      outlined("path", { d: HOOD, fill: c(ctx, 0) }, 3.2) +
      outlined(
        "path",
        { d: "M-40 6 C-22 -2 22 -2 40 6 C38 12 -38 12 -40 6 Z", fill: c(ctx, 1) },
        2.6,
      ) +
      line("M-22 -12 L-18 -4 M-30 -6 L-26 2", OUTLINE, 1.6, { opacity: 0.35 }) +
      SHINE("M-22 -14 C-16 -20 -8 -22 -2 -23", 0.35),
  }),

  // Rare. Long bunny ears on a headband that sway when you think.
  "bunny-ear-headband": (ctx) => ({
    front:
      [-1, 1]
        .map((s) =>
          g(
            { transform: `translate(${18 * s} 2)` },
            g(
              { style: `transform-origin: 0px 0px; ${animate("mc-sway", 3, s < 0 ? 0 : 0.6)}` },
              g(
                { transform: `rotate(${10 * s})` },
                outlined(
                  "path",
                  { d: "M-8 0 C-14 -20 -11 -44 -2 -46 C7 -46 10 -20 8 0 Z", fill: c(ctx, 0) },
                  2.6,
                ) +
                  el("path", {
                    d: "M-3.5 -4 C-7 -18 -6 -35 -2 -37 C2 -37 4 -18 3.5 -4 Z",
                    fill: c(ctx, 1),
                  }),
              ),
            ),
          ),
        )
        .join("") + tube(HEADBAND, c(ctx, 0), 9.5, 5.5),
  }),

  // Epic. A hatching egg on the head, with a chick that peeks out and blinks.
  "hatching-egg": (ctx) => ({
    front:
      g(
        { style: animate("mc-bob", 2.6) },
        outlined("ellipse", { cx: 0, cy: -14, rx: 14, ry: 18, fill: c(ctx, 0) }, 3) +
          el("circle", { cx: -7, cy: -22, r: 2.4, fill: c(ctx, 2) }) +
          el("circle", { cx: 8, cy: -8, r: 2, fill: c(ctx, 2) }) +
          line("M-11 -15 L-6 -19 L-2 -13 L3 -19 L8 -14 L11 -17", OUTLINE, 1.6) +
          outlined("circle", { cx: 0, cy: -34, r: 7.5, fill: c(ctx, 1) }, 2.4) +
          outlined("path", { d: "M5 -35 L10 -33 L5 -31 Z", fill: c(ctx, 1) }, 1.2) +
          el("circle", { cx: -2.5, cy: -36, r: 1.2, fill: OUTLINE }) +
          el("circle", { cx: 2.5, cy: -36, r: 1.2, fill: OUTLINE }),
      ) +
      el("path", {
        d: sparkle(-26, -36, 4.2),
        fill: "#FFFFFF",
        style: animate("mc-twinkle", 2, 0.4),
      }) +
      el("path", {
        d: sparkle(24, -44, 3.4),
        fill: "#FFFFFF",
        style: animate("mc-twinkle", 2, 1.2),
      }),
  }),
};

const FACE: Record<string, Draw> = {
  // Common. Painted whiskers across the cheeks.
  whiskers: (ctx) => {
    const { mx, my } = ctx.geo;
    const side = (s: number): string =>
      [
        [-4, -13],
        [-1, -3],
        [2, 5],
      ]
        .map(([from = 0, to = 0]) =>
          tube(
            `M${mx + 10 * s} ${my + from} Q${mx + 26 * s} ${my + (from + to) / 2 - 2} ${mx + 38 * s} ${my + to}`,
            c(ctx, 0),
            4.2,
            2,
          ),
        )
        .join("");
    return { front: side(-1) + side(1) };
  },

  // Uncommon. A small cat nose above the mouth.
  "cat-nose": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.mx} ${ctx.geo.my - 8})` },
      outlined(
        "path",
        { d: "M-6 -3 C-3 -6 3 -6 6 -3 C7 0 1 4 0 4 C-1 4 -7 0 -6 -3 Z", fill: c(ctx, 0) },
        1.6,
      ),
    ),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common. A bib with a little trim at the neck.
  "penguin-bib": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M84 124 C80 146 80 166 88 178 L112 178 C120 166 120 146 116 124 C108 132 92 132 84 124 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) + tube("M82 124 C92 133 108 133 118 124", c(ctx, 1), 5.5, 2.6),
    ),
  }),

  // Uncommon. A collar with a little bell.
  "bell-collar": (ctx) => ({
    torso: torso(
      ctx,
      tube("M79 124 C90 134 110 134 121 124", c(ctx, 0), 10, 6.5) +
        outlined("circle", { cx: 100, cy: 139, r: 5.5, fill: c(ctx, 1) }, 2.2) +
        line("M96 141 L104 141", OUTLINE, 1.2, { opacity: 0.4 }) +
        SHINE("M96 137 C96 135 98 134 100 134", 0.7),
    ),
  }),

  // Rare. A tortoise shell on the back that sways slowly.
  "tortoise-shell": (ctx) => ({
    back: g(
      { style: `transform-origin: 100px 150px; ${animate("mc-sway", 4)}` },
      outlined("path", { d: "M44 152 C40 106 160 106 156 152 Z", fill: c(ctx, 0) }, 3.2) +
        line(
          "M76 122 L84 136 M124 122 L116 136 M100 116 L100 134 M60 136 L74 140 M140 136 L126 140",
          c(ctx, 1),
          2.4,
        ) +
        SHINE("M66 124 C72 118 80 116 88 116", 0.4),
    ),
  }),

  // Rare. A green parrot on the shoulder that bobs along.
  "shoulder-parrot": (ctx) => ({
    front: g(
      { transform: "translate(28 4) scale(1.2) translate(-28 -4)" },
      g(
        { style: animate("mc-bob", 2.8) },
        outlined("path", { d: "M24 14 L20 26 L30 20 Z", fill: c(ctx, 1) }, 1.8) +
          outlined("ellipse", { cx: 28, cy: 8, rx: 9, ry: 11, fill: c(ctx, 0) }, 2.4) +
          line("M21 9 C22 14 25 16 28 16", OUTLINE, 1.4, { opacity: 0.5 }) +
          line("M26 19 L24 23 M31 19 L33 23", c(ctx, 1), 2) +
          outlined("circle", { cx: 31, cy: -6, r: 8, fill: c(ctx, 0) }, 2.4) +
          outlined(
            "path",
            { d: "M37 -8 C42 -8 44 -4 41 -2 C39 -1 38 -2 37 -3 Z", fill: c(ctx, 1) },
            1.6,
          ) +
          el("circle", { cx: 33.5, cy: -8, r: 1.6, fill: OUTLINE }) +
          el("circle", { cx: 34, cy: -8.6, r: 0.6, fill: "#FFFFFF" }),
      ),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common. A plush puppy with floppy ears.
  "puppy-plush": (ctx) => ({
    front:
      outlined(
        "ellipse",
        { cx: -10, cy: 9, rx: 4.6, ry: 8.5, fill: c(ctx, 1), transform: "rotate(20 -10 9)" },
        2,
      ) +
      outlined(
        "ellipse",
        { cx: 10, cy: 9, rx: 4.6, ry: 8.5, fill: c(ctx, 1), transform: "rotate(-20 10 9)" },
        2,
      ) +
      outlined("circle", { cx: 0, cy: 11, r: 12, fill: c(ctx, 0) }, 2.8) +
      outlined("ellipse", { cx: 0, cy: 17, rx: 5.5, ry: 3.8, fill: "#FFFFFF" }, 1.6) +
      el("ellipse", { cx: 0, cy: 15.2, rx: 1.8, ry: 1.3, fill: OUTLINE }) +
      el("circle", { cx: -4.5, cy: 8, r: 1.6, fill: OUTLINE }) +
      el("circle", { cx: 4.5, cy: 8, r: 1.6, fill: OUTLINE }) +
      SHINE("M-7 4 C-5 1 -2 0 1 0", 0.5),
  }),

  // Common. A little chick, peeping.
  chick: (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-10 6 C-10 -4 -6 -8 0 -8 C6 -8 10 -4 10 6 C10 12 -10 12 -10 6 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      line("M-7 2 C-5 7 0 8 3 6", OUTLINE, 1.4, { opacity: 0.4 }) +
      el("circle", { cx: -3.5, cy: -1, r: 1.5, fill: OUTLINE }) +
      el("circle", { cx: 3.5, cy: -1, r: 1.5, fill: OUTLINE }) +
      outlined("path", { d: "M3 1 L9 3 L3 5 Z", fill: c(ctx, 1) }, 1.4) +
      line("M-4 12 L-5 16 M-4 12 L-3 16 M4 12 L5 16 M4 12 L3 16", c(ctx, 1), 1.8) +
      SHINE("M-6 -3 C-4 -6 -2 -7 0 -7", 0.6),
  }),

  // Uncommon. A hamster with full cheeks.
  hamster: (ctx) => ({
    front:
      outlined("circle", { cx: -8, cy: -6, r: 4.2, fill: c(ctx, 0) }, 1.8) +
      outlined("circle", { cx: 8, cy: -6, r: 4.2, fill: c(ctx, 0) }, 1.8) +
      el("circle", { cx: -8, cy: -6, r: 2, fill: c(ctx, 1) }) +
      el("circle", { cx: 8, cy: -6, r: 2, fill: c(ctx, 1) }) +
      outlined("ellipse", { cx: 0, cy: 5, rx: 12, ry: 10, fill: c(ctx, 0) }, 2.6) +
      el("ellipse", { cx: 0, cy: 9, rx: 7, ry: 5, fill: c(ctx, 1) }) +
      el("circle", { cx: -4.5, cy: 1, r: 1.5, fill: OUTLINE }) +
      el("circle", { cx: 4.5, cy: 1, r: 1.5, fill: OUTLINE }) +
      el("circle", { cx: 0, cy: 4, r: 1.2, fill: OUTLINE }) +
      outlined("ellipse", { cx: -5, cy: 14, rx: 2.8, ry: 2, fill: c(ctx, 1) }, 1.2) +
      outlined("ellipse", { cx: 5, cy: 14, rx: 2.8, ry: 2, fill: c(ctx, 1) }, 1.2) +
      SHINE("M-8 -1 C-7 -4 -4 -5 -1 -5", 0.5),
  }),

  // Uncommon. A spiky hedgehog that rolls up when exams come.
  hedgehog: (ctx) => ({
    front:
      [
        [-11, 0, -55],
        [-6, -4, -30],
        [0, -4, 0],
        [6, -4, 30],
        [11, 0, 55],
      ]
        .map(([x = 0, y = 0, a = 0]) =>
          outlined(
            "path",
            {
              d: "M-3.5 0 L0 -8 L3.5 0 Z",
              fill: c(ctx, 0),
              transform: `translate(${x} ${y}) rotate(${a})`,
            },
            1.6,
          ),
        )
        .join("") +
      outlined("path", { d: "M-14 8 C-14 -6 14 -6 14 8 Z", fill: c(ctx, 0) }, 2.6) +
      outlined("ellipse", { cx: 4, cy: 4, rx: 8.5, ry: 6, fill: c(ctx, 1) }, 1.8) +
      el("circle", { cx: 11.5, cy: 3.5, r: 1.6, fill: OUTLINE }) +
      el("circle", { cx: 2, cy: 0.5, r: 1.3, fill: OUTLINE }),
  }),

  // Rare. A little fish in a bag of water, swimming on your hand.
  "goldfish-bag": (ctx) => ({
    front:
      line("M-7 -4 Q0 -18 7 -4", OUTLINE, 1.8) +
      outlined("circle", { cx: 0, cy: 6, r: 13, fill: c(ctx, 1) }, 2.6) +
      SHINE("M-8 0 C-7 -3 -4 -5 -1 -6", 0.8) +
      g(
        { style: animate("mc-bob", 2.2) },
        outlined("ellipse", { cx: -1, cy: 6, rx: 6, ry: 3.8, fill: c(ctx, 0) }, 1.6) +
          outlined("path", { d: "M4 6 L9 2 L9 10 Z", fill: c(ctx, 0) }, 1.6) +
          el("circle", { cx: -4, cy: 5, r: 1, fill: OUTLINE }),
      ),
  }),

  // Rare. A ginger kitten that purrs while you focus.
  "ginger-kitten": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.8) },
      tube("M5 14 C14 14 15 6 10 2", c(ctx, 0), 4.6, 2.4) +
        outlined("ellipse", { cx: 0, cy: 12, rx: 8.5, ry: 7.5, fill: c(ctx, 0) }, 2.4) +
        outlined("path", { d: "M-8 -6 L-9 -16 L-1 -10 Z", fill: c(ctx, 0) }, 2) +
        outlined("path", { d: "M8 -6 L9 -16 L1 -10 Z", fill: c(ctx, 0) }, 2) +
        el("path", { d: "M-6.5 -7 L-7 -12.5 L-3.5 -9.2 Z", fill: c(ctx, 1) }) +
        el("path", { d: "M6.5 -7 L7 -12.5 L3.5 -9.2 Z", fill: c(ctx, 1) }) +
        outlined("circle", { cx: 0, cy: -2, r: 8.5, fill: c(ctx, 0) }, 2.4) +
        el("circle", { cx: -3.2, cy: -2, r: 1.3, fill: OUTLINE }) +
        el("circle", { cx: 3.2, cy: -2, r: 1.3, fill: OUTLINE }) +
        el("circle", { cx: 0, cy: 1.5, r: 1.2, fill: c(ctx, 1) }) +
        line("M-2 3 Q0 4.6 2 3", OUTLINE, 1) +
        outlined("ellipse", { cx: -4, cy: 19, rx: 2.6, ry: 1.6, fill: c(ctx, 0) }, 1.2) +
        outlined("ellipse", { cx: 4, cy: 19, rx: 2.6, ry: 1.6, fill: c(ctx, 0) }, 1.2),
    ),
  }),

  // Rare. An otter that floats along beside you.
  "otter-pal": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("circle", { cx: -9, cy: -9, r: 3.6, fill: c(ctx, 0) }, 1.8) +
        outlined("circle", { cx: 9, cy: -9, r: 3.6, fill: c(ctx, 0) }, 1.8) +
        outlined("circle", { cx: 0, cy: 0, r: 12, fill: c(ctx, 0) }, 2.6) +
        el("ellipse", { cx: 0, cy: 5, rx: 8, ry: 6, fill: c(ctx, 1) }) +
        el("circle", { cx: 0, cy: 1, r: 2, fill: OUTLINE }) +
        el("circle", { cx: -4.5, cy: -2.5, r: 1.6, fill: OUTLINE }) +
        el("circle", { cx: 4.5, cy: -2.5, r: 1.6, fill: OUTLINE }) +
        line("M-8 3 L-13 2 M-8 5 L-13 6 M8 3 L13 2 M8 5 L13 6", OUTLINE, 0.9) +
        SHINE("M-7 -6 C-5 -9 -2 -10 1 -10", 0.5),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare. Paw prints that follow you around the room.
  "paw-print-trail": (ctx) => {
    const paw = (x: number, y: number, rot: number, delay: number): string =>
      g(
        { transform: `translate(${x} ${y}) rotate(${rot}) scale(1.4)` },
        g(
          { style: animate("mc-twinkle", 2.4, delay) },
          outlined("ellipse", { cx: 0, cy: 2.5, rx: 4.2, ry: 3.4, fill: c(ctx, 0) }, 1.2) +
            [
              [-4.6, -1.5],
              [-1.6, -4.6],
              [1.6, -4.6],
              [4.6, -1.5],
            ]
              .map(([tx = 0, ty = 0]) =>
                outlined("circle", { cx: tx, cy: ty, r: 1.9, fill: c(ctx, 0) }, 1.1),
              )
              .join(""),
        ),
      );
    return {
      front:
        paw(30, 156, -14, 0) +
        paw(46, 134, -26, 0.8) +
        paw(172, 138, 18, 1.6) +
        paw(158, 116, 24, 2.4),
    };
  },

  // Epic. A little bunny that hops along beside you.

  // Epic. Little penguins waddle along the bottom corners.

  // Legendary. A glowing fox spirit that keeps you company.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
