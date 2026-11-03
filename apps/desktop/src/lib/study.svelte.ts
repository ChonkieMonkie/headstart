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

// Opens the study engine for the UI (SQLite in the desktop app, memory in a
// plain browser with `pnpm dev`) and runs focus sessions: the countdown,
// breaks, focus layouts and the tray. Rules live in `@headstart/core`; this
// class only wires them to the screen and the shell.

import {
  type ActiveSession,
  abandonSession,
  breakAfter,
  completeSession,
  crateOdds,
  createUlidFactory,
  defaultContext,
  type EventStore,
  extendSession,
  focusedMs,
  isTimeUp,
  type LevelInfo,
  levelInfo,
  localDayKey,
  MemoryEventStore,
  type OddsRow,
  owns,
  pauseSession,
  remainingMs,
  resumeSession,
  StudyEngine,
  startSession,
  TIMER_PRESETS,
  type TimerPreset,
  unopenedCrates,
} from "@headstart/core";
import {
  type FocusLayout,
  listenToShell,
  setFocusLayout,
  setTimer,
  type TimerSnapshot,
  type TrayAction,
  takeLaunchStart,
} from "./shell.ts";
import { SqliteEventStore } from "./storage/sqlite.ts";
import { inTauri } from "./tauri.ts";

const MINUTE = 60_000;
/** In the app the shell announces the end of a timer (and notifies). The UI
 * only steps in itself if that announcement is this late. */
const SHELL_GRACE_MS = inTauri ? 3_000 : 0;
const LAYOUT_KEY = "headstart.focusLayout";

export type PresetId = keyof typeof TIMER_PRESETS;

export interface ProgressSummary {
  level: LevelInfo;
  stardust: number;
  sessions: number;
  focusMinutes: number;
  crateProgress: number;
  crateEvery: number;
  cratesWaiting: number;
  itemsOwned: number;
  /** Study Crate odds, with Epic and Legendary pity counted from your history. */
  studyCrateOdds: OddsRow[];
  sessionsToday: number;
}

export interface BreakTimer {
  endsAt: number;
  minutes: number;
  long: boolean;
}

/** What the last session earned, for the "session complete" card. */
export interface SessionResult {
  focusMinutes: number;
  xp: number;
  distractionFree: boolean;
  crateEarned: boolean;
  /** Too short to count: under a minute is discarded. */
  discarded: boolean;
}

export class Study {
  engine: StudyEngine | null = null;
  ready = $state(false);
  error = $state<string | null>(null);
  summary = $state<ProgressSummary | null>(null);

  /** The running session, copied out of the engine so the UI reacts to it. */
  active = $state<ActiveSession | null>(null);
  breakTimer = $state<BreakTimer | null>(null);
  lastResult = $state<SessionResult | null>(null);
  distractions = $state(0);
  layout = $state<FocusLayout>("normal");
  /** Ticks once a second while a timer runs. */
  now = $state(Date.now());

  #newId = createUlidFactory();
  #preset: TimerPreset = TIMER_PRESETS.classic;
  #finishing = false;
  #ticker: ReturnType<typeof setInterval> | null = null;
  #stopListening: () => void = () => {};
  onCheckUpdates: () => void = () => {};

  get remaining(): number {
    if (this.active) return remainingMs(this.active, this.now);
    if (this.breakTimer) return this.breakTimer.endsAt - this.now;
    return 0;
  }

  get paused(): boolean {
    return this.active?.pausedAt != null;
  }

  /** Share of the running timer that is done, 0 to 1. */
  get progress(): number {
    if (this.active) {
      const target = this.active.plannedMs + this.active.extendedMs;
      return Math.min(1, focusedMs(this.active, this.now) / target);
    }
    if (this.breakTimer) {
      return 1 - Math.max(0, this.remaining) / (this.breakTimer.minutes * MINUTE);
    }
    return 0;
  }

