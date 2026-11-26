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

// Pack 16, science: a theme pack for the lab bench and the whiteboard. No set
// and no background. Every item here uses at most three colours of its own,
// besides the shared outline, white shine and neutral greys.

import { animate, el, g, OUTLINE, outlined, sparkle, tube } from "../svg.ts";
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

/** A gear outline with `teeth` teeth, centred on (x, y). */
const gearPath = (x: number, y: number, outer: number, inner: number, teeth: number): string => {
  const points: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / teeth;
    points.push(
      `${(x + radius * Math.cos(angle)).toFixed(2)} ${(y + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return `M${points.join(" L")} Z`;
};

/** One electron on a small tilted orbit around the atom centre (0, -13). */
const electronOrbit = (angle: number, ink: string, delay: number): string =>
  g(
    { transform: `translate(0 -13) rotate(${angle})` },
    el("ellipse", { cx: 0, cy: 0, rx: 19, ry: 7, fill: "none", stroke: ink, "stroke-width": 2.2 }) +
      el("circle", {
        cx: 19,
        cy: 0,
        r: 3,
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2.2, delay),
      }),
  );

/** A lit electron: a dark ring around a white centre, blinking. */
const electron = (x: number, y: number, fill: string, delay: number): string =>
  el("circle", {
    cx: x,
    cy: y,
    r: 5,
    fill,
    stroke: OUTLINE,
    "stroke-width": 1.8,
    style: animate("mc-twinkle", 2, delay),
  }) + el("circle", { cx: x, cy: y, r: 1.8, fill: "#FFFFFF" });

const HEAD: Record<string, Draw> = {
  // Common, Science. A dome cap with a gear on the front that turns when you think.
  "thinking-cap": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-34 6 C-34 -30 -22 -40 0 -40 C22 -40 34 -30 34 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      SHINE("M-28 -6 C-28 -16 -24 -26 -16 -32", 0.4) +
      outlined("path", { d: gearPath(0, -20, 10, 7.5, 8), fill: c(ctx, 1) }, 2.2) +
      el("circle", {
        cx: 0,
        cy: -20,
        r: 3,
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.4,
      }) +
      outlined("rect", { x: -38, y: 0, width: 76, height: 9, rx: 4.5, fill: c(ctx, 0) }, 3),
  }),

  // Common, Science. A hair net over a bun, with a little mesh pattern.
  "lab-hair-net": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-36 6 C-36 -20 -20 -28 0 -28 C20 -28 36 -20 36 6 C20 12 -20 12 -36 6 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      [
        [-22, -12],
        [-11, -12],
        [0, -12],
        [11, -12],
        [22, -12],
        [-16, -3],
        [-5, -3],
        [6, -3],
        [17, -3],
      ]
        .map(([x = 0, y = 0]) => el("circle", { cx: x, cy: y, r: 2.1, fill: c(ctx, 1) }))
        .join("") +
      outlined("circle", { cx: 0, cy: -31, r: 8, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-24 -14 C-22 -22 -16 -25 -10 -26", 0.45),
  }),

  // Uncommon, Science. A lab hard hat with a ridge down the top.
  "hard-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-32 6 C-32 -26 -18 -36 0 -36 C18 -36 32 -26 32 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      line("M-12 -30 C-14 -18 -14 -6 -14 4", OUTLINE, 1.6, { opacity: 0.25 }) +
      line("M12 -30 C14 -18 14 -6 14 4", OUTLINE, 1.6, { opacity: 0.25 }) +
      SHINE("M-22 -18 C-20 -26 -14 -30 -8 -31", 0.5) +
      outlined(
        "path",
        { d: "M-42 6 C-30 0 30 0 42 6 C42 12 34 14 0 14 C-34 14 -42 12 -42 6 Z", fill: c(ctx, 1) },
        2.8,
      ),
  }),

  // Rare, Science. A tiny atom on the forehead, with two electrons orbiting.
  "atom-headband": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      electronOrbit(60, c(ctx, 1), 0) +
      electronOrbit(-60, c(ctx, 1), 1.1) +
      outlined("circle", { cx: 0, cy: -13, r: 5, fill: c(ctx, 1) }, 2.2),
  }),

  // Rare, Science. Hair that stands up with static, and sparks that flicker.
  "static-hair": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-36 8 C-42 -8 -38 -22 -28 -28 L-32 -44 L-17 -36 L-10 -52 L1 -38 L12 -54 L16 -38 L30 -46 L26 -30 C38 -24 42 -8 36 8 C20 2 -20 2 -36 8 Z",
          fill: c(ctx, 0),
        },
        3,
      ) +
      SHINE("M-24 -22 C-20 -28 -14 -31 -9 -32", 0.45) +
      el("path", {
        d: sparkle(-30, -56, 6),
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-twinkle", 1.8),
      }) +
      el("path", {
        d: sparkle(34, -50, 5),
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.4,
        style: animate("mc-twinkle", 1.8, 0.9),
      }),
  }),
};

const FACE: Record<string, Draw> = {
  // Common, Science. A chalk smudge on one cheek, from the whiteboard.
  "chalk-smudge": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br} ${ctx.geo.by}) rotate(-14)` },
      outlined(
        "path",
        {
          d: "M-10 0 C-10 -6 -3 -8 1 -6 C6 -8 11 -4 10 1 C9 6 3 7 0 5 C-5 7 -10 5 -10 0 Z",
          fill: c(ctx, 0),
        },
        1.8,
      ),
      line("M-5 -2 L5 -2", "#FFFFFF", 1.4, { opacity: 0.8 }),
      line("M-4 3 L4 3", "#FFFFFF", 1.2, { opacity: 0.7 }),
    ),
  }),

  // Uncommon, Science. Lab goggles pushed up on the forehead, not over the eyes.
  "forehead-goggles": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const fy = y - 24;
    const half = ctx.geo.headHalfWidth;
    const lens = (x: number): string =>
      outlined("circle", { cx: x, cy: fy, r: 11, fill: c(ctx, 1), "fill-opacity": 0.6 }, 2.4) +
      el("circle", {
        cx: x,
        cy: fy,
        r: 8.5,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 2.4,
      }) +
      line(`M${x - 5} ${fy - 3} L${x - 2} ${fy - 6}`, "#FFFFFF", 1.6, { opacity: 0.9 });
    return {
      front:
        tube(`M${100 - half + 2} ${fy} L${100 + half - 2} ${fy}`, c(ctx, 0), 6, 2.8) +
        lens(x1) +
        lens(x2),
    };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Science. A lab coat with lapels, a chest pocket and buttons.
  "lab-coat": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.2) +
        outlined("path", { d: "M80 122 L98 152 L92 122 Z", fill: c(ctx, 1) }, 2) +
        outlined("path", { d: "M120 122 L102 152 L108 122 Z", fill: c(ctx, 1) }, 2) +
        outlined("rect", { x: 110, y: 142, width: 14, height: 12, rx: 2.5, fill: c(ctx, 1) }, 1.8) +
        line("M118 144 L121 132", "#9AA3B5", 2.4) +
        [162, 174].map((y) => el("circle", { cx: 100, cy: y, r: 1.8, fill: OUTLINE })).join(""),
    ),
  }),

  // Common, Science. A red horseshoe magnet pinned on the chest.
  "magnet-pin": (ctx) => ({
    torso: torso(
      ctx,
      tube("M90 132 L90 146 A10 10 0 0 0 110 146 L110 132", c(ctx, 0), 7.5, 4.2) +
        outlined("rect", { x: 85, y: 126, width: 10, height: 6, rx: 2, fill: c(ctx, 1) }, 1.8) +
        outlined("rect", { x: 105, y: 126, width: 10, height: 6, rx: 2, fill: c(ctx, 1) }, 1.8),
    ),
  }),

  // Uncommon, Science. A plastic pocket protector with pens lined up in it.
  "pocket-protector": (ctx) => ({
    torso: torso(
      ctx,
      outlined("rect", { x: 92, y: 124, width: 4.5, height: 20, rx: 2, fill: c(ctx, 1) }, 1.6) +
        outlined("rect", { x: 101, y: 121, width: 4.5, height: 22, rx: 2, fill: "#FFFFFF" }, 1.6) +
        outlined(
          "rect",
          { x: 88, y: 136, width: 24, height: 26, rx: 4, fill: c(ctx, 0), "fill-opacity": 0.85 },
          2.4,
        ) +
        line("M94 150 L106 150", OUTLINE, 1.2, { opacity: 0.3 }),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Science. A wooden abacus with four rods of beads.
  abacus: (ctx) => ({
    front:
      outlined("rect", { x: -14, y: -30, width: 28, height: 40, rx: 4, fill: c(ctx, 0) }, 2.8) +
      [-22, -12, -2, 8]
        .map(
          (y) =>
            line(`M-10 ${y} L10 ${y}`, OUTLINE, 1.4) +
            [-7, 0, 7]
              .map((x) => outlined("circle", { cx: x, cy: y - 3, r: 2.8, fill: c(ctx, 1) }, 1.2))
              .join(""),
        )
        .join(""),
  }),

  // Uncommon, Science. A small microscope on a curved arm.
  microscope: (ctx) => ({
    front:
      tube("M-6 6 C-14 -6 -12 -24 0 -26", c(ctx, 0), 9, 5) +
      outlined("rect", { x: -14, y: 6, width: 26, height: 6, rx: 3, fill: c(ctx, 0) }, 2.4) +
      outlined("rect", { x: -5, y: -40, width: 10, height: 22, rx: 4, fill: c(ctx, 1) }, 2.4) +
      outlined("rect", { x: -7, y: -43, width: 14, height: 5, rx: 2, fill: c(ctx, 0) }, 2) +
      outlined("rect", { x: -10, y: -2, width: 22, height: 4, rx: 2, fill: c(ctx, 1) }, 1.8) +
      SHINE("M-2 -36 L-2 -24", 0.5),
  }),

  // Uncommon, Science. A twisted double helix with rungs between the strands.
  "dna-model": (ctx) => ({
    front:
      line("M-8 -30 L8 -30 M-8 -22 L8 -22 M-8 -14 L8 -14", OUTLINE, 1.6, { opacity: 0.5 }) +
      tube("M-8 -38 C8 -30 -8 -22 8 -14 C-8 -6 8 2 -8 10", c(ctx, 0), 6.5, 3.2) +
      tube("M8 -38 C-8 -30 8 -22 -8 -14 C8 -6 -8 2 8 10", c(ctx, 1), 6.5, 3.2),
  }),

  // Uncommon, Science. A beaker with liquid and a few bubbles of fizz.
  "beaker-fizz": (ctx) => ({
    front:
      outlined(
        "path",
        {
          d: "M-11 -18 L-11 9 C-11 13 -9 14 -6 14 L6 14 C9 14 11 13 11 9 L11 -18 Z",
          fill: "#DDEBFF",
          "fill-opacity": 0.6,
        },
        2.6,
      ) +
      el("path", {
        d: "M-10 -4 L10 -4 L10 9 C10 12 9 13 6 13 L-6 13 C-9 13 -10 12 -10 9 Z",
        fill: c(ctx, 0),
      }) +
      [
        [-4, -1, 2],
        [3, 3, 1.8],
        [-2, 7, 2.2],
        [5, 9, 1.5],
      ]
        .map(([x = 0, y = 0, r = 0]) => outlined("circle", { cx: x, cy: y, r, fill: c(ctx, 1) }, 1))
        .join("") +
      line("M-14 -18 L14 -18", OUTLINE, 3) +
      SHINE("M-7 -14 L-7 -4", 0.7),
  }),

  // Rare, Science. Three test tubes in a rack, with bubbles rising.
  "test-tube-rack": (ctx) => {
    const levels = [-12, -4, -16];
    return {
      front:
        [-12, 0, 12]
          .map(
            (x, i) =>
              outlined(
                "rect",
                {
                  x: x - 4,
                  y: -22,
                  width: 8,
                  height: 30,
                  rx: 4,
                  fill: "#DDEBFF",
                  "fill-opacity": 0.7,
                },
                1.8,
              ) +
              el("rect", {
                x: x - 2.6,
                y: levels[i] ?? 0,
                width: 5.2,
                height: 6 - (levels[i] ?? 0),
                rx: 2,
                fill: c(ctx, 0),
              }) +
              el("circle", {
                cx: x,
                cy: (levels[i] ?? 0) + 3,
                r: 1.6,
                fill: "#FFFFFF",
                style: animate("mc-bubble", 2, i * 0.6),
              }),
          )
          .join("") +
        outlined("rect", { x: -20, y: 6, width: 40, height: 8, rx: 3, fill: c(ctx, 1) }, 2.4),
    };
  },

  // Rare, Science. A small burner with a flame that flickers.
  "bunsen-burner": (ctx) => ({
    front:
      outlined("rect", { x: -9, y: 6, width: 18, height: 12, rx: 3, fill: c(ctx, 0) }, 2.6) +
      outlined("rect", { x: -4, y: -20, width: 8, height: 28, rx: 3, fill: c(ctx, 0) }, 2.4) +
      line("M-5 -8 L5 -8", OUTLINE, 1.4, { opacity: 0.4 }) +
      outlined(
        "path",
        {
          d: "M0 -20 C-6 -28 -4 -34 0 -42 C5 -34 6 -28 0 -20 Z",
          fill: c(ctx, 1),
          style: animate("mc-pulse", 1.4),
        },
        1.8,
      ) +
      el("path", {
        d: "M0 -22 C-2 -28 -1 -31 0 -34 C2 -30 2 -27 0 -22 Z",
        fill: "#FFFFFF",
        opacity: 0.8,
        style: animate("mc-pulse", 1.4, 0.2),
      }),
  }),

  // Epic, Science. A tin robot that clanks along, bobbing with each step.
  "robot-toy": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.8) },
      tube("M0 -20 L0 -30", c(ctx, 0), 3.6, 1.8) +
        el("circle", {
          cx: 0,
          cy: -33,
          r: 3.4,
          fill: c(ctx, 1),
          stroke: OUTLINE,
          "stroke-width": 1.6,
          style: animate("mc-twinkle", 1.2),
        }) +
        tube("M-12 2 L-20 10", c(ctx, 0), 5.5, 2.6) +
        tube("M12 2 L20 10", c(ctx, 0), 5.5, 2.6) +
        outlined("rect", { x: -11, y: -20, width: 22, height: 16, rx: 5, fill: c(ctx, 0) }, 2.6) +
        el("circle", { cx: -5, cy: -13, r: 2.6, fill: "#FFFFFF" }) +
        el("circle", { cx: 5, cy: -13, r: 2.6, fill: "#FFFFFF" }) +
        el("circle", { cx: -4.4, cy: -13, r: 1.3, fill: OUTLINE }) +
        el("circle", { cx: 5.6, cy: -13, r: 1.3, fill: OUTLINE }) +
        line("M-4 -7 L4 -7", OUTLINE, 1.4) +
        outlined("rect", { x: -13, y: -2, width: 26, height: 20, rx: 6, fill: c(ctx, 1) }, 2.8) +
        outlined("circle", { cx: 0, cy: 7, r: 3.4, fill: "#DDEBFF" }, 1.6),
    ),
  }),

  // Legendary, Science. A jar of lightning that crackles and glows while you focus.
};

