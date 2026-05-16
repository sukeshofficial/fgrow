import React from 'react';
import LegalLayout from './LegalLayout';

const PrivacyPolicy = () => {
    const sections = [
        { id: 'collection', title: '1. Data Collection' },
        { id: 'usage', title: '2. Usage Purpose' },
        { id: 'responsibility', title: '3. Data Responsibility' },
        { id: 'cookies', title: '4. Cookies & Tracking' },
        { id: 'storage', title: '5. Storage & Retention' },
        { id: 'sharing', title: '6. Information Sharing' },
        { id: 'rights', title: '7. Your Rights' },
        { id: 'security', title: '8. Security Notice' },
        { id: 'contact', title: '9. Contact' },
    ];

    return (
        <LegalLayout title="Privacy Policy" lastUpdated="16 May 2026" sections={sections}>
            <section>
                <p>At <strong>FGrow</strong>, we respect your privacy and are committed to protecting the data you share with us. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
            </section>

            <div id="collection">
                <h2 id="collection">1. Data We Collect</h2>
                <p>We collect information necessary to provide you with a functional CRM experience:</p>
                <ul>
                    <li><strong>Account Info</strong>: Name, email address, and professional details provided during signup.</li>
                    <li><strong>Service Data</strong>: Lead information, workflow stages, client notes, and emails you choose to manage through FGrow.</li>
                    <li><strong>Payment Info</strong>: Billing address and transaction history.</li>
                    <li><strong>Analytics</strong>: IP addresses, browser types, and usage patterns to improve performance.</li>
                </ul>
            </div>

            <div id="usage">
                <h2 id="usage">2. Why We Collect Data</h2>
                <p>We use your data to provide CRM features, process payments, send essential updates, and improve the platform based on usage trends. We do not use your business data for our own marketing or share it with advertisers.</p>
            </div>

            <div id="responsibility">
                <h2 id="responsibility">3. Business Data Responsibility</h2>
                <div className="legal-highlight">
                    <span className="legal-highlight-title">Data Processing Role</span>
                    <p>FGrow acts as a data processor for information you upload. You are solely responsible for ensuring you have lawful rights and permissions to process client data through our platform.</p>
                </div>
            </div>

            <div id="cookies">
                <h2 id="cookies">4. Cookies and Tracking</h2>
                <p>We use essential cookies to maintain your session. You can disable cookies in your browser, but some features of FGrow may stop working.</p>
            </div>

            <div id="storage">
                <h2 id="storage">5. Data Storage and Retention</h2>
                <ul>
                    <li><strong>Storage</strong>: Your data is stored on secure cloud servers (e.g., AWS, Vercel, or MongoDB Atlas).</li>
                    <li><strong>Retention</strong>: We keep your data as long as your account is active. If cancelled, we retain data for up to 60 days to allow for recovery.</li>
                </ul>
            </div>

            <div id="sharing">
                <h2 id="sharing">6. Sharing of Information</h2>
                <p>We <strong>do not sell</strong> your data. We only share info with service providers required to run the app (hosting, payments) or legal authorities if required by Indian law.</p>
            </div>

            <div id="rights">
                <h2 id="rights">7. User Rights and Deletion</h2>
                <p>You have the right to access, correct, or request full deletion of your account anytime. Please note that account deletion is irreversible.</p>
            </div>

            <div id="security">
                <h2 id="security">8. Security Disclaimer</h2>
                <div className="legal-highlight warning">
                    <span className="legal-highlight-title">Security Notice</span>
                    <p>While we implement reasonable security measures, no internet service is 100% secure. You acknowledge the inherent risks of storing data on cloud-based systems.</p>
                </div>
            </div>

            <div id="contact">
                <h2 id="contact">9. Contact Us</h2>
                <p>If you have questions about your privacy, please reach out:</p>
                <p><strong>Email</strong>: sukesh.official.2006@gmail.com</p>
            </div>
        </LegalLayout>
    );
};

export default PrivacyPolicy;
