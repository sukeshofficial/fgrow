import React, { useState, useEffect } from "react";
import {
    FaCreditCard, FaUsers, FaQrcode, FaCheckCircle,
    FaInfoCircle, FaArrowLeft, FaPlusCircle, FaHistory, FaHeadset, FaShieldAlt
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import PaymentProofModal from "../components/billing/PaymentProofModal";
import SupportModal from "../components/ui/SupportModal";
import { Spinner } from "../components/ui/Spinner";

/**
 * Billing Page - Redesigned
 * 
 * Tenants manage their subscription here.
 * Calculates ₹99/user/month and provides GPay payment instructions.
 */
const Billing = () => {
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isPaymentProofOpen, setIsPaymentProofOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [meRes, staffRes] = await Promise.all([
                    api.get("/auth/me"),
                    api.get("/tenant/staff")
                ]);
                setTenant(meRes.data.tenant);
                // The staff resource is the array directly based on the controller
                setUserCount(staffRes.data.data?.length || staffRes.data.length || 1);
            } catch (error) {
                console.error("Error fetching billing data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    const monthlyTotal = (tenant?.plan === "free_trial" && userCount < 5) ? 0 : userCount * 99;
    const isTrial = (tenant?.plan === "free_trial" || !tenant?.plan) && !tenant?.lastPaymentDate;
    const isActive = tenant?.paymentStatus === "paid" || tenant?.plan === "pro";

    return (
        <div className="billing-glass-container">
            <style>{`
                .billing-glass-container {
                    --accent: #6366f1;
                    --accent-dark: #4f46e5;
                    --text-main: #0f172a;
                    --text-muted: #64748b;
                    --bg-soft: #f8fafc;
                    --glass: rgba(255, 255, 255, 0.8);
                    --border: rgba(226, 232, 240, 0.8);
                    --radius-lg: 24px;
                    --radius-md: 16px;
                    --font: 'Sora', sans-serif;

                    min-height: 100vh;
                    background: var(--bg-soft);
                    font-family: var(--font);
                    color: var(--text-main);
                    position: relative;
                    padding: 60px 20px;
                    overflow: hidden;
                }

                .billing-glass-container::before {
                    content: '';
                    position: absolute;
                    top: -10%;
                    right: -10%;
                    width: 500px;
                    height: 500px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                }

                .billing-wrap {
                    max-width: 1100px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                }

                .billing-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 48px;
                }

                .back-circle {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: white;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    color: var(--text-muted);
                }

                .back-circle:hover {
                    background: var(--accent);
                    color: white;
                    border-color: var(--accent);
                    transform: translateX(-4px);
                }

                .page-title {
                    margin: 0;
                    font-size: 2.25rem;
                    font-weight: 900;
                    letter-spacing: -0.03em;
                }

                .billing-grid {
                    display: grid;
                    grid-template-columns: 1.1fr 1.3fr;
                    gap: 32px;
                }

                @media (max-width: 960px) {
                    .billing-grid { grid-template-columns: 1fr; }
                }

                .glass-card {
                    background: var(--glass);
                    backdrop-filter: blur(12px);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    padding: 40px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 32px;
                }

                .icon-box {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }

                .section-title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 800;
                }

                /* Active Plan Details */
                .plan-summary-box {
                    background: white;
                    border: 1px solid #f1f5f9;
                    border-radius: var(--radius-md);
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .plan-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                    letter-spacing: 0.05em;
                }

                .badge-active { background: #dcfce7; color: #15803d; }
                .badge-pending { background: #fef3c7; color: #92400e; }

                .plan-price-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 12px;
                }

                .price-lg { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.04em; }
                .price-sub { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 8px; margin-left: 4px; }

                .billing-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .stat-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: var(--radius-md);
                    text-align: center;
                }

                .stat-number { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .stat-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

                /* Payment QR Styles */
                .payment-area {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .qr-section {
                    background: white;
                    border-radius: var(--radius-md);
                    padding: 32px;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    gap: 24px;
                }

                @media (max-width: 640px) {
                    .qr-section { flex-direction: column; align-items: center; text-align: center; }
                }

                .qr-frame {
                    width: 200px;
                    height: 200px;
                    padding: 8px;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.05);
                    flex-shrink: 0;
                }

                .payment-steps {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 12px;
                }

                .step-item {
                    display: flex;
                    gap: 12px;
                    font-size: 0.9375rem;
                    color: #475569;
                    line-height: 1.4;
                }

                .step-num {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    color: var(--accent);
                    font-size: 11px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .action-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .btn-primary {
                    background: linear-gradient(135deg, var(--text-main) 0%, #1e293b 100%);
                    color: white;
                    padding: 18px;
                    border-radius: 16px;
                    font-weight: 800;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.2s;
                    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.2);
                }

                .btn-secondary {
                    background: white;
                    color: var(--text-muted);
                    padding: 18px;
                    border-radius: 16px;
                    font-weight: 700;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .btn-secondary:hover { background: #f8fafc; color: var(--text-main); }

                .billing-footer {
                    margin-top: 48px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 40px;
                    background: white;
                    border-radius: 100px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }

                .footer-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #94a3b8;
                }

                @media (max-width: 640px) {
                    .billing-footer { flex-direction: column; gap: 16px; border-radius: 20px; text-align: center; }
                }
            `}</style>

            <div className="billing-wrap">
                <header className="billing-header">
                    <button onClick={() => navigate(-1)} className="back-circle">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.1em' }}>
                            Billing Dashboard
                        </span>
                        <h1 className="page-title">Manage Subscription</h1>
                    </div>
                </header>

                <div className="billing-grid">
                    {/* Left Panel: Status */}
                    <div className="glass-card">
                        <div className="section-header">
                            <div className="icon-box">
                                <FaCreditCard color="var(--accent)" />
                            </div>
                            <h2 className="section-title">Plan Summary</h2>
                        </div>

                        <div className="plan-summary-box">
                            <div className={`plan-badge ${isActive ? 'badge-active' : 'badge-pending'}`}>
                                {isActive ? '🟢 Subscription Active' : '🔴 Action Required'}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Standard Pro</h3>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive compliance & CA tools</p>

                            <div className="plan-price-row">
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <span className="price-lg">₹99</span>
                                    <span className="price-sub">/ user / month</span>
                                </div>
                            </div>
                        </div>

                        <div className="billing-stats">
                            <div className="stat-card">
                                <div className="stat-number">
                                    <FaUsers size={20} color="var(--accent)" />
                                    {userCount}
                                </div>
                                <div className="stat-label">Active Staff</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">₹{monthlyTotal}</div>
                                <div className="stat-label">Total / Month</div>
                            </div>
                        </div>

                        {isTrial && (
                            <div style={{
                                marginTop: '32px',
                                padding: '20px',
                                background: 'rgba(99, 102, 241, 0.05)',
                                borderRadius: '16px',
                                border: '1px solid rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <FaInfoCircle color="var(--accent)" style={{ marginTop: '3px' }} />
                                <div style={{ fontSize: '0.875rem', color: '#4f46e5', fontWeight: 600, lineHeight: 1.5 }}>
                                    Your organization is currently in the initial 30-day grace period. Upgrade now to avoid any disruption.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Payment */}
                    <div className="glass-card" style={{ borderColor: 'var(--accent)' }}>
                        <div className="section-header">
                            <div className="icon-box">
                                <FaQrcode color="var(--text-main)" />
                            </div>
                            <h2 className="section-title">Direct GPay Payment</h2>
                        </div>

                        <div className="payment-area">
                            <div className="qr-section">
                                <div className="qr-frame">
                                    <img
                                        src="/gpay-upi-id-sukesh.png"
                                        alt="UPI QR"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                </div>
                                <div className="payment-steps">
                                    <div className="step-item">
                                        <div className="step-num">1</div>
                                        <span>Scan the QR code with any UPI app (GPay/PhonePe).</span>
                                    </div>
                                    <div className="step-item">
                                        <div className="step-num">2</div>
                                        <span>Pay the exact amount: <strong>₹{monthlyTotal}</strong></span>
                                    </div>
                                    <div className="step-item">
                                        <div className="step-num">3</div>
                                        <span>Copy the <strong>Transaction ID / UTR</strong> and take a screenshot.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Legal Consent */}
                            <div style={{
                                display: 'flex',
                                gap: '14px',
                                alignItems: 'flex-start',
                                margin: '20px 0',
                                textAlign: 'left',
                                padding: '16px',
                                background: agreedToTerms ? 'rgba(99, 102, 241, 0.05)' : 'white',
                                border: `1px solid ${agreedToTerms ? 'var(--accent)' : '#e2e8f0'}`,
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }} onClick={() => setAgreedToTerms(!agreedToTerms)}>
                                <input
                                    type="checkbox"
                                    style={{ width: '18px', height: '18px', marginTop: '4px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <label style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', cursor: 'pointer', userSelect: 'none' }}>
                                    I understand and agree to the <Link to="/terms" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Terms & Conditions</Link>, <Link to="/privacy" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>, and <Link to="/payment-policy" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Payment Policy</Link>.
                                </label>
                            </div>

                            <div className="action-row">
                                <button onClick={() => setIsPaymentProofOpen(true)} className="btn-primary" disabled={!agreedToTerms}>
                                    <FaCheckCircle /> I've Paid
                                </button>
                                <button onClick={() => setIsSupportOpen(true)} className="btn-secondary">
                                    <FaHeadset /> Get Help
                                </button>
                            </div>

                            <p style={{ textAlign: 'center', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                Need a GST invoice? Contact support after payment.
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="billing-footer">
                    <div className="footer-badge">
                        <FaHistory />
                        <span>Verifications processed within 24 business hours.</span>
                    </div>
                    <div className="footer-badge" style={{ color: 'var(--text-main)', opacity: 0.8 }}>
                        <FaShieldAlt color="#10b981" />
                        <span>Security verified by <strong>Razorpay Cloud</strong></span>
                    </div>
                </footer>
            </div>

            {isPaymentProofOpen && (
                <PaymentProofModal
                    isOpen={isPaymentProofOpen}
                    totalAmount={monthlyTotal}
                    onClose={() => setIsPaymentProofOpen(false)}
                />
            )}

            {isSupportOpen && (
                <SupportModal
                    isOpen={isSupportOpen}
                    onClose={() => setIsSupportOpen(false)}
                    initialType="support"
                />
            )}
        </div>
    );
};

export default Billing;
