import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import type { IColumn, ITask, IProfile } from "../../types";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface ColumnProps {
  column: IColumn;
  tasks: ITask[];
  members: IProfile[];
  onAddTask?: (columnId: string) => void;
  onTaskClick?: (task: ITask) => void;
  onDeleteTask?: (taskId: string) => void;
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  members,
  onAddTask,
  onTaskClick,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}) => {
  const { setNodeRef } = useDroppable({ id: column.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);

  const startEditing = () => {
    setEditValue(column.title);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn?.(column.id, trimmed);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(column.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };
  const handleDeleteClick = () => {
    if (confirm(`Delete column "${column.title}" and all its tasks?`)) {
      onDeleteColumn?.(column.id);
    }
  };

  return (
    <Box
      sx={{
        width: 300,
        backgroundColor: "#f5f5f5",
        borderRadius: 2,
        padding: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isEditing ? (
        <TextField
          autoFocus
          size="small"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          sx={{ mb: 2 }}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            px: 0.5,
          }}
        >
          <Typography
            variant="h6"
            onClick={startEditing}
            sx={{
              fontWeight: 700,
              cursor: "pointer",
              "&:hover": { opacity: 0.7 },
            }}
          >
            {column.title} ({tasks.length})
          </Typography>
          <IconButton size="small" onClick={handleDeleteClick}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Paper
        ref={setNodeRef}
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
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              flexGrow: 1,
            }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignee={members.find((m) => m.id === task.assignee_id)}
                onClick={onTaskClick}
                onDelete={onDeleteTask}
              />
            ))}
          </Box>
        </SortableContext>

        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => onAddTask?.(column.id)}
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            textTransform: "none",
          }}
        >
          Add task
        </Button>
      </Paper>
    </Box>
  );
};

export default Column;
