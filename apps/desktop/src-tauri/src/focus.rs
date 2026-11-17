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

// Window layouts for a focus session. The main window itself changes shape,
// so there is only ever one copy of the UI and its state:
// - normal:  the regular app window
// - full:    covers the whole screen and stays on top (friction, not a cage)
// - compact: a small timer that floats above other windows

use std::sync::Mutex;
use std::time::Duration;

use serde::Deserialize;
use tauri::{LogicalSize, PhysicalPosition, PhysicalSize, Size, State, WebviewWindow};

const NORMAL_MIN: LogicalSize<f64> = LogicalSize::new(960.0, 640.0);
const COMPACT: LogicalSize<f64> = LogicalSize::new(340.0, 132.0);
/// Gap between the compact timer and the screen edge, in logical pixels.
const COMPACT_MARGIN: f64 = 24.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Layout {
    #[default]
    Normal,
    Full,
    Compact,
}

struct Geometry {
    position: PhysicalPosition<i32>,
    size: PhysicalSize<u32>,
    maximized: bool,
}

#[derive(Default)]
struct Inner {
    current: Layout,
    /// Where the normal window was, to put it back afterwards.
    saved: Option<Geometry>,
}

#[derive(Default)]
pub struct LayoutState(Mutex<Inner>);

#[tauri::command]
pub async fn set_focus_layout(
    window: WebviewWindow,
    state: State<'_, LayoutState>,
    layout: Layout,
) -> Result<(), String> {
    let previous = {
        let mut inner = state.0.lock().map_err(|e| e.to_string())?;
        let previous = inner.current;
        if previous == Layout::Normal && layout != Layout::Normal {
            inner.saved = Some(Geometry {
                position: window.outer_position().map_err(|e| e.to_string())?,
                size: window.inner_size().map_err(|e| e.to_string())?,
                maximized: window.is_maximized().unwrap_or(false),
            });
        }
        inner.current = layout;
        previous
    };
    if previous != layout {
        leave(&window, previous).map_err(|e| e.to_string())?;
        if previous == Layout::Compact {
            wait_for_title_bar(&window);
            // The size and place saved for the normal window are only right
            // once the title bar is back.
            settle();
        }
        let saved = state.0.lock().map_err(|e| e.to_string())?.saved.take();
        // Never straight from full screen to the compact timer or back: macOS
        // finishes each change later, so go through the normal window first.
        if previous != Layout::Normal && layout != Layout::Normal {
            enter(&window, Layout::Normal, saved.as_ref()).map_err(|e| e.to_string())?;
            settle();
            leave(&window, Layout::Normal).map_err(|e| e.to_string())?;
        }
        enter(&window, layout, saved.as_ref()).map_err(|e| e.to_string())?;
        if layout != Layout::Normal
            && let Ok(mut inner) = state.0.lock()
        {
            inner.saved = saved;
        }
    }
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    Ok(())
}

fn leave(window: &WebviewWindow, layout: Layout) -> tauri::Result<()> {
    match layout {
        Layout::Normal => {
            if window.is_maximized().unwrap_or(false) {
                window.unmaximize()?;
            }
        }
        Layout::Full => {
            window.set_always_on_top(false)?;
            // Native full screen on Windows and Linux; macOS uses "simple"
            // full screen, which needs no animation or separate Space.
            window.set_simple_fullscreen(false)?;
            settle();
        }
        Layout::Compact => {
            window.set_always_on_top(false)?;
            window.set_visible_on_all_workspaces(false)?;
            window.set_resizable(true)?;
            show_frame(window, true)?;
        }
    }
    Ok(())
}

fn enter(window: &WebviewWindow, layout: Layout, saved: Option<&Geometry>) -> tauri::Result<()> {
    match layout {
        Layout::Normal => {
            window.set_min_size(Some(Size::Logical(NORMAL_MIN)))?;
            match saved {
                Some(geometry) => {
                    window.set_size(geometry.size)?;
                    window.set_position(geometry.position)?;
                    if geometry.maximized {
                        window.maximize()?;
                    }
                }
                None => window.center()?,
            }
        }
        Layout::Full => {
            window.set_min_size(Some(Size::Logical(NORMAL_MIN)))?;
            // From the compact timer, grow back first: full screen from a tiny
            // borderless window can end up offset by the menu bar on macOS.
            if let Some(geometry) = saved {
                window.set_size(geometry.size)?;
                window.set_position(geometry.position)?;
                settle();
            }
            window.set_simple_fullscreen(true)?;
            window.set_always_on_top(true)?;
        }
        Layout::Compact => {
            window.set_min_size(None::<Size>)?;
            window.set_resizable(false)?;
            show_frame(window, false)?;
            window.set_size(COMPACT)?;
            if let Some(monitor) = window.current_monitor()? {
                let area = monitor.work_area();
                let scale = monitor.scale_factor();
                let width = (COMPACT.width * scale) as i32;
                let margin = (COMPACT_MARGIN * scale) as i32;
                window.set_position(PhysicalPosition::new(
                    area.position.x + area.size.width as i32 - width - margin,
                    area.position.y + margin,
                ))?;
            }
            window.set_always_on_top(true)?;
            window.set_visible_on_all_workspaces(true)?;
        }
    }
    Ok(())
}

