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

// Opens the study engine for the UI (SQLite in the desktop app, memory in a
// plain browser with `pnpm dev`) and runs the day: focus sessions, breaks,
// focus layouts, the "session complete" step, reminders, the tray and its
// panel, the mascot and its collection. Rules live in `@headstart/core`; this
// class only wires them up.

import { items as catalog, type Item, type MascotId, type Slot, sets } from "@headstart/content";
import {
  type ActiveSession,
  abandonSession,
  breakAfter,
  type CollectionCount,
  type CommandResult,
  type CoreContext,
  type Course,
  type CrateDrop,
  chooseMascot,
  collectionCount,
  completeSession,
  completeTask,
  computeStats,
  craftItem,
  crateOdds,
  createUlidFactory,
  defaultContext,
  type EarnedCrate,
  type EventStore,
  equipItem,
  extendSession,
  focusedMs,
  isTimeUp,
  type LevelInfo,
  levelInfo,
  localDayKey,
  MemoryEventStore,
  type OddsRow,
  openCrate,
  openTasks,
  owns,
  type PityState,
  type Plan,
  type PlanView,
  type ProgressState,
  pauseSession,
  plansOn,
  planToStartNow,
  rateSession,
  remainingMs,
  resumeSession,
  type SetProgress,
  StudyEngine,
  type StudyEvent,
  type StudyStats,
  setProgress,
  startSession,
  type Task,
  TIMER_PRESETS,
  type TimerPreset,
  unopenedCrates,
  upcomingPlan,
  upcomingReminders,
  updateTask,
  writeRecall,
} from "@headstart/core";
import { lookFor, MASCOT_NAMES, type MascotLook, type Mood } from "@headstart/ui";
import { clockTime } from "./format.ts";
import { mascotLine, mascotMood } from "./mascot.ts";
import {
  type FocusLayout,
  listenToShell,
  type PanelSnapshot,
  publishPanel,
  setFocusLayout,
  setReminders,
  setTimer,
  type TimerSnapshot,
  type TrayAction,
  takeLaunchStart,
} from "./shell.ts";
import { SqliteEventStore } from "./storage/sqlite.ts";
import { inTauri } from "./tauri.ts";

const MINUTE = 60_000;
/** In the app the shell announces the end of a timer (and notifies). The UI
 * only steps in itself if that announcement is this late. */
const SHELL_GRACE_MS = inTauri ? 3_000 : 0;
const REMINDER_REFRESH_MS = 10 * MINUTE;
const LAYOUT_KEY = "headstart.focusLayout";

export type PresetId = keyof typeof TIMER_PRESETS;

export interface ProgressSummary {
  level: LevelInfo;
  stardust: number;
  sessions: number;
  focusMinutes: number;
  crateProgress: number;
  crateEvery: number;
  cratesWaiting: number;
  itemsOwned: number;
  onTimeStreak: number;
  /** Study Crate odds, with Epic and Legendary pity counted from your history. */
  studyCrateOdds: OddsRow[];
}

export interface BreakTimer {
  endsAt: number;
  minutes: number;
  long: boolean;
}

/** What the session that just ended earned, for the "session complete" step. */
export interface Completion {
  sessionId: string;
  focusMinutes: number;
  baseXp: number;
  onTimeXp: number;
  distractionFreeXp: number;
  recallBonusXp: number;
  minRecallChars: number;
  onTimeStreak: number;
  onTime: boolean | null;
  crateEarned: boolean;
  course: Course | null;
  task: Task | null;
}

/** A crate that was just opened, for the reveal screen. */
export interface OpenedCrate {
  crateId: string;
  drops: (CrateDrop & { item: Item | null })[];
  stardust: number;
}

export interface StartOptions {
  /** Carry out this planned session. */
  planId?: string;
  taskId?: string;
  /** Length in minutes; defaults to the plan's length or 25. */
  minutes?: number;
  /** Without a plan or task: carry out the plan that is due now, if any. */
  auto?: boolean;
  /** Show the focus view. False when started from the tray. */
  show?: boolean;
}

export class Study {
  engine: StudyEngine | null = null;
  ready = $state(false);
  error = $state<string | null>(null);
  /** Bumped on every change to the log, so views that read the state update. */
  version = $state(0);
  summary = $state<ProgressSummary | null>(null);

