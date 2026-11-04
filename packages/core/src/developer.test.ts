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

import * as ed from "@noble/ed25519";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { describe, expect, it } from "vitest";
import { collectionCount } from "./collection.ts";
import { claimGrant, developer } from "./commands.ts";
import { craftBlocker, cratePool } from "./crates.ts";
import { readDeveloperToken, readGrant, type Signed, verifySigned } from "./developer.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import type { CoreContext } from "./state.ts";
import { MemoryEventStore } from "./store.ts";

// A throwaway key pair, so the tests never need the real private key.
const { secretKey, publicKey } = ed.keygen();
const otherKey = ed.keygen();
const keys = [bytesToHex(publicKey)];
const sign = (value: object, key = secretKey): Signed => {
  const payload = JSON.stringify(value);
  return { payload, signature: bytesToHex(ed.sign(utf8ToBytes(payload), key)) };
};
const grantFor = (installId: string, itemId = "outfit.root-hoodie", grantId = "g1") =>
  sign({ v: 1, kind: "item", grantId, itemId, installId, issuedAt: "2026-11-05T09:00:00Z" });

async function open(
  ctx: Partial<CoreContext> = {},
  deviceId = "install-1",
  store = new MemoryEventStore(),
) {
  const context = { ...defaultContext, developerKeys: keys, ...ctx };
  const engine = await StudyEngine.open(store, { deviceId }, context);
  const run = async (command: Parameters<StudyEngine["run"]>[0]) => {
    const result = await engine.run(command);
    if (!result.ok) throw new Error(result.reason);
  };
  return { engine, run, context, store };
}

describe("signatures", () => {
  it("accept only payloads signed by a known key", () => {
    const signed = sign({ hello: 1 });
    expect(verifySigned(signed, keys)).toEqual({ hello: 1 });
    expect(verifySigned(sign({ hello: 1 }, otherKey.secretKey), keys)).toBeNull();
    expect(verifySigned({ ...signed, payload: '{"hello":2}' }, keys)).toBeNull();
    expect(verifySigned({ payload: "{}", signature: "zz" }, keys)).toBeNull();
    expect(verifySigned(null, keys)).toBeNull();
  });

  it("read a developer token only on the installation it was made for", () => {
    const token = JSON.stringify(
      sign({
        v: 1,
        kind: "developer",
        installId: "install-1",
        issuedAt: "x",
        grants: [grantFor("install-1")],
      }),
    );
    expect(readDeveloperToken(token, "install-1", keys)?.grants).toHaveLength(1);
    expect(readDeveloperToken(token, "install-2", keys)).toBeNull();
    expect(readDeveloperToken("not json", "install-1", keys)).toBeNull();
    expect(readGrant(grantFor("install-1"), keys)?.itemId).toBe("outfit.root-hoodie");
  });
});

describe("grants", () => {
  it("give a grant-only item once, to the installation named in the grant", async () => {
    const { engine, run, context } = await open();
    await run((s, c) => claimGrant(s, grantFor("install-1"), c, "install-1"));
    expect(engine.state.inventory.get("outfit.root-hoodie")).toBe(1);
    expect(
      claimGrant(
        engine.state,
        grantFor("install-1", "outfit.root-hoodie", "g2"),
        context,
        "install-1",
      ).ok,
    ).toBe(false);
    expect(
      claimGrant(engine.state, grantFor("install-2", "aura.code-orbit"), context, "install-1").ok,
    ).toBe(false);
    expect(
      claimGrant(engine.state, grantFor("install-1", "head.halo"), context, "install-1").ok,
    ).toBe(false);
  });

  it("are checked again when the log is read, so a forged or moved grant does nothing", async () => {
    const { store } = await open();
    const forged = {
      ...grantFor("install-1"),
      payload: grantFor("install-1").payload.replace("g1", "g9"),
    };
    await store.append({
      id: "a",
      deviceId: "install-1",
      seq: 1,
      occurredAt: "2026-11-05T09:00:00Z",
      schema: 1,
      event: { type: "item.granted", grant: forged },
    } as never);
    await store.append({
      id: "b",
      deviceId: "install-2",
      seq: 1,
      occurredAt: "2026-11-05T09:00:01Z",
      schema: 1,
      event: { type: "item.granted", grant: grantFor("install-1") },
    } as never);
    const { engine } = await open({}, "install-1", store);
    expect(engine.state.inventory.has("outfit.root-hoodie")).toBe(false);
  });

  it("keep Exotic items out of crates, crafting and the collection count until owned", async () => {
    const { engine, run } = await open();
    const before = collectionCount(engine.state, defaultContext.catalog);
    await run((s, c) => claimGrant(s, grantFor("install-1"), c, "install-1"));
    expect(collectionCount(engine.state, defaultContext.catalog)).toEqual(before);
    const hoodie = defaultContext.catalog.find((i) => i.id === "outfit.root-hoodie");
    expect(craftBlocker(hoodie, 1e9, new Map(), defaultContext.crates)).toMatch(
      /cannot be crafted/,
    );
    for (const crate of Object.values(defaultContext.crates.crates)) {
      expect(cratePool(crate, defaultContext.catalog).some((i) => i.grantOnly)).toBe(false);
    }
  });
});

describe("developer events", () => {
  it("change the debug profile", async () => {
    const { engine, run } = await open({ debug: true });
    await run((_s, c) => developer.giveItem("head.halo", c));
    await run((_s, c) => developer.addCrate("dev-1", "streak", c));
    await run((_s, c) => developer.setStardust(500, c));
    await run((_s, c) => developer.addXp(250, c));
    expect(engine.state.inventory.get("head.halo")).toBe(1);
    expect(engine.state.crates.at(-1)).toMatchObject({
      id: "dev-1",
      type: "streak",
      openedAt: null,
    });
    expect(engine.state.stardust).toBe(500);
    expect(engine.state.xp).toBe(250);
    await run((s, c) => developer.takeItem(s, "head.halo", c));
    expect(engine.state.inventory.has("head.halo")).toBe(false);
  });

  it("are refused, and ignored if present, in the real profile", async () => {
    const debug = await open({ debug: true });
    await debug.run((_s, c) => developer.setStardust(9999, c));
    expect(developer.setStardust(5, debug.context).ok).toBe(true);
    // The same log opened as a real profile ignores the developer events.
    const real = await open({ debug: false }, "install-1", debug.store);
    expect(real.engine.state.stardust).toBe(0);
    expect(developer.giveItem("head.halo", real.context).ok).toBe(false);
  });
});
