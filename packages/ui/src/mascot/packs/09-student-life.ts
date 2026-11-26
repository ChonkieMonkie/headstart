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

// Pack 09, student life: sticky notes, pizza, late nights and a dorm room.
// Every Rare, Epic and Legendary item, the colourways of the messenger bag
// and the laptop, and the dorm background belong to the student-life set.

import { animate, el, g, heart, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import {
  BODY,
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

const HEAD: Record<string, Draw> = {
  // Common. A headband with two sticky notes stuck on it.
  "sticky-band": (ctx) => ({
    front:
      tube(HEADBAND, c(ctx, 0), 9.5, 5.5) +
      g(
        { transform: "rotate(-8 -16 -2)" },
        outlined("rect", { x: -23, y: -9, width: 14, height: 14, rx: 1.5, fill: c(ctx, 1) }, 2),
        line("M-20 -4 L-12 -4 M-20 0 L-14 0", OUTLINE, 1.2, { opacity: 0.35 }),
      ) +
      g(
        { transform: "rotate(10 14 -4)" },
        outlined("rect", { x: 7, y: -11, width: 14, height: 14, rx: 1.5, fill: c(ctx, 1) }, 2),
        line("M10 -6 L18 -6 M10 -2 L16 -2", OUTLINE, 1.2, { opacity: 0.35 }),
      ),
  }),

  // Uncommon. A hair bun with a pencil stuck through it.
  "pencil-bun": (ctx) => ({
    front:
      tube("M-22 -38 L2 -8", c(ctx, 1), 8.5, 5) +
      outlined("circle", { cx: 0, cy: -9, r: 12, fill: c(ctx, 0) }, 3.2) +
      SHINE("M-7 -16 C-5 -20 -1 -21 3 -21", 0.4),
  }),

  // Rare. An alarm clock on your head. The bells shake when it is about to ring.
  "alarm-hat": (ctx) => ({
    front:
      outlined("rect", { x: -8, y: -4, width: 16, height: 8, rx: 2, fill: c(ctx, 0) }, 2.6) +
      g(
        { style: animate("mc-bob", 3) },
        [-13, 13]
          .map((x) => outlined("circle", { cx: x, cy: -31, r: 6, fill: c(ctx, 1) }, 2.6))
          .join("") +
          outlined("circle", { cx: 0, cy: -16, r: 15, fill: c(ctx, 0) }, 3) +
          el("circle", {
            cx: 0,
            cy: -16,
            r: 10.5,
            fill: "#FFFFFF",
            stroke: OUTLINE,
            "stroke-width": 1.4,
          }) +
          line("M0 -16 L0 -23 M0 -16 L5 -13", OUTLINE, 2) +
          SHINE("M-10 -25 C-8 -29 -4 -30 0 -30", 0.5),
      ),
  }),

  // Rare. A tower of sticky notes that wobbles on top.
  "sticky-tower": (ctx) => {
    const note = (y: number, fill: string): string =>
      outlined("rect", { x: -20, y, width: 40, height: 7, rx: 1.5, fill }, 1.8);
    return {
      front:
        note(-3, c(ctx, 0)) +
        note(-10, c(ctx, 1)) +
        note(-17, c(ctx, 0)) +
        g(
          { transform: "rotate(6 0 -17)" },
          g(
            { style: animate("mc-bob", 2.6) },
            note(-24, c(ctx, 1)) + line("M-12 -21 L8 -21", OUTLINE, 1.1, { opacity: 0.3 }),
          ),
        ),
    };
  },
};

const FACE: Record<string, Draw> = {
  // Common. Cool gel patches under the eyes.
  "eye-patches": (ctx) => ({
    front: eyesOf(ctx)
      .map(
        ([x, y]) =>
          outlined("ellipse", { cx: x, cy: y + 9, rx: 9, ry: 5, fill: c(ctx, 0) }, 2.2) +
          SHINE(`M${x - 5} ${y + 7} Q${x - 3} ${y + 5} ${x} ${y + 5}`, 0.6),
      )
      .join(""),
  }),

  // Uncommon. A sticky note on the forehead, with a reminder written on it.
  "forehead-note": (ctx) => ({
    front: g(
      { transform: `translate(100 ${ctx.geo.ey - 24}) rotate(-8)` },
      outlined("rect", { x: -9, y: -8, width: 18, height: 16, rx: 1.5, fill: c(ctx, 0) }, 2.2),
      outlined(
        "rect",
        { x: -4, y: -10, width: 8, height: 4, rx: 1, fill: "#FFFFFF", opacity: 0.85 },
        1,
      ),
      line("M-5 -1 L5 -1 M-5 3 L2 3", c(ctx, 1), 1.6),
    ),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common. A laundry bag slung over the back, tied at the top.
  "laundry-bag": (ctx) => ({
    back:
      outlined(
        "path",
        {
          d: "M62 120 C46 130 42 166 58 180 C70 188 130 188 142 180 C158 166 154 130 138 120 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
      line("M52 150 C56 146 58 160 54 166", OUTLINE, 1.6, { opacity: 0.25 }) +
      tube("M96 118 L90 130 M104 118 L110 130", c(ctx, 1), 4.6, 2.4) +
      outlined("circle", { cx: 100, cy: 116, r: 5, fill: c(ctx, 1) }, 2.2),
  }),

  // Uncommon. A messenger bag on a strap across the chest.
  "messenger-bag": (ctx) => ({
    torso: torso(
      ctx,
      tube("M78 122 C92 140 104 156 118 164", c(ctx, 1), 6.5, 3.4) +
        outlined("rect", { x: 116, y: 150, width: 28, height: 22, rx: 4, fill: c(ctx, 0) }, 3) +
        line("M118 160 L142 160", OUTLINE, 1.6, { opacity: 0.4 }) +
        outlined("circle", { cx: 130, cy: 162, r: 2.4, fill: c(ctx, 1) }, 1.6),
    ),
  }),

  // Uncommon. A crew-neck sweatshirt with a collar, a hem stripe and a badge.
  "varsity-sweatshirt": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M84 124 Q100 138 116 124", c(ctx, 1), 6) +
        line("M68 171 L132 171", c(ctx, 1), 5) +
        g(
          { transform: "translate(80 132)" },
          outlined("path", { d: "M0 0 L11 0 L11 8 Q5.5 13 0 8 Z", fill: c(ctx, 1) }, 1.6),
        ),
    ),
  }),

  // Rare. A graduation gown with a gold cord and a tassel.
  "honours-gown": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M84 122 L100 146 L116 122", "#FFFFFF", 3) +
        tube("M80 124 C96 140 110 158 124 174", c(ctx, 1), 6, 3) +
        g(
          { style: `transform-origin: 112px 150px; ${animate("mc-sway", 3.2)}` },
          outlined("circle", { cx: 124, cy: 176, r: 3.4, fill: c(ctx, 1) }, 1.8),
        ),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common. A slice of pizza. Colour 2 is the topping.
  "pizza-slice": (ctx) => ({
    front:
      outlined("path", { d: "M-18 -12 L18 -12 L0 17 Z", fill: c(ctx, 0) }, 2.8) +
      tube("M-19 -12 L19 -12", c(ctx, 1), 9, 5.5) +
      [
        [-7, -3, 3],
        [6, -3, 3],
        [0, 3, 2.8],
      ]
        .map(([x = 0, y = 0, r = 0]) =>
          outlined("circle", { cx: x, cy: y, r, fill: c(ctx, 2) }, 1.4),
        )
        .join(""),
  }),

  // Common. A juice box with a straw.
  "juice-box": (ctx) => ({
    front:
      tube("M3 -12 C6 -22 10 -26 15 -29", "#FFFFFF", 4.6, 2.2) +
      outlined("rect", { x: -11, y: -12, width: 22, height: 26, rx: 3, fill: c(ctx, 0) }, 2.8) +
      outlined("rect", { x: -7, y: -4, width: 14, height: 11, rx: 2, fill: c(ctx, 1) }, 1.8) +
      line("M-4 1 L4 1", OUTLINE, 1.4, { opacity: 0.4 }) +
      SHINE("M-7 -7 L-7 6", 0.5),
  }),

  // Common. A zipped pencil case with a pencil poking out.
  "pencil-case": (ctx) => ({
    front:
      tube("M-4 -10 L-10 -30", c(ctx, 1), 6.5, 3.2) +
      outlined("rect", { x: -14, y: -12, width: 28, height: 20, rx: 6, fill: c(ctx, 0) }, 2.8) +
      line("M-10 -6.5 L7 -6.5", OUTLINE, 1.4, { opacity: 0.3, "stroke-dasharray": "2 2" }) +
      outlined("circle", { cx: 10, cy: -6.5, r: 2.6, fill: c(ctx, 1) }, 1.6) +
      SHINE("M-9 -8 C-8 -10 -5 -11 -2 -11", 0.4),
  }),

  // Uncommon. A closed laptop with a heart sticker.
  laptop: (ctx) => ({
    front:
      outlined("rect", { x: -14, y: -16, width: 28, height: 22, rx: 3, fill: c(ctx, 0) }, 2.8) +
      outlined("path", { d: heart(3, -6, 4.2), fill: c(ctx, 1) }, 1.4) +
      SHINE("M-9 -12 C-7 -14 -4 -15 -1 -15", 0.5) +
      outlined("rect", { x: -17, y: 6, width: 34, height: 5, rx: 2.5, fill: c(ctx, 0) }, 2.4),
  }),

  // Uncommon. A canvas tote with a book printed on it.
  "canvas-tote": (ctx) => ({
    front:
      tube("M-8 -14 C-8 -32 8 -32 8 -14", c(ctx, 1), 4.6, 2.2) +
      outlined(
        "path",
        {
          d: "M-14 -14 L14 -14 L16 14 C16 16 14 17 12 17 L-12 17 C-14 17 -16 16 -16 14 Z",
          fill: c(ctx, 0),
        },
        2.8,
      ) +
      outlined("rect", { x: -6, y: -3, width: 12, height: 9, rx: 1.2, fill: c(ctx, 1) }, 1.8) +
      line("M-3 -2 L-3 5", "#FFFFFF", 1.4, { opacity: 0.7 }),
  }),

  // Rare. A stopwatch whose second hand sweeps round.
  stopwatch: (ctx) => ({
    front:
      outlined("rect", { x: -4, y: -28, width: 8, height: 5, rx: 1.5, fill: c(ctx, 0) }, 2) +
      outlined("circle", { cx: 0, cy: -10, r: 14, fill: c(ctx, 0) }, 3) +
      el("circle", {
        cx: 0,
        cy: -10,
        r: 9.5,
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.2,
      }) +
      line("M0 -18 L0 -16", OUTLINE, 1.6) +
      g(
        { style: `transform-origin: 0px -10px; ${animate("mc-propeller", 4, 0, "linear")}` },
        line("M0 -10 L0 -17", c(ctx, 1), 2),
      ) +
      el("circle", { cx: 0, cy: -10, r: 1.8, fill: OUTLINE }) +
      SHINE("M-8 -18 C-6 -21 -3 -22 0 -22", 0.5),
  }),

  // Rare. A phone on four percent. The red bar blinks.
  "low-battery": (ctx) => ({
    front:
      outlined("rect", { x: -9, y: -16, width: 18, height: 32, rx: 4, fill: c(ctx, 0) }, 2.8) +
      el("rect", { x: -6, y: -12, width: 12, height: 22, rx: 1.5, fill: "#DDEBFF" }) +
      outlined("rect", { x: -4, y: -6, width: 8, height: 12, rx: 1.5, fill: "#FFFFFF" }, 1.4) +
      g(
        { style: animate("mc-twinkle", 1.6) },
        el("rect", { x: -2.5, y: 0, width: 5, height: 5, rx: 1, fill: c(ctx, 1) }),
      ),
  }),

  // Epic. A glass jar full of gold stars that glow.
  "glow-jar": (ctx) => ({
    front: g(
      { transform: "scale(1.55)" },
      g(
        { style: animate("mc-pulse", 3) },
        el("circle", {
          cx: 0,
          cy: 2,
          r: 15,
          fill: c(ctx, 0),
          opacity: 0.35,
          style: "mix-blend-mode: screen",
        }),
      ) +
        outlined(
          "path",
          {
            d: "M-11 -8 L11 -8 L11 10 C11 14 9 16 6 16 L-6 16 C-9 16 -11 14 -11 10 Z",
            fill: c(ctx, 0),
          },
          2.6,
        ) +
        SHINE("M-7 -4 L-7 6", 0.6) +
        el("path", {
          d: star(-4, 2, 3.6),
          fill: "#FFFFFF",
          stroke: OUTLINE,
          "stroke-width": 0.8,
          style: animate("mc-twinkle", 2, 0),
        }) +
        el("path", {
          d: star(4, -1, 3),
          fill: "#FFFFFF",
          stroke: OUTLINE,
          "stroke-width": 0.8,
          style: animate("mc-twinkle", 2, 0.8),
        }) +
        el("path", {
          d: star(0, 8, 2.8),
          fill: "#FFFFFF",
          stroke: OUTLINE,
          "stroke-width": 0.8,
          style: animate("mc-twinkle", 2, 1.4),
        }) +
        el("path", {
          d: sparkle(-6, -3, 2.2),
          fill: "#FFFFFF",
          style: animate("mc-twinkle", 1.6, 0.4),
        }) +
        el("path", {
          d: sparkle(6, 4, 2.4),
          fill: "#FFFFFF",
          style: animate("mc-twinkle", 1.6, 1.0),
        }) +
        el("path", {
          d: sparkle(-1, -5, 1.8),
          fill: "#FFFFFF",
          style: animate("mc-twinkle", 1.6, 1.6),
        }) +
        outlined("rect", { x: -12, y: -13, width: 24, height: 6, rx: 2, fill: c(ctx, 1) }, 2.4),
    ),
  }),

  // Epic. A small trophy for the group project, with a sparkle.
  "group-trophy": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3.4) },
      tube("M-11 -10 C-18 -10 -18 -1 -9 0", c(ctx, 0), 5.5, 2.6) +
        tube("M11 -10 C18 -10 18 -1 9 0", c(ctx, 0), 5.5, 2.6) +
        outlined(
          "path",
          { d: "M-11 -16 L11 -16 C11 -4 6 1 0 1 C-6 1 -11 -4 -11 -16 Z", fill: c(ctx, 0) },
          2.8,
        ) +
        outlined("rect", { x: -2.6, y: 0, width: 5.2, height: 7, fill: c(ctx, 0) }, 2) +
        outlined("rect", { x: -8, y: 6, width: 16, height: 6, rx: 2, fill: c(ctx, 1) }, 2.4) +
        SHINE("M-7 -12 L-6 -6", 0.6) +
        el("path", { d: sparkle(14, -22, 4), fill: "#FFFFFF", style: animate("mc-twinkle", 2) }),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare. A ticking clock that floats beside you.
  "deadline-clock": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 4) },
      outlined("circle", { cx: 36, cy: 140, r: 14, fill: c(ctx, 0) }, 3) +
        el("circle", {
          cx: 36,
          cy: 140,
          r: 9.5,
          fill: "#FFFFFF",
          stroke: OUTLINE,
          "stroke-width": 1.2,
        }) +
        line("M36 140 L36 132", OUTLINE, 1.8) +
        g(
          { style: `transform-origin: 36px 140px; ${animate("mc-sway", 2.2)}` },
          line("M36 140 L43 146", OUTLINE, 1.4),
        ),
    ),
  }),

  // Rare. Sticky notes that drift around you.
  "flying-notes": (ctx) => {
    const note = (x: number, y: number, angle: number, fill: string, delay: number): string =>
      g(
        { transform: `translate(${x} ${y}) rotate(${angle})` },
        g(
          { style: animate("mc-bob", 2.8, delay) },
          outlined("rect", { x: -7, y: -7, width: 14, height: 14, rx: 1.5, fill }, 1.8) +
            line("M-4 -2 L4 -2 M-4 2 L1 2", OUTLINE, 1, { opacity: 0.35 }),
        ),
      );
    return {
      front:
        note(32, 56, -10, c(ctx, 0), 0) +
        note(170, 64, 12, c(ctx, 1), 1.1) +
        note(34, 134, 8, c(ctx, 1), 1.9) +
        note(168, 140, -12, c(ctx, 0), 0.6),
    };
  },

  // Epic. Strings of fairy lights down both sides, twinkling one at a time.

  // Legendary. The moon at midnight, the sun at dawn. You are still awake.
};

