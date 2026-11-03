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

// Prints what a semester of studying looks like with the current rules, so
// XP, levels and crate odds can be tuned with real numbers.
//
//   pnpm --filter @headstart/core simulate [weeks] [min-sessions] [max-sessions] [seed]

import { RARITIES } from "@headstart/content";
import { defaultContext, simulateStudy } from "../src/index.ts";

const [weeks = "20", fewest = "2", most = "6", seed = "semester"] = process.argv.slice(2);

const { summary } = await simulateStudy({
  ctx: defaultContext,
  seed,
  weeks: Number(weeks),
  sessionsPerDay: [Number(fewest), Number(most)],
  restDays: [0],
});

const totalDrops = RARITIES.reduce((sum, r) => sum + summary.drops[r], 0);
const odds = defaultContext.crates.crates.study.odds;

console.log(
  `\nHeadstart simulation: ${weeks} weeks, ${fewest}–${most} sessions a study day, seed "${seed}"\n`,
);
console.log(`  Study days        ${summary.studyDays} of ${summary.days}`);
console.log(`  Sessions          ${summary.sessions} (${summary.focusHours} focus hours)`);
console.log(`  XP                ${summary.xp}`);
console.log(
  `  Level             ${summary.level.level} (${summary.level.xpIntoLevel} / ${summary.level.xpForNextLevel} XP into it)`,
);
console.log(`  Best on-time run  ${summary.bestOnTimeStreak} sessions`);
console.log(`  Crates opened     ${summary.cratesOpened}`);
console.log(`  Stardust          ${summary.stardust}`);
console.log(`  Items owned       ${summary.itemsOwned} of ${summary.itemsInCatalog}\n`);
console.log("  Rarity       drops   share   Study Crate odds");
for (const rarity of RARITIES) {
  const share = totalDrops ? ((summary.drops[rarity] / totalDrops) * 100).toFixed(1) : "0.0";
  console.log(
    `  ${rarity.padEnd(11)} ${String(summary.drops[rarity]).padStart(6)}  ${share.padStart(5)}%   ${odds[rarity]}%`,
  );
}
console.log(
  `\n  Longest run without Epic+: ${summary.longestWithoutEpic} crates (pity guarantees < ${defaultContext.crates.pity.epic})`,
);
console.log(
  `  Longest run without Legendary: ${summary.longestWithoutLegendary} crates (pity guarantees < ${defaultContext.crates.pity.legendary})\n`,
);
