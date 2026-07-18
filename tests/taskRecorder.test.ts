import { describe, it, expect } from "vitest";
import {
  reorderTasks,
  moveTaskBetweenColumns,
} from "../src/utils/taskRecorder";
import type { ITask } from "../src/types";

const makeTask = (id: string, position: number): ITask => ({
  id,
  column_id: "col-1",
  title: `Task ${id}`,
  description: null,
  priority: "medium",
  due_date: null,
  assignee_id: null,
  position,
  created_by: "user-1",
  created_at: null,
});

describe("reorderTasks", () => {
  it("moves a task to a later position", () => {
    const tasks = [makeTask("a", 0), makeTask("b", 1), makeTask("c", 2)];
    const result = reorderTasks(tasks, "a", "c");
    expect(result.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("moves a task to an earlier position", () => {
    const tasks = [makeTask("a", 0), makeTask("b", 1), makeTask("c", 2)];
    const result = reorderTasks(tasks, "c", "a");
    expect(result.map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("returns the same reference when active and over are the same", () => {
    const tasks = [makeTask("a", 0), makeTask("b", 1)];
    const result = reorderTasks(tasks, "a", "a");
    expect(result).toBe(tasks);
  });

  it("returns the same reference when a task id is not found", () => {
    const tasks = [makeTask("a", 0), makeTask("b", 1)];
    const result = reorderTasks(tasks, "a", "missing");
    expect(result).toBe(tasks);
  });
});

describe("moveTaskBetweenColumns", () => {
  it("moves a task out of the source column and into the target column", () => {
    const source = [makeTask("a", 0), makeTask("b", 1)];
    const target = [makeTask("c", 0)];

    const result = moveTaskBetweenColumns(source, target, "a", "c", "col-2");

    expect(result.source.map((t) => t.id)).toEqual(["b"]);
    expect(result.target.map((t) => t.id)).toEqual(["a", "c"]);
    expect(result.target[0].column_id).toBe("col-2");
  });

  it("appends to the end when dropping into an empty column", () => {
    const source = [makeTask("a", 0)];
    const target: ITask[] = [];

    const result = moveTaskBetweenColumns(
      source,
      target,
      "a",
      "col-2",
      "col-2",
    );

    expect(result.source).toEqual([]);
    expect(result.target.map((t) => t.id)).toEqual(["a"]);
  });

  it("leaves both lists unchanged when the active task isn't found", () => {
    const source = [makeTask("a", 0)];
    const target = [makeTask("b", 0)];

    const result = moveTaskBetweenColumns(
      source,
      target,
      "missing",
      "b",
      "col-2",
    );

    expect(result.source).toBe(source);
    expect(result.target).toBe(target);
  });
});
