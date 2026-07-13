import { AuthProvider } from "./providers/AuthProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Board from "./pages/Board";
import ProtectedRoute from "./components/ProtectedRoute";
import BoardsList from "./pages/Boardslist";
import { NotificationProvider } from "./providers/NotificationProvider";
import Profile from "./pages/Profile";
import { ThemeProviderWrapper } from "./providers/ThemeProviderWrapper";

function App() {
  return (
    <ThemeProviderWrapper>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <BoardsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:boardId"
                element={
                  <ProtectedRoute>
                    <Board />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProviderWrapper>
  );
}

export default App;
