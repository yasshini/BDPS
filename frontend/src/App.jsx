import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "./api/api";
import "./App.css";
import Header from "./components/Header";
import ErrorMessage from "./components/common/ErrorMessage";
import Loading from "./components/common/Loading";
import Notification from "./components/common/Notification";
import Login from "./components/auth/Login";
import { DashboardPage } from "./pages/Dashboard/Dashboard";
import { ProductsPage } from "./pages/Products/Products";
import { CreateBillPage } from "./pages/CreateBill/CreateBill";
import { BillHistoryPage } from "./pages/BillHistory/BillHistory";
import {
  EMPTY_DATA,
  NAVIGATION,
  formatDate,
  toLocalDateInputValue,
} from "./utils/shared";

function App() {
  const [todayLabel] = useState(() => formatDate(new Date()));
  const [todayDateValue] = useState(() =>
    toLocalDateInputValue(new Date()),
  );
  const [darkMode, setDarkMode] = useState(
    () => window.localStorage.getItem("bdps-theme") === "dark",
  );
  const [activePage, setActivePage] = useState("Dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [adminExists, setAdminExists] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [editingBill, setEditingBill] = useState(null);

  const loadData = useCallback(async (
    showLoading = true,
    includeCustomers = false,
    hasAdminAccess = true,
  ) => {
    if (showLoading) {
      setIsLoading(true);
      setLoadError("");
    }

    if (!hasAdminAccess) {
      setData(EMPTY_DATA);
      setIsLoading(false);
      return true;
    }

    try {
      const [summary, invoices, customers, products] = await Promise.all([
        api.getSummary(),
        api.getInvoices(),
        includeCustomers ? api.getCustomers() : Promise.resolve([]),
        api.getProducts(),
      ]);
      setData({ summary, invoices, customers, products });
      return true;
    } catch (error) {
      setLoadError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const status = await api.getAdminStatus();
      setAdminExists(Boolean(status.adminExists));
      let authenticatedUser = null;
      try {
        authenticatedUser = await api.getSession();
        setSessionUser(authenticatedUser);
        setIsAuthenticated(true);
      } catch (error) {
        if (error.status !== 401) {
          setNotice({ type: "error", message: error.message });
        }
        setSessionUser(null);
        setIsAuthenticated(false);
      }
      await loadData(
        true,
        Boolean(authenticatedUser),
        Boolean(authenticatedUser),
      );
    } catch (error) {
      setNotice({ type: "error", message: error.message });
      await loadData(true, false, false);
    } finally {
      setIsAuthReady(true);
    }
  }, [loadData]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return checkSession();
      return undefined;
    });

    return () => {
      active = false;
    };
  }, [checkSession]);

  useEffect(() => {
    window.localStorage.setItem("bdps-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const notify = useCallback((type, message) => {
    setNotice({ type, message });
  }, []);

  async function handleAuthenticated(user) {
    setSessionUser(user);
    setIsAuthenticated(true);
    setAdminExists(true);
    setIsAuthModalOpen(false);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    await loadData(true, true);
  }

  async function handleLogout() {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setSessionUser(null);
      setData(EMPTY_DATA);
      setActivePage("Dashboard");
      setSelectedBill(null);
      setEditingBill(null);
      //setNotice({ type: "success", message: "You are signed out. Admin actions are locked." });
    } catch (error) {
      notify("error", error.message);
    }
  }

  function requestAdminAccess() {
    setIsAuthModalOpen(true);
  }

  function handleAdminClick() {
    if (isAuthenticated) return;

    if (isAuthReady) {
      setIsAuthModalOpen(true);
      return;
    }

    checkSession().then(() => setIsAuthModalOpen(true));
  }

  async function openBill(bill) {
    if (!bill) {
      setSelectedBill(null);
      return;
    }

    setActivePage("Bill history");
    setSelectedBill(null);

    try {
      const details = await api.getInvoiceById(bill.id);
      setSelectedBill(details);
    } catch (error) {
      notify("error", error.message);
    }
  }

  function navigate(page) {
    if (page === "Create bill" && !isAuthenticated) {
      requestAdminAccess();
      setIsMenuOpen(false);
      return;
    }
    setActivePage(page);
    setIsMenuOpen(false);
    setSelectedBill(null);
    setEditingBill(null);
  }

  function beginBillEdit(bill) {
    if (!isAuthenticated) {
      requestAdminAccess();
      return;
    }
    setSelectedBill(null);
    setEditingBill(bill);
    setActivePage("Create bill");
  }

  async function refreshAndNotify(message) {
    const refreshed = await loadData(true, true);
    setNotice({
      type: refreshed ? "success" : "error",
      message: refreshed
        ? message
        : "The change was saved, but the workspace could not refresh. Reload to see the latest data.",
    });
  }

  async function refreshQuietly() {
    const refreshed = await loadData(false, true);
    if (!refreshed) {
      setNotice({
        type: "error",
        message:
          "The change was saved, but the workspace could not refresh. Reload to see the latest data.",
      });
    }
    return refreshed;
  }

  return (
    <div className={`app-shell${darkMode ? " dark" : ""}`}>
      {isMenuOpen && (
        <button
          aria-label="Close navigation menu"
          className="sidebar-backdrop"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      )}
      <aside className={`sidebar${isMenuOpen ? " open" : ""}`}>
        <button
          aria-label="Close navigation menu"
          className="sidebar-close"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        >
          <X size={18} />
        </button>
        <a
          className="brand"
          href="#dashboard"
          onClick={(event) => {
            event.preventDefault();
            navigate("Dashboard");
          }}
          aria-label="BDPS home"
        >
          <img className="brand-logo" src="/pwa-192x192.png" alt="" />
          <span className="brand-name">BIKE DOCTOR PIT STOP</span>
          <span className="brand-caption">SERVICE & ACCESSORIES</span>
        </a>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAVIGATION.map(({ label, icon: Icon }) => (
            <button
              aria-disabled={label === "Create bill" && !isAuthenticated}
              className={`nav-item${activePage === label ? " active" : ""}${label === "Create bill" && !isAuthenticated ? " locked" : ""}`}
              key={label}
              onClick={() => navigate(label)}
              type="button"
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-art" aria-hidden="true">
          <img src="/bike-sidebar.png" alt="" />
        </div>

      </aside>

      <main className="main">
        <Header
          darkMode={darkMode}
          isMenuOpen={isMenuOpen}
          setDarkMode={setDarkMode}
          setIsMenuOpen={setIsMenuOpen}
          isAuthenticated={isAuthenticated}
          onAdminClick={handleAdminClick}
          onLogout={handleLogout}
          username={sessionUser?.username || ""}
          todayLabel={todayLabel}
        />

        <section className="page-content">
          {notice && (
            <Notification notice={notice} onDismiss={() => setNotice(null)} />
          )}

          {loadError ? (
            <ErrorMessage message={loadError} onRetry={loadData} />
          ) : isLoading ? (
            <Loading />
          ) : (
            (() => {
              switch (activePage) {
                case "Create bill":
                  return (
                    <CreateBillPage
                      customers={data.customers}
                      editingBill={editingBill}
                      onCancelEdit={() => {
                        navigate("Bill history");
                        if (editingBill) openBill(editingBill);
                      }}
                      onCreated={async (invoice) => {
                        setEditingBill(null);
                        const refreshed = await loadData(true, true);
                        await openBill(invoice);
                        if (!refreshed) {
                          notify(
                            "error",
                            "Bill saved, but the workspace could not refresh. Reload to see the latest data.",
                          );
                        }
                      }}
                      products={data.products}
                      notify={notify}
                    />
                  );
                case "Bill history":
                  return (
                    <BillHistoryPage
                      invoices={data.invoices}
                      notify={notify}
                      onSelectBill={openBill}
                      onEditInvoice={beginBillEdit}
                      selectedBill={selectedBill}
                      isAdmin={isAuthenticated}
                      onRequireAdmin={requestAdminAccess}
                    />
                  );
                case "Products":
                  return (
                    <ProductsPage
                      onRefresh={refreshAndNotify}
                      onQuietRefresh={refreshQuietly}
                      products={data.products}
                      notify={notify}
                      isAdmin={isAuthenticated}
                      onRequireAdmin={requestAdminAccess}
                    />
                  );
                case "Dashboard":
                default:
                  return (
                    <DashboardPage
                      data={data}
                      navigate={navigate}
                      onSelectBill={openBill}
                      todayDateValue={todayDateValue}
                      isAdmin={isAuthenticated}
                      onRequireAdmin={requestAdminAccess}
                    />
                  );
              }
            })()
          )}
        </section>
        <footer className="site-footer">
          <p>
            © 2026 Bike Doctor Pit Stop <span aria-hidden="true">·</span>{" "}
            Designed &amp; developed by <strong>Yashini</strong>
          </p>
        </footer>
      </main>
      {isAuthModalOpen && isAuthReady && (
        <Login
          adminExists={adminExists}
          onAuthenticated={handleAuthenticated}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
