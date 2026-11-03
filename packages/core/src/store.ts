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

import { compareEvents, EVENT_SCHEMA, type EventEnvelope, type StudyEvent } from "./events.ts";
import { createUlidFactory } from "./ids.ts";

/** Where events are kept. The desktop app uses SQLite, tests use memory. */
export interface EventStore {
  load(): Promise<EventEnvelope[]>;
  append(envelope: EventEnvelope): Promise<void>;
}

export class MemoryEventStore implements EventStore {
  readonly #events: EventEnvelope[];

  constructor(initial: EventEnvelope[] = []) {
    this.#events = [...initial];
  }

  async load(): Promise<EventEnvelope[]> {
    return [...this.#events];
  }

  async append(envelope: EventEnvelope): Promise<void> {
    if (this.#events.some((e) => e.id === envelope.id)) {
      throw new Error(`Event ${envelope.id} is already stored`);
    }
    this.#events.push(envelope);
  }
}

export interface EventLogOptions {
  deviceId: string;
  /** Clock, replaceable in tests and simulations. */
  now?: () => Date;
  /** Id generator, replaceable in tests. */
  newId?: (now: number) => string;
}

export type EventListener = (envelope: EventEnvelope) => void;

/**
 * The append-only log of everything that happened. Wraps a store, assigns ids,
 * per-device sequence numbers and timestamps, and notifies listeners.
 */
export class EventLog {
  readonly #store: EventStore;
  readonly #events: EventEnvelope[];
  readonly #deviceId: string;
  readonly #now: () => Date;
  readonly #newId: (now: number) => string;
  readonly #listeners = new Set<EventListener>();
  #seq: number;

  private constructor(store: EventStore, events: EventEnvelope[], options: EventLogOptions) {
    this.#store = store;
    this.#events = events.sort(compareEvents);
    this.#deviceId = options.deviceId;
    this.#now = options.now ?? (() => new Date());
    this.#newId = options.newId ?? createUlidFactory();
    this.#seq = events
      .filter((e) => e.deviceId === options.deviceId)
      .reduce((max, e) => Math.max(max, e.seq), 0);
  }

  static async open(store: EventStore, options: EventLogOptions): Promise<EventLog> {
    return new EventLog(store, await store.load(), options);
  }

  get events(): readonly EventEnvelope[] {
    return this.#events;
  }

  async record<E extends StudyEvent>(event: E): Promise<EventEnvelope<E>> {
    const now = this.#now();
    const envelope: EventEnvelope<E> = {
      id: this.#newId(now.getTime()),
      deviceId: this.#deviceId,
      seq: this.#seq + 1,
      occurredAt: now.toISOString(),
      schema: EVENT_SCHEMA,
      event,
    };
    await this.#store.append(envelope);
    this.#seq = envelope.seq;
    this.#events.push(envelope);
    for (const listener of this.#listeners) listener(envelope);
    return envelope;
  }

  subscribe(listener: EventListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
