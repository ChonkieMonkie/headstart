// SPDX-License-Identifier: GPL-3.0-or-later

// Prevents an extra console window on Windows in release builds. Do not remove.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    headstart_lib::run()
}
