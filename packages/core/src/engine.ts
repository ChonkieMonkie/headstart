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

// Ties the event log and the projection together: the one object the app
// talks to. Run a command, and if it is allowed its event is stored and the
// state updated.

import type { CommandResult } from "./commands.ts";
import type { EventEnvelope, StudyEvent } from "./events.ts";
import { applyEvent, type CoreContext, type ProgressState, project } from "./state.ts";
import { EventLog, type EventLogOptions, type EventStore } from "./store.ts";

export type StateListener = (state: ProgressState, envelope: EventEnvelope) => void;

export class StudyEngine {
  readonly #log: EventLog;
  readonly #ctx: CoreContext;
  readonly #state: ProgressState;
  readonly #listeners = new Set<StateListener>();

  private constructor(log: EventLog, ctx: CoreContext) {
    this.#log = log;
    this.#ctx = ctx;
    this.#state = project(log.events, ctx);
  }

  static async open(
    store: EventStore,
    options: EventLogOptions,
    ctx: CoreContext,
  ): Promise<StudyEngine> {
    return new StudyEngine(await EventLog.open(store, options), ctx);
  }

  get state(): ProgressState {
    return this.#state;
  }

  get context(): CoreContext {
    return this.#ctx;
  }

  get events(): readonly EventEnvelope[] {
    return this.#log.events;
  }

  /**
   * Builds a command against the current state and records its event when it
   * is allowed. Example: `engine.run((s) => startSession(s, input))`.
   */
  async run<E extends StudyEvent>(
    command: (state: ProgressState, ctx: CoreContext) => CommandResult<E>,
  ): Promise<CommandResult<E>> {
    const result = command(this.#state, this.#ctx);
    if (!result.ok) return result;
    const envelope = await this.#log.record(result.event);
    applyEvent(this.#state, envelope, this.#ctx);
    for (const listener of this.#listeners) listener(this.#state, envelope);
    return result;
  }

  subscribe(listener: StateListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
