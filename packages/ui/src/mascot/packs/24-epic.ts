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

// Epic pack items redrawn by hand (the ones whose first drawings did not
// hold up). Merged after the earlier packs, so these replace those drawings.
// Same rules as 23-legendary.ts: light only behind the buddy, motifs in the
// free corners and along the sides, never over the face.

import { animate, el, g, OUTLINE, outlined, sparkle, star } from "../svg.ts";
import { around, aureole, bobAt, cuteFace, orbit, tint, twinkles, upright } from "./fx.ts";
import { blob, c, type Draw, line, type PackDrawings, SHINE } from "./kit.ts";

/** Free spots around the buddy, clear of every face, ear and gill. */
const SPOTS: readonly (readonly [number, number])[] = [
  [24, 34],
  [176, 30],
  [12, 98],
  [188, 84],
  [22, 152],
  [182, 154],
  [100, 6],
];

// ─── Aura ───────────────────────────────────────────────────────────────────

const fireflies: Draw = (ctx) => {
  const fly = (x: number, y: number, i: number) =>
    bobAt(
      x,
      y,
      2.4 + (i % 3) * 0.5,
      i * 0.4,
      g(
        { style: animate("mc-twinkle", 3, i * 0.45) },
        aureole(4, 2, 12, c(ctx, 0), 2.4),
        el("circle", { cx: 4, cy: 2, r: 4.2, fill: c(ctx, 0) }),
        el("circle", { cx: 4, cy: 2, r: 2, fill: "#FFFFFF", opacity: 0.8 }),
      ),
      el("ellipse", {
        cx: -1,
        cy: -4,
        rx: 4,
        ry: 2.4,
        fill: tint(c(ctx, 1), 0.4),
        opacity: 0.8,
        transform: "rotate(-30 -1 -4)",
        style: animate("mc-pulse", 0.3, i * 0.1),
      }),
      el("ellipse", {
        cx: 3,
        cy: -4.4,
        rx: 4,
        ry: 2.4,
        fill: tint(c(ctx, 1), 0.4),
        opacity: 0.8,
        transform: "rotate(20 3 -4.4)",
        style: animate("mc-pulse", 0.3, i * 0.1 + 0.15),
      }),
      outlined("ellipse", { cx: -2, cy: 0, rx: 4.4, ry: 3, fill: "#3B3F52" }, 1.4),
      el("circle", { cx: -5.4, cy: -0.6, r: 2.2, fill: "#3B3F52" }),
      line("M-6.6 -2.4 L-9 -6 M-5 -2.6 L-6 -6.6", OUTLINE, 0.9),
    );
  return {
    back: aureole(100, 104, 96, c(ctx, 1), 0.35),
    front: SPOTS.map(([x, y], i) => fly(x, y, i)).join(""),
  };
};

const turningPages: Draw = (ctx) => {
  const page = (x: number, y: number, i: number) =>
    upright(
      26,
      false,
      g(
        { transform: `translate(${x} ${y}) rotate(${i % 2 ? 10 : -10})` },
        g(
          {
            style: `transform-origin: center; transform-box: fill-box; ${animate("mc-propeller", 3.2, i * 0.8)}`,
          },
          outlined("path", { d: "M-9 -12 H6 L10 -8 V12 H-9 Z", fill: c(ctx, 0) }, 2),
          outlined("path", { d: "M6 -12 V-8 H10", fill: tint(c(ctx, 1), 0.5) }, 1.4),
          line("M-5 -6 H4 M-5 -2 H6 M-5 2 H6 M-5 6 H2", c(ctx, 1), 1.4),
        ),
      ),
    );
  const book = g(
    {},
    outlined(
      "path",
      { d: "M0 -2 C-6 -6 -14 -6 -20 -3 V12 C-14 9 -6 9 0 13 Z", fill: c(ctx, 0) },
      2,
    ),
    outlined("path", { d: "M0 -2 C6 -6 14 -6 20 -3 V12 C14 9 6 9 0 13 Z", fill: c(ctx, 0) }, 2),
    line("M-16 1 H-4 M-16 5 H-4 M4 1 H16 M4 5 H16", c(ctx, 1), 1.2, { opacity: 0.8 }),
    outlined(
      "path",
      {
        d: "M0 13 C-6 9 -14 9 -20 12 L-20 15 C-14 12 -6 12 0 16 C6 12 14 12 20 15 L20 12 C14 9 6 9 0 13 Z",
        fill: c(ctx, 1),
      },
      1.8,
    ),
  );
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.45),
    front:
      orbit(26, false, ...around(90, -130, -50, 40, 140).map(([x, y], i) => page(x, y, i))) +
      bobAt(24, 170, 3, 0, g({ transform: "scale(1.05)" }, book)) +
      twinkles([
        [100, 6, 3],
        [190, 110, 2.6],
      ]),
  };
};

const kelpSway: Draw = (ctx) => {
  const blade = (d: string, w: number) =>
    line(d, OUTLINE, w + 2.6) +
    line(d, c(ctx, 0), w) +
    line(d, c(ctx, 1), w * 0.3, { opacity: 0.6 });
  const clump = (x: number, flip: number, delay: number) =>
    g(
      { transform: `translate(${x} 196) scale(${flip} 1)` },
      g(
        { style: `transform-origin: 0px 0px; ${animate("mc-sway", 3.6, delay)}` },
        blade("M0 0 C-10 -30 10 -60 -4 -96 C-10 -112 -2 -128 -6 -140", 7),
        blade("M8 0 C16 -24 2 -46 14 -76 C20 -92 12 -104 16 -114", 6),
        blade("M-8 0 C-18 -20 -8 -40 -20 -62", 5),
        ...[
          [-4, -30, -40],
          [6, -58, 36],
          [-6, -84, -34],
          [12, -98, 30],
          [-12, -46, -50],
          [-2, -118, -28],
        ].map(([lx = 0, ly = 0, a = 0]) =>
          outlined(
            "ellipse",
            {
              cx: lx,
              cy: ly,
              rx: 4,
              ry: 11,
              fill: c(ctx, 0),
              transform: `rotate(${a} ${lx} ${ly})`,
            },
            1.8,
          ),
        ),
        ...[
          [-4, -96],
          [14, -76],
          [-20, -62],
          [2, -44],
          [-6, -140],
        ].map(([bx = 0, by = 0]) =>
          outlined("circle", { cx: bx, cy: by, r: 3.6, fill: c(ctx, 1) }, 1.6),
        ),
      ),
    );
  const bubble = (x: number, y: number, r: number, d: number) =>
    el("circle", {
      cx: x,
      cy: y,
      r,
      fill: "none",
      stroke: "#CFF3FF",
      "stroke-width": 1.6,
      style: animate("mc-bubble", 2.8, d),
    });
  return {
    back: clump(22, 1, 0) + clump(178, -1, 1.4),
    front:
      bubble(30, 60, 3, 0) +
      bubble(20, 44, 2, 1) +
      bubble(172, 50, 2.6, 0.6) +
      bubble(182, 34, 2, 1.8) +
      bubble(36, 120, 2.2, 2.2),
  };
};

