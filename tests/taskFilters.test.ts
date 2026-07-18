import { describe, it, expect } from "vitest";
import {
  taskMatchesFilters,
  isFilteringActive,
} from "../src/utils/taskFilters";
import type { ITask } from "../src/types";
import type { TaskFilters } from "../src/utils/taskFilters";

const baseFilters: TaskFilters = {
  searchQuery: "",
  priorityFilter: "all",
  assigneeFilter: "all",
  deadlineFilter: "all",
};

const makeTask = (overrides: Partial<ITask> = {}): ITask => ({
  id: "task-1",
  column_id: "col-1",
  title: "Write report",
  description: "Quarterly summary",
  priority: "medium",
  due_date: null,
  assignee_id: null,
  position: 0,
  created_by: "user-1",
  created_at: null,
  ...overrides,
});

describe("isFilteringActive", () => {
  it("is false when all filters are default", () => {
    expect(isFilteringActive(baseFilters)).toBe(false);
  });

  it("is true when search query is set", () => {
    expect(isFilteringActive({ ...baseFilters, searchQuery: "bug" })).toBe(
      true,
    );
  });

  it("is true when any non-search filter is not 'all'", () => {
    expect(isFilteringActive({ ...baseFilters, priorityFilter: "high" })).toBe(
      true,
    );
  });
});

describe("taskMatchesFilters — search", () => {
  it("matches by title", () => {
    const task = makeTask({ title: "Fix login bug" });
    expect(
      taskMatchesFilters(task, { ...baseFilters, searchQuery: "login" }),
    ).toBe(true);
  });

  it("matches by description", () => {
    const task = makeTask({ description: "Investigate memory leak" });
    expect(
      taskMatchesFilters(task, { ...baseFilters, searchQuery: "memory" }),
    ).toBe(true);
  });

  it("excludes tasks that match neither title nor description", () => {
    const task = makeTask({ title: "Write report", description: "Quarterly" });
    expect(
      taskMatchesFilters(task, { ...baseFilters, searchQuery: "invoice" }),
    ).toBe(false);
  });
});

describe("taskMatchesFilters — priority", () => {
  it("filters by exact priority", () => {
    const task = makeTask({ priority: "high" });
    expect(
      taskMatchesFilters(task, { ...baseFilters, priorityFilter: "high" }),
    ).toBe(true);
    expect(
      taskMatchesFilters(task, { ...baseFilters, priorityFilter: "low" }),
    ).toBe(false);
  });
});

describe("taskMatchesFilters — assignee", () => {
  it("filters by assignee id", () => {
    const task = makeTask({ assignee_id: "user-42" });
    expect(
      taskMatchesFilters(task, { ...baseFilters, assigneeFilter: "user-42" }),
    ).toBe(true);
    expect(
      taskMatchesFilters(task, { ...baseFilters, assigneeFilter: "user-99" }),
    ).toBe(false);
  });
});

describe("taskMatchesFilters — deadline", () => {
  const today = new Date("2026-06-15T12:00:00Z");

  it("excludes tasks without a due date when a deadline filter is active", () => {
    const task = makeTask({ due_date: null });
    expect(
      taskMatchesFilters(
        task,
        { ...baseFilters, deadlineFilter: "today" },
        today,
      ),
    ).toBe(false);
  });

  it("matches tasks due exactly today", () => {
    const task = makeTask({ due_date: "2026-06-15" });
    expect(
      taskMatchesFilters(
        task,
        { ...baseFilters, deadlineFilter: "today" },
        today,
      ),
    ).toBe(true);
  });

  it("matches overdue tasks", () => {
    const task = makeTask({ due_date: "2026-06-10" });
    expect(
      taskMatchesFilters(
        task,
        { ...baseFilters, deadlineFilter: "overdue" },
        today,
      ),
    ).toBe(true);
  });

  it("excludes future tasks from the overdue filter", () => {
    const task = makeTask({ due_date: "2026-06-20" });
    expect(
      taskMatchesFilters(
        task,
        { ...baseFilters, deadlineFilter: "overdue" },
        today,
      ),
    ).toBe(false);
  });
});
