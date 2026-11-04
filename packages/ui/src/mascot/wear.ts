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

// Every wearable shape the catalogue can use. A shape is drawn in its item's
// colours; the content package lists the shapes and how many colours each
// takes, and the `Record` types below make sure every listed shape is drawn.
//
// Coordinates: head and held shapes are drawn around (0, 0) at the head or
// hand anchor, neck parts of outfits around the neck anchor. Face shapes,
// auras and the back and torso parts of outfits use the 200 × 200 canvas.

import type { MascotId, WEAR_SHAPES } from "@headstart/content";
import type { Geometry, MoodLook } from "./geometry.ts";
import { animate, el, flower, g, heart, OUTLINE, outlined, sparkle, star, tube } from "./svg.ts";

export interface WearContext {
  species: MascotId;
  geo: Geometry;
  mood: MoodLook;
  colors: readonly string[];
}

/** The layers a shape can draw into. Which ones each slot uses is noted above. */
export interface WearParts {
  /** Behind the body (capes, backpacks, glows). */
  back?: string;
  /** Over the body, under the arms and head (hoodies, straps). */
  torso?: string;
  /** In front of everything else of the mascot. */
  front?: string;
}

type Draw = (ctx: WearContext) => WearParts;
type ShapeTable<S extends keyof typeof WEAR_SHAPES> = Record<keyof (typeof WEAR_SHAPES)[S], Draw>;

const c = (ctx: WearContext, i: number) => ctx.colors[i] ?? "#FF00FF";
const SHINE = (d: string, opacity = 0.35) =>
  el("path", {
    d,
    fill: "none",
    stroke: "#FFFFFF",
    opacity,
    "stroke-width": 3,
    "stroke-linecap": "round",
  });
const TWINKLE = (delay = 0) => animate("mc-twinkle", 2, delay);

/** The gold on Exotic items. */
const EXOTIC_GOLD = "#F5C542";

