import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Box,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useBoardMembers } from "../../hooks/useBoardMembers";
import { useNotification } from "../../hooks/useNotification";

interface MembersDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string | undefined;
  isOwner: boolean;
}

const MembersDialog: React.FC<MembersDialogProps> = ({
  open,
  onClose,
  boardId,
  isOwner,
}) => {
  const { members, inviteMember, removeMember } = useBoardMembers(boardId);
  const { notify } = useNotification();
  const [email, setEmail] = useState("");

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      await inviteMember.mutateAsync(email.trim());
      notify("Member added successfully", "success");
      setEmail("");
    } catch (err) {
      console.error("Failed to invite member:", err);
      const message =
        err instanceof Error ? err.message : "Failed to invite member";
      notify(message, "error");
    }
  };

  const handleRemove = (userId: string) => {
    if (confirm("Remove this member from the board?")) {
      removeMember.mutate(userId, {
        onError: (err) => {
          console.error("Failed to remove member:", err);
          const message =
            err instanceof Error ? err.message : "Failed to remove member";
          notify(message, "error");
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Board members</DialogTitle>

      <DialogContent>
        {isOwner && (
          <Box sx={{ display: "flex", gap: 1, mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Invite by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteMember.isPending}
            />
            <Button
              variant="contained"
              onClick={handleInvite}
              disabled={inviteMember.isPending || !email.trim()}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Invite
            </Button>
          </Box>
        )}

        <Divider sx={{ mb: 1 }} />

        <List>
          {members.map((member) => (
            <ListItem
              key={member.id}
              secondaryAction={
                isOwner && member.role !== "owner" ? (
                  <IconButton
                    edge="end"
                    onClick={() => handleRemove(member.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                ) : null
              }
            >
              <ListItemAvatar>
                <Avatar>
                  {(member.name || member.email)?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={member.name || member.email}
                secondary={member.email}
              />
              <Chip
                label={member.role}
                size="small"
                color={member.role === "owner" ? "primary" : "default"}
                sx={{ mr: isOwner && member.role !== "owner" ? 5 : 0 }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MembersDialog;
