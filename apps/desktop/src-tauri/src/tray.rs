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

// Menu bar (macOS) / system tray (Windows, Linux) icon and menu. A whole
// session can be run from here: the menu changes with the session and the
// countdown ticks in the menu bar (macOS) or the tooltip (Windows, Linux).

use std::sync::Mutex;

use tauri::{
    AppHandle, Emitter, Manager, Wry,
    image::Image,
    menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use crate::ring::{self, RingLook};
use crate::timer::{TimerKind, TimerSnapshot};

const TRAY_ID: &str = "main";

/// Menu actions the UI carries out, sent with the action id as payload:
/// start, start-five, pause, resume, extend, end, skip-break, full, compact.
pub const EVENT_ACTION: &str = "tray://action";
pub const EVENT_CHECK_UPDATES: &str = "tray://check-updates";

/// The live status line, and the last title and ring shown, so the tray is
/// only touched when something visible actually changes.
#[derive(Default)]
pub struct TrayState(Mutex<Shown>);

#[derive(Default)]
pub struct Shown {
    status_item: Option<MenuItem<Wry>>,
    title: String,
    ring: Option<RingLook>,
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("Headstart")
        .menu(&build_menu(app, None)?)
        // Left click opens the panel, right click the menu. Linux trays report
        // no clicks and always open the menu.
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => crate::show_main_window(app),
            "updates" => {
                crate::show_main_window(app);
                let _ = app.emit(EVENT_CHECK_UPDATES, ());
            }
            "quit" => app.exit(0),
            "full" | "compact" => {
                crate::panel::hide(app);
                crate::show_main_window(app);
                let _ = app.emit(EVENT_ACTION, event.id.as_ref());
            }
            action => {
                let _ = app.emit(EVENT_ACTION, action);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                crate::panel::toggle(tray.app_handle(), rect);
            }
        });

    // macOS draws a monochrome template image that adapts to light and dark
    // menu bars. Other systems use the full-colour app icon.
    let builder = if cfg!(target_os = "macos") {
        builder
            .icon(Image::from_bytes(include_bytes!(
                "../icons/tray-template.png"
            ))?)
            .icon_as_template(true)
    } else {
        match app.default_window_icon() {
            Some(icon) => builder.icon(icon.clone()),
            None => builder,
        }
    };

    let tray = builder.build(app)?;
    use_steady_digits(&tray);
    Ok(())
}

/// The idle icon: the logo, as a template on macOS.
fn idle_icon(app: &AppHandle) -> Option<Image<'static>> {
    if cfg!(target_os = "macos") {
        Image::from_bytes(include_bytes!("../icons/tray-template.png")).ok()
    } else {
        app.default_window_icon()
            .map(|icon| icon.clone().to_owned())
    }
}

/// macOS: digits of equal width, so the countdown does not make the menu bar
/// item (and everything beside it) shift every second.
#[cfg(target_os = "macos")]
fn use_steady_digits(tray: &tauri::tray::TrayIcon) {
    let _ = tray.with_inner_tray_icon(|inner| {
        let (Some(item), Some(mtm)) = (inner.ns_status_item(), objc2::MainThreadMarker::new())
        else {
            return;
        };
        let Some(button) = item.button(mtm) else {
            return;
        };
        let size = button.font().map(|font| font.pointSize()).unwrap_or(13.0);
        // SAFETY: a constant AppKit provides; reading it has no side effects.
        let weight = unsafe { objc2_app_kit::NSFontWeightRegular };
        let font = objc2_app_kit::NSFont::monospacedDigitSystemFontOfSize_weight(size, weight);
        button.setFont(Some(&font));
    });
}

#[cfg(not(target_os = "macos"))]
fn use_steady_digits(_tray: &tauri::tray::TrayIcon) {}

