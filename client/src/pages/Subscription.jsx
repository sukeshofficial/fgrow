import React, { useState, useEffect } from "react";
import { api } from "../api/api";
import { useAuth } from "../hooks/useAuth";
import { checkAuth } from "../features/auth/auth.actions";
import Toast from "../components/ui/Toast";
import "../styles/subscription.css";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";
import { FaShieldAlt } from "react-icons/fa";

const Subscription = () => {
    const { user, dispatch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [billingStatus, setBillingStatus] = useState(null);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        fetchBillingStatus();
    }, []);

    const fetchBillingStatus = async () => {
        try {
            const response = await api.get("/billing/status");
            setBillingStatus(response.data);
        } catch (err) {
            console.error("Error fetching billing status:", err);
            setError("Failed to load subscription details.");
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setProcessing(true);
        setError(null);

        try {
            // 1. Load Razorpay Script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error("Razorpay SDK failed to load. Are you online?");
            }

            // 2. Create Order on Backend
            const orderResponse = await api.post("/billing/create-order", {
                planId: "pro_plan_id", // Optional if handled by env
            });

            const { order_id, amount, currency, key_id } = orderResponse.data;

            // 3. Open Razorpay Checkout
            const logo = "/ForgeGrid.svg"; // Fallback: "/FGrow.png"
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "ForgeGrid",
                description: "30-Day Pro Subscription",
                // Use a high-quality PNG Base64 for the logo to ensure it renders on localhost
                image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3wAAAEPSURBVHhe7dAxAQAADMCg+TfdwR+GIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAd9f9fAAAABJRU5ErkJggg==",
                order_id: order_id,
                handler: async (response) => {
                    // 4. Verify Payment on Backend
                    try {
                        setProcessing(true);
                        await api.post("/billing/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        // Refetch status to show success
                        await fetchBillingStatus();
                        await checkAuth(dispatch);
                        addToast("Payment successful! Your 30-day trial has started.", "success");
                    } catch (err) {
                        console.error("Verification failed:", err);
                        setError("Payment verification failed. Please contact support.");
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone,
                },
                notes: {
                    tenant_id: user?.tenant_id,
                },
                theme: {
                    color: "#2563eb",
                },
                modal: {
                    ondismiss: () => {
                        setProcessing(false);
                        addToast("Payment cancelled. Your trial hasn't started yet.", "error");
                    },
                    confirm_close: true,
                },
                retry: {
                    enabled: true,
                    max_count: 3
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment initiation failed:", err);
            setError("Failed to initiate payment. Please try again.");
            addToast("Payment initiation failed. Please check your connection.", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    const isSuperAdmin = user?.platform_role === "super_admin" || billingStatus?.isSuperAdminTenant;
    const superAdminEndDate = new Date();
    superAdminEndDate.setFullYear(superAdminEndDate.getFullYear() + 100);

    const effectiveEndDate = isSuperAdmin
        ? superAdminEndDate
        : (billingStatus?.trialEndDate ? new Date(billingStatus.trialEndDate) : null);

    const isTrialActive = isSuperAdmin || (effectiveEndDate && effectiveEndDate > new Date());
    const daysLeft = isTrialActive && effectiveEndDate
        ? Math.ceil((effectiveEndDate - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="subscription-redesign">
            <style>{`
                .subscription-redesign {
                    --blue: #2563eb;
                    --text: #0f172a;
                    --muted: #475569;
                    --lighter: #94a3b8;
                    --border: #e2e8f0;
                    --white: #ffffff;
                    --off: #f8fafc;
                    --shadow: 0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05);
                    --shadow-lg: 0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06);
                    --radius: 14px;
                    --radius-sm: 8px;
                    --font: 'Sora', system-ui, sans-serif;

                    font-family: var(--font);
                    color: var(--text);
                    background: var(--off);
                    min-height: 100vh;
                    padding: 80px 20px;
                }

                .sub-wrap {
                    max-width: 1000px;
                    margin: 0 auto;
                    text-align: center;
                }

                .sub-header {
                    margin-bottom: 64px;
                }

                .section-tag {
                    display: inline-block;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    color: var(--blue);
                    background: rgba(37,99,235,0.08);
                    padding: 4px 14px;
                    border-radius: 100px;
                    margin-bottom: 16px;
                }

                .section-h2 {
                    font-size: 36px;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                    margin-bottom: 16px;
                }

                .section-sub {
                    font-size: 17px;
                    color: var(--muted);
                    max-width: 540px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                .pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-top: 48px;
                }

                .price-card {
                    background: white;
                    border-radius: var(--radius);
                    border: 1px solid var(--border);
                    padding: 40px;
                    position: relative;
                    transition: all 0.25s;
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                }

                .price-card.featured {
                    border-color: var(--blue);
                    border-width: 2px;
                    box-shadow: 0 0 0 4px rgba(37,99,235,0.06), var(--shadow-lg);
                    transform: translateY(-8px);
                }

                .popular {
                    position: absolute;
                    top: -14px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--blue);
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 16px;
                    border-radius: 100px;
                    white-space: nowrap;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .price-tier {
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--muted);
                    margin-bottom: 8px;
                }

                .price-amount {
                    font-size: 44px;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    margin-bottom: 4px;
                }

                .price-amount span {
                    font-size: 16px;
                    font-weight: 400;
                    color: var(--muted);
                }

                .price-desc {
                    font-size: 14px;
                    color: var(--muted);
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid var(--border);
                }

                .price-features {
                    list-style: none;
                    margin-bottom: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    flex-grow: 1;
                    padding: 0;
                }

                .price-feat {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: var(--muted);
                }

                .pf-check {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #10b981;
                    color: white;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 9px;
                    flex-shrink: 0;
                }

                .price-btn {
                    display: block;
                    text-align: center;
                    padding: 14px;
                    border-radius: var(--radius-sm);
                    font-weight: 600;
                    font-size: 15px;
                    text-decoration: none;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                    font-family: var(--font);
                    width: 100%;
                }

                .price-btn-outline {
                    background: var(--off);
                    color: var(--text);
                    border: 1px solid var(--border);
                }

                .price-btn-outline:hover {
                    background: #f1f5f9;
                }

                .price-btn-solid {
                    background: var(--blue);
                    color: white;
                    box-shadow: 0 4px 12px rgba(37,99,235,0.2);
                }

                .price-btn-solid:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .price-btn:disabled {
                    background: #cbd5e1;
                    cursor: not-allowed;
                    box-shadow: none;
                    transform: none;
                }

                .status-info {
                    margin-top: 24px;
                    padding: 16px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    font-size: 13px;
                    color: var(--muted);
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .badge-active { background: #dcfce7; color: #15803d; }
                .badge-expired { background: #fee2e2; color: #b91c1c; }

                .trust-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 32px;
                    background: white;
                    border-radius: 100px;
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow);
                    margin-top: 48px;
                    font-size: 14px;
                    color: var(--muted);
                    transition: all 0.3s;
                }

                .trust-badge:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-2px);
                }

                .trust-icon {
                    transform: scale(1.2);
                    // color: #10b981;
                    color: var(--blue);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rzp-logo-sm {
                    height: 20px;
                    vertical-align: middle;
                    margin-left: 6px;
                }

                @media (max-width: 768px) {
                    .pricing-grid { grid-template-columns: 1fr; }
                    .price-card.featured { transform: none; margin: 20px 0; }
                }

                .toast-container {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    z-index: 9999;
                }

                .back-btn {
                    position: absolute;
                    top: 40px;
                    left: 40px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--muted);
                    background: white;
                    border: 1px solid var(--border);
                    padding: 8px 16px;
                    border-radius: 100px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .back-btn:hover {
                    color: var(--blue);
                    border-color: var(--blue);
                    box-shadow: var(--shadow);
                    transform: translateX(-4px);
                }

                @media (max-width: 768px) {
                    .back-btn { top: 20px; left: 20px; padding: 6px 12px; font-size: 13px; }
                }
            `}</style>

            <div className="sub-wrap">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span>←</span> Back
                </button>
                <div className="sub-header">
                    <span className="section-tag">Manage Subscription</span>
                    <h2 className="section-h2">Unlock the full power of FGROW</h2>
                    <p className="section-sub">Upgrade your trial and scale your operations with premium compliance tools.</p>
                </div>

                {error && <div className="p-4 mb-8 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <div className="pricing-grid">
                    {/* STARTER */}
                    <div className="price-card">
                        <div className="price-tier">Starter</div>
                        <div className="price-amount">₹0<span>/mo</span></div>
                        <p className="price-desc">Perfect for testing the waters</p>
                        <ul className="price-features">
                            {["Up to 10 Clients", "5 Staff Members", "Basic Task Tracking", "Community Support"].map(f => (
                                <li className="price-feat" key={f}><span className="pf-check">✓</span>{f}</li>
                            ))}
                        </ul>
                        <button className="price-btn price-btn-outline" disabled>Current Plan</button>
                    </div>

                    {/* PRO (FEATURED) */}
                    <div className="price-card featured">
                        <div className="popular">Limited Offer</div>
                        <div className="price-tier">Pro Trial</div>
                        <div className="price-amount">₹{billingStatus?.currentAmount || "1"}<span>/30 days</span></div>
                        <p className="price-desc">Experience the full power of FGROW</p>
                        <ul className="price-features">
                            {["Unlimited Clients", "Up to 50 Staff Members", "Recurring Task Automation", "Full Invoicing & Billing", "Priority Support"].map(f => (
                                <li className="price-feat" key={f}><span className="pf-check">✓</span>{f}</li>
                            ))}
                        </ul>

                        <button
                            className="price-btn price-btn-solid"
                            onClick={handlePayment}
                            disabled={processing}
                        >
                            {processing ? "Processing..." : "Upgrade Now"}
                        </button>

                        {(effectiveEndDate || billingStatus?.plan) && (
                            <div className="status-info">
                                <div className={`status-badge ${isTrialActive ? 'badge-active' : 'badge-expired'}`}>
                                    {isTrialActive ? 'Active' : 'Expired'}
                                </div>
                                {isTrialActive ? (
                                    <p>Trial ends <strong>{effectiveEndDate.toLocaleDateString()}</strong> ({daysLeft} days remaining)</p>
                                ) : (
                                    <p>Your trial ended on <strong>{effectiveEndDate?.toLocaleDateString()}</strong></p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ENTERPRISE */}
                    <div className="price-card">
                        <div className="price-tier">Enterprise</div>
                        <div className="price-amount" style={{ fontSize: 32 }}>Custom</div>
                        <p className="price-desc">For large-scale operations</p>
                        <ul className="price-features">
                            {["Unlimited Everything", "Custom Approval Workflows", "Advanced API Access", "Dedicated Success Manager", "SLA Guarantees"].map(f => (
                                <li className="price-feat" key={f}><span className="pf-check">✓</span>{f}</li>
                            ))}
                        </ul>
                        <button className="price-btn price-btn-outline" onClick={() => window.location.href = "mailto:sukesh.official.2006@gmail.com"}>Contact Sales</button>
                    </div>
                </div>

                <div className="trust-badge">
                    <span className="trust-icon"><FaShieldAlt /></span>
                    <span>Secure payments powered by <strong>Razorpay</strong></span>
                    <img
                        src="https://razorpay.com/favicon.png"
                        alt="Razorpay"
                        className="rzp-logo-sm"
                    />
                </div>
            </div>

            <div className="toast-container">
                {toasts.map((t) => (
                    <Toast
                        key={t.id}
                        message={t.message}
                        type={t.type}
                        onClose={() => removeToast(t.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Subscription;
