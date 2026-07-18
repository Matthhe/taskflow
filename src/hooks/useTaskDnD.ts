import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { tasksService } from "../services/tasks.service";
import { useNotification } from "./useNotification";
import type { ColumnWithTasks } from "./useBoard";
import type { ITask } from "../types";

// NOTE: task move activity log entries are written by a database trigger
// (see schema.sql, on_task_moved), so no client-side logging happens here.

export const useTaskDnD = (
  columns: ColumnWithTasks[],
  filteredColumns: ColumnWithTasks[],
  setColumns: Dispatch<SetStateAction<ColumnWithTasks[]>>,
  isFilteringActive: boolean,
) => {
  const { notify } = useNotification();
  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isFilteringActive
        ? { distance: Infinity }
        : { distance: 5 },
    }),
  );

  const findColumnByTaskId = useCallback(
    (taskId: string) => {
      return filteredColumns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );
    },
    [filteredColumns],
  );

  const updateTasksOrderInDb = useCallback(
    (columnId: string, updatedTasks: ITask[]) =>
      tasksService.reorder(columnId, updatedTasks),
    [],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (isFilteringActive) return;
      const activeId = event.active.id as string;
      const col = findColumnByTaskId(activeId);
      setDragSourceColumnId(col ? col.id : null);
    },
    [isFilteringActive, findColumnByTaskId],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (isFilteringActive) return;
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeCol = findColumnByTaskId(activeId);
      const overCol =
        columns.find((col) => col.id === overId) || findColumnByTaskId(overId);

      if (!activeCol || !overCol || activeCol.id === overCol.id) return;

      setColumns((prevCols) => {
        return prevCols.map((col) => {
          if (col.id === activeCol.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== activeId),
            };
          }
          if (col.id === overCol.id) {
            const activeTask = activeCol.tasks.find((t) => t.id === activeId);
            if (!activeTask) return col;

            const overIndex = col.tasks.findIndex((t) => t.id === overId);
            const newIndex = overIndex >= 0 ? overIndex : col.tasks.length;

            const updatedTask = { ...activeTask, column_id: overCol.id };
            const newTasks = [...col.tasks];
            newTasks.splice(newIndex, 0, updatedTask);

            return { ...col, tasks: newTasks };
          }
          return col;
        });
      });
    },
    [isFilteringActive, columns, findColumnByTaskId, setColumns],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (isFilteringActive) return;
      const { active, over } = event;
      const sourceColumnId = dragSourceColumnId;
      setDragSourceColumnId(null);

      if (!over || !sourceColumnId) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeCol = findColumnByTaskId(activeId);
      const overCol =
        columns.find((col) => col.id === overId) || findColumnByTaskId(overId);

      if (!activeCol || !overCol) return;

      if (sourceColumnId === overCol.id) {
        const activeIndex = activeCol.tasks.findIndex((t) => t.id === activeId);
        const overIndex = activeCol.tasks.findIndex((t) => t.id === overId);

        let finalTasks = activeCol.tasks;
        if (
          activeIndex !== -1 &&
          overIndex !== -1 &&
          activeIndex !== overIndex
        ) {
          finalTasks = arrayMove(activeCol.tasks, activeIndex, overIndex);
          setColumns((prev) =>
            prev.map((col) =>
              col.id === activeCol.id ? { ...col, tasks: finalTasks } : col,
            ),
          );
        }

        try {
          await updateTasksOrderInDb(activeCol.id, finalTasks);
        } catch (err) {
          console.error("Failed to save tasks order:", err);
          const message =
            err instanceof Error ? err.message : "Failed to save tasks order";
          notify(message, "error");
        }
      } else {
        const finalSourceCol = columns.find((c) => c.id === sourceColumnId);
        const finalTargetCol = columns.find((c) => c.id === overCol.id);

        try {
          await Promise.all([
            finalSourceCol
              ? updateTasksOrderInDb(finalSourceCol.id, finalSourceCol.tasks)
              : Promise.resolve(),
            finalTargetCol
              ? updateTasksOrderInDb(finalTargetCol.id, finalTargetCol.tasks)
              : Promise.resolve(),
          ]);
        } catch (err) {
          console.error("Failed to save cross-column tasks order:", err);
          const message =
            err instanceof Error
              ? err.message
              : "Failed to save cross-column tasks order";
          notify(message, "error");
        }
      }
    },
    [
      isFilteringActive,
      dragSourceColumnId,
      columns,
      findColumnByTaskId,
      updateTasksOrderInDb,
      setColumns,
      notify,
    ],
  );

  return { sensors, handleDragStart, handleDragOver, handleDragEnd };
};
