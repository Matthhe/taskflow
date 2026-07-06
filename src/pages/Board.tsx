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
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";

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
    } catch (err: any) {
      console.error("Ошибка загрузки данных доски:", err);
      setError(err.message || "Не удалось загрузить доску");
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
      console.error("Falied to create task:", err);
    }
  };

  const handleOpenTaskDialog = (columnId: string) => {
    setActiveColumnId(columnId);
    setIsTaskDialogOpen(true);
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

        <Grid container spacing={3}>
          {columns.map((column) => (
            <Grid size={{ xs: 12, md: 4 }} key={column.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "#eceff1",
                  borderRadius: 2,
                  minHeight: "70vh",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, px: 1 }}>
                    {column.title}
                  </Typography>
                  <Chip
                    label={column.tasks.length}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flexGrow: 1,
                  }}
                >
                  {column.tasks.map((task) => (
                    <Card
                      key={task.id}
                      elevation={0}
                      sx={{ borderRadius: 1.5, border: "1px solid #e0e0e0" }}
                    >
                      <CardContent sx={{ "&:last-child": { pb: 2 }, p: 2 }}>
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={
                              task.priority === "high"
                                ? "error"
                                : task.priority === "medium"
                                  ? "warning"
                                  : "default"
                            }
                            sx={{
                              height: 20,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}
                        >
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                <Button
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTaskDialog(column.id)}
                  sx={{
                    justifyContent: "flex-start",
                    color: "text.secondary",
                    textTransform: "none",
                  }}
                >
                  Add task
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
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
    </Box>
  );
};

export default Board;
