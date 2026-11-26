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

// Adds the ids of new items to data/ids.lock.json, in catalogue order. Never
// removes a line: an id, once shipped, stays forever.
//   node packages/content/scripts/lock-ids.ts

import { readFileSync, writeFileSync } from "node:fs";
import { items } from "../src/index.ts";

const file = new URL("../data/ids.lock.json", import.meta.url);
const locked: string[] = JSON.parse(readFileSync(file, "utf8"));
const known = new Set(locked);
const fresh = items.map((i) => i.id).filter((id) => !known.has(id));
writeFileSync(file, `${JSON.stringify([...locked, ...fresh], null, 0).replace(/","/g, '",\n"')}\n`);
console.log(`${fresh.length} new ids locked, ${locked.length + fresh.length} in total`);
