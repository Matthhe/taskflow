import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { IProfile } from "../../types";

interface BoardFiltersProps {
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (val: string) => void;
  deadlineFilter: string;
  setDeadlineFilter: (val: string) => void;
  members: IProfile[];
  isFilteringActive: boolean;
  canManageColumns: boolean;
  onAddColumn: () => void;
}

export const BoardFilters = ({
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  deadlineFilter,
  setDeadlineFilter,
  members,
  isFilteringActive,
  canManageColumns,
  onAddColumn,
}: BoardFiltersProps) => (
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
        {members.map((member) => (
          <MenuItem key={member.id} value={member.id}>
            {member.name || member.email || member.id}
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
      {canManageColumns && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddColumn}
        >
          Add column
        </Button>
      )}
    </Box>
  </Box>
);
