import type { ITask } from "../types";

export interface TaskFilters {
  searchQuery: string;
  priorityFilter: string;
  assigneeFilter: string;
  deadlineFilter: "all" | "today" | "overdue";
}

export const isFilteringActive = (filters: TaskFilters): boolean =>
  filters.searchQuery.trim().length > 0 ||
  filters.priorityFilter !== "all" ||
  filters.assigneeFilter !== "all" ||
  filters.deadlineFilter !== "all";

export const taskMatchesFilters = (
  task: ITask,
  filters: TaskFilters,
  today: Date = new Date(),
): boolean => {
  const query = filters.searchQuery.toLowerCase().trim();

  if (
    query &&
    !task.title?.toLowerCase().includes(query) &&
    !task.description?.toLowerCase().includes(query)
  ) {
    return false;
  }

  if (
    filters.priorityFilter !== "all" &&
    task.priority !== filters.priorityFilter
  ) {
    return false;
  }

  if (
    filters.assigneeFilter !== "all" &&
    task.assignee_id !== filters.assigneeFilter
  ) {
    return false;
  }

  if (filters.deadlineFilter !== "all") {
    if (!task.due_date) return false;

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const taskDate = new Date(task.due_date);
    taskDate.setHours(0, 0, 0, 0);

    if (filters.deadlineFilter === "overdue" && taskDate >= startOfToday) {
      return false;
    }
    if (
      filters.deadlineFilter === "today" &&
      taskDate.getTime() !== startOfToday.getTime()
    ) {
      return false;
    }
  }

  return true;
};
