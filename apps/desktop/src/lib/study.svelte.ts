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
  assignTodo,
  breakAfter,
  byOrder,
  type CollectionCount,
  type CommandResult,
  type CoreContext,
  type Course,
  type CrateDrop,
  changeSettings,
  chooseMascot,
  claimGrant,
  collectionCount,
  completeSession,
  completeTask,
  completeTodo,
  computeStats,
  craftItem,
  crateOdds,
  createTodo,
  createUlidFactory,
  DEFAULT_SETTINGS,
  type DeveloperToken,
  defaultContext,
  deleteTodo,
  type EarnedCrate,
  type EventStore,
  equipItem,
  extendSession,
  focusedMs,
  isOnTime,
  isTimeUp,
  type LevelInfo,
  levelInfo,
  localDayKey,
  MemoryEventStore,
  moveTodo,
  type OddsRow,
  openCrate,
  openTasks,
  openTodos,
  owns,
  type PityState,
  type Plan,
  type PlanView,
  type ProgressState,
  pauseSession,
  planForTask,
  plansOn,
  planToStartNow,
  presetFor,
  rateSession,
  readDeveloperToken,
  readGrant,
  remainingMs,
  reminderRules,
  reopenTodo,
  resumeSession,
  retargetSession,
  type SetProgress,
  type Settings,
  StudyEngine,
  type StudyEvent,
  type StudyStats,
  sessionInBlock,
  setProgress,
  simulateStudy,
  startSession,
  type Task,
  TIMER_PRESETS,
  type TimerPreset,
  type Todo,
  type TodoTarget,
  todosForPlan,
  todosForSession,
  unopenedCrates,
  upcomingPlan,
  upcomingReminders,
  updateTodo,
  writeRecall,
} from "@headstart/core";
import { lookFor, MASCOT_NAMES, type MascotLook, type Mood } from "@headstart/ui";
import {
  moveClock,
  type Profile,
  saveClockOffset,
  savedClockOffset,
  savedProfile,
  saveProfile,
} from "./debug-clock.ts";
import { clockTime } from "./format.ts";
import { nextLookahead } from "./lookahead.ts";
import { mascotLine, mascotMood } from "./mascot.ts";
import { courseLabel } from "./options.ts";
import {
  type FocusLayout,
  listenToShell,
  type PanelSnapshot,
  publishPanel,
  readDeveloperTokenFile,
  setFocusLayout,
  setReminders,
  setTimer,
  type TimerSnapshot,
  type TrayAction,
  takeLaunchStart,
} from "./shell.ts";
import { DEBUG_DATABASE_URL, SqliteEventStore } from "./storage/sqlite.ts";
import { inTauri } from "./tauri.ts";

const MINUTE = 60_000;
/** In the app the shell announces the end of a timer (and notifies). The UI
 * only steps in itself if that announcement is this late. */
