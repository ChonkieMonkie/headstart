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

//! Fetches calendar links (such as a TimeEdit schedule) for the planner. Only
//! https, with a size limit; the UI parses the .ics text and keeps it on this
//! device.

use std::time::Duration;

/// Larger than any real term schedule, small enough to never hurt.
const MAX_BYTES: usize = 8 * 1024 * 1024;

#[tauri::command]
pub async fn fetch_calendar(url: String) -> Result<String, String> {
    if !url.starts_with("https://") {
        return Err("The link must start with https://".into());
    }
    // The same TLS setup as the updater: rustls with ring.
    let _ = rustls::crypto::ring::default_provider().install_default();
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent("Headstart calendar")
        // Follow redirects, but never away from https.
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.url().scheme() == "https" && attempt.previous().len() < 5 {
                attempt.follow()
            } else {
                attempt.stop()
            }
        }))
        .build()
        .map_err(|_| "Could not fetch the calendar".to_string())?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|_| "Could not reach the calendar. Check the link and your connection.".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "The calendar answered with an error ({})",
            response.status().as_u16()
        ));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|_| "The calendar stopped halfway. Try again.".to_string())?;
    if bytes.len() > MAX_BYTES {
        return Err("That calendar is too large".into());
    }
    let text = String::from_utf8_lossy(&bytes).into_owned();
    if !text.contains("BEGIN:VCALENDAR") {
        return Err("That link is not a calendar (.ics)".into());
    }
    Ok(text)
}