/** The "</>" code sign as strokes, centred on (x, y). */
function codeSign(x: number, y: number, s: number, color: string, width: number): string {
  return el("path", {
    d: `M${x - 5 * s} ${y - 4 * s} L${x - 9 * s} ${y} L${x - 5 * s} ${y + 4 * s} M${x - 1.2 * s} ${y + 5 * s} L${x + 1.2 * s} ${y - 5 * s} M${x + 5 * s} ${y - 4 * s} L${x + 9 * s} ${y} L${x + 5 * s} ${y + 4 * s}`,
    fill: "none",
    stroke: color,
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
}

// ─── Head ──────────────────────────────────────────────────────────────────

function beanie(main: string, cuff: string, stripes: boolean): string {
  return (
    outlined("path", { d: "M-38 8 C-38 -36 38 -36 38 8 Z", fill: main }, 3.2) +
    (stripes
      ? g(
          { fill: cuff },
          el("rect", { x: -35, y: -12, width: 70, height: 6 }),
          el("rect", { x: -27, y: -25, width: 54, height: 5 }),
        )
      : "") +
    SHINE("M-20 -22 C-14 -28 -4 -30 4 -30") +
    outlined("rect", { x: -41, y: 0, width: 82, height: 14, rx: 7, fill: cuff }, 3.2) +
    el("path", {
      d: "M-30 3 L-30 11 M-20 3 L-20 11 M-10 3 L-10 11 M0 3 L0 11 M10 3 L10 11 M20 3 L20 11 M30 3 L30 11",
      stroke: OUTLINE,
      opacity: 0.18,
      "stroke-width": 2,
    }) +
    outlined("circle", { cx: 0, cy: -33, r: 9, fill: cuff }, 3.2)
  );
}

const HEAD: ShapeTable<"head"> = {
  beanie: (ctx) => ({ front: beanie(c(ctx, 0), c(ctx, 1), false) }),
  "beanie-striped": (ctx) => ({ front: beanie(c(ctx, 0), c(ctx, 1), true) }),

  cap: (ctx) => ({
    front:
      outlined("path", { d: "M-37 9 C-37 -30 37 -30 37 9 Z", fill: c(ctx, 0) }, 3.2) +
      el("path", {
        d: "M0 -26 L0 6 M-19 -19 C-14 -8 -13 0 -13 6 M19 -19 C14 -8 13 0 13 6",
        fill: "none",
        stroke: OUTLINE,
        opacity: 0.2,
        "stroke-width": 2,
      }) +
      SHINE("M-24 -14 C-18 -21 -10 -24 -2 -25") +
      outlined("rect", { x: -38, y: 3, width: 76, height: 9, rx: 4.5, fill: c(ctx, 1) }, 2.8) +
      outlined("path", { d: "M8 5 C26 0 48 2 60 11 C48 17 24 15 6 13 Z", fill: c(ctx, 1) }, 3) +
      outlined("circle", { cx: 0, cy: -27, r: 4, fill: c(ctx, 1) }, 2.4),
  }),

  "bucket-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-27 6 C-27 -16 -21 -28 0 -28 C21 -28 27 -16 27 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      SHINE("M-16 -18 C-12 -23 -6 -25 0 -25", 0.3) +
      outlined("rect", { x: -28, y: -7, width: 56, height: 9, fill: c(ctx, 1) }, 2.6) +
      outlined(
        "path",
        { d: "M-50 12 C-44 2 -30 2 0 2 C30 2 44 2 50 12 C36 20 -36 20 -50 12 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      el("path", {
        d: "M-40 13 C-20 17 20 17 40 13",
        fill: "none",
        stroke: OUTLINE,
        opacity: 0.22,
        "stroke-width": 1.8,
        "stroke-dasharray": "3 3",
      }),
  }),

  beret: (ctx) => ({
    front: g(
      { transform: "rotate(-10)" },
      el("path", {
        d: "M2 -22 C3 -27 6 -30 9 -31",
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 3.4,
        "stroke-linecap": "round",
      }),
      outlined("ellipse", { cx: 0, cy: -6, rx: 42, ry: 17, fill: c(ctx, 0) }, 3.2),
      el("path", { d: "M-40 -1 C-20 12 20 12 40 -1 C28 7 -28 7 -40 -1 Z", fill: c(ctx, 1) }),
      SHINE("M-26 -14 C-16 -20 -4 -22 6 -22", 0.3),
    ),
  }),

  headband: (ctx) => ({
    front:
      tube("M-44 17 C-28 7 28 7 44 17", c(ctx, 0), 11, 7.5) +
      el("path", {
        d: "M-42 16 C-28 6.5 28 6.5 42 16",
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 2,
        "stroke-dasharray": "5 4",
        "stroke-linecap": "round",
      }),
  }),

  bow: (ctx) => ({
    front: g(
      { transform: "translate(26 -2) rotate(18)" },
      outlined(
        "path",
        { d: "M0 0 C-8 -13 -21 -11 -19 0 C-21 11 -8 13 0 0 Z", fill: c(ctx, 0) },
        2.8,
      ),
      outlined("path", { d: "M0 0 C8 -13 21 -11 19 0 C21 11 8 13 0 0 Z", fill: c(ctx, 0) }, 2.8),
      el("path", {
        d: "M-7 -3 C-11 -4 -13 -2 -13 0 M7 -3 C11 -4 13 -2 13 0",
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 2,
        "stroke-linecap": "round",
      }),
      outlined("ellipse", { cx: 0, cy: 0, rx: 5, ry: 6, fill: c(ctx, 1) }, 2.4),
    ),
  }),

  "flower-crown": (ctx) => {
    const spots: [number, number, number][] = [
      [-36, 9, 1],
      [-18, 5.5, 2],
      [0, 4.5, 1],
      [18, 5.5, 2],
      [36, 9, 1],
    ];
    let leaves = "";
    for (const [x, y] of [
      [-27, 7],
      [-9, 4.5],
      [9, 4.5],
      [27, 7],
    ] as const) {
      leaves += outlined(
        "ellipse",
        { cx: x, cy: y - 2, rx: 6, ry: 3, fill: c(ctx, 0), transform: `rotate(-25 ${x} ${y - 2})` },
        1.6,
      );
    }
    return {
      front:
        tube("M-44 12 C-26 2 26 2 44 12", c(ctx, 0), 6, 3) +
        leaves +
        spots.map(([x, y, i]) => flower(x, y, x === 0 ? 6.5 : 5.5, c(ctx, i))).join(""),
    };
  },

  "party-hat": (ctx) => {
    const half = (y: number) => (20 * (y + 50)) / 56;
    const band = (y1: number, y2: number) =>
      el("polygon", {
        points: `${-half(y1)},${y1} ${half(y1)},${y1} ${half(y2)},${y2} ${-half(y2)},${y2}`,
        fill: c(ctx, 1),
      });
    return {
      front: g(
        { transform: "translate(6 0) rotate(-12)" },
        outlined("path", { d: "M-20 6 L0 -50 L20 6 Z", fill: c(ctx, 0) }, 3),
        band(-26, -18),
        band(-6, 2),
        outlined("path", { d: "M-20 6 L0 -50 L20 6 Z", fill: "none" }, 3),
        outlined("ellipse", { cx: 0, cy: 6, rx: 22, ry: 5, fill: c(ctx, 1) }, 2.6),
        outlined("circle", { cx: 0, cy: -52, r: 6, fill: c(ctx, 2) }, 2.4),
      ),
    };
  },

  "grad-cap": (ctx) => ({
    front:
      outlined("path", { d: "M-26 -10 L-26 6 C-12 12 12 12 26 6 L26 -10 Z", fill: c(ctx, 1) }, 3) +
      outlined("polygon", { points: "0,-32 54,-17 0,-2 -54,-17", fill: c(ctx, 0) }, 3) +
      el("polygon", { points: "0,-27 36,-17 0,-7 -36,-17", fill: "#FFFFFF", opacity: 0.22 }) +
      tube("M0 -17 L40 -10 L42 8", c(ctx, 2), 5, 2.6) +
      outlined("path", { d: "M38 8 L46 8 L44 20 L40 20 Z", fill: c(ctx, 2) }, 2.2) +
      outlined("circle", { cx: 0, cy: -17, r: 3.5, fill: c(ctx, 2) }, 2),
  }),

  headphones: (ctx) => ({
    front:
      tube("M-46 16 C-46 -40 46 -40 46 16", c(ctx, 0), 10, 5.5) +
      outlined("rect", { x: -58, y: 6, width: 20, height: 32, rx: 9, fill: c(ctx, 1) }, 3) +
      outlined("rect", { x: 38, y: 6, width: 20, height: 32, rx: 9, fill: c(ctx, 1) }, 3) +
      el("rect", { x: -54, y: 11, width: 5, height: 22, rx: 2.5, fill: c(ctx, 2) }) +
      el("rect", { x: 42, y: 11, width: 5, height: 22, rx: 2.5, fill: c(ctx, 2) }),
  }),

  sprout: (ctx) => ({
    front:
      tube("M0 6 C0 -6 -2 -14 0 -24", c(ctx, 0), 6.5, 3.2) +
      outlined(
        "path",
        { d: "M0 -21 C-7 -31 -21 -30 -24 -22 C-16 -15 -6 -15 0 -21 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      outlined(
        "path",
        { d: "M0 -24 C8 -36 22 -36 27 -28 C19 -20 6 -19 0 -24 Z", fill: c(ctx, 1) },
        2.4,
      ) +
      el("path", {
        d: "M-3 -21 L-17 -23 M3 -24 L19 -29",
        stroke: OUTLINE,
        opacity: 0.3,
        "stroke-width": 1.6,
        "stroke-linecap": "round",
      }),
  }),

  "propeller-cap": (ctx) => ({
    front:
      el("rect", { x: -2, y: -38, width: 4, height: 12, fill: OUTLINE }) +
      outlined("path", { d: "M-34 8 C-34 -28 34 -28 34 8 Z", fill: c(ctx, 0) }, 3.2) +
      outlined(
        "path",
        {
          d: "M-12 -24 C-14 -10 -14 0 -14 8 L14 8 C14 0 14 -10 12 -24 C4 -27 -4 -27 -12 -24 Z",
          fill: c(ctx, 1),
        },
        2,
      ) +
      SHINE("M-24 -10 C-20 -18 -14 -22 -8 -24", 0.3) +
      outlined("rect", { x: -36, y: 3, width: 72, height: 9, rx: 4.5, fill: c(ctx, 1) }, 2.8) +
      g(
        {
          style: `transform-box: fill-box; transform-origin: center; ${animate("mc-propeller", 0.7, 0, "linear")}`,
        },
        outlined("ellipse", { cx: -12, cy: -38, rx: 12, ry: 3.6, fill: c(ctx, 2) }, 2),
        outlined("ellipse", { cx: 12, cy: -38, rx: 12, ry: 3.6, fill: c(ctx, 2) }, 2),
      ) +
      outlined("circle", { cx: 0, cy: -38, r: 3.2, fill: c(ctx, 1) }, 1.8),
  }),

  "bright-idea": (ctx) => ({
    front: g(
      { transform: "translate(46 -2) scale(1.2)" },
      g(
        { style: animate("mc-bob", 3) },
        el("circle", {
          cx: 0,
          cy: -4,
          r: 19,
          fill: c(ctx, 0),
          opacity: 0.28,
          style: animate("mc-pulse", 2),
        }),
        g(
          { fill: "none", stroke: c(ctx, 0), "stroke-width": 2.6, "stroke-linecap": "round" },
          el("path", { d: "M-20 -12 L-25 -15", style: TWINKLE(0) }),
          el("path", { d: "M0 -25 L0 -31", style: TWINKLE(0.7) }),
          el("path", { d: "M20 -12 L25 -15", style: TWINKLE(1.3) }),
        ),
        outlined(
          "path",
          { d: "M-9 4 C-16 -2 -14 -18 0 -18 C14 -18 16 -2 9 4 L8 10 L-8 10 Z", fill: c(ctx, 0) },
          2.6,
        ),
        el("path", {
          d: "M-4 5 L-4 -3 L0 1 L4 -3 L4 5",
          fill: "none",
          stroke: OUTLINE,
          "stroke-width": 1.6,
          "stroke-linejoin": "round",
        }),
        SHINE("M-8 -8 C-8 -12 -5 -14 -2 -15", 0.7),
        outlined("rect", { x: -8, y: 10, width: 16, height: 8, rx: 2, fill: c(ctx, 1) }, 2.2),
        el("path", { d: "M-8 14 L8 14", stroke: OUTLINE, opacity: 0.3, "stroke-width": 1.4 }),
      ),
    ),
  }),

  wizard: (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-32 6 C-20 -10 -2 -40 14 -64 C16 -40 24 -14 32 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      el("path", {
        d: "M4 -46 C10 -30 14 -14 20 0",
        fill: "none",
        stroke: "#FFFFFF",
        opacity: 0.2,
        "stroke-width": 5,
        "stroke-linecap": "round",
      }) +
      outlined(
        "path",
        { d: "M-26 -4 C-8 0 10 0 28 -4 L30 2 C10 6 -10 6 -28 2 Z", fill: c(ctx, 2) },
        2.4,
      ) +
      outlined("ellipse", { cx: 0, cy: 7, rx: 46, ry: 9, fill: c(ctx, 1) }, 3.2) +
      outlined("path", { d: sparkle(-6, -22, 6), fill: c(ctx, 2), style: TWINKLE(0) }, 1.4) +
      outlined("path", { d: sparkle(10, -42, 4.5), fill: c(ctx, 2), style: TWINKLE(1) }, 1.4),
  }),

  crown: (ctx) => ({
    front:
      outlined(
        "polygon",
        { points: "-30,6 -32,-22 -15,-8 0,-32 15,-8 32,-22 30,6", fill: c(ctx, 0) },
        3.2,
      ) +
      outlined("rect", { x: -31, y: -2, width: 62, height: 9, rx: 3, fill: c(ctx, 1) }, 2.6) +
      outlined("circle", { cx: -32, cy: -24, r: 3.5, fill: "#FFF3C9" }, 2) +
      outlined("circle", { cx: 0, cy: -34, r: 4, fill: "#FFF3C9" }, 2) +
      outlined("circle", { cx: 32, cy: -24, r: 3.5, fill: "#FFF3C9" }, 2) +
      outlined("path", { d: "M0 -15 L5 -9 L0 -3 L-5 -9 Z", fill: c(ctx, 2) }, 2) +
      el("circle", { cx: -17, cy: 2.5, r: 2.6, fill: c(ctx, 2) }) +
      el("circle", { cx: 17, cy: 2.5, r: 2.6, fill: c(ctx, 2) }) +
      outlined("path", { d: sparkle(-40, -34, 5), fill: "#FFF3C9", style: TWINKLE(0) }, 1.2) +
      outlined("path", { d: sparkle(40, -40, 4), fill: "#FFF3C9", style: TWINKLE(0.9) }, 1.2),
  }),

  halo: (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3.4) },
      el("ellipse", {
        cx: 0,
        cy: -17,
        rx: 40,
        ry: 13,
        fill: c(ctx, 1),
        opacity: 0.3,
        style: animate("mc-pulse", 2.4),
      }),
      el("ellipse", {
        cx: 0,
        cy: -17,
        rx: 30,
        ry: 8,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 7.5,
      }),
      el("ellipse", {
        cx: 0,
        cy: -17,
        rx: 30,
        ry: 8,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 4,
      }),
      SHINE("M-18 -22 C-10 -24 -2 -25 6 -25", 0.7),
      outlined("path", { d: sparkle(-36, -28, 4.5), fill: c(ctx, 0), style: TWINKLE(0) }, 1.2),
      outlined("path", { d: sparkle(36, -8, 3.5), fill: c(ctx, 0), style: TWINKLE(1.1) }, 1.2),
    ),
  }),
};

