import { Route, Routes } from "react-router-dom";
import Home from "./home/Home";
import LoginJWT from "./components/LoginJWT";
import RegisterJWT from "./components/RegisterJWT";
import Students from "./students/Students";
import Attendance from "./attendance/Attendance";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Protected Routes - require authentication */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <h1>Profile Page</h1>
          </ProtectedRoute>
        }
      />

      {/* Public Routes - redirect to home if authenticated */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginJWT />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterJWT />
          </PublicRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
