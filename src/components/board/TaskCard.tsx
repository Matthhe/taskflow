import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, Typography, Chip, Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { ITask } from "../../types";

interface TaskCardProps {
  task: ITask;
  onClick?: (task: ITask) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColor = (priority: string) => {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "default";
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(task.id);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      elevation={0}
      sx={{
        borderRadius: 1.5,
        border: "1px solid #e0e0e0",
        cursor: "grab",
        position: "relative",
        "&:active": { cursor: "grabbing" },
        "&:hover .task-delete-btn": { opacity: 1 },
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 }, p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Chip
            label={task.priority}
            size="small"
            color={priorityColor(task.priority)}
            sx={{ height: 20, fontSize: "0.75rem", fontWeight: 600 }}
          />
          <IconButton
            className="task-delete-btn"
            size="small"
            onClick={handleDeleteClick}
            sx={{ opacity: 0, transition: "opacity 0.15s", p: 0.5, ml: 1 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}>
          {task.title}
        </Typography>
        {task.description && (
          <Typography variant="body2" color="text.secondary">
            {task.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;