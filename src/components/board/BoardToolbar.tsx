import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
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
}: BoardToolbarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
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
      <Toolbar
        sx={{
          gap: 1,
          flexWrap: "wrap",
          py: 1,
        }}
      >
        <IconButton edge="start" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: { xs: 120, sm: "none" },
          }}
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
            minWidth: { xs: 120, sm: 200 },
            maxWidth: 300,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {!isMobile && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: "auto", whiteSpace: "nowrap" }}
          >
            {userEmail}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1, ml: isMobile ? "auto" : 0 }}>
          {isMobile ? (
            <>
              <Tooltip title="Members">
                <IconButton size="small" onClick={onOpenMembers}>
                  <PeopleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Activity">
                <IconButton size="small" onClick={onToggleActivity}>
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Log out">
                <IconButton size="small" color="error" onClick={onLogout}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
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
            </>
          )}

          <IconButton onClick={onToggleTheme}>
            {themeMode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
