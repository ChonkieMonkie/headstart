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

// Linux: the window in front, on X11 only. Apps are known by their window
// class ("discord"). On Wayland an app cannot see which window is in front,
// so the guard is off there.

use x11rb::connection::Connection;
use x11rb::protocol::xproto::{AtomEnum, ConnectionExt, Window};
use x11rb::rust_connection::RustConnection;

use super::{AppInfo, Front};

pub fn supported() -> Result<(), &'static str> {
    let wayland = std::env::var("XDG_SESSION_TYPE").is_ok_and(|kind| kind == "wayland")
        || std::env::var_os("WAYLAND_DISPLAY").is_some();
    if wayland {
        return Err(
            "On Wayland, apps cannot see which window is in front, so the guard is not available.",
        );
    }
    if std::env::var_os("DISPLAY").is_none() {
        return Err("No display was found, so the guard is not available.");
    }
    Ok(())
}

struct Display {
    connection: RustConnection,
    root: Window,
}

fn open() -> Option<Display> {
    let (connection, screen) = x11rb::connect(None).ok()?;
    let root = connection.setup().roots.get(screen)?.root;
    Some(Display { connection, root })
}

impl Display {
    fn atom(&self, name: &str) -> Option<u32> {
        let reply = self.connection.intern_atom(true, name.as_bytes()).ok()?;
        Some(reply.reply().ok()?.atom).filter(|atom| *atom != 0)
    }

    /// The 32-bit values of a property, such as a list of windows.
    fn values(&self, window: Window, property: &str) -> Vec<u32> {
        let Some(atom) = self.atom(property) else {
            return Vec::new();
        };
        self.connection
            .get_property(false, window, atom, AtomEnum::ANY, 0, 4096)
            .ok()
            .and_then(|cookie| cookie.reply().ok())
            .and_then(|reply| reply.value32().map(|values| values.collect()))
            .unwrap_or_default()
    }

    /// The window class, the second of the two names in WM_CLASS.
    fn class(&self, window: Window) -> Option<String> {
        let reply = self
            .connection
            .get_property(false, window, AtomEnum::WM_CLASS, AtomEnum::STRING, 0, 256)
            .ok()?
            .reply()
            .ok()?;
        let mut names = reply
            .value
            .split(|byte| *byte == 0)
            .filter(|s| !s.is_empty());
        let instance = names.next()?;
        let class = names.next().unwrap_or(instance);
        Some(String::from_utf8_lossy(class).into_owned())
    }

    fn own(&self, window: Window) -> bool {
        self.values(window, "_NET_WM_PID").first() == Some(&std::process::id())
    }
}

pub fn frontmost() -> Option<Front> {
    let display = open()?;
    let window = *display.values(display.root, "_NET_ACTIVE_WINDOW").first()?;
    if window == 0 {
        return None;
    }
    let name = display.class(window)?;
    Some(Front {
        id: name.to_lowercase(),
        own: display.own(window),
        name,
    })
}

/// Apps with a window open, without Headstart itself.
pub fn running() -> Vec<AppInfo> {
    let Some(display) = open() else {
        return Vec::new();
    };
    display
        .values(display.root, "_NET_CLIENT_LIST")
        .into_iter()
        .filter(|window| !display.own(*window))
        .filter_map(|window| display.class(window))
        .map(|name| AppInfo {
            id: name.to_lowercase(),
            name,
        })
        .collect()
}

/// Not listed on Linux: the settings screen offers typing a name instead.
pub fn installed() -> Vec<AppInfo> {
    Vec::new()
}
