import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import mektebLogo from "../assets/mekteb.png";
import { useAuth } from "../hooks/useAuth";
import LanguageDropdown from "../components/LanguageDropdown";
import "./AppNavbar.scss";

function AppNavbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  // Helper to check if route is active
  const isRouteActive = (path: string) => location.pathname === path;

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container fluid className="px-3">
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <img
            src={mektebLogo}
            alt="Mekteb Logo"
            className="navbar-brand-logo"
          />
          <span className="navbar-brand-text desktop">{t("mekteb")}</span>
          <span className="navbar-brand-text mobile">Mekteb</span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="mekteb-navbar-nav"
          className="navbar-toggler-custom"
        >
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="mekteb-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/"
              className={`fw-500 ${
                isRouteActive("/") ? "active bg-primary text-white rounded" : ""
              }`}
            >
              <i className="bi bi-house me-2"></i>
              <span className="d-lg-inline d-xl-inline">
                {t("home", "Home")}
              </span>
            </Nav.Link>

            {/* Show these links only to authenticated users */}
            {isAuthenticated && (
              <>
                {/* Attendance - only for admins */}
                {user?.role === "admin" && (
                  <Nav.Link
                    as={Link}
                    to="/attendance"
                    className={`fw-500 ${
                      isRouteActive("/attendance")
                        ? "active bg-primary text-white rounded"
                        : ""
                    }`}
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    <span className="d-lg-inline d-xl-inline">
                      {t("attendance")}
                    </span>
                  </Nav.Link>
                )}
                <Nav.Link
                  as={Link}
                  to="/students"
                  className={`fw-500 ${
                    isRouteActive("/students")
                      ? "active bg-primary text-white rounded"
                      : ""
                  }`}
                >
                  <i className="bi bi-people me-2"></i>
                  <span className="d-lg-inline d-xl-inline">
                    {t("students")}
                  </span>
                </Nav.Link>

                {/* Parent Dashboard - only for parents */}
                {user?.role === "parent" && (
                  <Nav.Link
                    as={Link}
                    to="/parent-dashboard"
                    className={`fw-500 ${
                      isRouteActive("/parent-dashboard")
                        ? "active bg-primary text-white rounded"
                        : ""
                    }`}
                  >
                    <i className="fas fa-family me-2"></i>
                    <span className="d-lg-inline d-xl-inline">
                      {t("parentDashboard.title")}
                    </span>
                  </Nav.Link>
                )}
                <Nav.Link
                  as={Link}
                  to="/profile"
                  className={`fw-500 ${
                    isRouteActive("/profile")
                      ? "active bg-primary text-white rounded"
                      : ""
                  }`}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  <span className="d-lg-inline d-xl-inline">
                    {t("profile")}
                  </span>
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="mt-2 mt-lg-0 d-flex align-items-center gap-2">
            {/* Login/Logout Buttons */}
            {!isAuthenticated ? (
              <>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Button variant="outline-primary" size="sm" className="me-2">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    {t("login", "Login")}
                  </Button>
                </Link>
                <Link to="/register" style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="sm">
                    <i className="bi bi-person-plus me-1"></i>
                    {t("register", "Register")}
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                {t("logout", "Logout")}
              </Button>
            )}

    
            <LanguageDropdown />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
