import React from 'react';
import LegalLayout from './LegalLayout';

const TermsAndConditions = () => {
    const sections = [
        { id: 'intro', title: '1. Introduction' },
        { id: 'eligibility', title: '2. Eligibility' },
        { id: 'service', title: '3. Service Description' },
        { id: 'conduct', title: '4. User Conduct' },
        { id: 'data', title: '5. Data Responsibility' },
        { id: 'ip', title: '6. Intellectual Property' },
        { id: 'liability', title: '7. Liability' },
        { id: 'termination', title: '8. Termination' },
        { id: 'contact', title: '9. Contact' },
    ];

    return (
        <LegalLayout title="Terms and Conditions" lastUpdated="16 May 2026" sections={sections}>
            <div id="intro">
                <p>Welcome to <strong>FGrow</strong>. These Terms and Conditions ("Terms") govern your use of the FGrow CRM platform ("Service"), built and operated by SUKESH D, an independent solo developer/founder based in India.</p>

                <div className="legal-highlight warning">
                    <span className="legal-highlight-title">Important Legal Notice</span>
                    <p>By registering for an account or using any part of the Service, you explicitly agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use FGrow.</p>
                </div>

                <h2 id="intro">1. Introduction and Acceptance</h2>
                <p>FGrow is a CRM designed for consultancy teams to manage clients and workflows. By using the Service, especially paid features or subscriptions, you acknowledge that you have read and accepted both these Terms and our Privacy Policy.</p>
            </div>

            <div id="eligibility">
                <h2 id="eligibility">2. Eligibility and Account Responsibility</h2>
                <ul>
                    <li><strong>Eligibility</strong>: You must be at least 18 years old or the legal age of majority in your jurisdiction to use FGrow.</li>
                    <li><strong>Account Security</strong>: You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.</li>
                    <li><strong>Accuracy</strong>: You must provide accurate and complete information during registration.</li>
                </ul>
            </div>

            <div id="service">
                <h2 id="service">3. Description of Service</h2>
                <p>FGrow provides tools for lead management, workflow tracking, and client communication. As an early-stage SaaS, features may be added, modified, or removed at any time without prior notice.</p>

                <div className="legal-highlight">
                    <span className="legal-highlight-title">Early-Stage Software Notice</span>
                    <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee 100% uptime or that the Service will be bug-free at this stage.</p>
                </div>
            </div>

            <div id="conduct">
                <h2 id="conduct">4. Acceptable Use and Prohibited Actions</h2>
                <p>You agree NOT to:</p>
                <ul>
                    <li>Use FGrow for any illegal, unauthorized, or unethical consultancy activities.</li>
                    <li>Upload data that violates third-party intellectual property or privacy rights.</li>
                    <li>Attempt to reverse-engineer, scrape, or disrupt the Service.</li>
                    <li>Spam or send unsolicited communications through the platform.</li>
                </ul>
            </div>

            <div id="data">
                <h2 id="data">5. User-Generated Content and Data Responsibility</h2>
                <ul>
                    <li><strong>Ownership</strong>: You retain full ownership of the data you upload (client details, notes, files).</li>
                    <li><strong>Responsibility</strong>: You are solely responsible for the legality and accuracy of your data. We do not monitor user content but reserve the right to remove anything that violates these Terms.</li>
                </ul>
            </div>

            <div id="ip">
                <h2 id="ip">6. Intellectual Property Ownership</h2>
                <p>All FGrow and its related software, branding, features, UI elements, designs, trademarks, and intellectual property remain the exclusive property of FGrow and/or its operator.</p>
                <p>You are granted a limited, non-exclusive license to use the Service as intended. No rights are granted to you beyond the specific use cases defined in these Terms.</p>
            </div>

            <div id="liability">
                <h2 id="liability">7. Limitation of Liability</h2>
                <div className="legal-highlight warning">
                    <span className="legal-highlight-title">Limitation of Liability</span>
                    <p>To the maximum extent permitted by Indian law, FGrow and its operator shall not be liable for any indirect, incidental, or consequential damages (including loss of data or profits). Our total liability is limited to the amount you paid us in the one (1) month preceding the event.</p>
                </div>
                <p>FGrow is a software platform intended to assist workflow. It does not provide accounting, legal, tax, or professional consultancy advice.</p>
            </div>

            <div id="termination">
                <h2 id="termination">8. Termination and Account Suspension</h2>
                <p>We reserve the right to suspend or terminate your account if you violate these Terms, pose a security risk, or fail to pay subscription fees. You may cancel your account at any time through the dashboard or by contacting support.</p>
            </div>

            <div id="contact">
                <h2 id="contact">9. Contact Information</h2>
                <p>For any legal inquiries or support, please contact us at:</p>
                <p>
                    <strong>Email</strong>: sukesh.official.2006@gmail.com<br />
                    <strong>Operated by</strong>: SUKESH D
                </p>
            </div>
        </LegalLayout>
    );
};

export default TermsAndConditions;
