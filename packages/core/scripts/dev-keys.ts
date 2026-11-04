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

// Makes the key pair that signs developer tokens and grants, once.
//
//   pnpm --filter @headstart/core dev:keys
//
// The private key goes to .secrets/developer.key (ignored by git, back it up
// somewhere safe). Only the public key is printed; add it to DEVELOPER_KEYS
// in src/developer.ts.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

ed.hashes.sha512 = sha512;

const file = join(import.meta.dirname, "../../../.secrets/developer.key");
if (existsSync(file)) {
  console.error(`${file} already exists. Keep using it; a new key would not sign for the old one.`);
  process.exit(1);
}
const { secretKey, publicKey } = ed.keygen();
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, `${bytesToHex(secretKey)}\n`, { mode: 0o600 });
console.log(`Private key written to ${file}`);
console.log(`Public key (add it to DEVELOPER_KEYS): ${bytesToHex(publicKey)}`);
