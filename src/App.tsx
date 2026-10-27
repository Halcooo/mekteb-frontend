import "./App.scss";
import AppNavbar from "./home/AppNavbar";
import AppRoutes from "./AppRoutes";
import PushLifecycle from './notifications/PushLifecycle';
import { useTranslation } from 'react-i18next';

function App() {
  const {t}=useTranslation();
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
      <PushLifecycle />
      <AppNavbar />
      <main className="main-content" id="main-content" tabIndex={-1}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