const SHELL_GRACE_MS = inTauri ? 3_000 : 0;
/** The countdown before the next session starts by itself after a break. */
const AUTO_START_MS = 10_000;
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
  /** To-dos the session carried, or the task's first open one if it had none. */
  todos: Todo[];
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
  /**
   * To-dos of the task to bring along. Left out, a session for a task brings
   * the task's next step, unless a plan already brings to-dos.
   */
  todoIds?: string[];
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
  /**
   * The break that waits for the reflection: it starts when the "session
   * complete" notes are saved or skipped, so writing them does not eat it.
   */
  breakPending = $state<{ ms: number; minutes: number; long: boolean } | null>(null);
  /** The break is over (or skipped) and the next session waits to be started. */
  breakOver = $state(false);
  /** A start waiting for the user to pick which of the task's to-dos to bring. */
  choosing = $state<{ taskId: string; options: StartOptions } | null>(null);
  /** When the next session starts by itself, during the short countdown after a break. */
  startingAt = $state<number | null>(null);
  completion = $state<Completion | null>(null);
  /** The weekly look-ahead is open (from Today, the Plan page or its notification). */
  lookaheadOpen = $state(false);
  /** A short message for the Today screen, such as a discarded session. */
  notice = $state<string | null>(null);
  distractions = $state(0);
  layout = $state<FocusLayout>("normal");
  /** Ticks every second while a timer runs and every 30 seconds otherwise. */
  now = $state(Date.now());

  #newId = createUlidFactory();
  #statsCache = new Map<string, StudyStats>();
  #preset: TimerPreset = TIMER_PRESETS.classic;
  #finishing = false;
  #ticker: ReturnType<typeof setInterval> | null = null;
  #tickEvery = 0;
  /** The window cannot be seen, so the screen need not tick every second. */
  #hidden = false;
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
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(copy);
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
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(copy);
  }

  course(id: string | null): Course | null {
    const course = id ? this.state?.courses.get(id) : undefined;
    return course ? copy(course) : null;
  }

  task(id: string | null): Task | null {
    const task = id ? this.state?.tasks.get(id) : undefined;
    return task ? copy(task) : null;
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

  /**
   * Stats only change with the log or the day, so they are worked out once
   * per change instead of on every tick of the clock.
   */
  stats(days = 7): StudyStats | null {
    const state = this.state;
    if (!state) return null;
    const key = `${this.version}:${days}:${localDayKey(this.now)}`;
    const cached = this.#statsCache.get(key);
    if (cached) return cached;
    if (this.#statsCache.size > 8) this.#statsCache.clear();
    const stats = computeStats(state, { now: this.now, days });
    this.#statsCache.set(key, stats);
    return stats;
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

  // Settings

  get settings(): Settings {
    return this.state?.settings ?? DEFAULT_SETTINGS;
  }

  async saveSettings(changes: Partial<Settings>): Promise<string | null> {
    const result = await this.run((s) => changeSettings(s, changes));
    return result.ok || result.reason === "Nothing changed" ? null : result.reason;
  }

  // To-dos

  /** Open to-dos of a course, or of one task (null: those not under a task). */
  todosOf(courseId: string, taskId?: string | null): Todo[] {
    const state = this.state;
    return state ? openTodos(state, courseId, taskId).map(copy) : [];
  }

  /** Every to-do of a course, open and done, in list order. */
  allTodosOf(courseId: string): Todo[] {
    const state = this.state;
    return state
      ? [...state.todos.values()]
          .filter((t) => t.courseId === courseId)
          .sort(byOrder)
          .map(copy)
      : [];
  }

  /**
   * Moves a to-do between two neighbours of the list it is shown in, and
   * (with `taskId`) to another task of its course.
   */
  async moveTodo(
    todoId: string,
    place: { after: string | null; before: string | null; taskId?: string | null },
  ): Promise<string | null> {
    const result = await this.run((s) => moveTodo(s, todoId, place));
    return result.ok || result.reason === "Nothing changed" ? null : result.reason;
  }

  /** Planned sessions that have not started, soonest first. */
  get openPlans(): Plan[] {
    const state = this.state;
    if (!state) return [];
    return [...state.plans.values()]
      .filter(
        (p) => !p.cancelled && p.sessionId === null && p.startAt + p.minutes * MINUTE > this.now,
      )
      .sort((a, b) => a.startAt - b.startAt);
  }

  todosForPlan(planId: string): Todo[] {
    const state = this.state;
    return state ? todosForPlan(state, planId).map(copy) : [];
  }

  /** The running session's to-dos, done ones included. */
  get sessionTodos(): Todo[] {
    const state = this.state;
    const active = this.active;
    return state && active ? todosForSession(state, active.sessionId).map(copy) : [];
  }

  async addTodo(input: {
    courseId: string;
    taskId?: string | null;
    text: string;
    target?: TodoTarget;
  }): Promise<string | null> {
    const result = await this.run((s) =>
      createTodo(s, {
        todoId: this.#newId(),
        courseId: input.courseId,
        ...(input.taskId ? { taskId: input.taskId } : {}),
        text: input.text,
        target: input.target ?? null,
      }),
    );
    return result.ok ? null : result.reason;
  }

  async editTodo(todoId: string, text: string): Promise<string | null> {
    const result = await this.run((s) => updateTodo(s, todoId, text));
    return result.ok || result.reason === "Nothing changed" ? null : result.reason;
  }

  /** Ticks a to-do off or on. In a running session it counts for that session. */
  async toggleTodo(todo: Todo): Promise<void> {
    if (todo.done) await this.run((s) => reopenTodo(s, todo.id));
    else await this.run((s) => completeTodo(s, todo.id, this.active?.sessionId));
  }

  async removeTodo(todoId: string): Promise<void> {
    await this.run((s) => deleteTodo(s, todoId));
  }

  async assignTodo(todoId: string, target: TodoTarget): Promise<string | null> {
    const result = await this.run((s) => assignTodo(s, todoId, target));
    return result.ok ? null : result.reason;
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
    const equipped = this.state?.equipped[mascot];
    return equipped ? copy(equipped) : {};
  }

  /**
   * The mascot's mood. It is read every second during a session, but only
   * changes with the log, the timer state or the minute, so it is worked out
   * once per change.
   */
  get mood(): Mood {
    const state = this.state;
    const now = this.now;
    const key = `${this.version}:${this.active !== null}:${this.paused}:${this.breakTimer !== null}:${this.completion !== null}:${Math.floor(now / MINUTE)}`;
    if (this.#mood?.key === key) return this.#mood.mood;
    const mood = this.#workOutMood(state, now);
    this.#mood = { key, mood };
    return mood;
  }

  #mood: { key: string; mood: Mood } | null = null;

  #workOutMood(state: ProgressState | null, now: number): Mood {
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
      studiedToday: (this.stats(1)?.todaySessions ?? 0) > 0,
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

  /** Every item there is to find. Grant-only (Exotic) items only once you own them. */
  get catalog(): readonly Item[] {
    const state = this.state;
    return catalog.filter((i) => !i.grantOnly || (state !== null && owns(state, i.id)));
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
    const pity = this.state?.pity;
    return pity ? copy(pity) : { sinceEpic: 0, sinceLegendary: 0 };
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
        const real = await SqliteEventStore.open();
        this.#installId = await real.deviceId(() => this.#newId());
        // The developer menu needs a token signed for this installation.
        const token = await readDeveloperTokenFile();
        this.developer = token ? readDeveloperToken(token, this.#installId) : null;
        this.profile = this.developer ? savedProfile() : "real";
        if (this.profile === "debug") {
          const debug = await SqliteEventStore.open(DEBUG_DATABASE_URL);
          this.#debugStore = debug;
          store = debug;
          deviceId = await debug.deviceId(() => this.#newId());
        } else {
          store = real;
          deviceId = this.#installId;
        }
      } else {
        store = new MemoryEventStore();
        deviceId = "browser-preview";
        this.#installId = deviceId;
        // In the dev server only, ?developer opens a debug profile in memory to work on the menu.
        if (import.meta.env.DEV && new URLSearchParams(location.search).has("developer")) {
          this.developer = {
            v: 1,
            kind: "developer",
            installId: deviceId,
            issuedAt: "",
            grants: [],
          };
          this.profile = "debug";
        }
      }
      if (this.profile === "debug") {
        this.#clockOffset = savedClockOffset();
        moveClock(this.#clockOffset);
      }
      const ctx = this.profile === "debug" ? { ...defaultContext, debug: true } : defaultContext;
      this.engine = await StudyEngine.open(store, { deviceId, newId: this.#newId }, ctx);
      this.engine.subscribe(() => this.#refresh());
      this.#stopListening = listenToShell({
        onTrayAction: (action) => this.#onTrayAction(action),
        onTimerDone: (kind) => (kind === "focus" ? this.#finish() : this.#endBreak()),
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

  /**
   * The task's open to-dos that a new session could bring along: not in a
   * plan or a session yet. Empty when a plan for the task brings its own.
   */
  startChoices(taskId: string): Todo[] {
    const state = this.engine?.state;
    if (!state) return [];
    const plan = planForTask(state, taskId, Date.now(), this.engine?.context.dayKey);
    if (plan && todosForPlan(state, plan.id).length > 0) return [];
    const task = state.tasks.get(taskId);
    if (!task) return [];
    return openTodos(state, task.courseId, taskId)
      .filter((t) => t.planId === null && t.sessionId === null)
      .map(copy);
  }

  /**
   * Starting from a task's Start button: asks which to-dos to bring when
   * there is a choice (two or more), otherwise starts straight away.
   */
  async startTask(taskId: string, options: Omit<StartOptions, "taskId"> = {}): Promise<void> {
    if (this.startChoices(taskId).length >= 2) {
      this.choosing = { taskId, options: { ...options, taskId } };
      return;
    }
    await this.start({ ...options, taskId });
  }

  /** Finishes a start that was waiting for the to-do choice. */
  async startChosen(todoIds: string[]): Promise<void> {
    const choosing = this.choosing;
    this.choosing = null;
    if (choosing) await this.start({ ...choosing.options, todoIds });
  }

  async start(options: StartOptions = {}): Promise<void> {
    const engine = this.engine;
    if (!engine || engine.state.active) return;
    const now = Date.now();
    const rules = engine.context.rewards;
    let planId = options.planId;
    // Starting a task carries out today's plan for it (and brings its to-dos),
    // even at another time than planned. Only a start in the plan's own slot
    // counts for on time.
    let adoptPlan = false;
    if (!planId && options.taskId) {
      const plan = planForTask(engine.state, options.taskId, now, engine.context.dayKey);
      if (plan) {
        planId = plan.id;
        adoptPlan = !isOnTime(now, plan.startAt, rules);
      }
    }
    if (!planId && !options.taskId && options.auto) {
      planId = planToStartNow(engine.state, now, rules)?.id;
    }
    const plan = planId ? engine.state.plans.get(planId) : undefined;
    const minutes = options.minutes ?? plan?.minutes ?? engine.state.settings.focusMinutes;
    // Bring the chosen to-dos, or else the task's next step, unless the plan brings its own.
    const planBrings = planId ? todosForPlan(engine.state, planId).length > 0 : false;
    const bring =
      options.todoIds ??
      (options.taskId && !planBrings
        ? this.startChoices(options.taskId)
            .slice(0, 1)
            .map((t) => t.id)
        : []);
    const result = await engine.run((s) =>
      startSession(s, {
        sessionId: this.#newId(),
        plannedMinutes: minutes,
        ...(planId ? { planId } : {}),
        ...(adoptPlan ? { adoptPlan } : {}),
        ...(options.taskId ? { taskId: options.taskId } : {}),
      }),
    );
    if (!result.ok) {
      this.notice = result.reason;
      return;
    }
    const sessionId = result.event.sessionId;
    for (const todoId of bring) await engine.run((s) => assignTodo(s, todoId, { sessionId }));
    this.#preset = presetFor(minutes);
    this.distractions = 0;
    this.completion = null;
    this.notice = null;
    this.breakTimer = null;
    this.breakPending = null;
    this.breakOver = false;
    this.startingAt = null;
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

  /** Called when the window is hidden or shown again. */
  setHidden(hidden: boolean): void {
    if (this.#hidden === hidden) return;
    this.#hidden = hidden;
    this.#sync();
  }

  /** Moves the running session to another course or task. */
  async retarget(target: {
    courseId: string | null;
    taskId: string | null;
  }): Promise<string | null> {
    const result = await this.run((s) => retargetSession(s, target));
    if (result.ok) this.#sync();
    return result.ok ? null : result.reason;
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
    this.breakOver = true;
    this.#sync();
  }

  /** The break ran out: wait for the next session, or count down to it. */
  #endBreak(): void {
    if (!this.breakTimer) return;
    this.breakTimer = null;
    this.breakOver = true;
    if (this.engine?.state.settings.autoStartNext) this.startingAt = Date.now() + AUTO_START_MS;
    this.#sync();
  }

  /**
   * Starts the next session of a study block: the plan that is due, or else
   * another session for the task the last one was for.
   */
  async startNext(options: { show?: boolean } = {}): Promise<void> {
    const state = this.engine?.state;
    if (!state) return;
    const show = options.show === false ? { show: false } : {};
    if (planToStartNow(state, Date.now(), this.context.rewards)) {
      return this.start({ auto: true, ...show });
    }
    let last: { endedAt: number; taskId: string | null } | null = null;
    for (const record of state.sessions.values()) {
      if (!last || record.endedAt > last.endedAt) last = record;
    }
    const task = last?.taskId ? state.tasks.get(last.taskId) : undefined;
    return this.start(task && !task.done ? { taskId: task.id, ...show } : { auto: true, ...show });
  }

  /** Stops the countdown to the next session, but keeps the "start" offer. */
  cancelAutoStart(): void {
    this.startingAt = null;
    this.#sync();
  }

  /** Ends the study block: no break, no next session waiting. */
  doneForToday(): void {
    this.#blockEndedAt = Date.now();
    this.breakTimer = null;
    this.breakPending = null;
    this.breakOver = false;
    this.startingAt = null;
    this.notice = "Done for today. Nice work!";
    this.#sync();
  }

  // Developer tools. They need a developer token; see packages/core/src/developer.ts.

  /** The developer token for this installation, if there is a valid one. */
  developer = $state<DeveloperToken | null>(null);
  /** "debug" is a separate database the developer menu can change freely. */
  profile = $state<Profile>("real");
  #installId = "";
  #debugStore: SqliteEventStore | null = null;
  /** How far the debug profile's clock is ahead of the computer's. */
  #clockOffset = 0;

  /** The shell (tray timer, notifications) keeps the computer's own time. */
  #toShell(ms: number): number {
    return ms - this.#clockOffset;
  }

  get clockOffset(): number {
    return this.#clockOffset;
  }

  /** Why the profile or clock cannot change now, or null. */
  #devBusy(): string | null {
    return this.active || this.breakTimer || this.breakPending
      ? "Finish the session and break first"
      : null;
  }

  /** Opens the app again on the other profile. */
  switchProfile(profile: Profile): string | null {
    if (!this.developer) return "Needs a developer token";
    const busy = this.#devBusy();
    if (busy) return busy;
    saveProfile(profile);
    location.reload();
    return null;
  }

  /** Runs a developer command against the debug profile. */
  async dev<E extends StudyEvent>(
    command: (state: ProgressState, ctx: CoreContext) => CommandResult<E>,
  ): Promise<string | null> {
    if (this.profile !== "debug") return "Only in the debug profile";
    const result = await this.run(command);
    return result.ok ? null : result.reason;
  }

  /** Moves the debug profile's clock and opens the app again. */
  jumpClock(ms: number | null): string | null {
    if (this.profile !== "debug") return "Only in the debug profile";
    const busy = this.#devBusy();
    if (busy) return busy;
    saveClockOffset(ms === null ? 0 : this.#clockOffset + ms);
    location.reload();
    return null;
  }

  /** Adds a simulated week of studying, ending now, to the debug profile. */
  async simulateWeek(): Promise<string | null> {
    if (this.profile !== "debug" || !this.#debugStore)
      return "Only in the debug profile on the desktop";
    const busy = this.#devBusy();
    if (busy) return busy;
    const start = new Date(Date.now() - 7 * 24 * 60 * MINUTE);
    start.setHours(0, 0, 0, 0);
    await simulateStudy({
      ctx: defaultContext,
      seed: this.#newId(),
      weeks: 1,
      sessionsPerDay: [1, 4],
      start,
      store: this.#debugStore,
      deviceId: `simulation-${this.#newId()}`,
      openCrates: false,
    });
    location.reload();
    return null;
  }

  /** Empties the debug profile and resets its clock. The real profile is never touched. */
  async resetDebugProfile(): Promise<string | null> {
    if (this.profile !== "debug") return "Only in the debug profile";
    const busy = this.#devBusy();
    if (busy) return busy;
    await this.#debugStore?.clearDebugProfile();
    saveClockOffset(0);
    location.reload();
    return null;
  }

  /** The developer items in the token that this profile does not have yet. */
  get unclaimedGrants(): Item[] {
    const state = this.state;
    if (!state || !this.developer || this.profile !== "real") return [];
    return this.developer.grants
      .map((grant) => readGrant(grant))
      .filter(
        (grant) =>
          grant !== null && grant.installId === this.#installId && !owns(state, grant.itemId),
      )
      .map((grant) => catalog.find((i) => i.id === grant?.itemId))
      .filter((item): item is Item => item !== undefined);
  }

  /** Claims every grant in the token for the real profile. Returns the items received. */
  async claimDeveloperGrants(): Promise<{ items: Item[]; error: string | null }> {
    if (!this.developer || this.profile !== "real")
      return { items: [], error: "Only in the real profile" };
    const items: Item[] = [];
    for (const grant of this.developer.grants) {
      const result = await this.run((s, c) => claimGrant(s, grant, c, this.#installId));
      if (!result.ok) continue;
      const id = readGrant(grant)?.itemId;
      const item = catalog.find((i) => i.id === id);
      if (item) items.push(item);
    }
    return { items, error: items.length === 0 ? "Nothing new to claim" : null };
  }

  /** The number the next session gets today, counting from 1. */
  get nextSessionNumber(): number {
    this.version;
    return this.#sessionsToday() + 1;
  }

  /**
   * Saves the "session complete" step: the recall, the focus rating and the
   * next step for the task. Empty fields are simply skipped.
   */
  async saveCompletion(input: {
    recall: string;
    rating: number | null;
    /** To-dos ticked off on the "session complete" screen. */
    done: ReadonlySet<string>;
    /** A to-do to add for next time. */
    nextTodo: string;
    taskDone: boolean;
  }): Promise<string | null> {
    const completion = this.completion;
    if (!completion) return null;
    const { sessionId, task, course } = completion;
    if (input.recall.trim()) {
      const result = await this.run((s) => writeRecall(s, sessionId, input.recall.trim()));
      if (!result.ok) return result.reason;
    }
    if (input.rating !== null) await this.run((s) => rateSession(s, sessionId, input.rating ?? 0));
    for (const todo of completion.todos) {
      const current = this.state?.todos.get(todo.id);
      if (!current) continue;
      if (input.done.has(todo.id) && !current.done)
        await this.run((s) => completeTodo(s, todo.id, sessionId));
      if (!input.done.has(todo.id) && current.done && current.doneInSessionId === sessionId) {
        await this.run((s) => reopenTodo(s, todo.id));
      }
    }
    const courseId = course?.id ?? task?.courseId;
    if (input.nextTodo.trim() && courseId) {
      const reason = await this.addTodo({
        courseId,
        taskId: task?.id ?? null,
        text: input.nextTodo,
      });
      if (reason) return reason;
    }
    if (task && input.taskDone) await this.run((s) => completeTask(s, task.id));
    this.completion = null;
    this.#startPendingBreak();
    return null;
  }

  dismissCompletion(): void {
    this.completion = null;
    this.#startPendingBreak();
  }

  /** Starts the break that waited for the reflection, counting from now. */
  #startPendingBreak(): void {
    const rest = this.breakPending;
    if (!rest) return;
    this.breakPending = null;
    this.breakTimer = { endsAt: Date.now() + rest.ms, minutes: rest.minutes, long: rest.long };
    this.#sync();
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
          todos: this.#completionTodos(record.sessionId, record.taskId),
        };
      }
      const rest = breakAfter(this.#sessionInBlock(), this.#preset);
      this.breakTimer = null;
      this.breakPending = null;
      this.breakOver = !engine.state.settings.autoBreak;
      if (engine.state.settings.autoBreak) {
        this.breakPending = { ms: rest.ms, minutes: rest.minutes, long: rest.long };
        // Nothing to write about (no record): the break starts right away.
        if (!this.completion) this.#startPendingBreak();
      }
      this.#sync();
      if (this.layout !== "normal") await this.setLayout("normal");
    } finally {
      this.#finishing = false;
    }
  }

  /** The session's to-dos, or the task's first open to-do when it had none. */
  #completionTodos(sessionId: string, taskId: string | null): Todo[] {
    const state = this.engine?.state;
    if (!state) return [];
    const own = todosForSession(state, sessionId);
    if (own.length > 0 || !taskId) return own.map((t) => ({ ...t }));
    const task = state.tasks.get(taskId);
    const first = task ? openTodos(state, task.courseId, taskId)[0] : undefined;
    return first ? [{ ...first }] : [];
  }

  #onTrayAction(action: TrayAction): void {
    if (action.startsWith("toggle-todo:")) {
      const todo = this.engine?.state.todos.get(action.slice("toggle-todo:".length));
      if (todo) this.toggleTodo(todo);
      return;
    }
    switch (action) {
      case "start":
        this.startNext({ show: false });
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
      case "done-today":
        this.doneForToday();
        return;
      case "full":
      case "compact":
        this.setLayout(action);
        return;
    }
  }

  /** "Done for today" ends the study block, even if the next session is soon. */
  #blockEndedAt = Number.NEGATIVE_INFINITY;

  /** Which session of the current study block the last one is, for the length of the break. */
  #sessionInBlock(extra: { startedAt: number; endedAt: number }[] = []): number {
    const sessions = this.engine ? [...this.engine.state.sessions.values()] : [];
    return sessionInBlock([...sessions, ...extra], this.#preset, this.#blockEndedAt);
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
    // Every second while a countdown is on screen. Hidden, the shell ends the
    // timer and notifies, so a slow tick is only a backup; the countdown to
    // the next session still needs every second.
    const counting = this.active !== null || this.breakTimer !== null;
    const every =
      this.startingAt !== null || (counting && !this.#hidden) ? 1000 : counting ? 15_000 : 30_000;
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
      this.#endBreak();
    } else if (this.startingAt !== null && this.now >= this.startingAt) {
      this.startingAt = null;
      this.startNext();
    }
    if (this.now - this.#remindersAt > REMINDER_REFRESH_MS) this.#syncReminders();
  }

  /** Hands the next day of reminders to the shell, which shows them on time. */
  #syncReminders(): void {
    const state = this.engine?.state;
    if (!state) return;
    this.#remindersAt = Date.now();
    const reminders = upcomingReminders(state, Date.now(), reminderRules(state.settings)).map(
      (reminder) => {
        const course = this.course(reminder.plan.courseId);
        const task = this.task(reminder.plan.taskId);
        const what = task?.title ?? course?.name ?? "your session";
        if (reminder.kind === "soon") {
          return {
            id: reminder.id,
            at: this.#toShell(reminder.at),
            title: `Starting at ${clockTime(reminder.plan.startAt)}`,
            body: reminder.plan.ifThen
              ? reminder.plan.ifThen
              : task?.nextStep
                ? `${course ? courseLabel(course) : task.title}: ${task.nextStep}`
                : `Time for ${what}.`,
          };
        }
        return {
          id: reminder.id,
          at: this.#toShell(reminder.at),
          title: `Still up for ${what}?`,
          body: "How about just 5 minutes? You can stop after that.",
        };
      },
    );
    // The weekly look-ahead, when it is turned on and comes within a day.
    if (state.settings.weeklyLookahead) {
      const at = nextLookahead(state.settings, Date.now());
      if (at - Date.now() < 24 * 60 * MINUTE) {
        reminders.push({
          id: `lookahead:${at}`,
          at: this.#toShell(at),
          title: "Your week look-ahead is ready",
          body: "Two minutes: last week, what is coming up, and the next two days.",
        });
      }
    }
    setReminders(reminders);
  }

  #timerSnapshot(): TimerSnapshot | null {
    const now = Date.now();
    if (this.active) {
      const left = remainingMs(this.active, now);
      const minutes = Math.round((this.active.plannedMs + this.active.extendedMs) / MINUTE);
      return {
        kind: "focus",
        endsAt: this.active.pausedAt === null ? this.#toShell(now + left) : null,
        remainingMs: left,
        totalMs: this.active.plannedMs + this.active.extendedMs,
        ...this.#focusDoneText(minutes),
        chime: this.settings.chime,
      };
    }
    if (this.breakTimer) {
      return {
        kind: "break",
        endsAt: this.#toShell(this.breakTimer.endsAt),
        remainingMs: this.breakTimer.endsAt - now,
        totalMs: this.breakTimer.minutes * MINUTE,
        doneTitle: "Break is over",
        doneBody: this.settings.autoStartNext
          ? `Session ${this.#sessionsToday() + 1} starts in 10 seconds.`
          : `Session ${this.#sessionsToday() + 1} is ready when you are.`,
        chime: this.settings.chime,
      };
    }
    return null;
  }

  /** The notification when a session ends. The break starts once the notes are saved or skipped. */
  #focusDoneText(minutes: number): { doneTitle: string; doneBody: string } {
    if (!this.settings.autoBreak) {
      return {
        doneTitle: `${minutes} minutes done!`,
        doneBody: "Write down what you remember while it is fresh.",
      };
    }
    const active = this.active;
    const running = active ? [{ startedAt: active.startedAt, endedAt: Date.now() }] : [];
    const rest = breakAfter(this.#sessionInBlock(running), this.#preset);
    return {
      doneTitle: `${minutes} minutes done! ${rest.long ? "Long break" : "Break"}: ${rest.minutes} min`,
      doneBody: "Note what you remember. Your break starts when you are done.",
    };
  }

  #panelSnapshot(): PanelSnapshot {
    const state = this.engine?.state;
    const now = Date.now();
    const stats = this.stats(1);
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
      todos:
        state && running
          ? todosForSession(state, running.sessionId).map((t) => ({
              id: t.id,
              text: t.text,
              // The session's own task is the heading already.
              task:
                t.taskId && t.taskId !== running.taskId
                  ? (this.task(t.taskId)?.title ?? null)
                  : null,
              done: t.done,
            }))
          : [],
      upNext: next
        ? {
            time: clockTime(next.startAt),
            course: nextCourse ? courseLabel(nextCourse) : "Study session",
            task: nextTask?.title ?? null,
            startsNow,
          }
        : null,
      focusTodayMinutes: stats?.todayMinutes ?? 0,
      sessionsToday: stats?.todaySessions ?? 0,
      crateProgress: state?.crateProgress ?? 0,
      crateEvery: this.context.rewards.studyCrateEvery,
      cratesWaiting: state ? unopenedCrates(state).length : 0,
      focusMinutes: this.settings.focusMinutes,
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

/**
 * A shallow copy. The engine changes its state in place, so views get fresh
 * objects after each change and Svelte sees that something changed.
 */
function copy<T extends object>(value: T): T {
  return { ...value };
}
