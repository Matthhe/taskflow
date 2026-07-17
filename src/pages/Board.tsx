import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Box, CircularProgress, Alert } from "@mui/material";

import { useAuth } from "../hooks/useAuth";
import { useBoardMembers } from "../hooks/useBoardMembers";
import { useActivityLog } from "../hooks/useActivityLog";
import { useBoard } from "../hooks/useBoard";
import { useBoardRealtime } from "../hooks/useBoardRealtime";
import { useBoardColumns } from "../hooks/useBoardColumns";
import { useBoardTasks } from "../hooks/useBoardTasks";
import { useTaskDnD } from "../hooks/useTaskDnD";
import { useBoardPermissions } from "../hooks/useBoardPermissions";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useThemeMode } from "../providers/ThemeProviderWrapper";

import { BoardToolbar } from "../components/board/BoardToolbar";
import { BoardFilters } from "../components/board/BoardFilters";
import { BoardCanvas } from "../components/board/BoardCanvas";
import { BoardActivityLog } from "../components/board/BoardActivityLog";
import MembersDialog from "../components/board/MembersDialog";
import ColumnDialog from "../components/ColumnDialog";
import TaskDialog from "../components/TaskDialog";
import TaskDetailsDialog from "../components/task/TaskDetailsDialog";

import type { ITask } from "../types";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();

  const { members } = useBoardMembers(boardId);
  const { logAction } = useActivityLog(boardId);

  const { columns, setColumns, boardTitle, boardOwnerId, loading, error } =
    useBoard(boardId, !!user);

  useBoardRealtime(boardId, setColumns);

  const permissions = useBoardPermissions(boardOwnerId, user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  const isFilteringActive = useMemo(
    () =>
      searchQuery.trim().length > 0 ||
      priorityFilter !== "all" ||
      assigneeFilter !== "all" ||
      deadlineFilter !== "all",
    [searchQuery, priorityFilter, assigneeFilter, deadlineFilter],
  );

  const filteredColumns = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        if (
          query &&
          !task.title?.toLowerCase().includes(query) &&
          !task.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }
        if (assigneeFilter !== "all" && task.assignee_id !== assigneeFilter) {
          return false;
        }
        if (deadlineFilter !== "all") {
          if (!task.due_date) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const taskDate = new Date(task.due_date);
          taskDate.setHours(0, 0, 0, 0);
          if (deadlineFilter === "overdue" && taskDate >= today) return false;
          if (
            deadlineFilter === "today" &&
            taskDate.getTime() !== today.getTime()
          )
            return false;
        }
        return true;
      }),
    }));
  }, [columns, searchQuery, priorityFilter, assigneeFilter, deadlineFilter]);

  const { handleCreateColumn, handleRenameColumn, handleDeleteColumn } =
    useBoardColumns(boardId, columns, setColumns, logAction, user?.id);

  const { handleCreateTask, handleDeleteTask, handleUpdateTask } =
    useBoardTasks(columns, setColumns, user?.id);

  const { sensors, handleDragStart, handleDragOver, handleDragEnd } =
    useTaskDnD(columns, filteredColumns, setColumns, isFilteringActive);

  const handleOpenTaskDialog = (columnId: string) => {
    setActiveColumnId(columnId);
    setIsTaskDialogOpen(true);
  };

  useKeyboardShortcuts(
    columns.length,
    isTaskDialogOpen,
    isColumnDialogOpen,
    handleOpenTaskDialog,
    columns[0]?.id,
  );

  const handleTaskClick = (task: ITask) => {
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
  };

  const handleCreateTaskSubmit = (
    title: string,
    description: string,
    priority: string,
  ) => handleCreateTask(title, description, priority, activeColumnId);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        minHeight: "100vh",
        pb: 4,
      }}
    >
      <BoardToolbar
        boardTitle={boardTitle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userEmail={user?.email}
        onBack={() => navigate("/")}
        onOpenMembers={() => setIsMembersDialogOpen(true)}
        onToggleActivity={() => setIsActivityLogOpen((prev) => !prev)}
        onLogout={() => signOut()}
        themeMode={mode}
        onToggleTheme={toggleMode}
      />

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <BoardFilters
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          deadlineFilter={deadlineFilter}
          setDeadlineFilter={setDeadlineFilter}
          members={members}
          isFilteringActive={isFilteringActive}
          canManageColumns={permissions.canManageColumns}
          onAddColumn={() => setIsColumnDialogOpen(true)}
        />

        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <BoardCanvas
              filteredColumns={filteredColumns}
              sensors={sensors}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              members={members}
              permissions={permissions}
              onAddTask={handleOpenTaskDialog}
              onTaskClick={handleTaskClick}
              onDeleteTask={handleDeleteTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          </Box>

          {isActivityLogOpen && <BoardActivityLog boardId={boardId} />}
        </Box>
      </Container>

      <ColumnDialog
        open={isColumnDialogOpen}
        onClose={() => setIsColumnDialogOpen(false)}
        onSave={handleCreateColumn}
      />
      <TaskDialog
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onSave={handleCreateTaskSubmit}
      />
      <TaskDetailsDialog
        open={isDetailsDialogOpen}
        task={selectedTask}
        boardId={boardId}
        onClose={() => setIsDetailsDialogOpen(false)}
        onSave={handleUpdateTask}
      />
      <MembersDialog
        open={isMembersDialogOpen}
        onClose={() => setIsMembersDialogOpen(false)}
        boardId={boardId}
        canManageMembers={permissions.canManageMembers}
      />
    </Box>
  );
};

export default Board;
