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

// The event log on disk: one SQLite file in the app's data folder. The tables
// are created by the migrations in src-tauri/src/lib.rs.

import type { EventEnvelope, EventStore, StudyEvent } from "@headstart/core";
import Database from "@tauri-apps/plugin-sql";

export const DATABASE_URL = "sqlite:headstart.db";
/** The debug profile: its own file, so testing never touches real progress. */
export const DEBUG_DATABASE_URL = "sqlite:headstart-debug.db";

interface EventRow {
  id: string;
  device_id: string;
  seq: number;
  occurred_at: string;
  schema: number;
  payload: string;
}

export class SqliteEventStore implements EventStore {
  readonly #db: Database;

  private constructor(db: Database) {
    this.#db = db;
  }

  static async open(url = DATABASE_URL): Promise<SqliteEventStore> {
    return new SqliteEventStore(await Database.load(url));
  }

  async load(): Promise<EventEnvelope[]> {
    const rows = await this.#db.select<EventRow[]>(
      "SELECT id, device_id, seq, occurred_at, schema, payload FROM events ORDER BY occurred_at, id",
    );
    return rows.map((row) => ({
      id: row.id,
      deviceId: row.device_id,
      seq: row.seq,
      occurredAt: row.occurred_at,
      schema: row.schema,
      event: JSON.parse(row.payload) as StudyEvent,
    }));
  }

  async append(envelope: EventEnvelope): Promise<void> {
    await this.#db.execute(
      "INSERT INTO events (id, device_id, seq, occurred_at, schema, type, payload) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        envelope.id,
        envelope.deviceId,
        envelope.seq,
        envelope.occurredAt,
        envelope.schema,
        envelope.event.type,
        JSON.stringify(envelope.event),
      ],
    );
  }

  /** Empties the log. Only ever used to reset the debug profile. */
  async clearDebugProfile(): Promise<void> {
    await this.#db.execute("DELETE FROM events");
  }

  /** This installation's device id, created on first launch. */
  async deviceId(create: () => string): Promise<string> {
    const rows = await this.#db.select<{ value: string }[]>(
      "SELECT value FROM meta WHERE key = 'device_id'",
    );
    const existing = rows[0]?.value;
    if (existing) return existing;
    const id = create();
    await this.#db.execute("INSERT INTO meta (key, value) VALUES ('device_id', $1)", [id]);
    return id;
  }
}