// ─── Face ──────────────────────────────────────────────────────────────────

function eyesOf(ctx: WearContext): [number, number][] {
  return [
    [ctx.geo.ex1, ctx.geo.ey],
    [ctx.geo.ex2, ctx.geo.ey],
  ];
}

function lensRadius(ctx: WearContext): number {
  return ctx.species === "axo" ? 11 : 12;
}

/** A frame drawn as an outline with a coloured line on top, so any colour reads. */
function frame(tag: string, attrs: Record<string, number | string>, color: string): string {
  return (
    el(tag, { ...attrs, fill: "none", stroke: OUTLINE, "stroke-width": 5.4 }) +
    el(tag, { ...attrs, fill: "none", stroke: color, "stroke-width": 2.6 })
  );
}

function bridge(ctx: WearContext, color: string, lift = 0): string {
  const r = lensRadius(ctx);
  const { ex1, ex2, ey } = ctx.geo;
  const d = `M${ex1 + r} ${ey - 1 + lift} Q100 ${ey - 6 + lift} ${ex2 - r} ${ey - 1 + lift}`;
  return frame("path", { d, "stroke-linecap": "round" }, color);
}

function roundGlasses(ctx: WearContext, lens: (x: number, y: number) => string): string {
  const r = lensRadius(ctx);
  return (
    eyesOf(ctx)
      .map(
        ([x, y]) =>
          lens(x, y) +
          frame("circle", { cx: x, cy: y, r }, c(ctx, 0)) +
          el("path", {
            d: `M${x - r * 0.55} ${y - r * 0.15} L${x - r * 0.15} ${y - r * 0.55}`,
            stroke: "#FFFFFF",
            "stroke-width": 2,
            "stroke-linecap": "round",
          }),
      )
      .join("") + bridge(ctx, c(ctx, 0))
  );
}

