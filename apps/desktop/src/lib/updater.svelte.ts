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

// Checks GitHub Releases for a newer signed build and installs it.
// Update signatures use Tauri's own key, so this works without OS code signing.

import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { inTauri } from "./tauri.ts";

export type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "up-to-date" }
  | { kind: "available"; version: string }
  | { kind: "installing"; percent: number | null }
  | { kind: "error"; message: string };

export class Updater {
  status = $state<UpdateStatus>({ kind: "idle" });
  #update: Update | null = null;

  async check(): Promise<void> {
    if (!inTauri) {
      this.status = { kind: "error", message: "Updates only work in the desktop app." };
      return;
    }
    this.status = { kind: "checking" };
    try {
      this.#update = await check();
      this.status = this.#update
        ? { kind: "available", version: this.#update.version }
        : { kind: "up-to-date" };
    } catch (error) {
      this.status = { kind: "error", message: describe(error) };
    }
  }

  async install(): Promise<void> {
    const update = this.#update;
    if (!update) return;
    let total = 0;
    let received = 0;
    this.status = { kind: "installing", percent: null };
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") received += event.data.chunkLength;
        this.status = {
          kind: "installing",
          percent: total > 0 ? Math.round((received / total) * 100) : null,
        };
      });
      await relaunch();
    } catch (error) {
      this.status = { kind: "error", message: describe(error) };
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
