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

import type { MascotId, Slot } from "@headstart/content";
import type { Mood } from "@headstart/ui";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
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
  | "done-today"
  | "full"
  | "compact"
  /** Ticks a to-do of the running session off (or back on), from the panel. */
  | `toggle-todo:${string}`;

export interface TimerSnapshot {
  kind: TimerKind;
  /** When the countdown reaches zero (epoch ms), or null while paused. */
  endsAt: number | null;
  remainingMs: number;
  /** The whole countdown, for the progress ring in the tray. */
  totalMs: number;
  doneTitle: string;
  doneBody: string;
  /** Play a short sound with the notification. */
  chime: boolean;
}

/** Shows the countdown in the tray and arms the end-of-timer notification. */
export async function setTimer(timer: TimerSnapshot | null): Promise<void> {
  if (inTauri) await invoke("set_timer", { timer });
}

/** Sends a notification right away, to check that notifications get through. */
export async function testNotification(chime: boolean): Promise<boolean> {
  if (!inTauri) return false;
  await invoke("test_notification", { chime });
  return true;
}

export async function setFocusLayout(layout: FocusLayout): Promise<void> {
  if (inTauri) await invoke("set_focus_layout", { layout });
}

export interface ShellReminder {
  id: string;
  at: number;
  title: string;
  body: string;
}

/** Replaces the reminders the shell will show as notifications. */
export async function setReminders(reminders: ShellReminder[]): Promise<void> {
  if (inTauri) await invoke("set_reminders", { reminders });
}

/** The text of a calendar link (https only). Throws a readable message on failure. */
export async function fetchCalendar(url: string): Promise<string> {
  if (inTauri) return invoke<string>("fetch_calendar", { url });
  // In a plain browser most calendar servers block this, but some allow it.
  const response = await fetch(url).catch(() => null);
  if (!response?.ok)
    throw "Could not reach the calendar. In the browser preview, most links are blocked.";
  return response.text();
}

// Apple Calendar (macOS). See src-tauri/src/apple_calendar.rs.

export interface AppleCalendarInfo {
  id: string;
  title: string;
  source: string;
  icloud: boolean;
  writable: boolean;
}

export interface AppleEvent {
  id: string;
  calendarId: string;
  title: string;
  location: string;
  start: number;
  end: number;
  allDay: boolean;
}

export const appleCalendar = {
  status: () => invoke<string>("apple_calendar_status"),
  request: () => invoke<boolean>("apple_calendar_request"),
  list: () => invoke<AppleCalendarInfo[]>("apple_calendar_list"),
  create: (title: string) => invoke<string>("apple_calendar_create", { title }),
  events: (calendarIds: string[], from: number, to: number) =>
    invoke<AppleEvent[]>("apple_calendar_events", { calendarIds, from, to }),
  get: (id: string) => invoke<AppleEvent | null>("apple_calendar_get", { id }),
  save: (event: {
    id: string | null;
    calendarId: string;
    title: string;
    notes: string;
    start: number;
    end: number;
  }) => invoke<string>("apple_calendar_save", { event }),
  delete: (id: string) => invoke<void>("apple_calendar_delete", { id }),
  /** Calls back whenever the calendar database changes, from any app. */
  onChange: (handler: () => void): (() => void) => {
    let stop = () => {};
    listen("apple-calendar-changed", handler).then((unlisten) => (stop = unlisten));
    return () => stop();
  },
};

export async function openMainWindow(): Promise<void> {
  if (inTauri) await invoke("open_main_window");
}

export async function hidePanel(): Promise<void> {
  if (inTauri) await invoke("hide_panel");
}

export async function quitApp(): Promise<void> {
  if (inTauri) await invoke("quit_app");
}

/** What the tray panel shows. The main window computes it; the panel only renders it. */
export interface PanelSnapshot {
  timer: TimerSnapshot | null;
  /** The running session, or the next planned one. */
  heading: string | null;
  nextStep: string | null;
  /** The running session's to-dos, with the task each belongs to. */
  todos: { id: string; text: string; task: string | null; done: boolean }[];
  upNext: { time: string; course: string; task: string | null; startsNow: boolean } | null;
  focusTodayMinutes: number;
  sessionsToday: number;
  crateProgress: number;
  crateEvery: number;
  cratesWaiting: number;
  /** Length of a session started without a plan. */
  focusMinutes: number;
  /** The mascot as it looks right now, or null before one is chosen. */
  mascot: {
    species: MascotId;
    equipped: Partial<Record<Slot, string>>;
    mood: Mood;
    line: string;
  } | null;
}

const PANEL_SNAPSHOT = "panel://snapshot";
const PANEL_READY = "panel://ready";
const TRAY_ACTION = "tray://action";

/** Main window: send the panel what to show. */
export async function publishPanel(snapshot: PanelSnapshot): Promise<void> {
  if (inTauri) await emit(PANEL_SNAPSHOT, snapshot);
}

/** Panel: receive snapshots, and ask for a fresh one right away. */
export function listenToPanelSnapshots(handler: (snapshot: PanelSnapshot) => void): () => void {
  if (!inTauri) return () => {};
  const pending = listen<PanelSnapshot>(PANEL_SNAPSHOT, (e) => handler(e.payload));
  requestPanelSnapshot();
  return () => {
    pending.then((fn) => fn());
  };
}

export function requestPanelSnapshot(): void {
  if (inTauri) emit(PANEL_READY);
}

/** Panel: carry out an action in the main window, exactly like the tray menu. */
export async function sendAction(action: TrayAction): Promise<void> {
  if (inTauri) await emit(TRAY_ACTION, action);
}

/** True once if the app was launched with `--start`. */
/** The developer token file's text, if there is one next to the database. */
export async function readDeveloperTokenFile(): Promise<string | null> {
  return inTauri ? invoke<string | null>("read_developer_token") : null;
}

export async function takeLaunchStart(): Promise<boolean> {
  return inTauri ? invoke<boolean>("take_launch_start") : false;
}

export interface ShellHandlers {
  onTrayAction: (action: TrayAction) => void;
  onTimerDone: (kind: TimerKind) => void;
  /** The global shortcut or `headstart --start`. */
  onStartOrShow: () => void;
  onCheckUpdates: () => void;
  onPanelReady: () => void;
}

/** Subscribes to the shell's events. Returns a function that unsubscribes. */
export function listenToShell(handlers: ShellHandlers): () => void {
  if (!inTauri) return () => {};
  const pending = [
    listen<TrayAction>(TRAY_ACTION, (e) => handlers.onTrayAction(e.payload)),
    listen(PANEL_READY, () => handlers.onPanelReady()),
    listen<TimerKind>("timer://done", (e) => handlers.onTimerDone(e.payload)),
    listen("app://start-or-show", () => handlers.onStartOrShow()),
    listen("tray://check-updates", () => handlers.onCheckUpdates()),
  ];
  return () => {
    for (const unlisten of pending) unlisten.then((fn) => fn());
  };
}
