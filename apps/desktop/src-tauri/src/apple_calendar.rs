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

//! Apple Calendar through EventKit, for two-way sync of planned sessions.
//! Nothing here runs until the user turns sync on in Settings; macOS asks for
//! calendar access the first time. The UI decides what to sync; this module
//! only lists calendars and reads, writes and removes events.

use serde::{Deserialize, Serialize};

// Only used by the macOS code; elsewhere the stubs never build or read them.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarInfo {
    id: String,
    title: String,
    source: String,
    /// iCloud calendars also show on the user's phone.
    icloud: bool,
    writable: bool,
}

// Only used by the macOS code; elsewhere the stubs never build or read them.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    id: String,
    calendar_id: String,
    title: String,
    location: String,
    /// Epoch milliseconds.
    start: f64,
    end: f64,
    all_day: bool,
}

// Only used by the macOS code; elsewhere the stubs never build or read them.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventInput {
    /// The event to change, or None for a new one.
    id: Option<String>,
    calendar_id: String,
    title: String,
    notes: String,
    start: f64,
    end: f64,
}

#[cfg(target_os = "macos")]
mod mac {
    //! All EventKit work runs on one thread with one long-lived event store.
    //! A fresh store per call is slow to load and can briefly answer with no
    //! events, which made busy time flicker.

    use super::{CalendarEvent, CalendarInfo, EventInput};
    use block2::RcBlock;
    use objc2::rc::Retained;
    use objc2::runtime::{Bool, NSObjectProtocol};
    use objc2::sel;
    use objc2_event_kit::{
        EKAuthorizationStatus, EKCalendar, EKEntityType, EKEvent, EKEventStore,
        EKEventStoreChangedNotification, EKSourceType, EKSpan,
    };
    use objc2_foundation::{NSArray, NSDate, NSError, NSNotificationCenter, NSString};
    use std::sync::mpsc::{self, Sender};
    use std::sync::{Mutex, OnceLock};
    use std::time::Duration;
    use tauri::{AppHandle, Emitter};

    pub const EVENT_CHANGED: &str = "apple-calendar-changed";

    type Job = Box<dyn FnOnce(&EKEventStore) + Send>;

