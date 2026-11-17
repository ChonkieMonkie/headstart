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

// Do Not Disturb during sessions, where the system lets an app ask for it.
// It is off unless the user turns it on in Settings.
// - macOS: no app may switch a Focus on by itself, but it can run a Shortcut.
//   The user makes two once ("Headstart Focus On" and "Headstart Focus Off").
// - Linux with GNOME: notification banners are hidden through gsettings.
// - Windows: there is no way for an app to do this, so the option is not shown.

use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;

/// True while Headstart has Do Not Disturb turned on, so it can be turned off on quit.
static ON: AtomicBool = AtomicBool::new(false);

#[derive(Serialize)]
pub struct Status {
    /// "shortcuts" (macOS), "gnome" or "none".
    kind: &'static str,
    /// Everything it needs is in place.
    ready: bool,
    /// The Shortcuts still to make, by name.
    missing: Vec<&'static str>,
}

/// Runs a system tool and gives back what it printed.
#[cfg(any(target_os = "macos", target_os = "linux"))]
fn run(program: &str, args: &[&str]) -> Result<String, String> {
    let output = std::process::Command::new(program)
        .args(args)
        .output()
        .map_err(|error| format!("Could not run {program}: {error}"))?;
    if !output.status.success() {
        let said = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if said.is_empty() {
            format!("{program} did not work")
        } else {
            said
        });
    }
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[cfg(target_os = "macos")]
mod system {
    use super::{Status, run};

    const SHORTCUTS: &str = "/usr/bin/shortcuts";
    /// The two Shortcuts the user makes once. Settings shows the same names.
    const SHORTCUT_ON: &str = "Headstart Focus On";
    const SHORTCUT_OFF: &str = "Headstart Focus Off";

    pub fn status() -> Status {
        let listed = run(SHORTCUTS, &["list"]).unwrap_or_default();
        let missing: Vec<&'static str> = [SHORTCUT_ON, SHORTCUT_OFF]
            .into_iter()
            .filter(|name| !listed.lines().any(|line| line.trim() == *name))
            .collect();
        Status {
            kind: "shortcuts",
            ready: missing.is_empty(),
            missing,
        }
    }

    pub fn set(on: bool) -> Result<(), String> {
        let name = if on { SHORTCUT_ON } else { SHORTCUT_OFF };
        run(SHORTCUTS, &["run", name]).map(|_| ()).map_err(|said| {
            format!("The Shortcut \"{name}\" did not run. Check it in the Shortcuts app. ({said})")
        })
    }

    pub fn open_setup() -> Result<(), String> {
        run("/usr/bin/open", &["-a", "Shortcuts"]).map(|_| ())
    }
}

#[cfg(target_os = "linux")]
mod system {
    use std::sync::atomic::{AtomicBool, Ordering};

    use super::{Status, run};

    const SCHEMA: &str = "org.gnome.desktop.notifications";
    const KEY: &str = "show-banners";

    /// Banners were on before the session, so they are turned on again after it.
    static CHANGED: AtomicBool = AtomicBool::new(false);

    fn gnome() -> bool {
        std::env::var("XDG_CURRENT_DESKTOP")
            .is_ok_and(|desktop| desktop.to_uppercase().contains("GNOME"))
            && run("gsettings", &["get", SCHEMA, KEY]).is_ok()
    }

    pub fn status() -> Status {
        let ready = gnome();
        Status {
            kind: if ready { "gnome" } else { "none" },
            ready,
            missing: Vec::new(),
        }
    }

    pub fn set(on: bool) -> Result<(), String> {
        if on {
            let shown = run("gsettings", &["get", SCHEMA, KEY])?.trim() == "true";
            if shown {
                run("gsettings", &["set", SCHEMA, KEY, "false"])?;
                CHANGED.store(true, Ordering::SeqCst);
            }
        } else if CHANGED.swap(false, Ordering::SeqCst) {
            run("gsettings", &["set", SCHEMA, KEY, "true"])?;
        }
        Ok(())
    }

    /// After a crash the note of what was changed is gone: banners go back on.
    pub fn recover() -> Result<(), String> {
        run("gsettings", &["set", SCHEMA, KEY, "true"]).map(|_| ())
    }

    pub fn open_setup() -> Result<(), String> {
        Ok(())
    }
}

#[cfg(not(any(target_os = "macos", target_os = "linux")))]
mod system {
    use super::Status;

    pub fn status() -> Status {
        Status {
            kind: "none",
            ready: false,
            missing: Vec::new(),
        }
    }

    pub fn set(_on: bool) -> Result<(), String> {
        Err("Do Not Disturb is not available on this system".into())
    }

    pub fn open_setup() -> Result<(), String> {
        Ok(())
    }
}

fn switch(on: bool) -> Result<(), String> {
    system::set(on)?;
    ON.store(on, Ordering::SeqCst);
    Ok(())
}

/// Checked off the main thread: listing Shortcuts can take a moment.
#[tauri::command]
pub async fn dnd_status() -> Status {
    tauri::async_runtime::spawn_blocking(system::status)
        .await
        .unwrap_or(Status {
            kind: "none",
            ready: false,
            missing: Vec::new(),
        })
}

/// Turns Do Not Disturb on or off. `recover` is for the first start after a
/// session that never got to turn it off (the app quit or crashed).
#[tauri::command]
pub async fn dnd_set(on: bool, recover: Option<bool>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "linux")]
        if !on && recover == Some(true) {
            return system::recover();
        }
        let _ = recover;
        switch(on)
    })
    .await
    .map_err(|error| error.to_string())?
}

/// Opens the Shortcuts app for the one-time setup (macOS).
#[tauri::command]
pub async fn dnd_open_setup() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(system::open_setup)
        .await
        .map_err(|error| error.to_string())?
}

/// When Headstart quits during a session, the Focus must not stay on.
pub fn off_on_exit() {
    if ON.swap(false, Ordering::SeqCst) {
        let _ = system::set(false);
    }
}