const orbitingMoons: Draw = (ctx) => {
  const moon = (r: number, fill: string, craters: boolean) =>
    g(
      {},
      outlined("circle", { cx: 0, cy: 0, r, fill }, 2.2),
      craters
        ? el("circle", { cx: -r * 0.35, cy: -r * 0.2, r: r * 0.22, fill: OUTLINE, opacity: 0.15 }) +
            el("circle", { cx: r * 0.3, cy: r * 0.35, r: r * 0.16, fill: OUTLINE, opacity: 0.15 }) +
            el("circle", { cx: r * 0.4, cy: -r * 0.4, r: r * 0.1, fill: OUTLINE, opacity: 0.15 })
        : cuteFace(0, 0, r / 9),
      SHINE(
        `M${-r * 0.6} ${-r * 0.3} C${-r * 0.5} ${-r * 0.6} ${-r * 0.2} ${-r * 0.75} ${r * 0.1} ${-r * 0.75}`,
        0.6,
      ),
    );
  const [[ax, ay] = [0, 0]] = around(90, -40);
  const [[bx, by] = [0, 0]] = around(84, 150);
  return {
    back:
      aureole(100, 104, 96, c(ctx, 0), 0.5) +
      el("circle", {
        cx: 100,
        cy: 104,
        r: 90,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 1.4,
        opacity: 0.4,
        "stroke-dasharray": "2 6",
        "stroke-linecap": "round",
      }) +
      el("circle", {
        cx: 100,
        cy: 104,
        r: 84,
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 1.2,
        opacity: 0.3,
        "stroke-dasharray": "1 6",
        "stroke-linecap": "round",
      }),
    front:
      orbit(
        22,
        false,
        upright(
          22,
          false,
          g(
            { transform: `translate(${ax.toFixed(1)} ${ay.toFixed(1)})` },
            moon(15, c(ctx, 0), false),
          ),
        ),
      ) +
      orbit(
        14,
        true,
        upright(
          14,
          true,
          g(
            { transform: `translate(${bx.toFixed(1)} ${by.toFixed(1)})` },
            moon(10, c(ctx, 1), true),
          ),
        ),
      ) +
      g(
        {},
        ...[
          [24, 30, 3],
          [180, 168, 2.6],
          [14, 120, 2.2],
          [104, 6, 2.4],
        ].map(([x = 0, y = 0, r = 1], i) =>
          outlined(
            "path",
            { d: star(x, y, r * 1.8), fill: c(ctx, 2), style: animate("mc-twinkle", 2.4, i * 0.6) },
            1.2,
          ),
        ),
      ),
  };
};

const fireplaceEmbers: Draw = (ctx) => {
  const ember = (x: number, y: number, s: number, d: number) =>
    g(
      { style: animate("mc-rise", 3.2, d, "ease-out") },
      aureole(x, y, 7 * s, c(ctx, 1), 2),
      outlined(
        "path",
        {
          d: `M${x} ${y - 4 * s} C${x + 3 * s} ${y - 1 * s} ${x + 3 * s} ${y + 2 * s} ${x} ${y + 4 * s} C${x - 3 * s} ${y + 2 * s} ${x - 3 * s} ${y - 1 * s} ${x} ${y - 4 * s} Z`,
          fill: c(ctx, 1),
        },
        1.2,
      ),
      el("circle", { cx: x, cy: y + s, r: 1.2 * s, fill: "#FFFFFF", opacity: 0.8 }),
    );
  const spots = [
    [18, 180, 1.2, 0],
    [34, 160, 0.9, 0.5],
    [12, 140, 1, 1.1],
    [28, 120, 0.8, 1.7],
    [182, 178, 1.2, 0.3],
    [168, 156, 0.9, 0.9],
    [190, 132, 1, 1.5],
    [176, 112, 0.8, 2.1],
    [60, 194, 0.9, 2.4],
    [140, 194, 0.9, 2.8],
  ];
  return {
    back: g(
      { style: "mix-blend-mode: screen" },
      el("ellipse", { cx: 100, cy: 204, rx: 110, ry: 30, fill: c(ctx, 0), opacity: 0.08 }),
      el("ellipse", { cx: 100, cy: 204, rx: 70, ry: 16, fill: c(ctx, 1), opacity: 0.08 }),
    ),
    front: spots.map(([x = 0, y = 0, s = 1, d = 0]) => ember(x, y, s * 1.5, d)).join(""),
  };
};

const beeOrbit: Draw = (ctx) => {
  const bee = g(
    {},
    el("ellipse", {
      cx: -2,
      cy: -7,
      rx: 5,
      ry: 3.4,
      fill: tint(c(ctx, 1), 0.3),
      opacity: 0.9,
      stroke: OUTLINE,
      "stroke-width": 1.2,
      transform: "rotate(-24 -2 -7)",
      style: animate("mc-pulse", 0.25),
    }),
    el("ellipse", {
      cx: 4,
      cy: -7,
      rx: 5,
      ry: 3.4,
      fill: tint(c(ctx, 1), 0.3),
      opacity: 0.9,
      stroke: OUTLINE,
      "stroke-width": 1.2,
      transform: "rotate(24 4 -7)",
      style: animate("mc-pulse", 0.25, 0.12),
    }),
    outlined("ellipse", { cx: 0, cy: 0, rx: 9, ry: 6.4, fill: c(ctx, 0) }, 2),
    line("M-3 -6 V6 M2 -6 V6", OUTLINE, 2.4),
    outlined("path", { d: "M-9 0 L-13 -1 L-9 2 Z", fill: OUTLINE }, 1),
    outlined("circle", { cx: 9, cy: -1, r: 4.4, fill: c(ctx, 0) }, 1.8),
    el("circle", { cx: 10.4, cy: -1.6, r: 1.2, fill: OUTLINE }),
    line("M10 -5 L11 -9 M12 -4.4 L15 -7", OUTLINE, 1),
  );
  const trail = (a: number) => {
    const [[x1, y1] = [0, 0], [x2, y2] = [0, 0]] = around(90, a - 34, a - 6);
    return line(
      `M${x1.toFixed(1)} ${y1.toFixed(1)} A90 90 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      "#FFFFFF",
      1.4,
      { opacity: 0.55, "stroke-dasharray": "1 5" },
    );
  };
  const angles = [-60, 60, 180];
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.4) + orbit(12, false, ...angles.map(trail)),
    front:
      orbit(
        12,
        false,
        ...around(90, ...angles).map(([x, y], i) =>
          upright(
            12,
            false,
            g(
              { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.2)` },
              g({ style: animate("mc-bob", 0.8, i * 0.3) }, bee),
            ),
          ),
        ),
      ) +
      bobAt(
        176,
        176,
        2.6,
        0,
        outlined("path", { d: "M-8 -4 L0 -8 L8 -4 L8 4 L0 8 L-8 4 Z", fill: c(ctx, 0) }, 1.8),
        line("M-3 -2 L3 -2 M-3 2 L3 2", "#FFFFFF", 1, { opacity: 0.6 }),
      ),
  };
};

const thunderCloud: Draw = (ctx) => {
  const cloud = g(
    {},
    blob(
      [
        [-14, 2, 10],
        [-2, -6, 13],
        [12, 0, 11],
        [0, 6, 10],
      ],
      c(ctx, 0),
      2.4,
    ),
    el("path", {
      d: "M-18 -2 C-16 -6 -12 -8 -8 -8",
      fill: "none",
      stroke: "#FFFFFF",
      "stroke-width": 2,
      opacity: 0.4,
      "stroke-linecap": "round",
    }),
    line("M-7 -1 L-3 1 M7 -1 L3 1", OUTLINE, 1.6),
    el("circle", { cx: -4.4, cy: 3, r: 1.6, fill: OUTLINE }),
    el("circle", { cx: 4.4, cy: 3, r: 1.6, fill: OUTLINE }),
    line("M-2 8 Q0 6.6 2 8", OUTLINE, 1.4),
  );
  const drop = (x: number, d: number) =>
    el("path", {
      d: `M${x} 14 C${x - 2} 18 ${x - 2} 20 ${x} 20 C${x + 2} 20 ${x + 2} 18 ${x} 14 Z`,
      fill: "#8FD3F5",
      style: animate("mc-drop", 1.4, d, "ease-in"),
    });
  return {
    back: aureole(178, 46, 34, c(ctx, 1), 0.8),
    front: bobAt(
      178,
      26,
      3,
      0,
      drop(-12, 0),
      drop(-2, 0.5),
      drop(10, 0.9),
      g(
        { style: animate("mc-twinkle", 0.8) },
        outlined(
          "path",
          { d: "M2 16 L-6 30 L0 30 L-4 44 L8 26 L2 26 L6 16 Z", fill: c(ctx, 1) },
          1.6,
        ),
      ),
      g({ transform: "scale(1.1)" }, cloud),
    ),
  };
};