  /** The running session, copied out of the engine so the UI reacts to it. */
  active = $state<ActiveSession | null>(null);
  breakTimer = $state<BreakTimer | null>(null);
  completion = $state<Completion | null>(null);
  /** A short message for the Today screen, such as a discarded session. */
  notice = $state<string | null>(null);
  distractions = $state(0);
  layout = $state<FocusLayout>("normal");
  /** Ticks every second while a timer runs and every 30 seconds otherwise. */
  now = $state(Date.now());

  #newId = createUlidFactory();
  #preset: TimerPreset = TIMER_PRESETS.classic;
  #finishing = false;
  #ticker: ReturnType<typeof setInterval> | null = null;
  #tickEvery = 0;
  #remindersAt = 0;
  #stopListening: () => void = () => {};
  onCheckUpdates: () => void = () => {};

  newId(): string {
    return this.#newId();
  }

  /** The engine state. Read `version` first in reactive code so it re-runs. */
  get state(): ProgressState | null {
    this.version;
    return this.engine?.state ?? null;
  }

  get context(): CoreContext {
    return this.engine?.context ?? defaultContext;
  }

  get remaining(): number {
    if (this.active) return remainingMs(this.active, this.now);
    if (this.breakTimer) return this.breakTimer.endsAt - this.now;
    return 0;
  }

  get paused(): boolean {
    return this.active?.pausedAt != null;
  }

  /** Share of the running timer that is done, 0 to 1. */
  get progress(): number {
    if (this.active) {
      const target = this.active.plannedMs + this.active.extendedMs;
      return Math.min(1, focusedMs(this.active, this.now) / target);
    }
    if (this.breakTimer) {
      return 1 - Math.max(0, this.remaining) / (this.breakTimer.minutes * MINUTE);
    }
    return 0;
  }

