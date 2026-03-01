import React from "react";
import { useState, useEffect } from "react";
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
  FaGlobe,
  FaRupeeSign,
  FaChevronRight,
  FaPlus,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

import { useAuth } from "../hooks/useAuth.js";

import logo from "/ForgeGrid.svg";

const MENU = [
  { label: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
  {
    label: "Tasks",
    path: "/tasks",
    icon: <FaTasks />,
    right: <FaPlus />, // small plus on right (like your screenshot)
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

  // divider here in markup will separate below items
  { label: "Settings", path: "/settings", icon: <FaCog />, isBottom: true },
];

export default function Sidebar() {
  const location = useLocation();
  const current = location.pathname;

  const topItems = MENU.filter((m) => !m.isBottom);
  const bottomItems = MENU.filter((m) => m.isBottom);

  const { user, avatar, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 992) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-inner">
        {/* Logo / Brand */}
        <div className="navbar-logo">
          <img src={logo} alt="ForgeGrid" className="logo-img" />
          <span
            className={`logo-text ${collapsed ? "collapsed" : ""} user-info`}
          >
            ForgeGrid
          </span>
        </div>

        {/* Menu list */}
        <nav className="menu" role="menu">
          {topItems.map((item) => {
            const isActive =
              item.path === current ||
              (item.path !== "/" && current.startsWith(item.path));
            return (
              <Link
                to={item.external ? { pathname: item.path } : item.path}
                key={item.label}
                className={`menu-item ${isActive ? "active" : ""}`}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                role="menuitem"
              >
                <span className="menu-icon" aria-hidden>
                  {item.icon}
                </span>

                <span className="menu-label">{item.label}</span>

                {item.label === "Retainers" && (
                  <span className="badge">New</span> // optional example if you have Retainers
                )}

                {/* right small thing (plus, chevron, etc) */}
                {item.right && <span className="menu-right">{item.right}</span>}
              </Link>
            );
          })}

          <div className="divider" />

          {bottomItems.map((item) => {
            const isActive = item.path === current;
            return (
              <Link
                to={item.path}
                key={item.label}
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
          <div className={`user-area`}>
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
