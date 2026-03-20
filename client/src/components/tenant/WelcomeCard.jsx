import React from "react";
import { FiPlusCircle, FiUserPlus } from "react-icons/fi";
import "../../styles/welcome.css";
import illustration from "../../assets/fgrow-illustration.png"

export const WelcomeCard = ({ onCreateTenant, onJoinAsStaff }) => {
  return (
    <div className="welcome-container">
      {/* Brand Section */}
      <div className="welcome-brand">
        <img src="/FGrow.png" alt="FGrow Logo" className="welcome-brand-logo" />
        <span className="welcome-brand-text">FGrow</span>
      </div>

      {/* Decorative Flow Lines - Right */}
      <svg className="welcome-flow-svg welcome-flow-svg-right" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flow-gradient-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M20 20 C 150 20, 220 120, 220 280" stroke="url(#flow-gradient-right)" strokeWidth="3" strokeLinecap="round" className="flow-line" />
        <path d="M60 40 C 180 40, 250 150, 250 290" stroke="url(#flow-gradient-right)" strokeWidth="2" strokeLinecap="round" className="flow-line flow-line-delayed" />
      </svg>

      {/* Decorative Flow Lines - Left */}
      <svg className="welcome-flow-svg welcome-flow-svg-left" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flow-gradient-left" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M20 20 C 150 20, 220 120, 220 280" stroke="url(#flow-gradient-left)" strokeWidth="3" strokeLinecap="round" className="flow-line" />
        <path d="M60 40 C 180 40, 250 150, 250 290" stroke="url(#flow-gradient-left)" strokeWidth="2" strokeLinecap="round" className="flow-line flow-line-delayed" />
      </svg>

      {/* Hero Section */}
      <div className="welcome-hero">
        <h1 className="welcome-headline">Grow your business operations effortlessly</h1>
        <p className="welcome-subtext">
          Manage tenants, staff, and workflows in one place with our modern CRM
          designed for scale.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="welcome-content-grid">
        {/* Left Side: Visual Illustration */}
        <div className="welcome-illustration-container">
          <img src={illustration} alt="FGrow Illustration" className="welcome-illustration" />
        </div>

        {/* Right Side: Interactive Action Cards */}
        <div className="welcome-actions-grid">
          <div className="action-card" onClick={onCreateTenant}>
            <div className="action-card-icon">
              <FiPlusCircle />
            </div>
            <div className="action-card-content">
              <span className="action-card-title">Create Tenant</span>
              <span className="action-card-description">
                Start a new workspace and manage your organization
              </span>
            </div>
          </div>

          <div className="action-card" onClick={onJoinAsStaff}>
            <div className="action-card-icon">
              <FiUserPlus />
            </div>
            <div className="action-card-content">
              <span className="action-card-title">Join as Staff</span>
              <span className="action-card-description">
                Get access to an existing workspace via invite
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
