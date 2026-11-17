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
  changeSettings,
  claimWelcomeGift,
  completeSession,
  declineFreezes,
  earnPlaque,
  saveReflection,
  startSession,
  useFreezes,
} from "./commands.ts";
import { StudyEngine } from "./engine.ts";
import { defaultContext } from "./index.ts";
import { plaqueStandings, plaquesToEarn } from "./plaques.ts";
import { insightForLevel, rankFor } from "./rewards.ts";
import { reflectionWeek, weekOf, weekStanding } from "./weeks.ts";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
/** Monday 2 November 2026, 09:00. */
const MONDAY = new Date(2026, 10, 2, 9, 0).getTime();

async function setup() {
  let now = MONDAY;
  let n = 0;
  const engine = await StudyEngine.open(
    new MemoryEventStore(),
    { deviceId: "test", now: () => new Date(now) },
    defaultContext,
  );
  /** One 25-minute session at 09:00 on a day, counted from the first Monday. */
  const study = async (day: number, minutes = 25) => {
    now = MONDAY + day * DAY;
    await engine.run((s) => startSession(s, { sessionId: `s${++n}`, plannedMinutes: minutes }));
    now += minutes * MINUTE;
    await engine.run((s) => completeSession(s, { distractions: 0 }));
  };
  /** Studies on the first `days` days of a week. */
  const week = async (index: number, days: number) => {
    for (let d = 0; d < days; d++) await study(index * 7 + d);
  };
  return {
    engine,
    study,
    week,
    at: (day: number) => MONDAY + day * DAY,
    standing: (day: number) => weekStanding(engine.state, MONDAY + day * DAY, defaultContext),
    setNow: (day: number) => {
      now = MONDAY + day * DAY;
    },
  };
}

import { MemoryEventStore } from "./store.ts";

