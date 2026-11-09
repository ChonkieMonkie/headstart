<!--
  Headstart, a study companion that helps you get started, stay focused and keep going.
  Copyright (C) 2026  ChonkieMonkie

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

<!-- Courses, their tasks and to-dos. Every task starts with a concrete first to-do, so starting never needs a decision. -->
<script lang="ts">
  import { tick } from "svelte";
  import {
    archiveCourse,
    codeInName,
    completeTask,
    daysUntil,
    formatMinutes,
    reopenTask,
    type Todo,
    updateCourse,
  } from "@headstart/core";
  import { courseColor } from "@headstart/ui";
  import CourseForm from "$lib/components/CourseForm.svelte";
  import CourseName from "$lib/components/CourseName.svelte";
  import PlanForm from "$lib/components/PlanForm.svelte";
  import TaskForm from "$lib/components/TaskForm.svelte";
  import TodoList from "$lib/components/TodoList.svelte";
  import { useApp } from "$lib/context.ts";
  import { examLabel, plural, shortDate } from "$lib/format.ts";

  const { study } = useApp();

  /** Which form is open: "course:new", "course:<id>", "task:new:<courseId>", "task:<id>", "plan:<taskId>", "plan-course:<courseId>", "archive:<id>". */
  let open = $state<string | null>(null);
  /** What the course plan form starts with. */
  let planFor = $state<{ taskId: string; todoIds: string[] }>({ taskId: "", todoIds: [] });

  function planCourse(courseId: string, todo?: Todo): void {
    planFor = { taskId: todo?.taskId ?? "", todoIds: todo ? [todo.id] : [] };
    open = `plan-course:${courseId}`;
    // The form opens under the course name; bring it into view.
    tick().then(() => document.getElementById(`plan-${courseId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }
  let showDone = $state<Record<string, boolean>>({});

  const focusByCourse = $derived(
    new Map((study.stats(1)?.byCourse ?? []).map((c) => [c.courseId, c])),
  );
  const close = () => (open = null);
</script>

<header class="top">
  <div>
    <h1>Courses</h1>
    <p class="lead">Add the courses you study, then tasks and to-dos. The top to-do of a task is always its next step.</p>
  </div>
  {#if open !== "course:new"}
    <button type="button" class="primary" onclick={() => (open = "course:new")}>Add course</button>
  {/if}
</header>

{#if open === "course:new"}
  <section class="card" aria-label="New course">
    <CourseForm {study} onDone={close} />
  </section>
{/if}

{#if study.courses.length === 0 && open !== "course:new"}
  <section class="card empty">
    <h2>No courses yet</h2>
    <p>Start with the course you have the most work in right now. You can add an exam date to see a countdown.</p>
  </section>
{/if}

{#each study.courses as course (course.id)}
  {@const tasks = study.tasksOf(course.id)}
  {@const openTasks = tasks.filter((t) => !t.done)}
  {@const doneTasks = tasks.filter((t) => t.done)}
  {@const focus = focusByCourse.get(course.id)}
  {@const recalls = study.recallsOf(course.id)}
  {@const foundCode = course.code ? null : codeInName(course.name)}
  <section class="card course" style:--course={courseColor(course.color)} aria-labelledby="course-{course.id}">
    {#if open === `course:${course.id}`}
      <CourseForm {study} {course} onDone={close} />
    {:else}
      <div class="course-head">
        <div>
          <h2 id="course-{course.id}">
            <CourseName {course} />
          </h2>
          <p class="meta">
            {#if course.examDate}{`${examLabel(daysUntil(course.examDate, study.now))} · `}{/if}{formatMinutes(
              focus?.minutes ?? 0,
            )} studied in {plural(focus?.sessions ?? 0, "session")}
          </p>
        </div>
        <div class="row-actions">
          <button type="button" class="small" onclick={() => planCourse(course.id)}>Plan</button>
          <button type="button" class="small" onclick={() => (open = `course:${course.id}`)}>Edit</button>
          <button type="button" class="small ghost" onclick={() => (open = `archive:${course.id}`)}>Archive</button>
        </div>
      </div>
      {#if foundCode}
        <p class="code-offer">
          <span><b>{foundCode.code}</b> looks like a course code.</span>
          <button
            type="button"
            class="small"
            onclick={() => study.run((s) => updateCourse(s, course.id, { name: foundCode.name, code: foundCode.code }))}
          >
            Move it to the code field
          </button>
        </p>
      {/if}
      {#if open === `archive:${course.id}`}
        <div class="confirm" role="group" aria-label="Archive {course.name}">
          <p>Archive {course.name}? Its tasks disappear from Today, but your study time and notes stay.</p>
          <button
            type="button"
            class="small danger"
            onclick={() => {
              study.run((s) => archiveCourse(s, course.id));
              close();
            }}>Archive</button
          >
          <button type="button" class="small" onclick={close}>Keep it</button>
        </div>
      {/if}
    {/if}

    {#if open === `plan-course:${course.id}`}
      <div id="plan-{course.id}">
        {#key planFor}
          <PlanForm {study} courseId={course.id} taskId={planFor.taskId} todoIds={planFor.todoIds} onDone={close} />
        {/key}
      </div>
    {/if}

    <ul class="tasks">
      {#each openTasks as task (task.id)}
        <li>
          {#if open === `task:${task.id}`}
            <TaskForm {study} courseId={course.id} {task} onDone={close} />
          {:else}
            <div class="task">
              <button
                type="button"
                class="tick"
                aria-label="Mark {task.title} as done"
                onclick={() => study.run((s) => completeTask(s, task.id))}
              ></button>
              <div class="task-text">
                <strong>{task.title}</strong>
              </div>
              <div class="row-actions">
                <button type="button" class="small primary" onclick={() => study.startTask(task.id)}>Start</button>
                <button type="button" class="small" onclick={() => (open = `plan:${task.id}`)}>Plan</button>
                <button type="button" class="small ghost" onclick={() => (open = `task:${task.id}`)}>Edit</button>
              </div>
            </div>
            <div class="task-todos">
              <TodoList {study} courseId={course.id} taskId={task.id} onPlan={(todo) => planCourse(course.id, todo)} />
            </div>
            {#if open === `plan:${task.id}`}
              <PlanForm {study} taskId={task.id} onDone={close} />
            {/if}
          {/if}
        </li>
      {/each}
    </ul>

    <div class="course-todos">
      <h3>Other to-dos</h3>
      <TodoList {study} courseId={course.id} onPlan={(todo) => planCourse(course.id, todo)} />
    </div>

    {#if open === `task:new:${course.id}`}
      <TaskForm {study} courseId={course.id} onDone={close} />
    {:else}
      <button type="button" class="add" onclick={() => (open = `task:new:${course.id}`)}>+ Add task</button>
    {/if}

    {#if doneTasks.length > 0}
      <button
        type="button"
        class="link"
        aria-expanded={showDone[course.id] ?? false}
        onclick={() => (showDone[course.id] = !showDone[course.id])}
      >
        {plural(doneTasks.length, "task")} done
      </button>
      {#if showDone[course.id]}
        <ul class="done">
          {#each doneTasks as task (task.id)}
            <li>
              <s>{task.title}</s>
              <button type="button" class="small ghost" onclick={() => study.run((s) => reopenTask(s, task.id))}>Reopen</button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}

    {#if recalls.length > 0}
      <details class="recalls">
        <summary>Latest recall notes</summary>
        {#each recalls as recall (recall.endedAt)}
          <blockquote>
            <p>{recall.text}</p>
            <footer>{shortDate(recall.endedAt)}</footer>
          </blockquote>
        {/each}
      </details>
    {/if}
  </section>
{/each}

{#if study.archivedCourses.length > 0}
  <p class="archived">Archived: {study.archivedCourses.map((c) => c.name).join(", ")}</p>
{/if}

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
  }

  h1 {
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 2.1rem;
  }

  .code-offer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: 0;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--hs-accent-soft);
    font-size: 14px;
  }

  .task-todos {
    padding: 2px 0 8px 44px;
  }

  .course-todos {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hs-ink-subtle);
  }

  .lead,
  .meta,
  .empty p {
    margin: 4px 0 0;
    line-height: 1.5;
    color: var(--hs-ink-muted);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
    padding: 22px;
    border: 1px solid var(--hs-line);
    border-radius: var(--hs-radius-lg);
    background: var(--hs-surface);
  }

  .course {
    border-top: 5px solid var(--course);
  }

  .course-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-family: var(--hs-font-display);
    font-weight: 600;
    font-size: 1.45rem;
  }


  .tasks,
  .done {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .task {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--hs-line);
    border-radius: 12px;
  }

  .tick {
    width: 26px;
    height: 26px;
    flex: none;
    padding: 0;
    border: 2px solid var(--course);
    border-radius: 999px;
    background: var(--hs-surface);
    cursor: pointer;
  }

  .tick:hover {
    background: var(--hs-ground);
  }

  .task-text {
    flex: 1 1 220px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.4;
  }


  .row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  button {
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .primary {
    min-height: 44px;
    padding: 0 18px;
    border: 0;
    border-radius: 12px;
    background: var(--hs-accent);
    color: var(--hs-on-accent);
  }

  .small {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--hs-line);
    border-radius: 10px;
    background: var(--hs-surface);
    color: var(--hs-ink);
    font-size: 14px;
  }

  .small.primary {
    border-color: var(--hs-accent);
    background: var(--hs-accent);
    color: var(--hs-on-accent);
  }

  .small.ghost {
    border-color: transparent;
    background: transparent;
    color: var(--hs-ink-subtle);
  }

  .small.danger {
    border-color: var(--hs-danger);
    background: var(--hs-danger);
    color: var(--hs-surface);
  }

  .add {
    align-self: flex-start;
    min-height: 40px;
    padding: 0 14px;
    border: 1px dashed var(--hs-field-line);
    border-radius: 10px;
    background: transparent;
    color: var(--hs-accent-strong);
  }

  .link {
    align-self: flex-start;
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hs-accent-strong);
    text-decoration: underline;
    font-weight: 700;
  }

  .done li {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--hs-ink-muted);
  }

  .confirm {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 12px;
    background: var(--hs-warning-soft);
  }

  .confirm p {
    flex: 1 1 260px;
    margin: 0;
    font-weight: 700;
  }

  .recalls summary {
    min-height: 32px;
    font-weight: 800;
    color: var(--hs-accent-strong);
    cursor: pointer;
  }

  blockquote {
    margin: 8px 0 0;
    padding: 10px 14px;
    border-left: 4px solid var(--course);
    border-radius: 0 10px 10px 0;
    background: var(--hs-ground);
  }

  blockquote p {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  blockquote footer {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--hs-ink-subtle);
  }

  .archived {
    color: var(--hs-ink-subtle);
    font-size: 14px;
  }

  button:focus-visible,
  summary:focus-visible {
    outline: 3px solid var(--hs-accent);
    outline-offset: 2px;
  }
</style>
