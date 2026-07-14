import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const Login = () => {
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithPassword(email, password);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            borderRadius: 2,
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            align="center"
            sx={{ fontWeight: 600 }}
          >
            Sign in to TaskFlow
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 1, textTransform: "none", fontWeight: "600" }}
            >
              {isSubmitting ? "Entering..." : "Enter"}
            </Button>

            <Divider sx={{ my: 1 }}>or</Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              sx={{ textTransform: "none" }}
            >
              Continue with Google
            </Button>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                underline="hover"
              >
                Don't have an account? Sign up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
