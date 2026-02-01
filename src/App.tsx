import "./App.scss";
import AppNavbar from "./home/AppNavbar";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <div className="app">
      <AppNavbar />
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
