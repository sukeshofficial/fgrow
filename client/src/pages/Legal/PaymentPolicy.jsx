import React from 'react';
import LegalLayout from './LegalLayout';

const PaymentPolicy = () => {
    const sections = [
        { id: 'pricing', title: '1. Pricing & Billing' },
        { id: 'gst', title: '2. Taxes & GST' },
        { id: 'methods', title: '3. Payment Methods' },
        { id: 'custom', title: '4. Custom Agreements' },
        { id: 'refunds', title: '5. Refunds & Cancellation' },
        { id: 'failed', title: '6. Failed Payments' },
        { id: 'disputes', title: '7. Disputes' },
    ];

    return (
        <LegalLayout title="Payment Policy" lastUpdated="16 May 2026" sections={sections}>
            <section>
                <p>This Payment Policy outlines the terms related to paid subscriptions, early-access plans, and custom agreements for <strong>FGrow</strong>.</p>
            </section>

            <div id="pricing">
                <h2 id="pricing">1. Subscription and Pricing</h2>
                <ul>
                    <li><strong>Plans</strong>: Pricing is displayed on our pricing page. We reserve the right to change prices at any time.</li>
                    <li><strong>Billing</strong>: Payments are charged on a recurring basis (monthly/annually) or as one-time early-access fees.</li>
                    <li><strong>Currency</strong>: All prices are in <strong>INR</strong> (Indian Rupees) unless stated otherwise.</li>
                </ul>
            </div>

            <div id="gst">
                <h2 id="gst">2. Tax and GST Disclaimer</h2>
                <div className="legal-highlight">
                    <span className="legal-highlight-title">Billing Notice</span>
                    <p>FGrow is operated as a small-scale entrepreneurship. GST invoices may not currently be available unless explicitly stated at the time of purchase. The price shown is the total amount payable.</p>
                </div>
            </div>

            <div id="methods">
                <h2 id="methods">3. Payment Methods</h2>
                <p>We process payments primarily via <strong>GPay QR transactions</strong> and direct UPI-based methods.</p>
                <ul>
                    <li>We do not store your bank or UPI details on our servers.</li>
                    <li>Transaction proof (e.g., screenshot) may be requested for verification.</li>
                </ul>
            </div>

            <div id="custom">
                <h2 id="custom">4. Custom and Direct Agreements</h2>
                <p>For custom setups or bulk licenses, payments may be made via direct bank transfer as agreed upon with the founder. These Terms apply equally to such transactions.</p>
            </div>

            <div id="refunds">
                <h2 id="refunds">5. Refunds and Cancellations</h2>
                <div className="legal-highlight warning">
                    <span className="legal-highlight-title">Refund Eligibility</span>
                    <p>Refund requests are only eligible for first-time purchases and must be made within <strong>7 days</strong>. We reserve the right to deny refunds in cases of policy violation or excessive feature usage.</p>
                </div>
                <p>You can cancel your subscription anytime. Access continues until the end of the current billing cycle.</p>
            </div>

            <div id="failed">
                <h2 id="failed">6. Failed Payments and Account Suspension</h2>
                <p>If a recurring payment fails, we will attempt to contact you. If unresolved within <strong>3 days</strong>, account access may be restricted or suspended.</p>
            </div>

            <div id="disputes">
                <h2 id="disputes">7. Chargebacks and Disputes</h2>
                <p>Unauthorized chargebacks may result in immediate and permanent account termination. We encourage resolving any billing issues directly with us.</p>
            </div>
        </LegalLayout>
    );
};

export default PaymentPolicy;
