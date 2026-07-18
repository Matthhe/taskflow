import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              An unexpected error occurred. Try reloading the page.
            </Typography>
            <Button variant="contained" onClick={this.handleReload}>
              Back to boards
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
