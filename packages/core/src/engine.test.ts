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

import { describe, expect, it } from "vitest";
import {
  abandonSession,
  chooseMascot,
  completeSession,
  craftItem,
  equipItem,
  extendSession,
  openCrate,
  pauseSession,
  resumeSession,
  type StartSessionInput,
  startSession,
  writeRecall,
} from "./commands.ts";
import { NO_PITY, nextPity } from "./crates.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import { type CoreContext, createInitialState, project, unopenedCrates } from "./state.ts";
import { EventLog, MemoryEventStore } from "./store.ts";

const MINUTE = 60_000;
const ctx: CoreContext = {
  ...defaultContext,
  dayKey: (ms) => new Date(ms).toISOString().slice(0, 10),
};

async function setup(start = Date.UTC(2026, 10, 3, 9, 0)) {
  let now = start;
  const store = new MemoryEventStore();
  const engine = await StudyEngine.open(store, { deviceId: "test", now: () => new Date(now) }, ctx);
  let counter = 0;

  /** Runs one full session through the real commands. */
  async function study(
    minutes = 25,
    options: { planned?: number | null; distractions?: number; recall?: string } = {},
  ) {
    const sessionId = `s${++counter}`;
    const input: StartSessionInput = { sessionId, plannedMinutes: minutes };
    const planned = options.planned === undefined ? now : options.planned;
    if (planned !== null) input.plannedStartAt = new Date(planned);
    await engine.run((s) => startSession(s, input));
    now += minutes * MINUTE;
    await engine.run((s) => completeSession(s, { distractions: options.distractions ?? 0 }));
    if (options.recall) await engine.run((s) => writeRecall(s, sessionId, options.recall ?? ""));
    now += 5 * MINUTE;
    return sessionId;
  }

  return {
    engine,
    store,
    study,
    advance: (minutes: number) => {
      now += minutes * MINUTE;
    },
  };
}

describe("study sessions", () => {
  it("reward a full, on-time, distraction-free session with 18 XP", async () => {
    const { engine, study } = await setup();
    const id = await study();
    expect(engine.state.xp).toBe(18);
    expect(engine.state.sessions.get(id)?.score).toMatchObject({ focusMinutes: 25, onTime: true });
    expect(engine.state.onTimeStreak).toBe(1);
    expect(engine.state.active).toBeNull();
  });

  it("count no more than the planned and extended time when completed late", async () => {
    const { engine, advance } = await setup();
    await engine.run((s) => startSession(s, { sessionId: "late", plannedMinutes: 25 }));
    await engine.run((s) => extendSession(s, 5));
    advance(180);
    await engine.run((s) => completeSession(s));
    expect(engine.state.sessions.get("late")?.score.focusMinutes).toBe(30);
    expect(engine.state.focusMinutes).toBe(30);
  });

  it("break the on-time streak on a late start, but not on an unplanned one", async () => {
    const { engine, study } = await setup();
    await study();
    await study(25, { planned: null });
    expect(engine.state.onTimeStreak).toBe(1);
    await study(25, { planned: Date.UTC(2026, 10, 3, 8, 0) }); // planned hours earlier

    expect(engine.state.onTimeStreak).toBe(0);
    expect(engine.state.bestOnTimeStreak).toBe(1);
  });

  it("leave paused time out of the focus time", async () => {
    const { engine, advance } = await setup();
    await engine.run((s) => startSession(s, { sessionId: "p", plannedMinutes: 25 }));
    advance(10);
    await engine.run(pauseSession);
    advance(30);
    await engine.run(resumeSession);
    advance(15);
    await engine.run((s) => completeSession(s));
    expect(engine.state.sessions.get("p")?.score.focusMinutes).toBe(25);
  });

  it("let a session be extended", async () => {
    const { engine, advance } = await setup();
    await engine.run((s) => startSession(s, { sessionId: "e", plannedMinutes: 25 }));
    await engine.run((s) => extendSession(s, 5));
    expect(engine.state.active?.extendedMs).toBe(5 * MINUTE);
    advance(30);
    await engine.run((s) => completeSession(s));
    expect(engine.state.sessions.get("e")?.score.focusMinutes).toBe(30);
  });

  it("give nothing for an abandoned session", async () => {
    const { engine, advance } = await setup();
    await engine.run((s) => startSession(s, { sessionId: "a", plannedMinutes: 25 }));
    advance(12);
    await engine.run(abandonSession);
    expect(engine.state.xp).toBe(0);
    expect(engine.state.sessions.size).toBe(0);
    expect(engine.state.active).toBeNull();
  });

  it("reward a recall once, and only with real content", async () => {
    const { engine, study } = await setup();
    const id = await study(25, { recall: "too short" });
    expect(engine.state.xp).toBe(18);
    await engine.run((s) => writeRecall(s, id, "Eigenvalues solve det(A - λI) = 0."));
    expect(engine.state.xp).toBe(23);
    await engine.run((s) => writeRecall(s, id, "Edited: eigenvectors keep their direction."));
    expect(engine.state.xp).toBe(23);
  });

  it("reject commands that do not fit the current state", async () => {
    const { engine } = await setup();
    expect((await engine.run(pauseSession)).ok).toBe(false);
    expect((await engine.run((s) => completeSession(s))).ok).toBe(false);
    expect(
      (await engine.run((s) => startSession(s, { sessionId: "x", plannedMinutes: 0 }))).ok,
    ).toBe(false);
    await engine.run((s) => startSession(s, { sessionId: "x", plannedMinutes: 25 }));
    const again = await engine.run((s) => startSession(s, { sessionId: "y", plannedMinutes: 25 }));
    expect(again).toEqual({ ok: false, reason: "A session is already running" });
    expect((await engine.run((s) => writeRecall(s, "x", "Not finished yet, sorry"))).ok).toBe(
      false,
    );
    expect(engine.events).toHaveLength(1);
  });
});