describe("weeks", () => {
  it("names a week by its Monday", () => {
    expect(weekOf("2026-11-02")).toBe("2026-11-02");
    expect(weekOf("2026-11-08")).toBe("2026-11-02");
    expect(weekOf("2026-11-09")).toBe("2026-11-09");
    // A look back on Sunday is about this week, on Monday about last week.
    expect(reflectionWeek("2026-11-08")).toBe("2026-11-02");
    expect(reflectionWeek("2026-11-09")).toBe("2026-11-02");
  });

  it("counts study days against the goal, and a missed day costs nothing", async () => {
    const t = await setup();
    await t.study(0);
    await t.study(1);
    await t.study(3);
    const friday = t.standing(4);
    expect(friday.current).toMatchObject({ studyDays: 3, goal: 5, met: false, minutes: 75 });
    expect(friday.days.map((d) => d.kind)).toEqual([
      "studied",
      "studied",
      "missed",
      "studied",
      "ahead",
      "ahead",
      "rest",
    ]);
    expect(friday.days[4]?.today).toBe(true);
    await t.study(4);
    await t.study(5);
    expect(t.standing(5).current.met).toBe(true);
    // Met already, so the week counts before it is over.
    expect(t.standing(5).run).toBe(1);
  });

  it("does not count a session that is too short as a study day", async () => {
    const t = await setup();
    await t.study(0, 5);
    expect(t.standing(0).current).toMatchObject({ studyDays: 0, sessions: 1 });
  });

  it("keeps a run of weeks and gives a freeze for every fourth", async () => {
    const t = await setup();
    for (let w = 0; w < 4; w++) await t.week(w, 5);
    const monday = t.standing(28);
    expect(monday).toMatchObject({ run: 4, best: 4, freezes: 1, pending: [] });
    for (let w = 4; w < 12; w++) await t.week(w, 5);
    // Never more than two saved.
    expect(t.standing(84)).toMatchObject({ run: 12, freezes: 2 });
  });

  it("asks before using a freeze, and yes keeps the run", async () => {
    const t = await setup();
    for (let w = 0; w < 4; w++) await t.week(w, 5);
    await t.week(4, 3);
    const monday = t.at(35);
    expect(t.standing(35)).toMatchObject({ run: 4, freezes: 1, pending: ["2026-11-30"] });
    const used = await t.engine.run((s, c) => useFreezes(s, c, monday));
    expect(used).toMatchObject({ ok: true, event: { weeks: ["2026-11-30"] } });
    const after = t.standing(35);
    expect(after).toMatchObject({ run: 4, freezes: 0, pending: [] });
    expect(after.history.at(-1)).toMatchObject({ met: false, frozen: true });
    // The next met week carries on from four.
    await t.week(5, 5);
    expect(t.standing(40).run).toBe(5);
  });

  it("ends the run and keeps the freeze when the answer is no", async () => {
    const t = await setup();
    for (let w = 0; w < 4; w++) await t.week(w, 5);
    await t.week(4, 2);
    await t.engine.run((s, c) => declineFreezes(s, c, t.at(35)));
    expect(t.standing(35)).toMatchObject({ run: 0, best: 4, freezes: 1, pending: [] });
    expect((await t.engine.run((s, c) => useFreezes(s, c, t.at(35)))).ok).toBe(false);
  });

  it("asks nothing and uses nothing when more weeks were missed than there are freezes", async () => {
    const t = await setup();
    for (let w = 0; w < 4; w++) await t.week(w, 5);
    // Two weeks with nothing, and one freeze.
    expect(t.standing(49)).toMatchObject({ run: 0, best: 4, freezes: 1, pending: [] });
    expect((await t.engine.run((s, c) => useFreezes(s, c, t.at(49)))).ok).toBe(false);
  });

  it("covers two missed weeks with two freezes in one answer", async () => {
    const t = await setup();
    for (let w = 0; w < 8; w++) await t.week(w, 5);
    expect(t.standing(70)).toMatchObject({ run: 8, freezes: 2 });
    expect(t.standing(70).pending).toEqual(["2026-12-28", "2027-01-04"]);
    await t.engine.run((s, c) => useFreezes(s, c, t.at(70)));
    expect(t.standing(70)).toMatchObject({ run: 8, freezes: 0, pending: [] });
  });

  it("lets a lower goal wait for next week and a higher one count at once", async () => {
    const t = await setup();
    await t.week(0, 3);
    t.setNow(5);
    await t.engine.run((s) => changeSettings(s, { studyDays: 3 }));
    expect(t.standing(6).current).toMatchObject({ goal: 5, met: false });
    expect(t.standing(7).current.goal).toBe(3);
    t.setNow(8);
    await t.engine.run((s) => changeSettings(s, { studyDays: 6 }));
    expect(t.standing(8).current.goal).toBe(6);
  });

  it("halves the goal in the week of coming back, and gives one crate", async () => {
    const t = await setup();
    await t.week(0, 5);
    // Nothing for two weeks, then back on a Wednesday.
    const back = t.standing(23);
    expect(back).toMatchObject({ welcomeBack: true, awayDays: 19 });
    expect(back.current).toMatchObject({ goal: 3, returnWeek: true });
    const gift = await t.engine.run((s, c) =>
      claimWelcomeGift(s, c, { giftId: "g1", now: t.at(23) }),
    );
    expect(gift.ok).toBe(true);
    expect(t.engine.state.crates.at(-1)).toMatchObject({ id: "gift:g1", type: "study" });
    // Not a second one for the same return.
    expect(
      (await t.engine.run((s, c) => claimWelcomeGift(s, c, { giftId: "g2", now: t.at(23) }))).ok,
    ).toBe(false);
    await t.study(23);
    const after = t.standing(24);
    expect(after.welcomeBack).toBe(false);
    // The halved goal stays for the rest of that week.
    expect(after.current).toMatchObject({ goal: 3, returnWeek: true, studyDays: 1 });
  });

  it("marks a week as rested when the rest day had no session", async () => {
    const t = await setup();
    await t.week(0, 5);
    await t.week(1, 7);
    const [first, second] = t.standing(14).history;
    expect(first?.rested).toBe(true);
    expect(second?.rested).toBe(false);
  });
});

