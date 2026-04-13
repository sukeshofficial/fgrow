// src/components/auth/LoginForm.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";


import { useAuth } from "../../hooks/useAuth.js";
import { verifyOtp, login } from "../../features/auth/auth.actions.js";
import { userPreview } from "../../api/auth.api.js";
import { SET_PROFILE_PREVIEW } from "../../features/auth/auth.types.js";
import ForgotPassword from "./ForgotPassword.jsx";
import logger from "../../utils/logger.js";

import "../../styles/login-form.css";

/**
 * LoginForm
 *
 * Handles user authentication, email-based profile preview,
 * and login submission flow.
 */
const LoginForm = ({ onSuccess }) => {
  // -----------------------------
  // Auth context
  // -----------------------------
  const { dispatch, isLoading } = useAuth();

  // -----------------------------
  // State
  // -----------------------------
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [view, setView] = useState("login"); // "login" or "forgot"

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset preview + errors when email changes
    if (name === "email") {
      setError(null);
      setAvatar(null);
    }
  };

  // -----------------------------
  // Effects
  // -----------------------------
  /**
   * Debounced email-based profile preview
   */
  useEffect(() => {
    if (!form.email || !form.email.includes("@")) {
      setAvatar(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await userPreview(form.email);

        if (res.data.found) {
          dispatch({
            type: SET_PROFILE_PREVIEW,
            payload: {
              avatar: res.data.preview.avatar,
              username: res.data.preview.username,
            },
          });

          setAvatar(res.data.preview.avatar);
        } else {
          setAvatar(null);
        }
      } catch (err) {
        logger.error("LoginForm", "Preview failed", err);
        setAvatar(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.email, dispatch]);

  /**
   * Form submit handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(dispatch, form);
      onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid email or password";

      setError(message);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (view === "forgot") {
    return <ForgotPassword onBack={() => setView("login")} />;
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-title">Login</h2>

      {/* Avatar Preview */}
      <div className="login-avatar-wrapper">
        {avatar ? (
          <img
            src={avatar}
            alt="User avatar"
            className="email-avatar"
          />
        ) : form.email.includes("@") && (
          <FaUserCircle size={48} className="email-avatar-icon" style={{ color: "var(--text-muted)" }} />
        )}
      </div>


      {/* Error */}
      {error && <p className="form-error">{error}</p>}

      {/* Email */}
      <div className="email-field">
        <label className="input-label" htmlFor="email">
          Email <span className="star-red">*</span>
        </label>

        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          className="input"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      {/* Password */}
      <div className="password-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label className="input-label" htmlFor="password">
          Password <span className="star-red">*</span>
        </label>
        <button
          type="button"
          className="forgot-link-btn"
          onClick={() => setView("forgot")}
          style={{ fontSize: "12px", color: "var(--primary-color)", border: "none", background: "none", cursor: "pointer", fontWeight: "600" }}
        >
          Forgot Password?
        </button>
      </div>

      <input
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        className="input"
        onChange={handleChange}
        required
      />

      {/* Submit */}
      <button
        type="submit"
        className="btn primary"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>

      {/* Switch */}
      <p className="auth-switch">
        New user?{" "}
        <Link to="/register" className="auth-link">
          Sign up
        </Link>
      </p>
    </form>
  );
};


export default LoginForm;