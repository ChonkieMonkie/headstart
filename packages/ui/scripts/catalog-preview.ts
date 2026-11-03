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

// Writes one HTML page that shows every item in the catalogue on every mascot
// it fits, plus each mascot in every mood. Open it to review the art.
//
//   pnpm --filter @headstart/ui preview:catalog <output.html>

import { readFileSync, writeFileSync } from "node:fs";
import { items, MASCOTS, RARITIES, SLOTS } from "@headstart/content";
import { MASCOT_TINTS, MOODS } from "../src/mascot/geometry.ts";
import { itemPreview, lookFor } from "../src/mascot/look.ts";
import { renderMascot } from "../src/mascot/render.ts";
import { rarityColors } from "../src/tokens.ts";

const output = process.argv[2];
if (!output) {
  console.error("Usage: catalog-preview <output.html>");
  process.exit(1);
}

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const keyframes = css.slice(css.indexOf("/* Mascot animations."));
const svg = (inner: string, size = 132) =>
  `<svg viewBox="0 0 200 200" width="${size}" height="${size}">${inner}</svg>`;
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

let html = "<h1>Moods</h1>";
for (const species of MASCOTS) {
  html += '<div class="row">';
  for (const mood of MOODS) {
    html += `<figure style="background:${MASCOT_TINTS[species]}">${svg(renderMascot(lookFor(species, {}, items), mood))}<figcaption>${species} · ${mood}</figcaption></figure>`;
  }
  html += "</div>";
}

for (const slot of SLOTS) {
  html += `<h1>${slot}</h1>`;
  const inSlot = items
    .filter((i) => i.slot === slot)
    .sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity));
  for (const item of inSlot) {
    const color = rarityColors[item.rarity];
    html += `<div class="item"><h2>${escapeHtml(item.name)} <span style="color:${color.fg};background:${color.bg}">${item.rarity}</span> <code>${item.id}</code></h2><div class="row">`;
    for (const species of item.fits ?? MASCOTS) {
      for (const mood of ["idle", "celebrate"] as const) {
        html += `<figure style="background:${MASCOT_TINTS[species]}">${svg(renderMascot(itemPreview(item, species, items), mood))}</figure>`;
      }
    }
    html += "</div></div>";
  }
}

writeFileSync(
  output,
  `<!doctype html><meta charset="utf-8"><title>Headstart catalogue</title>
<style>
body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#F3F5FA;color:#1B2236}
h1{text-transform:capitalize;margin:32px 0 8px}h2{font-size:14px;margin:12px 0 6px}
h2 span{font-size:11px;padding:2px 6px;border-radius:6px;text-transform:uppercase}
code{color:#5A6378;font-weight:400}.row{display:flex;flex-wrap:wrap;gap:8px}
figure{margin:0;border-radius:12px;padding:4px;text-align:center;font-size:11px}
${keyframes}
</style>${html}`,
);
console.log(`Wrote ${items.length} items to ${output}`);
