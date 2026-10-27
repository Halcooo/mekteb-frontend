import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import bs from './locales/bs.json';
import en from './locales/en.json';

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: { bs: { translation:bs }, en: { translation:en } },
  supportedLngs:['bs','en'],
  load:'languageOnly',
  fallbackLng:'bs',
  detection:{order:['localStorage','navigator'],caches:['localStorage']},
  interpolation:{escapeValue:false},
});

const updateDocumentLanguage = () => {
  document.documentElement.lang = i18n.resolvedLanguage || 'bs';
};
i18n.on('languageChanged',updateDocumentLanguage);
updateDocumentLanguage();
export default i18n;
