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

// Pack 17, travel: a pilot, an explorer and a tourist, with stickers, a
// suitcase, a camera and a little plane. Theme batch, no set and no background.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import { BODY, c, type Draw, line, type PackDrawings, SHINE, torso } from "./kit.ts";

const HEAD: Record<string, Draw> = {
  // Common. A navy-and-gold pilot cap with a pair of wings on the front.
  "pilot-cap": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-34 6 C-34 -22 -20 -32 0 -32 C20 -32 34 -22 34 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      outlined("rect", { x: -35, y: 0, width: 70, height: 9, rx: 3.5, fill: c(ctx, 1) }, 2.6) +
      outlined(
        "path",
        { d: "M-36 9 C-20 17 20 17 36 9 C30 22 -30 22 -36 9 Z", fill: c(ctx, 0) },
        3,
      ) +
      outlined(
        "path",
        {
          d: "M-10 -12 C-6 -17 -2 -15 0 -11 C2 -15 6 -17 10 -12 C6 -8 2 -8 0 -6 C-2 -8 -6 -8 -10 -12 Z",
          fill: c(ctx, 2),
        },
        1.8,
      ) +
      SHINE("M-24 -14 C-20 -22 -12 -26 -6 -27", 0.35),
  }),

  // Uncommon. A khaki explorer helmet with a wide brim and a green band.
  "pith-helmet": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-24 4 C-24 -22 -14 -30 0 -30 C14 -30 24 -22 24 4 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      outlined("ellipse", { cx: 0, cy: 6, rx: 42, ry: 8, fill: c(ctx, 0) }, 3) +
      outlined("rect", { x: -24, y: -6, width: 48, height: 8, fill: c(ctx, 1) }, 2.4) +
      SHINE("M-15 -17 C-11 -23 -6 -26 -2 -26", 0.4),
  }),

  // Uncommon. A soft crown with three pins on the band and a stitched line.
  "tourist-hat": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-30 6 C-30 -22 -18 -30 0 -30 C18 -30 30 -22 30 6 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      line("M-18 -8 C-10 -14 10 -14 18 -8", OUTLINE, 1.4, {
        opacity: 0.3,
        "stroke-dasharray": "3 3",
      }) +
      outlined("rect", { x: -31, y: -3, width: 62, height: 10, rx: 3, fill: c(ctx, 1) }, 2.4) +
      [-16, 0, 16]
        .map((x) => outlined("path", { d: star(x, 2, 3.6), fill: "#FFFFFF" }, 1.1))
        .join("") +
      SHINE("M-22 -16 C-16 -22 -8 -24 -2 -24", 0.35),
  }),

  // Rare. A conductor's cap with a gold badge and a little flag that flutters.
  "conductor-cap": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-32 2 C-32 -20 -20 -28 0 -28 C20 -28 32 -20 32 2 Z", fill: c(ctx, 0) },
        3.2,
      ) +
      outlined("rect", { x: -33, y: -2, width: 66, height: 9, rx: 3, fill: c(ctx, 1) }, 2.6) +
      outlined(
        "path",
        { d: "M-34 6 C-20 14 20 14 34 6 C30 18 -30 18 -34 6 Z", fill: c(ctx, 0) },
        3,
      ) +
      outlined("circle", { cx: 0, cy: -12, r: 5, fill: c(ctx, 1) }, 2) +
      g(
        { style: `transform-box: fill-box; transform-origin: 50% 100%; ${animate("mc-bob", 2.4)}` },
        line("M0 -28 L0 -44", OUTLINE, 1.8),
        outlined("path", { d: "M0 -44 L14 -40 L0 -36 Z", fill: c(ctx, 2) }, 1.8),
      ),
  }),

  // Rare. A round flight helmet with a gold band and a light that blinks.
  "flight-helmet": (ctx) => ({
    front:
      outlined("path", { d: "M-34 6 C-34 -40 34 -40 34 6 Z", fill: c(ctx, 0) }, 3.2) +
      outlined("rect", { x: -36, y: 0, width: 72, height: 8, rx: 3.5, fill: c(ctx, 1) }, 2.6) +
      el("circle", {
        cx: 0,
        cy: -20,
        r: 9,
        fill: c(ctx, 2),
        opacity: 0.35,
        style: animate("mc-twinkle", 2),
      }) +
      outlined("circle", { cx: 0, cy: -20, r: 4, fill: c(ctx, 2) }, 1.8) +
      SHINE("M-22 -14 C-18 -24 -8 -29 0 -29", 0.4),
  }),
};

