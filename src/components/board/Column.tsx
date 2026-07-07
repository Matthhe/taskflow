import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import { type IColumn, type ITask } from "../../types";
import { Box, Typography, Button, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface ColumnProps {
  column: IColumn;
  tasks: ITask[];
  onAddTask?: (columnId: string) => void;
  onTaskClick?: (task: ITask) => void;
}

const Column: React.FC<ColumnProps> = ({ column, tasks, onAddTask, onTaskClick }) => {
  const { setNodeRef } = useDroppable({ id: column.id });

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
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, px: 0.5 }}>
        {column.title} ({tasks.length})
      </Typography>

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
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flexGrow: 1 }}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </Box>
        </SortableContext>

        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => onAddTask?.(column.id)}
          sx={{ justifyContent: "flex-start", color: "text.secondary", textTransform: "none" }}
        >
          Add task
        </Button>
      </Paper>
    </Box>
  );
};

export default Column;