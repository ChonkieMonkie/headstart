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

// The legendary pack items, redrawn by hand. Drawn last, so these replace the
// first drawings of the same shapes in the earlier packs.
//
// Rules for every piece: soft light only in `back` (behind the buddy) and in
// light tints; the main motif sits in a free corner or along a side, never
// over the face; every piece moves. Free corners in the 200 x 200 box: top
// left and top right (y < 44), the left side below the arm (x < 34), and the
// right side above Maple's tail (x > 168, y 40 to 96).

import { animate, el, g, OUTLINE, outlined, sparkle, star, tube } from "../svg.ts";
import {
  around,
  aureole,
  bobAt,
  cuteFace,
  note,
  orbit,
  rising,
  tint,
  twinkles,
  upright,
} from "./fx.ts";
import { blob, c, type Draw, line, type PackDrawings, SHINE } from "./kit.ts";

// ─── Held ───────────────────────────────────────────────────────────────────
// Held items are drawn around the hand at (0, 0), mostly above it (negative y).

const jellyfishLamp: Draw = (ctx) => {
  const tentacles = [-7, -2.4, 2.4, 7]
    .map((dx, i) =>
      line(`M${14 + dx} -30 q${i % 2 ? 3 : -3} 5 0 10 q${i % 2 ? -3 : 3} 5 0 10`, c(ctx, 1), 2.2, {
        style: `transform-origin: ${14 + dx}px -30px; ${animate("mc-sway", 1.6, i * 0.3)}`,
      }),
    )
    .join("");
  return {
    front:
      line("M0 2 C2 -14 16 -26 23 -46", OUTLINE, 1.4) +
      g(
        { style: animate("mc-bob", 2.4) },
        g(
          { transform: "translate(6 -8) scale(1.25)" },
          tentacles,
          outlined(
            "path",
            {
              d: "M0 -32 C0 -50 28 -50 28 -32 C24 -29 21 -33 17.5 -30 C14 -33 11 -29 7 -32 C4 -29 2 -32 0 -32 Z",
              fill: c(ctx, 0),
            },
            2.2,
          ),
          el("path", {
            d: "M5 -35 C6 -44 22 -44 23 -35",
            fill: "none",
            stroke: "#FFFFFF",
            "stroke-width": 1.6,
            opacity: 0.55,
            "stroke-dasharray": "2 3",
          }),
          el("ellipse", {
            cx: 14,
            cy: -38,
            rx: 9,
            ry: 5,
            fill: tint(c(ctx, 0), 0.6),
            style: animate("mc-pulse", 2.4),
          }),
          SHINE("M6 -37 C7 -40 9 -42 12 -42", 0.7),
          cuteFace(14, -38, 0.9),
        ),
      ) +
      twinkles([
        [-6, -50, 3],
        [38, -30, 2.6],
      ]),
  };
};

const pocketGalaxy: Draw = (ctx) => ({
  front:
    el("circle", {
      cx: 4,
      cy: -14,
      r: 18,
      fill: "none",
      stroke: tint(c(ctx, 2), 0.3),
      "stroke-width": 3,
      opacity: 0.5,
      style: animate("mc-pulse", 2.4),
    }) +
    outlined("circle", { cx: 4, cy: -14, r: 14, fill: c(ctx, 0) }, 2.4) +
    g(
      { style: `transform-origin: 4px -14px; ${animate("mc-spin", 9, 0, "linear")}` },
      el("path", {
        d: "M4 -14 C10 -20 14 -12 10 -6 C6 0 -6 -2 -8 -10",
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 3,
        "stroke-linecap": "round",
      }),
      el("path", {
        d: "M4 -14 C-2 -8 -6 -16 -2 -22 C2 -28 14 -26 16 -18",
        fill: "none",
        stroke: c(ctx, 2),
        "stroke-width": 3,
        "stroke-linecap": "round",
      }),
      el("circle", { cx: 4, cy: -14, r: 3, fill: "#FFFFFF" }),
      ...[
        [-5, -20, 1],
        [12, -9, 1.2],
        [-3, -6, 0.9],
        [13, -21, 0.8],
      ].map(([x = 0, y = 0, r = 1]) => el("circle", { cx: x, cy: y, r, fill: "#FFFFFF" })),
    ) +
    SHINE("M-5 -22 C-3 -25 0 -26 3 -26", 0.75) +
    twinkles([
      [-14, -26, 3.4],
      [20, -30, 2.6],
      [22, -4, 2.2],
    ]),
});

const lightningJar: Draw = (ctx) => ({
  front:
    outlined(
      "path",
      {
        d: "M-8 -28 H12 C14 -28 15 -26 15 -24 V-4 C15 0 12 2 8 2 H-4 C-8 2 -11 0 -11 -4 V-24 C-11 -26 -10 -28 -8 -28 Z",
        fill: tint(c(ctx, 1), 0.78),
      },
      2.4,
    ) +
    el("ellipse", {
      cx: 2,
      cy: -13,
      rx: 9,
      ry: 11,
      fill: tint(c(ctx, 1), 0.45),
      style: animate("mc-pulse", 0.9),
    }) +
    g(
      { style: animate("mc-twinkle", 0.7) },
      outlined(
        "path",
        { d: "M5 -25 L-4 -12 L2 -12 L-3 -1 L9 -16 L3 -16 L8 -25 Z", fill: c(ctx, 1) },
        1.6,
      ),
      el("path", {
        d: "M4.6 -22 L-1 -13.6 L3.4 -13.6 L0.6 -7",
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 1,
        "stroke-linecap": "round",
      }),
    ) +
    SHINE("M-7 -22 V-7", 0.7) +
    outlined("rect", { x: -12, y: -35, width: 28, height: 8, rx: 2, fill: c(ctx, 0) }, 2.4) +
    line("M-7 -33 V-29 M-1 -33 V-29 M5 -33 V-29 M11 -33 V-29", OUTLINE, 1, { opacity: 0.4 }) +
    g(
      { style: animate("mc-twinkle", 0.5, 0.2) },
      line("M-15 -20 L-19 -23 L-17 -17 L-22 -19", c(ctx, 1), 1.8),
      line("M19 -10 L23 -13 L22 -7 L27 -9", c(ctx, 1), 1.8),
    ) +
    twinkles([
      [-16, -36, 3],
      [24, -30, 2.6],
    ]),
});

// ─── Aura ───────────────────────────────────────────────────────────────────