/// Rebuilds the menu for a new session state.
pub fn refresh(app: &AppHandle, timer: Option<&TimerSnapshot>) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return;
    };
    if let Ok(menu) = build_menu(app, timer) {
        let _ = tray.set_menu(Some(menu));
    }
    let had_ring = match app.state::<TrayState>().0.lock() {
        Ok(mut state) => {
            state.title.clear();
            if timer.is_none() {
                state.ring.take().is_some()
            } else {
                false
            }
        }
        Err(_) => false,
    };
    match timer {
        Some(timer) => tick(app, timer, crate::timer::now_ms()),
        None => {
            let _ = tray.set_title(None::<&str>);
            let _ = tray.set_tooltip(Some("Headstart"));
            if had_ring {
                let _ = tray.set_icon_with_as_template(idle_icon(app), cfg!(target_os = "macos"));
            }
        }
    }
}

/// Updates the countdown text. Called often; does nothing until it changes.
pub fn tick(app: &AppHandle, timer: &TimerSnapshot, now: f64) {
    // Only the time: paused and break show in the ring, so the width stays the same.
    let title = timer.clock(now);
    let look = RingLook::new(timer.kind, timer.paused(), timer.done_share(now));
    // Never hold the lock while touching the tray: those calls wait for the
    // main thread, which may itself be waiting for this lock in `refresh`.
    let tray_state = app.state::<TrayState>();
    let (status_item, new_title, new_ring) = {
        let Ok(mut state) = tray_state.0.lock() else {
            return;
        };
        let new_title = state.title != title;
        let new_ring = state.ring != Some(look);
        if !new_title && !new_ring {
            return;
        }
        state.title.clone_from(&title);
        state.ring = Some(look);
        (state.status_item.clone(), new_title, new_ring)
    };
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return;
    };
    if new_ring {
        let template = cfg!(target_os = "macos");
        let pixels = ring::draw(look, ring::SIZE, template);
        let icon = Image::new_owned(pixels, ring::SIZE, ring::SIZE);
        let _ = tray.set_icon_with_as_template(Some(icon), template);
    }
    if new_title {
        if let Some(item) = status_item {
            let _ = item.set_text(timer.status(now));
        }
        let _ = tray.set_title(Some(&title));
        let _ = tray.set_tooltip(Some(format!("Headstart: {}", timer.status(now))));
    }
}

fn build_menu(app: &AppHandle, timer: Option<&TimerSnapshot>) -> tauri::Result<Menu<Wry>> {
    let item = |id: &str, text: &str| MenuItem::with_id(app, id, text, true, None::<&str>);
    let separator = || PredefinedMenuItem::separator(app);
    let mut items: Vec<Box<dyn IsMenuItem<Wry>>> = Vec::new();
    let mut status = None;

    match timer {
        None => {
            items.push(Box::new(item("start", "Start focus session")?));
            items.push(Box::new(item("start-five", "Just 5 minutes")?));
            items.push(Box::new(separator()?));
            items.push(Box::new(item("open", "Open Headstart")?));
            items.push(Box::new(item("updates", "Check for updates")?));
        }
        Some(timer) => {
            let line = MenuItem::with_id(
                app,
                "status",
                timer.status(crate::timer::now_ms()),
                false,
                None::<&str>,
            )?;
            status = Some(line.clone());
            items.push(Box::new(line));
            items.push(Box::new(separator()?));
            match timer.kind {
                TimerKind::Focus => {
                    items.push(Box::new(if timer.paused() {
                        item("resume", "Resume")?
                    } else {
                        item("pause", "Pause")?
                    }));
                    items.push(Box::new(item("extend", "+5 minutes")?));
                    items.push(Box::new(item("end", "End session")?));
                    items.push(Box::new(separator()?));
                    items.push(Box::new(item("full", "Full-screen focus")?));
                    items.push(Box::new(item("compact", "Compact timer")?));
                }
                TimerKind::Break => {
                    items.push(Box::new(item("skip-break", "Skip break")?));
                    items.push(Box::new(separator()?));
                }
            }
            items.push(Box::new(item("open", "Open Headstart")?));
        }
    }
    items.push(Box::new(separator()?));
    items.push(Box::new(item("quit", "Quit Headstart")?));

    if let Ok(mut state) = app.state::<TrayState>().0.lock() {
        state.status_item = status;
    }
    let refs: Vec<&dyn IsMenuItem<Wry>> = items.iter().map(|i| i.as_ref()).collect();
    Menu::with_items(app, &refs)
}
