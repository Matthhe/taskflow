import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';

interface ColumnDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}

const ColumnDialog: React.FC<ColumnDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>New column</DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Название колонки"
          type="text"
          fullWidth
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnDialog;