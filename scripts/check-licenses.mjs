// SPDX-License-Identifier: GPL-3.0-or-later
//
// Fails if any JavaScript dependency has a licence that is not compatible with
// shipping Headstart under GPL-3.0-or-later. Rust crates are checked by cargo-deny.

import { execFileSync } from "node:child_process";

/** Licences that may be combined with or shipped alongside GPL-3.0-or-later code. */
const ALLOWED = new Set([
  "0BSD",
  "Apache-2.0",
  "BlueOak-1.0.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC-BY-4.0",
  "CC0-1.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "ISC",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",
  "MIT",
  "MIT-0",
  "MPL-2.0",
  "OFL-1.1",
  "Python-2.0",
  "Unlicense",
  "WTFPL",
  "Zlib",
]);

/** Evaluates simple SPDX expressions: "A OR B", "A AND B", "(A OR B)". */
function isAllowed(expression) {
  const cleaned = expression.replace(/[()]/g, "").trim();
  if (cleaned.includes(" OR ")) return cleaned.split(" OR ").some((part) => isAllowed(part));
  if (cleaned.includes(" AND ")) return cleaned.split(" AND ").every((part) => isAllowed(part));
  return ALLOWED.has(cleaned);
}

// Includes devDependencies on purpose: Svelte and friends end up in the shipped bundle.
const raw = execFileSync("pnpm", ["licenses", "list", "--json", "--recursive"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});
const byLicense = JSON.parse(raw);

const problems = [];
for (const [license, packages] of Object.entries(byLicense)) {
  if (isAllowed(license)) continue;
  for (const pkg of packages) {
    problems.push(`${pkg.name}@${(pkg.versions ?? [pkg.version]).join(", ")}: ${license}`);
  }
}

if (problems.length > 0) {
  console.error("Dependencies with licences not cleared for GPL-3.0-or-later:");
  for (const line of problems) console.error(`  - ${line}`);
  console.error("Review them, then either replace the package or add the licence to ALLOWED.");
  process.exit(1);
}

const count = Object.values(byLicense).reduce((sum, list) => sum + list.length, 0);
console.log(`All ${count} JavaScript dependencies have GPL-compatible licences.`);