const softDrizzle: Draw = (ctx) => {
  const cloud = (x: number, y: number, s: number) =>
    g(
      { transform: `translate(${x} ${y}) scale(${s})` },
      blob(
        [
          [-10, 2, 8],
          [0, -4, 10],
          [11, 2, 8],
          [0, 5, 8],
        ],
        "#E6EEF6",
        2.2,
      ),
      el("path", {
        d: "M-14 0 C-12 -4 -8 -6 -4 -6",
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 2,
        "stroke-linecap": "round",
      }),
    );
  const drop = (x: number, y: number, d: number) =>
    el("path", {
      d: `M${x} ${y} C${x - 2.4} ${y + 4} ${x - 2.4} ${y + 7} ${x} ${y + 7} C${x + 2.4} ${y + 7} ${x + 2.4} ${y + 4} ${x} ${y} Z`,
      fill: c(ctx, 0),
      stroke: c(ctx, 1),
      "stroke-width": 1,
      style: animate("mc-drop", 1.8, d, "ease-in"),
    });
  const ripple = (x: number, d: number) =>
    el("ellipse", {
      cx: x,
      cy: 194,
      rx: 7,
      ry: 2,
      fill: "none",
      stroke: c(ctx, 0),
      "stroke-width": 1.4,
      style: animate("mc-twinkle", 1.8, d),
    });
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.35),
    front:
      bobAt(26, 30, 3.4, 0, cloud(0, 0, 1.1)) +
      bobAt(174, 28, 3.4, 1, cloud(0, 0, 1.1)) +
      [
        [16, 48, 0],
        [30, 56, 0.6],
        [22, 90, 1.2],
        [12, 124, 0.4],
        [28, 150, 1],
        [166, 46, 0.3],
        [182, 54, 0.9],
        [176, 92, 1.5],
        [190, 120, 0.7],
        [180, 148, 1.3],
      ]
        .map(([x = 0, y = 0, d = 0]) => drop(x, y, d))
        .join("") +
      ripple(30, 0.2) +
      ripple(172, 1),
  };
};

const steamSwirl: Draw = (ctx) => {
  const wisp = (x: number, y: number, d: number, flip: number) =>
    g(
      { transform: `translate(${x} ${y}) scale(${flip} 1)` },
      g(
        { style: animate("mc-rise", 3.6, d, "ease-out") },
        line("M0 0 C-8 -8 8 -16 0 -24 C-8 -32 6 -40 0 -48", tint(c(ctx, 0), 0.55), 5),
        line("M0 0 C-8 -8 8 -16 0 -24 C-8 -32 6 -40 0 -48", "#FFFFFF", 1.6, { opacity: 0.7 }),
      ),
    );
  const mug = g(
    {},
    outlined(
      "path",
      { d: "M-11 -10 H11 V6 C11 12 6 14 0 14 C-6 14 -11 12 -11 6 Z", fill: "#F6E7D8" },
      2.2,
    ),
    outlined("path", { d: "M11 -6 C18 -6 18 6 10.6 6", fill: "none" }, 2.2),
    outlined("ellipse", { cx: 0, cy: -10, rx: 11, ry: 3, fill: "#6B4433" }, 1.8),
    el("path", {
      d: "M-3 -10.6 C-4.4 -12.6 -1.4 -13.4 0 -11.4 C1.4 -13.4 4.4 -12.6 3 -10.6 L0 -8.4 Z",
      fill: "#F6E7D8",
    }),
    el("rect", { x: -11, y: -2, width: 22, height: 5, fill: c(ctx, 0) }),
    SHINE("M-7 -5 V8", 0.6),
  );
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.5),
    front:
      wisp(22, 150, 0, 1) +
      wisp(14, 110, 1.2, -1) +
      wisp(30, 80, 2.4, 1) +
      wisp(180, 150, 0.6, -1) +
      wisp(188, 110, 1.8, 1) +
      wisp(172, 80, 3, -1) +
      bobAt(24, 178, 3, 0, g({ transform: "scale(1.1)" }, mug)),
  };
};

const dormLights: Draw = (ctx) => {
  const bulbs: string[] = [];
  const strand = (d: string, pts: readonly (readonly [number, number])[], start: number) => {
    bulbs.push(line(d, "#5E5048", 1.4));
    pts.forEach(([x, y], i) => {
      const color = (start + i) % 2 ? c(ctx, 1) : c(ctx, 0);
      bulbs.push(
        g(
          { style: animate("mc-twinkle", 2.4, ((start + i) % 3) * 0.8) },
          aureole(x, y + 5, 9, color, 2.2),
          outlined("ellipse", { cx: x, cy: y + 5, rx: 3, ry: 4, fill: color }, 1.2),
        ),
        el("rect", { x: x - 2, y: y - 0.4, width: 4, height: 2.4, rx: 0.6, fill: "#5E5048" }),
      );
    });
  };
  strand(
    "M2 12 C20 30 44 26 66 4",
    [
      [12, 20],
      [26, 25],
      [40, 23],
      [54, 15],
    ],
    0,
  );
  strand(
    "M134 4 C156 28 182 30 198 14",
    [
      [146, 15],
      [160, 23],
      [174, 25],
      [188, 20],
    ],
    1,
  );
  strand(
    "M4 14 C14 50 2 90 12 124 C18 146 8 170 14 196",
    [
      [9, 46],
      [6, 80],
      [12, 112],
      [13, 146],
      [11, 178],
    ],
    0,
  );
  strand(
    "M196 16 C186 50 198 88 188 122 C182 144 192 168 186 196",
    [
      [191, 48],
      [194, 82],
      [189, 114],
      [187, 146],
      [190, 178],
    ],
    1,
  );
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.3),
    front:
      bulbs.join("") +
      el("circle", { cx: 2, cy: 12, r: 2, fill: OUTLINE }) +
      el("circle", { cx: 66, cy: 4, r: 2, fill: OUTLINE }) +
      el("circle", { cx: 134, cy: 4, r: 2, fill: OUTLINE }) +
      el("circle", { cx: 198, cy: 14, r: 2, fill: OUTLINE }),
  };
};

