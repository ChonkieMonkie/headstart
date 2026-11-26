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

// Pack 22, the legacy redraws: new shapes for old items that all looked alike.
// Same ids, rarities and sets as before; each item here replaces its old entry.

import { animate, el, g, heart, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
import {
  BODY,
  c,
  type Draw,
  line,
  type PackDrawings,
  SHINE,
  torso,
  type WearContext,
} from "./kit.ts";

/** A rimmed stroke: a thin outline under a coloured line, so any colour reads. */
const rim = (d: string, color: string, width: number): string =>
  el("path", {
    d,
    fill: "none",
    stroke: OUTLINE,
    "stroke-width": width + 2.4,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }) +
  el("path", {
    d,
    fill: "none",
    stroke: color,
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

const HEAD: Record<string, Draw> = {
  // Common, Lilac, Pink and Sky. A long knit that flops over to one side.
  "slouch-beanie": (ctx: WearContext) => ({
    front:
      outlined(
        "path",
        {
          d: "M-40 8 C-44 -34 26 -42 36 -8 C42 12 44 24 42 34 C38 38 32 32 31 24 C30 14 24 8 8 8 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
      line("M-20 -16 C-12 -20 -4 -20 4 -18 M12 -14 C18 -8 22 -2 22 4", OUTLINE, 1.6, {
        opacity: 0.18,
      }) +
      SHINE("M-26 -20 C-20 -28 -10 -32 0 -32", 0.35) +
      outlined(
        "path",
        { d: "M-41 4 C-20 0 12 0 32 4 L32 16 C12 12 -20 12 -41 16 Z", fill: c(ctx, 1) },
        3,
      ),
  }),

  // Common, Forest and Charcoal. A short, snug ribbed beanie with a thick folded cuff.
  "fisherman-beanie": (ctx: WearContext) => ({
    front:
      outlined("path", { d: "M-36 -6 C-36 -40 36 -40 36 -6 Z", fill: c(ctx, 0) }, 3.2) +
      SHINE("M-22 -24 C-16 -30 -6 -32 4 -32", 0.35) +
      line("M-14 -22 L-14 -13 M0 -24 L0 -13 M14 -22 L14 -13", OUTLINE, 1.6, { opacity: 0.2 }) +
      outlined("rect", { x: -41, y: -12, width: 82, height: 20, rx: 10, fill: c(ctx, 1) }, 3.2) +
      line(
        "M-30 -4 L-30 4 M-20 -4 L-20 4 M-10 -4 L-10 4 M0 -4 L0 4 M10 -4 L10 4 M20 -4 L20 4 M30 -4 L30 4",
        OUTLINE,
        1.6,
        { opacity: 0.22 },
      ),
  }),

  // Common, Berry. Just a band and a brim: no crown, so the top stays open.
  "sun-visor": (ctx: WearContext) => ({
    front:
      tube("M-40 0 C-30 -12 30 -12 40 0", c(ctx, 0), 9, 5.5) +
      outlined(
        "path",
        { d: "M-50 6 C-34 -2 34 -2 50 6 C46 16 -46 16 -50 6 Z", fill: c(ctx, 1) },
        3,
      ) +
      SHINE("M-30 8 C-16 4 16 4 30 8", 0.3),
  }),

  // Uncommon, Ocean. A round white sailor cap with a blue band and two ribbon tails.
  "sailor-cap": (ctx: WearContext) => ({
    front:
      outlined(
        "path",
        { d: "M-30 2 C-34 14 -36 24 -40 32 L-32 36 C-28 28 -24 16 -22 4 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      outlined(
        "path",
        { d: "M22 4 C24 16 28 28 32 36 L40 32 C36 24 34 14 30 2 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      outlined(
        "path",
        { d: "M-38 6 C-38 -22 -20 -26 0 -26 C20 -26 38 -22 38 6 Z", fill: c(ctx, 1) },
        3.2,
      ) +
      SHINE("M-26 -10 C-20 -18 -10 -21 -2 -21", 0.4) +
      outlined("rect", { x: -39, y: 0, width: 78, height: 9, rx: 4, fill: c(ctx, 0) }, 3),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Red and Blue. Frames with upswept outer corners.
  "cat-eye-glasses": (ctx: WearContext) => {
    const { ex1, ex2, ey } = ctx.geo;
    const lens = (cx: number, s: number): string => {
      const d = `M${cx - s * 10} ${ey - 5} Q${cx} ${ey - 10} ${cx + s * 16} ${ey - 13} Q${cx + s * 19} ${ey} ${cx + s * 12} ${ey + 7} Q${cx} ${ey + 10} ${cx - s * 10} ${ey - 5} Z`;
      return (
        el("path", { d, fill: "#DDEBFF", opacity: 0.35 }) +
        rim(d, c(ctx, 0), 2.6) +
        line(`M${cx - s * 6} ${ey - 4} L${cx - s * 2} ${ey - 7}`, "#FFFFFF", 2)
      );
    };
    return {
      front:
        lens(ex1, -1) +
        lens(ex2, 1) +
        rim(`M${ex1 + 10} ${ey - 5} Q100 ${ey - 10} ${ex2 - 10} ${ey - 5}`, c(ctx, 0), 2.6),
    };
  },

  // Uncommon, Rose. Teardrop shades with a thin double bridge.
  aviators: (ctx: WearContext) => {
    const { ex1, ex2, ey } = ctx.geo;
    const drop = (x: number): string =>
      `M${x - 13} ${ey - 6} C${x - 13} ${ey - 12} ${x + 13} ${ey - 12} ${x + 13} ${ey - 6} C${x + 13} ${ey + 4} ${x + 5} ${ey + 13} ${x} ${ey + 14} C${x - 5} ${ey + 13} ${x - 13} ${ey + 4} ${x - 13} ${ey - 6} Z`;
    const lens = (x: number): string =>
      el("path", { d: drop(x), fill: c(ctx, 1), opacity: 0.92 }) +
      rim(drop(x), c(ctx, 0), 2.4) +
      line(`M${x - 8} ${ey - 3} L${x - 4} ${ey - 7}`, "#FFFFFF", 1.8, { opacity: 0.8 });
    return {
      front:
        lens(ex1) +
        lens(ex2) +
        rim(`M${ex1 + 13} ${ey - 5} Q100 ${ey - 10} ${ex2 - 13} ${ey - 5}`, c(ctx, 0), 1.6) +
        rim(`M${ex1 + 13} ${ey - 1} Q100 ${ey - 5} ${ex2 - 13} ${ey - 1}`, c(ctx, 0), 1.6),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Green, Lilac and Grey. A chunky knit neck warmer with a cable pattern.
  cowl: (ctx: WearContext) => ({
    front:
      outlined("rect", { x: -42, y: -10, width: 84, height: 24, rx: 12, fill: c(ctx, 0) }, 3.2) +
      [-30, -16, -2, 12, 26]
        .map((x: number) =>
          line(`M${x} -4 C${x + 5} -1 ${x - 5} 2 ${x} 5 S${x + 5} 8 ${x} 11`, OUTLINE, 1.8, {
            opacity: 0.3,
          }),
        )
        .join("") +
      outlined("rect", { x: -40, y: -10, width: 80, height: 6, rx: 3, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-30 0 C-24 -2 -18 -2 -12 0", 0.4),
  }),

  // Rare, Berry. An open knitted cardigan with buttons and pockets; a mug steams in one pocket.
  cardigan: (ctx: WearContext) => ({
    torso: torso(
      ctx,
      // Two open panels, so the buddy's own body shows through the gap.
      outlined(
        "path",
        { d: "M66 122 L94 122 L94 180 L80 180 C64 172 60 146 66 122 Z", fill: c(ctx, 0) },
        3.2,
      ) +
        outlined(
          "path",
          { d: "M134 122 L106 122 L106 180 L120 180 C136 172 140 146 134 122 Z", fill: c(ctx, 0) },
          3.2,
        ) +
        outlined("rect", { x: 68, y: 138, width: 10, height: 16, rx: 2, fill: "#FFFFFF" }, 1.8) +
        outlined("path", { d: "M78 143 C84 143 84 151 78 151", fill: "none" }, 1.8) +
        g(
          { style: animate("mc-bubble", 2.6) },
          line("M71 136 C68 132 74 129 71 124", "#9AA3B5", 1.8) +
            line("M76 136 C73 132 79 129 76 124", "#9AA3B5", 1.8),
        ) +
        outlined(
          "path",
          { d: "M68 150 L92 150 L92 166 C88 168 72 168 68 166 Z", fill: c(ctx, 1) },
          2.2,
        ) +
        outlined(
          "path",
          { d: "M108 150 L132 150 L132 166 C128 168 112 168 108 166 Z", fill: c(ctx, 1) },
          2.2,
        ) +
        outlined("rect", { x: 64, y: 172, width: 30, height: 8, rx: 3, fill: c(ctx, 1) }, 2.2) +
        outlined("rect", { x: 106, y: 172, width: 30, height: 8, rx: 3, fill: c(ctx, 1) }, 2.2) +
        [128, 140]
          .map((y: number) => outlined("circle", { cx: 89, cy: y, r: 2.2, fill: c(ctx, 2) }, 1.4))
          .join(""),
    ),
  }),

  // Rare, Ocean. A striped shirt with a big square sailor collar and a neckerchief that sways.
  "sailor-shirt": (ctx: WearContext) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        line("M70 164 L130 164 M72 176 L128 176", c(ctx, 2), 4) +
        outlined(
          "path",
          {
            d: "M66 122 L94 122 L100 138 L106 122 L134 122 L140 150 L120 156 L100 146 L80 156 L60 150 Z",
            fill: "#FFFFFF",
          },
          2.8,
        ) +
        line("M60 150 L80 156 L100 146 L120 156 L140 150", c(ctx, 1), 3.4),
    ),
    front: g(
      { style: `transform-box: fill-box; transform-origin: 50% 0%; ${animate("mc-sway", 3.4)}` },
      outlined("path", { d: "M-11 -4 L11 -4 L0 17 Z", fill: c(ctx, 1) }, 2.6) +
        el("circle", { cx: -4, cy: 3, r: 1.3, fill: "#FFFFFF" }) +
        el("circle", { cx: 4, cy: 7, r: 1.3, fill: "#FFFFFF" }) +
        outlined("circle", { cx: 0, cy: -3, r: 4.2, fill: c(ctx, 1) }, 2.2),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Purple. A ballpoint pen with a clip and a click button.
  "click-pen": (ctx: WearContext) => ({
    front: g(
      { transform: "rotate(25)" },
      outlined("rect", { x: -3, y: -35, width: 6, height: 5, rx: 2, fill: c(ctx, 1) }, 2.2) +
        outlined("rect", { x: -5, y: -30, width: 10, height: 8, rx: 2, fill: "#9AA3B5" }, 2.2) +
        outlined("rect", { x: -5, y: -22, width: 10, height: 30, rx: 3.5, fill: c(ctx, 0) }, 2.4) +
        outlined("rect", { x: 5, y: -24, width: 3, height: 26, rx: 1.5, fill: "#9AA3B5" }, 1.8) +
        line("M-2 -16 L-2 4", "#FFFFFF", 1.6, { opacity: 0.7 }) +
        outlined("path", { d: "M-5 8 L5 8 L0 19 Z", fill: "#9AA3B5" }, 2.2),
    ),
  }),

  // Common, Sunny. A notebook with a spiral binding and lined pages.
  "spiral-notebook": (ctx: WearContext) => ({
    front: g(
      { transform: "rotate(-8)" },
      outlined("rect", { x: -14, y: -16, width: 30, height: 32, rx: 3, fill: c(ctx, 0) }, 2.8) +
        outlined("rect", { x: -8, y: -12, width: 20, height: 24, rx: 1.5, fill: "#FFFFFF" }, 1.8) +
        line("M-4 -6 H10 M-4 0 H10 M-4 6 H10 M-4 12 H10", c(ctx, 1), 1.4, { opacity: 0.7 }) +
        outlined("rect", { x: -14, y: -16, width: 6, height: 32, fill: c(ctx, 1) }, 2.2) +
        [-11, -3, 5, 13]
          .map((y: number) =>
            outlined("ellipse", { cx: -15, cy: y, rx: 3.6, ry: 2.4, fill: "none" }, 1.8),
          )
          .join(""),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Mint. Soft ribbons swirl around the buddy and twinkle.
  "mint-swirl": (ctx: WearContext) => {
    const ribbon = (d: string): string =>
      el("path", {
        d,
        fill: "none",
        stroke: OUTLINE,
        "stroke-width": 9,
        "stroke-linecap": "round",
        opacity: 0.25,
      }) +
      el("path", {
        d,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 6,
        "stroke-linecap": "round",
        opacity: 0.6,
      }) +
      el("path", {
        d,
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 1.5,
        "stroke-linecap": "round",
        opacity: 0.6,
      });
    const sparks: [number, number, number, number][] = [
      [34, 50, 5, 0],
      [168, 88, 4.5, 0.8],
      [28, 150, 4, 1.6],
      [176, 156, 4.5, 2.4],
    ];
    return {
      front:
        g(
          { style: animate("mc-bob", 3.6) },
          ribbon("M52 60 C30 80 26 110 36 130 C44 146 28 160 22 174") +
            ribbon("M62 76 C44 92 42 116 50 134") +
            ribbon("M148 56 C170 76 176 106 164 126 C156 142 172 158 178 174") +
            ribbon("M138 72 C156 90 158 116 150 134"),
        ) +
        sparks
          .map(([x, y, s, d]: [number, number, number, number]) =>
            el("path", {
              d: sparkle(x, y, s),
              fill: c(ctx, 0),
              stroke: OUTLINE,
              "stroke-width": 1.4,
              style: animate("mc-twinkle", 2.2, d),
            }),
          )
          .join(""),
    };
  },

  // Rare, Rose. Small hearts pulse around the buddy, one after another.
  "heart-beats": (ctx: WearContext) => {
    const hearts: [number, number, number][] = [
      [34, 58, 7.5],
      [170, 50, 7],
      [26, 122, 6.5],
      [176, 118, 7],
    ];
    return {
      front: hearts
        .map(([x, y, s]: [number, number, number], i: number) =>
          g(
            { style: animate("mc-pulse", 2.4, i * 0.6) },
            el("path", {
              d: heart(x, y, s),
              fill: c(ctx, 0),
              stroke: OUTLINE,
              "stroke-width": 1.8,
              "stroke-linejoin": "round",
            }) +
              el("circle", {
                cx: x - s * 0.45,
                cy: y - s * 0.3,
                r: s * 0.16,
                fill: "#FFFFFF",
                opacity: 0.8,
              }),
          ),
        )
        .join(""),
    };
  },
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
