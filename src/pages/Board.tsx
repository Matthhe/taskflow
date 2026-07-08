import { useState, useEffect } from "react";
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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useNotification } from "../hooks/useNotification";
import TaskDetailsDialog from "../components/task/TaskDetailsDialog";

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

interface ColumnWithTasks extends IColumn {
  tasks: ITask[];
}

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const [boardTitle, setBoardTitle] = useState<string>("");
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { notify } = useNotification();

  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const fetchBoardData = async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);

      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("title")
        .eq("id", boardId)
        .single();
      if (boardError) throw boardError;
      setBoardTitle(boardData.title);

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
          tasks: (tasksData || []).filter((task) => task.column_id === col.id),
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
    if (user && boardId) {
      fetchBoardData();
    }
  }, [user, boardId]);

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
            ? { ...col, tasks: [...col.tasks, data] }
            : col,
        ),
      );
    } catch (err) {
      console.error("Failed to create task:", err);
      const message =
        err instanceof Error ? err.message : "Failed to create task";
      notify(message, "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        })),
      );
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
      const { error } = await supabase
        .from("columns")
        .delete()
        .eq("id", columnId);
      if (error) throw error;

      setColumns((prev) => prev.filter((col) => col.id !== columnId));
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
            t.id === taskId ? { ...t, ...data } : t,
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
    const activeId = event.active.id as string;
    const col = findColumnByTaskId(activeId);
    setDragSourceColumnId(col ? col.id : null);
  };

  const findColumnByTaskId = (taskId: string) => {
    return columns.find((col) => col.tasks.some((task) => task.id === taskId));
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
    <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh", pb: 4 }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate("/")} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {boardTitle || "TaskFlow"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mr: 2, display: { xs: "none", sm: "block" } }}
          >
            {user?.email}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={() => signOut()}
          >
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsColumnDialogOpen(true)}
          >
            Add column
          </Button>
        </Box>

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
                backgroundColor: "rgba(0,0,0,0.1)",
                borderRadius: "4px",
              },
            }}
          >
            <Grid container spacing={3} wrap="nowrap">
              {columns.map((column) => {
                const { tasks, ...columnData } = column;

                return (
                  <Grid key={column.id} sx={{ flexShrink: 0 }}>
                    <Column
                      column={columnData}
                      tasks={tasks}
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
    </Box>
  );
};

export default Board;
