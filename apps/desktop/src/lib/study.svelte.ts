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

// Opens the study engine for the UI: SQLite in the desktop app, memory in a
// plain browser (`pnpm dev`), and exposes a small reactive summary.

import {
  crateOdds,
  createUlidFactory,
  defaultContext,
  type EventStore,
  type LevelInfo,
  levelInfo,
  MemoryEventStore,
  type OddsRow,
  owns,
  StudyEngine,
  unopenedCrates,
} from "@headstart/core";
import { SqliteEventStore } from "./storage/sqlite.ts";
import { inTauri } from "./tauri.ts";

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
}

export class Study {
  engine: StudyEngine | null = null;
  ready = $state(false);
  error = $state<string | null>(null);
  summary = $state<ProgressSummary | null>(null);

  async open(): Promise<void> {
    try {
      const newId = createUlidFactory();
      let store: EventStore;
      let deviceId: string;
      if (inTauri) {
        const sqlite = await SqliteEventStore.open();
        deviceId = await sqlite.deviceId(() => newId());
        store = sqlite;
      } else {
        store = new MemoryEventStore();
        deviceId = "browser-preview";
      }
      this.engine = await StudyEngine.open(store, { deviceId, newId }, defaultContext);
      this.engine.subscribe(() => this.#refresh());
      this.#refresh();
      this.ready = true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    }
  }

  #refresh(): void {
    if (!this.engine) return;
    const { state, context } = this.engine;
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
    };
  }
}
