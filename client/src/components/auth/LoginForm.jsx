import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import { login } from "../../features/auth/auth.actions.js";
import { getMe } from "../../api/auth.api.js";

const LoginForm = ({ onSuccess }) => {
  const { dispatch, isLoading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email") {
      setError(null);
    }
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!form.email || !form.email.includes("@")) {
        setAvatar(null);
        return;
      }

      try {
        const res = await getMe(form.email);
        setAvatar(res.data.avatar);
      } catch {
        setAvatar(null);
      }
    };

    fetchAvatar();
  }, [form.email]);

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

      {error && <p className="form-error">{error}</p>}
      
      <div className="email-field">
        <label className="input-label" htmlFor="email">
          Email
        </label>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="input"
          onChange={handleChange}
          required
        />

        {avatar && (
          <img src={avatar} alt="User avatar" className="email-avatar" />
        )}
      </div>

      <label className="input-label" htmlFor="password">
        Password
      </label>

      <input
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
