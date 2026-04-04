import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useModal } from "../context/ModalContext";
import { api } from "../api/api";
import Toast from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";
import { checkAuth } from "../features/auth/auth.actions";
import Sidebar from "../components/SideBar";
import Stepper from "../components/ui/Stepper";
import { FaUser, FaLock, FaCreditCard, FaUsers } from "react-icons/fa";
import "../styles/settings.css";

const Settings = () => {
    const { user, dispatch } = useAuth();
    const navigate = useNavigate();
    const { showConfirm } = useModal();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Profile State
    const [name, setName] = useState(user?.name || "");

    // Security State
    const [newPassword, setNewPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // Subscription State
    const [billingData, setBillingData] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [openBillingSection, setOpenBillingSection] = useState("plan"); // 'plan' or 'history'

    // Team State
    const [team, setTeam] = useState([]);

    const steps = [
        { label: "Profile", icon: <FaUser /> },
        { label: "Security", icon: <FaLock /> },
        { label: "Subscription", icon: <FaCreditCard /> },
        { label: "Team", icon: <FaUsers /> }
    ];

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const fetchBilling = async () => {
        try {
            const res = await api.get("/billing/status");
            setBillingData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchHistory = async () => {
        if (user?.tenant_role !== 'owner') return;
        try {
            const res = await api.get("/billing/history");
            setPaymentHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTeam = async () => {
        if (user?.tenant_role !== 'owner') return;
        try {
            const res = await api.get("/tenant/staff");
            setTeam(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (currentStep === 2) {
            fetchBilling();
            fetchHistory();
        }
        if (currentStep === 3) fetchTeam();
    }, [currentStep]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (2MB)
        if (file.size > 2 * 1024 * 1024) {
            return addToast("File too large (max 2MB)", "error");
        }

        const formData = new FormData();
        formData.append("avatar", file);

        setLoading(true);
        try {
            const res = await api.put("/profile/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Update local user state via dispatch if necessary, 
            // or just trigger an auth check
            await checkAuth(dispatch);
            addToast("Profile picture updated");
        } catch (err) {
            addToast("Upload failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put("/profile/update", { name });
            await checkAuth(dispatch);
            addToast("Profile updated successfully");
        } catch (err) {
            addToast(err.response?.data?.message || "Update failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async () => {
        if (!newPassword) return addToast("Please enter a new password first", "error");
        setLoading(true);
        try {
            await api.post("/profile/request-password-otp");
            setOtpSent(true);
            addToast("OTP sent to your email");
        } catch (err) {
            addToast("Failed to send OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        try {
            await api.post("/profile/verify-password-otp", { otp, newPassword });
            setOtpSent(false);
            setNewPassword("");
            setOtp("");
            addToast("Password changed successfully");
        } catch (err) {
            addToast(err.response?.data?.message || "Verification failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDowngrade = async () => {
        const confirmed = await showConfirm(
            "Confirm Downgrade",
            "Are you sure you want to revert to the Free plan? Pro features will be disabled.",
            "warning",
            { confirmLabel: "Revert to Free", cancelLabel: "Keep Pro" }
        );
        if (!confirmed) return;
        setLoading(true);
        try {
            await api.post("/billing/downgrade");
            await fetchBilling();
            addToast("Downgraded to Free plan");
        } catch (err) {
            addToast("Downgrade failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async () => {
        const confirmed = await showConfirm(
            "Leave Organization",
            "Are you sure you want to leave this organization? You will lose access to all shared resources.",
            "warning",
            { confirmLabel: "Leave", cancelLabel: "Stay" }
        );
        if (!confirmed) return;
        setLoading(true);
        try {
            await api.post("/profile/unlink-tenant");
            await checkAuth(dispatch);
            window.location.href = "/dashboard";
        } catch (err) {
            addToast("Action failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        const confirmed = await showConfirm(
            "Remove Member",
            "Are you sure you want to remove this member from your organization?",
            "delete",
            { confirmLabel: "Remove", cancelLabel: "Cancel" }
        );
        if (!confirmed) return;
        setLoading(true);
        try {
            await api.patch(`/tenant/${memberId}/remove`);
            await fetchTeam();
            addToast("Member removed");
        } catch (err) {
            addToast("Failed to remove member", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="tab-pane fade-in">
                        <h3>Personal Information</h3>

                        <div className="profile-avatar-section">
                            <div className="avatar-wrapper">
                                {user?.profile_avatar?.secure_url ? (
                                    <img src={user.profile_avatar.secure_url} alt="Profile" className="avatar-preview" />
                                ) : (
                                    <div className="avatar-initials">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <label className="avatar-edit-overlay">
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                                    <span>{loading ? "..." : "Edit"}</span>
                                </label>
                            </div>
                            <div className="avatar-meta">
                                <h4>Profile Picture</h4>
                                <p>JPG, GIF or PNG. Max size of 2MB.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" value={user?.email} disabled className="disabled-input" />
                                <small>Email cannot be changed.</small>
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" value={user?.username} disabled className="disabled-input" />
                            </div>
                            <button type="submit" disabled={loading} className="btn-save">
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                );
            case 1:
                return (
                    <div className="tab-pane fade-in">
                        <h3>Password & Security</h3>
                        <div className="security-card">
                            <p>To change your password, we'll send a verification code to <strong>{user?.email}</strong>.</p>

                            {!otpSent ? (
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                                    <button onClick={handleRequestOTP} disabled={loading} className="btn-save btn-full">
                                        {loading ? "Sending..." : "Send Verification Code"}
                                    </button>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Enter 6-Digit Code</label>
                                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" maxLength="6" className="otp-input" />
                                    <div className="btn-row">
                                        <button onClick={handleVerifyOTP} disabled={loading} className="btn-save min-w-160">
                                            {loading ? "Verifying..." : "Verify & Update Password"}
                                        </button>
                                        <button onClick={() => setOtpSent(false)} className="btn-cancel-wizard">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="tab-pane fade-in">
                        <h3>Plan & Billing</h3>

                        <div className="accordion">
                            {/* Section 1: Current Plan */}
                            <div className={`accordion-item ${openBillingSection === 'plan' ? 'open' : ''}`}>
                                <div className="accordion-header" onClick={() => setOpenBillingSection(openBillingSection === 'plan' ? '' : 'plan')}>
                                    <span>Current Plan Details</span>
                                    <span className="chevron"></span>
                                </div>
                                <div className="accordion-content">
                                    <div className="plan-card">
                                        <div className="plan-info">
                                            <div className="plan-badge-row">
                                                <span className={`plan-badge ${billingData?.plan === 'pro' ? 'badge-pro' : 'badge-free'}`}>
                                                    {billingData?.plan === 'pro' ? 'PRO' : 'FREE TRIAL'}
                                                </span>
                                            </div>
                                            <h4>{billingData?.plan === 'pro' ? 'Pro Plan' : 'Free Trial'}</h4>
                                            <p className="plan-desc">
                                                {billingData?.plan === 'pro'
                                                    ? (billingData?.subscription?.plan_id?.description || 'Full access to all Pro features.')
                                                    : 'Basic access to FGrow CRM features.'}
                                            </p>

                                            {billingData?.plan === 'pro' && billingData?.currentAmount ? (
                                                <div className="plan-meta">
                                                    <span className="price">₹{billingData.currentAmount}</span>
                                                    <span className="period">/ month</span>
                                                </div>
                                            ) : (
                                                <div className="plan-meta">
                                                    <span className="price">₹0</span>
                                                    <span className="period">/ trial</span>
                                                </div>
                                            )}

                                            {/* End Date */}
                                            {billingData?.trialEndDate && (() => {
                                                const endDate = new Date(billingData.trialEndDate);
                                                const isExpired = endDate < new Date();
                                                const isUnlimited = endDate.getFullYear() >= 2100;
                                                return (
                                                    <div className="plan-end-date" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--muted-text, #64748b)' }}>
                                                            {billingData?.plan === 'pro' ? 'Subscription ends:' : 'Trial ends:'}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            padding: '2px 10px',
                                                            borderRadius: '999px',
                                                            background: isUnlimited ? '#e0f2fe' : isExpired ? '#fee2e2' : '#dcfce7',
                                                            color: isUnlimited ? '#0369a1' : isExpired ? '#b91c1c' : '#15803d',
                                                        }}>
                                                            {isUnlimited ? 'Unlimited' : endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        {isExpired && !isUnlimited && (
                                                            <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>· Expired</span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="plan-actions">
                                            {user?.tenant_role === 'owner' && (
                                                billingData?.plan === 'pro' ? (
                                                    <button onClick={handleDowngrade} disabled={loading} className="btn-cancel-plan">
                                                        Revert to Free
                                                    </button>
                                                ) : (
                                                    <button onClick={() => navigate('/subscription')} className="btn-save">
                                                        Upgrade to Pro
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Payment History */}
                            {user?.tenant_role === 'owner' && (
                                <div className={`accordion-item ${openBillingSection === 'history' ? 'open' : ''}`}>
                                    <div className="accordion-header" onClick={() => setOpenBillingSection(openBillingSection === 'history' ? '' : 'history')}>
                                        <span>Payment History</span>
                                        <span className="chevron"></span>
                                    </div>
                                    <div className="accordion-content">
                                        {paymentHistory.length > 0 ? (
                                            <div className="history-table-wrapper">
                                                <table className="history-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Amount</th>
                                                            <th>Status</th>
                                                            <th>Reference</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paymentHistory.map(pay => (
                                                            <tr key={pay._id}>
                                                                <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
                                                                <td>₹{pay.amount}</td>
                                                                <td><span className="status-paid">Paid</span></td>
                                                                <td><small>{pay.razorpay_payment_id}</small></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="no-history">No payment history found.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="tab-pane fade-in">
                        <h3>Team Management</h3>
                        <div className="team-section">
                            {user?.tenant_role === 'owner' ? (
                                <>
                                    <p className="section-desc">Manage users who have access to this organization.</p>
                                    <div className="member-list">
                                        {team.map(member => (
                                            <div key={member._id} className="member-item">
                                                <div className="member-info">
                                                    <span>{member.name}</span>
                                                    <small>{member.email} • {member.tenant_role}</small>
                                                </div>
                                                {member._id !== user.id && (
                                                    <button onClick={() => handleRemoveMember(member._id)} className="btn-remove">Remove</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="unlink-card">
                                    <div className="unlink-content">
                                        <h4>Organization Membership</h4>
                                        <p>You are currently a member of this organization. Note that leaving will revoke all your access permissions immediately.</p>
                                    </div>
                                    <button onClick={handleUnlink} disabled={loading} className="btn-unlink">
                                        Leave Organization
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <>
            <Sidebar />
            <div className="settings">
                <div className="toast-container">
                    {toasts.map((t) => (
                        <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
                    ))}
                </div>

                <div className="settings-wizard-container">
                    <div className="wizard-card" style={{ animation: 'slideUp 0.4s ease-out' }}>
                        <Stepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
                        <div className="form-content">
                            {renderStepContent()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;
