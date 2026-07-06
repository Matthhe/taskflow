import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

interface ColumnDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}

const ColumnDialog: React.FC<ColumnDialogProps> = ({ open, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setTitle("");
    onClose();
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      setIsSaving(true);
      await onSave(title.trim());
      setTitle("");
      onClose();
    } catch (err) {
      console.error("Failed to create column:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>New column</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Column name"
          type="text"
          fullWidth
          variant="outlined"
          sx={{ mt: 1 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSaving}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit" disabled={isSaving} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={isSaving || !title.trim()}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {isSaving ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnDialog;