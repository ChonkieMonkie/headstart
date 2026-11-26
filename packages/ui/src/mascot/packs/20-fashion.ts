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

// Pack 20, fashion: top hats, pearls, fans and a golden spotlight. Every item
// here uses at most three colours of its own, besides the shared outline and
// white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import {
  BODY,
  blob,
  c,
  type Draw,
  eyesOf,
  HEADBAND,
  line,
  type PackDrawings,
  SHINE,
  torso,
} from "./kit.ts";

/** A point on a circle of radius r around (0, 0), at angle deg (-90 is straight up). */
const P = (deg: number, r: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
};

const HEAD: Record<string, Draw> = {
  // Common, Fashion. A tall top hat with a band.
  "top-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-20 4 L-20 -34 C-20 -40 20 -40 20 -34 L20 4 Z", fill: c(ctx, 0) },
        3,
      ) +
      outlined("rect", { x: -20, y: -12, width: 40, height: 8, fill: c(ctx, 1) }, 2.2) +
      outlined("ellipse", { cx: 0, cy: 4, rx: 34, ry: 6, fill: c(ctx, 0) }, 3) +
      SHINE("M-13 -26 C-13 -30 -9 -32 -5 -32", 0.4),
  }),

  // Uncommon, Fashion. A fedora with a pinched crown and a ribbon.
  fedora: (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-22 4 C-24 -22 -14 -30 0 -26 C14 -30 24 -22 22 4 Z", fill: c(ctx, 0) },
        3,
      ) +
      line("M-4 -27 C-2 -21 2 -21 4 -27", OUTLINE, 1.6, { opacity: 0.35 }) +
      outlined("rect", { x: -22, y: -4, width: 44, height: 7, fill: c(ctx, 1) }, 2.2) +
      outlined("path", { d: "M-40 6 C-30 0 30 0 40 6 C32 14 -32 14 -40 6 Z", fill: c(ctx, 0) }, 3) +
      SHINE("M-14 -18 C-12 -22 -8 -23 -4 -23", 0.35),
  }),

  // Rare, Fashion. Three gems that twinkle on a gold band.
  tiara: (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 7.5, 4) +
      outlined(
        "path",
        { d: "M-26 0 L-18 -14 L-8 -3 L0 -20 L8 -3 L18 -14 L26 0 Z", fill: c(ctx, 0) },
        2.4,
      ) +
      el("circle", {
        cx: 0,
        cy: -21,
        r: 3.8,
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.6,
        style: animate("mc-twinkle", 2.2),
      }) +
      el("circle", {
        cx: -18,
        cy: -16,
        r: 2.8,
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-twinkle", 2.2, 0.8),
      }) +
      el("circle", {
        cx: 18,
        cy: -16,
        r: 2.8,
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-twinkle", 2.2, 1.5),
      }) +
      SHINE("M-2 -24 C-1 -26 1 -27 3 -26", 0.7),
  }),

  // Rare, Fashion. A feather clipped to the side of the head that sways.
  "feather-fascinator": (ctx) => ({
    front:
      outlined("ellipse", { cx: -18, cy: -2, rx: 11, ry: 6, fill: c(ctx, 1) }, 2.6) +
      g(
        { style: `transform-origin: -18px -4px; ${animate("mc-sway", 3.4)}` },
        outlined(
          "path",
          { d: "M-20 -6 C-34 -24 -22 -48 8 -54 C-2 -40 -4 -24 -14 -6 Z", fill: c(ctx, 0) },
          2.8,
        ),
        line("M-18 -8 C-22 -26 -10 -42 4 -50", OUTLINE, 1.4, { opacity: 0.4 }),
        SHINE("M-27 -24 C-27 -31 -22 -37 -15 -40", 0.6),
      ),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Fashion. One small beauty mark beside the mouth.
  "beauty-mark": (ctx) => ({
    front: outlined(
      "circle",
      { cx: ctx.geo.mx + 15, cy: ctx.geo.my - 3, r: 2.4, fill: c(ctx, 0) },
      1,
    ),
  }),

  // Uncommon, Fashion. Wire half-moon glasses, with the eyes looking over the top.
  "wire-half-moon": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const lens = (x: number): string =>
      `M${x - 11} ${y + 6} L${x + 11} ${y + 6} A11 10 0 0 1 ${x - 11} ${y + 6} Z`;
    return {
      front:
        [x1, x2].map((x) => el("path", { d: lens(x), fill: c(ctx, 1), opacity: 0.4 })).join("") +
        [x1, x2]
          .map((x) =>
            el("path", {
              d: lens(x),
              fill: "none",
              stroke: OUTLINE,
              "stroke-width": 4.4,
              "stroke-linejoin": "round",
            }),
          )
          .join("") +
        [x1, x2]
          .map((x) =>
            el("path", {
              d: lens(x),
              fill: "none",
              stroke: c(ctx, 0),
              "stroke-width": 2,
              "stroke-linejoin": "round",
            }),
          )
          .join("") +
        line(`M${x1 + 11} ${y + 6} Q100 ${y + 1} ${x2 - 11} ${y + 6}`, c(ctx, 0), 2),
    };
  },

  // Rare, Fashion. A lip print on the cheek with a little sparkle beside it.
  "lip-print": (ctx) => ({
    front:
      g(
        { transform: `translate(${ctx.geo.br + 3} ${ctx.geo.by - 2}) rotate(-10)` },
        outlined(
          "path",
          { d: "M-7 0 C-4 -4 -2 -3 0 -1 C2 -3 4 -4 7 0 C4 4 -4 4 -7 0 Z", fill: c(ctx, 0) },
          1.2,
        ),
        line("M-6 0 L6 0", OUTLINE, 1, { opacity: 0.5 }),
      ) +
      el("path", {
        d: sparkle(ctx.geo.br + 13, ctx.geo.by - 9, 3),
        fill: "#FFFFFF",
        style: animate("mc-twinkle", 2.2, 0.6),
      }),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common, Fashion. A necklace of pearls with a drop pendant.
  "pearl-necklace": (ctx) => {
    const pearls = [0, 1, 2, 3, 4, 5, 6, 7, 8]
      .map((i) => {
        const t = i / 8;
        const x = -30 + 60 * t;
        const y = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 26 + t * t * 4;
        return (
          outlined("circle", { cx: x, cy: y, r: 3.6, fill: c(ctx, 0) }, 1.2) +
          el("circle", { cx: x - 1.1, cy: y - 1.1, r: 1, fill: "#FFFFFF" })
        );
      })
      .join("");
    return {
      front:
        pearls +
        line("M0 15 L0 19", OUTLINE, 1.2) +
        outlined("circle", { cx: 0, cy: 24, r: 5.2, fill: c(ctx, 1) }, 2) +
        SHINE("M-3 21 C-2 19 0 18 2 18", 0.8),
    };
  },

  // Common, Fashion. A bow brooch pinned to the front.
  "bow-brooch": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        { d: "M98 139 C90 128 78 130 82 140 C86 150 94 146 98 139 Z", fill: c(ctx, 0) },
        2.2,
      ) +
        outlined(
          "path",
          { d: "M102 139 C110 128 122 130 118 140 C114 150 106 146 102 139 Z", fill: c(ctx, 0) },
          2.2,
        ) +
        outlined(
          "path",
          {
            d: "M97 142 L92 154 L96 154 L100 146 Z M103 142 L108 154 L104 154 L100 146 Z",
            fill: c(ctx, 0),
          },
          1.6,
        ) +
        SHINE("M86 134 C87 132 90 131 92 131", 0.5) +
        outlined("circle", { cx: 100, cy: 140, r: 3.4, fill: c(ctx, 1) }, 1.8),
    ),
  }),

  // Uncommon, Fashion. A tuxedo front with a white shirt and satin lapels.
  "tuxedo-bib": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        outlined("path", { d: "M89 122 L111 122 L108 180 L92 180 Z", fill: "#FFFFFF" }, 2.2) +
        outlined("path", { d: "M80 122 L89 122 L92 180 L82 180 Z", fill: c(ctx, 1) }, 2.2) +
        outlined("path", { d: "M120 122 L111 122 L108 180 L118 180 Z", fill: c(ctx, 1) }, 2.2) +
        [158, 170].map((y) => el("circle", { cx: 100, cy: y, r: 2.2, fill: c(ctx, 1) })).join(""),
    ),
  }),

  // Uncommon, Fashion. A fluffy feather boa wrapped around the neck.
  "feather-boa": (ctx) => {
    const puffs: [number, number, number][] = [
      [-30, 6, 7],
      [-20, 11, 8],
      [-8, 13, 8],
      [6, 13, 8],
      [18, 11, 8],
      [30, 6, 7],
      [34, 20, 6],
      [30, 31, 6],
      [24, 40, 5],
    ];
    return {
      front:
        blob(puffs, c(ctx, 0), 2.4) +
        puffs
          .map(([x = 0, y = 0, r = 0]) =>
            el("circle", { cx: x, cy: y, r: r * 0.45, fill: c(ctx, 1), opacity: 0.9 }),
          )
          .join("") +
        SHINE("M-22 4 C-14 1 -6 0 2 2", 0.4),
    };
  },
};

const HELD: Record<string, Draw> = {
  // Common, Fashion. A folding fan held at the hand.
  "hand-fan": (ctx) => {
    const ribs = [-135, -112, -90, -68, -45]
      .map((deg) => line(`M0 0 L${P(deg, 27)}`, OUTLINE, 1.1, { opacity: 0.5 }))
      .join("");
    return {
      front:
        outlined(
          "path",
          { d: `M0 0 L${P(-150, 28)} A28 28 0 0 1 ${P(-30, 28)} Z`, fill: c(ctx, 0) },
          2.6,
        ) +
        el("path", { d: `M0 0 L${P(-150, 20)} A20 20 0 0 1 ${P(-30, 20)} Z`, fill: c(ctx, 1) }) +
        ribs +
        outlined("circle", { cx: 0, cy: 0, r: 3.4, fill: c(ctx, 1) }, 1.8),
    };
  },

  // Common, Fashion. A small perfume bottle with a cap.
  "perfume-bottle": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-10 16 L-10 2 C-10 -2 -8 -4 -4 -4 L4 -4 C8 -4 10 -2 10 2 L10 16 C10 19 8 20 6 20 L-6 20 C-8 20 -10 19 -10 16 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
      outlined("rect", { x: -5, y: -14, width: 10, height: 10, rx: 3, fill: c(ctx, 1) }, 2.2) +
      SHINE("M-6 5 L-6 14", 0.5),
  }),

  // Uncommon, Fashion. A little hand mirror with a long handle.
  "hand-mirror": (ctx) => ({
    front:
      tube("M0 -4 L0 16", c(ctx, 0), 7, 3.6) +
      outlined("ellipse", { cx: 0, cy: -20, rx: 14, ry: 17, fill: c(ctx, 0) }, 2.8) +
      el("ellipse", { cx: 0, cy: -20, rx: 10, ry: 13, fill: c(ctx, 1) }) +
      line("M-6 -28 C-4 -31 0 -32 3 -31", "#FFFFFF", 2, { opacity: 0.9 }),
  }),

  // Uncommon, Fashion. A handbag with a clasp.
  handbag: (ctx) => ({
    front:
      tube("M-7 -4 C-7 -20 7 -20 7 -4", c(ctx, 1), 5.4, 2.6) +
      outlined(
        "path",
        {
          d: "M-15 -4 L15 -4 L17 16 C17 19 15 21 12 21 L-12 21 C-15 21 -17 19 -17 16 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      line("M-13 6 L13 6", OUTLINE, 1, { opacity: 0.25, "stroke-dasharray": "2 2" }) +
      outlined("rect", { x: -6, y: -2, width: 12, height: 6, rx: 2, fill: c(ctx, 1) }, 1.8) +
      SHINE("M-10 4 L-11 14", 0.4),
  }),

  // Rare, Fashion. Opera glasses on a stick, bobbing a little.
  "opera-glasses": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("rect", { x: -13, y: -26, width: 11, height: 20, rx: 5, fill: c(ctx, 0) }, 2.4),
      outlined("rect", { x: 2, y: -26, width: 11, height: 20, rx: 5, fill: c(ctx, 0) }, 2.4),
      el("ellipse", { cx: -8, cy: -22, rx: 2.4, ry: 1.6, fill: "#DDEBFF" }),
      el("ellipse", { cx: 7, cy: -22, rx: 2.4, ry: 1.6, fill: "#DDEBFF" }),
      outlined("rect", { x: -3, y: -12, width: 6, height: 6, rx: 1.5, fill: c(ctx, 1) }, 1.8),
      outlined("path", { d: "M-5 -6 L-6 16 L6 16 L5 -6 Z", fill: c(ctx, 1) }, 2.2),
    ),
  }),

  // Rare, Fashion. A lace parasol that sways over the hand.
  "lace-parasol": (ctx) => ({
    front: g(
      { style: `transform-origin: 0px 14px; ${animate("mc-sway", 4)}` },
      line("M0 14 L0 -26", OUTLINE, 2.4),
      outlined("path", { d: "M-24 -26 C-24 -50 24 -50 24 -26 Z", fill: c(ctx, 0) }, 2.8),
      [-18, -6, 6, 18]
        .map((x) => outlined("circle", { cx: x, cy: -25, r: 4.5, fill: c(ctx, 1) }, 1.6))
        .join(""),
      line("M-12 -38 Q0 -44 12 -38", "#FFFFFF", 2, { opacity: 0.6 }),
    ),
  }),

  // Epic, Fashion. A walking cane with a diamond top that bobs and sparkles.
  "diamond-cane": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3.2) },
      tube("M0 16 L0 -14", c(ctx, 0), 6.5, 3.2),
      outlined("path", { d: "M0 -40 L9 -28 L0 -14 L-9 -28 Z", fill: c(ctx, 1) }, 2.4),
      line("M-9 -28 L9 -28", "#FFFFFF", 1.2, { opacity: 0.6 }),
      line("M0 -40 L0 -14", "#FFFFFF", 1, { opacity: 0.5 }),
      el("path", {
        d: sparkle(-14, -36, 4),
        fill: "#FFFFFF",
        style: animate("mc-twinkle", 2, 0.4),
      }),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Fashion. Sparkles that twinkle around the buddy on the catwalk.
  "runway-sparkle": (ctx) => {
    const STARS: [number, number, number, number][] = [
      [34, 64, 7, 0],
      [166, 60, 8, 0.6],
      [28, 128, 5, 1.2],
      [174, 132, 6, 1.8],
      [44, 30, 4, 0.9],
    ];
    return {
      front: STARS.map(
        ([x = 0, y = 0, s = 0, d = 0]) =>
          el("circle", {
            cx: x,
            cy: y,
            r: s * 2,
            fill: c(ctx, 1),
            opacity: 0.35,
            style: animate("mc-twinkle", 2.2, d),
          }) +
          el("path", {
            d: sparkle(x, y, s),
            fill: c(ctx, 0),
            stroke: OUTLINE,
            "stroke-width": 1.4,
            style: animate("mc-twinkle", 2.2, d),
          }),
      ).join(""),
    };
  },

  // Epic, Fashion. Rose petals drifting down past the buddy.

  // Legendary, Fashion. Golden spotlight beams, a glowing ring and sparkles.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
