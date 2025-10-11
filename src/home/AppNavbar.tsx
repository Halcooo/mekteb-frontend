import { Navbar, Nav, Container, Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import mektebLogo from "../assets/mekteb.png";

function AppNavbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Helper to check if route is active
  const isRouteActive = (path: string) => location.pathname === path;

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container fluid className="px-3">
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <img
            src={mektebLogo}
            alt="Mekteb Logo"
            style={{ width: "32px", height: "32px" }}
            className="me-2"
          />
          <span className="d-none d-sm-inline">{t("mekteb")}</span>
          <span className="d-sm-none">Mekteb</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="mekteb-navbar-nav" className="border-0">
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="mekteb-navbar-nav">
          <Nav className="me-auto">
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
              <span className="d-lg-inline d-xl-inline">{t("attendance")}</span>
            </Nav.Link>
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
              <span className="d-lg-inline d-xl-inline">{t("students")}</span>
            </Nav.Link>
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
              <span className="d-lg-inline d-xl-inline">{t("profile")}</span>
            </Nav.Link>
          </Nav>

          {/* Debug info - shows current route */}
          <Nav className="d-flex align-items-center me-3">
            <small className="text-muted d-none d-lg-block">
              Current: <code>{location.pathname}</code>
            </small>
          </Nav>

          <Nav className="mt-2 mt-lg-0">
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="outline-secondary"
                id="language-dropdown"
                size="sm"
                className="d-flex align-items-center"
              >
                <i className="bi bi-globe me-1"></i>
                <span className="d-none d-md-inline me-1">
                  {t("language", "Lang")}
                </span>
                <span className="badge bg-primary">
                  {i18n.language.toUpperCase()}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow">
                <Dropdown.Item
                  onClick={() => changeLanguage("bs")}
                  className={i18n.language === "bs" ? "active" : ""}
                >
                  <i className="bi bi-flag me-2"></i>
                  {t("languageBosnian")}
                  {i18n.language === "bs" && (
                    <i className="bi bi-check-lg float-end text-success"></i>
                  )}
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => changeLanguage("en")}
                  className={i18n.language === "en" ? "active" : ""}
                >
                  <i className="bi bi-flag me-2"></i>
                  {t("languageEnglish")}
                  {i18n.language === "en" && (
                    <i className="bi bi-check-lg float-end text-success"></i>
                  )}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
