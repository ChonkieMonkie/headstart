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

// Pack 10, music: stage gear for the buddy. Rockstar hair, a boombox hat, a
// trumpet that puffs out notes, a disco ball and a tiny band that floats
// around the buddy for the legendary. Theme batch: no set, no background.

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import { blob, c, type Draw, eyesOf, line, type PackDrawings, SHINE, torso } from "./kit.ts";

const HEAD: Record<string, Draw> = {
  // Common, Music. Big shaggy hair with a streak of colour.
  "rockstar-hair": (ctx) => ({
    front:
      blob(
        [
          [-34, 2, 11],
          [-24, -14, 13],
          [-8, -24, 14],
          [10, -24, 14],
          [25, -14, 13],
          [35, 2, 11],
          [0, -6, 22],
        ],
        c(ctx, 0),
        2.6,
      ) +
      tube("M-16 -28 C-8 -36 6 -36 14 -30", c(ctx, 1), 4.6, 2.2) +
      SHINE("M-20 -18 C-16 -26 -10 -30 -4 -31", 0.35),
  }),

  // Uncommon, Music. A music note clipped to the side of the head.
  "music-note-clip": (ctx) => ({
    front: g(
      { transform: "translate(0 12)" },
      line("M28 4 L28 -17", OUTLINE, 2.4) +
        outlined("path", { d: "M28 -17 C34 -14 36 -9 32 -5", fill: "none" }, 2.6) +
        outlined(
          "ellipse",
          { cx: 23, cy: 4, rx: 6.4, ry: 5, fill: c(ctx, 0), transform: "rotate(-20 23 4)" },
          2.4,
        ) +
        el("path", {
          d: sparkle(12, -10, 3.4),
          fill: c(ctx, 1),
          stroke: OUTLINE,
          "stroke-width": 1,
        }),
    ),
  }),

  // Uncommon, Music. A little marching drum on the head, sticks crossed on top.
  "drum-hat": (ctx) => ({
    front:
      tube("M-25 -33 L-2 -22", "#DDEBFF", 4.6, 2.2) +
      tube("M25 -33 L2 -22", "#DDEBFF", 4.6, 2.2) +
      outlined(
        "path",
        { d: "M-20 -22 L-20 -6 C-20 0 20 0 20 -6 L20 -22 Z", fill: c(ctx, 0) },
        2.8,
      ) +
      line("M-20 -15 L-10 -10 L0 -15 L10 -10 L20 -15", OUTLINE, 1.4, { opacity: 0.4 }) +
      outlined("ellipse", { cx: 0, cy: -22, rx: 20, ry: 5, fill: c(ctx, 1) }, 2.6) +
      SHINE("M-12 -25 C-8 -28 -2 -29 4 -28", 0.45),
  }),

  // Rare, Music. A boombox on the head. The equaliser bars bounce to the beat.
  "boombox-hat": (ctx) => ({
    front:
      tube("M-16 -22 C-16 -42 16 -42 16 -22", c(ctx, 0), 6, 3) +
      outlined("rect", { x: -28, y: -24, width: 56, height: 24, rx: 6, fill: c(ctx, 0) }, 2.8) +
      [-16, 16]
        .map(
          (x) =>
            outlined("circle", { cx: x, cy: -12, r: 7.5, fill: "#DDEBFF" }, 2) +
            el("circle", { cx: x, cy: -12, r: 3, fill: OUTLINE }),
        )
        .join("") +
      [-6, 0, 6]
        .map((x, i) =>
          el("rect", {
            x: x - 1.8,
            y: -18,
            width: 3.6,
            height: 12,
            rx: 1.8,
            fill: c(ctx, 1),
            style: animate("mc-bob", 1.2, i * 0.3),
          }),
        )
        .join(""),
  }),

  // Epic, Music. A stage light clipped on the head, with a wide beam and dust in it.
};