const discoBall: Draw = (ctx) => {
  const tiles: string[] = [];
  for (let r = -2; r <= 2; r++) {
    for (let k = -2; k <= 2; k++) {
      const x = k * 5.4;
      const y = r * 5.4;
      if (x * x + y * y > 150) continue;
      tiles.push(
        el("rect", {
          x: x - 2.2,
          y: y - 2.2,
          width: 4.4,
          height: 4.4,
          fill: (r + k) % 2 ? "#FFFFFF" : tint(c(ctx, 0), 0.4),
          opacity: 0.85,
          style: animate("mc-twinkle", 1.2, (r * 5 + k) * 0.15 + 1),
        }),
      );
    }
  }
  const ball = g(
    {},
    line("M0 -40 V-14", OUTLINE, 1.6),
    outlined("rect", { x: -4, y: -17, width: 8, height: 4, rx: 1, fill: "#9AA3B5" }, 1.4),
    outlined("circle", { cx: 0, cy: 0, r: 14, fill: c(ctx, 0) }, 2.4),
    ...tiles,
    line("M-14 0 H14 M0 -14 V14 M-12 -7 H12 M-12 7 H12 M-7 -12 V12 M7 -12 V12", OUTLINE, 0.6, {
      opacity: 0.35,
    }),
    SHINE("M-9 -6 C-8 -9 -5 -11 -2 -11", 0.8),
  );
  const flecks = around(88, ...Array.from({ length: 12 }, (_, i) => i * 30 + 10))
    .map(([x, y], i) =>
      el("path", {
        d: sparkle(x, y, i % 3 ? 2.6 : 3.6),
        fill: [c(ctx, 1), "#FFFFFF", "#F28AB0", "#8FD3F5"][i % 4] ?? "#FFFFFF",
        opacity: 0.85,
        style: animate("mc-twinkle", 1.6, i * 0.2),
      }),
    )
    .join("");
  return {
    back: aureole(176, 44, 44, c(ctx, 0), 0.8) + orbit(18, false, flecks),
    front:
      g(
        { transform: "translate(176 40) scale(1.35)" },
        g({ style: `transform-origin: 0px -40px; ${animate("mc-sway", 3)}` }, ball),
      ) +
      twinkles(
        [
          [150, 26, 3],
          [194, 70, 2.6],
        ],
        c(ctx, 1),
      ),
  };
};

const confettiBurst: Draw = (ctx) => {
  const colors = [c(ctx, 0), c(ctx, 1), c(ctx, 2)];
  const popper = (x: number, a: number) =>
    g(
      { transform: `translate(${x} 188) rotate(${a}) scale(1.4)` },
      outlined("path", { d: "M-7 0 L7 0 L2 -22 L-2 -22 Z", fill: c(ctx, 0) }, 2),
      line("M-5 -6 L5 -10 M-4 -14 L3 -17", "#FFFFFF", 1.6, { opacity: 0.8 }),
      outlined("ellipse", { cx: 0, cy: 0, rx: 7, ry: 2.4, fill: c(ctx, 2) }, 1.6),
    );
  const pieces = [
    [20, 20, 0],
    [40, 8, 0.6],
    [10, 60, 1.2],
    [30, 96, 1.8],
    [180, 16, 0.3],
    [160, 8, 0.9],
    [190, 56, 1.5],
    [172, 96, 2.1],
    [100, 0, 2.4],
    [64, 4, 2.8],
    [136, 4, 0.2],
  ]
    .map(([x = 0, y = 0, d = 0], i) =>
      g(
        { transform: `translate(${x} ${y})` },
        g(
          { style: animate("mc-fall", 3, d, "linear") },
          i % 3 === 2
            ? line("M-5 -4 C0 -9 3 0 8 -4", colors[i % 3] ?? "#FFFFFF", 2.6)
            : outlined(
                "rect",
                {
                  x: -3,
                  y: -1.6,
                  width: 6,
                  height: 3.2,
                  rx: 0.8,
                  fill: colors[i % 3] ?? "#FFFFFF",
                  transform: `rotate(${i * 37}) scale(1.6)`,
                },
                0.8,
              ),
        ),
      ),
    )
    .join("");
  return {
    back: aureole(100, 104, 96, c(ctx, 2), 0.4),
    front:
      pieces +
      popper(16, 24) +
      popper(184, -24) +
      twinkles(
        [
          [34, 150, 3],
          [168, 150, 3],
        ],
        c(ctx, 2),
      ),
  };
};

