import React from 'react';
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
  Box
} from '@mui/material';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, priority: string) => Promise<void>;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>New task</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            autoFocus
            label="Task name"
            type="text"
            fullWidth
            variant="outlined"
          />
          
          <TextField
            label="Discription"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
          />
          
          <FormControl fullWidth>
            <InputLabel id="priority-select-label">Priority</InputLabel>
            <Select
              labelId="priority-select-label"
              id="priority-select"
              label="Priority"
              defaultValue="Medium"
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
         Cancel
        </Button>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Create task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;