import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Legal.css';

const LegalLayout = ({ title, children, lastUpdated, sections = [] }) => {
    const [activeSection, setActiveSection] = useState('');
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map(s => document.getElementById(s.id));
            const scrollPosition = window.scrollY + 100;

            for (let i = sectionElements.length - 1; i >= 0; i--) {
                const el = sectionElements[i];
                if (el && el.offsetTop <= scrollPosition) {
                    setActiveSection(sections[i].id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="legal-container">
            <nav className="legal-nav">
                <Link to="/" className="back-link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Back to FGrow
                </Link>
                <div className="nav-brand">
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>FGrow<span style={{ color: '#6366f1' }}>.</span></span>
                </div>
            </nav>

            <div className="legal-wrapper">
                <aside className="legal-sidebar">
                    <p className="sidebar-title">Contents</p>
                    <ul className="sidebar-nav">
                        {sections.map((section) => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className={activeSection === section.id ? 'active' : ''}
                                    onClick={(e) => scrollToSection(e, section.id)}
                                >
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="legal-content">
                    <header className="legal-header">
                        <h1>{title}</h1>
                        {lastUpdated && <p className="last-updated">Last Updated: {lastUpdated}</p>}
                    </header>

                    <div className="legal-body">
                        {children}
                    </div>
                </main>
            </div>

            <footer className="legal-footer">
                <div className="footer-info">
                    <p style={{ fontWeight: 700, color: '#0f172a' }}>FGrow CRM Platform</p>
                    <p>&copy; {new Date().getFullYear()} All Rights Reserved. Operated by SUKESH D.</p>
                </div>
                <div className="legal-footer-links">
                    <Link to="/terms">Terms</Link>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/payment-policy">Payment Policy</Link>
                    <Link to="/refund-policy">Refunds</Link>
                    <Link to="/legal">Legal Contact</Link>
                </div>
            </footer>
        </div>
    );
};

export default LegalLayout;