const candyOrbit: Draw = (ctx) => {
  const candy = (color: string, twist: string) =>
    g(
      {},
      outlined("path", { d: "M-9 0 L-16 -7 L-15 7 Z M9 0 L16 -7 L15 7 Z", fill: twist }, 1.6),
      outlined("circle", { cx: 0, cy: 0, r: 9.4, fill: color }, 2),
      line("M-5 -6 C-2 -2 -2 2 -5 6 M1 -8 C4 -3 4 3 1 8", "#FFFFFF", 1.6, { opacity: 0.6 }),
      SHINE("M-6 -3 C-5 -6 -3 -7 -1 -7", 0.7),
    );
  const pieces = [
    candy(c(ctx, 0), c(ctx, 2)),
    candy(c(ctx, 1), c(ctx, 0)),
    candy(c(ctx, 2), c(ctx, 1)),
  ];
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.4),
    front:
      orbit(
        18,
        false,
        ...around(90, -135, -15, 105).map(([x, y], i) =>
          upright(
            18,
            false,
            g(
              { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.3)` },
              g({ style: animate("mc-bob", 2, i * 0.5) }, pieces[i] ?? ""),
            ),
          ),
        ),
      ) +
      orbit(
        18,
        false,
        ...around(90, -165, -45, 75).map(([x, y], i) =>
          el("path", {
            d: sparkle(x, y, 3.4),
            fill: "#FFF3C9",
            style: animate("mc-twinkle", 1.6, i * 0.4),
          }),
        ),
      ),
  };
};

const hoppingBunny: Draw = (ctx) => {
  const bunny = g(
    {},
    outlined(
      "path",
      {
        d: "M-4 -26 C-8 -38 -6 -46 -2 -46 C2 -46 2 -36 0 -27 Z M3 -27 C4 -38 8 -45 11 -43 C14 -41 10 -32 6 -26 Z",
        fill: c(ctx, 0),
      },
      2,
    ),
    el("path", {
      d: "M-2.6 -29 C-5 -37 -4 -42 -2.4 -42 C-0.8 -42 -0.6 -36 -1.4 -30 Z M4.4 -29 C5.4 -36 8 -41 9.6 -40 C11 -39 8 -33 6 -29 Z",
      fill: c(ctx, 1),
      opacity: 0.8,
    }),
    outlined(
      "path",
      {
        d: "M-14 0 C-18 -12 -10 -20 0 -20 C10 -20 14 -12 12 -4 C11 0 6 1 0 1 C-8 1 -13 2 -14 0 Z",
        fill: c(ctx, 0),
      },
      2.2,
    ),
    outlined("circle", { cx: -15, cy: -6, r: 4, fill: "#FFFFFF" }, 1.6),
    outlined("circle", { cx: 5, cy: -22, r: 9, fill: c(ctx, 0) }, 2.2),
    el("circle", { cx: 8, cy: -23, r: 1.6, fill: OUTLINE }),
    el("circle", { cx: 13.4, cy: -20.6, r: 1.2, fill: c(ctx, 1) }),
    el("circle", { cx: 7, cy: -18.6, r: 1.8, fill: c(ctx, 1), opacity: 0.6 }),
    outlined("ellipse", { cx: 4, cy: 0, rx: 5, ry: 2.2, fill: c(ctx, 0) }, 1.6),
    SHINE("M-9 -12 C-7 -15 -4 -17 -1 -17", 0.6),
  );
  return {
    back: aureole(26, 170, 30, c(ctx, 1), 0.8),
    front:
      el("ellipse", { cx: 28, cy: 192, rx: 22, ry: 3.4, fill: OUTLINE, opacity: 0.18 }) +
      g(
        { transform: "translate(28 190) scale(1.6)" },
        g({ style: `transform-origin: 0px 0px; ${animate("mc-hop", 1.6)}` }, bunny),
      ) +
      bobAt(
        182,
        172,
        3,
        0,
        g(
          { transform: "scale(1.5)" },
          outlined(
            "path",
            { d: "M-3 0 C-6 -8 -2 -14 4 -14 C2 -8 4 -4 2 0 Z", fill: "#7BC47F" },
            1.6,
          ),
          outlined("path", { d: "M-2 0 L2 0 L1 12 L-1 12 Z", fill: "#F2994A" }, 1.6),
        ),
      ) +
      twinkles([
        [50, 168, 2.6],
        [12, 140, 2.2],
      ]),
  };
};

const penguinParade: Draw = (ctx) => {
  const penguin = (scarf: string) =>
    g(
      {},
      outlined(
        "path",
        { d: "M-10 0 C-13 -12 -11 -26 0 -28 C11 -26 13 -12 10 0 Z", fill: c(ctx, 0) },
        2.2,
      ),
      el("path", { d: "M-6 -1 C-8 -10 -7 -20 0 -22 C7 -20 8 -10 6 -1 Z", fill: "#FFFFFF" }),
      outlined(
        "path",
        { d: "M-10 -16 C-15 -12 -15 -6 -12 -4 Z M10 -16 C15 -12 15 -6 12 -4 Z", fill: c(ctx, 0) },
        1.6,
      ),
      el("circle", { cx: -3, cy: -21, r: 1.5, fill: OUTLINE }),
      el("circle", { cx: 3, cy: -21, r: 1.5, fill: OUTLINE }),
      outlined("path", { d: "M-2.6 -18.6 L2.6 -18.6 L0 -15.4 Z", fill: c(ctx, 1) }, 1.2),
      el("circle", { cx: -5, cy: -17, r: 1.4, fill: "#F28AB0", opacity: 0.6 }),
      el("circle", { cx: 5, cy: -17, r: 1.4, fill: "#F28AB0", opacity: 0.6 }),
      outlined(
        "path",
        { d: "M-8 -13 C-3 -11 3 -11 8 -13 L8 -10 C3 -8 -3 -8 -8 -10 Z", fill: scarf },
        1.2,
      ),
      outlined("ellipse", { cx: -5, cy: 1, rx: 4, ry: 2, fill: c(ctx, 1) }, 1.4),
      outlined("ellipse", { cx: 5, cy: 1, rx: 4, ry: 2, fill: c(ctx, 1) }, 1.4),
    );
  const at = (x: number, y: number, s: number, d: number, scarf: string) =>
    el("ellipse", { cx: x, cy: y + 2, rx: 11 * s, ry: 2.4, fill: OUTLINE, opacity: 0.16 }) +
    g(
      { transform: `translate(${x} ${y}) scale(${s})` },
      g({ style: `transform-origin: 0px 0px; ${animate("mc-waddle", 1, d)}` }, penguin(scarf)),
    );
  return {
    back: aureole(100, 180, 80, "#BFE8FF", 0.4),
    front:
      at(18, 192, 1.3, 0, "#E5533D") +
      at(186, 192, 1.3, 0.25, "#7BC47F") +
      at(40, 196, 1, 0.5, "#5B9FE0") +
      twinkles(
        [
          [30, 140, 2.6],
          [176, 140, 2.6],
        ],
        "#FFFFFF",
      ),
  };
};

const floatingFormulas: Draw = (ctx) => {
  const symbols = [
    "M-6 -4 H6 M-3 -4 V5 M3 -4 V3 C3 6 5 6 6 4",
    "M5 -6 H-5 L1 0 L-5 6 H5",
    "M-7 1 L-4 5 L0 -6 H7 M2 -2 L6 3 M6 -2 L2 3",
    "M-6 -2 L-1 5 M-1 -2 L-6 5 M1 -6 C1 -9 6 -9 5 -6 L1 -2 H6",
    "M0 0 C-3 -5 -8 -4 -8 0 C-8 4 -3 5 0 0 C3 -5 8 -4 8 0 C8 4 3 5 0 0",
    "M-6 -3 H6 M-6 3 H6",
  ];
  const card = (x: number, y: number, i: number) =>
    bobAt(
      x,
      y,
      2.6 + (i % 3) * 0.4,
      i * 0.5,
      g(
        { transform: `rotate(${i % 2 ? 8 : -8})` },
        outlined("rect", { x: -11, y: -10, width: 22, height: 20, rx: 4, fill: c(ctx, 0) }, 2),
        line(symbols[i % symbols.length] ?? "", c(ctx, 1), 2),
      ),
    );
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.4),
    front:
      SPOTS.slice(0, 6)
        .map(([x, y], i) => card(x, y, i))
        .join("") + twinkles([[100, 6, 3]], c(ctx, 0)),
  };
};

const mountainMist: Draw = (ctx) => {
  const range = (d: string, fill: string, snow: string) =>
    outlined("path", { d, fill }, 2.2) + el("path", { d: snow, fill: "#FFFFFF" });
  /** A soft bank of mist: overlapping ellipses, drifting slowly sideways. */
  const mist = (x: number, y: number, w: number, d: number, k: number) =>
    g(
      { style: `mix-blend-mode: screen; ${animate("mc-drift", 7, d)}` },
      ...[
        [-0.5, 0.2, 0.42],
        [-0.15, -0.25, 0.5],
        [0.25, 0, 0.46],
        [0.55, 0.25, 0.32],
      ].map(([dx = 0, dy = 0, r = 0]) =>
        el("ellipse", {
          cx: x + dx * w,
          cy: y + dy * 10,
          rx: r * w,
          ry: 7,
          fill: tint(c(ctx, 0), 0.5),
          opacity: k,
        }),
      ),
    );
  return {
    back:
      aureole(100, 104, 96, c(ctx, 0), 0.6) +
      range(
        "M-4 150 L30 88 L46 108 L70 64 L100 112 L130 66 L152 100 L172 80 L204 150 Z",
        tint(c(ctx, 1), 0.3),
        "M30 88 L38 102 L33 99 L28 104 L23 100 Z M70 64 L82 84 L75 80 L69 86 L63 81 L58 85 Z M130 66 L142 86 L136 82 L130 88 L124 82 L118 86 Z M172 80 L180 94 L175 91 L170 96 L165 92 Z",
      ) +
      mist(48, 112, 60, 0, 0.45) +
      mist(156, 106, 60, 2.5, 0.45) +
      range(
        "M-4 196 L-4 146 L22 116 L44 142 L64 124 L100 172 L136 124 L156 142 L178 112 L204 146 L204 196 Z",
        c(ctx, 1),
        "M22 116 L30 128 L25 125 L20 130 L15 125 Z M178 112 L186 124 L181 121 L176 126 L171 122 Z M64 124 L70 133 L65 131 L60 135 L57 131 Z M136 124 L142 132 L137 133 L132 131 L130 129 Z",
      ) +
      mist(30, 156, 70, 1.2, 0.5) +
      mist(172, 160, 70, 3.6, 0.5) +
      mist(100, 186, 90, 5, 0.4),
    front:
      bobAt(
        22,
        30,
        4,
        0,
        blob(
          [
            [-8, 2, 6],
            [0, -2, 8],
            [9, 2, 6],
          ],
          "#FFFFFF",
          1.8,
        ),
      ) +
      bobAt(
        178,
        40,
        4,
        1.4,
        blob(
          [
            [-7, 2, 5],
            [0, -2, 7],
            [8, 2, 5],
          ],
          "#FFFFFF",
          1.8,
        ),
      ) +
      twinkles([[56, 20, 2.4]], "#FFFFFF"),
  };
};

const planeTrail: Draw = (ctx) => {
  const plane = g(
    { transform: "translate(100 14)" },
    line("M-58 4 C-44 0 -30 -2 -16 0", c(ctx, 1), 2.4, {
      "stroke-dasharray": "3 4",
      style: animate("mc-flow", 0.6, 0, "linear"),
    }),
    outlined("path", { d: "M-2 2 L-8 12 L-3 12 L6 2 Z", fill: c(ctx, 0) }, 1.6),
    outlined(
      "path",
      {
        d: "M-15 0 C-15 -4 -8 -6 0 -6 L8 -6 C13 -6 15 -3 15 0 C15 3 13 4 8 4 L-8 4 C-12 4 -15 3 -15 0 Z",
        fill: c(ctx, 0),
      },
      2,
    ),
    outlined("path", { d: "M-13 -2 L-18 -11 L-13 -11 L-8 -4 Z", fill: c(ctx, 0) }, 1.6),
    outlined("rect", { x: -4, y: -5, width: 9, height: 4, rx: 2, fill: c(ctx, 1) }, 1.2),
    line("M-10 1 H10", "#FFFFFF", 1.2, { opacity: 0.6 }),
    outlined("circle", { cx: 16, cy: -1, r: 2, fill: "#3B3F52" }, 1),
    g(
      {
        style: `transform-origin: 17px -1px; transform-box: view-box; ${animate("mc-propeller", 0.3)}`,
      },
      outlined("rect", { x: 16.4, y: -9, width: 2, height: 16, rx: 1, fill: "#9AA3B5" }, 1),
    ),
  );
  const puff = (x: number, y: number, s: number, d: number) =>
    bobAt(
      x,
      y,
      3.6,
      d,
      g(
        { transform: `scale(${s})` },
        blob(
          [
            [-7, 2, 5],
            [0, -2, 7],
            [8, 2, 5],
          ],
          "#FFFFFF",
          1.8,
        ),
      ),
    );
  return {
    back: el("circle", {
      cx: 100,
      cy: 104,
      r: 90,
      fill: "none",
      stroke: c(ctx, 1),
      "stroke-width": 1.4,
      opacity: 0.35,
      "stroke-dasharray": "2 7",
      "stroke-linecap": "round",
    }),
    front:
      orbit(
        9,
        false,
        g(
          {
            transform: "scale(1.15)",
            style: "transform-origin: 100px 14px; transform-box: view-box",
          },
          plane,
        ),
      ) +
      puff(24, 36, 1.1, 0) +
      puff(180, 168, 1, 1.2) +
      puff(16, 156, 0.8, 2.2),
  };
};

const rosePetals: Draw = (ctx) => {
  const petal = (x: number, y: number, i: number) =>
    g(
      { transform: `translate(${x} ${y})` },
      g(
        { style: animate("mc-fall", 4, i * 0.45, "linear") },
        outlined(
          "path",
          {
            d: "M0 -7 C5 -5 5 3 1 7 L0 5.6 L-1 7 C-5 3 -5 -5 0 -7 Z",
            fill: i % 2 ? c(ctx, 1) : c(ctx, 0),
            transform: `rotate(${i * 41}) scale(1.7 1.15)`,
          },
          1,
        ) +
          line("M0 -4 V3", "#FFFFFF", 0.9, {
            opacity: 0.45,
            transform: `rotate(${i * 41}) scale(1.7 1.15)`,
          }),
      ),
    );
  const rose = (x: number, y: number, s: number) =>
    g(
      { transform: `translate(${x} ${y}) scale(${s})` },
      outlined("path", { d: "M-10 6 C-14 0 -8 -4 -4 -2 C-8 2 -6 6 -2 8 Z", fill: "#5E9E62" }, 1.4),
      outlined("path", { d: "M10 6 C14 0 8 -4 4 -2 C8 2 6 6 2 8 Z", fill: "#5E9E62" }, 1.4),
      outlined("circle", { cx: 0, cy: 0, r: 8, fill: c(ctx, 1) }, 2),
      line("M0 0 C3 -2 4 2 1 3 C-3 4 -5 -1 -2 -4 C2 -7 7 -3 6 2", tint(c(ctx, 0), 0.2), 1.8),
      SHINE("M-5 -3 C-4 -5 -2 -6 0 -6", 0.6),
    );
  const spots = [
    [16, 10],
    [36, 4],
    [8, 52],
    [28, 80],
    [12, 118],
    [184, 8],
    [164, 2],
    [192, 50],
    [174, 84],
    [188, 120],
    [70, 0],
    [130, 2],
  ];
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.45),
    front:
      spots.map(([x = 0, y = 0], i) => petal(x, y, i)).join("") +
      rose(22, 182, 1.3) +
      rose(180, 184, 1.2),
  };
};

// ─── Head, face and held ────────────────────────────────────────────────────

// Head items are drawn from the top of the head at (0, 0), upwards (negative y).

const spotlightHat: Draw = (ctx) => ({
  front:
    line("M-46 20 C-38 -6 38 -6 46 20", OUTLINE, 7.4) +
    line("M-46 20 C-38 -6 38 -6 46 20", c(ctx, 0), 4.6) +
    // A clamp on the band, a short post, and a pivot the lamp turns on.
    outlined("rect", { x: -7, y: -4, width: 14, height: 6, rx: 2, fill: "#9AA3B5" }, 2) +
    line("M0 -4 V-10", OUTLINE, 5) +
    line("M0 -4 V-10", "#9AA3B5", 2.6) +
    g(
      { transform: "translate(0 -11) rotate(40)" },
      g(
        { style: `mix-blend-mode: screen; ${animate("mc-pulse", 2.4)}` },
        el("path", {
          d: "M-8 -26 L8 -26 L24 -66 C10 -72 -10 -72 -24 -66 Z",
          fill: tint(c(ctx, 1), 0.3),
          opacity: 0.8,
        }),
      ),
      el("path", {
        d: "M-8 -26 L8 -26 L14 -54 C6 -57 -6 -57 -14 -54 Z",
        fill: tint(c(ctx, 1), 0.5),
        opacity: 0.35,
        style: "mix-blend-mode: screen",
      }),
      // The yoke: a U from the pivot up round both sides of the lamp.
      line("M-11 -14 V-4 C-11 2 11 2 11 -4 V-14", OUTLINE, 5),
      line("M-11 -14 V-4 C-11 2 11 2 11 -4 V-14", "#9AA3B5", 2.6),
      outlined("path", { d: "M-8 -6 L-9 -24 L9 -24 L8 -6 Z", fill: c(ctx, 0) }, 2.2),
      outlined("circle", { cx: -11, cy: -14, r: 2.4, fill: "#9AA3B5" }, 1.4),
      outlined("circle", { cx: 11, cy: -14, r: 2.4, fill: "#9AA3B5" }, 1.4),
      outlined("ellipse", { cx: 0, cy: -25, rx: 10, ry: 3.4, fill: c(ctx, 1) }, 2),
      el("ellipse", { cx: -3, cy: -25.6, rx: 3, ry: 1, fill: "#FFFFFF", opacity: 0.8 }),
      line("M-5 -11 V-19 M0 -11 V-19 M5 -11 V-19", OUTLINE, 1, { opacity: 0.4 }),
      ...[
        [-8, -42, 0],
        [6, -50, 0.6],
        [-4, -58, 1.2],
        [12, -60, 1.8],
      ].map(([x = 0, y = 0, d = 0]) =>
        el("path", {
          d: sparkle(x, y, 2.4),
          fill: "#FFFFFF",
          style: animate("mc-twinkle", 1.8, d),
        }),
      ),
    ) +
    outlined("circle", { cx: 0, cy: -11, r: 2.6, fill: "#9AA3B5" }, 1.4),
});

const paintFountain: Draw = (ctx) => {
  const stream = (d: string, color: string) =>
    line(d, OUTLINE, 5.4) +
    line(d, color, 3.2) +
    line(d, "#FFFFFF", 1.2, {
      opacity: 0.7,
      "stroke-dasharray": "3 4",
      style: animate("mc-flow", 0.5, 0, "linear"),
    });
  return {
    front:
      outlined("path", { d: "M-6 -6 L-4 -26 L4 -26 L6 -6 Z", fill: "#E8DFF5" }, 2) +
      stream("M0 -28 C-4 -40 -16 -40 -18 -10", c(ctx, 1)) +
      stream("M0 -28 C4 -40 16 -40 18 -10", c(ctx, 2)) +
      stream("M0 -28 C0 -36 0 -40 0 -42", c(ctx, 0)) +
      outlined(
        "circle",
        { cx: 0, cy: -44, r: 3.2, fill: c(ctx, 0), style: animate("mc-bob", 0.8) },
        1.4,
      ) +
      outlined("ellipse", { cx: 0, cy: -27, rx: 6, ry: 2.4, fill: "#E8DFF5" }, 1.6) +
      outlined("path", { d: "M-22 -8 C-22 6 22 6 22 -8 Z", fill: "#E8DFF5" }, 2.4) +
      outlined("ellipse", { cx: 0, cy: -8, rx: 22, ry: 5, fill: c(ctx, 0) }, 2.2) +
      el("ellipse", { cx: -9, cy: -8, rx: 6, ry: 2, fill: c(ctx, 1) }) +
      el("ellipse", { cx: 9, cy: -8, rx: 6, ry: 2, fill: c(ctx, 2) }) +
      SHINE("M-16 -2 C-12 1 -6 2 0 2", 0.6) +
      el("circle", {
        cx: -20,
        cy: -14,
        r: 2,
        fill: c(ctx, 1),
        style: animate("mc-twinkle", 1, 0),
      }) +
      el("circle", {
        cx: 20,
        cy: -14,
        r: 2,
        fill: c(ctx, 2),
        style: animate("mc-twinkle", 1, 0.5),
      }),
  };
};

// Face items are drawn in canvas coordinates.

const dragonflyFriend: Draw = (ctx) => {
  const wing = (a: number, d: number) =>
    el("ellipse", {
      cx: 0,
      cy: -8,
      rx: 3.6,
      ry: 9,
      fill: tint(c(ctx, 1), 0.3),
      opacity: 0.85,
      stroke: OUTLINE,
      "stroke-width": 1.2,
      transform: `rotate(${a})`,
      style: animate("mc-pulse", 0.4, d),
    });
  return {
    front: g(
      { transform: `translate(${ctx.geo.bl - 12} ${ctx.geo.by + 9}) rotate(-16)` },
      g(
        { style: animate("mc-bob", 2.6) },
        g({ transform: "translate(2 0)" }, wing(-62, 0), wing(-112, 0.2)),
        g({ transform: "translate(2 0)" }, wing(62, 0.1), wing(112, 0.3)),
        el("path", {
          d: "M-20 0 H0",
          stroke: OUTLINE,
          "stroke-width": 5.4,
          "stroke-linecap": "round",
        }),
        el("path", {
          d: "M-20 0 H0",
          stroke: c(ctx, 0),
          "stroke-width": 3.2,
          "stroke-linecap": "round",
        }),
        line("M-16 -1.6 V1.6 M-12 -1.6 V1.6 M-8 -1.6 V1.6 M-4 -1.6 V1.6", OUTLINE, 0.9, {
          opacity: 0.5,
        }),
        outlined("ellipse", { cx: 3, cy: 0, rx: 4, ry: 3.2, fill: c(ctx, 0) }, 1.6),
        outlined("circle", { cx: 8.4, cy: -1.6, r: 2.6, fill: c(ctx, 1) }, 1.2),
        outlined("circle", { cx: 8.4, cy: 1.8, r: 2.6, fill: c(ctx, 1) }, 1.2),
        el("circle", { cx: 9.2, cy: -2.2, r: 0.9, fill: OUTLINE }),
        el("circle", { cx: 9.2, cy: 2.4, r: 0.9, fill: OUTLINE }),
      ),
    ),
  };
};

// Held items are drawn around the hand at (0, 0), mostly above it.

const satellite: Draw = (ctx) => {
  const panel = (x: number) =>
    outlined("rect", { x, y: -7, width: 12, height: 14, rx: 1.4, fill: c(ctx, 1) }, 1.8) +
    line(`M${x + 6} -7 V7 M${x} 0 H${x + 12}`, c(ctx, 0), 1, { opacity: 0.8 });
  return {
    front: g(
      { transform: "translate(14 -26)" },
      g(
        { style: animate("mc-bob", 2.4) },
        g(
          { transform: "rotate(18)" },
          line("M-10 0 H-7 M7 0 H10", OUTLINE, 2.4),
          panel(-22),
          panel(10),
          outlined("rect", { x: -7, y: -8, width: 14, height: 16, rx: 2, fill: c(ctx, 2) }, 2),
          line("M-7 -3 H7 M-7 3 H7 M-2 -8 V8", "#C9A94A", 1),
          line("M0 -8 V-13", OUTLINE, 1.6),
          outlined("path", { d: "M-7 -13 C-6 -19 6 -19 7 -13 Z", fill: c(ctx, 0) }, 1.6),
          line("M0 -16 L4 -24", OUTLINE, 1.2),
          el("circle", {
            cx: 4,
            cy: -24.6,
            r: 2,
            fill: "#FF6B6B",
            style: animate("mc-twinkle", 0.8),
          }),
          SHINE("M-4 -5 V4", 0.6),
        ),
      ),
      twinkles([
        [-18, -22, 2.6],
        [22, -18, 2.2],
      ]),
    ),
  };
};

const magicCircle: Draw = (ctx) => {
  const r = 80;
  const tri = (a: number) =>
    `M${[0, 120, 240].map((k) => `${(r * 0.72 * Math.cos(((a + k) * Math.PI) / 180)).toFixed(1)} ${(r * 0.72 * Math.sin(((a + k) * Math.PI) / 180)).toFixed(1)}`).join(" L")} Z`;
  const runes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const x = 0.86 * r * Math.cos(a);
    const y = 0.86 * r * Math.sin(a);
    const marks = [
      "M-3 -3 L3 3 M3 -3 L-3 3",
      "M0 -4 V4 M-3 0 H3",
      "M-3 3 L0 -4 L3 3",
      "M-3 -2 H3 M-3 2 H3",
    ];
    return line(marks[i % 4] ?? "", c(ctx, 1), 1.8, {
      transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${i * 30 + 90})`,
    });
  }).join("");
  const disc = g(
    {},
    el("circle", { cx: 0, cy: 0, r, fill: "none", stroke: OUTLINE, "stroke-width": 7 }),
    el("circle", { cx: 0, cy: 0, r, fill: "none", stroke: c(ctx, 0), "stroke-width": 4 }),
    el("circle", {
      cx: 0,
      cy: 0,
      r: r * 0.72,
      fill: "none",
      stroke: c(ctx, 0),
      "stroke-width": 2.6,
    }),
    el("path", {
      d: `${tri(-90)} ${tri(90)}`,
      fill: "none",
      stroke: c(ctx, 1),
      "stroke-width": 2.4,
      "stroke-linejoin": "round",
    }),
    el("circle", { cx: 0, cy: 0, r: r * 0.3, fill: "none", stroke: c(ctx, 0), "stroke-width": 2 }),
    runes,
  );
  return {
    back:
      g(
        { style: "mix-blend-mode: screen" },
        el("ellipse", {
          cx: 100,
          cy: 182,
          rx: 92,
          ry: 22,
          fill: c(ctx, 0),
          opacity: 0.25,
          style: animate("mc-pulse", 3),
        }),
      ) +
      g(
        { transform: "translate(100 182) scale(1 0.22)" },
        g({ style: `transform-origin: 0px 0px; ${animate("mc-spin", 24, 0, "linear")}` }, disc),
      ),
    front: [
      [24, 176, 0],
      [176, 176, 0.8],
      [50, 190, 1.6],
      [150, 190, 2.4],
      [12, 160, 1.2],
      [188, 160, 2],
    ]
      .map(([x = 0, y = 0, d = 0]) =>
        g(
          { style: animate("mc-rise", 3.2, d, "ease-out") },
          outlined("path", { d: sparkle(x, y, 3.4), fill: c(ctx, 1) }, 1.1),
        ),
      )
      .join(""),
  };
};

