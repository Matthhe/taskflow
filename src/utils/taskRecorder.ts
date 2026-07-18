import { arrayMove } from "@dnd-kit/sortable";
import type { ITask } from "../types";

export const reorderTasks = (
  tasks: ITask[],
  activeId: string,
  overId: string,
): ITask[] => {
  const activeIndex = tasks.findIndex((t) => t.id === activeId);
  const overIndex = tasks.findIndex((t) => t.id === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return tasks;
  }

  return arrayMove(tasks, activeIndex, overIndex);
};

export const moveTaskBetweenColumns = (
  sourceTasks: ITask[],
  targetTasks: ITask[],
  activeId: string,
  overId: string,
  targetColumnId: string,
): { source: ITask[]; target: ITask[] } => {
  const activeTask = sourceTasks.find((t) => t.id === activeId);
  if (!activeTask) {
    return { source: sourceTasks, target: targetTasks };
  }

  const source = sourceTasks.filter((t) => t.id !== activeId);

  const overIndex = targetTasks.findIndex((t) => t.id === overId);
  const insertIndex = overIndex >= 0 ? overIndex : targetTasks.length;

  const movedTask = { ...activeTask, column_id: targetColumnId };
  const target = [...targetTasks];
  target.splice(insertIndex, 0, movedTask);

  return { source, target };
};
