import { DndContext, closestCorners } from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import Column from "./Column";
import type { ColumnWithTasks } from "../../hooks/useBoard";
import type { ITask, IProfile } from "../../types";
import type { BoardPermissions } from "../../utils/permissions";

interface BoardCanvasProps {
  filteredColumns: ColumnWithTasks[];
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragStart: (e: DragStartEvent) => void;
  handleDragOver: (e: DragOverEvent) => void;
  handleDragEnd: (e: DragEndEvent) => void;
  members: IProfile[];
  permissions: BoardPermissions;
  onAddTask: (colId: string) => void;
  onTaskClick: (task: ITask) => void;
  onDeleteTask: (id: string) => void;
  onRenameColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
}

export const BoardCanvas = ({
  filteredColumns,
  sensors,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  members,
  permissions,
  onAddTask,
  onTaskClick,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}: BoardCanvasProps) => (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCorners}
    onDragOver={handleDragOver}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
  >
    <Box
      sx={{
        display: "flex",
        overflowX: "auto",
        pb: 2,
        "&::-webkit-scrollbar": { height: "8px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.2)"
              : "rgba(0,0,0,0.1)",
          borderRadius: "4px",
        },
      }}
    >
      <Grid container spacing={3} wrap="nowrap">
        {filteredColumns.map((column) => {
          const { tasks, ...columnData } = column;
          return (
            <Grid key={column.id} sx={{ flexShrink: 0 }}>
              <Column
                column={columnData}
                tasks={tasks}
                members={members}
                permissions={permissions}
                onAddTask={onAddTask}
                onTaskClick={onTaskClick}
                onDeleteTask={onDeleteTask}
                onRenameColumn={onRenameColumn}
                onDeleteColumn={onDeleteColumn}
              />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  </DndContext>
);
