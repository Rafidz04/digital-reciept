import { lazy, Suspense, useEffect, useState } from "react";
import {
  BarChart3,
  Menu as MenuIcon,
  ReceiptText,
  Settings2,
} from "lucide-react";
import CashierPage from "./pages/CashierPage";
import MenuAdminPage from "./pages/MenuAdminPage";
import { api } from "./services/api";
import "./styles.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const nav = [
  { id: "cashier", label: "Kasir", icon: ReceiptText },
  { id: "menus", label: "Menu", icon: Settings2 },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
];

export default function App() {
  const [page, setPage] = useState("cashier");
  const [apiOnline, setApiOnline] = useState(null);
  const brand = import.meta.env.VITE_BRAND_NAME || "U-MaMi";
  const subtitle = import.meta.env.VITE_BRAND_SUBTITLE || "Kasir digital restoran";

  useEffect(() => {
    let active = true;
    const checkApi = async () => {
      try {
        await api.get("/health", { timeout: 4000 });
        if (active) setApiOnline(true);
      } catch {
        if (active) setApiOnline(false);
      }
    };
    checkApi();
    const timer = setInterval(checkApi, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-logo-frame"><img src="/logo.png" alt="Logo U-MaMi" /></span>
          <div>
            <strong>{brand}</strong>
            <span>{subtitle}</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className={`online-dot ${apiOnline === false ? "offline" : apiOnline === null ? "checking" : ""}`}></span>
          <span>{apiOnline === false ? "Server terputus" : apiOnline === null ? "Mengecek server" : "Siap melayani"}</span>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-title">
            <MenuIcon size={17} />
            <span>Navigasi</span>
          </div>
          {nav.map((n) => {
            const I = n.icon;
            return (
              <button
                key={n.id}
                className={page === n.id ? "active" : ""}
                onClick={() => setPage(n.id)}
              >
                <I size={19} />
                <span>{n.label}</span>
              </button>
            );
          })}
        </aside>
        <main className="main-content">
          {page === "cashier" && <CashierPage />}
          {page === "menus" && <MenuAdminPage />}
          {page === "dashboard" && <Suspense fallback={<div className="empty-state">Memuat dashboard...</div>}><DashboardPage /></Suspense>}
        </main>
      </div>
      <nav className="mobile-nav">
        {nav.map((n) => {
          const I = n.icon;
          return (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => setPage(n.id)}
            >
              <I size={20} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