const orbitingBooks: Draw = (ctx) => {
  const covers = [c(ctx, 0), c(ctx, 1), c(ctx, 0), c(ctx, 1)];
  const book = (x: number, y: number, cover: string, tilt: number) =>
    upright(
      20,
      false,
      g(
        { transform: `translate(${x} ${y}) rotate(${tilt}) scale(1.3)` },
        outlined("rect", { x: -8, y: -10, width: 16, height: 20, rx: 2, fill: cover }, 2),
        outlined("rect", { x: 5, y: -8.5, width: 3, height: 17, fill: "#FFF6E3" }, 1.2),
        el("rect", { x: -5, y: -6, width: 7, height: 3, rx: 1, fill: "#FFFFFF", opacity: 0.6 }),
        line("M-3 10 V15 L-1.5 13.5 L0 15 V10", "#E25B5B", 1.6),
      ),
    );
  const spots = [
    [36, 40],
    [164, 40],
    [164, 168],
    [36, 168],
  ];
  return {
    back:
      aureole(100, 104, 96, c(ctx, 1), 0.5) +
      el("circle", {
        cx: 100,
        cy: 104,
        r: 90,
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 1.6,
        opacity: 0.5,
        "stroke-dasharray": "2 7",
        "stroke-linecap": "round",
      }),
    front:
      orbit(
        20,
        false,
        ...spots.map(([x = 0, y = 0], i) => book(x, y, covers[i] ?? c(ctx, 0), i % 2 ? 8 : -8)),
      ) +
      twinkles([
        [26, 28, 4],
        [176, 176, 3.6],
        [176, 26, 3],
      ]),
  };
};

const littleWhale: Draw = (ctx) => {
  const whale = g(
    {},
    outlined(
      "path",
      {
        d: "M-22 2 C-22 -12 -4 -16 10 -10 C16 -7 20 -6 24 -12 C26 -16 31 -16 30 -10 C34 -12 36 -8 32 -5 C28 -2 24 -2 21 0 C16 8 6 12 -6 12 C-16 12 -22 8 -22 2 Z",
        fill: c(ctx, 0),
      },
      2.4,
    ),
    el("path", {
      d: "M-20 5 C-14 10 2 11 14 4",
      fill: "none",
      stroke: c(ctx, 1),
      "stroke-width": 4,
      "stroke-linecap": "round",
    }),
    line("M-12 7 L-11 10 M-6 8 L-5 11 M0 8 L0.5 11", OUTLINE, 1, { opacity: 0.5 }),
    outlined("path", { d: "M-2 6 C0 12 6 14 8 12 C6 10 4 8 4 5 Z", fill: c(ctx, 0) }, 1.8),
    el("circle", { cx: -12, cy: -2, r: 1.8, fill: OUTLINE }),
    el("circle", { cx: -16, cy: 2, r: 2, fill: "#FF9AB0", opacity: 0.6 }),
    SHINE("M-16 -8 C-12 -12 -6 -13 0 -12", 0.6),
  );
  const spout = g(
    { style: animate("mc-pulse", 2, 0) },
    line(
      "M-8 -15 C-10 -22 -14 -24 -17 -24 M-8 -15 C-7 -23 -4 -25 -1 -25 M-8 -15 V-26",
      c(ctx, 1),
      2.2,
    ),
  );
  const bubble = (x: number, y: number, r: number, delay: number) =>
    el("circle", {
      cx: x,
      cy: y,
      r,
      fill: "none",
      stroke: c(ctx, 1),
      "stroke-width": 1.6,
      style: animate("mc-bubble", 2.6, delay),
    });
  return {
    back:
      aureole(170, 32, 34, c(ctx, 1), 1.2) +
      el("path", {
        d: "M14 150 C30 160 30 176 14 186",
        fill: "none",
        stroke: c(ctx, 1),
        "stroke-width": 2,
        opacity: 0.4,
        "stroke-linecap": "round",
        "stroke-dasharray": "1 6",
      }),
    front:
      bobAt(172, 34, 3.4, 0, whale, spout) +
      bubble(146, 22, 3, 0) +
      bubble(152, 12, 2, 0.9) +
      bubble(20, 160, 3.4, 0.4) +
      bubble(14, 140, 2.4, 1.3) +
      bubble(26, 124, 2, 2) +
      twinkles([[192, 62, 3]], "#FFFFFF"),
  };
};

const hearthSpirit: Draw = (ctx) => {
  const spirit = g(
    { style: `transform-origin: 0px 18px; ${animate("mc-sway", 1.8)}` },
    outlined(
      "path",
      {
        d: "M0 18 C-16 18 -20 4 -14 -6 C-12 -1 -9 0 -8 -3 C-10 -12 -4 -20 2 -26 C2 -18 8 -16 10 -10 C12 -14 14 -16 16 -18 C20 -8 20 6 12 14 C9 17 4 18 0 18 Z",
        fill: c(ctx, 0),
      },
      2.4,
    ),
    el("path", {
      d: "M0 16 C-9 16 -11 8 -8 2 C-6 5 -3 5 -3 2 C-4 -4 0 -8 3 -12 C4 -6 8 -4 9 0 C12 6 8 16 0 16 Z",
      fill: c(ctx, 1),
    }),
    cuteFace(0, 6, 1),
    el("circle", { cx: -7, cy: 9, r: 1.8, fill: "#FF7A59", opacity: 0.55 }),
    el("circle", { cx: 7, cy: 9, r: 1.8, fill: "#FF7A59", opacity: 0.55 }),
    SHINE("M-9 4 C-10 0 -9 -3 -7 -5", 0.6),
  );
  return {
    back: aureole(22, 50, 38, c(ctx, 1), 1.3) + aureole(100, 110, 96, c(ctx, 1), 0.45),
    front:
      bobAt(22, 50, 2.6, 0, g({ transform: "scale(1.2)" }, spirit)) +
      rising(
        [
          [16, 30, 1.6],
          [28, 26, 1.3],
          [22, 22, 1.8],
          [10, 40, 1.2],
        ],
        c(ctx, 1),
        2.4,
      ) +
      twinkles([
        [46, 18, 3],
        [8, 70, 2.6],
      ]),
  };
};

const bloomRing: Draw = (ctx) => {
  const blossom = (x: number, y: number, r: number, i: number) =>
    g(
      { style: `transform-origin: ${x}px ${y}px; ${animate("mc-breathe", 2.6, i * 0.4)}` },
      ...[0, 1, 2, 3, 4].map((k) => {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        return outlined(
          "ellipse",
          {
            cx: x + r * 0.9 * Math.cos(a),
            cy: y + r * 0.9 * Math.sin(a),
            rx: r * 0.62,
            ry: r * 0.62,
            fill: i % 2 ? c(ctx, 1) : c(ctx, 0),
          },
          1.5,
        );
      }),
      outlined("circle", { cx: x, cy: y, r: r * 0.5, fill: i % 2 ? c(ctx, 0) : c(ctx, 1) }, 1.4),
    );
  const leaf = (x: number, y: number, a: number) =>
    outlined(
      "path",
      {
        d: `M${x} ${y} C${x + 4} ${y - 6} ${x + 11} ${y - 6} ${x + 13} ${y} C${x + 9} ${y + 4} ${x + 4} ${y + 4} ${x} ${y} Z`,
        fill: "#6FB37A",
        transform: `rotate(${a} ${x} ${y})`,
      },
      1.4,
    );
  // Points along a ring around the buddy, from the left side down under the feet and up the right side.
  const ring = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.92 - i * 0.105);
    return [100 + 90 * Math.cos(a), 112 + 82 * Math.sin(a) * -1 + 0] as const;
  });
  const vine = `M${ring.map(([x, y]) => `${x.toFixed(1)} ${(224 - y).toFixed(1)}`).join(" L")}`;
  return {
    back:
      aureole(100, 120, 96, c(ctx, 0), 0.7) +
      el("path", {
        d: vine,
        fill: "none",
        stroke: "#5C9A66",
        "stroke-width": 3,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      }) +
      ring.map(([x, y], i) => (i % 2 ? leaf(x, 224 - y, i * 40) : "")).join("") +
      rising(
        [
          [40, 120, 2],
          [160, 120, 2],
          [70, 170, 1.6],
          [130, 170, 1.8],
        ],
        c(ctx, 0),
        3.2,
      ),
    front:
      ring
        .map(([x, y], i) => (i % 2 ? "" : blossom(x, 224 - y, i === 0 || i === 8 ? 8 : 7, i / 2)))
        .join("") +
      twinkles([
        [24, 40, 3.4],
        [178, 34, 3],
      ]),
  };
};

