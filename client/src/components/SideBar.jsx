import React, { useState, useEffect } from "react";
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

/* -------------------------------------------------------------------------- */
/*                                  SIDEBAR                                   */
/* -------------------------------------------------------------------------- */

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const { user, avatar, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  /* ----------------------------- Menu Helpers ------------------------------ */

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

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
  const bottomItems = MENU.filter((item) => item.isBottom);

  /* -------------------------------------------------------------------------- */

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-inner">
        {/* ------------------------------------------------------------------ */}
        {/* Logo / Brand */}
        {/* ------------------------------------------------------------------ */}

        <div className="navbar-logo">
          <img src={logo} alt="ForgeGrid" className="logo-img" />
          <span
            className={`logo-text ${collapsed ? "collapsed" : ""} user-info`}
          >
            <span className="fg">FG</span>row
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Navigation */}
        {/* ------------------------------------------------------------------ */}

        <nav className="menu" role="menu">
          {/* ------------------------------ TOP ITEMS ------------------------------ */}

          {topItems.map((item) => {
            const isActive =
              item.path === currentPath ||
              (item.path !== "/" && currentPath.startsWith(item.path));

            const isOpen = openMenus[item.label];

            /* ------------------------ Dropdown Menu Item ------------------------ */

            if (item.subItems) {
              return (
                <div key={item.label} className="menu-group">
                  <div
                    className={`menu-item has-children ${
                      isActive ? "active" : ""
                    }`}
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
                            className={`submenu-item ${
                              isSubActive ? "active" : ""
                            }`}
                          >
                            <span className="submenu-label">
                              {subItem.label}
                            </span>

                            {subItem.right && (
                              <span className="menu-right">
                                {subItem.right}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* -------------------------- Normal Menu Item -------------------------- */

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`menu-item ${isActive ? "active" : ""}`}
                role="menuitem"
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>

                {item.right && <span className="menu-right">{item.right}</span>}
              </Link>
            );
          })}

          {/* ------------------------------ Divider ------------------------------ */}

          <div className="divider" />

          {/* ---------------------------- Bottom Items ---------------------------- */}

          {bottomItems.map((item) => {
            const isActive = item.path === currentPath;

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`menu-item ${isActive ? "active" : ""}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>

                {item.externalIcon && (
                  <span className="menu-right external-arrow">↗</span>
                )}
              </Link>
            );
          })}

          {/* ----------------------------- User Section ----------------------------- */}

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
  );
}
