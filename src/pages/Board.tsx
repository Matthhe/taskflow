import { useState, useEffect } from "react";
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
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabase";
import ColumnDialog from "../components/ColumnDialog";
import TaskDialog from "../components/TaskDialog";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  column_id: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const Board = () => {
  const { signOut, user } = useAuth();

  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const fetchBoardData = async () => {
    try {
      setLoading(true);

      const { data: colsData, error: colsError } = await supabase
        .from("columns")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (colsError) throw colsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id);

      if (tasksError) throw tasksError;

      const formattedColumns = (colsData || []).map((col: any) => ({
        id: col.id,
        title: col.title,
        tasks: (tasksData || []).filter(
          (task: any) => task.column_id === col.id,
        ),
      }));

      setColumns(formattedColumns);
    } catch (error) {
      console.error("Ошибка загрузки данных доски:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBoardData();
    }
  }, [user]);

  const handleCreateColumn = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from("columns")
        .insert([{ title, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;

      setColumns([...columns, { id: data.id, title: data.title, tasks: [] }]);
    } catch (error) {
      console.error("Failed to create the column:", error);
    }
  };

  const handleCreateTask = async (
    title: string,
    description: string,
    priority: string,
  ) => {
    if (!activeColumnId) return;
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title,
            description,
            priority,
            column_id: activeColumnId,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setColumns(
        columns.map((col) => {
          if (col.id === activeColumnId) {
            return { ...col, tasks: [...col.tasks, data] };
          }
          return col;
        }),
      );
    } catch (error) {
      console.error("Не удалось создать задачу:", error);
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
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <DashboardIcon color="primary" />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            TaskFlow
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
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Workspace
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsColumnDialogOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600 }}
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
                              task.priority === "High"
                                ? "error"
                                : task.priority === "Medium"
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
