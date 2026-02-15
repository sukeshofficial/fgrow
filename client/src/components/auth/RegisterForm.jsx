// src/pages/auth/RegisterForm.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";
import { register } from "../../features/auth/auth.actions.js";
import AvatarUpload from "../../components/auth/AvatarUpload";

const strengthFor = (pw) => {
  if (!pw) return { score: 0, label: "Too short" };

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
  return { score, label: labels[Math.min(4, score)] };
};

const RegisterForm = ({ onSuccess }) => {
  const { dispatch, isLoading } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    file: null,
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("role", "user");
    if (form.file) formData.append("profile-avatar", form.file);

    try {
      await register(dispatch, formData);
      onSuccess(form.email);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "Registration failed";
      if (status === 409) {
        setError(message);

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 5000);

        return;
      }

      console.error("Register failed", err);
    }
  };

  const strength = strengthFor(form.password);

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit}
      aria-describedby="register-error"
    >
      <h2>Create your account</h2>
      
      {error && (
        <div id="register-error" role="alert" className="form-error">
          {error}
        </div>
      )}

      <label className="input-label" htmlFor="name">
        Full name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        className="input"
        value={form.name}
        onChange={handleChange}
        placeholder="Jane Doe"
        required
      />

      <label className="input-label" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        className="input"
        value={form.email}
        onChange={handleChange}
        placeholder="you@company.com"
        required
      />

      <label className="input-label">Profile picture</label>
      <AvatarUpload
        onFileChange={(file) => setForm((prev) => ({ ...prev, file }))}
      />

      <label className="input-label" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        className="input"
        value={form.password}
        onChange={handleChange}
        placeholder="At least 8 characters"
        required
      />

      <div className={`password-meter strength-${strength.score}`}>
        <div className="meter-fill" />
        <div className="meter-label">{strength.label}</div>
      </div>

      <label className="input-label" htmlFor="confirm">
        Confirm password
      </label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        className="input"
        value={form.confirm}
        onChange={handleChange}
        placeholder="Repeat password"
        required
      />

      <button type="submit" className="btn primary" disabled={isLoading}>
        {isLoading ? (
          <span className="btn-spinner" aria-hidden />
        ) : (
          "Create account"
        )}
      </button>

      <p className="auth-switch">
        Already registered?{" "}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