const FACE: ShapeTable<"face"> = {
  "round-glasses": (ctx) => ({
    front: roundGlasses(ctx, (x, y) =>
      el("circle", { cx: x, cy: y, r: lensRadius(ctx), fill: "#DDEBFF", opacity: 0.35 }),
    ),
  }),

  "square-glasses": (ctx) => ({
    front:
      eyesOf(ctx)
        .map(
          ([x, y]) =>
            el("rect", {
              x: x - 13,
              y: y - 10,
              width: 26,
              height: 20,
              rx: 5,
              fill: "#DDEBFF",
              opacity: 0.35,
            }) +
            frame("rect", { x: x - 13, y: y - 10, width: 26, height: 20, rx: 5 }, c(ctx, 0)) +
            el("path", {
              d: `M${x - 8} ${y - 3} L${x - 4} ${y - 6}`,
              stroke: "#FFFFFF",
              "stroke-width": 2,
              "stroke-linecap": "round",
            }),
        )
        .join("") +
      frame(
        "path",
        { d: `M${ctx.geo.ex1 + 13} ${ctx.geo.ey - 2} L${ctx.geo.ex2 - 13} ${ctx.geo.ey - 2}` },
        c(ctx, 0),
      ),
  }),

  "reading-glasses": (ctx) => {
    const lift = 4;
    return {
      front:
        eyesOf(ctx)
          .map(([x, y0]) => {
            const y = y0 + lift;
            const d = `M${x - 13} ${y} L${x + 13} ${y} L${x + 12} ${y + 5} C${x + 10} ${y + 11} ${x - 10} ${y + 11} ${x - 12} ${y + 5} Z`;
            return (
              el("path", { d, fill: "#DDEBFF", opacity: 0.4 }) +
              frame("path", { d, "stroke-linejoin": "round" }, c(ctx, 0))
            );
          })
          .join("") +
        frame(
          "path",
          {
            d: `M${ctx.geo.ex1 + 13} ${ctx.geo.ey + lift} Q100 ${ctx.geo.ey + lift - 4} ${ctx.geo.ex2 - 13} ${ctx.geo.ey + lift}`,
            "stroke-linecap": "round",
          },
          c(ctx, 0),
        ),
    };
  },

  freckles: (ctx) => {
    const { bl, br, by } = ctx.geo;
    let dots = "";
    for (const x of [bl, br]) {
      for (const [dx, dy, r] of [
        [-5, -5, 1.4],
        [0, -8, 1.2],
        [5, -4.5, 1.4],
      ] as const) {
        dots += el("circle", { cx: x + dx, cy: by + dy, r, fill: c(ctx, 0) });
      }
    }
    return { front: dots };
  },

  shades: (ctx) => ({
    front:
      eyesOf(ctx)
        .map(
          ([x, y]) =>
            outlined(
              "rect",
              { x: x - 13, y: y - 9, width: 26, height: 17, rx: 7, fill: c(ctx, 0) },
              3,
            ) +
            el("path", {
              d: `M${x - 8} ${y - 3} L${x - 3} ${y - 6}`,
              stroke: c(ctx, 1),
              opacity: 0.8,
              "stroke-width": 2.4,
              "stroke-linecap": "round",
            }),
        )
        .join("") +
      el("path", {
        d: `M${ctx.geo.ex1 + 12} ${ctx.geo.ey - 1} Q100 ${ctx.geo.ey - 6} ${ctx.geo.ex2 - 12} ${ctx.geo.ey - 1}`,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 3.4,
        "stroke-linecap": "round",
      }),
  }),

  "heart-shades": (ctx) => ({
    front:
      eyesOf(ctx)
        .map(
          ([x, y]) =>
            outlined("path", { d: heart(x, y, 11.5), fill: c(ctx, 0) }, 2.8) +
            SHINE(`M${x - 8} ${y - 4} L${x - 5} ${y - 7}`, 0.75),
        )
        .join("") + bridge(ctx, OUTLINE),
  }),

  "star-shades": (ctx) => ({
    front:
      eyesOf(ctx)
        .map(
          ([x, y]) =>
            outlined("path", { d: star(x, y + 1, 15), fill: c(ctx, 0) }, 2.6) +
            SHINE(`M${x - 5} ${y - 3} L${x - 2} ${y - 6}`, 0.75),
        )
        .join("") + bridge(ctx, OUTLINE, -1),
  }),

  monocle: (ctx) => {
    const x = ctx.geo.ex2;
    const y = ctx.geo.ey;
    return {
      front:
        el("path", {
          d: `M${x + 10} ${y + 8} Q${x + 22} ${y + 30} ${x + 8} ${y + 38}`,
          fill: "none",
          stroke: c(ctx, 0),
          "stroke-width": 1.8,
          "stroke-dasharray": "2 2",
        }) +
        el("circle", { cx: x, cy: y, r: 12.5, fill: "#DDEBFF", opacity: 0.35 }) +
        el("circle", {
          cx: x,
          cy: y,
          r: 12.5,
          fill: "none",
          stroke: OUTLINE,
          "stroke-width": 5.5,
        }) +
        el("circle", {
          cx: x,
          cy: y,
          r: 12.5,
          fill: "none",
          stroke: c(ctx, 0),
          "stroke-width": 2.6,
        }),
    };
  },

  goggles: (ctx) => {
    const half = ctx.geo.headHalfWidth;
    const y = ctx.geo.ey;
    return {
      front:
        outlined(
          "rect",
          { x: 100 - half, y: y - 5, width: half * 2, height: 9, rx: 4, fill: c(ctx, 0) },
          2.4,
        ) +
        eyesOf(ctx)
          .map(
            ([x, ey]) =>
              el("circle", { cx: x, cy: ey, r: 13, fill: "#CFE9FF", opacity: 0.55 }) +
              el("circle", {
                cx: x,
                cy: ey,
                r: 13,
                fill: "none",
                stroke: OUTLINE,
                "stroke-width": 7.5,
              }) +
              el("circle", {
                cx: x,
                cy: ey,
                r: 13,
                fill: "none",
                stroke: c(ctx, 1),
                "stroke-width": 4,
              }) +
              SHINE(`M${x - 7} ${ey - 2} L${x - 3} ${ey - 7}`, 0.8),
          )
          .join(""),
    };
  },

  visor: (ctx) => {
    const { ex1, ex2, ey } = ctx.geo;
    const x = ex1 - 17;
    const w = ex2 - ex1 + 34;
    return {
      front:
        el("rect", {
          x,
          y: ey - 11,
          width: w,
          height: 21,
          rx: 10,
          fill: c(ctx, 1),
          opacity: 0.78,
        }) +
        el("path", {
          d: `M${x + 10} ${ey + 8} L${x + 20} ${ey - 9}`,
          stroke: "#FFFFFF",
          opacity: 0.75,
          "stroke-width": 3.4,
          "stroke-linecap": "round",
          style: animate("mc-shimmer", 2.8),
        }) +
        el("rect", {
          x,
          y: ey - 11,
          width: w,
          height: 21,
          rx: 10,
          fill: "none",
          stroke: OUTLINE,
          "stroke-width": 6,
        }) +
        el("rect", {
          x,
          y: ey - 11,
          width: w,
          height: 21,
          rx: 10,
          fill: "none",
          stroke: c(ctx, 0),
          "stroke-width": 3,
        }),
    };
  },

  "prism-glasses": (ctx) => ({
    front: roundGlasses(ctx, (x, y) =>
      el("circle", {
        cx: x,
        cy: y,
        r: lensRadius(ctx),
        fill: "#9EE6FF",
        opacity: 0.6,
        style: animate("mc-prism", 4),
      }),
    ),
  }),
};

// ─── Outfit ────────────────────────────────────────────────────────────────

function scarf(main: string, stripe: string, plaid?: string): string {
  const lines = (x: number, y: number, w: number, h: number, vertical: number[]) =>
    vertical.map((vx) => el("rect", { x: vx, y, width: 3, height: h, fill: stripe })).join("") +
    (plaid ? el("rect", { x, y: y + h / 2 - 1.2, width: w, height: 2.4, fill: plaid }) : "");
  return (
    outlined("rect", { x: 12, y: 2, width: 16, height: 30, rx: 5, fill: main }, 3) +
    (plaid
      ? lines(12, 2, 16, 30, [16, 22]) +
        el("rect", { x: 12, y: 12, width: 16, height: 2.4, fill: plaid }) +
        el("rect", { x: 12, y: 22, width: 16, height: 2.4, fill: plaid })
      : el("rect", { x: 12, y: 11, width: 16, height: 4, fill: stripe }) +
        el("rect", { x: 12, y: 20, width: 16, height: 4, fill: stripe })) +
    el("rect", {
      x: 12,
      y: 2,
      width: 16,
      height: 30,
      rx: 5,
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": 3,
    }) +
    el("path", {
      d: "M15 32 L15 37 M20 32 L20 37 M25 32 L25 37",
      stroke: OUTLINE,
      "stroke-width": 2,
      "stroke-linecap": "round",
    }) +
    outlined("rect", { x: -40, y: -8, width: 80, height: 16, rx: 8, fill: main }, 3) +
    (plaid
      ? lines(-40, -8, 80, 16, [-30, -16, -2, 12, 26])
      : el("rect", { x: -22, y: -8, width: 5, height: 16, fill: stripe }) +
        el("rect", { x: -6, y: -8, width: 5, height: 16, fill: stripe }) +
        el("rect", { x: 10, y: -8, width: 5, height: 16, fill: stripe })) +
    el("rect", {
      x: -40,
      y: -8,
      width: 80,
      height: 16,
      rx: 8,
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": 3,
    })
  );
}

const CAPE = "M66 112 C44 144 36 170 34 188 C70 194 130 194 166 188 C164 170 156 144 134 112 Z";
const CAPE_HEM = "M38 180 C74 186 126 186 162 180 L166 188 C130 194 70 194 34 188 Z";
const CAPE_SWAY = `transform-origin: 100px 112px; ${animate("mc-sway", 4.5)}`;

function capeClasp(color: string, sparkly: boolean): string {
  return (
    el("path", {
      d: "M-16 -6 L-6 -1 M16 -6 L6 -1",
      stroke: OUTLINE,
      "stroke-width": 2.4,
      "stroke-linecap": "round",
    }) +
    (sparkly
      ? outlined("path", { d: star(0, 0, 8), fill: color }, 2.4)
      : outlined("circle", { cx: 0, cy: 0, r: 6, fill: color }, 2.4))
  );
}

