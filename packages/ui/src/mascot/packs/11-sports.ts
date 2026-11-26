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

// Pack 11, sports: training, games and winning, drawn without text or logos.
// Every item uses at most three colours of its own, besides the shared outline
// and white shine.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import { BODY, c, type Draw, eyesOf, line, type PackDrawings, SHINE, torso } from "./kit.ts";

// The drop shape, centred on (0, 0), about 12 px tall.
const DROP = "M0 -9 C4 -3 6 1 6 4 C6 8 3 10 0 10 C-3 10 -6 8 -6 4 C-6 1 -4 -3 0 -9 Z";

const leaf = (x: number, y: number, rot: number, fill: string, rx: number, ry: number): string =>
  outlined("ellipse", { cx: x, cy: y, rx, ry, fill, transform: `rotate(${rot} ${x} ${y})` }, 1.4);

/** Leaves along a circle, mirrored across the vertical line through cx. */
function laurel(
  cx: number,
  cy: number,
  r: number,
  angles: readonly number[],
  fill: string,
  rx: number,
  ry: number,
): string {
  return angles
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      const rot = a + 115;
      return leaf(x, y, rot, fill, rx, ry) + leaf(2 * cx - x, y, 180 - rot, fill, rx, ry);
    })
    .join("");
}

const HEAD: Record<string, Draw> = {
  // Common, Sports. A tight swim cap with a wavy edge.
  "swim-cap": (ctx) => ({
    front:
      outlined("path", { d: "M-37 6 C-39 -34 39 -34 37 6 Z", fill: c(ctx, 0) }, 3.2) +
      SHINE("M-26 -16 C-20 -25 -11 -28 -4 -28", 0.5) +
      outlined(
        "path",
        { d: "M-38 3 C-30 10 30 10 38 3 L38 12 C30 19 -30 19 -38 12 Z", fill: c(ctx, 1) },
        2.6,
      ),
  }),

  // Common, Sports. A referee cap with white stripes and a peak.
  "referee-cap": (ctx) => ({
    front:
      outlined("path", { d: "M-30 6 C-32 -30 32 -30 30 6 Z", fill: c(ctx, 0) }, 3.2) +
      line("M-13 -15 L-13 3 M0 -19 L0 3 M13 -15 L13 3", "#FFFFFF", 3.2, { opacity: 0.9 }) +
      outlined(
        "path",
        {
          d: "M-34 4 C-18 10 18 10 34 4 C36 13 22 18 0 18 C-22 18 -36 13 -34 4 Z",
          fill: c(ctx, 1),
        },
        3,
      ),
  }),

  // Uncommon, Sports. A bike helmet with vents and a chin strap.
  "cycling-helmet": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-36 6 C-38 -26 -18 -34 2 -34 C24 -34 38 -22 36 6 C20 12 -20 12 -36 6 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
      outlined("rect", { x: -20, y: -24, width: 13, height: 4.5, rx: 2.2, fill: c(ctx, 1) }, 1.6) +
      outlined("rect", { x: -3, y: -28, width: 13, height: 4.5, rx: 2.2, fill: c(ctx, 1) }, 1.6) +
      outlined("rect", { x: 14, y: -21, width: 12, height: 4.5, rx: 2.2, fill: c(ctx, 1) }, 1.6) +
      SHINE("M-27 -12 C-24 -20 -17 -25 -10 -27", 0.5) +
      line("M-30 6 C-30 16 -20 22 -8 22", OUTLINE, 2, { opacity: 0.5 }),
  }),

  // Rare, Sports. A small laurel wreath with berries, and one sparkle.
  "laurel-wreath": (ctx) => ({
    front:
      laurel(0, 12, 40, [190, 203, 216, 229, 242, 255], c(ctx, 0), 6.5, 3.2) +
      outlined("circle", { cx: 0, cy: -26, r: 3.2, fill: c(ctx, 1) }, 1.6) +
      el("path", {
        d: sparkle(-24, -36, 4),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1,
        style: animate("mc-twinkle", 2.2),
      }),
  }),
};

