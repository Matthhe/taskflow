import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

interface BoardToolbarProps {
  boardTitle: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userEmail?: string | null;
  onBack: () => void;
  onOpenMembers: () => void;
  onToggleActivity: () => void;
  onLogout: () => void;
  themeMode: "light" | "dark";
  onToggleTheme: () => void;
}

export const BoardToolbar = ({
  boardTitle,
  searchQuery,
  setSearchQuery,
  userEmail,
  onBack,
  onOpenMembers,
  onToggleActivity,
  onLogout,
  themeMode,
  onToggleTheme,
}: BoardToolbarProps) => (
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
      <IconButton edge="start" onClick={onBack}>
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
        placeholder="Search tasks..."
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
        {userEmail}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PeopleIcon />}
        onClick={onOpenMembers}
        sx={{ textTransform: "none" }}
      >
        Members
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<HistoryIcon />}
        onClick={onToggleActivity}
        sx={{ textTransform: "none" }}
      >
        Activity
      </Button>
      <Button
        variant="outlined"
        color="error"
        size="small"
        startIcon={<LogoutIcon />}
        onClick={onLogout}
      >
        Log out
      </Button>

      <IconButton onClick={onToggleTheme}>
        {themeMode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Toolbar>
  </AppBar>
);