  /** The layout to use when a session starts, remembered between sessions. */
  get preferredLayout(): FocusLayout {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved === "full" || saved === "compact" || saved === "normal") return saved;
    } catch {
      // storage can be unavailable; fall back to the normal window
    }
    return "normal";
  }

  // Views over the state for the screens

  get courses(): Course[] {
    const state = this.state;
    if (!state) return [];
    return [...state.courses.values()]
      .filter((c) => !c.archived)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get archivedCourses(): Course[] {
    const state = this.state;
    if (!state) return [];
    return [...state.courses.values()].filter((c) => c.archived);
  }

  get openTasks(): Task[] {
    const state = this.state;
    return state ? openTasks(state) : [];
  }

  tasksOf(courseId: string): Task[] {
    const state = this.state;
    if (!state) return [];
    return [...state.tasks.values()]
      .filter((t) => t.courseId === courseId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  course(id: string | null): Course | null {
    return id ? (this.state?.courses.get(id) ?? null) : null;
  }

  task(id: string | null): Task | null {
    return id ? (this.state?.tasks.get(id) ?? null) : null;
  }

  plansOn(day: string): PlanView[] {
    const state = this.state;
    return state ? plansOn(state, day, this.now) : [];
  }

  get todayPlans(): PlanView[] {
    return this.plansOn(localDayKey(this.now));
  }

  /** The next plan that can still be started, today or later. */
  get upNext(): Plan | null {
    const state = this.state;
    return state ? upcomingPlan(state, this.now) : null;
  }

  stats(days = 7): StudyStats | null {
    const state = this.state;
    return state ? computeStats(state, { now: this.now, days }) : null;
  }

  /** Recall notes of a course, newest first. */
  recallsOf(courseId: string, limit = 3): { endedAt: number; text: string }[] {
    const state = this.state;
    if (!state) return [];
    return [...state.sessions.values()]
      .filter((r) => r.courseId === courseId && r.recallText)
      .sort((a, b) => b.endedAt - a.endedAt)
      .slice(0, limit)
      .map((r) => ({ endedAt: r.endedAt, text: r.recallText ?? "" }));
  }

  // The mascot and the collection

  get mascot(): MascotId | null {
    return this.state?.mascot ?? null;
  }

  /** What the chosen mascot looks like with what it has on. */
  get look(): MascotLook | null {
    const state = this.state;
    const mascot = state?.mascot;
    return state && mascot ? lookFor(mascot, state.equipped[mascot], catalog) : null;
  }

  equippedOf(mascot: MascotId): Partial<Record<Slot, string>> {
    return this.state?.equipped[mascot] ?? {};
  }

  get mood(): Mood {
    const state = this.state;
    const now = this.now;
    const today = localDayKey(now);
    return mascotMood({
      focusing: this.active !== null,
      paused: this.paused,
      onBreak: this.breakTimer !== null,
      justFinished: this.completion !== null,
      sessionDue:
        state !== null &&
        (planToStartNow(state, now, this.context.rewards) !== null ||
          this.plansOn(today).some(
            (p) => p.status === "missed" && now - p.plan.startAt < 60 * MINUTE,
          )),
      studiedToday: [...(state?.sessions.values() ?? [])].some(
        (r) => localDayKey(r.endedAt) === today,
      ),
      hour: new Date(now).getHours(),
    });
  }

  /** What the mascot says on the Today screen and in the tray panel. */
  get mascotLine(): string {
    const mood = this.mood;
    const name = this.mascot ? MASCOT_NAMES[this.mascot] : "Your study buddy";
    const plan = this.upNext;
    const task = plan ? this.task(plan.taskId) : null;
    const course = plan ? this.course(plan.courseId) : null;
    return mascotLine({
      mood,
      name,
      next: task?.title ?? course?.name ?? null,
      nextTime: plan ? clockTime(plan.startAt) : null,
    });
  }

  owned(itemId: string): number {
    return this.state?.inventory.get(itemId) ?? 0;
  }

  get catalog(): readonly Item[] {
    return catalog;
  }

  item(id: string | null): Item | null {
    return id ? (catalog.find((i) => i.id === id) ?? null) : null;
  }

  get collection(): CollectionCount {
    const state = this.state;
    return state ? collectionCount(state, catalog) : { owned: 0, total: catalog.length };
  }

  get sets(): SetProgress[] {
    const state = this.state;
    return state ? setProgress(state, catalog, sets) : [];
  }

  setOf(item: Item): SetProgress | null {
    return this.sets.find((p) => p.set.id === item.set) ?? null;
  }

  get waitingCrates(): EarnedCrate[] {
    const state = this.state;
    return state ? unopenedCrates(state) : [];
  }

  get pity(): PityState {
    return this.state?.pity ?? { sinceEpic: 0, sinceLegendary: 0 };
  }

  async chooseMascot(mascot: MascotId): Promise<void> {
    await this.run(() => chooseMascot(mascot));
  }

  async equip(mascot: MascotId, slot: Slot, itemId: string | null): Promise<string | null> {
    const result = await this.run((s, c) => equipItem(s, mascot, slot, itemId, c));
    return result.ok ? null : result.reason;
  }

  async craft(itemId: string): Promise<string | null> {
    const result = await this.run((s, c) => craftItem(s, itemId, c));
    return result.ok ? null : result.reason;
  }

  /** Opens the oldest waiting crate, or the given one. */
  async openCrate(crateId?: string): Promise<OpenedCrate | string> {
    const id = crateId ?? this.waitingCrates[0]?.id;
    if (!id) return "No crate is waiting";
    const result = await this.run((s, c) => openCrate(s, id, c));
    if (!result.ok) return result.reason;
    const drops = result.event.drops.map((drop) => ({ ...drop, item: this.item(drop.itemId) }));
    return { crateId: id, drops, stardust: drops.reduce((sum, d) => sum + d.stardust, 0) };
  }

  async open(): Promise<void> {
    try {
      let store: EventStore;
      let deviceId: string;
      if (inTauri) {
        const sqlite = await SqliteEventStore.open();
        deviceId = await sqlite.deviceId(() => this.#newId());
        store = sqlite;
      } else {
        store = new MemoryEventStore();
        deviceId = "browser-preview";
      }
      this.engine = await StudyEngine.open(store, { deviceId, newId: this.#newId }, defaultContext);
      this.engine.subscribe(() => this.#refresh());
      this.#stopListening = listenToShell({
        onTrayAction: (action) => this.#onTrayAction(action),
        onTimerDone: (kind) => (kind === "focus" ? this.#finish() : this.skipBreak()),
        onStartOrShow: () => {
          if (!this.active) this.start({ auto: true });
        },
        onCheckUpdates: () => this.onCheckUpdates(),
        onPanelReady: () => publishPanel(this.#panelSnapshot()),
      });
      // A session left running when the app quit carries on, or finishes now.
      const running = this.engine.state.active;
      if (running) this.#preset = presetFor(running.plannedMs / MINUTE);
      this.#refresh();
      this.ready = true;
      if (await takeLaunchStart()) await this.start({ auto: true });
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    }
  }

  close(): void {
    this.#stopListening();
    if (this.#ticker) clearInterval(this.#ticker);
  }

  /** Runs a command and returns its result, so forms can show why it failed. */
  async run<E extends StudyEvent>(
    command: (state: ProgressState, ctx: CoreContext) => CommandResult<E>,
  ): Promise<CommandResult<E>> {
    if (!this.engine) return { ok: false, reason: "Still loading" };
    return this.engine.run(command);
  }

  async start(options: StartOptions = {}): Promise<void> {
    const engine = this.engine;
    if (!engine || engine.state.active) return;
    let planId = options.planId;
    if (!planId && !options.taskId && options.auto) {
      planId = planToStartNow(engine.state, Date.now(), engine.context.rewards)?.id;
    }
    const plan = planId ? engine.state.plans.get(planId) : undefined;
    const minutes = options.minutes ?? plan?.minutes ?? TIMER_PRESETS.classic.focusMinutes;
    const result = await engine.run((s) =>
      startSession(s, {
        sessionId: this.#newId(),
        plannedMinutes: minutes,
        ...(planId ? { planId } : {}),
        ...(options.taskId ? { taskId: options.taskId } : {}),
      }),
    );
    if (!result.ok) {
      this.notice = result.reason;
      return;
    }
    this.#preset = presetFor(minutes);
    this.distractions = 0;
    this.completion = null;
    this.notice = null;
    this.breakTimer = null;
    this.#sync();
    if (options.show !== false) await this.setLayout(this.preferredLayout);
  }

  async pause(): Promise<void> {
    await this.engine?.run(pauseSession);
  }

  async resume(): Promise<void> {
    await this.engine?.run(resumeSession);
  }

  async togglePause(): Promise<void> {
    await (this.paused ? this.resume() : this.pause());
  }

  async extend(minutes = 5): Promise<void> {
    await this.engine?.run((s) => extendSession(s, minutes));
  }

  logDistraction(): void {
    if (this.active) this.distractions += 1;
  }

  /** Ends the session early. Time spent still counts; under a minute is discarded. */
  async end(): Promise<void> {
    if (!this.engine?.state.active) return;
    if (focusedMs(this.engine.state.active, Date.now()) < MINUTE) {
      await this.engine.run(abandonSession);
      this.notice = "Session ended. It was under a minute, so nothing was saved.";
      this.#sync();
      await this.setLayout("normal");
      return;
    }
    await this.#finish();
  }

  skipBreak(): void {
    if (!this.breakTimer) return;
    this.breakTimer = null;
    this.#sync();
  }

  /**
   * Saves the "session complete" step: the recall, the focus rating and the
   * next step for the task. Empty fields are simply skipped.
   */
  async saveCompletion(input: {
    recall: string;
    rating: number | null;
    nextStep: string;
    taskDone: boolean;
  }): Promise<string | null> {
    const completion = this.completion;
    if (!completion) return null;
    const { sessionId, task } = completion;
    if (input.recall.trim()) {
      const result = await this.run((s) => writeRecall(s, sessionId, input.recall.trim()));
      if (!result.ok) return result.reason;
    }
    if (input.rating !== null) await this.run((s) => rateSession(s, sessionId, input.rating ?? 0));
    if (task && input.nextStep.trim() && input.nextStep.trim() !== task.nextStep) {
      const result = await this.run((s) => updateTask(s, task.id, { nextStep: input.nextStep }));
      if (!result.ok) return result.reason;
    }
    if (task && input.taskDone) await this.run((s) => completeTask(s, task.id));
    this.completion = null;
    return null;
  }

  dismissCompletion(): void {
    this.completion = null;
  }

  /** Switches the window layout. During a session the choice is remembered. */
  async setLayout(layout: FocusLayout): Promise<void> {
    if (this.active) {
      try {
        localStorage.setItem(LAYOUT_KEY, layout);
      } catch {
        // not remembered, which is fine
      }
    }
    this.layout = layout;
    await setFocusLayout(layout);
  }

  async #finish(): Promise<void> {
    const engine = this.engine;
    const active = engine?.state.active;
    if (!engine || !active || this.#finishing) return;
    this.#finishing = true;
    try {
      const cratesBefore = engine.state.crates.length;
      const result = await engine.run((s) =>
        completeSession(s, { distractions: this.distractions }),
      );
      if (!result.ok) return;
      const record = engine.state.sessions.get(active.sessionId);
      const rules = engine.context.rewards;
      if (record) {
        this.completion = {
          sessionId: record.sessionId,
          focusMinutes: record.score.focusMinutes,
          baseXp: record.score.baseXp,
          onTimeXp: record.score.onTimeXp,
          distractionFreeXp: record.score.distractionFreeXp,
          recallBonusXp: rules.recallBonusXp,
          minRecallChars: rules.minRecallChars,
          onTimeStreak: engine.state.onTimeStreak,
          onTime: record.score.onTime,
          crateEarned: engine.state.crates.length > cratesBefore,
          course: this.course(record.courseId),
          task: this.task(record.taskId),
        };
      }
      const rest = breakAfter(this.#sessionsToday(), this.#preset);
      this.breakTimer = { endsAt: Date.now() + rest.ms, minutes: rest.minutes, long: rest.long };
      this.#sync();
      if (this.layout !== "normal") await this.setLayout("normal");
    } finally {
      this.#finishing = false;
    }
  }

  #onTrayAction(action: TrayAction): void {
    switch (action) {
      case "start":
        this.start({ auto: true, show: false });
        return;
      case "start-five":
        this.start({ auto: true, minutes: TIMER_PRESETS.justFive.focusMinutes, show: false });
        return;
      case "pause":
        this.pause();
        return;
      case "resume":
        this.resume();
        return;
      case "extend":
        this.extend();
        return;
      case "end":
        this.end();
        return;
      case "skip-break":
        this.skipBreak();
        return;
      case "full":
      case "compact":
        this.setLayout(action);
        return;
    }
  }

  #sessionsToday(): number {
    if (!this.engine) return 0;
    const today = localDayKey(Date.now());
    let count = 0;
    for (const record of this.engine.state.sessions.values()) {
      if (localDayKey(record.endedAt) === today) count += 1;
    }
    return count;
  }

  #refresh(): void {
    if (!this.engine) return;
    const { state, context } = this.engine;
    this.active = state.active ? { ...state.active } : null;
    this.summary = {
      level: levelInfo(state.xp, context.rewards),
      stardust: state.stardust,
      sessions: state.completedSessions,
      focusMinutes: state.focusMinutes,
      crateProgress: state.crateProgress,
      crateEvery: context.rewards.studyCrateEvery,
      cratesWaiting: unopenedCrates(state).length,
      itemsOwned: context.catalog.filter((item) => owns(state, item.id)).length,
      onTimeStreak: state.onTimeStreak,
      studyCrateOdds: crateOdds(context.crates.crates.study, context.crates, state.pity),
    };
    this.version += 1;
    this.#syncReminders();
    this.#sync();
  }

  /** Pushes the running timer to the tray and panel, and keeps the screen ticking. */
  #sync(): void {
    this.now = Date.now();
    const every = this.active !== null || this.breakTimer !== null ? 1000 : 30_000;
    if (every !== this.#tickEvery) {
      if (this.#ticker) clearInterval(this.#ticker);
      this.#ticker = setInterval(() => this.#tick(), every);
      this.#tickEvery = every;
    }
    setTimer(this.#timerSnapshot());
    publishPanel(this.#panelSnapshot());
  }

  #tick(): void {
    this.now = Date.now();
    // Normally the shell's `timer://done` ends the timer; this is the backup.
    if (this.active && isTimeUp(this.active, this.now - SHELL_GRACE_MS)) this.#finish();
    else if (this.breakTimer && this.now - SHELL_GRACE_MS >= this.breakTimer.endsAt) {
      this.skipBreak();
    }
    if (this.now - this.#remindersAt > REMINDER_REFRESH_MS) this.#syncReminders();
  }

  /** Hands the next day of reminders to the shell, which shows them on time. */
  #syncReminders(): void {
    const state = this.engine?.state;
    if (!state) return;
    this.#remindersAt = Date.now();
    const reminders = upcomingReminders(state, Date.now()).map((reminder) => {
      const course = this.course(reminder.plan.courseId);
      const task = this.task(reminder.plan.taskId);
      const what = task?.title ?? course?.name ?? "your session";
      if (reminder.kind === "soon") {
        return {
          id: reminder.id,
          at: reminder.at,
          title: `Starting at ${clockTime(reminder.plan.startAt)}`,
          body: task ? `${course?.name ?? task.title}: ${task.nextStep}` : `Time for ${what}.`,
        };
      }
      return {
        id: reminder.id,
        at: reminder.at,
        title: `Still up for ${what}?`,
        body: "How about just 5 minutes? You can stop after that.",
      };
    });
    setReminders(reminders);
  }

  #timerSnapshot(): TimerSnapshot | null {
    const now = Date.now();
    if (this.active) {
      const left = remainingMs(this.active, now);
      const minutes = Math.round((this.active.plannedMs + this.active.extendedMs) / MINUTE);
      return {
        kind: "focus",
        endsAt: this.active.pausedAt === null ? now + left : null,
        remainingMs: left,
        doneTitle: `${minutes} minutes done!`,
        doneBody: "Write down what you remember while it is fresh.",
      };
    }
    if (this.breakTimer) {
      return {
        kind: "break",
        endsAt: this.breakTimer.endsAt,
        remainingMs: this.breakTimer.endsAt - now,
        doneTitle: "Break is over",
        doneBody: `Session ${this.#sessionsToday() + 1} is ready when you are.`,
      };
    }
    return null;
  }

  #panelSnapshot(): PanelSnapshot {
    const state = this.engine?.state;
    const now = Date.now();
    const stats = state ? computeStats(state, { now, days: 1 }) : null;
    const running = this.active;
    const runningTask = running ? this.task(running.taskId) : null;
    const runningCourse = running ? this.course(running.courseId) : null;
    const next = state && !running ? upcomingPlan(state, now) : null;
    const nextTask = next ? this.task(next.taskId) : null;
    const nextCourse = next ? this.course(next.courseId) : null;
    const startsNow =
      state && next ? planToStartNow(state, now, this.context.rewards)?.id === next.id : false;
    return {
      timer: this.#timerSnapshot(),
      heading: running ? (runningTask?.title ?? runningCourse?.name ?? "Focus session") : null,
      nextStep: (running ? runningTask : nextTask)?.nextStep ?? null,
      upNext: next
        ? {
            time: clockTime(next.startAt),
            course: nextCourse?.name ?? "Study session",
            task: nextTask?.title ?? null,
            startsNow,
          }
        : null,
      focusTodayMinutes: stats?.todayMinutes ?? 0,
      sessionsToday: stats?.todaySessions ?? 0,
      crateProgress: state?.crateProgress ?? 0,
      crateEvery: this.context.rewards.studyCrateEvery,
      cratesWaiting: state ? unopenedCrates(state).length : 0,
      mascot:
        state?.mascot != null
          ? {
              species: state.mascot,
              equipped: { ...state.equipped[state.mascot] },
              mood: this.mood,
              line: this.mascotLine,
            }
          : null,
    };
  }
}

/** The break rhythm that fits a session length. */
function presetFor(minutes: number): TimerPreset {
  if (minutes <= TIMER_PRESETS.justFive.focusMinutes) return TIMER_PRESETS.justFive;
  return minutes >= TIMER_PRESETS.deep.focusMinutes ? TIMER_PRESETS.deep : TIMER_PRESETS.classic;
}