const hourglass: Draw = (ctx) => ({
  front: g(
    { transform: "translate(4 -16) scale(1.35)" },
    el("path", {
      d: "M-8 -12 C-8 -4 -2 -2 -1 0 C-2 2 -8 4 -8 12 L8 12 C8 4 2 2 1 0 C2 -2 8 -4 8 -12 Z",
      fill: "#DDEBFF",
      opacity: 0.6,
    }),
    el("path", { d: "M-6 -8 L6 -8 C5 -4 2 -2 1 -1 L-1 -1 C-2 -2 -5 -4 -6 -8 Z", fill: c(ctx, 1) }),
    el("path", { d: "M-7 11 L7 11 C6 7 3 5 0 5 C-3 5 -6 7 -7 11 Z", fill: c(ctx, 1) }),
    line("M0 -1 V8", c(ctx, 1), 1.4, {
      "stroke-dasharray": "2 2",
      style: animate("mc-flow", 0.6, 0, "linear"),
    }),
    outlined(
      "path",
      {
        d: "M-8 -12 C-8 -4 -2 -2 -1 0 C-2 2 -8 4 -8 12 L8 12 C8 4 2 2 1 0 C2 -2 8 -4 8 -12 Z",
        fill: "none",
      },
      2,
    ),
    SHINE("M-5 -9 C-5 -6 -4 -4 -3 -3", 0.7),
    line("M-11 -13 V13 M11 -13 V13", OUTLINE, 4.4),
    line("M-11 -13 V13 M11 -13 V13", c(ctx, 0), 2.4),
    outlined("rect", { x: -13, y: -16, width: 26, height: 4, rx: 1.6, fill: c(ctx, 0) }, 2),
    outlined("rect", { x: -13, y: 12, width: 26, height: 4, rx: 1.6, fill: c(ctx, 0) }, 2),
    el("path", { d: sparkle(16, -14, 2.6), fill: "#FFF3C9", style: animate("mc-twinkle", 2) }),
  ),
});

