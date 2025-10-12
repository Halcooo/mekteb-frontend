import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "react-bootstrap";
import "./RouteComponents.scss";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = "/",
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="route-container">
        <Spinner animation="border" role="status" className="loading-spinner">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // If authenticated, redirect to dashboard or the page they came from
  if (isAuthenticated) {
    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname ||
      redirectTo;
    return <Navigate to={from} replace />;
  }

  // User is not authenticated, show the public page (login/register)
  return <>{children}</>;
};

export default PublicRoute;
