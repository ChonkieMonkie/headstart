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

// The distraction guard. During a session it checks which app is in front
// every two seconds. When one of the apps the user picked has been in front
// for ten seconds, a small card asks if they want to go back. Nothing inside
// the other app is read, and which app it was is never stored: the session
// only gets one more in its "got distracted" count.

use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, State, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

#[cfg_attr(target_os = "macos", path = "guard/macos.rs")]
#[cfg_attr(target_os = "windows", path = "guard/windows.rs")]
#[cfg_attr(
    not(any(target_os = "macos", target_os = "windows")),
    path = "guard/linux.rs"
)]
mod platform;

pub const NUDGE: &str = "nudge";
const NUDGE_SIZE: LogicalSize<f64> = LogicalSize::new(300.0, 176.0);
/// Gap between the nudge card and the top of the screen, in logical pixels.
const NUDGE_MARGIN: f64 = 24.0;

const POLL: Duration = Duration::from_secs(2);
/// A quick glance is free: the nudge comes after this long in the app.
const LINGER: Duration = Duration::from_secs(10);

/// To the main window: a nudge was shown, count one distraction.
const EVENT_NUDGE: &str = "guard://nudge";
/// To the main window: "I need it for this session", take that count back.
const EVENT_ALLOWED: &str = "guard://allowed";
/// To the nudge card: it was just shown, so fetch what to say.
const EVENT_SHOWN: &str = "guard://shown";

/// An app as the system names it. `id` is the bundle identifier on macOS, the
/// program name on Windows and the window class on Linux.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AppInfo {
    pub id: String,
    pub name: String,
}

/// The app in front right now.
#[derive(Debug, Clone)]
pub struct Front {
    pub id: String,
    pub name: String,
    /// Headstart itself (the main window, the tray panel or the nudge card).
    pub own: bool,
}

/// An app the user chose to guard. It matches by any of its ids, or by name.
#[derive(Debug, Clone, Deserialize)]
pub struct GuardedApp {
    name: String,
    #[serde(default)]
    ids: Vec<String>,
}

struct Visit {
    key: String,
    since: Instant,
    nudged: bool,
}

#[derive(Default)]
struct Inner {
    /// Goes up on every start and stop, so an older watcher thread ends.
    generation: u64,
    running: bool,
    session: String,
    apps: Vec<GuardedApp>,
    /// Apps let be for the rest of this session ("I need it for this session").
    allowed: Vec<String>,
    visit: Option<Visit>,
}

#[derive(Debug, PartialEq, Eq)]
enum Step {
    Nothing,
    Nudge,
    Hide,
}

/// Letters and digits in lower case, so "Epic Games" and "epicgames" are the same.
fn plain(text: &str) -> String {
    text.chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect()
}

impl Inner {
    /// The guarded app that is in front, as a key that stays the same for the session.
    fn guarded(&self, front: &Front) -> Option<String> {
        let (id, name) = (plain(&front.id), plain(&front.name));
        self.apps
            .iter()
            .find(|app| {
                let wanted = plain(&app.name);
                app.ids.iter().any(|i| i.eq_ignore_ascii_case(&front.id))
                    || (!wanted.is_empty() && (wanted == name || wanted == id))
            })
            .map(|app| plain(&app.name))
    }

    /// One look at the screen: what to do about the app in front.
    fn step(&mut self, front: Option<&Front>, main_focused: bool, now: Instant) -> Step {
        let hit = front
            .filter(|f| !f.own)
            .and_then(|f| self.guarded(f))
            .filter(|key| !self.allowed.contains(key));
        if let Some(key) = hit {
            return match &mut self.visit {
                Some(visit) if visit.key == key => {
                    if !visit.nudged && now.duration_since(visit.since) >= LINGER {
                        visit.nudged = true;
                        Step::Nudge
                    } else {
                        Step::Nothing
                    }
                }
                other => {
                    let shown = other.as_ref().is_some_and(|v| v.nudged);
                    *other = Some(Visit {
                        key,
                        since: now,
                        nudged: false,
                    });
                    if shown { Step::Hide } else { Step::Nothing }
                }
            };
        }
        // The nudge card (or the tray panel) can take focus itself. That is
        // not leaving the app, so the card stays until the user really moves on.
        let own_card = front.is_some_and(|f| f.own) && !main_focused;
        if own_card && self.visit.as_ref().is_some_and(|v| v.nudged) {
            return Step::Nothing;
        }
        match self.visit.take() {
            Some(visit) if visit.nudged => Step::Hide,
            _ => Step::Nothing,
        }
    }
}