const candyCane: Draw = (ctx) => {
  // The hand sits at about (-3.5, 7) here. The cane is left open where the
  // hand is, so the hand (drawn underneath) shows through and seems to hold it.
  const above = "M-3.5 2 L-3.5 -30 C-3.5 -43 12 -45 12 -32";
  const below = "M-3.5 12.5 L-3.5 19";
  const stick = (d: string) =>
    el("path", {
      d,
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": 7.4,
      "stroke-linecap": "round",
    }) +
    el("path", {
      d,
      fill: "none",
      stroke: "#FFFFFF",
      "stroke-width": 4.8,
      "stroke-linecap": "round",
    }) +
    el("path", {
      d,
      fill: "none",
      stroke: c(ctx, 0),
      "stroke-width": 4.8,
      "stroke-dasharray": "3.4 3.4",
    });
  return {
    front:
      g(
        { style: `transform-origin: -3.5px 7px; ${animate("mc-sway", 2.8)}` },
        stick(above),
        stick(below),
        SHINE("M-4.6 -4 V-26", 0.4),
      ) +
      el("path", {
        d: sparkle(18, -44, 4.4),
        fill: "#FFFFFF",
        stroke: OUTLINE,
        "stroke-width": 1.2,
        style: animate("mc-twinkle", 2, 0.4),
      }),
  };
};