    /// The EventKit thread. Its store lives as long as the app.
    fn worker() -> &'static Mutex<Sender<Job>> {
        static WORKER: OnceLock<Mutex<Sender<Job>>> = OnceLock::new();
        WORKER.get_or_init(|| {
            let (tx, rx) = mpsc::channel::<Job>();
            std::thread::Builder::new()
                .name("eventkit".into())
                .spawn(move || {
                    let store = unsafe { EKEventStore::new() };
                    while let Ok(job) = rx.recv() {
                        job(&store);
                    }
                })
                .expect("could not start the EventKit thread");
            Mutex::new(tx)
        })
    }

    /// Runs `work` on the EventKit thread and waits for the answer.
    fn run<T: Send + 'static>(
        timeout: Duration,
        work: impl FnOnce(&EKEventStore) -> Result<T, String> + Send + 'static,
    ) -> Result<T, String> {
        let (tx, rx) = mpsc::channel();
        let job: Job = Box::new(move |store| {
            let _ = tx.send(work(store));
        });
        worker()
            .lock()
            .map_err(|_| "Apple Calendar is busy".to_string())?
            .send(job)
            .map_err(|_| "Apple Calendar stopped".to_string())?;
        rx.recv_timeout(timeout)
            .map_err(|_| "Apple Calendar did not answer in time".to_string())?
    }

    const QUICK: Duration = Duration::from_secs(30);

    fn date(ms: f64) -> Retained<NSDate> {
        NSDate::dateWithTimeIntervalSince1970(ms / 1000.0)
    }

    fn ms(date: &NSDate) -> f64 {
        date.timeIntervalSince1970() * 1000.0
    }

    fn reason(error: Retained<NSError>) -> String {
        format!("Apple Calendar said no: {}", error.localizedDescription())
    }

    pub fn status() -> String {
        let status = unsafe { EKEventStore::authorizationStatusForEntityType(EKEntityType::Event) };
        match status {
            EKAuthorizationStatus::NotDetermined => "notDetermined",
            EKAuthorizationStatus::Restricted => "restricted",
            EKAuthorizationStatus::Denied => "denied",
            EKAuthorizationStatus::FullAccess => "granted",
            EKAuthorizationStatus::WriteOnly => "writeOnly",
            _ => "unknown",
        }
        .to_string()
    }

    /// Asks macOS for full access to events. Waits until the user answers.
    pub fn request() -> Result<bool, String> {
        run(Duration::from_secs(600), |store| {
            let (tx, rx) = mpsc::channel::<bool>();
            let block = RcBlock::new(move |granted: Bool, _error: *mut NSError| {
                let _ = tx.send(granted.as_bool());
            });
            unsafe {
                // macOS 14 and later ask for full access; older versions use the old call.
                if store.respondsToSelector(sel!(requestFullAccessToEventsWithCompletion:)) {
                    store.requestFullAccessToEventsWithCompletion(RcBlock::as_ptr(&block));
                } else {
                    #[allow(deprecated)]
                    store.requestAccessToEntityType_completion(
                        EKEntityType::Event,
                        RcBlock::as_ptr(&block),
                    );
                }
            }
            let granted = rx
                .recv_timeout(Duration::from_secs(590))
                .map_err(|_| "No answer from macOS about calendar access".to_string())?;
            // The store was made before access was given: load it again.
            unsafe { store.reset() };
            Ok(granted)
        })
    }

    fn is_icloud(calendar: &EKCalendar) -> bool {
        unsafe {
            calendar.source().is_some_and(|s| {
                s.sourceType() == EKSourceType::CalDAV
                    && s.title().to_string().to_lowercase().contains("icloud")
            })
        }
    }

    pub fn list() -> Result<Vec<CalendarInfo>, String> {
        run(QUICK, |store| unsafe {
            let calendars = store.calendarsForEntityType(EKEntityType::Event);
            Ok(calendars
                .iter()
                .map(|calendar| CalendarInfo {
                    id: calendar.calendarIdentifier().to_string(),
                    title: calendar.title().to_string(),
                    source: calendar
                        .source()
                        .map(|s| s.title().to_string())
                        .unwrap_or_default(),
                    icloud: is_icloud(&calendar),
                    writable: calendar.allowsContentModifications(),
                })
                .collect())
        })
    }

    /// A new calendar for events: in iCloud when there is an iCloud account,
    /// else where new events go by default, else on this Mac.
    pub fn create(title: String) -> Result<String, String> {
        run(QUICK, move |store| unsafe {
            let sources = store.sources();
            let icloud = sources.iter().find(|s| {
                s.sourceType() == EKSourceType::CalDAV
                    && s.title().to_string().to_lowercase().contains("icloud")
            });
            let fallback = store.defaultCalendarForNewEvents().and_then(|c| c.source());
            let local = sources
                .iter()
                .find(|s| s.sourceType() == EKSourceType::Local);
            let source = icloud
                .or(fallback)
                .or(local)
                .ok_or("No calendar account found")?;
            let calendar = EKCalendar::calendarForEntityType_eventStore(EKEntityType::Event, store);
            calendar.setTitle(&NSString::from_str(&title));
            calendar.setSource(Some(&source));
            store
                .saveCalendar_commit_error(&calendar, true)
                .map_err(reason)?;
            Ok(calendar.calendarIdentifier().to_string())
        })
    }

    fn to_event(e: &EKEvent) -> Option<CalendarEvent> {
        unsafe {
            Some(CalendarEvent {
                id: e.eventIdentifier()?.to_string(),
                calendar_id: e.calendar()?.calendarIdentifier().to_string(),
                title: e.title().to_string(),
                location: e.location().map(|l| l.to_string()).unwrap_or_default(),
                start: ms(&e.startDate()),
                end: ms(&e.endDate()),
                all_day: e.isAllDay(),
            })
        }
    }

    pub fn events(
        calendar_ids: Vec<String>,
        from: f64,
        to: f64,
    ) -> Result<Vec<CalendarEvent>, String> {
        run(QUICK, move |store| unsafe {
            let calendars: Vec<Retained<EKCalendar>> = calendar_ids
                .iter()
                .filter_map(|id| store.calendarWithIdentifier(&NSString::from_str(id)))
                .collect();
            if calendars.is_empty() {
                return Ok(Vec::new());
            }
            let array = NSArray::from_retained_slice(&calendars);
            let predicate = store.predicateForEventsWithStartDate_endDate_calendars(
                &date(from),
                &date(to),
                Some(&array),
            );
            Ok(store
                .eventsMatchingPredicate(&predicate)
                .iter()
                .filter_map(|e| to_event(&e))
                .collect())
        })
    }

    /// One event by id, or None when it no longer exists.
    pub fn get(id: String) -> Result<Option<CalendarEvent>, String> {
        run(QUICK, move |store| unsafe {
            Ok(store
                .eventWithIdentifier(&NSString::from_str(&id))
                .and_then(|e| to_event(&e)))
        })
    }

    pub fn save(input: EventInput) -> Result<String, String> {
        run(QUICK, move |store| unsafe {
            let calendar = store
                .calendarWithIdentifier(&NSString::from_str(&input.calendar_id))
                .ok_or("The calendar for sessions is gone. Pick one again in Settings.")?;
            let existing = input
                .id
                .as_ref()
                .and_then(|id| store.eventWithIdentifier(&NSString::from_str(id)));
            let event: Retained<EKEvent> =
                existing.unwrap_or_else(|| EKEvent::eventWithEventStore(store));
            event.setCalendar(Some(&calendar));
            event.setTitle(Some(&NSString::from_str(&input.title)));
            event.setNotes(Some(&NSString::from_str(&input.notes)));
            event.setStartDate(Some(&date(input.start)));
            event.setEndDate(Some(&date(input.end)));
            store
                .saveEvent_span_commit_error(&event, EKSpan::ThisEvent, true)
                .map_err(reason)?;
            event
                .eventIdentifier()
                .map(|id| id.to_string())
                .ok_or("The event was not saved".to_string())
        })
    }

    pub fn delete(id: String) -> Result<(), String> {
        run(QUICK, move |store| unsafe {
            if let Some(event) = store.eventWithIdentifier(&NSString::from_str(&id)) {
                store
                    .removeEvent_span_commit_error(&event, EKSpan::ThisEvent, true)
                    .map_err(reason)?;
            }
            Ok(())
        })
    }

    /// Starts the EventKit thread and tells the UI whenever the calendar
    /// database changes, from any app. The observer lives for the whole run.
    pub fn watch(app: AppHandle) {
        // Start the thread (and its store) without waiting for it.
        let _ = worker();
        let block = RcBlock::new(move |_note| {
            let _ = app.emit(EVENT_CHANGED, ());
        });
        unsafe {
            let observer = NSNotificationCenter::defaultCenter()
                .addObserverForName_object_queue_usingBlock(
                    Some(EKEventStoreChangedNotification),
                    None,
                    None,
                    &block,
                );
            std::mem::forget(observer);
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod mac {
    use super::{CalendarEvent, CalendarInfo, EventInput};
    const ONLY_MAC: &str = "Apple Calendar sync is only on macOS";
    pub fn status() -> String {
        "unavailable".into()
    }
    pub fn request() -> Result<bool, String> {
        Err(ONLY_MAC.into())
    }
    pub fn list() -> Result<Vec<CalendarInfo>, String> {
        Err(ONLY_MAC.into())
    }
    pub fn create(_title: String) -> Result<String, String> {
        Err(ONLY_MAC.into())
    }
    pub fn events(_ids: Vec<String>, _from: f64, _to: f64) -> Result<Vec<CalendarEvent>, String> {
        Err(ONLY_MAC.into())
    }
    pub fn get(_id: String) -> Result<Option<CalendarEvent>, String> {
        Err(ONLY_MAC.into())
    }
    pub fn save(_input: EventInput) -> Result<String, String> {
        Err(ONLY_MAC.into())
    }
    pub fn delete(_id: String) -> Result<(), String> {
        Err(ONLY_MAC.into())
    }
    pub fn watch(_app: tauri::AppHandle) {}
}

pub use mac::watch;

async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|_| "Apple Calendar did not answer".to_string())?
}

#[tauri::command]
pub fn apple_calendar_status() -> String {
    mac::status()
}

#[tauri::command]
pub async fn apple_calendar_request() -> Result<bool, String> {
    blocking(mac::request).await
}

#[tauri::command]
pub async fn apple_calendar_list() -> Result<Vec<CalendarInfo>, String> {
    blocking(mac::list).await
}

#[tauri::command]
pub async fn apple_calendar_create(title: String) -> Result<String, String> {
    blocking(move || mac::create(title)).await
}

#[tauri::command]
pub async fn apple_calendar_events(
    calendar_ids: Vec<String>,
    from: f64,
    to: f64,
) -> Result<Vec<CalendarEvent>, String> {
    blocking(move || mac::events(calendar_ids, from, to)).await
}

#[tauri::command]
pub async fn apple_calendar_get(id: String) -> Result<Option<CalendarEvent>, String> {
    blocking(move || mac::get(id)).await
}

#[tauri::command]
pub async fn apple_calendar_save(event: EventInput) -> Result<String, String> {
    blocking(move || mac::save(event)).await
}

#[tauri::command]
pub async fn apple_calendar_delete(id: String) -> Result<(), String> {
    blocking(move || mac::delete(id)).await
}
