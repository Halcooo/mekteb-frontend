import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

function LanguageDropdown() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="outline-secondary"
        id="language-dropdown"
        size="sm"
        className="d-flex align-items-center"
      >
        <i className="bi bi-globe me-1"></i>
        <span className="d-none d-md-inline me-1">{t("language", "Lang")}</span>
        <span className="badge bg-primary">{i18n.language.toUpperCase()}</span>
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
  );
}

export default LanguageDropdown;
