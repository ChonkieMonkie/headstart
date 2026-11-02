// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Formats a duration for timer displays: "4:05", "25:00" or "1:02:03".
 * Negative values clamp to zero; partial seconds round up so a running
 * countdown never shows "0:00" while time is still left.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