describe("Study Crates", () => {
  it("are earned every third qualifying session", async () => {
    const { engine, study } = await setup();
    await study();
    await study();
    expect(engine.state.crateProgress).toBe(2);
    await study();
    expect(unopenedCrates(engine.state)).toHaveLength(1);
    expect(engine.state.crateProgress).toBe(0);
  });

  it("do not count short sessions or more than nine sessions a day", async () => {
    const { engine, study } = await setup(Date.UTC(2026, 10, 3, 6, 0));
    await study(5);
    expect(engine.state.crateProgress).toBe(0);
    for (let i = 0; i < 12; i++) await study(25, { planned: null });
    expect(engine.state.crates).toHaveLength(3);
  });

  it("open once, add their items and update pity", async () => {
    const { engine, study } = await setup();
    for (let i = 0; i < 3; i++) await study();
    const crate = unopenedCrates(engine.state)[0];
    if (!crate) throw new Error("expected a crate");
    const opened = await engine.run((s, c) => openCrate(s, crate.id, c));
    expect(opened.ok).toBe(true);
    const drop = engine.state.crates[0]?.drops[0];
    if (!drop?.itemId) throw new Error("expected an item");
    expect(engine.state.inventory.get(drop.itemId)).toBe(1);
    expect(engine.state.pity).toEqual(nextPity(NO_PITY, drop.rarity));
    expect((await engine.run((s, c) => openCrate(s, crate.id, c))).ok).toBe(false);
  });
});

describe("wardrobe and crafting", () => {
  it("start with each mascot's starter skin owned and equipped", () => {
    const state = createInitialState(ctx);
    expect(state.inventory.get("skin.inky.classic")).toBe(1);
    expect(state.equipped.maple.skin).toBe("skin.maple.classic");
  });

  it("only equip owned items that fit the mascot and slot", () => {
    const state = createInitialState(ctx);
    expect(equipItem(state, "maple", "head", "head.headphones", ctx)).toMatchObject({
      ok: false,
      reason: /do not have/,
    });
    state.inventory.set("head.headphones", 1);
    state.inventory.set("outfit.forest-hoodie", 1);
    expect(equipItem(state, "maple", "head", "head.headphones", ctx).ok).toBe(true);
    expect(equipItem(state, "inky", "head", "head.headphones", ctx)).toMatchObject({
      ok: false,
      reason: /does not fit/,
    });
    expect(equipItem(state, "axo", "outfit", "outfit.forest-hoodie", ctx).ok).toBe(true);
    expect(equipItem(state, "maple", "face", "head.headphones", ctx).ok).toBe(false);
    expect(equipItem(state, "maple", "skin", null, ctx).ok).toBe(false);
    expect(equipItem(state, "maple", "head", null, ctx).ok).toBe(true);
  });

  it("craft with Stardust and spend it", async () => {
    const { engine } = await setup();
    engine.state.stardust = 450; // as if earned from duplicates
    const result = await engine.run((s, c) => craftItem(s, "head.headphones", c));
    expect(result).toMatchObject({ ok: true, event: { cost: 400 } });
    expect(engine.state.stardust).toBe(50);
    expect(engine.state.inventory.get("head.headphones")).toBe(1);
    expect((await engine.run((s, c) => craftItem(s, "head.headphones", c))).ok).toBe(false);
  });

  it("remember the chosen mascot", async () => {
    const { engine } = await setup();
    await engine.run(() => chooseMascot("maple"));
    expect(engine.state.mascot).toBe("maple");
  });
});

describe("event log", () => {
  it("rebuilds exactly the same state from stored events", async () => {
    const { engine, study, store } = await setup();
    for (let i = 0; i < 7; i++) await study(25, { recall: "A proper recall of the session." });
    for (const crate of unopenedCrates(engine.state))
      await engine.run((s, c) => openCrate(s, crate.id, c));

    const reloaded = await EventLog.open(store, { deviceId: "test" });
    const rebuilt = project(reloaded.events, ctx);
    expect(rebuilt.xp).toBe(engine.state.xp);
    expect(rebuilt.stardust).toBe(engine.state.stardust);
    expect(rebuilt.pity).toEqual(engine.state.pity);
    expect([...rebuilt.inventory]).toEqual([...engine.state.inventory]);
  });

  it("continues the per-device sequence after a restart", async () => {
    const { engine, store, study } = await setup();
    await study();
    const lastSeq = engine.events.at(-1)?.seq ?? 0;
    const reopened = await EventLog.open(store, { deviceId: "test" });
    const next = await reopened.record({ type: "mascot.chosen", mascot: "axo" });
    expect(next.seq).toBe(lastSeq + 1);
  });

  it("ignores events that do not fit, so a damaged log never crashes the app", () => {
    const state = project(
      [
        {
          id: "01",
          deviceId: "d",
          seq: 1,
          occurredAt: new Date(0).toISOString(),
          schema: 1,
          event: { type: "session.completed", sessionId: "ghost", distractions: 0 },
        },
      ],
      ctx,
    );
    expect(state.xp).toBe(0);
  });
});
