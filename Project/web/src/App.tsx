import { Routes, Route, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import TorrentsPage from "./pages/TorrentsPage";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <Routes>
      {/* Landing Page - sem layout */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Dashboard - com layout (sidebar e topbar) */}
      <Route path="/dashboard" element={<Layout><Outlet /></Layout>}>
        <Route index element={<Dashboard />} />
        <Route path="torrents" element={<TorrentsPage />} />
        <Route path="content" element={<Dashboard />} />
        <Route path="settings" element={<Dashboard />} />
      </Route>
      
      {/* Rotas antigas para compatibilidade - redirecionam para dashboard */}
      <Route path="/torrents" element={<Layout><TorrentsPage /></Layout>} />
      <Route path="/content" element={<Layout><Dashboard /></Layout>} />
      <Route path="/settings" element={<Layout><Dashboard /></Layout>} />
    </Routes>
  );
}

export default App;
