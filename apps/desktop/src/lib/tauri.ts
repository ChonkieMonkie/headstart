// SPDX-License-Identifier: GPL-3.0-or-later

/** True inside the Tauri shell, false when the UI runs in a plain browser (`pnpm dev`). */
export const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
