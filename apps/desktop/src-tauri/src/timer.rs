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

// Shows the running countdown in the tray and notices when it ends. The UI
// owns the session; it sends a snapshot here whenever something changes. A
// native thread does the ticking because a hidden web view may be throttled.

use std::collections::HashSet;
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;

/// Sent to the UI when a countdown reaches zero, with the timer's kind.
pub const EVENT_TIMER_DONE: &str = "timer://done";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TimerKind {
    Focus,
    Break,
}

/// What the UI tells the shell about the current countdown.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerSnapshot {
    pub kind: TimerKind,
    /// When the countdown reaches zero (epoch ms), or none while paused.
    pub ends_at: Option<f64>,
    /// Time left, used while paused.
    pub remaining_ms: f64,
    /// The notification shown when the countdown ends.
    pub done_title: String,
    pub done_body: String,
}

impl TimerSnapshot {
    pub fn paused(&self) -> bool {
        self.ends_at.is_none()
    }

    fn remaining_ms(&self, now: f64) -> f64 {
        match self.ends_at {
            Some(end) => end - now,
            None => self.remaining_ms,
        }
    }

    /// "18:42" or "4:05" (like `formatDuration` in core), rounded up so it reads 0:01 until the very end.
    pub fn clock(&self, now: f64) -> String {
        let seconds = (self.remaining_ms(now).max(0.0) / 1000.0).ceil() as u64;
        let (h, m, s) = (seconds / 3600, (seconds / 60) % 60, seconds % 60);
        if h > 0 {
            format!("{h}:{m:02}:{s:02}")
        } else {
            format!("{m}:{s:02}")
        }
    }

    /// The disabled status line at the top of the tray menu.
    pub fn status(&self, now: f64) -> String {
        let clock = self.clock(now);
        match (self.kind, self.paused()) {
            (TimerKind::Focus, false) => format!("{clock} until your break"),
            (TimerKind::Focus, true) => format!("Paused, {clock} left"),
            (TimerKind::Break, _) => format!("Break, {clock} left"),
        }
    }
}

/// A notification at a set time, such as "starting at 09:00".
#[derive(Debug, Clone, Deserialize)]
pub struct Reminder {
    /// Stable id: each reminder is shown once.
    pub id: String,
    /// Epoch ms.
    pub at: f64,
    pub title: String,
    pub body: String,
}

/// Reminders older than this when the ticker sees them are dropped, for
/// example after the computer slept through them.
const REMINDER_GRACE_MS: f64 = 60_000.0;

#[derive(Default)]
struct Reminders {
    pending: Vec<Reminder>,
    shown: HashSet<String>,
}

#[derive(Default)]
pub struct ReminderState(Mutex<Reminders>);

#[tauri::command]
pub fn set_reminders(state: State<'_, ReminderState>, reminders: Vec<Reminder>) {
    if let Ok(mut inner) = state.0.lock() {
        inner.pending = reminders;
    }
}

/// The reminders that are due now and not shown yet, marked as shown.
fn due_reminders(app: &AppHandle, now: f64) -> Vec<Reminder> {
    let state = app.state::<ReminderState>();
    let Ok(mut inner) = state.0.lock() else {
        return Vec::new();
    };
    let due: Vec<Reminder> = inner
        .pending
        .iter()
        .filter(|r| now >= r.at && now - r.at < REMINDER_GRACE_MS && !inner.shown.contains(&r.id))
        .cloned()
        .collect();
    for reminder in &due {
        inner.shown.insert(reminder.id.clone());
    }
    due
}

#[derive(Default)]
struct Inner {
    snapshot: Option<TimerSnapshot>,
    /// Set once the current countdown has ended, so it only fires once.
    done: bool,
}

#[derive(Default)]
pub struct TimerState(Mutex<Inner>);

pub fn now_ms() -> f64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as f64)
        .unwrap_or(0.0)
}

#[tauri::command]
pub fn set_timer(app: AppHandle, state: State<'_, TimerState>, timer: Option<TimerSnapshot>) {
    if let Ok(mut inner) = state.0.lock() {
        inner.done = false;
        inner.snapshot = timer.clone();
    }
    crate::tray::refresh(&app, timer.as_ref());
}

/// Starts the once-a-second tick that updates the tray and fires `timer://done`.
pub fn start_ticker(app: AppHandle) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_millis(250));
            let now = now_ms();
            for reminder in due_reminders(&app, now) {
                notify(&app, &reminder.title, &reminder.body);
            }
            let state = app.state::<TimerState>();
            let (snapshot, finished) = {
                let Ok(mut inner) = state.0.lock() else {
                    continue;
                };
                let Some(snapshot) = inner.snapshot.clone() else {
                    continue;
                };
                let finished =
                    !inner.done && !snapshot.paused() && snapshot.remaining_ms(now) <= 0.0;
                if finished {
                    inner.done = true;
                }
                (snapshot, finished)
            };

            crate::tray::tick(&app, &snapshot, now);
            if finished {
                let _ = app.emit(EVENT_TIMER_DONE, snapshot.kind);
                notify_unless_watching(&app, &snapshot);
            }
        }
    });
}

/// Someone looking at the app sees the end on screen; everyone else gets a
/// system notification.
fn notify_unless_watching(app: &AppHandle, snapshot: &TimerSnapshot) {
    let watching = app.get_webview_window("main").is_some_and(|window| {
        window.is_visible().unwrap_or(false) && window.is_focused().unwrap_or(false)
    });
    if !watching {
        notify(app, &snapshot.done_title, &snapshot.done_body);
    }
}

fn notify(app: &AppHandle, title: &str, body: &str) {
    let shown = app.notification().builder().title(title).body(body).show();
    if let Err(error) = shown {
        eprintln!("Could not show a notification: {error}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn focus(ends_at: Option<f64>, remaining_ms: f64) -> TimerSnapshot {
        TimerSnapshot {
            kind: TimerKind::Focus,
            ends_at,
            remaining_ms,
            done_title: String::new(),
            done_body: String::new(),
        }
    }

    #[test]
    fn clock_matches_the_app_and_rounds_up() {
        assert_eq!(focus(Some(25.0 * 60_000.0), 0.0).clock(0.0), "25:00");
        assert_eq!(focus(Some(245_001.0), 0.0).clock(0.0), "4:06");
        assert_eq!(focus(Some(1.0), 0.0).clock(0.0), "0:01");
        assert_eq!(focus(Some(0.0), 0.0).clock(5_000.0), "0:00");
        assert_eq!(focus(Some(3_723_000.0), 0.0).clock(0.0), "1:02:03");
    }

    #[test]
    fn paused_timers_use_the_time_left() {
        let paused = focus(None, 90_000.0);
        assert!(paused.paused());
        assert_eq!(paused.clock(1e12), "1:30");
        assert_eq!(paused.status(0.0), "Paused, 1:30 left");
    }

    #[test]
    fn reads_snapshots_from_the_ui() {
        let json =
            r#"{"kind":"break","endsAt":null,"remainingMs":5000,"doneTitle":"a","doneBody":"b"}"#;
        let snapshot: TimerSnapshot = serde_json::from_str(json).unwrap();
        assert_eq!(snapshot.kind, TimerKind::Break);
        assert_eq!(snapshot.status(0.0), "Break, 0:05 left");
    }
}