const FACE: Record<string, Draw> = {
  // Common, Music. A star microphone sticker on one cheek.
  "star-mic-sticker": (ctx) => ({
    front: g(
      { transform: `translate(${ctx.geo.bl - 2} ${ctx.geo.by - 1}) rotate(-12)` },
      outlined("path", { d: star(0, 0, 11), fill: c(ctx, 0) }, 2.2),
      outlined("rect", { x: -3, y: -6.5, width: 6, height: 9, rx: 3, fill: c(ctx, 1) }, 1.6),
      line("M-4.5 0 Q-4.5 4 0 4 Q4.5 4 4.5 0", OUTLINE, 1.2),
      line("M0 4 L0 6.5", OUTLINE, 1.2),
      line("M-1.8 -4.4 L-1.8 -1.2", "#FFFFFF", 1.2, { opacity: 0.9 }),
    ),
  }),

  // Uncommon, Music. Glitter wings along the upper lids, with a bold sparkle at each outer corner.
  "glitter-liner": (ctx) => {
    const [[x1, y], [x2]] = eyesOf(ctx);
    const liner = (x: number, s: number): string =>
      line(`M${x - 8} ${y - 6} Q${x} ${y - 12} ${x + 8} ${y - 6}`, c(ctx, 0), 3.6) +
      line(`M${x + 8 * s} ${y - 6} L${x + 18 * s} ${y - 13}`, c(ctx, 0), 3.6) +
      el("path", {
        d: sparkle(x + 21 * s, y - 15, 4.8),
        fill: c(ctx, 1),
        stroke: OUTLINE,
        "stroke-width": 1.2,
      });
    return { front: liner(x1, -1) + liner(x2, 1) };
  },
};

const OUTFIT: Record<string, Draw> = {
  // Common, Music. A sequin vest with a V neck.
  "sequin-vest": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M68 122 C62 146 65 170 80 180 L120 180 C135 170 138 146 132 122 L116 122 L100 142 L84 122 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
        [
          [78, 134],
          [122, 134],
          [78, 150],
          [92, 156],
          [108, 156],
          [122, 150],
          [86, 170],
          [100, 170],
          [114, 170],
        ]
          .map(
            ([x = 0, y = 0]) =>
              el("circle", {
                cx: x,
                cy: y,
                r: 3,
                fill: c(ctx, 1),
                stroke: OUTLINE,
                "stroke-width": 1,
              }) + el("circle", { cx: x - 1, cy: y - 1, r: 0.9, fill: "#FFFFFF" }),
          )
          .join("") +
        SHINE("M74 140 C72 150 72 160 74 170", 0.3),
    ),
  }),

  // Common, Music. Earbuds on a cord, hanging below the collar.
  "earbuds-necklace": (ctx) => ({
    torso: torso(
      ctx,
      tube("M76 120 C86 146 114 146 124 120", c(ctx, 0), 5, 2.6) +
        tube("M100 139 L88 150", c(ctx, 0), 4.4, 2.2) +
        tube("M100 139 L104 150", c(ctx, 0), 4.4, 2.2) +
        outlined("rect", { x: 83, y: 149, width: 9, height: 14, rx: 4.5, fill: c(ctx, 1) }, 2) +
        outlined("rect", { x: 102, y: 149, width: 9, height: 14, rx: 4.5, fill: c(ctx, 1) }, 2) +
        line("M86 153 L86 158", "#FFFFFF", 1.4, { opacity: 0.8 }) +
        line("M105 153 L105 158", "#FFFFFF", 1.4, { opacity: 0.8 }),
    ),
  }),

  // Uncommon, Music. A soft tee with a star on the front.
  "gig-tee": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M84 120 L62 132 L72 150 L74 140 L74 180 L126 180 L126 140 L128 150 L138 132 L116 120 C112 130 88 130 84 120 Z",
          fill: c(ctx, 0),
        },
        3.2,
      ) +
        line("M84 120 C88 134 112 134 116 120", OUTLINE, 2) +
        outlined("path", { d: star(100, 152, 11), fill: c(ctx, 1) }, 1.8) +
        line("M76 174 L124 174", OUTLINE, 1.6, { opacity: 0.3 }) +
        SHINE("M80 144 L80 160", 0.3),
    ),
  }),

  // Rare, Music. A slate jacket with silver studs and a zip pull that sways.
  "studded-jacket": (ctx) => ({
    torso: torso(
      ctx,
      outlined(
        "path",
        {
          d: "M68 122 C62 146 64 172 80 180 L120 180 C136 172 138 146 132 122 L116 122 L100 150 L84 122 Z",
          fill: c(ctx, 0),
        },
        3.4,
      ) +
        line("M84 122 L100 150 M116 122 L100 150", OUTLINE, 2, { opacity: 0.5 }) +
        line("M100 150 L100 180", OUTLINE, 2.2, { opacity: 0.55 }) +
        [
          [88, 138],
          [112, 138],
          [92, 158],
          [108, 158],
          [96, 170],
          [104, 170],
        ]
          .map(([x = 0, y = 0]) =>
            el("circle", {
              cx: x,
              cy: y,
              r: 2,
              fill: "#DDEBFF",
              stroke: OUTLINE,
              "stroke-width": 1,
            }),
          )
          .join("") +
        el("rect", {
          x: 97.5,
          y: 148,
          width: 5,
          height: 8,
          rx: 2,
          fill: "#DDEBFF",
          stroke: OUTLINE,
          "stroke-width": 1,
          style: `transform-origin: 100px 148px; ${animate("mc-sway", 2.4)}`,
        }),
    ),
  }),
};

