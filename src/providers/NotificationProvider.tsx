import React, { createContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";
import { type AlertColor } from "@mui/material";

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface NotificationContextType {
  notify: (message: string, severity?: AlertColor) => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notificationState, setNotificationState] = useState<NotificationState>(
    { open: false, message: "", severity: "info" },
  );
  const notify = useCallback(
    (message: string, severity: AlertColor = "info") => {
      setNotificationState({ open: true, message, severity });
    },
    [],
  );

  const handleClose = () => {
    setNotificationState((prev) => ({ ...prev, open: false }));
  };
  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar
        open={notificationState.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={notificationState.severity}
          sx={{ width: "100%" }}
        >
          {notificationState.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
