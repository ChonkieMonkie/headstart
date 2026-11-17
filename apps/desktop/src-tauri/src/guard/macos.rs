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

// macOS: the app in front and the apps to pick from, through NSWorkspace.
// No permission is needed for any of it.

use std::path::{Path, PathBuf};

use objc2::rc::autoreleasepool;
use objc2_app_kit::{NSApplicationActivationPolicy, NSRunningApplication, NSWorkspace};
use objc2_foundation::{NSBundle, NSFileManager, NSString};

use super::{AppInfo, Front};

pub fn supported() -> Result<(), &'static str> {
    Ok(())
}

fn own(app: &NSRunningApplication) -> bool {
    u32::try_from(app.processIdentifier()).is_ok_and(|pid| pid == std::process::id())
}

fn info(app: &NSRunningApplication) -> AppInfo {
    let name = app
        .localizedName()
        .map(|s| s.to_string())
        .unwrap_or_default();
    AppInfo {
        // An app without a bundle (rare) is known by its name.
        id: app
            .bundleIdentifier()
            .map(|s| s.to_string())
            .unwrap_or_else(|| name.clone()),
        name,
    }
}

pub fn frontmost() -> Option<Front> {
    autoreleasepool(|_| {
        let app = NSWorkspace::sharedWorkspace().frontmostApplication()?;
        let AppInfo { id, name } = info(&app);
        Some(Front {
            id,
            name,
            own: own(&app),
        })
    })
}

/// Apps with a Dock icon that are open now, without Headstart itself.
pub fn running() -> Vec<AppInfo> {
    autoreleasepool(|_| {
        NSWorkspace::sharedWorkspace()
            .runningApplications()
            .iter()
            .filter(|app| {
                app.activationPolicy() == NSApplicationActivationPolicy::Regular && !own(app)
            })
            .map(|app| info(&app))
            .collect()
    })
}

/// The apps in the usual Applications folders.
pub fn installed() -> Vec<AppInfo> {
    let mut folders = vec![
        PathBuf::from("/Applications"),
        PathBuf::from("/Applications/Utilities"),
        PathBuf::from("/System/Applications"),
        PathBuf::from("/System/Applications/Utilities"),
    ];
    if let Some(home) = std::env::var_os("HOME") {
        folders.push(Path::new(&home).join("Applications"));
    }
    autoreleasepool(|_| {
        let files = NSFileManager::defaultManager();
        let mut apps = Vec::new();
        for folder in folders {
            let Ok(entries) = std::fs::read_dir(&folder) else {
                continue;
            };
            for path in entries.flatten().map(|entry| entry.path()) {
                if path.extension().is_none_or(|ext| ext != "app") {
                    continue;
                }
                let Some(text) = path.to_str() else {
                    continue;
                };
                let at = NSString::from_str(text);
                let Some(id) = NSBundle::bundleWithPath(&at).and_then(|b| b.bundleIdentifier())
                else {
                    continue;
                };
                // The name as Finder shows it, in the user's language.
                let shown = files.displayNameAtPath(&at).to_string();
                apps.push(AppInfo {
                    id: id.to_string(),
                    name: shown.strip_suffix(".app").unwrap_or(&shown).to_string(),
                });
            }
        }
        apps
    })
}
