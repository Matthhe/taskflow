import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    priority: string,
  ) => Promise<void>;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ open, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    onClose();
  };

  const handleCreate = async () => {
  if (!title.trim()) return;
  try {
    setIsSaving(true);
    await onSave(title.trim(), description.trim(), priority.trim());
    setTitle("");
    setDescription("");
    setPriority("medium");
    onClose();
  } finally {
    setIsSaving(false);
  }
};
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>New task</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            autoFocus
            label="Task name"
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />

          <TextField
            label="Discription"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />

          <FormControl fullWidth>
            <InputLabel id="priority-select-label">Priority</InputLabel>
            <Select
              labelId="priority-select-label"
              id="priority-select"
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isSaving}
            >
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={isSaving}
          color="inherit"
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isSaving || !title.trim()}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Create task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;
