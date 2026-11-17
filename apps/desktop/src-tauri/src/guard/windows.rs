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

// Windows: the program that owns the window in front. Programs are known by
// the name of their .exe file, without the ending ("Discord").

use std::path::Path;

use windows_sys::Win32::Foundation::{CloseHandle, HWND, LPARAM};
use windows_sys::Win32::System::Threading::{
    OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, QueryFullProcessImageNameW,
};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetForegroundWindow, GetWindowTextLengthW, GetWindowThreadProcessId,
    IsWindowVisible,
};

use super::{AppInfo, Front};

pub fn supported() -> Result<(), &'static str> {
    Ok(())
}

fn process_of(window: HWND) -> u32 {
    let mut pid = 0u32;
    // SAFETY: `pid` is a valid place to write to; a closed window gives 0.
    unsafe { GetWindowThreadProcessId(window, &mut pid) };
    pid
}

/// The program's file name without ".exe", or None when it cannot be read
/// (a program run as administrator, for example).
fn program_name(pid: u32) -> Option<String> {
    if pid == 0 {
        return None;
    }
    // SAFETY: plain calls with a buffer of the stated size; the handle is closed again.
    let path = unsafe {
        let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if process.is_null() {
            return None;
        }
        let mut buffer = [0u16; 1024];
        let mut length = buffer.len() as u32;
        let ok = QueryFullProcessImageNameW(process, 0, buffer.as_mut_ptr(), &mut length);
        CloseHandle(process);
        if ok == 0 {
            return None;
        }
        String::from_utf16_lossy(&buffer[..length as usize])
    };
    Path::new(&path)
        .file_stem()
        .map(|stem| stem.to_string_lossy().into_owned())
}

pub fn frontmost() -> Option<Front> {
    // SAFETY: no arguments; returns null when no window is in front.
    let window = unsafe { GetForegroundWindow() };
    if window.is_null() {
        return None;
    }
    let pid = process_of(window);
    let name = program_name(pid)?;
    Some(Front {
        id: name.to_lowercase(),
        name,
        own: pid == std::process::id(),
    })
}

unsafe extern "system" fn collect(window: HWND, list: LPARAM) -> i32 {
    // SAFETY: `list` is the Vec passed to EnumWindows below, alive for the whole call.
    let pids = unsafe { &mut *(list as *mut Vec<u32>) };
    // SAFETY: `window` comes from EnumWindows.
    let shown = unsafe { IsWindowVisible(window) != 0 && GetWindowTextLengthW(window) > 0 };
    if shown {
        pids.push(process_of(window));
    }
    1
}

/// Programs with a visible, titled window, without Headstart itself.
pub fn running() -> Vec<AppInfo> {
    let mut pids: Vec<u32> = Vec::new();
    // SAFETY: the callback only uses the Vec while EnumWindows runs.
    unsafe { EnumWindows(Some(collect), &mut pids as *mut Vec<u32> as LPARAM) };
    pids.sort_unstable();
    pids.dedup();
    pids.into_iter()
        .filter(|pid| *pid != std::process::id())
        .filter_map(program_name)
        .map(|name| AppInfo {
            id: name.to_lowercase(),
            name,
        })
        .collect()
}

/// Not listed on Windows: the settings screen offers typing a name instead.
pub fn installed() -> Vec<AppInfo> {
    Vec::new()
}
