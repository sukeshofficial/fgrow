import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import { verifyOtp } from "../../features/auth/auth.actions.js";
import { login } from "../../features/auth/auth.actions.js";
import { userPreview } from "../../api/auth.api.js";
import { SET_PROFILE_PREVIEW } from "../../features/auth/auth.types.js";

/**
 * LoginForm
 *
 * Handles user authentication, email-based profile preview,
 * and login submission flow.
 */
const LoginForm = ({ onSuccess }) => {
  /**
   * Auth context
   */
  const { dispatch, isLoading } = useAuth();

  /**
   * Form and UI state
   */
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  /**
   * Input change handler
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset preview and errors when email changes
    if (name === "email") {
      setError(null);
      setAvatar(null);
    }
  };

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

        dispatch({
          type: SET_PROFILE_PREVIEW,
          payload: {
            avatar: res.data.preview.avatar,
            username: res.data.preview.username,
          },
        });

        setAvatar(res.data.preview.avatar);
      } catch (err) {
        console.error("Preview failed", err);
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

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login</h2>

      {/* Email-based avatar preview */}
      {avatar && (
        <div className="login-avatar-wrapper">
          <img src={avatar} alt="User avatar" className="email-avatar" />
        </div>
      )}

      {/* Error message */}
      {error && <p className="form-error">{error}</p>}

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

      <label className="input-label" htmlFor="password">
        Password <span className="star-red">*</span>
      </label>

      <input
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        className="input"
        onChange={handleChange}
        required
      />

      <button type="submit" className="btn primary" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>

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
