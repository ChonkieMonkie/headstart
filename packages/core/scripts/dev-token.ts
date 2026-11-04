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

// Makes a developer token for one installation: it unlocks the developer menu
// there and carries signed grants for the developer items.
//
//   pnpm --filter @headstart/core dev:token [--install <id>] [--out <file>] [item ids…]
//
// Without --install, the id is read from the app's database on this computer
// (it is the device id in its meta table). Without --out, the token is written
// next to that database, where the app looks for it.

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

ed.hashes.sha512 = sha512;

const IDENTIFIER = "app.headstart.desktop";
const DEVELOPER_ITEMS = ["outfit.root-hoodie", "aura.code-orbit"];

function appFolder(): string {
  if (platform() === "darwin") return join(homedir(), "Library/Application Support", IDENTIFIER);
  if (platform() === "win32")
    return join(process.env.APPDATA ?? join(homedir(), "AppData/Roaming"), IDENTIFIER);
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), IDENTIFIER);
}

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
let installId = option("--install");
const out = option("--out") ?? join(appFolder(), "developer-token.json");
const itemIds = args.length > 0 ? args : DEVELOPER_ITEMS;

if (!installId) {
  const db = join(appFolder(), "headstart.db");
  if (!existsSync(db)) {
    console.error(`No database at ${db}. Open Headstart once, or pass --install <id>.`);
    process.exit(1);
  }
  installId = execFileSync(
    "sqlite3",
    // immutable=1 reads without touching the database, even while the app has it open.
    [`file:${db}?immutable=1`, "SELECT value FROM meta WHERE key = 'device_id'"],
    {
      encoding: "utf8",
    },
  ).trim();
}

const keyFile = join(import.meta.dirname, "../../../.secrets/developer.key");
const secretKey = hexToBytes(readFileSync(keyFile, "utf8").trim());
const sign = (value: object) => {
  const payload = JSON.stringify(value);
  return { payload, signature: bytesToHex(ed.sign(utf8ToBytes(payload), secretKey)) };
};

const issuedAt = new Date().toISOString();
const grants = itemIds.map((itemId) =>
  sign({ v: 1, kind: "item", grantId: randomUUID(), itemId, installId, issuedAt }),
);
writeFileSync(
  out,
  `${JSON.stringify(sign({ v: 1, kind: "developer", installId, issuedAt, grants }), null, 2)}\n`,
);
console.log(`Developer token for installation ${installId} with ${grants.length} grants: ${out}`);
