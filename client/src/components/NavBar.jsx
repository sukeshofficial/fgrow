import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import logo from "/ForgeGrid.svg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const escHandler = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, []);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Team", to: "/team" },
    { label: "Services", to: "/services" },
    { label: "Product", to: "/product" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      <header className="glass-navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <img src={logo} alt="ForgeGrid" className="logo-img" />
            <span className="logo-text">ForgeGrid</span>
          </div>

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
            <div className="user-area desktop-only"></div>
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
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

      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
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

          </div>

        </div>
      )}
    </>
  );
}
