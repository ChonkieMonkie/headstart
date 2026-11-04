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

// Light and dark. The choice lives in the settings (and so in the log); a copy
// is kept in localStorage so `static/theme.js` can set it before the first paint
// and a dark window never flashes light while the log loads.

import type { Theme } from "@headstart/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { inTauri } from "./tauri.ts";

export const THEME_KEY = "headstart.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function show(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/**
 * Shows the theme and keeps following the computer while it is "system".
 * Returns a function that stops following.
 */
export function followTheme(choice: Theme): () => void {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage can be off; the theme then simply waits for the log on start.
  }
  // The window's own title bar follows too (null means the computer's setting).
  if (inTauri)
    getCurrentWindow()
      .setTheme(choice === "system" ? null : choice)
      .catch(() => {});
  if (choice !== "system") {
    show(choice === "dark");
    return () => {};
  }
  const query = matchMedia(DARK_QUERY);
  const update = () => show(query.matches);
  update();
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
}
