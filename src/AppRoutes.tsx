import { Route, Routes } from "react-router-dom";
import Home from "./home/Home";
import LoginJWT from "./components/LoginJWT";
import RegisterJWT from "./components/RegisterJWT";
import Students from "./students/Students";
import Attendance from "./attendance/Attendance";
import ParentDashboard from "./parent/ParentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - available to all users */}
      <Route path="/" element={<Home />} />

      {/* Protected Routes - require authentication */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute requiredRole="admin">
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
      <Route
        path="/parent-dashboard"
        element={
          <ProtectedRoute requiredRole="parent">
            <ParentDashboard />
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