// Dorm room background: muted, thin lines, nothing moves, the middle stays calm.
const dorm: Scene = () =>
  `<rect width="200" height="200" fill="#F3E6D8"/>
<rect y="158" width="200" height="42" fill="#DCC7B0"/>
<path d="M0 158 L200 158" fill="none" stroke="#8E6136" stroke-width="1.6"/>
<rect x="12" y="28" width="38" height="50" rx="2" fill="#B7C6DD" stroke="#8E6136" stroke-width="2"/>
<circle cx="31" cy="48" r="7" fill="#F5C542" stroke="#8E6136" stroke-width="1.2"/>
<path d="M18 72 L28 62 L36 68 L44 60" fill="none" stroke="#8E6136" stroke-width="1.4"/>
<rect x="152" y="18" width="44" height="44" rx="2" fill="#DDEBFF" stroke="#8E6136" stroke-width="2"/>
<path d="M174 18 L174 62 M152 40 L196 40" fill="none" stroke="#8E6136" stroke-width="1.6"/>
<rect x="158" y="128" width="42" height="8" rx="2" fill="#C9A27E" stroke="#8E6136" stroke-width="1.6"/>
<path d="M164 136 L164 176 M192 136 L192 176" fill="none" stroke="#8E6136" stroke-width="3"/>
<rect x="164" y="116" width="16" height="12" rx="1" fill="#E9A93A" stroke="#8E6136" stroke-width="1.4"/>
<rect x="166" y="108" width="12" height="8" rx="1" fill="#F7A5C2" stroke="#8E6136" stroke-width="1.4"/>`;

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
  scenes: { dorm },
};
