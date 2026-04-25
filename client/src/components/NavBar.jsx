import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { useLogoutWithFeedback } from "../hooks/useLogoutWithFeedback.js";

import "../styles/navbar.css";
import logo from "/ForgeGrid.svg";

/**
 * Navbar
 *
 * Global navigation bar with responsive desktop/mobile layouts,
 * user menu handling, and authentication-aware actions.
 */
export default function Navbar() {
  /**
   * Mobile menu state
   */
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, avatar } = useAuth();
  const logout = useLogoutWithFeedback();

  /**
   * Close mobile menu on ESC key
   */
  useEffect(() => {
    const escHandler = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, []);

  /**
   * Navigation links
   */
  const navItems = [
    { label: "Home", to: "/" },
    { label: "Recordings", to: "/recordings" },
    { label: "Rooms", to: "/rooms" },
    { label: "Settings", to: "/settings" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      <header className="glass-navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <div className="navbar-logo">
            <img
              src={logo}
              alt="ForgeGrid"
              className="logo-img"
            />
            <span className="logo-text">ForgeGrid</span>
          </div>

          {/* Desktop navigation */}
          <nav className="navbar-links">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="nav-link custom-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-right">
            {/* Desktop user area */}
            <div className="user-area desktop-only">
              <img
                src={avatar}
                alt="User avatar"
                className="user-avatar"
              />
              <span className="user-name">
                {user?.name ?? "Guest"}
              </span>

              {user && (
                <button
                  type="button"
                  className="logout-btn"
                  onClick={logout}
                >
                  Logout
                </button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Background overlay */}
      {menuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
        >
          <div className="mobile-links">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="mobile-link custom-link"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mobile-divider" />

          <div className="mobile-user">
            <img
              src={avatar}
              alt="User avatar"
              className="user-avatar"
            />

            <div className="mobile-user-info">
              <div className="mobile-user-name">
                {user?.name ?? "Guest"}
              </div>

              {user ? (
                <button
                  type="button"
                  className="mobile-logout"
                  onClick={logout}
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="mobile-login"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
