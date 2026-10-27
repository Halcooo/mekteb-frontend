import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

function LanguageDropdown() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || 'bs';

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
        aria-label={t('language')}
      >
        <i className="bi bi-globe me-1"></i>
        <span className="badge bg-primary">{language.toUpperCase()}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="shadow">
        <Dropdown.Item
          onClick={() => changeLanguage("bs")}
          active={language === 'bs'}
          lang="bs"
        >
          <i className="bi bi-flag me-2"></i>
          {t("languageBosnian")}
          {language === "bs" && (
            <i className="bi bi-check-lg float-end text-success"></i>
          )}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => changeLanguage("en")}
          active={language === 'en'}
          lang="en"
        >
          <i className="bi bi-flag me-2"></i>
          {t("languageEnglish")}
          {language === "en" && (
            <i className="bi bi-check-lg float-end text-success"></i>
          )}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default LanguageDropdown;
