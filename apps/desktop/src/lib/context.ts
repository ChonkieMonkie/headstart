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

// Shares the one Study and Updater of the main window with every screen.

import { getContext, setContext } from "svelte";
import type { Study } from "./study.svelte.ts";
import type { Updater } from "./updater.svelte.ts";

const KEY = Symbol("headstart");

interface AppContext {
  study: Study;
  updater: Updater;
}

export function provideApp(context: AppContext): void {
  setContext(KEY, context);
}

export function useApp(): AppContext {
  const context = getContext<AppContext | undefined>(KEY);
  if (!context) throw new Error("useApp() needs the main window layout");
  return context;
}