  /** The layout to use when a session starts, remembered between sessions. */
  get preferredLayout(): FocusLayout {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved === "full" || saved === "compact" || saved === "normal") return saved;
    } catch {
      // storage can be unavailable; fall back to the normal window
    }
    return "normal";
  }

  async open(): Promise<void> {
    try {
      let store: EventStore;
      let deviceId: string;
      if (inTauri) {
        const sqlite = await SqliteEventStore.open();
        deviceId = await sqlite.deviceId(() => this.#newId());
        store = sqlite;
      } else {
        store = new MemoryEventStore();
        deviceId = "browser-preview";
      }
      this.engine = await StudyEngine.open(store, { deviceId, newId: this.#newId }, defaultContext);
      this.engine.subscribe(() => this.#refresh());
      this.#stopListening = listenToShell({
        onTrayAction: (action) => this.#onTrayAction(action),
        onTimerDone: (kind) => (kind === "focus" ? this.#finish() : this.skipBreak()),
        onStartOrShow: () => {
          if (!this.active) this.start("classic");
        },
        onCheckUpdates: () => this.onCheckUpdates(),
      });
      this.#refresh();
      // A session left running when the app quit carries on, or finishes now.
      const running = this.engine.state.active;
      if (running)
        this.#preset =
          running.plannedMs >= 50 * MINUTE ? TIMER_PRESETS.deep : TIMER_PRESETS.classic;
      this.#sync();
      this.ready = true;
      if (await takeLaunchStart()) await this.start("classic");
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    }
  }

  close(): void {
    this.#stopListening();
    if (this.#ticker) clearInterval(this.#ticker);
  }

  async start(presetId: PresetId, options: { show?: boolean } = {}): Promise<void> {
    if (!this.engine || this.engine.state.active) return;
    const preset = TIMER_PRESETS[presetId];
    const result = await this.engine.run((s) =>
      startSession(s, { sessionId: this.#newId(), plannedMinutes: preset.focusMinutes }),
    );
    if (!result.ok) return;
    this.#preset = preset;
    this.distractions = 0;
    this.lastResult = null;
    this.breakTimer = null;
    this.#sync();
    if (options.show !== false) await this.setLayout(this.preferredLayout);
  }

  async pause(): Promise<void> {
    await this.engine?.run(pauseSession);
  }

  async resume(): Promise<void> {
    await this.engine?.run(resumeSession);
  }

  async togglePause(): Promise<void> {
    await (this.paused ? this.resume() : this.pause());
  }

  async extend(minutes = 5): Promise<void> {
    await this.engine?.run((s) => extendSession(s, minutes));
  }

  logDistraction(): void {
    if (this.active) this.distractions += 1;
  }

  /** Ends the session early. Time spent still counts; under a minute is discarded. */
  async end(): Promise<void> {
    if (!this.engine?.state.active) return;
    if (focusedMs(this.engine.state.active, Date.now()) < MINUTE) {
      await this.engine.run(abandonSession);
      this.lastResult = {
        focusMinutes: 0,
        xp: 0,
        distractionFree: false,
        crateEarned: false,
        discarded: true,
      };
      this.#sync();
      await this.setLayout("normal");
      return;
    }
    await this.#finish();
  }

  skipBreak(): void {
    if (!this.breakTimer) return;
    this.breakTimer = null;
    this.#sync();
  }

  /** Switches the window layout. During a session the choice is remembered. */
  async setLayout(layout: FocusLayout): Promise<void> {
    if (this.active) {
      try {
        localStorage.setItem(LAYOUT_KEY, layout);
      } catch {
        // not remembered, which is fine
      }
    }
    this.layout = layout;
    await setFocusLayout(layout);
  }

  async #finish(): Promise<void> {
    const engine = this.engine;
    const active = engine?.state.active;
    if (!engine || !active || this.#finishing) return;
    this.#finishing = true;
    try {
      const cratesBefore = engine.state.crates.length;
      const result = await engine.run((s) =>
        completeSession(s, { distractions: this.distractions }),
      );
      if (!result.ok) return;
      const record = engine.state.sessions.get(active.sessionId);
      this.lastResult = {
        focusMinutes: record?.score.focusMinutes ?? 0,
        xp: record?.score.totalXp ?? 0,
        distractionFree: record?.score.distractionFree ?? false,
        crateEarned: engine.state.crates.length > cratesBefore,
        discarded: false,
      };
      const rest = breakAfter(this.#sessionsToday(), this.#preset);
      this.breakTimer = { endsAt: Date.now() + rest.ms, minutes: rest.minutes, long: rest.long };
      this.#sync();
      if (this.layout !== "normal") await this.setLayout("normal");
    } finally {
      this.#finishing = false;
    }
  }

  #onTrayAction(action: TrayAction): void {
    switch (action) {
      case "start":
        this.start("classic", { show: false });
        return;
      case "start-five":
        this.start("justFive", { show: false });
        return;
      case "pause":
        this.pause();
        return;
      case "resume":
        this.resume();
        return;
      case "extend":
        this.extend();
        return;
      case "end":
        this.end();
        return;
      case "skip-break":
        this.skipBreak();
        return;
      case "full":
      case "compact":
        this.setLayout(action);
        return;
    }
  }

  #sessionsToday(): number {
    if (!this.engine) return 0;
    const today = localDayKey(Date.now());
    let count = 0;
    for (const record of this.engine.state.sessions.values()) {
      if (localDayKey(record.endedAt) === today) count += 1;
    }
    return count;
  }

  #refresh(): void {
    if (!this.engine) return;
    const { state, context } = this.engine;
    this.active = state.active ? { ...state.active } : null;
    this.summary = {
      level: levelInfo(state.xp, context.rewards),
      stardust: state.stardust,
      sessions: state.completedSessions,
      focusMinutes: state.focusMinutes,
      crateProgress: state.crateProgress,
      crateEvery: context.rewards.studyCrateEvery,
      cratesWaiting: unopenedCrates(state).length,
      itemsOwned: context.catalog.filter((item) => owns(state, item.id)).length,
      studyCrateOdds: crateOdds(context.crates.crates.study, context.crates, state.pity),
      sessionsToday: this.#sessionsToday(),
    };
    this.#sync();
  }

  /** Pushes the running timer to the tray and keeps the screen ticking. */
  #sync(): void {
    this.now = Date.now();
    const running = this.active !== null || this.breakTimer !== null;
    if (running && !this.#ticker) this.#ticker = setInterval(() => this.#tick(), 1000);
    if (!running && this.#ticker) {
      clearInterval(this.#ticker);
      this.#ticker = null;
    }
    setTimer(this.#snapshot());
  }

  #tick(): void {
    this.now = Date.now();
    // Normally the shell's `timer://done` ends the timer; this is the backup.
    if (this.active && isTimeUp(this.active, this.now - SHELL_GRACE_MS)) this.#finish();
    else if (this.breakTimer && this.now - SHELL_GRACE_MS >= this.breakTimer.endsAt)
      this.skipBreak();
  }

  #snapshot(): TimerSnapshot | null {
    const now = Date.now();
    if (this.active) {
      const left = remainingMs(this.active, now);
      const rest = breakAfter(this.#sessionsToday() + 1, this.#preset);
      const minutes = Math.round((this.active.plannedMs + this.active.extendedMs) / MINUTE);
      return {
        kind: "focus",
        endsAt: this.active.pausedAt === null ? now + left : null,
        remainingMs: left,
        doneTitle: `${minutes} minutes done!`,
        doneBody: `Nice work. Time for a ${rest.minutes}-minute break.`,
      };
    }
    if (this.breakTimer) {
      return {
        kind: "break",
        endsAt: this.breakTimer.endsAt,
        remainingMs: this.breakTimer.endsAt - now,
        doneTitle: "Break is over",
        doneBody: "The next session is ready when you are.",
      };
    }
    return null;
  }
}