/// Shows or hides the window frame (title bar and border) for the compact timer.
///
/// On macOS the window keeps its real title bar the whole time. Taking it away
/// and putting it back while the app runs makes macOS build a new one, and that
/// has come back see-through or without its buttons working. So the title bar
/// is only made invisible: no title, no buttons, and the page drawn under it.
#[cfg(target_os = "macos")]
fn show_frame(window: &WebviewWindow, shown: bool) -> tauri::Result<()> {
    use objc2_app_kit::{NSWindow, NSWindowButton, NSWindowStyleMask, NSWindowTitleVisibility};

    let target = window.clone();
    let (done, finished) = std::sync::mpsc::channel();
    window.run_on_main_thread(move || {
        if let Ok(pointer) = target.ns_window() {
            // SAFETY: this is the window's own NSWindow, kept alive by `target`,
            // and it is only used here on the main thread.
            let ns: &NSWindow = unsafe { &*pointer.cast() };
            // Changing the style can move the keyboard focus off the page.
            let focused = ns.firstResponder();
            let mut mask = ns.styleMask()
                | NSWindowStyleMask::Titled
                | NSWindowStyleMask::Closable
                | NSWindowStyleMask::Miniaturizable;
            if shown {
                mask &= !NSWindowStyleMask::FullSizeContentView;
            } else {
                mask |= NSWindowStyleMask::FullSizeContentView;
            }
            if mask != ns.styleMask() {
                ns.setStyleMask(mask);
                ns.makeFirstResponder(focused.as_deref());
            }
            ns.setTitlebarAppearsTransparent(!shown);
            ns.setTitleVisibility(if shown {
                NSWindowTitleVisibility::Visible
            } else {
                NSWindowTitleVisibility::Hidden
            });
            for button in [
                NSWindowButton::CloseButton,
                NSWindowButton::MiniaturizeButton,
                NSWindowButton::ZoomButton,
            ] {
                if let Some(button) = ns.standardWindowButton(button) {
                    button.setHidden(!shown);
                }
            }
        }
        let _ = done.send(());
    })?;
    // Sizing the window comes next, so wait until the frame has changed. The
    // time limit is only for the case that this already is the main thread's
    // own queue, which then runs the change right after.
    let _ = finished.recv_timeout(Duration::from_millis(500));
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn show_frame(window: &WebviewWindow, shown: bool) -> tauri::Result<()> {
    window.set_decorations(shown)
}

/// Waits until macOS reports the title bar as part of the window again after
/// the compact timer, so the saved size is applied to the right frame.
fn wait_for_title_bar(window: &WebviewWindow) {
    if !cfg!(target_os = "macos") {
        return;
    }
    for _ in 0..25 {
        let titled = match (window.outer_size(), window.inner_size()) {
            (Ok(outer), Ok(inner)) => outer.height > inner.height,
            _ => true,
        };
        if titled && window.is_resizable().unwrap_or(true) {
            return;
        }
        std::thread::sleep(Duration::from_millis(20));
    }
}

/// A safety net when the main window is shown: in the normal layout it must
/// have its title bar and be resizable. If a layout change left it without
/// (see `leave`), put both back.
pub fn repair_normal(window: &WebviewWindow, state: &LayoutState) {
    let normal = state
        .0
        .lock()
        .map(|inner| inner.current == Layout::Normal)
        .unwrap_or(false);
    if !normal || window.is_fullscreen().unwrap_or(false) {
        return;
    }
    let titled = match (window.outer_size(), window.inner_size()) {
        (Ok(outer), Ok(inner)) => outer.height > inner.height,
        _ => true,
    };
    if cfg!(target_os = "macos") && (!titled || !window.is_resizable().unwrap_or(true)) {
        let _ = window.set_resizable(true);
        let _ = show_frame(window, true);
        let _ = window.set_always_on_top(false);
    }
}

/// Leaving full screen finishes asynchronously on some systems; resizing
/// before it is done gets ignored.
fn settle() {
    std::thread::sleep(Duration::from_millis(if cfg!(target_os = "macos") {
        60
    } else {
        250
    }));
}