const FACE: Record<string, Draw> = {
  // Uncommon, Sports. Paint stripes under each eye, like a team's game day.
  "face-paint-stripes": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    return {
      front: [x1, x2]
        .map(
          (x) =>
            line(`M${x - 8} ${y + 9} L${x + 8} ${y + 11.5}`, c(ctx, 0), 3.4) +
            line(`M${x - 7} ${y + 15} L${x + 7} ${y + 16.5}`, c(ctx, 1), 2.6),
        )
        .join(""),
    };
  },

  // Common, Sports. A sweat drop at the temple, after a good training session.
  "sweat-drop": (ctx) => {
    const y = ctx.geo.ey;
    const x2 = ctx.geo.ex2;
    return {
      front:
        g(
          { transform: `translate(${x2 + 13} ${y - 15})` },
          outlined("path", { d: DROP, fill: c(ctx, 0) }, 2.4),
          line("M-3 -1 C-3 -4 -2 -5 0 -6", "#FFFFFF", 1.6, { opacity: 0.9 }),
        ) +
        g(
          { transform: `translate(${x2 + 23} ${y + 4}) scale(0.6)` },
          outlined("path", { d: DROP, fill: c(ctx, 1) }, 3),
        ),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Sports. A team jersey with a collar and a hem stripe, no text.
  "team-jersey": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.5) +
        outlined("path", { d: "M86 121 C91 134 109 134 114 121 Z", fill: c(ctx, 1) }, 2.2) +
        line("M74 170 L126 170", c(ctx, 1), 5, { "stroke-linecap": "butt" }),
    ),
  }),

  // Common, Sports. A towel draped over the shoulders, with stripes and two ends.
  "sweat-towel": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        { d: "M66 124 C72 152 128 152 134 124 L138 136 C126 166 74 166 62 136 Z", fill: c(ctx, 0) },
        3,
      ) +
        line(
          "M76 142 L80 156 M92 148 L94 162 M108 148 L106 162 M124 142 L120 156",
          c(ctx, 1),
          2.6,
        ) +
        outlined("rect", { x: 66, y: 148, width: 12, height: 22, rx: 5, fill: c(ctx, 0) }, 2.6) +
        outlined("rect", { x: 122, y: 148, width: 12, height: 22, rx: 5, fill: c(ctx, 0) }, 2.6),
    ),
  }),

  // Uncommon, Sports. A winner's sash across the chest with a rosette.
  "winners-sash": (ctx) => ({
    torso: torso(
      ctx,
      tube("M68 122 C88 146 106 156 124 170", c(ctx, 0), 12, 8.5) +
        outlined("circle", { cx: 124, cy: 170, r: 7, fill: c(ctx, 1) }, 2.4) +
        el("circle", { cx: 122, cy: 168, r: 2.4, fill: "#FFFFFF", opacity: 0.7 }),
    ),
  }),

  // Uncommon, Sports. A zip-up tracksuit with side stripes.
  "tracksuit-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        outlined("path", { d: "M84 122 L100 140 L116 122 Z", fill: c(ctx, 1) }, 2.4) +
        line("M100 140 L100 180", OUTLINE, 1.8, { opacity: 0.35, "stroke-dasharray": "3 3" }) +
        line("M71 134 L75 178 M129 134 L125 178", c(ctx, 1), 4) +
        outlined("rect", { x: 97, y: 150, width: 6, height: 9, rx: 2, fill: c(ctx, 1) }, 1.6),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Sports. A squeezy water bottle with a cap and a label.
  "water-bottle": (ctx) => ({
    front:
      outlined("rect", { x: -8, y: -2, width: 16, height: 26, rx: 7, fill: c(ctx, 0) }, 2.6) +
      outlined("rect", { x: -5, y: -8, width: 10, height: 7, rx: 2.5, fill: c(ctx, 1) }, 2.2) +
      el("rect", { x: -7, y: 9, width: 14, height: 8, fill: "#FFFFFF", opacity: 0.75 }) +
      SHINE("M-4 2 C-5 6 -5 12 -4 16", 0.6),
  }),

  // Uncommon, Sports. A racket hanging by its grip, with strings.
  "tennis-racket": (ctx) => ({
    front:
      tube("M0 -4 L4 3", c(ctx, 1), 6.5, 3.6) +
      outlined("ellipse", { cx: 4, cy: 14, rx: 9.5, ry: 12, fill: c(ctx, 0) }, 2.8) +
      el("ellipse", { cx: 4, cy: 14, rx: 6.5, ry: 9, fill: "#DDEBFF" }) +
      line("M-1 10 L9 10 M-1 14 L9 14 M-1 18 L9 18 M4 5 L4 23", "#9AA3B5", 1),
  }),

  // Uncommon, Sports. A football with pentagon patches and seams.
  football: (ctx) => ({
    front:
      outlined("circle", { cx: 0, cy: -12, r: 12, fill: c(ctx, 0) }, 2.6) +
      outlined(
        "path",
        { d: "M0 -18 L4.8 -14.5 L3 -8.8 L-3 -8.8 L-4.8 -14.5 Z", fill: c(ctx, 1) },
        1.4,
      ) +
      line(
        "M0 -18 L0 -23 M4.8 -14.5 L10.4 -16 M3 -8.8 L7.6 -5.6 M-3 -8.8 L-7.6 -5.6 M-4.8 -14.5 L-10.4 -16",
        OUTLINE,
        1.2,
        { opacity: 0.4 },
      ),
  }),

  // Rare, Sports. A bouncing basketball.
  basketball: (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("circle", { cx: 0, cy: -13, r: 13, fill: c(ctx, 0) }, 2.8),
      line(
        "M-12 -13 L12 -13 M0 -25 L0 -1 M-9 -21 C-4 -16 -4 -10 -9 -5 M9 -21 C4 -16 4 -10 9 -5",
        OUTLINE,
        1.4,
        { opacity: 0.55 },
      ),
      SHINE("M-7 -21 C-4 -23 -1 -24 2 -24", 0.6),
    ),
  }),

  // Rare, Sports. A shuttlecock that bobs on its cork.
  shuttlecock: (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.6) },
      outlined(
        "path",
        { d: "M-13 -26 C-6 -31 6 -31 13 -26 L4.5 -7 L-4.5 -7 Z", fill: c(ctx, 0) },
        2.6,
      ),
      line("M0 -8 L-8 -29 M0 -8 L0 -30 M0 -8 L8 -29", OUTLINE, 1.1, { opacity: 0.3 }),
      outlined("circle", { cx: 0, cy: -3, r: 4.6, fill: c(ctx, 1) }, 2.2),
    ),
  }),

  // Rare, Sports. A small skateboard that bobs at the hand.
  skateboard: (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("rect", { x: -24, y: -12, width: 48, height: 8, rx: 4, fill: c(ctx, 0) }, 2.6),
      line("M-18 -8 L18 -8", "#FFFFFF", 1.4, { opacity: 0.5 }),
      outlined("circle", { cx: -14, cy: 0, r: 3.8, fill: c(ctx, 1) }, 2),
      outlined("circle", { cx: 14, cy: 0, r: 3.8, fill: c(ctx, 1) }, 2),
    ),
  }),

  // Rare, Sports. A skipping rope with two handles, swinging gently.
  "jump-rope": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.8) },
      tube("M-7 0 C-17 20 17 20 7 0", c(ctx, 1), 4.6, 2.2),
      outlined("rect", { x: -11, y: -15, width: 7, height: 15, rx: 3.5, fill: c(ctx, 0) }, 2.2),
      outlined("rect", { x: 4, y: -15, width: 7, height: 15, rx: 3.5, fill: c(ctx, 0) }, 2.2),
    ),
  }),

  // Rare, Sports. A referee whistle with sound waves that twinkle.
  whistle: (ctx) => ({
    front:
      line("M-6 -6 C-8 -16 6 -16 4 -6", OUTLINE, 2) +
      outlined("rect", { x: -10, y: -6, width: 16, height: 12, rx: 5, fill: c(ctx, 0) }, 2.6) +
      outlined("rect", { x: 4, y: -3, width: 9, height: 6, rx: 2.5, fill: c(ctx, 0) }, 2.2) +
      el("circle", { cx: 10, cy: 0, r: 1.5, fill: OUTLINE }) +
      g(
        { style: animate("mc-twinkle", 1.8) },
        line("M19 -6 Q23 0 19 6", c(ctx, 1), 2.2) + line("M24 -10 Q32 0 24 10", c(ctx, 1), 2.2),
      ),
  }),

  // Epic, Sports. A stopwatch whose hand sweeps round.
  "race-stopwatch": (ctx) => ({
    front:
      outlined("rect", { x: -3.5, y: -25, width: 7, height: 7, rx: 2, fill: c(ctx, 1) }, 2) +
      outlined("circle", { cx: 0, cy: -4, r: 14, fill: c(ctx, 0) }, 2.8) +
      el("circle", { cx: 0, cy: -4, r: 10.5, fill: "#FFFFFF" }) +
      line("M0 -13 L0 -11 M11 -4 L9 -4 M0 5 L0 3 M-11 -4 L-9 -4", OUTLINE, 1.6) +
      g(
        {
          style: `transform-box: fill-box; transform-origin: center; ${animate("mc-spin", 2.4, 0, "linear")}`,
        },
        line("M0 -12 L0 4", OUTLINE, 2.2),
      ) +
      el("circle", { cx: 0, cy: -4, r: 1.8, fill: c(ctx, 1) }),
  }),

  // Epic, Sports. A gold trophy with twinkling sparkles.
  "trophy-cup": (ctx) => ({
    front:
      tube("M-10 -27 C-19 -28 -19 -12 -8 -10", c(ctx, 0), 6, 3) +
      tube("M10 -27 C19 -28 19 -12 8 -10", c(ctx, 0), 6, 3) +
      outlined(
        "path",
        { d: "M-12 -32 L12 -32 C12 -18 8 -12 0 -12 C-8 -12 -12 -18 -12 -32 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      outlined("rect", { x: -3, y: -12.5, width: 6, height: 6, fill: c(ctx, 0) }, 1.8) +
      outlined("rect", { x: -8, y: -7, width: 16, height: 7, rx: 2.5, fill: c(ctx, 1) }, 2.2) +
      el("path", { d: star(0, -23, 5), fill: "#FFFFFF", stroke: OUTLINE, "stroke-width": 1 }) +
      SHINE("M-7 -28 C-6 -25 -6 -21 -6 -18", 0.7) +
      el("path", {
        d: sparkle(16, -38, 4.5),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2),
      }) +
      el("path", {
        d: sparkle(-18, -40, 3.5),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2, 1),
      }),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare, Sports. Speed lines on both sides that slide past.
  "speed-lines": (ctx) => {
    const lines: [string, number, number][] = [
      ["M22 62 L54 62", 0, 0],
      ["M30 84 L60 84", 0, 0.4],
      ["M18 106 L50 106", 0, 0.8],
      ["M26 140 L48 140", 0, 1.2],
      ["M146 64 L178 64", 1, 0.2],
      ["M140 86 L170 86", 1, 0.6],
      ["M150 108 L182 108", 1, 1],
      ["M152 142 L174 142", 1, 1.4],
    ];
    return {
      front: lines
        .map(([d = "", k = 0, delay = 0]) =>
          line(d, c(ctx, k), 3.2, { style: animate("mc-shimmer", 2.2, delay, "linear") }),
        )
        .join(""),
    };
  },

  // Epic, Sports. Confetti that drifts down past the buddy.

  // Legendary, Sports. A gold laurel ring around the buddy, with a warm glow and stars.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
