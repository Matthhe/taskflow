import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, Typography, Chip, Box } from "@mui/material";
import type { ITask } from "../../types";

interface TaskCardProps {
  task: ITask;
  onClick?: (task: ITask) => void;
}

const priorityColor = (priority: string) => {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "default";
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
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
        "&:active": { cursor: "grabbing" },
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 }, p: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Chip
            label={task.priority}
            size="small"
            color={priorityColor(task.priority)}
            sx={{ height: 20, fontSize: "0.75rem", fontWeight: 600 }}
          />
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}
        >
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