const OUTFIT: ShapeTable<"outfit"> = {
  scarf: (ctx) => ({ front: scarf(c(ctx, 0), c(ctx, 1)) }),
  "plaid-scarf": (ctx) => ({ front: scarf(c(ctx, 0), c(ctx, 1), c(ctx, 2)) }),

  "bow-tie": (ctx) => ({
    front:
      outlined("path", { d: "M0 0 L-19 -10 Q-23 0 -19 10 Z", fill: c(ctx, 0) }, 2.8) +
      outlined("path", { d: "M0 0 L19 -10 Q23 0 19 10 Z", fill: c(ctx, 0) }, 2.8) +
      el("path", {
        d: "M-15 -4 L-15 4 M15 -4 L15 4",
        stroke: c(ctx, 1),
        "stroke-width": 2,
        "stroke-linecap": "round",
      }) +
      outlined("rect", { x: -5, y: -5, width: 10, height: 10, rx: 3, fill: c(ctx, 1) }, 2.5),
  }),

  necktie: (ctx) => ({
    front:
      outlined("path", { d: "M-4 4 L4 4 L9 30 L0 38 L-9 30 Z", fill: c(ctx, 0) }, 2.6) +
      el("path", {
        d: "M-5.5 13 L6 9 M-7.5 23 L8 18",
        stroke: c(ctx, 1),
        "stroke-width": 2.6,
        "stroke-linecap": "round",
      }) +
      outlined("path", { d: "M-7 -6 L7 -6 L4.5 5 L-4.5 5 Z", fill: c(ctx, 0) }, 2.4),
  }),

  medal: (ctx) => ({
    front:
      outlined("polygon", { points: "-11,-6 -3,-6 4,16 -4,16", fill: c(ctx, 0) }, 2.4) +
      outlined("polygon", { points: "11,-6 3,-6 -4,16 4,16", fill: c(ctx, 1) }, 2.4) +
      outlined("circle", { cx: 0, cy: 25, r: 11, fill: c(ctx, 2) }, 2.8) +
      el("circle", { cx: 0, cy: 25, r: 7, fill: "none", stroke: c(ctx, 3), "stroke-width": 1.6 }) +
      el("path", { d: star(0, 25, 5.6), fill: "#FFFFFF", opacity: 0.75 }),
  }),

  bandana: (ctx) => {
    let dots = "";
    for (const [x, y] of [
      [-16, 1],
      [0, 5],
      [16, 1],
      [-7, 13],
      [7, 13],
      [0, 21],
    ] as const) {
      dots += el("circle", { cx: x, cy: y, r: 2.1, fill: c(ctx, 1) });
    }
    return {
      front:
        outlined("path", { d: "M-32 -6 C-16 -1 16 -1 32 -6 L0 28 Z", fill: c(ctx, 0) }, 2.8) +
        dots +
        el("path", {
          d: "M-26 -2 C-10 3 10 3 26 -2",
          fill: "none",
          stroke: OUTLINE,
          opacity: 0.22,
          "stroke-width": 1.8,
        }),
    };
  },

  lanyard: (ctx) => ({
    front:
      tube("M-16 -6 L-3 18", c(ctx, 0), 5.4, 2.8) +
      tube("M16 -6 L3 18", c(ctx, 0), 5.4, 2.8) +
      outlined("rect", { x: -3.5, y: 15, width: 7, height: 6, rx: 1.5, fill: "#C9CED8" }, 1.6) +
      el("rect", { x: -11, y: 21, width: 22, height: 28, rx: 3, fill: "#FFFFFF" }) +
      el("rect", { x: -11, y: 21, width: 22, height: 7, rx: 2, fill: c(ctx, 1) }) +
      el("rect", { x: -7, y: 31, width: 7, height: 8, rx: 1, fill: "#D5DAE5" }) +
      el("path", {
        d: "M2.5 33 L7 33 M2.5 37 L6 37 M-7 43 L7 43",
        stroke: "#9AA3B5",
        "stroke-width": 1.6,
        "stroke-linecap": "round",
      }) +
      el("rect", {
        x: -11,
        y: 21,
        width: 22,
        height: 28,
        rx: 3,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 2.4,
      }),
  }),

  lei: (ctx) => {
    const at = (t: number): [number, number] => {
      const u = 1 - t;
      return [u * u * -34 + 2 * u * t * 0 + t * t * 34, u * u * -6 + 2 * u * t * 28 + t * t * -6];
    };
    let flowers = "";
    for (let i = 0; i <= 6; i++) {
      const [x, y] = at(i / 6);
      flowers += flower(x, y, 5, c(ctx, i % 2 === 0 ? 1 : 2));
    }
    return {
      front:
        el("path", {
          d: "M-34 -6 Q0 28 34 -6",
          fill: "none",
          stroke: c(ctx, 0),
          "stroke-width": 2.4,
        }) + flowers,
    };
  },

  hoodie: (ctx) => {
    const lift = ctx.species === "axo" ? -6 : 0;
    return {
      torso: g(
        { transform: `translate(0 ${lift})` },
        outlined(
          "path",
          {
            d: "M66 122 C60 146 64 172 80 180 L120 180 C136 172 140 146 134 122 Z",
            fill: c(ctx, 0),
          },
          3.5,
        ),
        el("path", {
          d: "M124 128 C132 148 132 166 122 176",
          fill: "none",
          stroke: c(ctx, 1),
          "stroke-width": 5,
          "stroke-linecap": "round",
        }),
        outlined("rect", { x: 72, y: 172, width: 56, height: 9, rx: 4.5, fill: c(ctx, 1) }, 3),
        outlined("path", { d: "M82 150 L118 150 L122 166 L78 166 Z", fill: c(ctx, 1) }, 2.8),
        outlined(
          "path",
          { d: "M68 124 C80 138 120 138 132 124 C126 116 74 116 68 124 Z", fill: c(ctx, 2) },
          3.2,
        ),
        el("path", {
          d: "M94 132 L93 146 M106 132 L107 146",
          stroke: "#F1E9D8",
          "stroke-width": 2,
          "stroke-linecap": "round",
        }),
        outlined("circle", { cx: 93, cy: 148, r: 2.2, fill: "#F1E9D8" }, 1.2),
        outlined("circle", { cx: 107, cy: 148, r: 2.2, fill: "#F1E9D8" }, 1.2),
      ),
      // Sleeves: the arms are drawn in the hoodie colour.
      front: "",
    };
  },

  // Exotic: the developer hoodie. Its code emblem beats like a heart.
  "root-hoodie": (ctx) => {
    const base = OUTFIT.hoodie(ctx);
    const lift = ctx.species === "axo" ? -6 : 0;
    const beat = `transform-box: fill-box; transform-origin: center; ${animate("mc-beat", 1.4)}`;
    return {
      ...base,
      torso:
        (base.torso ?? "") +
        g(
          { transform: `translate(0 ${lift})` },
          el("circle", { cx: 100, cy: 158, r: 13, fill: EXOTIC_GOLD, opacity: 0.35, style: beat }),
          g({ style: beat }, codeSign(100, 158, 0.95, EXOTIC_GOLD, 2.6)),
        ),
    };
  },

  backpack: (ctx) => {
    const [left, right] = ctx.geo.shoulders;
    const strap = (x: number, y: number) =>
      tube(
        `M${x} ${y - 6} C${x - 1} ${y + 8} ${x + 1} ${y + 22} ${x} ${y + 34}`,
        c(ctx, 1),
        8,
        4.6,
      );
    return {
      back:
        tube("M86 104 C86 92 114 92 114 104", c(ctx, 1), 7, 3.6) +
        outlined("rect", { x: 50, y: 102, width: 100, height: 76, rx: 20, fill: c(ctx, 0) }, 3.2) +
        outlined("rect", { x: 44, y: 136, width: 16, height: 32, rx: 6, fill: c(ctx, 2) }, 2.6) +
        outlined("rect", { x: 140, y: 136, width: 16, height: 32, rx: 6, fill: c(ctx, 2) }, 2.6),
      torso: strap(left[0] + 2, left[1]) + strap(right[0] - 2, right[1]),
    };
  },

  cape: (ctx) => ({
    back: g(
      { style: CAPE_SWAY },
      outlined("path", { d: CAPE, fill: c(ctx, 0) }, 3.2),
      el("path", { d: CAPE_HEM, fill: c(ctx, 1) }),
      el("path", {
        d: "M60 130 C50 152 46 170 46 184 M140 130 C150 152 154 170 154 184",
        fill: "none",
        stroke: OUTLINE,
        opacity: 0.18,
        "stroke-width": 2.4,
        "stroke-linecap": "round",
      }),
      outlined("path", { d: CAPE, fill: "none" }, 3.2),
    ),
    front: capeClasp(c(ctx, 2), false),
  }),

  "starlit-cape": (ctx) => {
    let stars = "";
    const spots: [number, number, number][] = [
      [46, 168, 5],
      [58, 146, 3.6],
      [52, 182, 3],
      [148, 160, 5.4],
      [142, 140, 3.4],
      [156, 180, 3.2],
      [70, 186, 2.8],
      [132, 186, 3],
    ];
    spots.forEach(([x, y, r], i) => {
      stars += el("path", { d: sparkle(x, y, r), fill: c(ctx, 1), style: TWINKLE(i * 0.35) });
    });
    return {
      back: g(
        { style: CAPE_SWAY },
        outlined("path", { d: CAPE, fill: c(ctx, 0) }, 3.2),
        el("path", { d: CAPE_HEM, fill: "#FFFFFF", opacity: 0.14 }),
        stars,
        outlined("path", { d: CAPE, fill: "none" }, 3.2),
      ),
      front: capeClasp(c(ctx, 1), true),
    };
  },
};

