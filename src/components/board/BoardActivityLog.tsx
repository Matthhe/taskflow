import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useActivityLog } from "../../hooks/useActivityLog";

interface BoardActivityLogProps {
  boardId: string | undefined;
}

export function BoardActivityLog({ boardId }: BoardActivityLogProps) {
  const { activity, isLoading } = useActivityLog(boardId);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Card
      sx={{
        width: 320,
        maxHeight: 450,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          Activity history
        </Typography>
      </CardContent>
      <Divider />
      <Box sx={{ overflowY: "auto", flexGrow: 1, p: 1 }}>
        {activity.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: "center" }}
          >
            There haven't been any actions on this board yet.
          </Typography>
        ) : (
          <List disablePadding>
            {activity.map((log) => (
              <React.Fragment key={log.id}>
                <ListItem alignItems="flex-start" sx={{ px: 1, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        component="span"
                        color="text.primary"
                      >
                        <strong>
                          {log.author?.name || log.author?.email || "Someone"}
                        </strong>{" "}
                        {log.action}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
}