const FACE: Record<string, Draw> = {
  // Common. A round globe sticker and a little pennant on one cheek.
  "travel-stickers": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br + 1} ${ctx.geo.by}) rotate(12)` },
      outlined("circle", { cx: 0, cy: 0, r: 6.5, fill: c(ctx, 0) }, 2),
      line("M-5 0 L5 0 M0 -5 C-3 -2 -3 2 0 5 M0 -5 C3 -2 3 2 0 5", c(ctx, 1), 1.2),
      outlined("path", { d: "M7 -5 L16 -1 L7 3 Z", fill: c(ctx, 2) }, 1.4),
    ),
  }),

  // Uncommon. An ink stamp on the cheek, like the one at the airport.
  "arrival-stamp": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.br - 3} ${ctx.geo.by}) rotate(-12)` },
      el("circle", {
        cx: 0,
        cy: 0,
        r: 7,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 2,
        opacity: 0.85,
      }),
      el("circle", {
        cx: 0,
        cy: 0,
        r: 4.6,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 1.1,
        opacity: 0.85,
      }),
      el("path", { d: star(0, 0, 2.8), fill: c(ctx, 1), opacity: 0.9 }),
    ),
  }),
};

const OUTFIT: Record<string, Draw> = {
  // Common. A U-shaped pillow around the neck, with a seam and a button.
  "neck-pillow": (ctx) => ({
    torso: torso(
      ctx,
      tube("M74 120 C78 136 122 136 126 120", c(ctx, 0), 14, 9) +
        line("M80 128 C86 138 114 138 120 128", c(ctx, 1), 1.6, { "stroke-dasharray": "3 3" }) +
        outlined("circle", { cx: 100, cy: 134, r: 3.2, fill: c(ctx, 2) }, 1.6),
    ),
  }),

  // Common. A jacket covered in travel stickers, with a zip down the front.
  "sticker-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        line("M86 122 L100 140 L114 122", OUTLINE, 2.2) +
        line("M100 140 L100 180", OUTLINE, 1.6, { opacity: 0.3 }) +
        outlined("path", { d: star(82, 154, 7), fill: c(ctx, 1) }, 1.8) +
        outlined("circle", { cx: 117, cy: 160, r: 5.2, fill: c(ctx, 2) }, 1.8) +
        SHINE("M72 140 C72 136 74 132 78 130", 0.35),
    ),
  }),

  // Uncommon. A belt with a little pouch at the front for tickets.
  "travel-belt": (ctx) => ({
    torso: torso(
      ctx,
      tube("M66 158 C90 166 110 166 134 158", c(ctx, 0), 8.5, 5) +
        outlined(
          "path",
          {
            d: "M84 162 C84 158 116 158 116 162 L118 176 C118 180 82 180 82 176 Z",
            fill: c(ctx, 1),
          },
          2.6,
        ) +
        line("M86 168 L114 168", OUTLINE, 1.4, { opacity: 0.35 }),
    ),
  }),

  // Rare. A bomber jacket with a ribbed collar and two pockets.
  "flight-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined("path", { d: BODY, fill: c(ctx, 0) }, 3.4) +
        outlined(
          "path",
          {
            d: "M82 122 C90 136 110 136 118 122 L120 130 C110 140 90 140 80 130 Z",
            fill: c(ctx, 1),
          },
          2.4,
        ) +
        line("M100 136 L100 180", OUTLINE, 1.6, { opacity: 0.3 }) +
        outlined("rect", { x: 72, y: 152, width: 14, height: 10, rx: 2, fill: c(ctx, 1) }, 2.2) +
        outlined("rect", { x: 114, y: 152, width: 14, height: 10, rx: 2, fill: c(ctx, 1) }, 2.2) +
        SHINE("M74 130 C74 127 76 125 80 124", 0.35),
    ),
  }),

  // Rare. An open safari vest with four pockets over a white shirt.
  "safari-vest": (ctx) => ({
    torso: torso(
      ctx,
      el("path", { d: "M90 121 L100 150 L110 121 Z", fill: "#FFFFFF" }) +
        outlined(
          "path",
          {
            d: "M68 122 L92 122 L100 150 L108 122 L132 122 C138 150 138 172 130 180 L70 180 C62 172 62 150 68 122 Z",
            fill: c(ctx, 0),
          },
          3.2,
        ) +
        outlined("rect", { x: 74, y: 146, width: 14, height: 12, rx: 2, fill: c(ctx, 1) }, 2.2) +
        outlined("rect", { x: 112, y: 146, width: 14, height: 12, rx: 2, fill: c(ctx, 1) }, 2.2) +
        line("M70 172 L130 172", OUTLINE, 1.4, { opacity: 0.3 }),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common. A small suitcase with a handle and a label.
  suitcase: (ctx) => ({
    front:
      tube("M-7 -6 L-7 -15 L7 -15 L7 -6", c(ctx, 1), 5.5, 2.6) +
      outlined("rect", { x: -14, y: -6, width: 28, height: 22, rx: 3.5, fill: c(ctx, 0) }, 2.8) +
      line("M-14 3 L14 3", OUTLINE, 1.6, { opacity: 0.25 }) +
      outlined("rect", { x: -8, y: 7, width: 9, height: 6, rx: 1.5, fill: c(ctx, 2) }, 1.6) +
      SHINE("M-9 -2 L-9 0", 0.4),
  }),

  // Common. A folded map with a dashed route and a pin at the end.
  "folded-map": (ctx) => ({
    front:
      outlined(
        "path",
        { d: "M-14 -6 L-5 -9 L5 -6 L14 -9 L14 15 L5 18 L-5 15 L-14 18 Z", fill: c(ctx, 0) },
        2.6,
      ) +
      line("M-5 -9 L-5 15 M5 -6 L5 18", OUTLINE, 1.2, { opacity: 0.3 }) +
      line("M-9 8 C-5 2 0 10 4 3", c(ctx, 1), 1.8, { "stroke-dasharray": "2 2" }) +
      outlined("circle", { cx: 4, cy: 3, r: 2.6, fill: c(ctx, 2) }, 1.4),
  }),

  // Uncommon. A pocket compass on a loop, with a red needle.
  compass: (ctx) => ({
    front:
      el("circle", { cx: 0, cy: -4, r: 3, fill: "none", stroke: OUTLINE, "stroke-width": 2 }) +
      outlined("circle", { cx: 0, cy: 8, r: 12.5, fill: c(ctx, 0) }, 2.8) +
      el("circle", { cx: 0, cy: 8, r: 9, fill: "#DDEBFF" }) +
      el("path", { d: "M0 -1 L3 8 L-3 8 Z", fill: c(ctx, 1) }) +
      el("path", { d: "M0 17 L3 8 L-3 8 Z", fill: "#9AA3B5" }) +
      SHINE("M-9 0 C-9 -4 -6 -7 -2 -8", 0.4),
  }),

  // Uncommon. A postcard with a stamp and a little mountain.
  postcard: (ctx) => ({
    front: g(
      { transform: "rotate(-8)" },
      outlined("rect", { x: -13, y: -9, width: 26, height: 18, rx: 2, fill: c(ctx, 0) }, 2.6),
      line("M-9 -5 L2 -5", "#9AA3B5", 1.4),
      outlined("path", { d: "M-9 6 L-3 -1 L1 3 L4 -1 L9 6 Z", fill: c(ctx, 1) }, 1.6),
      outlined("rect", { x: 5, y: -7, width: 6, height: 6, rx: 1, fill: c(ctx, 1) }, 1.4),
    ),
  }),

  // Rare. A ticket that flutters a little as you walk to the gate.
  "boarding-pass": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 2.8) },
      outlined(
        "path",
        {
          d: "M-14 -4 L14 -4 L14 4 C10 4 10 8 14 8 L14 16 L-14 16 L-14 8 C-10 8 -10 4 -14 4 Z",
          fill: c(ctx, 0),
        },
        2.6,
      ) +
        line("M3 -4 L3 16", OUTLINE, 1.2, { opacity: 0.35, "stroke-dasharray": "2 2" }) +
        outlined("rect", { x: -9, y: -1, width: 14, height: 3, rx: 1, fill: c(ctx, 1) }, 1.4) +
        line("M-9 8 L-4 8 M-9 11 L-1 11", OUTLINE, 1.2, { opacity: 0.35 }),
    ),
  }),

  // Rare. A navy passport with a gold emblem and a red stamp.
  passport: (ctx) => ({
    front: g(
      { transform: "rotate(10)" },
      outlined("rect", { x: -11, y: -4, width: 22, height: 28, rx: 3, fill: c(ctx, 0) }, 2.6),
      line("M-7 -4 L-7 24", OUTLINE, 1.2, { opacity: 0.35 }),
      outlined("circle", { cx: 2, cy: 7, r: 5, fill: c(ctx, 1) }, 1.6),
      el("path", { d: star(2, 7, 2.6), fill: c(ctx, 0) }),
      outlined("rect", { x: -1, y: 16, width: 9, height: 5, rx: 1, fill: c(ctx, 2) }, 1.2),
    ),
  }),

  // Epic. A little flash camera that bobs, with a flash that goes off now and then.
  "flash-camera": (ctx) => ({
    front: g(
      { style: animate("mc-bob", 3) },
      outlined("rect", { x: -6, y: -9, width: 12, height: 6, rx: 1.5, fill: c(ctx, 0) }, 2),
      outlined("rect", { x: -14, y: -4, width: 28, height: 18, rx: 4, fill: c(ctx, 0) }, 2.8),
      outlined("circle", { cx: 0, cy: 6, r: 6.5, fill: c(ctx, 1) }, 2),
      el("circle", { cx: 0, cy: 6, r: 3.6, fill: "#DDEBFF" }),
      el("circle", { cx: -1, cy: 5, r: 1.2, fill: "#FFFFFF" }),
      el("path", {
        d: sparkle(9, -10, 4.6),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 1.8),
      }),
    ),
  }),
};

const AURA: Record<string, Draw> = {
  // Rare. Three postcards drifting around the buddy, each with a stamp.
  "floating-postcards": (ctx) => ({
    front: [
      [38, 58, -14, 0],
      [166, 78, 12, 1.2],
      [34, 142, -6, 2.1],
    ]
      .map(([x = 0, y = 0, angle = 0, delay = 0]) =>
        g(
          { transform: `translate(${x} ${y}) rotate(${angle})` },
          g(
            { style: animate("mc-bob", 3.2, delay) },
            outlined("rect", { x: -10, y: -7, width: 20, height: 14, rx: 2, fill: c(ctx, 0) }, 2),
            outlined("rect", { x: 4, y: -5, width: 5, height: 5, rx: 1, fill: c(ctx, 1) }, 1.2),
            line("M-6 -2 L1 -2 M-6 1.5 L0 1.5", "#9AA3B5", 1.2),
          ),
        ),
      )
      .join(""),
  }),

  // Epic. A small plane flying up and to the right, with a dashed trail behind it.

  // Legendary. A tiny globe with a plane on a ring around it. The whole ring sways and the glow pulses.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
