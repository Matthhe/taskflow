import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useNotification } from "../hooks/useNotification";
import TaskDetailsDialog from "../components/task/TaskDetailsDialog";
import { useBoardMembers } from "../hooks/useBoardMembers";
import PeopleIcon from "@mui/icons-material/People";
import MembersDialog from "../components/board/MembersDialog";
import { useActivityLog } from "../hooks/useActivityLog";
import { BoardActivityLog } from "../components/board/BoardActivityLog";
import HistoryIcon from "@mui/icons-material/History";

import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import Column from "../components/board/Column";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabase";
import ColumnDialog from "../components/ColumnDialog";
import TaskDialog from "../components/TaskDialog";
import type { ITask, IColumn } from "../types";
import { useThemeMode } from "../providers/ThemeProviderWrapper";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { getBoardPermissions } from "../utils/permissions";

interface ColumnWithTasks extends IColumn {
  tasks: ITask[];
}

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { members } = useBoardMembers(boardId);

  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [boardTitle, setBoardTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("all");

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [boardOwnerId, setBoardOwnerId] = useState<string | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const { logAction } = useActivityLog(boardId);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  const { mode, toggleMode } = useThemeMode();
  const { notify } = useNotification();

  const permissions = getBoardPermissions(
    boardOwnerId ? (user?.id === boardOwnerId ? "owner" : "member") : null,
  );

  const isFilteringActive = useMemo(() => {
    return (
      searchQuery.trim().length > 0 ||
      priorityFilter !== "all" ||
      assigneeFilter !== "all" ||
      deadlineFilter !== "all"
    );
  }, [searchQuery, priorityFilter, assigneeFilter, deadlineFilter]);

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

  const filteredColumns = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
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

          if (deadlineFilter === "overdue" && taskDate >= today) {
            return false;
          }
          if (
            deadlineFilter === "today" &&
            taskDate.getTime() !== today.getTime()
          ) {
            return false;
          }
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });
  }, [columns, searchQuery, priorityFilter, assigneeFilter, deadlineFilter]);

  const fetchBoardData = async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);

      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("title, owner_id")
        .eq("id", boardId)
        .single();
      if (boardError) throw boardError;
      setBoardTitle(boardData.title);
      setBoardOwnerId(boardData.owner_id);

      const { data: colsData, error: colsError } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", boardId)
        .order("position", { ascending: true });
      if (colsError) throw colsError;

      const columnIds = (colsData || []).map((c) => c.id);

      const { data: tasksData, error: tasksError } = columnIds.length
        ? await supabase
            .from("tasks")
            .select("*")
            .in("column_id", columnIds)
            .order("position", { ascending: true })
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const formattedColumns: ColumnWithTasks[] = (colsData || []).map(
        (col) => ({
          ...col,
          tasks: (tasksData || []).filter(
            (task) => task.column_id === col.id,
          ) as ITask[],
        }),
      );

      setColumns(formattedColumns);
    } catch (err) {
      console.error("Error loading board data:", err);
      const message =
        err instanceof Error ? err.message : "Error loading board data";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

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
        columns.length > 0
      ) {
        e.preventDefault();
        handleOpenTaskDialog(columns[0].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [columns, isTaskDialogOpen, isColumnDialogOpen]);

  useEffect(() => {
    if (user && boardId) {
      fetchBoardData();
    }
  }, [user, boardId]);

  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setColumns((prev) => {
            const columnIds = new Set(prev.map((c) => c.id));

            if (payload.eventType === "INSERT") {
              const newTask = payload.new as ITask;
              if (!columnIds.has(newTask.column_id)) return prev;
              const alreadyExists = prev.some((col) =>
                col.tasks.some((t) => t.id === newTask.id),
              );
              if (alreadyExists) return prev;
              return prev.map((col) =>
                col.id === newTask.column_id
                  ? { ...col, tasks: [...col.tasks, newTask] }
                  : col,
              );
            }

            if (payload.eventType === "UPDATE") {
              const updatedTask = payload.new as ITask;
              return prev.map((col) => {
                const withoutTask = col.tasks.filter(
                  (t) => t.id !== updatedTask.id,
                );
                if (col.id === updatedTask.column_id) {
                  const alreadyThere = col.tasks.some(
                    (t) => t.id === updatedTask.id,
                  );
                  const tasks = alreadyThere
                    ? col.tasks.map((t) =>
                        t.id === updatedTask.id ? updatedTask : t,
                      )
                    : [...withoutTask, updatedTask];
                  return { ...col, tasks };
                }
                return { ...col, tasks: withoutTask };
              });
            }

            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as ITask).id;
              return prev.map((col) => ({
                ...col,
                tasks: col.tasks.filter((t) => t.id !== deletedId),
              }));
            }

            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          setColumns((prev) => {
            if (payload.eventType === "INSERT") {
              const newCol = payload.new as IColumn;
              if (prev.some((c) => c.id === newCol.id)) return prev;
              return [...prev, { ...newCol, tasks: [] }];
            }
            if (payload.eventType === "UPDATE") {
              const updatedCol = payload.new as IColumn;
              return prev.map((col) =>
                col.id === updatedCol.id ? { ...col, ...updatedCol } : col,
              );
            }
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as IColumn).id;
              return prev.filter((col) => col.id !== deletedId);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const handleCreateColumn = async (title: string) => {
    if (!boardId) return;
    try {
      const { data, error } = await supabase
        .from("columns")
        .insert([{ title, board_id: boardId, position: columns.length }])
        .select()
        .single();
      if (error) throw error;

      setColumns([...columns, { ...data, tasks: [] }]);
    } catch (err) {
      console.error("Failed to create column:", err);
      const message =
        err instanceof Error ? err.message : "Failed to create column";
      notify(message, "error");
    }
  };

  const handleCreateTask = async (
    title: string,
    description: string,
    priority: string,
  ) => {
    if (!activeColumnId || !user) return;
    try {
      const column = columns.find((c) => c.id === activeColumnId);
      const position = column ? column.tasks.length : 0;

      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title,
            description,
            priority,
            column_id: activeColumnId,
            created_by: user.id,
            position,
          },
        ])
        .select()
        .single();
      if (error) throw error;

      setColumns(
        columns.map((col) =>
          col.id === activeColumnId
            ? { ...col, tasks: [...col.tasks, data as ITask] }
            : col,
        ),
      );

      logAction.mutate({ userId: user.id, action: `created task "${title}"` });
    } catch (err) {
      console.error("Failed to create task:", err);
      const message =
        err instanceof Error ? err.message : "Failed to create task";
      notify(message, "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const task = columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);

      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        })),
      );

      if (task && user) {
        logAction.mutate({
          userId: user.id,
          action: `deleted task "${task.title}"`,
        });
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      const message =
        err instanceof Error ? err.message : "Failed to delete task";
      notify(message, "error");
    }
  };

  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("columns")
        .update({ title: newTitle })
        .eq("id", columnId);
      if (error) throw error;
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, title: newTitle } : col,
        ),
      );
    } catch (err) {
      console.error("Failed to rename column:", err);
      const message =
        err instanceof Error ? err.message : "Failed to rename column";
      notify(message, "error");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const column = columns.find((c) => c.id === columnId);

      const { error } = await supabase
        .from("columns")
        .delete()
        .eq("id", columnId);
      if (error) throw error;

      setColumns((prev) => prev.filter((col) => col.id !== columnId));

      if (column && user) {
        logAction.mutate({
          userId: user.id,
          action: `deleted column "${column.title}"`,
        });
      }
    } catch (err) {
      console.error("Failed to delete column:", err);
      const message =
        err instanceof Error ? err.message : "Failed to delete column";
      notify(message, "error");
    }
  };

  const handleOpenTaskDialog = (columnId: string) => {
    setActiveColumnId(columnId);
    setIsTaskDialogOpen(true);
  };

  const handleTaskClick = (task: ITask) => {
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      priority: string;
      due_date: string | null;
      assignee_id: string | null;
    },
  ) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();
      if (error) throw error;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, ...(data as ITask) } : t,
          ),
        })),
      );
    } catch (err) {
      console.error("Failed to update task:", err);
      const message =
        err instanceof Error ? err.message : "Failed to update task";
      notify(message, "error");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isFilteringActive) return;
    const activeId = event.active.id as string;
    const col = findColumnByTaskId(activeId);
    setDragSourceColumnId(col ? col.id : null);
  };

  const findColumnByTaskId = (taskId: string) => {
    return filteredColumns.find((col) =>
      col.tasks.some((task) => task.id === taskId),
    );
  };

  const updateTasksOrderInDb = async (
    columnId: string,
    updatedTasks: ITask[],
  ) => {
    const promises = updatedTasks.map((task, index) =>
      supabase
        .from("tasks")
        .update({ position: index, column_id: columnId })
        .eq("id", task.id),
    );
    await Promise.all(promises);
  };

  const handleDragOver = (event: DragOverEvent) => {
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
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
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
  };

  const handleDragEnd = async (event: DragEndEvent) => {
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
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
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
      const movedTask = finalTargetCol?.tasks.find((t) => t.id === activeId);

      try {
        await Promise.all([
          finalSourceCol
            ? updateTasksOrderInDb(finalSourceCol.id, finalSourceCol.tasks)
            : Promise.resolve(),
          finalTargetCol
            ? updateTasksOrderInDb(finalTargetCol.id, finalTargetCol.tasks)
            : Promise.resolve(),
        ]);

        if (movedTask && user) {
          logAction.mutate({
            userId: user.id,
            action: `moved task "${movedTask.title}" to "${overCol.title}"`,
          });
        }
      } catch (err) {
        console.error("Failed to save cross-column tasks order:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to save cross-column tasks order";
        notify(message, "error");
      }
    }
  };

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
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton edge="start" onClick={() => navigate("/")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, minWidth: "max-content" }}
          >
            {boardTitle || "TaskFlow"}
          </Typography>

          <TextField
            size="small"
            variant="outlined"
            placeholder="Searching tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flexGrow: 1,
              maxWidth: 300,
              mx: 1,
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {user?.email}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PeopleIcon />}
            onClick={() => setIsMembersDialogOpen(true)}
            sx={{ textTransform: "none" }}
          >
            Members
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => setIsActivityLogOpen((prev) => !prev)}
            sx={{ textTransform: "none" }}
          >
            Activity
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={() => signOut()}
          >
            Log out
          </Button>

          <IconButton onClick={toggleMode}>
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="priority-filter-label">Priority</InputLabel>
            <Select
              labelId="priority-filter-label"
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="assignee-filter-label">Assignee</InputLabel>
            <Select
              labelId="assignee-filter-label"
              value={assigneeFilter}
              label="Assignee"
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <MenuItem value="all">All Assignees</MenuItem>
              {members?.map((member: any) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.email || member.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="deadline-filter-label">Deadline</InputLabel>
            <Select
              labelId="deadline-filter-label"
              value={deadlineFilter}
              label="Deadline"
              onChange={(e) => setDeadlineFilter(e.target.value)}
            >
              <MenuItem value="all">Any Date</MenuItem>
              <MenuItem value="today">Due Today</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>

          {isFilteringActive && (
            <Typography
              variant="body2"
              color="warning.main"
              sx={{ fontWeight: 500, ml: 1 }}
            >
              Sorting is disabled during active filtering.
            </Typography>
          )}

          <Box sx={{ ml: "auto" }}>
            {permissions.canManageColumns && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsColumnDialogOpen(true)}
              >
                Add column
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  pb: 2,
                  "&::-webkit-scrollbar": { height: "8px" },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.1)",
                    borderRadius: "4px",
                  },
                }}
              >
                <Grid container spacing={3} wrap="nowrap">
                  {filteredColumns.map((column) => {
                    const { tasks, ...columnData } = column;

                    return (
                      <Grid key={column.id} sx={{ flexShrink: 0 }}>
                        <Column
                          column={columnData}
                          tasks={tasks}
                          members={members}
                          permissions={permissions}
                          onAddTask={handleOpenTaskDialog}
                          onTaskClick={handleTaskClick}
                          onDeleteTask={handleDeleteTask}
                          onRenameColumn={handleRenameColumn}
                          onDeleteColumn={handleDeleteColumn}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </DndContext>
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
        onSave={handleCreateTask}
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