const trumpet: Draw = (ctx) => {
  const pipe = (d: string) => line(d, OUTLINE, 6.4) + line(d, c(ctx, 0), 3.8);
  const note = (x: number, y: number, d: number) =>
    g(
      { style: animate("mc-rise", 2.6, d, "ease-out") },
      line(`M${x + 3} ${y} V${y - 10} Q${x + 7} ${y - 8} ${x + 8} ${y - 4}`, OUTLINE, 1.6),
      outlined(
        "ellipse",
        { cx: x, cy: y, rx: 3.6, ry: 2.8, fill: c(ctx, 1), transform: `rotate(-20 ${x} ${y})` },
        1.4,
      ),
    );
  return {
    front: g(
      { transform: "translate(-2 -6) rotate(-14)" },
      // The loop of tubing under the valves, then the straight lead pipe on top.
      pipe("M2 -2 C-3 -2 -3 7 2 7 L20 7 C25 7 25 -2 20 -2"),
      pipe("M-6 -2 L24 -2"),
      outlined("path", { d: "M-12 -4.6 L-6 -3.2 L-6 -0.8 L-12 0.6 Z", fill: c(ctx, 0) }, 1.6),
      ...[5, 10, 15].map((x) =>
        g(
          {},
          outlined(
            "rect",
            { x: x - 1.8, y: -11, width: 3.6, height: 15, rx: 1.2, fill: c(ctx, 0) },
            1.6,
          ),
          outlined("ellipse", { cx: x, cy: -12, rx: 2.8, ry: 1.4, fill: "#FFF3C9" }, 1.2),
        ),
      ),
      outlined(
        "path",
        { d: "M22 -4.4 C30 -4.4 34 -9 39 -14 L39 10 C34 5 30 0.4 22 0.4 Z", fill: c(ctx, 0) },
        2.2,
      ),
      outlined("ellipse", { cx: 39, cy: -2, rx: 2.8, ry: 12, fill: "#FFE7A8" }, 2),
      SHINE("M26 -4 C30 -5 33 -8 36 -11", 0.7),
      SHINE("M-2 -3 H20", 0.5),
      note(46, -14, 0),
      note(52, -2, 1.3),
    ),
  };
};

export const pack: PackDrawings = {
  head: {
    "spotlight-hat": spotlightHat,
    "paint-fountain": paintFountain,
  },
  face: {
    "dragonfly-friend": dragonflyFriend,
  },
  held: {
    satellite,
    hourglass,
    "candy-cane": candyCane,
    trumpet,
  },
  aura: {
    fireflies,
    "turning-pages": turningPages,
    "kelp-sway": kelpSway,
    "orbiting-moons": orbitingMoons,
    "fireplace-embers": fireplaceEmbers,
    "bee-orbit": beeOrbit,
    "thunder-cloud": thunderCloud,
    "soft-drizzle": softDrizzle,
    "steam-swirl": steamSwirl,
    "dorm-lights": dormLights,
    "disco-ball": discoBall,
    "confetti-burst": confettiBurst,
    "candy-orbit": candyOrbit,
    "hopping-bunny": hoppingBunny,
    "penguin-parade": penguinParade,
    "floating-formulas": floatingFormulas,
    "mountain-mist": mountainMist,
    "plane-trail": planeTrail,
    "rose-petals": rosePetals,
    "magic-circle": magicCircle,
  },
};
