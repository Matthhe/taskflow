import React, { useState, useEffect } from "react";
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Typography,
} from "@mui/material";
import { useBoardMembers } from "../../hooks/useBoardMembers";
import type { ITask, TaskPriority } from "../../types";
import DeleteIcon from "@mui/icons-material/Delete";
import { useComments } from "../../hooks/useComments";
import { useAuth } from "../../hooks/useAuth";

interface TaskUpdates {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
}

interface TaskDetailsDialogProps {
  open: boolean;
  task: ITask | null;
  boardId: string | undefined;
  onClose: () => void;
  onSave: (taskId: string, updates: TaskUpdates) => Promise<void>;
}

const UNASSIGNED = "unassigned";

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  open,
  task,
  boardId,
  onClose,
  onSave,
}) => {
  const { members } = useBoardMembers(boardId);

  const { user } = useAuth();
  const { comments, addComment, deleteComment } = useComments(task?.id);
  const [commentText, setCommentText] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.due_date || "");
      setAssigneeId(task.assignee_id || UNASSIGNED);
    }
  }, [task]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;
    try {
      await addComment.mutateAsync({
        userId: user.id,
        content: commentText.trim(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    try {
      setIsSaving(true);
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId === UNASSIGNED ? null : assigneeId,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Task details</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            autoFocus
            label="Task name"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />

          <TextField
            label="Description"
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
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={isSaving}
            >
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Due date"
            type="date"
            fullWidth
            variant="outlined"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSaving}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl fullWidth>
            <InputLabel id="assignee-select-label">Assignee</InputLabel>
            <Select
              labelId="assignee-select-label"
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={isSaving}
            >
              <MenuItem value={UNASSIGNED}>Unassigned</MenuItem>
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name || member.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Comments
          </Typography>

          <List sx={{ maxHeight: 200, overflowY: "auto" }}>
            {comments.map((comment) => (
              <ListItem
                key={comment.id}
                secondaryAction={
                  comment.user_id === user?.id ? (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={comment.author?.avatar_url || undefined}
                    sx={{ width: 32, height: 32 }}
                  >
                    {(comment.author?.name ||
                      comment.author?.email)?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={comment.author?.name || comment.author?.email}
                  secondary={
                    <>
                      {comment.content}
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!commentText.trim() || addComment.isPending}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Send
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isSaving}
          color="inherit"
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsDialog;
