import React from 'react';
import LegalLayout from './LegalLayout';

const ContactLegal = () => {
    const sections = [
        { id: 'operator', title: '1. Operator Details' },
        { id: 'support', title: '2. Support Contact' },
        { id: 'grievance', title: '3. Grievance Contact' },
        { id: 'legal-notices', title: '4. Legal Notices' },
        { id: 'hours', title: '5. Business Hours' },
    ];

    return (
        <LegalLayout title="Contact / Legal Information" lastUpdated="16 May 2026" sections={sections}>
            <section>
                <p>Transparency and trust are core to <strong>FGrow</strong>. This page provides official contact and operator details for legal purposes.</p>
            </section>

            <div id="operator">
                <h2 id="operator">1. Operator Details</h2>
                <p>FGrow is developed and operated by:</p>
                <ul>
                    <li><strong>Operator Name</strong>: SUKESH D [FGrow]</li>
                    <li><strong>Structure</strong>: Independent Solo Founder</li>
                    <li><strong>Country of Operation</strong>: India</li>
                </ul>
            </div>

            <div id="support">
                <h2 id="support">2. Support Contact</h2>
                <p>For general inquiries or technical support, please reach out via:</p>
                <p><strong>Email</strong>: sukesh.official.2006@gmail.com</p>
            </div>

            <div id="grievance">
                <h2 id="grievance">3. Grievance Contact</h2>
                <div className="legal-highlight">
                    <span className="legal-highlight-title">IT Act Compliance</span>
                    <p>Designated contact for grievances related to privacy or data usage as per the Information Technology Act (India).</p>
                </div>
                <ul>
                    <li><strong>Grievance Officer</strong>: SUKESH D</li>
                    <li><strong>Email</strong>: sukesh.official.2006@gmail.com</li>
                </ul>
            </div>

            <div id="legal-notices">
                <h2 id="legal-notices">4. Legal Notifications</h2>
                <p>For any legal notices or compliance-related communication, please use the contact details mentioned above.</p>
            </div>

            <div id="hours">
                <h2 id="hours">5. Business Hours</h2>
                <p>Support is available Monday to Friday, 10:00 AM to 6:00 PM (IST), excluding public holidays in India.</p>
            </div>
        </LegalLayout>
    );
};

export default ContactLegal;
