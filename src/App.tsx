import "./App.scss";
import AppNavbar from "./home/AppNavbar";
import AppRoutes from "./AppRoutes";
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  const hideNavbar = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="app">
      {!hideNavbar && <AppNavbar />}
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
