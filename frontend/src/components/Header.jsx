import {
  CalendarDays,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";

function Header({
  darkMode,
  isMenuOpen,
  setDarkMode,
  setIsMenuOpen,
  isAuthenticated,
  onAdminClick,
  onLogout,
  todayLabel,
  username,
}) {
  const avatar = username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <header className="topbar">
      <button
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        className="menu-toggle"
        onClick={() => setIsMenuOpen((current) => !current)}
        type="button"
      >
        {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <div className="topbar-brand">
        <img src="/bdps-logo.png" alt="" />
        <strong>Bike Doctor Pit Stop</strong>
      </div>
      <div className="topbar-meta">
        <div className="today-chip">
          <CalendarDays size={17} />
          <span>{todayLabel}</span>
        </div>
        <button
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="theme-toggle"
          onClick={() => setDarkMode((current) => !current)}
          title={darkMode ? "Light mode" : "Dark mode"}
          type="button"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          aria-label={isAuthenticated ? `Admin account: ${username}` : "Admin login"}
          className="profile-avatar admin-account-button"
          onClick={onAdminClick}
          title={isAuthenticated ? username : "Admin login"}
          type="button"
        >
          {isAuthenticated ? avatar : <UserRound size={17} />}
        </button>
        {isAuthenticated && (
          <button
            aria-label="Sign out"
            className="logout-button"
            onClick={onLogout}
            title="Sign out"
            type="button"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
