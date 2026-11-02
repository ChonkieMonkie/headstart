// SPDX-License-Identifier: GPL-3.0-or-later
//
// Menu bar (macOS) / system tray (Windows, Linux) icon and menu.

use tauri::{
    AppHandle, Emitter,
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

/// Events the tray sends to the UI.
pub const EVENT_START_SESSION: &str = "tray://start-session";
pub const EVENT_CHECK_UPDATES: &str = "tray://check-updates";

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Headstart", true, None::<&str>)?;
    let start = MenuItem::with_id(app, "start", "Start session", true, None::<&str>)?;
    let updates = MenuItem::with_id(app, "updates", "Check for updates", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Headstart", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&open, &start, &separator, &updates, &quit])?;

    let builder = TrayIconBuilder::with_id("main")
        .tooltip("Headstart")
        .menu(&menu)
        // macOS convention: clicking the menu bar icon opens its menu.
        // Windows and Linux: left click opens the app, right click the menu.
        .show_menu_on_left_click(cfg!(target_os = "macos"))
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => crate::show_main_window(app),
            "start" => {
                crate::show_main_window(app);
                let _ = app.emit(EVENT_START_SESSION, ());
            }
            "updates" => {
                crate::show_main_window(app);
                let _ = app.emit(EVENT_CHECK_UPDATES, ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if cfg!(target_os = "macos") {
                return;
            }
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                crate::show_main_window(tray.app_handle());
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

    builder.build(app)?;
    Ok(())
}