const sunRainbow: Draw = (ctx) => {
  const band = (r: number, color: string) =>
    el("path", {
      d: `M${100 - r} 196 C${100 - r} ${196 - r * 2.1} ${100 + r} ${196 - r * 2.1} ${100 + r} 196`,
      fill: "none",
      stroke: color,
      "stroke-width": 7,
    });
  const cloud = (x: number, y: number, s: number) =>
    g(
      { transform: `translate(${x} ${y}) scale(${s})` },
      blob(
        [
          [-10, 2, 8],
          [0, -3, 10],
          [11, 2, 8],
          [0, 5, 8],
        ],
        "#FFFFFF",
        2.2,
      ),
    );
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return `M${(20 * Math.cos(a)).toFixed(1)} ${(20 * Math.sin(a)).toFixed(1)} L${(27 * Math.cos(a)).toFixed(1)} ${(27 * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return {
    back:
      aureole(172, 34, 40, c(ctx, 0), 1.3) +
      g({ opacity: 0.95 }, band(92, c(ctx, 1)), band(85, c(ctx, 0)), band(78, c(ctx, 2))),
    front:
      bobAt(
        172,
        32,
        3.6,
        0,
        g(
          { style: `transform-origin: 0px 0px; ${animate("mc-spin", 14, 0, "linear")}` },
          line(rays, c(ctx, 0), 3.2),
        ),
        outlined("circle", { cx: 0, cy: 0, r: 15, fill: c(ctx, 0) }, 2.4),
        cuteFace(0, 0, 1.3),
        SHINE("M-8 -5 C-7 -8 -4 -10 -1 -10", 0.7),
      ) +
      cloud(184, 48, 0.9) +
      cloud(14, 188, 0.9) +
      cloud(186, 188, 0.9) +
      twinkles([
        [30, 44, 3.4],
        [60, 16, 2.6],
      ]),
  };
};

const floatingBand: Draw = (ctx) => {
  const drum = g(
    {},
    outlined("path", { d: "M-12 0 V12 C-12 18 12 18 12 12 V0 Z", fill: c(ctx, 1) }, 2.4),
    line("M-12 4 L-6 13 L0 4 L6 13 L12 4", "#FFFFFF", 1.6, { opacity: 0.8 }),
    outlined("ellipse", { cx: 0, cy: 0, rx: 12, ry: 4.4, fill: "#FFF6E3" }, 2.4),
    g(
      { style: `transform-origin: 6px -4px; ${animate("mc-sway", 0.6)}` },
      tube("M6 -4 L14 -18", "#C98B5E", 4.2, 2.2),
    ),
    g(
      { style: `transform-origin: -6px -4px; ${animate("mc-sway", 0.6, 0.3)}` },
      tube("M-6 -4 L-14 -18", "#C98B5E", 4.2, 2.2),
    ),
  );
  const trumpet = g(
    { transform: "rotate(-18)" },
    tube("M-14 0 H8", c(ctx, 2), 6, 3.6),
    outlined("path", { d: "M6 -2 L16 -8 V8 L6 2 Z", fill: c(ctx, 2) }, 2),
    outlined("rect", { x: -6, y: -7, width: 3, height: 6, rx: 1, fill: c(ctx, 2) }, 1.4),
    outlined("rect", { x: -1, y: -7, width: 3, height: 6, rx: 1, fill: c(ctx, 2) }, 1.4),
    outlined("circle", { cx: -15, cy: 0, r: 2.4, fill: c(ctx, 2) }, 1.4),
  );
  const ukulele = g(
    { transform: "rotate(-30)" },
    tube("M0 -6 V-26", "#8E6136", 6, 3.6),
    outlined("rect", { x: -3.4, y: -32, width: 6.8, height: 7, rx: 2, fill: "#8E6136" }, 1.8),
    blob(
      [
        [0, 10, 9],
        [0, 0, 7],
      ],
      c(ctx, 0),
      2.2,
    ),
    el("circle", { cx: 0, cy: 4, r: 2.6, fill: OUTLINE }),
    line("M-1 -24 V14 M1 -24 V14", "#FFFFFF", 0.6, { opacity: 0.7 }),
    el("rect", { x: -4, y: 12, width: 8, height: 2.4, rx: 1, fill: OUTLINE }),
  );
  const tambourine = g(
    { style: `transform-origin: 0px 0px; ${animate("mc-sway", 1.2)}` },
    outlined("circle", { cx: 0, cy: 0, r: 10, fill: "#FFF6E3" }, 2.4),
    el("circle", { cx: 0, cy: 0, r: 7, fill: "none", stroke: c(ctx, 1), "stroke-width": 2 }),
    ...[0, 1, 2, 3].map((i) => {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      return outlined(
        "circle",
        { cx: 10 * Math.cos(a), cy: 10 * Math.sin(a), r: 2.4, fill: c(ctx, 2) },
        1.2,
      );
    }),
  );
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.5),
    front:
      bobAt(24, 24, 2.8, 0, g({ transform: "scale(1.35)" }, trumpet)) +
      bobAt(174, 34, 3, 0.7, g({ transform: "scale(1.35)" }, drum)) +
      bobAt(186, 96, 2.6, 1.2, g({ transform: "scale(1.3)" }, tambourine)) +
      bobAt(20, 150, 3.2, 0.4, g({ transform: "scale(1.35)" }, ukulele)) +
      g(
        {},
        g({ style: animate("mc-rise", 3, 0, "ease-in") }, note(46, 24, c(ctx, 1))),
        g({ style: animate("mc-rise", 3, 1, "ease-in") }, note(146, 20, c(ctx, 0))),
        g({ style: animate("mc-rise", 3, 2, "ease-in") }, note(30, 116, c(ctx, 2))),
      ),
  };
};

const espressoSwirl: Draw = (ctx) => {
  const cup = (x: number, y: number) =>
    upright(
      18,
      false,
      g(
        { transform: `translate(${x} ${y}) scale(1.5)` },
        outlined("ellipse", { cx: 0, cy: 8, rx: 12, ry: 3.2, fill: c(ctx, 1) }, 2),
        outlined("path", { d: "M-8 -4 H8 V2 C8 7 4 9 0 9 C-4 9 -8 7 -8 2 Z", fill: c(ctx, 1) }, 2),
        outlined("path", { d: "M8 -1 C13 -1 13 5 7.5 5", fill: "none" }, 2),
        outlined("ellipse", { cx: 0, cy: -4, rx: 8, ry: 2.4, fill: c(ctx, 0) }, 1.6),
        el("path", {
          d: "M-2 -4.6 C-3 -6 -1 -6.4 0 -5 C1 -6.4 3 -6 2 -4.6 L0 -3 Z",
          fill: c(ctx, 1),
        }),
        SHINE("M-6 0 V4", 0.6),
        g(
          { style: animate("mc-rise", 2.4, (x + y) / 100, "ease-in") },
          line("M-3 -9 C-5 -12 -1 -13 -3 -16 M3 -9 C1 -12 5 -13 3 -16", "#FFFFFF", 1.4, {
            opacity: 0.8,
          }),
        ),
      ),
    );
  const bean = (x: number, y: number) =>
    upright(
      26,
      true,
      outlined(
        "ellipse",
        { cx: x, cy: y, rx: 4.4, ry: 3, fill: c(ctx, 0), transform: `rotate(30 ${x} ${y})` },
        1.4,
      ) +
        line(
          `M${x - 3} ${y - 1} C${x - 1} ${y + 1} ${x + 1} ${y - 1} ${x + 3} ${y + 1}`,
          c(ctx, 1),
          1,
        ),
    );
  const swirl = (from: number, to: number, r: number) => {
    const [[x1, y1] = [0, 0], [x2, y2] = [0, 0]] = around(r, from, to);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  return {
    back:
      aureole(100, 104, 96, "#F5C56B", 0.6) +
      orbit(
        30,
        false,
        line(swirl(-170, -40, 92), "#C98B5E", 6),
        line(swirl(10, 140, 92), "#C98B5E", 6),
        line(swirl(-160, -70, 92), c(ctx, 1), 2, { opacity: 0.9 }),
        line(swirl(20, 110, 92), c(ctx, 1), 2, { opacity: 0.9 }),
      ),
    front:
      orbit(18, false, ...around(90, -135, -45, 135).map(([x, y]) => cup(x, y))) +
      orbit(26, true, ...around(96, 0, 90, 180, 270).map(([x, y]) => bean(x, y))) +
      twinkles([
        [182, 160, 3],
        [12, 60, 2.6],
      ]),
  };
};

const allNighter: Draw = (ctx) => {
  const moon = g(
    { style: `transform-origin: 0px 0px; ${animate("mc-sway", 3)}` },
    outlined(
      "path",
      {
        d: "M4 -16 C-8 -16 -16 -6 -14 6 C-12 16 0 20 10 14 C2 12 -4 4 -2 -4 C0 -10 2 -14 4 -16 Z",
        fill: c(ctx, 0),
      },
      2.4,
    ),
    line("M-9 0 Q-7 2 -5 0", OUTLINE, 1.4),
    line("M-8 6 Q-6 8 -4 6.5", OUTLINE, 1.2),
    el("circle", { cx: -10, cy: 4, r: 1.6, fill: "#FF9AB0", opacity: 0.6 }),
    SHINE("M-10 -8 C-9 -11 -6 -13 -3 -14", 0.6),
  );
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5;
    return `M${(17 * Math.cos(a)).toFixed(1)} ${(17 * Math.sin(a)).toFixed(1)} L${(23 * Math.cos(a)).toFixed(1)} ${(23 * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const sun = g(
    {},
    g(
      { style: `transform-origin: 0px 0px; ${animate("mc-spin", 16, 0, "linear")}` },
      line(rays, c(ctx, 1), 3),
    ),
    outlined("circle", { cx: 0, cy: 0, r: 13, fill: c(ctx, 1) }, 2.4),
    line("M-7 -2 H-2 M2 -2 H7", OUTLINE, 1.6),
    line("M-7 1 Q-4.5 2.6 -2 1 M2 1 Q4.5 2.6 7 1", "#C98B2E", 1),
    outlined("ellipse", { cx: 0, cy: 6, rx: 2, ry: 2.6, fill: "#8E3B4E" }, 1.2),
    SHINE("M-8 -6 C-7 -9 -4 -11 -1 -11", 0.6),
  );
  return {
    back:
      aureole(30, 36, 40, c(ctx, 0), 1.2) +
      aureole(170, 36, 40, c(ctx, 1), 1.2) +
      line("M44 26 C70 -2 130 -2 156 26", c(ctx, 1), 1.8, {
        opacity: 0.5,
        "stroke-dasharray": "1 6",
      }),
    front:
      bobAt(30, 38, 3.4, 0, g({ transform: "scale(1.2)" }, moon)) +
      bobAt(170, 36, 3, 1, g({ transform: "scale(1.15)" }, sun)) +
      g(
        { opacity: 0.9 },
        ...[
          [10, 66, 2.4],
          [52, 14, 2],
          [16, 12, 1.6],
          [46, 62, 1.6],
        ].map(([x = 0, y = 0, r = 1], i) =>
          el("path", {
            d: star(x, y, r * 2),
            fill: c(ctx, 0),
            style: animate("mc-twinkle", 2.4, i * 0.6),
          }),
        ),
      ) +
      twinkles([[194, 70, 3]]),
  };
};

const championLaurel: Draw = (ctx) => {
  // Two branches along a circle round the buddy, from the bottom up to the top, leaves in pairs pointing up the branch.
  const leaves: string[] = [];
  const at = (deg: number) =>
    [
      100 + 86 * Math.cos((deg * Math.PI) / 180),
      108 + 86 * Math.sin((deg * Math.PI) / 180),
    ] as const;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const deg = 90 - side * (14 + i * 16);
      const [x, y] = at(deg);
      // Direction of travel up the branch, as a rotation for a leaf drawn pointing up (-y).
      const heading = deg + (side > 0 ? -90 : 90) + 90;
      for (const out of [-1, 1]) {
        leaves.push(
          g(
            {
              transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(heading + out * 34).toFixed(1)})`,
            },
            outlined(
              "path",
              { d: "M0 0 C4 -4 4 -12 0 -17 C-4 -12 -4 -4 0 0 Z", fill: c(ctx, 1) },
              1.6,
            ),
            line("M0 -2 V-13", "#FFFFFF", 0.9, { opacity: 0.45 }),
          ),
        );
      }
    }
  }
  const [lx, ly] = at(90 + 8 * 16 + 14);
  const [rx, ry] = at(90 - 8 * 16 - 14);
  const stem = `M100 194 A86 86 0 0 1 ${lx.toFixed(1)} ${ly.toFixed(1)} M100 194 A86 86 0 0 0 ${rx.toFixed(1)} ${ry.toFixed(1)}`;
  return {
    back:
      aureole(100, 104, 96, c(ctx, 0), 0.6) +
      line(stem, "#3F7A52", 3) +
      leaves.join("") +
      outlined(
        "path",
        {
          d: "M92 190 L84 200 L90 198 L92 203 L98 192 Z M108 190 L116 200 L110 198 L108 203 L102 192 Z",
          fill: c(ctx, 0),
        },
        1.6,
      ),
    front:
      g(
        { style: `transform-origin: 100px 8px; ${animate("mc-breathe", 2.4)}` },
        outlined("path", { d: star(100, 9, 8), fill: c(ctx, 0) }, 2),
      ) +
      outlined(
        "path",
        { d: star(44, 20, 5.5), fill: c(ctx, 0), style: animate("mc-twinkle", 2.4, 0.4) },
        1.6,
      ) +
      outlined(
        "path",
        { d: star(156, 20, 5.5), fill: c(ctx, 0), style: animate("mc-twinkle", 2.4, 1.2) },
        1.6,
      ) +
      twinkles([
        [14, 60, 3],
        [186, 60, 3],
        [24, 176, 2.6],
        [176, 176, 2.6],
      ]),
  };
};

const sugarRush: Draw = (ctx) => {
  const candy = g(
    {},
    outlined("path", { d: "M-8 0 L-15 -6 L-14 6 Z M8 0 L15 -6 L14 6 Z", fill: c(ctx, 1) }, 1.6),
    outlined("ellipse", { cx: 0, cy: 0, rx: 9, ry: 7, fill: c(ctx, 0) }, 2),
    line("M-4 -5 L-1 5 M2 -6 L5 4", "#FFFFFF", 1.6, { opacity: 0.7 }),
  );
  const lolly = g(
    {},
    tube("M0 8 V22", "#FFF6E3", 4.4, 2.4),
    outlined("circle", { cx: 0, cy: 0, r: 10, fill: "#FFFFFF" }, 2),
    line("M0 0 C3 -1 3 4 -1 4 C-6 4 -6 -4 0 -5 C7 -6 9 3 5 7", c(ctx, 2), 2.6),
  );
  const gumdrop = g(
    {},
    outlined("path", { d: "M-9 6 C-9 -4 -5 -9 0 -9 C5 -9 9 -4 9 6 Z", fill: c(ctx, 1) }, 2),
    ...[
      [-4, -2],
      [2, -5],
      [4, 1],
      [-2, 3],
    ].map(([x = 0, y = 0]) =>
      el("rect", { x, y, width: 1.6, height: 1.6, fill: "#FFFFFF", opacity: 0.85 }),
    ),
  );
  const donutBit = g(
    {},
    outlined("circle", { cx: 0, cy: 0, r: 9, fill: "#E7B47A" }, 2),
    el("circle", { cx: 0, cy: -0.6, r: 7, fill: c(ctx, 0) }),
    outlined("circle", { cx: 0, cy: 0, r: 2.6, fill: "#2A2440" }, 1.4),
    line("M-4 -4 L-2 -5 M3 -4 L4 -2 M-5 2 L-4 4", c(ctx, 2), 1.4),
  );
  const pieces = [candy, lolly, gumdrop, donutBit];
  const sprinkles = around(80, ...Array.from({ length: 16 }, (_, i) => i * 22.5 + 8))
    .map(([x, y], i) => {
      const r = i % 2 ? 92 : 80;
      const k = r / 80;
      const px = 100 + (x - 100) * k;
      const py = 104 + (y - 104) * k;
      return el("rect", {
        x: px - 3,
        y: py - 1,
        width: 6,
        height: 2.2,
        rx: 1.1,
        fill: [c(ctx, 0), c(ctx, 1), c(ctx, 2), "#FFFFFF"][i % 4] ?? "#FFFFFF",
        transform: `rotate(${i * 47} ${px} ${py})`,
      });
    })
    .join("");
  return {
    back: aureole(100, 104, 96, c(ctx, 0), 0.6) + orbit(30, true, sprinkles),
    front:
      orbit(
        16,
        false,
        ...around(90, -135, -45, 45, 135).map(([x, y], i) =>
          upright(
            16,
            false,
            g({ transform: `translate(${x} ${y}) scale(1.5)` }, pieces[i] ?? candy),
          ),
        ),
      ) +
      twinkles([
        [100, 6, 3.4],
        [186, 104, 3],
      ]),
  };
};

const spiritFox: Draw = (ctx) => {
  const fox = g(
    {},
    g(
      { style: `transform-origin: -6px -4px; ${animate("mc-sway", 2.2)}` },
      outlined(
        "path",
        { d: "M-6 -4 C-24 -6 -30 8 -16 12 C-6 14 6 10 12 4 C4 6 -8 6 -8 0 Z", fill: c(ctx, 0) },
        2.2,
      ),
      el("path", { d: "M2 9.6 C6 8 9 6 12 4 C8 4 4 6 0 6 Z", fill: c(ctx, 1) }),
    ),
    outlined(
      "path",
      { d: "M-10 2 C-12 -12 -6 -22 2 -24 C10 -22 12 -10 10 2 Z", fill: c(ctx, 0) },
      2.2,
    ),
    el("path", { d: "M1 -22 C6 -18 6 -6 3 1 L-1 1 C-1 -9 -3 -16 1 -22 Z", fill: "#FFF3E0" }),
    outlined(
      "path",
      { d: "M-3 -33 L-5 -45 L3 -37 Z M6 -37 L13 -45 L12 -32 Z", fill: c(ctx, 0) },
      2,
    ),
    el("path", {
      d: "M-2.6 -36 L-3.6 -42 L0.6 -37.6 Z M8 -37.6 L11.6 -41.6 L11 -35 Z",
      fill: "#7A3B2E",
    }),
    outlined("circle", { cx: 4, cy: -29, r: 9.5, fill: c(ctx, 0) }, 2.2),
    outlined(
      "path",
      { d: "M8 -29 C14 -30 17 -27 13 -24 C10 -22 7 -24 8 -29 Z", fill: "#FFF3E0" },
      1.6,
    ),
    el("circle", { cx: 16, cy: -27, r: 1.6, fill: OUTLINE }),
    line("M3 -30 Q5 -28 7 -30", OUTLINE, 1.4),
    el("path", {
      d: "M2 -40 C0 -37 1 -35 3 -35 C5 -35 6 -37 4 -40 C4 -38 3 -38 2 -40 Z",
      fill: c(ctx, 1),
    }),
    outlined("ellipse", { cx: -3, cy: 2, rx: 3.4, ry: 2, fill: "#FFF3E0" }, 1.4),
    outlined("ellipse", { cx: 5, cy: 2, rx: 3.4, ry: 2, fill: "#FFF3E0" }, 1.4),
    SHINE("M-6 -14 C-6 -18 -4 -21 -2 -22", 0.5),
  );
  const wisp = (x: number, y: number, d: number) =>
    bobAt(
      x,
      y,
      2.4,
      d,
      el("path", {
        d: "M0 6 C-6 6 -7 0 -3 -4 C-2 -1 -1 -1 0 -2 C0 -6 2 -8 3 -10 C4 -6 7 -3 6 1 C5 4 3 6 0 6 Z",
        fill: c(ctx, 1),
        opacity: 0.9,
        style: animate("mc-twinkle", 2.4, d),
      }),
    );
  return {
    back: aureole(28, 30, 40, c(ctx, 1), 1) + aureole(100, 104, 96, c(ctx, 0), 0.35),
    front:
      bobAt(28, 46, 3.4, 0, g({ transform: "scale(1.05)" }, fox)) +
      wisp(14, 96, 0) +
      wisp(176, 30, 0.8) +
      wisp(22, 150, 1.6) +
      wisp(186, 76, 2.2) +
      twinkles([
        [54, 10, 2.6],
        [8, 124, 2.2],
      ]),
  };
};

const northernLights: Draw = (ctx) => {
  const ribbon = (d: string, color: string, delay: number) =>
    g(
      { style: `transform-origin: 100px 0px; ${animate("mc-sway", 5, delay)}` },
      ...[0, 7, 14, 21].map((dy, i) =>
        el("path", {
          d,
          transform: `translate(0 ${dy})`,
          fill: "none",
          stroke: tint(color, 0.15),
          "stroke-width": 9 - i * 1.6,
          "stroke-linecap": "round",
          opacity: 0.55 - i * 0.12,
        }),
      ),
    );
  return {
    back: g(
      { style: `mix-blend-mode: screen; ${animate("mc-pulse", 6)}`, opacity: 1 },
      ribbon("M-10 64 C20 30 50 40 80 22 C110 4 140 26 210 6", c(ctx, 0), 0),
      ribbon("M-10 40 C30 16 70 30 100 12 C130 -4 170 18 210 30", c(ctx, 2), 1.4),
      ribbon("M-10 92 C10 70 40 76 60 56 M140 56 C160 76 190 70 210 92", c(ctx, 1), 2.6),
    ),
    front: g(
      {},
      ...[
        [16, 14, 1.6],
        [60, 8, 1.2],
        [140, 10, 1.4],
        [186, 18, 1.8],
        [8, 120, 1.2],
        [192, 130, 1.4],
        [176, 60, 1],
      ].map(([x = 0, y = 0, r = 1], i) =>
        el("circle", {
          cx: x,
          cy: y,
          r,
          fill: "#FFFFFF",
          style: animate("mc-twinkle", 2.4, i * 0.4),
        }),
      ),
      twinkles([
        [28, 50, 3.4],
        [170, 44, 3],
      ]),
    ),
  };
};

const selfPaintingStrokes: Draw = (ctx) => {
  const stroke = (d: string, color: string, width: number, delay: number) =>
    el("path", {
      d,
      pathLength: 100,
      "stroke-dasharray": 100,
      fill: "none",
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      style: animate("mc-paint", 6, delay),
    });
  const brush = g(
    { transform: "rotate(40)" },
    g(
      { style: `transform-origin: 0px 10px; ${animate("mc-sway", 1.4)}` },
      tube("M0 -2 V24", "#C98B5E", 6.4, 4),
      outlined("rect", { x: -3.6, y: -8, width: 7.2, height: 6, rx: 1, fill: "#C9D1D6" }, 1.6),
      outlined(
        "path",
        { d: "M-3.4 -8 C-4 -14 -1 -19 0 -21 C1 -19 4 -14 3.4 -8 Z", fill: c(ctx, 0) },
        1.8,
      ),
      SHINE("M-1.4 4 V18", 0.5),
    ),
  );
  const palette = g(
    {},
    outlined(
      "path",
      {
        d: "M-16 2 C-18 -10 -4 -16 8 -12 C16 -9 18 -2 12 2 C8 4 10 8 6 10 C-2 14 -14 12 -16 2 Z",
        fill: "#F3E2C4",
      },
      2.2,
    ),
    outlined("ellipse", { cx: 6, cy: 4, rx: 2.6, ry: 2, fill: "#2A2440" }, 1.2),
    outlined("circle", { cx: -9, cy: -2, r: 3.4, fill: c(ctx, 0) }, 1.4),
    outlined("circle", { cx: -2, cy: -8, r: 3.4, fill: c(ctx, 1) }, 1.4),
    outlined("circle", { cx: 7, cy: -6, r: 3.4, fill: c(ctx, 2) }, 1.4),
    outlined("circle", { cx: -8, cy: 6, r: 3, fill: "#FFFFFF" }, 1.4),
  );
  return {
    back:
      stroke("M24 168 C6 130 8 70 40 32", c(ctx, 0), 9, 0) +
      stroke("M124 10 C164 6 192 40 186 92", c(ctx, 2), 8, 2) +
      stroke("M186 132 C182 170 150 192 112 194", c(ctx, 1), 8, 4) +
      (
        [
          [46, 20, 3, 0],
          [194, 104, 2.6, 2],
          [102, 198, 2.4, 1],
          [8, 112, 2, 0],
        ] as const
      )
        .map(([cx, cy, r, i]) => el("circle", { cx, cy, r, fill: c(ctx, i) }))
        .join(""),
    front:
      bobAt(176, 32, 2.6, 0, g({ transform: "scale(1.3)" }, brush)) +
      bobAt(24, 178, 3.2, 0.6, g({ transform: "scale(1.2)" }, palette)) +
      twinkles([
        [148, 22, 3],
        [12, 120, 2.6],
      ]),
  };
};

const orbitGlobe: Draw = (ctx) => {
  const plane = g(
    { transform: "translate(100 14)" },
    line("M-30 2 H-12", "#FFFFFF", 1.6, { opacity: 0.6, "stroke-dasharray": "2 3" }),
    outlined("path", { d: "M-2 -1 L-8 -9 L-4 -9 L5 -1 Z", fill: c(ctx, 2) }, 1.4),
    outlined(
      "path",
      {
        d: "M-11 0 C-11 -3 -6 -4 0 -4 L8 -4 C12 -4 14 -2 14 0 C14 2 12 3 8 3 L-6 3 C-9 3 -11 2 -11 0 Z",
        fill: "#FFFFFF",
      },
      1.8,
    ),
    outlined("path", { d: "M-10 -1 L-14 -9 L-10 -9 L-6 -2 Z", fill: c(ctx, 0) }, 1.4),
    line("M-4 0 H8", c(ctx, 0), 1.4),
    el("circle", { cx: 10.5, cy: -1.2, r: 1.2, fill: c(ctx, 0) }),
    outlined("path", { d: "M-1 1 L-6 8 L-2 8 L5 1 Z", fill: c(ctx, 2) }, 1.4),
  );
  const globe = g(
    {},
    el("ellipse", {
      cx: 0,
      cy: 0,
      rx: 25,
      ry: 7,
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": 4.4,
      transform: "rotate(-20)",
    }),
    el("ellipse", {
      cx: 0,
      cy: 0,
      rx: 25,
      ry: 7,
      fill: "none",
      stroke: c(ctx, 2),
      "stroke-width": 2.4,
      transform: "rotate(-20)",
    }),
    outlined("circle", { cx: 0, cy: 0, r: 15, fill: c(ctx, 0) }, 2.4),
    g(
      { style: `transform-origin: 0px 0px; ${animate("mc-sway", 4)}` },
      el("path", {
        d: "M-10 -8 C-6 -12 0 -10 -1 -5 C-2 -1 -7 0 -8 4 C-12 2 -14 -4 -10 -8 Z M3 2 C7 -1 12 1 11 6 C9 10 4 11 2 8 C1 6 1 4 3 2 Z M4 -12 C7 -12 9 -10 7 -8 C5 -8 3 -10 4 -12 Z",
        fill: c(ctx, 1),
      }),
    ),
    SHINE("M-10 -6 C-8 -10 -4 -12 0 -12", 0.6),
  );
  // The front half of the globe's ring, drawn over the globe.
  const ringFront = g(
    { transform: "rotate(-20)" },
    el("path", {
      d: "M-25 0 A25 7 0 0 0 25 0",
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": 4.4,
    }),
    el("path", {
      d: "M-25 0 A25 7 0 0 0 25 0",
      fill: "none",
      stroke: c(ctx, 2),
      "stroke-width": 2.4,
    }),
  );
  return {
    back:
      aureole(170, 36, 40, c(ctx, 0), 1) +
      el("circle", {
        cx: 100,
        cy: 104,
        r: 90,
        fill: "none",
        stroke: c(ctx, 0),
        "stroke-width": 1.6,
        opacity: 0.45,
        "stroke-dasharray": "2 7",
        "stroke-linecap": "round",
      }),
    front:
      bobAt(170, 36, 3.4, 0, globe, ringFront) +
      orbit(12, false, plane) +
      twinkles([
        [26, 30, 3.4],
        [16, 160, 2.6],
        [190, 90, 2.6],
      ]),
  };
};

const phoenix: Draw = (ctx) => {
  const plume = (d: string, w: number, color: string) =>
    line(d, OUTLINE, w + 2.4) + line(d, color, w);
  const flameTip = (x: number, y: number, color: string) =>
    outlined(
      "path",
      {
        d: `M${x} ${y - 4} C${x - 5} ${y} ${x - 4} ${y + 8} ${x} ${y + 11} C${x + 4} ${y + 6} ${x + 5} ${y + 1} ${x} ${y - 4} Z`,
        fill: color,
      },
      1.6,
    );
  const bird = g(
    {},
    // The tail: three plumes sweeping down the left side, with flame tips.
    g(
      { style: `transform-origin: -10px 4px; ${animate("mc-sway", 2.6)}` },
      plume("M-10 4 C-20 14 -22 30 -18 48", 3.4, c(ctx, 0)),
      plume("M-8 6 C-14 18 -12 32 -6 42", 2.6, c(ctx, 1)),
      plume("M-12 2 C-26 8 -30 22 -28 34", 2.6, c(ctx, 1)),
      flameTip(-18, 50, c(ctx, 1)),
      flameTip(-6, 43, c(ctx, 0)),
      flameTip(-28, 36, c(ctx, 0)),
    ),
    outlined(
      "path",
      { d: "M-13 2 C-13 -6 -3 -9 5 -7 C11 -6 14 -1 12 3 C8 8 -7 9 -13 2 Z", fill: c(ctx, 0) },
      2.2,
    ),
    el("path", {
      d: "M-8 4 C-3 6 3 6 8 3",
      fill: "none",
      stroke: c(ctx, 1),
      "stroke-width": 2,
      "stroke-linecap": "round",
    }),
    // The raised wing, beating from the shoulder.
    g(
      { style: `transform-origin: -2px -5px; ${animate("mc-sway", 0.9)}` },
      outlined(
        "path",
        {
          d: "M-2 -5 C-12 -10 -22 -20 -26 -32 C-21 -29 -17 -29 -14 -31 C-14 -25 -10 -23 -6 -25 C-5 -19 -1 -16 4 -15 C3 -9 1 -5 -2 -5 Z",
          fill: c(ctx, 0),
        },
        2.2,
      ),
      line("M-22 -28 C-18 -24 -14 -22 -10 -20 M-12 -27 C-9 -22 -6 -19 -2 -17", c(ctx, 1), 2),
    ),
    outlined("circle", { cx: 11, cy: -9, r: 6.4, fill: c(ctx, 0) }, 2.2),
    outlined("path", { d: "M16.4 -10 L23 -8 L16.4 -6 Z", fill: c(ctx, 1) }, 1.4),
    el("circle", { cx: 12.8, cy: -10, r: 1.4, fill: OUTLINE }),
    outlined(
      "path",
      {
        d: "M8 -14 C6 -20 9 -23 12 -24 C11 -21 12 -18 14 -16 Z M11 -15 C12 -21 16 -22 19 -22 C17 -20 17 -17 16 -15 Z",
        fill: c(ctx, 1),
      },
      1.4,
    ),
    SHINE("M-8 -3 C-5 -6 0 -7 4 -6", 0.5),
  );
  return {
    back: aureole(28, 44, 46, c(ctx, 1), 1.1) + aureole(100, 104, 96, c(ctx, 0), 0.35),
    front:
      bobAt(30, 48, 2.6, 0, g({ transform: "scale(1.15)" }, bird)) +
      rising(
        [
          [12, 120, 1.6],
          [24, 112, 1.3],
          [16, 134, 1.8],
          [6, 104, 1.2],
        ],
        c(ctx, 1),
        2.6,
      ) +
      twinkles([
        [60, 10, 3],
        [184, 40, 3],
      ]),
  };
};

const endlessSummer: Draw = (ctx) => {
  const beams = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const b = a + 0.16;
    return `M100 104 L${(100 + 110 * Math.cos(a)).toFixed(1)} ${(104 + 110 * Math.sin(a)).toFixed(1)} L${(100 + 110 * Math.cos(b)).toFixed(1)} ${(104 + 110 * Math.sin(b)).toFixed(1)} Z`;
  }).join(" ");
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5;
    return `M${(17 * Math.cos(a)).toFixed(1)} ${(17 * Math.sin(a)).toFixed(1)} L${(23 * Math.cos(a)).toFixed(1)} ${(23 * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const sun = g(
    { transform: "scale(1.25)" },
    g(
      { style: `transform-origin: 0px 0px; ${animate("mc-spin", 10, 0, "linear")}` },
      line(rays, c(ctx, 0), 3.2),
    ),
    outlined("circle", { cx: 0, cy: 0, r: 13, fill: c(ctx, 0) }, 2.4),
    outlined(
      "path",
      {
        d: "M-10 -4 H-1 C-1 1 -3 3 -6 3 C-9 3 -10 1 -10 -4 Z M1 -4 H10 C10 1 9 3 6 3 C3 3 1 1 1 -4 Z",
        fill: "#3A3350",
      },
      1.4,
    ),
    line("M-1 -3 H1", OUTLINE, 1.6),
    line("M-8 -2 L-6 -3.2", "#FFFFFF", 1, { opacity: 0.8 }),
    line("M3 -2 L5 -3.2", "#FFFFFF", 1, { opacity: 0.8 }),
    line("M-4 7 Q0 10 4 7", OUTLINE, 1.6),
  );
  const [[sx, sy] = [0, 0]] = around(88, -48);
  return {
    back:
      aureole(100, 104, 98, c(ctx, 0), 0.8) +
      g(
        {
          style: `mix-blend-mode: screen; transform-origin: 100px 104px; transform-box: view-box; ${animate("mc-spin", 60, 0, "linear")}`,
        },
        el("path", { d: beams, fill: tint(c(ctx, 1), 0.2), opacity: 0.1 }),
      ),
    front:
      orbit(
        40,
        false,
        upright(40, false, g({ transform: `translate(${sx.toFixed(1)} ${sy.toFixed(1)})` }, sun)),
      ) +
      twinkles([
        [26, 30, 3.4],
        [20, 160, 2.6],
      ]),
  };
};

const goldenSpotlight: Draw = (ctx) => {
  const glitter = [
    [64, 40],
    [136, 48],
    [52, 120],
    [150, 130],
    [80, 170],
    [124, 176],
    [40, 170],
    [164, 92],
  ];
  return {
    back: g(
      { style: "mix-blend-mode: screen" },
      el("path", {
        d: "M80 -4 L120 -4 L182 194 L18 194 Z",
        fill: tint(c(ctx, 1), 0.1),
        opacity: 0.16,
      }),
      el("path", {
        d: "M88 -4 L112 -4 L150 194 L50 194 Z",
        fill: tint(c(ctx, 1), 0.1),
        opacity: 0.18,
      }),
      el("ellipse", { cx: 100, cy: 190, rx: 76, ry: 11, fill: c(ctx, 1), opacity: 0.35 }),
      el("ellipse", { cx: 100, cy: 190, rx: 50, ry: 7, fill: c(ctx, 1), opacity: 0.4 }),
      ...glitter.map(([x = 0, y = 0], i) =>
        el("path", {
          d: sparkle(x, y, 3),
          fill: c(ctx, 0),
          style: animate("mc-twinkle", 1.8, i * 0.3),
        }),
      ),
    ),
    front:
      g(
        {},
        ...[
          [24, 0, 0],
          [176, 0, 1.2],
          [10, 60, 0.6],
          [190, 60, 1.8],
        ].map(([x = 0, y = 0, d = 0]) =>
          g(
            { transform: `translate(${x} ${y})` },
            g(
              { style: animate("mc-fall", 3.2, d, "linear") },
              outlined("path", { d: star(0, 0, 4.4), fill: c(ctx, 0) }, 1.4),
            ),
          ),
        ),
      ) +
      twinkles(
        [
          [34, 40, 4],
          [168, 34, 4],
          [24, 150, 3],
          [178, 150, 3],
        ],
        c(ctx, 1),
      ),
  };
};

const forestSpiritDeer: Draw = (ctx) => {
  const deer = g(
    {},
    line("M-8 -14 V0 M-3 -14 V0 M7 -14 V0 M11 -14 V0", OUTLINE, 4.4),
    line("M-8 -14 V0 M-3 -14 V0 M7 -14 V0 M11 -14 V0", c(ctx, 0), 2.4),
    outlined(
      "path",
      {
        d: "M-12 -18 C-12 -26 -2 -28 6 -27 C12 -26 15 -22 14 -16 C13 -12 8 -12 0 -12 C-8 -12 -12 -13 -12 -18 Z",
        fill: c(ctx, 0),
      },
      2.2,
    ),
    outlined("path", { d: "M-12 -22 C-16 -24 -17 -20 -14 -18 Z", fill: "#FFF3E0" }, 1.4),
    outlined(
      "path",
      { d: "M8 -24 C10 -32 12 -38 14 -40 L20 -38 C18 -32 16 -26 14 -20 Z", fill: c(ctx, 0) },
      2,
    ),
    outlined(
      "path",
      {
        d: "M12 -42 C12 -48 22 -48 24 -42 C25 -38 23 -36 18 -36 C14 -36 12 -38 12 -42 Z",
        fill: c(ctx, 0),
      },
      2,
    ),
    outlined("path", { d: "M23 -41 C27 -41 28 -38 25 -37 L22 -37 Z", fill: "#FFF3E0" }, 1.2),
    el("circle", { cx: 27, cy: -39.4, r: 1.2, fill: OUTLINE }),
    line("M18 -42 Q19.5 -40.6 21 -42", OUTLINE, 1.2),
    outlined("path", { d: "M12 -45 L6 -48 L11 -42 Z", fill: c(ctx, 0) }, 1.4),
    line(
      "M15 -46 C14 -52 12 -56 8 -58 M13.6 -51 C10 -51 8 -54 7 -56 M19 -46 C20 -52 23 -56 27 -58 M20.6 -51 C24 -51 26 -54 27 -55",
      c(ctx, 1),
      7,
      { opacity: 0.45, style: animate("mc-pulse", 2.4) },
    ),
    tube(
      "M15 -46 C14 -52 12 -56 8 -58 M13.6 -51 C10 -51 8 -54 7 -56 M19 -46 C20 -52 23 -56 27 -58 M20.6 -51 C24 -51 26 -54 27 -55",
      c(ctx, 2),
      4.2,
      2.2,
    ),
    ...[
      [-6, -22],
      [0, -24],
      [6, -21],
      [-2, -18],
      [10, -18],
    ].map(([x = 0, y = 0]) => el("circle", { cx: x, cy: y, r: 1.4, fill: c(ctx, 1) })),
    SHINE("M-8 -24 C-4 -26 0 -26 4 -26", 0.5),
  );
  const trail = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const x = 44 + t * 140;
    const y = 192 - Math.sin(t * Math.PI) * 6 - t * 8;
    return el("circle", {
      cx: x,
      cy: y,
      r: 2 - t * 0.6,
      fill: c(ctx, 1),
      style: animate("mc-twinkle", 2, i * 0.25),
    });
  }).join("");
  return {
    back:
      aureole(26, 156, 46, c(ctx, 1), 1.1) +
      g({ style: "mix-blend-mode: screen" }, trail) +
      g({ transform: "translate(36 192) scale(-1.3 1.3)" }, deer),
    front: [
      [30, 30, 0],
      [176, 34, 0.7],
      [12, 100, 1.4],
      [186, 80, 2.1],
      [50, 130, 0.4],
    ]
      .map(([x = 0, y = 0, d = 0]) =>
        bobAt(
          x,
          y,
          2.6,
          d,
          aureole(0, 0, 6, c(ctx, 1), 2),
          el("circle", {
            cx: 0,
            cy: 0,
            r: 1.8,
            fill: c(ctx, 1),
            style: animate("mc-twinkle", 1.6, d),
          }),
        ),
      )
      .join(""),
  };
};

export const pack: PackDrawings = {
  held: {
    "jellyfish-lamp": jellyfishLamp,
    "pocket-galaxy": pocketGalaxy,
    "lightning-jar": lightningJar,
  },
  aura: {
    "orbiting-books": orbitingBooks,
    "little-whale": littleWhale,
    "hearth-spirit": hearthSpirit,
    "bloom-ring": bloomRing,
    "sun-rainbow": sunRainbow,
    "floating-band": floatingBand,
    "espresso-swirl": espressoSwirl,
    "all-nighter": allNighter,
    "champion-laurel": championLaurel,
    "sugar-rush": sugarRush,
    "spirit-fox": spiritFox,
    "northern-lights": northernLights,
    "self-painting-strokes": selfPaintingStrokes,
    "orbit-globe": orbitGlobe,
    phoenix,
    "endless-summer": endlessSummer,
    "golden-spotlight": goldenSpotlight,
    "forest-spirit-deer": forestSpiritDeer,
  },
};
