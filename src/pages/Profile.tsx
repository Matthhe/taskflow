import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useProfile } from "../hooks/useProfile";
import { useNotification } from "../hooks/useNotification";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, isLoading, updateProfile } = useProfile();
  const { notify } = useNotification();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        avatar_url: avatarUrl.trim(),
      });
      notify("Profile updated", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      notify(message, "error");
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconButton onClick={() => navigate("/")}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              My profile
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Avatar
              src={avatarUrl || undefined}
              sx={{ width: 80, height: 80, fontSize: "2rem" }}
            >
              {(name || profile?.email)?.[0]?.toUpperCase()}
            </Avatar>
          </Box>

          <TextField
            label="Email"
            fullWidth
            value={profile?.email || ""}
            disabled
          />

          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="Avatar URL"
            fullWidth
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={updateProfile.isPending}
            sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
          >
            {updateProfile.isPending ? "Saving..." : "Save"}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;
