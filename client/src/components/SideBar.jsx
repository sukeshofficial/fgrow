import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaTasks,
  FaClipboardList,
  FaUserTie,
  FaBoxes,
  FaFileAlt,
  FaChartBar,
  FaUsers,
  FaPaperPlane,
  FaCog,
  FaRupeeSign,
  FaChevronRight,
  FaChevronDown,
  FaPlus,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

import { useAuth } from "../hooks/useAuth.js";
import logo from "/FGrow.png";

/* -------------------------------------------------------------------------- */
/*                                   MENU                                     */
/* -------------------------------------------------------------------------- */

const MENU = [
  { label: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },

  {
    label: "Tasks",
    path: "/tasks",
    icon: <FaTasks />,
    right: <FaPlus />,
  },

  { label: "To-Do", path: "/todo", icon: <FaClipboardList /> },

  {
    label: "Clients",
    path: "/clients",
    icon: <FaUserTie />,
    right: <FaPlus />,
  },

  { label: "Services", path: "/services", icon: <FaBoxes /> },

  {
    label: "Finance",
    path: "/finance",
    icon: <FaRupeeSign />,
    right: <FaChevronRight />,
    subItems: [
      { label: "Invoices", path: "/finance/invoices", right: <FaPlus /> },
      { label: "Receipts", path: "/finance/receipts", right: <FaPlus /> },
      { label: "Quotations", path: "/finance/quotations", right: <FaPlus /> },
      { label: "Expenses", path: "/finance/expenses", right: <FaPlus /> },
      {
        label: "Credit Notes",
        path: "/finance/credit-notes",
        right: <FaPlus />,
      },
    ],
  },

  {
    label: "Documents & DSC",
    path: "/documents",
    icon: <FaFileAlt />,
    right: <FaChevronRight />,
  },

  {
    label: "Reports",
    path: "/reports",
    icon: <FaChartBar />,
    right: <FaChevronRight />,
  },

  { label: "Users", path: "/users", icon: <FaUsers /> },

  {
    label: "Send Notifications",
    path: "/notifications",
    icon: <FaPaperPlane />,
  },

  {
    label: "Settings",
    path: "/settings",
    icon: <FaCog />,
    isBottom: true,
  },
];

const ADMIN_MENU = [
  { label: "Admin Dashboard", path: "/admin/dashboard", icon: <FaTachometerAlt />, isBottom: true },
];

/* -------------------------------------------------------------------------- */
/*                              FLYOUT PANEL                                  */
/* -------------------------------------------------------------------------- */

function FlyoutPanel({ item, top, onClose }) {
  const location = useLocation();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    // defer so the click that opened it doesn't immediately close it
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="sidebar-flyout"
      style={{ top: Math.max(8, top) }}
    >
      <p className="sidebar-flyout-title">{item.label}</p>
      {item.subItems.map((sub) => {
        const isActive = location.pathname === sub.path;
        return (
          <Link
            key={sub.path}
            to={sub.path}
            className={`sidebar-flyout-item ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <span>{sub.label}</span>
            {sub.right && <span className="sidebar-flyout-right">{sub.right}</span>}
          </Link>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  SIDEBAR                                   */
/* -------------------------------------------------------------------------- */

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const { user, avatar, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  // flyout: { item, top } | null
  const [flyout, setFlyout] = useState(null);

  /* ----------------------------- Menu Helpers ------------------------------ */

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleCollapsedItemClick = useCallback((e, item) => {
    if (!item.subItems) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout((prev) =>
      prev?.item.label === item.label ? null : { item, top: rect.top }
    );
  }, []);

  const closeFlyout = useCallback(() => setFlyout(null), []);

  // Close flyout on route change
  useEffect(() => {
    setFlyout(null);
  }, [location.pathname]);

  /* ----------------------------- Responsive UI ----------------------------- */

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth <= 992);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ----------------------------- Menu Sections ----------------------------- */

  const topItems = MENU.filter((item) => !item.isBottom);
  const bottomItems = [
    ...MENU.filter((item) => item.isBottom),
    ...(user?.platform_role === "super_admin" ? ADMIN_MENU : []),
  ];

  /* -------------------------------------------------------------------------- */

  const renderItem = (item) => {
    const isActive =
      item.path === currentPath ||
      (item.path !== "/" && currentPath.startsWith(item.path));
    const isOpen = openMenus[item.label];
    const isFlyoutOpen = flyout?.item.label === item.label;

    /* ── When COLLAPSED and item has subItems → flyout trigger ── */
    if (collapsed && item.subItems) {
      return (
        <div key={item.label} className="menu-group">
          <div
            className={`menu-item has-children ${isActive ? "active" : ""} ${isFlyoutOpen ? "flyout-open" : ""}`}
            onClick={(e) => handleCollapsedItemClick(e, item)}
            role="menuitem"
            aria-label={item.label}
          >
            <span className="menu-icon">{item.icon}</span>
          </div>
        </div>
      );
    }

    /* ── Normal expanded submenu ── */
    if (item.subItems) {
      return (
        <div key={item.label} className="menu-group">
          <div
            className={`menu-item has-children ${isActive ? "active" : ""}`}
            onClick={() => toggleMenu(item.label)}
            role="menuitem"
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>

            <span className="menu-right">
              {isOpen ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          </div>

          {isOpen && (
            <div className="submenu">
              {item.subItems.map((subItem) => {
                const isSubActive = currentPath === subItem.path;

                return (
                  <Link
                    key={subItem.label}
                    to={subItem.path}
                    className={`submenu-item ${isSubActive ? "active" : ""}`}
                  >
                    <span className="submenu-label">{subItem.label}</span>

                    {subItem.right && (
                      <span className="menu-right">{subItem.right}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    /* ── Normal link item ── */
    return (
      <Link
        key={item.label}
        to={item.path}
        className={`menu-item ${isActive ? "active" : ""}`}
        role="menuitem"
        aria-label={item.label}
      >
        <span className="menu-icon">{item.icon}</span>
        <span className="menu-label">{item.label}</span>

        {item.right && !collapsed && (
          <span className="menu-right">{item.right}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-inner">
          {/* Logo / Brand */}
          <div className="navbar-logo">
            <img src={logo} alt="ForgeGrid" className="logo-img" />
            <span className={`logo-text ${collapsed ? "collapsed" : ""} user-info`}>
              <span className="fg">FG</span>row
            </span>
          </div>

          {/* Navigation */}
          <nav className="menu" role="menu">
            {topItems.map(renderItem)}

            <div className="divider" />

            {bottomItems.map((item) => {
              const isActive = item.path === currentPath;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`menu-item ${isActive ? "active" : ""}`}
                  aria-label={item.label}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                  {item.externalIcon && (
                    <span className="menu-right external-arrow">↗</span>
                  )}
                </Link>
              );
            })}

            {/* User Section */}
            <div className="user-area">
              <div className="user-left">
                <img src={avatar} alt="User avatar" className="user-avatar" />
                <span className="user-name">{user?.name ?? "Guest"}</span>
              </div>
            </div>

            {user && (
              <button
                type="button"
                className="logout-btn"
                onClick={logout}
                aria-label="Logout"
              >
                <FiLogOut className="logout-icon" />
                <span className="logout-text">Logout</span>
              </button>
            )}
          </nav>
        </div>
      </aside>

      {/* Flyout rendered outside sidebar so it can overflow */}
      {flyout && collapsed && (
        <FlyoutPanel
          item={flyout.item}
          top={flyout.top}
          onClose={closeFlyout}
        />
      )}
    </>
  );
}
