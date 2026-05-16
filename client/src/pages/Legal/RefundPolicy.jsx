import React from 'react';
import LegalLayout from './LegalLayout';

const RefundPolicy = () => {
    const sections = [
        { id: 'eligibility', title: '1. Eligibility' },
        { id: 'denial', title: '2. Denial Cases' },
        { id: 'cancellation', title: '3. Cancellations' },
        { id: 'how-to', title: '4. How to Request' },
        { id: 'processing', title: '5. Processing Time' },
    ];

    return (
        <LegalLayout title="Refund Policy" lastUpdated="16 May 2026" sections={sections}>
            <section>
                <p>At <strong>FGrow</strong>, we strive to provide a high-quality CRM experience. This Refund Policy explains the conditions under which refunds may be granted.</p>
            </section>

            <div id="eligibility">
                <h2 id="eligibility">1. Eligibility for Refunds</h2>
                <ul>
                    <li><strong>First-Time Purchases</strong>: Refund requests are generally only eligible for first-time purchases.</li>
                    <li><strong>7-Day Window</strong>: You must submit your request within <strong>7 days</strong> of the transaction.</li>
                    <li><strong>Non-Pro-Rated</strong>: We do not offer pro-rated refunds for mid-cycle cancellations.</li>
                </ul>
            </div>

            <div id="denial">
                <h2 id="denial">2. Cases for Denial</h2>
                <div className="legal-highlight warning">
                    <span className="legal-highlight-title">Why we might deny a refund</span>
                    <p>Refunds may be denied if there is evidence of excessive feature usage, data exporting shortly before the request, or any violation of our Terms & Conditions.</p>
                </div>
            </div>

            <div id="cancellation">
                <h2 id="cancellation">3. Subscription Cancellations</h2>
                <p>You can cancel via the dashboard anytime. Cancellation prevents future billing but does not automatically trigger a refund for previous charges.</p>
            </div>

            <div id="how-to">
                <h2 id="how-to">4. How to Request a Refund</h2>
                <p>Email our support team with your account details and the reason for your request:</p>
                <p><strong>Email</strong>: sukesh.official.2006@gmail.com</p>
            </div>

            <div id="processing">
                <h2 id="processing">5. Processing Time</h2>
                <p>Approved refunds are processed <strong>directly one-on-one</strong>. It typically takes <strong>2-5 business days</strong> for the process to be completed.</p>
            </div>
        </LegalLayout>
    );
};

export default RefundPolicy;
