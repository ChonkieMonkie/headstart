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

// Tiny helpers for writing SVG as strings. The mascot is drawn as a string so
// the same code renders in the app, in tests and in the catalogue preview.

/** The dark outline every part of the mascot shares. */
export const OUTLINE = "#2A1F2D";

type Value = string | number | undefined | null | false;
export type Attrs = Record<string, Value>;

function format(value: string | number): string {
  if (typeof value === "number") return String(Math.round(value * 100) / 100);
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** One SVG element. Attributes that are undefined, null or false are left out. */
export function el(tag: string, attrs: Attrs, children = ""): string {
  let out = `<${tag}`;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    out += ` ${key}="${format(value)}"`;
  }
  return children === "" ? `${out}/>` : `${out}>${children}</${tag}>`;
}

export function g(attrs: Attrs, ...children: string[]): string {
  return el("g", attrs, children.join(""));
}

/** A shape with the shared outline. */
export function outlined(tag: string, attrs: Attrs, width = 3): string {
  return el(tag, { stroke: OUTLINE, "stroke-width": width, "stroke-linejoin": "round", ...attrs });
}

/** A line drawn twice: a thick outline under a thinner colour, like a tube. */
export function tube(
  d: string,
  color: string,
  outer: number,
  inner: number,
  style?: string,
): string {
  return (
    el("path", {
      d,
      fill: "none",
      stroke: OUTLINE,
      "stroke-width": outer,
      "stroke-linecap": "round",
    }) +
    el("path", {
      d,
      fill: "none",
      stroke: color,
      "stroke-width": inner,
      "stroke-linecap": "round",
      style,
    })
  );
}

/** A four-pointed sparkle centred on (x, y) with radius s. */
export function sparkle(x: number, y: number, s: number): string {
  const k = s * 0.28;
  return `M${x} ${y - s} L${x + k} ${y - k} L${x + s} ${y} L${x + k} ${y + k} L${x} ${y + s} L${x - k} ${y + k} L${x - s} ${y} L${x - k} ${y - k} Z`;
}

/** A five-pointed star centred on (x, y) with outer radius r. */
export function star(x: number, y: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${format(x + radius * Math.cos(angle))} ${format(y + radius * Math.sin(angle))}`);
  }
  return `M${points.join(" L")} Z`;
}

/** A heart centred on (x, y), about 2s wide. */
export function heart(x: number, y: number, s: number): string {
  return `M${x} ${y + s * 0.9} C${x - s * 1.3} ${y + s * 0.1} ${x - s * 1.1} ${y - s * 1.1} ${x - s * 0.45} ${y - s * 0.9} C${x - s * 0.15} ${y - s * 0.8} ${x} ${y - s * 0.55} ${x} ${y - s * 0.35} C${x} ${y - s * 0.55} ${x + s * 0.15} ${y - s * 0.8} ${x + s * 0.45} ${y - s * 0.9} C${x + s * 1.1} ${y - s * 1.1} ${x + s * 1.3} ${y + s * 0.1} ${x} ${y + s * 0.9} Z`;
}

/** A small five-petal flower with a yellow middle. */
export function flower(x: number, y: number, r: number, color: string): string {
  let petals = "";
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    petals += el("circle", { cx: x + r * Math.cos(a), cy: y + r * Math.sin(a), r: r * 0.72 });
  }
  return (
    g({ fill: color, stroke: OUTLINE, "stroke-width": 1.6 }, petals) +
    el("circle", {
      cx: x,
      cy: y,
      r: r * 0.55,
      fill: "#F5C542",
      stroke: OUTLINE,
      "stroke-width": 1.4,
    })
  );
}

/** A CSS animation value, or undefined when there is none. */
export function animate(name: string, seconds: number, delay = 0, timing = "ease-in-out"): string {
  return `animation: ${name} ${seconds}s ${timing} ${delay ? `${-delay}s ` : ""}infinite`;
}