#[derive(Default)]
pub struct GuardState(Mutex<Inner>);

#[derive(Serialize)]
pub struct Support {
    supported: bool,
    /// Why not, in words for the settings screen.
    reason: Option<String>,
}

#[derive(Serialize)]
pub struct Apps {
    /// Apps open right now.
    running: Vec<AppInfo>,
    /// Apps found on the computer (empty where they cannot be listed).
    installed: Vec<AppInfo>,
}

#[tauri::command]
pub fn guard_support() -> Support {
    match platform::supported() {
        Ok(()) => Support {
            supported: true,
            reason: None,
        },
        Err(reason) => Support {
            supported: false,
            reason: Some(reason.to_string()),
        },
    }
}

/// The apps to pick from. Async, so listing them never blocks the window.
#[tauri::command]
pub async fn guard_apps() -> Apps {
    tauri::async_runtime::spawn_blocking(|| {
        let tidy = |mut apps: Vec<AppInfo>| {
            apps.retain(|app| !app.name.is_empty());
            apps.sort_by_key(|app| app.name.to_lowercase());
            apps.dedup_by(|a, b| a.id.eq_ignore_ascii_case(&b.id));
            apps
        };
        Apps {
            running: tidy(platform::running()),
            installed: tidy(platform::installed()),
        }
    })
    .await
    .unwrap_or(Apps {
        running: Vec::new(),
        installed: Vec::new(),
    })
}

/// Starts watching for the session, or updates the app list while it runs.
#[tauri::command]
pub fn guard_start(
    app: AppHandle,
    state: State<'_, GuardState>,
    session: String,
    apps: Vec<GuardedApp>,
) {
    if platform::supported().is_err() {
        return;
    }
    let Ok(mut inner) = state.0.lock() else {
        return;
    };
    if inner.session != session {
        inner.allowed.clear();
        inner.session = session;
    }
    inner.apps = apps;
    if inner.running {
        return;
    }
    inner.running = true;
    inner.generation += 1;
    inner.visit = None;
    let generation = inner.generation;
    std::thread::spawn(move || watch(app, generation));
}

#[tauri::command]
pub fn guard_stop(app: AppHandle, state: State<'_, GuardState>) {
    if let Ok(mut inner) = state.0.lock() {
        if !inner.running {
            return;
        }
        inner.running = false;
        inner.generation += 1;
        inner.visit = None;
    }
    hide_nudge(&app);
}

/// "I need it for this session": that app is left alone until the session ends.
#[tauri::command]
pub fn guard_allow(app: AppHandle, state: State<'_, GuardState>) {
    if let Ok(mut inner) = state.0.lock()
        && let Some(visit) = inner.visit.take()
    {
        inner.allowed.push(visit.key);
    }
    hide_nudge(&app);
    let _ = app.emit_to("main", EVENT_ALLOWED, ());
}

/// "Back to studying": closes the card and brings Headstart to the front.
#[tauri::command]
pub fn guard_back(app: AppHandle, state: State<'_, GuardState>) {
    if let Ok(mut inner) = state.0.lock() {
        inner.visit = None;
    }
    hide_nudge(&app);
    crate::show_main_window(&app);
}

fn watch(app: AppHandle, generation: u64) {
    loop {
        std::thread::sleep(POLL);
        let front = platform::frontmost();
        let main_focused = app
            .get_webview_window("main")
            .is_some_and(|w| w.is_focused().unwrap_or(false));
        let step = {
            let state = app.state::<GuardState>();
            let Ok(mut inner) = state.0.lock() else {
                return;
            };
            if inner.generation != generation {
                return;
            }
            inner.step(front.as_ref(), main_focused, Instant::now())
        };
        match step {
            Step::Nudge => {
                show_nudge(&app);
                let _ = app.emit_to("main", EVENT_NUDGE, ());
            }
            Step::Hide => hide_nudge(&app),
            Step::Nothing => {}
        }
    }
}

/// The card is a second web view, so it is only made the first time it is needed.
fn create_nudge(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    WebviewWindowBuilder::new(app, NUDGE, WebviewUrl::App("nudge".into()))
        .title("Headstart")
        .inner_size(NUDGE_SIZE.width, NUDGE_SIZE.height)
        .resizable(false)
        .decorations(false)
        // Transparent, so the page can draw rounded corners.
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible_on_all_workspaces(true)
        // It floats above the other app without taking the keyboard from it.
        .focused(false)
        .visible(false)
        .build()
}

