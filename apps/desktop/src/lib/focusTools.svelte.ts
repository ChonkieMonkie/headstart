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

// The focus tools that belong to this computer: which apps the distraction
// guard watches, and whether sessions turn on Do Not Disturb. They are kept
// here and not in the study log, because apps differ from computer to
// computer and the log must never say which apps you use.

import type { AppInfo, GuardedApp } from "./shell.ts";

const KEY = "headstart.focusTools";
/** Set while Headstart has Do Not Disturb turned on, to turn it off after a crash. */
const DND_MARK = "headstart.dnd.on";

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

/**
 * Common chat and game apps to offer in "Add an app". The ids are what each
 * system calls the app: a bundle id on macOS, a program name on Windows, a
 * window class on Linux. The name also matches, so an unknown id is fine.
 */
const SUGGESTED: (GuardedApp & { macOnly?: boolean })[] = [
  { name: "Discord", ids: ["com.hnc.Discord", "discord"] },
  { name: "Steam", ids: ["com.valvesoftware.steam", "steam", "steamwebhelper"] },
  { name: "Messages", ids: ["com.apple.MobileSMS"], macOnly: true },
  { name: "WhatsApp", ids: ["net.whatsapp.WhatsApp", "whatsapp", "whatsapp.root"] },
  {
    name: "Telegram",
    ids: ["ru.keepcoder.Telegram", "org.telegram.desktop", "telegram", "telegramdesktop"],
  },
  { name: "Signal", ids: ["org.whispersystems.signal-desktop", "signal"] },
  { name: "Slack", ids: ["com.tinyspeck.slackmacgap", "slack"] },
  { name: "Mail", ids: ["com.apple.mail"], macOnly: true },
  { name: "Epic Games", ids: ["com.epicgames.EpicGamesLauncher", "epicgameslauncher"] },
];

/** Letters and digits in lower case, the same rule as the shell uses to match names. */
const plain = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** True when the two are the same app: a shared id, or the same name. */
export function sameApp(a: GuardedApp, b: GuardedApp): boolean {
  const ids = new Set(a.ids.map((id) => id.toLowerCase()));
  return plain(a.name) === plain(b.name) || b.ids.some((id) => ids.has(id.toLowerCase()));
}

/** An app from the system's list, as an app to guard. */
export const fromSystem = (app: AppInfo): GuardedApp => ({ name: app.name, ids: [app.id] });

/**
 * The suggestions worth showing: not guarded yet, and on this computer when
 * the system can list its apps (`installed` is empty where it cannot).
 */
export function suggestions(guarded: GuardedApp[], installed: AppInfo[]): GuardedApp[] {
  const here = new Set(installed.map((app) => app.id.toLowerCase()));
  return SUGGESTED.filter((app) => isMac || !app.macOnly)
    .filter((app) => here.size === 0 || app.ids.some((id) => here.has(id.toLowerCase())))
    .filter((app) => !guarded.some((g) => sameApp(g, app)))
    .map(({ name, ids }) => ({ name, ids }));
}

interface Saved {
  guardOn?: unknown;
  apps?: unknown;
  dndOn?: unknown;
}

function isApp(value: unknown): value is GuardedApp {
  const app = value as GuardedApp | null;
  return (
    typeof app?.name === "string" &&
    app.name.trim() !== "" &&
    Array.isArray(app.ids) &&
    app.ids.every((id) => typeof id === "string")
  );
}

export class FocusTools {
  /** Nudge when a guarded app comes to the front during a session. */
  guardOn = $state(false);
  apps = $state<GuardedApp[]>([]);
  /** Turn on Do Not Disturb while a session runs. */
  dndOn = $state(false);

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
      this.guardOn = saved?.guardOn === true;
      this.dndOn = saved?.dndOn === true;
      this.apps = Array.isArray(saved?.apps) ? saved.apps.filter(isApp) : [];
    } catch {
      // Nothing saved, or storage is off: everything stays off.
    }
  }

  #save(): void {
    try {
      const { guardOn, dndOn } = this;
      localStorage.setItem(KEY, JSON.stringify({ guardOn, dndOn, apps: this.apps }));
    } catch {
      // Not remembered until next time, which is fine.
    }
  }

  setGuard(on: boolean): void {
    this.guardOn = on;
    this.#save();
  }

  setDnd(on: boolean): void {
    this.dndOn = on;
    this.#save();
  }

  /** Adds an app to guard. An app that is there already only gains the new ids. */
  add(app: GuardedApp): void {
    const name = app.name.trim().slice(0, 60);
    if (!name) return;
    const known = this.apps.find((a) => sameApp(a, app));
    if (known) {
      const ids = new Set([...known.ids, ...app.ids]);
      this.apps = this.apps.map((a) => (a === known ? { ...a, ids: [...ids] } : a));
    } else {
      this.apps = [...this.apps, { name, ids: [...app.ids] }];
    }
    this.#save();
  }

  remove(app: GuardedApp): void {
    this.apps = this.apps.filter((a) => a !== app);
    this.#save();
  }
}

/** Remembers that Do Not Disturb is on because of Headstart, across a crash. */
export function markDnd(on: boolean): void {
  try {
    if (on) localStorage.setItem(DND_MARK, "1");
    else localStorage.removeItem(DND_MARK);
  } catch {
    // Without storage, quitting still turns it off (see dnd.rs).
  }
}

export function dndWasLeftOn(): boolean {
  try {
    return localStorage.getItem(DND_MARK) === "1";
  } catch {
    return false;
  }
}