// ─── Held ──────────────────────────────────────────────────────────────────

const STEAM = el("path", {
  d: "M-5 -17 C-8 -21 -2 -23 -5 -28 M3 -17 C0 -21 6 -23 3 -28",
  fill: "none",
  stroke: "#9AA3B5",
  "stroke-width": 2,
  "stroke-linecap": "round",
});

function quill(feather: string, nib: string): string {
  return (
    outlined(
      "path",
      { d: "M0 -30 C10 -24 12 -6 2 10 L-1 10 C-8 -4 -8 -22 0 -30 Z", fill: feather },
      2.4,
    ) +
    el("path", {
      d: "M-1 -16 L-6 -20 M-1 -8 L-7 -12 M1 -18 L7 -23 M1 -10 L8 -14 M1 -2 L7 -5",
      stroke: OUTLINE,
      opacity: 0.3,
      "stroke-width": 1.4,
      "stroke-linecap": "round",
    }) +
    el("path", {
      d: "M0 -26 L0 16",
      stroke: OUTLINE,
      "stroke-width": 1.8,
      "stroke-linecap": "round",
    }) +
    outlined("path", { d: "M-2 10 L2 10 L0 21 Z", fill: nib }, 1.6)
  );
}

const HELD: ShapeTable<"held"> = {
  pencil: (ctx) => ({
    front: g(
      { transform: "rotate(25)" },
      outlined("rect", { x: -5, y: -34, width: 10, height: 8, rx: 2.5, fill: c(ctx, 1) }, 2.4),
      outlined("rect", { x: -5, y: -27, width: 10, height: 4, fill: "#C9CED8" }, 2),
      outlined("rect", { x: -5, y: -23, width: 10, height: 28, fill: c(ctx, 0) }, 2.4),
      el("path", { d: "M-1.6 -22 L-1.6 4", stroke: OUTLINE, opacity: 0.22, "stroke-width": 1.6 }),
      outlined("polygon", { points: "-5,5 5,5 0,17", fill: "#F1D3A8" }, 2.2),
      el("polygon", { points: "-1.8,12.6 1.8,12.6 0,17", fill: OUTLINE }),
    ),
  }),

  book: (ctx) => ({
    front: g(
      { transform: "rotate(-8)" },
      outlined("rect", { x: -17, y: -15, width: 34, height: 27, rx: 3, fill: "#F6F1E6" }, 2.4),
      outlined("rect", { x: -18, y: -17, width: 34, height: 27, rx: 3, fill: c(ctx, 0) }, 2.8),
      outlined("rect", { x: -18, y: -17, width: 6, height: 27, fill: c(ctx, 1) }, 2.2),
      outlined(
        "rect",
        { x: -7, y: -11, width: 18, height: 7, rx: 2, fill: "#FFFFFF", opacity: 0.85 },
        1.6,
      ),
      outlined("path", { d: "M8 10 L8 18 L11 15 L14 18 L14 10", fill: "#E9579A" }, 1.6),
    ),
  }),

  mug: (ctx) => ({
    front:
      STEAM +
      el("path", { d: "M9 -6 C19 -6 19 7 9 7", fill: "none", stroke: OUTLINE, "stroke-width": 6 }) +
      el("path", {
        d: "M9 -6 C19 -6 19 7 9 7",
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 3,
      }) +
      outlined(
        "path",
        {
          d: "M-12 -12 L10 -12 L8 10 C8 12 6 13 4 13 L-6 13 C-8 13 -10 12 -10 10 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      outlined("ellipse", { cx: -1, cy: -12, rx: 11, ry: 3, fill: c(ctx, 1) }, 2.2) +
      el("path", {
        d: "M-6 -4 L4 -4",
        stroke: "#FFFFFF",
        opacity: 0.8,
        "stroke-width": 2.4,
        "stroke-linecap": "round",
      }),
  }),

  highlighter: (ctx) => ({
    front: g(
      { transform: "rotate(28)" },
      outlined("rect", { x: -6, y: -20, width: 12, height: 30, rx: 3, fill: c(ctx, 0) }, 2.4),
      el("rect", { x: -3, y: -12, width: 6, height: 14, rx: 2, fill: "#FFFFFF", opacity: 0.55 }),
      outlined("polygon", { points: "-4,10 4,10 2.5,18 -2.5,18", fill: c(ctx, 1) }, 2),
      outlined("rect", { x: -6.5, y: -27, width: 13, height: 10, rx: 3, fill: c(ctx, 1) }, 2.4),
    ),
  }),

  flashcards: (ctx) => ({
    front:
      g(
        { transform: "rotate(-14)" },
        outlined("rect", { x: -16, y: -13, width: 30, height: 22, rx: 2.5, fill: c(ctx, 0) }, 2.4),
      ) +
      g(
        { transform: "rotate(7)" },
        outlined("rect", { x: -13, y: -10, width: 30, height: 22, rx: 2.5, fill: c(ctx, 0) }, 2.4),
        el("path", { d: "M-13 -4 L17 -4", stroke: "#E9579A", opacity: 0.7, "stroke-width": 1.4 }),
        el("path", {
          d: "M-8 2 L11 2 M-8 7 L6 7",
          stroke: c(ctx, 1),
          "stroke-width": 2,
          "stroke-linecap": "round",
        }),
      ),
  }),

  calculator: (ctx) => {
    let keys = "";
    for (const y of [-1, 5, 11]) {
      for (const x of [-6, 0, 6]) keys += el("circle", { cx: x, cy: y, r: 1.9 });
    }
    return {
      front: g(
        { transform: "rotate(-6)" },
        outlined("rect", { x: -12, y: -18, width: 24, height: 34, rx: 4, fill: c(ctx, 0) }, 2.6),
        outlined("rect", { x: -8, y: -14, width: 16, height: 8, rx: 1.5, fill: c(ctx, 1) }, 1.6),
        g({ fill: "#FFFFFF", opacity: 0.85 }, keys),
      ),
    };
  },

  globe: (ctx) => ({
    front:
      tube("M-16 -4 C-16 10 -5 14 0 14", "#C9CED8", 4.4, 2.2) +
      outlined("circle", { cx: 0, cy: -4, r: 13, fill: c(ctx, 0) }, 2.6) +
      el("path", {
        d: "M-9 -12 C-3 -15 2 -11 -2 -7 C-6 -3 -11 -7 -9 -12 Z M3 0 C9 -2 11 4 7 8 C3 10 1 4 3 0 Z",
        fill: c(ctx, 1),
      }) +
      el("ellipse", {
        cx: 0,
        cy: -4,
        rx: 6,
        ry: 13,
        fill: "none",
        stroke: OUTLINE,
        opacity: 0.22,
        "stroke-width": 1.4,
      }) +
      outlined("circle", { cx: 0, cy: -4, r: 13, fill: "none" }, 2.6) +
      outlined("rect", { x: -8, y: 13, width: 16, height: 5, rx: 2, fill: "#C9CED8" }, 2),
  }),

  "tea-cup": (ctx) => ({
    front:
      STEAM +
      outlined("ellipse", { cx: 0, cy: 12, rx: 16, ry: 4, fill: c(ctx, 1) }, 2.4) +
      el("path", {
        d: "M10 -3 C17 -3 17 6 9 6",
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 5,
      }) +
      el("path", {
        d: "M10 -3 C17 -3 17 6 9 6",
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 2.4,
      }) +
      outlined(
        "path",
        { d: "M-11 -6 L11 -6 C11 6 6 11 0 11 C-6 11 -11 6 -11 -6 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      outlined("ellipse", { cx: 0, cy: -6, rx: 11, ry: 2.6, fill: "#C98A4B" }, 1.6),
  }),

  magnifier: (ctx) => ({
    front: g(
      { transform: "rotate(-20)" },
      tube("M7 9 L15 25", c(ctx, 1), 9, 5.6),
      el("circle", { cx: 0, cy: 0, r: 11, fill: "#DDEBFF", opacity: 0.55 }),
      el("circle", { cx: 0, cy: 0, r: 11, fill: "none", stroke: OUTLINE, "stroke-width": 7 }),
      el("circle", { cx: 0, cy: 0, r: 11, fill: "none", stroke: c(ctx, 0), "stroke-width": 3.6 }),
      SHINE("M-6 -2 L-2 -6", 0.85),
    ),
  }),

  quill: (ctx) => ({ front: g({ transform: "rotate(20)" }, quill(c(ctx, 0), c(ctx, 1))) }),

  telescope: (ctx) => ({
    front: g(
      { transform: "rotate(-38)" },
      outlined("rect", { x: -6, y: -24, width: 12, height: 34, rx: 2, fill: c(ctx, 0) }, 2.6),
      outlined("rect", { x: -8.5, y: -32, width: 17, height: 10, rx: 2, fill: c(ctx, 1) }, 2.4),
      outlined("rect", { x: -3.5, y: 9, width: 7, height: 8, rx: 1.5, fill: c(ctx, 1) }, 2),
      el("rect", { x: -6, y: -6, width: 12, height: 4, fill: c(ctx, 1) }),
      SHINE("M-2 -20 L-2 4", 0.4),
    ),
  }),

  flask: (ctx) => {
    const body =
      "M-4 -12 L-4 -6 L-14 10 C-15 13 -13 15 -10 15 L10 15 C13 15 15 13 14 10 L4 -6 L4 -12 Z";
    let bubbles = "";
    for (const [x, r, delay] of [
      [-4, 2, 0],
      [3, 1.6, 0.8],
      [0, 1.3, 1.5],
    ] as const) {
      bubbles += el("circle", {
        cx: x,
        cy: 10,
        r,
        fill: "#FFFFFF",
        opacity: 0.9,
        style: animate("mc-bubble", 2.2, delay, "ease-in"),
      });
    }
    return {
      front:
        el("path", { d: body, fill: "#EAF6FF" }) +
        el("path", {
          d: "M-9 3 L9 3 L14 10 C15 13 13 15 10 15 L-10 15 C-13 15 -15 13 -14 10 Z",
          fill: c(ctx, 0),
        }) +
        bubbles +
        outlined("path", { d: body, fill: "none" }, 2.6) +
        outlined("rect", { x: -5.5, y: -18, width: 11, height: 6, rx: 2, fill: c(ctx, 1) }, 2.2) +
        SHINE("M-9 8 L-5 1", 0.7),
    };
  },

  lantern: (ctx) => ({
    front:
      el("circle", {
        cx: 0,
        cy: -3,
        r: 18,
        fill: c(ctx, 1),
        opacity: 0.3,
        style: animate("mc-pulse", 2.2),
      }) +
      el("path", {
        d: "M-7 -20 C-7 -28 7 -28 7 -20",
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 2.6,
        "stroke-linecap": "round",
      }) +
      outlined("rect", { x: -9, y: -16, width: 18, height: 24, rx: 3, fill: c(ctx, 1) }, 2.4) +
      el("ellipse", {
        cx: 0,
        cy: -3,
        rx: 4,
        ry: 6,
        fill: "#FFFFFF",
        opacity: 0.8,
        style: animate("mc-pulse", 1.6),
      }) +
      el("path", { d: "M-3.5 -16 L-3.5 8 M3.5 -16 L3.5 8", stroke: c(ctx, 0), "stroke-width": 2 }) +
      outlined("path", { d: "M-10 -16 L10 -16 L7 -21 L-7 -21 Z", fill: c(ctx, 0) }, 2.4) +
      outlined("rect", { x: -11, y: 8, width: 22, height: 6, rx: 2, fill: c(ctx, 0) }, 2.4),
  }),

  "golden-quill": (ctx) => ({
    front:
      el("circle", {
        cx: 2,
        cy: -8,
        r: 20,
        fill: c(ctx, 1),
        opacity: 0.25,
        style: animate("mc-pulse", 2.4),
      }) +
      g({ transform: "rotate(20)" }, quill(c(ctx, 0), OUTLINE)) +
      outlined("path", { d: sparkle(-14, -22, 4.5), fill: c(ctx, 1), style: TWINKLE(0) }, 1.2) +
      outlined("path", { d: sparkle(16, -28, 3.5), fill: c(ctx, 1), style: TWINKLE(0.6) }, 1.2) +
      outlined("path", { d: sparkle(14, 10, 3), fill: c(ctx, 1), style: TWINKLE(1.2) }, 1.2),
  }),
};

// ─── Aura ──────────────────────────────────────────────────────────────────

/** Spots around the mascot, out of the way of its face. */
const AROUND: [number, number, number][] = [
  [22, 60, 7],
  [180, 70, 9],
  [26, 150, 5],
  [176, 150, 6],
  [100, 6, 5],
  [12, 108, 4],
];

function falling(color: string, shape: (x: number, y: number) => string, seconds: number): string {
  return AROUND.map(([x, y], i) =>
    g(
      { transform: `translate(${x} ${y})` },
      g(
        {
          fill: color,
          style: `transform-box: fill-box; transform-origin: center; ${animate("mc-fall", seconds, i * (seconds / 6), "linear")}`,
        },
        shape(0, 0),
      ),
    ),
  ).join("");
}

function rising(make: (x: number, i: number) => string, seconds: number): string {
  return [28, 172, 46, 156, 16, 184]
    .map((x, i) =>
      g({ style: animate("mc-rise", seconds, i * (seconds / 6), "ease-in") }, make(x, i)),
    )
    .join("");
}

const AURA: ShapeTable<"aura"> = {
  glow: (ctx) => ({
    back:
      el("circle", { cx: 100, cy: 104, r: 94, fill: c(ctx, 0), opacity: 0.1 }) +
      el("circle", { cx: 100, cy: 104, r: 74, fill: c(ctx, 0), opacity: 0.16 }),
  }),

  leaves: (ctx) => ({
    front: falling(
      c(ctx, 0),
      (x, y) =>
        outlined(
          "path",
          {
            d: `M${x} ${y - 7} C${x + 6} ${y - 4} ${x + 6} ${y + 4} ${x} ${y + 8} C${x - 6} ${y + 4} ${x - 6} ${y - 4} ${x} ${y - 7} Z`,
          },
          1.6,
        ) +
        el("path", { d: `M${x} ${y - 5} L${x} ${y + 6}`, stroke: c(ctx, 1), "stroke-width": 1.4 }),
      7,
    ),
  }),

  sparkles: (ctx) => ({
    back: el("circle", { cx: 100, cy: 104, r: 92, fill: c(ctx, 0), opacity: 0.09 }),
    front: AROUND.map(([x, y, s], i) =>
      outlined(
        "path",
        { d: sparkle(x, y, s), fill: c(ctx, 1), style: animate("mc-twinkle", 2.2, i * 0.37) },
        1.5,
      ),
    ).join(""),
  }),

  bubbles: (ctx) => ({
    front: rising(
      (x, i) =>
        el("circle", {
          cx: x,
          cy: 186 - (i % 3) * 6,
          r: 5 + (i % 3),
          fill: c(ctx, 0),
          "fill-opacity": 0.25,
          stroke: c(ctx, 0),
          "stroke-width": 2,
        }) +
        el("path", {
          d: `M${x - 2.5} ${184 - (i % 3) * 6} L${x - 1} ${182 - (i % 3) * 6}`,
          stroke: "#FFFFFF",
          "stroke-width": 1.6,
          "stroke-linecap": "round",
        }),
      5,
    ),
  }),

  notes: (ctx) => ({
    front: rising(
      (x, i) =>
        g(
          { transform: `translate(${x} ${178 - (i % 2) * 10})`, fill: c(ctx, 0), stroke: OUTLINE },
          el("path", {
            d: i % 2 ? "M0 0 L0 -14 L9 -17 L9 -3" : "M0 0 L0 -15 L6 -11",
            fill: "none",
            stroke: OUTLINE,
            "stroke-width": 2.2,
            "stroke-linejoin": "round",
          }),
          el("ellipse", { cx: -3, cy: 0, rx: 4, ry: 3, "stroke-width": 1.4 }),
          i % 2 ? el("ellipse", { cx: 6, cy: -3, rx: 4, ry: 3, "stroke-width": 1.4 }) : "",
        ),
      4.4,
    ),
  }),

  snow: (ctx) => ({
    front: falling(
      c(ctx, 0),
      (x, y) =>
        el("path", {
          d: `M${x - 5} ${y} L${x + 5} ${y} M${x - 2.5} ${y - 4.3} L${x + 2.5} ${y + 4.3} M${x - 2.5} ${y + 4.3} L${x + 2.5} ${y - 4.3}`,
          stroke: c(ctx, 0),
          "stroke-width": 2,
          "stroke-linecap": "round",
        }),
      8,
    ),
  }),

  orbit: (ctx) => ({
    back:
      el("circle", { cx: 100, cy: 104, r: 96, fill: c(ctx, 0), opacity: 0.1 }) +
      el("ellipse", {
        cx: 100,
        cy: 108,
        rx: 94,
        ry: 26,
        fill: "none",
        stroke: c(ctx, 0),
        transform: "rotate(-12 100 108)",
        "stroke-width": 2.5,
        "stroke-dasharray": "5 6",
      }),
    front: g(
      {
        style: `transform-origin: 100px 104px; transform-box: view-box; ${animate("mc-spin", 10, 0, "linear")}`,
      },
      outlined("circle", { cx: 100, cy: 10, r: 6, fill: c(ctx, 0) }, 2),
      outlined("circle", { cx: 100, cy: 198, r: 4.5, fill: c(ctx, 1) }, 2),
      outlined("path", { d: sparkle(8, 104, 6), fill: "#FFF3C9" }, 1.4),
    ),
  }),

  "stardust-storm": (ctx) => {
    let ring = "";
    let dust = "";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = i % 2 ? 84 : 92;
      ring += outlined(
        "path",
        {
          d: sparkle(100 + r * Math.cos(a), 104 + r * Math.sin(a), i % 3 === 0 ? 6 : 4),
          fill: c(ctx, 1),
          style: animate("mc-twinkle", 2.4, i * 0.3),
        },
        1.2,
      );
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2;
      dust += el("circle", {
        cx: 100 + 76 * Math.cos(a),
        cy: 104 + 76 * Math.sin(a),
        r: i % 2 ? 1.6 : 2.4,
        fill: c(ctx, 0),
      });
    }
    return {
      back: el("circle", { cx: 100, cy: 104, r: 96, fill: c(ctx, 0), opacity: 0.12 }),
      front:
        g(
          {
            style: `transform-origin: 100px 104px; transform-box: view-box; ${animate("mc-spin", 16, 0, "linear")}`,
          },
          ring,
        ) +
        g(
          {
            opacity: 0.8,
            style: `transform-origin: 100px 104px; transform-box: view-box; ${animate("mc-spin-back", 22, 0, "linear")}`,
          },
          dust,
        ),
    };
  },

  "code-orbit": codeOrbit,
};

// Exotic: code signs circling the mascot, each turning back so it stays upright.
function codeOrbit(ctx: WearContext): WearParts {
  const signs = [
    [100, 10, "{}"],
    [194, 104, "</>"],
    [100, 198, ";"],
    [6, 104, "</>"],
  ] as const;
  let ring = "";
  signs.forEach(([x, y, sign], i) => {
    const badge =
      outlined("circle", { cx: x, cy: y, r: 11, fill: i % 2 ? c(ctx, 1) : c(ctx, 0) }, 2.2) +
      (sign === "</>"
        ? codeSign(x, y, 0.62, "#FF8A98", 1.9)
        : el(
            "text",
            {
              x,
              y: y + 4.6,
              "text-anchor": "middle",
              "font-family": "monospace",
              "font-weight": 700,
              "font-size": 13,
              fill: "#FFFFFF",
            },
            sign,
          ));
    ring += g(
      {
        style: `transform-box: fill-box; transform-origin: center; ${animate("mc-spin-back", 14, 0, "linear")}`,
      },
      badge,
    );
  });
  return {
    back:
      el("circle", { cx: 100, cy: 104, r: 96, fill: c(ctx, 0), opacity: 0.09 }) +
      el("circle", {
        cx: 100,
        cy: 104,
        r: 74,
        fill: c(ctx, 0),
        opacity: 0.12,
        style: `transform-box: fill-box; transform-origin: center; ${animate("mc-breathe", 3)}`,
      }) +
      el("circle", {
        cx: 100,
        cy: 104,
        r: 94,
        fill: "none",
        stroke: c(ctx, 0),
        opacity: 0.45,
        "stroke-width": 2,
        "stroke-dasharray": "3 7",
      }),
    front:
      g(
        {
          style: `transform-origin: 100px 104px; transform-box: view-box; ${animate("mc-spin", 14, 0, "linear")}`,
        },
        ring,
      ) +
      outlined("path", { d: sparkle(160, 30, 5), fill: EXOTIC_GOLD, style: TWINKLE() }, 1.4) +
      outlined("path", { d: sparkle(36, 176, 4), fill: EXOTIC_GOLD, style: TWINKLE(1) }, 1.2),
  };
}

export const WEAR_DRAWINGS = { head: HEAD, face: FACE, outfit: OUTFIT, held: HELD, aura: AURA };
