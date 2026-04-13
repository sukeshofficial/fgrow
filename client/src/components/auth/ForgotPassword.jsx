import React, { useState } from "react";
import { FaArrowLeft, FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";
import { forgotPassword, resetUserPassword, verifyOtpReset } from "../../features/auth/auth.actions";
import logger from "../../utils/logger";

const ForgotPassword = ({ onBack }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await forgotPassword(email);
            setStep(2);
            setMessage("OTP sent to your email.");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
            logger.error("ForgotPassword", "Send OTP failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            await verifyOtpReset({ email, otp });
            setStep(3);
            setError("");
            setMessage("");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired OTP.");
            logger.error("ForgotPassword", "Verify OTP failed", err);
        } finally {
            setIsLoading(false);
        }
    };


    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            await resetUserPassword({ email, otp, newPassword });
            setStep(4); // Success step
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password. Please try again.");
            logger.error("ForgotPassword", "Reset failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <button type="button" className="back-btn" onClick={onBack}>
                <FaArrowLeft /> Back to Login
            </button>

            {step === 1 && (
                <form onSubmit={handleSendOtp} className="auth-form animate-in">
                    <h2 className="auth-title">Forgot Password?</h2>
                    <p className="auth-subtitle">Enter your email and we'll send you an OTP to reset your password.</p>

                    {error && <p className="form-error">{error}</p>}

                    <div className="input-group">
                        <label className="input-label" htmlFor="reset-email">Email</label>
                        <div className="input-wrapper">
                            <FaEnvelope className="input-icon" />
                            <input
                                id="reset-email"
                                type="email"
                                className="input"
                                placeholder="yours@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn primary" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset OTP"}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="auth-form animate-in">
                    <h2 className="auth-title">Verify OTP</h2>
                    <p className="auth-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>

                    {error && <p className="form-error">{error}</p>}
                    {message && <p className="form-success">{message}</p>}

                    <div className="input-group">
                        <label className="input-label" htmlFor="otp">OTP Code</label>
                        <div className="input-wrapper text-center">
                            <FaShieldAlt className="input-icon" />
                            <input
                                id="otp"
                                type="text"
                                className="input otp-input"
                                placeholder="000000"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn primary">
                        Verify & Proceed
                    </button>

                    <p className="resend-text">
                        Didn't receive it? <button type="button" className="link-btn" onClick={handleSendOtp} disabled={isLoading}>Resend Code</button>
                    </p>
                </form>
            )}

            {step === 3 && (
                <form onSubmit={handleResetPassword} className="auth-form animate-in">
                    <h2 className="auth-title">New Password</h2>
                    <p className="auth-subtitle">Create a strong password to secure your account.</p>

                    {error && <p className="form-error">{error}</p>}

                    <div className="input-group">
                        <label className="input-label" htmlFor="new-password">New Password</label>
                        <div className="input-wrapper">
                            <FaLock className="input-icon" />
                            <input
                                id="new-password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
                        <div className="input-wrapper">
                            <FaLock className="input-icon" />
                            <input
                                id="confirm-password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn primary" disabled={isLoading}>
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            )}

            {step === 4 && (
                <div className="auth-form animate-in text-center">
                    <div className="success-icon-wrapper">
                        <div className="success-checkmark">✔</div>
                    </div>
                    <h2 className="auth-title">Password Reset!</h2>
                    <p className="auth-subtitle">Your password has been successfully updated. You can now log in with your new credentials.</p>

                    <button type="button" className="btn primary" onClick={onBack}>
                        Back to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;