const AURA: Record<string, Draw> = {
  // Rare, Science. Two electrons circling the buddy on an orbit.
  "orbiting-electrons": (ctx) => ({
    back: line("M28 120 A72 26 0 0 1 172 120", c(ctx, 0), 2.6, { opacity: 0.8 }),
    front:
      line("M28 120 A72 26 0 0 0 172 120", c(ctx, 0), 2.6, { opacity: 0.8 }) +
      electron(32, 111, c(ctx, 1), 0) +
      electron(168, 129, c(ctx, 1), 1),
  }),

  // Rare, Science. Field lines curling around the buddy, with blinking dots.
  "magnetic-field": (ctx) => ({
    front:
      line("M52 44 C30 70 26 130 52 156", c(ctx, 0), 2.4) +
      line("M38 60 C22 80 20 120 38 140", c(ctx, 0), 2.4) +
      line("M148 44 C170 70 174 130 148 156", c(ctx, 0), 2.4) +
      line("M162 60 C178 80 180 120 162 140", c(ctx, 0), 2.4) +
      [
        [34, 100, 0],
        [166, 100, 0.8],
        [25, 100, 1.6],
        [175, 100, 2.4],
      ]
        .map(([x = 0, y = 0, d = 0]) =>
          el("circle", {
            cx: x,
            cy: y,
            r: 2.6,
            fill: c(ctx, 1),
            stroke: OUTLINE,
            "stroke-width": 1,
            style: animate("mc-twinkle", 1.6, d),
          }),
        )
        .join(""),
  }),

  // Epic, Science. Formula cards drifting around the buddy, bobbing gently.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