fn show_nudge(app: &AppHandle) {
    let card = match app.get_webview_window(NUDGE) {
        Some(card) => card,
        None => match create_nudge(app) {
            Ok(card) => card,
            Err(error) => {
                eprintln!("Could not open the nudge card: {error}");
                return;
            }
        },
    };
    // Top centre of the main screen, clear of the compact timer in the corner.
    if let Ok(Some(monitor)) = card.primary_monitor() {
        let area = monitor.work_area();
        let scale = monitor.scale_factor();
        let width = (NUDGE_SIZE.width * scale) as i32;
        let _ = card.set_position(PhysicalPosition::new(
            area.position.x + (area.size.width as i32 - width) / 2,
            area.position.y + (NUDGE_MARGIN * scale) as i32,
        ));
    }
    let _ = card.show();
    let _ = card.emit(EVENT_SHOWN, ());
}

fn hide_nudge(app: &AppHandle) {
    if let Some(card) = app.get_webview_window(NUDGE) {
        let _ = card.hide();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn front(id: &str, name: &str) -> Front {
        Front {
            id: id.into(),
            name: name.into(),
            own: false,
        }
    }

    fn own() -> Front {
        Front {
            id: "app.headstart".into(),
            name: "Headstart".into(),
            own: true,
        }
    }

    fn guarding() -> Inner {
        Inner {
            apps: vec![
                GuardedApp {
                    name: "Discord".into(),
                    ids: vec!["com.hnc.Discord".into()],
                },
                GuardedApp {
                    name: "Epic Games".into(),
                    ids: Vec::new(),
                },
            ],
            ..Inner::default()
        }
    }

    #[test]
    fn matches_by_id_or_by_name() {
        let inner = guarding();
        // The id matches even when the name is translated.
        assert!(
            inner
                .guarded(&front("com.hnc.discord", "Diskord"))
                .is_some()
        );
        assert!(inner.guarded(&front("epicgames", "EpicGames")).is_some());
        assert!(
            inner
                .guarded(&front("EpicGamesLauncher", "Epic Games"))
                .is_some()
        );
        assert!(
            inner
                .guarded(&front("com.apple.Safari", "Safari"))
                .is_none()
        );
    }

    #[test]
    fn a_quick_glance_is_free() {
        let mut inner = guarding();
        let start = Instant::now();
        let discord = front("com.hnc.Discord", "Discord");
        assert_eq!(inner.step(Some(&discord), false, start), Step::Nothing);
        let later = start + Duration::from_secs(8);
        assert_eq!(inner.step(Some(&discord), false, later), Step::Nothing);
        let safari = front("com.apple.Safari", "Safari");
        assert_eq!(inner.step(Some(&safari), false, later), Step::Nothing);
        assert!(inner.visit.is_none());
    }

    #[test]
    fn nudges_once_after_ten_seconds_and_hides_on_leaving() {
        let mut inner = guarding();
        let start = Instant::now();
        let discord = front("com.hnc.Discord", "Discord");
        inner.step(Some(&discord), false, start);
        let at = |s: u64| start + Duration::from_secs(s);
        assert_eq!(inner.step(Some(&discord), false, at(10)), Step::Nudge);
        assert_eq!(inner.step(Some(&discord), false, at(12)), Step::Nothing);
        // The card took focus: still the same visit.
        assert_eq!(inner.step(Some(&own()), false, at(14)), Step::Nothing);
        assert_eq!(inner.step(Some(&discord), false, at(16)), Step::Nothing);
        // Back in Headstart's main window: the card goes away.
        assert_eq!(inner.step(Some(&own()), true, at(18)), Step::Hide);
        // A new visit starts its own ten seconds.
        assert_eq!(inner.step(Some(&discord), false, at(20)), Step::Nothing);
        assert_eq!(inner.step(Some(&discord), false, at(30)), Step::Nudge);
    }

    #[test]
    fn an_allowed_app_is_left_alone() {
        let mut inner = guarding();
        inner.allowed.push(plain("Discord"));
        let start = Instant::now();
        let discord = front("com.hnc.Discord", "Discord");
        inner.step(Some(&discord), false, start);
        let later = start + Duration::from_secs(60);
        assert_eq!(inner.step(Some(&discord), false, later), Step::Nothing);
    }
}
