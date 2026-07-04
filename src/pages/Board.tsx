import { Container, Typography, Box } from "@mui/material";

const Board = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "600" }}
        >
          Some info to check
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here too
        </Typography>
      </Box>
    </Container>
  );
};

export default Board;
