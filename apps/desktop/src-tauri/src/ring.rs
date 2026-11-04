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

// The progress ring shown as the tray icon while a timer runs. It is drawn
// by hand into an RGBA buffer, so no image library is needed, and only
// redrawn when it moves a visible step.

use std::f64::consts::TAU;

use crate::timer::TimerKind;

/// Visible steps around the ring. The icon is redrawn at most this many times per timer.
pub const STEPS: u32 = 60;

/// Side of the drawn image in pixels: 18 pt at 2× on macOS, 32 px elsewhere.
pub const SIZE: u32 = if cfg!(target_os = "macos") { 36 } else { 32 };

/// What the ring shows. Two equal looks draw the same pixels.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RingLook {
    pub kind: TimerKind,
    pub paused: bool,
    /// Share of the ring that is filled, in steps from 0 to `STEPS`.
    pub step: u32,
}

impl RingLook {
    /// A focus ring fills as time is spent; a break ring empties as the break runs out.
    pub fn new(kind: TimerKind, paused: bool, done_share: f64) -> Self {
        let share = match kind {
            TimerKind::Focus => done_share,
            TimerKind::Break => 1.0 - done_share,
        };
        let step = (share.clamp(0.0, 1.0) * f64::from(STEPS)).round() as u32;
        Self { kind, paused, step }
    }
}

/// Straight (not premultiplied) RGBA pixels, `size` × `size`. A template
/// image (macOS) only uses alpha; the system colours it for the menu bar.
pub fn draw(look: RingLook, size: u32, template: bool) -> Vec<u8> {
    let share = f64::from(look.step) / f64::from(STEPS);
    let s = f64::from(size);
    let (center, radius, half_width) = (s / 2.0, s * 0.38, s * 0.085);
    // Colour of the filled part off macOS: purple for focus, green for a break.
    let fill = match look.kind {
        TimerKind::Focus => [0x5b, 0x4b, 0xd6],
        TimerKind::Break => [0x2f, 0x9e, 0x6e],
    };
    let track = [0x8a, 0x93, 0xa6];
    let fill_alpha = if look.paused { 0.5 } else { 1.0 };
    let track_alpha = if template { 0.3 } else { 0.45 };

    let mut pixels = vec![0u8; (size * size * 4) as usize];
    for y in 0..size {
        for x in 0..size {
            let dx = f64::from(x) + 0.5 - center;
            let dy = f64::from(y) + 0.5 - center;
            let distance = dx.hypot(dy);
            // Soft edges across the stroke, one pixel wide.
            let radial = (half_width + 0.5 - (distance - radius).abs()).clamp(0.0, 1.0);
            if radial == 0.0 {
                continue;
            }
            // Turn from 12 o'clock, clockwise, 0 to 1.
            let turn = dx.atan2(-dy).rem_euclid(TAU) / TAU;
            // How far inside the filled arc, in pixels along the circle. A break
            // ring is filled up to 12 o'clock from the other side, so it empties
            // in the opposite direction.
            let inside = match look.kind {
                TimerKind::Focus => share - turn,
                TimerKind::Break => turn - (1.0 - share),
            } * TAU
                * distance;
            let filled = if share <= 0.0 {
                0.0
            } else {
                (inside + 0.5).clamp(0.0, 1.0)
            };
            let alpha = radial * (filled * fill_alpha + (1.0 - filled) * track_alpha);
            let i = ((y * size + x) * 4) as usize;
            let color: [f64; 3] = if template {
                [0.0; 3]
            } else {
                std::array::from_fn(|c| {
                    let (f, t) = (f64::from(fill[c]), f64::from(track[c]));
                    let weight = filled * fill_alpha;
                    let total = weight + (1.0 - filled) * track_alpha;
                    if total == 0.0 {
                        t
                    } else {
                        (f * weight + t * (total - weight)) / total
                    }
                })
            };
            for c in 0..3 {
                pixels[i + c] = color[c].round() as u8;
            }
            pixels[i + 3] = (alpha * 255.0).round() as u8;
        }
    }
    pixels
}

#[cfg(test)]
mod tests {
    use super::*;

    fn alpha_at(pixels: &[u8], size: u32, x: u32, y: u32) -> u8 {
        pixels[((y * size + x) * 4 + 3) as usize]
    }

    #[test]
    fn rounds_to_visible_steps() {
        assert_eq!(RingLook::new(TimerKind::Focus, false, 0.0).step, 0);
        assert_eq!(RingLook::new(TimerKind::Focus, false, 0.5).step, 30);
        assert_eq!(RingLook::new(TimerKind::Focus, false, 1.4).step, STEPS);
        // A break that has just started shows a full ring.
        assert_eq!(RingLook::new(TimerKind::Break, false, 0.0).step, STEPS);
    }

    #[test]
    fn fills_clockwise_from_the_top() {
        let size = SIZE;
        let look = RingLook::new(TimerKind::Focus, false, 0.25);
        let pixels = draw(look, size, true);
        let mid = size / 2;
        let ring = (f64::from(size) * 0.12) as u32;
        // Right side (3 o'clock) is the end of the first quarter; just above it is filled.
        let right = alpha_at(&pixels, size, size - ring, mid - 3);
        // Left side (9 o'clock) is not filled yet: only the faint track.
        let left = alpha_at(&pixels, size, ring, mid);
        assert!(right > 200, "right {right}");
        assert!(left < 100 && left > 40, "left {left}");
        // The centre and the corners stay clear.
        assert_eq!(alpha_at(&pixels, size, mid, mid), 0);
        assert_eq!(alpha_at(&pixels, size, 0, 0), 0);
    }

    #[test]
    fn paused_is_dimmer() {
        let size = SIZE;
        let running = draw(RingLook::new(TimerKind::Focus, false, 1.0), size, true);
        let paused = draw(RingLook::new(TimerKind::Focus, true, 1.0), size, true);
        let top = (f64::from(size) * 0.12) as u32;
        assert!(alpha_at(&paused, size, size / 2, top) < alpha_at(&running, size, size / 2, top));
    }
}
