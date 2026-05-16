import React from 'react';
import LegalLayout from './LegalLayout';

const CookiePolicy = () => {
    return (
        <LegalLayout title="Cookie Policy" lastUpdated="16 May 2026">
            <section>
                <p>This Cookie Policy explains how <strong>FGrow</strong> uses cookies and similar tracking technologies to improve your experience on our CRM platform.</p>
            </section>

            <section>
                <h2>1. What are Cookies?</h2>
                <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and understand how you use the platform.</p>
            </section>

            <section>
                <h2>2. Types of Cookies We Use</h2>
                <ul>
                    <li><strong>Strictly Necessary Cookies</strong>: These are essential for the operation of FGrow. They include cookies that allow you to log into secure areas and perform core actions. Without these, the service cannot function.</li>
                    <li><strong>Preference Cookies</strong>: These remember information like your language settings or theme preferences.</li>
                    <li><strong>Analytics Cookies</strong>: We use basic analytics tools (such as Google Analytics) to collect anonymous data about how users interact with FGrow. This helps us fix bugs and improve the UI.</li>
                    <li><strong>Marketing Cookies</strong>: We do not currently use third-party advertising cookies for cross-site tracking.</li>
                </ul>
            </section>

            <section>
                <h2>3. Third-Party Cookies</h2>
                <p>When you integrate FGrow with other services (like your email provider or payment gateways), those third parties may set their own cookies according to their respective policies. We do not control these cookies.</p>
            </section>

            <section>
                <h2>4. Managing Your Cookies</h2>
                <p>You can control or delete cookies through your browser settings. However:</p>
                <ul>
                    <li>If you block strictly necessary cookies, you will not be able to log in or use FGrow.</li>
                    <li>Disabling cookies may limit your ability to use certain features or save preferences.</li>
                </ul>
            </section>

            <section>
                <h2>5. Changes to This Policy</h2>
                <p>We may update this policy to reflect changes in our technologies or legal requirements. Please check back periodically for updates.</p>
            </section>

            <section>
                <h2>6. Contact</h2>
                <p>For questions regarding our use of cookies, contact us at:</p>
                <p><strong>Email</strong>: sukesh.official.2006@gmail.com</p>
            </section>
        </LegalLayout>
    );
};

export default CookiePolicy;