const HELD: Record<string, Draw> = {
  // Common, Music. A gourd maraca with a dotted body.
  maracas: (ctx) => ({
    front:
      outlined("rect", { x: -2.8, y: -10, width: 5.6, height: 24, rx: 2.8, fill: c(ctx, 1) }, 2.2) +
      outlined("ellipse", { cx: 0, cy: -21, rx: 9.5, ry: 11.5, fill: c(ctx, 0) }, 2.6) +
      [
        [-4, -26],
        [4, -26],
        [0, -20],
        [-5, -16],
        [5, -16],
        [0, -30],
      ]
        .map(([x = 0, y = 0]) => el("circle", { cx: x, cy: y, r: 1.4, fill: c(ctx, 1) }))
        .join("") +
      SHINE("M-5 -28 C-4 -31 -1 -32 2 -32", 0.5),
  }),

  // Common, Music. A tambourine with jingles on the rim.
  tambourine: (ctx) => ({
    front:
      outlined("rect", { x: -2.6, y: -2, width: 5.2, height: 16, rx: 2.6, fill: c(ctx, 0) }, 2.2) +
      outlined("circle", { cx: 0, cy: -14, r: 14, fill: c(ctx, 1) }, 2.8) +
      el("circle", {
        cx: 0,
        cy: -14,
        r: 13,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 3.6,
      }) +
      [
        [-13, -14],
        [13, -14],
        [-9.2, -23.2],
        [9.2, -23.2],
      ]
        .map(([x = 0, y = 0]) => outlined("circle", { cx: x, cy: y, r: 2.4, fill: c(ctx, 0) }, 1.4))
        .join("") +
      SHINE("M-8 -22 C-5 -25 0 -26 4 -26", 0.4),
  }),

  // Uncommon, Music. A small ukulele, held up by the neck.
  ukulele: (ctx) => ({
    front:
      tube("M-4 -2 L12 -30", c(ctx, 1), 6.4, 3.2) +
      outlined(
        "rect",
        {
          x: 9,
          y: -44,
          width: 7,
          height: 13,
          rx: 2.5,
          fill: c(ctx, 1),
          transform: "rotate(18 12 -38)",
        },
        2.2,
      ) +
      blob(
        [
          [-4, 9, 10],
          [-4, -2, 7.5],
        ],
        c(ctx, 0),
        2.4,
      ) +
      el("circle", { cx: -4, cy: 7, r: 3.4, fill: OUTLINE }) +
      el("rect", { x: -6.5, y: 13, width: 5, height: 1.8, rx: 1, fill: OUTLINE }) +
      SHINE("M-12 6 C-11 2 -9 0 -6 -1", 0.4),
  }),

  // Uncommon, Music. A stage microphone with a grille.
  microphone: (ctx) => ({
    front:
      outlined("rect", { x: -3.8, y: -12, width: 7.6, height: 26, rx: 3.8, fill: c(ctx, 1) }, 2.2) +
      outlined("circle", { cx: 0, cy: -22, r: 10, fill: c(ctx, 0) }, 2.6) +
      line("M-9 -25 Q0 -20 9 -25", OUTLINE, 1.2, { opacity: 0.35 }) +
      line("M-9 -19 Q0 -14 9 -19", OUTLINE, 1.2, { opacity: 0.35 }) +
      SHINE("M-5 -28 C-4 -30 -2 -31 1 -31", 0.6),
  }),

  // Rare, Music. A guitar hanging from the hand, swaying gently.
  guitar: (ctx) => ({
    front: g(
      { style: `transform-origin: 0px 0px; ${animate("mc-sway", 2.6)}` },
      tube("M-4 2 L14 -34", c(ctx, 1), 6.4, 3.2),
      outlined(
        "rect",
        {
          x: 11,
          y: -44,
          width: 7,
          height: 12,
          rx: 2.5,
          fill: c(ctx, 1),
          transform: "rotate(18 14 -38)",
        },
        2.2,
      ),
      blob(
        [
          [-5, 14, 11],
          [-5, 2, 8.5],
        ],
        c(ctx, 0),
        2.4,
      ),
      el("circle", { cx: -5, cy: 9, r: 3.6, fill: OUTLINE }),
      el("rect", { x: -9, y: 17, width: 8, height: 2, rx: 1, fill: OUTLINE }),
      SHINE("M-14 12 C-13 8 -11 6 -8 5", 0.45),
    ),
  }),

  // Rare, Music. A spinning record with a coloured label.
  "vinyl-record": (ctx) => ({
    front: g(
      { style: `transform-origin: 0px -14px; ${animate("mc-sway", 2.6)}` },
      outlined("circle", { cx: 0, cy: -14, r: 15, fill: c(ctx, 0) }, 2.8),
      el("circle", {
        cx: 0,
        cy: -14,
        r: 11,
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 0.8,
        opacity: 0.18,
      }),
      el("circle", {
        cx: 0,
        cy: -14,
        r: 8,
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 0.8,
        opacity: 0.18,
      }),
      outlined("circle", { cx: 0, cy: -14, r: 5.6, fill: c(ctx, 1) }, 1.6),
      el("circle", { cx: 0, cy: -14, r: 1.2, fill: OUTLINE }),
      SHINE("M-9 -22 C-7 -25 -4 -26 -1 -26", 0.4),
    ),
  }),

  // Rare, Music. A tuning fork that hums, with a little vibration.
  "tuning-fork": (ctx) => ({
    front:
      tube("M-7 -34 L-7 -14 Q-7 -4 0 -4 Q7 -4 7 -14 L7 -34", c(ctx, 0), 6.4, 3.4) +
      tube("M0 -5 L0 14", c(ctx, 0), 6.4, 3.4) +
      line("M-14 -42 Q-19 -36 -14 -30", "#FFFFFF", 1.8, { style: animate("mc-twinkle", 1.8) }) +
      line("M14 -42 Q19 -36 14 -30", "#FFFFFF", 1.8, { style: animate("mc-twinkle", 1.8, 0.9) }) +
      SHINE("M-10 -24 L-10 -16", 0.5),
  }),

  // Epic, Music. A golden trumpet that puffs out notes from the bell.
};

const AURA: Record<string, Draw> = {
  // Rare, Music. Arcs of sound on both sides that pulse in turn.
  "sound-waves": (ctx) => {
    const wave = (d: string, color: string, delay: number): string =>
      line(d, color, 3.4, { style: animate("mc-twinkle", 2.4, delay) });
    return {
      front:
        wave("M50 74 Q40 90 50 106", c(ctx, 0), 0) +
        wave("M40 62 Q24 90 40 118", c(ctx, 0), 0.5) +
        wave("M32 56 Q16 90 32 124", c(ctx, 1), 1) +
        wave("M150 74 Q160 90 150 106", c(ctx, 0), 0.3) +
        wave("M160 62 Q176 90 160 118", c(ctx, 0), 0.8) +
        wave("M168 56 Q184 90 168 124", c(ctx, 1), 1.3),
    };
  },

  // Epic, Music. A spinning mirror ball on a string, throwing sparkles around the buddy.

  // Legendary, Music. A band of bigger instruments floating in the margins, plus glows.
};

export const pack: PackDrawings = {
  head: HEAD,
  face: FACE,
  outfit: OUTFIT,
  held: HELD,
  aura: AURA,
};
