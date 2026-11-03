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

// The tray panel: a small borderless window that opens next to the tray icon
// on a left click and hides as soon as it loses focus. Linux trays report no
// clicks, so there the tray menu does the same job.

use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{
    AppHandle, LogicalSize, Manager, Monitor, PhysicalPosition, Rect, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

pub const LABEL: &str = "panel";
const SIZE: LogicalSize<f64> = LogicalSize::new(340.0, 460.0);
/// Gap between the tray icon and the panel, in logical pixels.
const GAP: f64 = 6.0;

/// When the panel last hid itself. A click on the tray icon first takes focus
/// away (hiding the panel); that same click must not open it again.
#[derive(Default)]
pub struct PanelState(Mutex<Option<Instant>>);

pub fn create(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("panel".into()))
        .title("Headstart")
        .inner_size(SIZE.width, SIZE.height)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible_on_all_workspaces(true)
        .visible(false)
        .build()
}

/// Opens the panel next to the tray icon, or closes it if it is open.
pub fn toggle(app: &AppHandle, icon: Rect) {
    let Some(panel) = app.get_webview_window(LABEL) else {
        return;
    };
    if panel.is_visible().unwrap_or(false) {
        let _ = panel.hide();
        return;
    }
    let just_hidden = app
        .state::<PanelState>()
        .0
        .lock()
        .ok()
        .and_then(|hidden| *hidden)
        .is_some_and(|at| at.elapsed() < Duration::from_millis(300));
    if just_hidden {
        return;
    }
    if let Some(position) = position_near(&panel, icon) {
        let _ = panel.set_position(position);
    }
    let _ = panel.show();
    let _ = panel.set_focus();
}

pub fn hide(app: &AppHandle) {
    if let Some(panel) = app.get_webview_window(LABEL) {
        let _ = panel.hide();
    }
}

/// Called when the panel loses focus.
pub fn blurred(app: &AppHandle) {
    if let Ok(mut hidden) = app.state::<PanelState>().0.lock() {
        *hidden = Some(Instant::now());
    }
    hide(app);
}

/// Centred under the icon when the tray is at the top of the screen (macOS,
/// some Linux desktops), above it when the tray is at the bottom (Windows),
/// and always kept inside the screen.
fn position_near(panel: &WebviewWindow, icon: Rect) -> Option<PhysicalPosition<i32>> {
    // Tray rects come in physical pixels; find the screen that holds the icon.
    let probe = icon.position.to_physical::<f64>(1.0);
    let contains = |m: &Monitor| {
        let (p, s) = (m.position(), m.size());
        probe.x >= p.x as f64
            && probe.x < (p.x + s.width as i32) as f64
            && probe.y >= p.y as f64
            && probe.y < (p.y + s.height as i32) as f64
    };
    let monitor = panel
        .available_monitors()
        .ok()
        .and_then(|monitors| monitors.into_iter().find(contains))
        .or_else(|| panel.primary_monitor().ok().flatten())?;
    let scale = monitor.scale_factor();
    let icon_pos = icon.position.to_physical::<f64>(scale);
    let icon_size = icon.size.to_physical::<f64>(scale);
    let (width, height) = (SIZE.width * scale, SIZE.height * scale);
    let gap = GAP * scale;
    let area = monitor.work_area();
    let (left, top) = (area.position.x as f64, area.position.y as f64);
    let (right, bottom) = (left + area.size.width as f64, top + area.size.height as f64);

    // max/min rather than clamp: clamp panics if the screen is narrower than the panel.
    let x = (icon_pos.x + icon_size.width / 2.0 - width / 2.0)
        .min(right - width - gap)
        .max(left + gap);
    let tray_at_top = icon_pos.y < top + (bottom - top) / 2.0;
    let y = if tray_at_top {
        (icon_pos.y + icon_size.height + gap).max(top + gap)
    } else {
        (icon_pos.y - height - gap).min(bottom - height - gap)
    };
    Some(PhysicalPosition::new(x.round() as i32, y.round() as i32))
}