describe("reflections", () => {
  it("saves three short answers for a week", async () => {
    const t = await setup();
    const saved = await t.engine.run((s) =>
      saveReflection(s, {
        week: "2026-11-02",
        well: " Mornings ",
        blocked: "",
        change: "Start early",
      }),
    );
    expect(saved.ok).toBe(true);
    expect(t.engine.state.reflections.get("2026-11-02")).toMatchObject({
      well: "Mornings",
      blocked: "",
      change: "Start early",
    });
    expect(
      (
        await t.engine.run((s) =>
          saveReflection(s, { week: "2026-11-02", well: "", blocked: " ", change: "" }),
        )
      ).ok,
    ).toBe(false);
    expect(
      (
        await t.engine.run((s) =>
          saveReflection(s, { week: "2026-11-03", well: "x", blocked: "", change: "" }),
        )
      ).ok,
    ).toBe(false);
  });
});

describe("levels", () => {
  it("pays Insight for each new level, worked out from the XP", async () => {
    const t = await setup();
    expect(insightForLevel(2, defaultContext.rewards)).toBe(30);
    expect(insightForLevel(8, defaultContext.rewards)).toBe(60);
    // 13 XP a session (10 for the time, 3 for no distractions): level 2 at 100 XP.
    for (let i = 0; i < 7; i++) await t.study(i);
    expect(t.engine.state.xp).toBe(91);
    expect(t.engine.state.stardust).toBe(0);
    await t.study(7);
    expect(t.engine.state.xp).toBe(104);
    expect(t.engine.state.stardust).toBe(30);
    expect(t.engine.state.levelPaid).toBe(2);
  });

  it("names the rank of a level", () => {
    const ranks = [
      { id: "a", name: "Newcomer", level: 1 },
      { id: "b", name: "Starter", level: 3 },
    ];
    expect(rankFor(1, ranks)?.name).toBe("Newcomer");
    expect(rankFor(2, ranks)?.name).toBe("Newcomer");
    expect(rankFor(9, ranks)?.name).toBe("Starter");
  });
});

describe("plaques", () => {
  it("reach tiers as the count passes each number, and keep them once earned", async () => {
    const t = await setup();
    await t.study(0);
    const now = t.at(1);
    const due = plaquesToEarn(t.engine.state, now, defaultContext);
    expect(due).toContainEqual({ plaqueId: "first-dip", tier: 1 });
    expect(due.some((p) => p.plaqueId === "session-stacker")).toBe(false);
    for (const plaque of due) {
      await t.engine.run((s, c) => earnPlaque(s, c, { ...plaque, now }));
    }
    expect(plaquesToEarn(t.engine.state, now, defaultContext)).toEqual([]);
    expect(t.engine.state.plaques.get("first-dip")?.tier).toBe(1);

    for (let i = 1; i < 10; i++) await t.study(i);
    const later = t.at(11);
    expect(plaquesToEarn(t.engine.state, later, defaultContext)).toContainEqual({
      plaqueId: "session-stacker",
      tier: 1,
    });
    const stacker = plaqueStandings(t.engine.state, later, defaultContext).find(
      (p) => p.def.id === "session-stacker",
    );
    expect(stacker).toMatchObject({ count: 10, tier: 0, reached: 1, next: 50 });
  });

  it("refuses a tier that has not been reached", async () => {
    const t = await setup();
    await t.study(0);
    const result = await t.engine.run((s, c) =>
      earnPlaque(s, c, { plaqueId: "session-stacker", tier: 1, now: t.at(1) }),
    );
    expect(result.ok).toBe(false);
  });

  it("counts the best run of weeks for Week Keeper", async () => {
    const t = await setup();
    for (let w = 0; w < 4; w++) await t.week(w, 5);
    const keeper = plaqueStandings(t.engine.state, t.at(28), defaultContext).find(
      (p) => p.def.id === "week-keeper",
    );
    expect(keeper).toMatchObject({ count: 4, reached: 2 });
  });
});
