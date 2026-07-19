import { useState } from "react";
import { useMediaQuery, useTheme, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import { useBoards } from "../hooks/useBoards";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import PersonIcon from "@mui/icons-material/Person";
import { useThemeMode } from "../providers/ThemeProviderWrapper";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const BoardsList = () => {
  const { boards, isLoading, isError, createBoard, deleteBoard } = useBoards();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { mode, toggleMode } = useThemeMode();

  const { notify } = useNotification();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createBoard.mutateAsync(newTitle.trim());
      setNewTitle("");
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create board:", err);
      const message =
        err instanceof Error ? err.message : "Failed to create board";
      notify(message, "error");
    }
  };

  const handleDelete = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (confirm("Delete board with all tasks?")) {
      deleteBoard.mutate(boardId, {
        onError: (err) => {
          console.error("Failed to delete board:", err);
          const message =
            err instanceof Error ? err.message : "Failed to delete board";
          notify(message, "error");
        },
      });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
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
        <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 1 }}>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            TaskFlow
          </Typography>

          {!isMobile && (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {user?.email}
            </Typography>
          )}

          {isMobile ? (
            <Tooltip title="Log out">
              <IconButton size="small" color="error" onClick={() => signOut()}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              startIcon={<LogoutIcon />}
              onClick={() => signOut()}
              sx={{ textTransform: "none" }}
            >
              Log out
            </Button>
          )}

          <IconButton onClick={() => navigate("/profile")}>
            <PersonIcon />
          </IconButton>

          <IconButton onClick={toggleMode}>
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            My boards
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create board
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && <Alert severity="error">Failed to load boards</Alert>}

        {!isLoading && !isError && boards.length === 0 && (
          <Typography color="text.secondary">
            There are no boards yet - create the first one.
          </Typography>
        )}

        <Grid container spacing={2}>
          {boards.map((board) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={board.id}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardActionArea onClick={() => navigate(`/board/${board.id}`)}>
                  <CardContent
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {board.title}
                    </Typography>
                    {board.role === "owner" && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, board.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 600 }}>New boards</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Board name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createBoard.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoardsList;
