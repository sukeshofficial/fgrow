import React from "react";
import { useNavigate } from "react-router-dom";
import { FiZap, FiWifiOff, FiLock, FiAlertTriangle } from "react-icons/fi";

/**
 * ErrorPage
 *
 * A premium, user-friendly error page that analyzes the "fault"
 * (Client, Server, or Network) and provides clear action steps.
 */
const ErrorPage = ({
  type = "default",
  message = "An unexpected error occurred. Our team has been notified.",
  errorId = null,
  onRetry = null
}) => {
  const navigate = useNavigate();

  const getErrorDetails = () => {
    switch (type) {
      case "server":
        return {
          title: "Server Is Having a Moment",
          subtitle: "It's not you, it's us.",
          description: "Our server encountered an internal problem. We're currently working on a fix.",
          icon: <FiZap size={36} />,
          color: "#EF4444"
        };
      case "network":
        return {
          title: "Connection Lost",
          subtitle: "We can't reach the server.",
          description: "Please check your internet connection or firewall settings. The request timed out.",
          icon: <FiWifiOff size={36} />,
          color: "#F59E0B"
        };
      case "auth":
        return {
          title: "Session Expired",
          subtitle: "Please log in again.",
          description: "Your security token has expired or is invalid. Redirecting to login...",
          icon: <FiLock size={36} />,
          color: "#3B82F6"
        };
      default:
        return {
          title: "Something Went Wrong",
          subtitle: "Unexpected error detected.",
          description: message,
          icon: <FiAlertTriangle size={36} />,
          color: "#6B7280"
        };
    }
  };

  const details = getErrorDetails();

  return (
    <div className="error-page-container">
      <div className="error-card shadow-premium">
        <div className="error-icon-wrapper" style={{ backgroundColor: `${details.color}20`, color: details.color }}>
          <span className="error-icon">{details.icon}</span>
        </div>

        <h1 className="error-title">{details.title}</h1>
        <p className="error-subtitle text-muted">{details.subtitle}</p>

        <div className="error-divider"></div>

        <p className="error-description">
          {details.description}
        </p>

        {errorId && (
          <div className="error-id-badge">
            Error ID: <code>{errorId}</code>
          </div>
        )}

        <div className="error-actions">
          {onRetry ? (
            <button className="btn btn-primary" onClick={onRetry}>
              Try Again
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate(0)}>
              Refresh Page
            </button>
          )}

          <button className="btn btn-ghost" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        <div className="error-footer">
          <p>If the problem persists, contact <a href="mailto:feedback@forgegrid.in">feedback@forgegrid.in</a></p>
        </div>
      </div>

      <style role="stylesheet">{`
        .error-page-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .error-card {
          background: white;
          border-radius: 1.5rem;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .shadow-premium {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 
                      0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }

        .error-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 2rem;
        }

        .error-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .error-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin-bottom: 2rem;
        }

        .error-divider {
          height: 1px;
          background: #f1f5f9;
          margin-bottom: 1.5rem;
        }

        .error-description {
          color: #475569;
          line-height: 1.6;
          margin-bottom: 2rem;
          font-size: 0.9375rem;
        }

        .error-id-badge {
          background: #f1f5f9;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          color: #64748b;
          display: inline-block;
          margin-bottom: 2rem;
        }

        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid transparent;
          font-size: 0.9375rem;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-ghost {
          background: transparent;
          color: #64748b;
          border-color: #e2e8f0;
        }

        .btn-ghost:hover {
          background: #f8fafc;
          color: #1e293b;
          border-color: #cbd5e1;
        }

        .error-footer {
          margin-top: 2rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .error-footer a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ErrorPage;
