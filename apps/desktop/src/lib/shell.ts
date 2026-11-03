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

// Typed bridge to the Rust shell (src-tauri). Every call is a no-op outside
// Tauri, so the UI also runs in a plain browser with `pnpm dev`.

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { inTauri } from "./tauri.ts";

export type FocusLayout = "normal" | "full" | "compact";
export type TimerKind = "focus" | "break";

/** Actions from the tray menu, see `src-tauri/src/tray.rs`. */
export type TrayAction =
  | "start"
  | "start-five"
  | "pause"
  | "resume"
  | "extend"
  | "end"
  | "skip-break"
  | "full"
  | "compact";

export interface TimerSnapshot {
  kind: TimerKind;
  /** When the countdown reaches zero (epoch ms), or null while paused. */
  endsAt: number | null;
  remainingMs: number;
  doneTitle: string;
  doneBody: string;
}

/** Shows the countdown in the tray and arms the end-of-timer notification. */
export async function setTimer(timer: TimerSnapshot | null): Promise<void> {
  if (inTauri) await invoke("set_timer", { timer });
}

export async function setFocusLayout(layout: FocusLayout): Promise<void> {
  if (inTauri) await invoke("set_focus_layout", { layout });
}

/** True once if the app was launched with `--start`. */
export async function takeLaunchStart(): Promise<boolean> {
  return inTauri ? invoke<boolean>("take_launch_start") : false;
}

export interface ShellHandlers {
  onTrayAction: (action: TrayAction) => void;
  onTimerDone: (kind: TimerKind) => void;
  /** The global shortcut or `headstart --start`. */
  onStartOrShow: () => void;
  onCheckUpdates: () => void;
}

/** Subscribes to the shell's events. Returns a function that unsubscribes. */
export function listenToShell(handlers: ShellHandlers): () => void {
  if (!inTauri) return () => {};
  const pending = [
    listen<TrayAction>("tray://action", (e) => handlers.onTrayAction(e.payload)),
    listen<TimerKind>("timer://done", (e) => handlers.onTimerDone(e.payload)),
    listen("app://start-or-show", () => handlers.onStartOrShow()),
    listen("tray://check-updates", () => handlers.onCheckUpdates()),
  ];
  return () => {
    for (const unlisten of pending) unlisten.then((fn) => fn());
  };
}
