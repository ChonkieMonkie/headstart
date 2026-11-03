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

// The Tauri shell. It stays thin: windows, tray and OS integrations live here,
// all study logic lives in the TypeScript `@headstart/core` package.

mod tray;

use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Must be registered first: a second launch focuses the running app instead.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DATABASE_URL, migrations())
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            tray::create(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the main window keeps Headstart running in the tray, so
            // reminders and the timer keep working. Quit lives in the tray menu.
            if let WindowEvent::CloseRequested { api, .. } = event
                && window.label() == "main"
            {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Headstart");
}

/// The local database. The frontend opens it with the same URL.
const DATABASE_URL: &str = "sqlite:headstart.db";

/// Schema changes, applied in order when the database opens. Never edit a
/// migration that has shipped: add a new one instead.
fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "event log",
        sql: "
            CREATE TABLE events (
                id          TEXT PRIMARY KEY,
                device_id   TEXT NOT NULL,
                seq         INTEGER NOT NULL,
                occurred_at TEXT NOT NULL,
                schema      INTEGER NOT NULL,
                type        TEXT NOT NULL,
                payload     TEXT NOT NULL
            );
            CREATE INDEX events_by_time ON events (occurred_at, id);
            CREATE UNIQUE INDEX events_by_device ON events (device_id, seq);
            CREATE TABLE meta (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        ",
        kind: MigrationKind::Up,
    }]
}

pub(crate) fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}
