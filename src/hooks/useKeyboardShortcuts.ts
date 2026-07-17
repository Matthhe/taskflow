import { useEffect } from "react";

export const useKeyboardShortcuts = (
  columnsLength: number,
  isTaskDialogOpen: boolean,
  isColumnDialogOpen: boolean,
  onOpenAddTask: (columnId: string) => void,
  firstColumnId?: string,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        ["INPUT", "TEXTAREA"].includes(target.tagName) ||
        target.isContentEditable;
      if (isTyping) return;

      if (
        e.key.toLowerCase() === "n" &&
        !isTaskDialogOpen &&
        !isColumnDialogOpen &&
        columnsLength > 0 &&
        firstColumnId
      ) {
        e.preventDefault();
        onOpenAddTask(firstColumnId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    columnsLength,
    isTaskDialogOpen,
    isColumnDialogOpen,
    onOpenAddTask,
    firstColumnId,
  ]);
};
