import React, { useState, useEffect, useRef } from "react";
import { FaShieldAlt, FaCogs, FaChartBar, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import ScrollingCredits from "../components/dashboard/ScrollingCredits";

const LandingPage = () => {
    const { user } = useAuth();
    const [activeFaq, setActiveFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const observerRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Persistence logic for reveal animations on re-render
    useEffect(() => {
        document.querySelectorAll(".reveal").forEach((el) => {
            if (el.dataset.revealed === "true") {
                el.classList.add("visible");
            }
        });
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        entry.target.dataset.revealed = "true";
                    }
                });
            },
            { threshold: 0.1 }
        );

        const observe = () => {
            document.querySelectorAll(".reveal").forEach((el) => {
                observer.observe(el);
            });
        };

        observe();
        // Re-observe after a short delay to catch any late-rendered elements
        const timer = setTimeout(observe, 500);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, []);

    const features = [
        {
            icon: "⬡",
            title: "Client Master & Tags",
            desc: "Organize clients with custom tags, searchable metadata, and rich profiles for instant access.",
            color: "#1a56db",
            bg: "#eff6ff",
        },
        {
            icon: "◫",
            title: "Services & Checklists",
            desc: "Define subtasks, checklists, and attach files to every deliverable with full traceability.",
            color: "#059669",
            bg: "#ecfdf5",
        },
        {
            icon: "↻",
            title: "Recurring Automation",
            desc: "Schedule monthly, quarterly, and annual compliance tasks that auto-generate on time.",
            color: "#7c3aed",
            bg: "#f5f3ff",
        },
        {
            icon: "◈",
            title: "Invoice & Billing",
            desc: "Generate invoices tied directly to completed tasks and billable services in one click.",
            color: "#b45309",
            bg: "#fffbeb",
        },
        {
            icon: "⊛",
            title: "Approval Workflows",
            desc: "Multi-step invitation and approval flow for airtight, secure team onboarding.",
            color: "#0d9488",
            bg: "#f0fdfa",
        },
        {
            icon: "≋",
            title: "Team Visibility",
            desc: "Real-time dashboards on task status, billing health, and individual team performance.",
            color: "#4f46e5",
            bg: "#eef2ff",
        },
    ];

    const steps = [
        { num: "01", title: "Create Tenant", desc: "Set up your secure, isolated workspace for your firm in minutes." },
        { num: "02", title: "Verify & Approve", desc: "Admins verify workspace details for compliance and security." },
        { num: "03", title: "Invite Staff", desc: "Onboard your team members with granular role-based permissions." },
        { num: "04", title: "Manage Operations", desc: "Track clients, services, tasks, billing — all in one place." },
    ];

    const testimonials = [
        {
            quote: "FG GROW has completely transformed how we manage tax filings. Missed deadlines are a thing of the past.",
            name: "Rajesh Kumar",
            role: "Managing Partner, RK Consulting",
        },
        {
            quote: "The approval-based invitation flow gives us total peace of mind when dealing with sensitive client data.",
            name: "Sneha Mehta",
            role: "Operations Lead, ComplianceFirst India",
        },
        {
            quote: "Standardizing our services into templates has doubled our team's output. Nothing falls through the cracks now.",
            name: "Arjun Sharma",
            role: "Director, FinServe Solutions",
        },
    ];

    const faqs = [
        { q: "Is it suitable for consultancy teams?", a: "Yes. FG GROW is purpose-built for CA, CS, and Legal teams managing multiple clients, compliance cycles, and billing workflows simultaneously." },
        { q: "Does it support recurring services?", a: "Absolutely. You can configure service templates to recur weekly, monthly, quarterly, or annually with automated task generation." },
        { q: "Can we approve tenants before access?", a: "Yes, our multi-tenant architecture includes a verification and approval layer so you control who gets access to your workspace." },
        { q: "Is role-based access supported?", a: "Yes. Define specific roles for staff to control access to client data, billing info, documents, and approvals." },
        { q: "Can we add custom workflows?", a: "Pro and Enterprise plans let you build custom service templates with tailored checklists, subtasks, and approval steps." },
    ];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0a0f1e;
          --navy-2: #111827;
          --navy-3: #1e2a3b;
          --blue: #2563eb;
          --blue-light: #3b82f6;
          --blue-pale: #eff6ff;
          --teal: #0d9488;
          --teal-pale: #f0fdfa;
          --text: #0f172a;
          --muted: #475569;
          --lighter: #94a3b8;
          --border: #e2e8f0;
          --border-2: rgba(0,0,0,0.06);
          --white: #ffffff;
          --off: #f8fafc;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
          --shadow: 0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05);
          --shadow-lg: 0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06);
          --radius: 14px;
          --radius-sm: 8px;
          --max: 1180px;
          --font: 'Sora', system-ui, sans-serif;
          --mono: 'JetBrains Mono', monospace;
        }

        html { scroll-behavior: smooth; }
        body { font-family: var(--font); color: var(--text); background: var(--white); overflow-x: hidden; }

        .lp { background: var(--white); }
        .wrap { max-width: var(--max); margin: 0 auto; padding: 0 28px; }

        /* NAV */
        .nav {
          position: sticky; top: 0; z-index: 100;
          height: 72px; display: flex; align-items: center;
          transition: all 0.3s;
          border-bottom: 1px solid transparent;
        }
        .nav.scrolled {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          border-color: var(--border);
        }
        .nav-inner { width: 100%; max-width: var(--max); margin: 0 auto; padding: 0 28px; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 14px; letter-spacing: -0.5px;
          overflow: hidden; padding: 4px;
        }
        .logo-img { width: 100%; height: 100%; object-fit: contain; }
        .logo-name { font-weight: 800; font-size: 20px; letter-spacing: -0.5px; color: var(--text); }
        .nav-links { display: flex; gap: 36px; }
        .nav-links a { text-decoration: none; color: var(--muted); font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .nav-actions { display: flex; align-items: center; gap: 12px; }
        .btn-ghost { background: none; border: none; cursor: pointer; color: var(--muted); font-family: var(--font); font-size: 14px; font-weight: 500; padding: 8px 16px; border-radius: var(--radius-sm); text-decoration: none; transition: all 0.2s; }
        .btn-ghost:hover { color: var(--text); background: var(--off); }
        .btn-cta {
          background: var(--blue); color: white; border: none; cursor: pointer;
          font-family: var(--font); font-size: 14px; font-weight: 600;
          padding: 10px 22px; border-radius: 999px; text-decoration: none;
          transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
          box-shadow: 0 1px 3px rgba(37,99,235,0.3);
        }
        .btn-cta:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.35); }
        .btn-cta.large { padding: 14px 30px; font-size: 16px; border-radius: 999px; }
        .btn-outline-cta {
          background: white; color: var(--text); border: 1.5px solid var(--border);
          cursor: pointer; font-family: var(--font); font-size: 16px; font-weight: 600;
          padding: 13px 28px; border-radius: 999px; text-decoration: none;
          transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-outline-cta:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-pale); }

        /* HERO */
        .hero {
          padding: 120px 0 80px;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, #dbeafe 0%, transparent 60%);
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        .hero-inner { text-align: center; position: relative; }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: white; border: 1px solid var(--border);
          padding: 6px 16px 6px 8px; border-radius: 100px;
          font-size: 13px; font-weight: 500; color: var(--muted);
          margin-bottom: 36px; box-shadow: var(--shadow-sm);
        }
        .badge-dot { width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #7c3aed); display: flex; align-items: center; justify-content: center; font-size: 10px; }
        .h1 {
          font-size: clamp(40px, 6vw, 68px); font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.08; color: var(--text); margin-bottom: 24px;
        }
        .h1 em { font-style: normal; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub {
          font-size: clamp(17px, 2vw, 20px); color: var(--muted); font-weight: 400;
          max-width: 620px; margin: 0 auto 44px; line-height: 1.6;
        }
        .hero-ctas { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 52px; }
        .trust-row {
          display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;
          color: var(--muted); font-size: 13px; font-weight: 500;
          margin-bottom: 72px;
        }
        .trust-item { display: flex; align-items: center; gap: 8px; }
        .check {
          width: 20px; height: 20px; border-radius: 50%;
          background: #10b981; color: white;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(16,185,129,0.2);
        }

        /* Dashboard Mockup */
        .mockup-wrap {
          max-width: 860px; margin: 0 auto;
          background: white; border-radius: 20px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .mock-bar {
          height: 44px; background: #f1f5f9;
          display: flex; align-items: center; padding: 0 16px; gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .dot-r { width: 12px; height: 12px; border-radius: 50%; background: #f87171; }
        .dot-y { width: 12px; height: 12px; border-radius: 50%; background: #fbbf24; }
        .dot-g { width: 12px; height: 12px; border-radius: 50%; background: #34d399; }
        .mock-url { flex: 1; margin-left: 12px; background: white; border-radius: 6px; height: 26px; display: flex; align-items: center; padding: 0 12px; font-size: 12px; color: var(--lighter); font-family: var(--mono); max-width: 340px; }
        .mock-body { display: flex; height: 400px; }
        .mock-sidebar { width: 220px; flex-shrink: 0; background: var(--navy); padding: 20px 0; }
        .mock-logo-area { padding: 0 20px 20px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 16px; }
        .mock-logo-sq { width: 28px; height: 28px; background: var(--blue); border-radius: 7px; }
        .mock-logo-txt { height: 12px; width: 60px; background: rgba(255,255,255,0.3); border-radius: 4px; }
        .mock-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; margin: 2px 8px; border-radius: 8px; cursor: default; }
        .mock-nav-item.active { background: rgba(255,255,255,0.08); }
        .mock-nav-sq { width: 16px; height: 16px; border-radius: 4px; }
        .mock-nav-txt { height: 10px; border-radius: 4px; flex: 1; }
        .mock-main { flex: 1; background: #f8fafc; padding: 24px; overflow: hidden; }
        .mock-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .mock-h-txt { height: 18px; width: 160px; background: var(--navy-3); border-radius: 5px; }
        .mock-h-btn { height: 30px; width: 100px; background: var(--blue); border-radius: 6px; }
        .mock-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .mock-card { background: white; border-radius: 10px; padding: 16px; border: 1px solid var(--border); }
        .mc-label { height: 9px; width: 70%; border-radius: 3px; background: #e2e8f0; margin-bottom: 10px; }
        .mc-value { height: 22px; width: 55%; border-radius: 4px; background: var(--navy-3); }
        .mc-badge { height: 14px; width: 40%; border-radius: 20px; margin-top: 10px; }
        .mock-table { background: white; border-radius: 10px; border: 1px solid var(--border); overflow: hidden; }
        .mt-head { display: flex; gap: 0; padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid var(--border); }
        .mt-hcell { height: 9px; border-radius: 3px; background: #cbd5e1; }
        .mt-row { display: flex; gap: 0; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .mt-cell { height: 10px; border-radius: 3px; }
        .mt-badge { height: 18px; border-radius: 20px; display: flex; align-items: center; }

        /* METRICS */
        .metrics { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 56px 0; background: var(--white); }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; }
        .metric-divider { border-right: 1px solid var(--border); }
        .metric-num { font-size: 54px; font-weight: 800; letter-spacing: -0.03em; color: var(--blue); display: block; line-height: 1; margin-bottom: 8px; }
        .metric-lbl { font-size: 14px; color: var(--muted); font-weight: 500; }
        .trusted-by { margin-top: 40px; text-align: center; }
        .trusted-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--lighter); font-weight: 600; margin-bottom: 20px; }
        .logos-row { display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; }
        .logo-pill { font-family: var(--mono); font-size: 14px; font-weight: 500; color: #cbd5e1; letter-spacing: 0.05em; }

        /* PROBLEM SOLUTION */
        .ps-section { background: var(--off); padding: 100px 0; }
        .ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .ps-card { padding: 48px; border-radius: var(--radius); background: white; border: 1px solid var(--border); }
        .ps-card.sol { background: linear-gradient(145deg, white, #eff6ff); border-color: rgba(37,99,235,0.12); }
        .ps-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 100px; display: inline-block; margin-bottom: 20px; }
        .ps-tag.prob { background: #fef2f2; color: #dc2626; }
        .ps-tag.sol { background: #eff6ff; color: var(--blue); }
        .ps-h2 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 24px; line-height: 1.2; }
        .pain-list { list-style: none; }
        .pain-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: var(--muted); }
        .pain-item:last-child { border-bottom: none; }
        .pain-dot { width: 8px; height: 8px; border-radius: 50%; background: #fca5a5; flex-shrink: 0; margin-top: 6px; }
        .sol-p { font-size: 16px; color: var(--muted); line-height: 1.7; margin-bottom: 24px; }
        .sol-link { display: inline-flex; align-items: center; gap: 8px; color: var(--blue); font-weight: 600; text-decoration: none; font-size: 15px; transition: gap 0.2s; }
        .sol-link:hover { gap: 12px; }

        /* FEATURES */
        .features-section { padding: 100px 0; background: white; }
        .section-tag { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--blue); background: var(--blue-pale); padding: 4px 14px; border-radius: 100px; margin-bottom: 16px; }
        .section-h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 16px; }
        .section-sub { font-size: 17px; color: var(--muted); max-width: 540px; line-height: 1.6; margin-bottom: 64px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feat-card {
          padding: 32px; border-radius: var(--radius); border: 1px solid var(--border);
          transition: all 0.25s; cursor: default;
        }
        .feat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: rgba(37,99,235,0.2); }
        .feat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 18px; font-family: sans-serif; }
        .feat-h { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 10px; }
        .feat-p { font-size: 14px; color: var(--muted); line-height: 1.6; }

        /* WORKFLOW */
        .workflow-section { background: var(--navy); padding: 100px 0; }
        .workflow-section .section-tag { background: rgba(37,99,235,0.2); color: #93c5fd; }
        .workflow-section .section-h2 { color: white; }
        .workflow-section .section-sub { color: rgba(255,255,255,0.5); }
        .steps-track { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; margin-top: 20px; }
        .steps-track::before {
          content: ''; position: absolute; top: 32px; left: calc(12.5%); right: calc(12.5%);
          height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(37,99,235,0.4) 50%, rgba(255,255,255,0.1) 100%);
          z-index: 0;
        }
        .step { text-align: center; padding: 0 16px; position: relative; z-index: 1; }
        .step-circle {
          width: 64px; height: 64px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--mono); font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.4);
          margin: 0 auto 24px;
          transition: all 0.3s;
        }
        .step:hover .step-circle { background: var(--blue); border-color: var(--blue); color: white; box-shadow: 0 0 24px rgba(37,99,235,0.4); }
        .step-h { font-size: 15px; font-weight: 700; color: white; margin-bottom: 10px; }
        .step-p { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* HIGHLIGHTS */
        .highlights { padding: 100px 0; background: white; }
        .hl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hl-tag { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--teal); margin-bottom: 16px; display: block; }
        .hl-h2 { font-size: 34px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 36px; }
        .hl-list { list-style: none; display: flex; flex-direction: column; gap: 28px; }
        .hl-item { display: flex; gap: 18px; }
        .hl-icon-wrap { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: var(--off); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .hl-item-h { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .hl-item-p { font-size: 14px; color: var(--muted); line-height: 1.5; }
        .hl-visual { background: linear-gradient(145deg, #f8fafc, #eff6ff); border-radius: 20px; padding: 32px; border: 1px solid var(--border); position: relative; overflow: hidden; }
        .hl-visual::before { content: ''; position: absolute; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%); top: -50px; right: -50px; }
        .mini-dashboard { display: flex; flex-direction: column; gap: 12px; }
        .mini-card { background: white; border-radius: 10px; border: 1px solid var(--border); padding: 16px; }
        .mini-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .mini-label { font-size: 12px; color: var(--lighter); font-weight: 500; }
        .mini-val { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .mini-bar-wrap { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
        .mini-bar { height: 100%; border-radius: 3px; }
        .mini-status-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .status-chip { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }

        /* USE CASE */
        .usecase { background: var(--off); padding: 100px 0; }
        .uc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .uc-card { background: white; border-radius: var(--radius); border: 1px solid var(--border); padding: 32px 28px; transition: all 0.25s; cursor: default; }
        .uc-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: rgba(37,99,235,0.15); }
        .uc-num { font-family: var(--mono); font-size: 11px; color: var(--lighter); margin-bottom: 20px; display: block; }
        .uc-h { font-size: 16px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.01em; }
        .uc-p { font-size: 13px; color: var(--muted); line-height: 1.6; }

        /* TESTIMONIALS */
        .testi { padding: 100px 0; background: white; }
        .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .testi-card { background: var(--off); border-radius: var(--radius); border: 1px solid var(--border); padding: 36px; transition: all 0.25s; }
        .testi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); background: white; }
        .testi-stars { display: flex; gap: 3px; margin-bottom: 20px; }
        .star { color: #f59e0b; font-size: 14px; }
        .testi-q { font-size: 15px; line-height: 1.65; color: var(--text); margin-bottom: 28px; font-style: italic; }
        .testi-author { display: flex; align-items: center; gap: 12px; }
        .testi-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--blue), #7c3aed); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .testi-name { font-size: 14px; font-weight: 700; }
        .testi-role { font-size: 12px; color: var(--muted); margin-top: 2px; }

        /* PRICING */
        .pricing { padding: 100px 0; background: var(--off); }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 0 auto; }
        .price-card { background: white; border-radius: var(--radius); border: 1px solid var(--border); padding: 40px; position: relative; transition: all 0.25s; }
        .price-card.featured { border-color: var(--blue); border-width: 2px; box-shadow: 0 0 0 4px rgba(37,99,235,0.06), var(--shadow-lg); }
        .popular { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--blue); color: white; font-size: 11px; font-weight: 700; padding: 4px 16px; border-radius: 100px; white-space: nowrap; letter-spacing: 0.05em; text-transform: uppercase; }
        .price-tier { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
        .price-amount { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4px; }
        .price-amount span { font-size: 16px; font-weight: 400; color: var(--muted); }
        .price-desc { font-size: 14px; color: var(--muted); margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
        .price-features { list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; }
        .price-feat { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
        .pf-check {
          width: 18px; height: 18px; border-radius: 50%;
          background: #10b981; color: white;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; flex-shrink: 0;
        }
        .price-btn { display: block; text-align: center; padding: 12px; border-radius: var(--radius-sm); font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s; cursor: pointer; border: none; font-family: var(--font); width: 100%; }
        .price-btn-outline { background: var(--off); color: var(--text); border: 1px solid var(--border); }
        .price-btn-outline:hover { background: #f1f5f9; }
        .price-btn-solid { background: var(--blue); color: white; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
        .price-btn-solid:hover { background: #1d4ed8; }

        /* FAQ */
        .faq { padding: 100px 0; background: white; }
        .faq-wrap { max-width: 720px; margin: 0 auto; }
        .faq-item { border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 12px; overflow: hidden; transition: all 0.2s; cursor: pointer; }
        .faq-item.open { border-color: rgba(37,99,235,0.2); box-shadow: 0 0 0 3px rgba(37,99,235,0.05); }
        .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; font-weight: 600; font-size: 15px; gap: 16px; }
        .faq-chevron { width: 20px; height: 20px; border-radius: 50%; background: var(--off); display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; transition: transform 0.3s; color: var(--muted); }
        .faq-item.open .faq-chevron { transform: rotate(180deg); background: var(--blue-pale); color: var(--blue); }
        .faq-a { padding: 0 24px 18px; font-size: 14px; color: var(--muted); line-height: 1.7; }

        /* FINAL CTA */
        .final-cta { background: linear-gradient(135deg, var(--navy) 0%, #1e1b4b 100%); padding: 120px 0; text-align: center; position: relative; overflow: hidden; }
        .final-cta::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .final-cta h2 { font-size: clamp(32px, 5vw, 52px); color: white; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 16px; position: relative; }
        .final-cta p { font-size: 18px; color: rgba(255,255,255,0.55); margin-bottom: 44px; position: relative; }
        .final-ctas { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; position: relative; }
        .btn-white { background: white; color: var(--text); font-family: var(--font); font-size: 16px; font-weight: 600; padding: 14px 30px; border-radius: var(--radius); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        .btn-ghost-white { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; font-family: var(--font); font-size: 16px; font-weight: 600; padding: 14px 30px; border-radius: var(--radius); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; cursor: pointer; }
        .btn-ghost-white:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.3); }

        /* FOOTER */
        .footer { background: var(--navy); padding: 80px 0 40px; color: white; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 56px; }
        .footer-brand-p { color: rgba(255,255,255,0.4); font-size: 14px; line-height: 1.7; margin-top: 16px; max-width: 280px; }
        .footer-col h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); margin-bottom: 20px; }
        .footer-col a { display: block; color: rgba(255,255,255,0.55); text-decoration: none; font-size: 14px; margin-bottom: 12px; transition: color 0.2s; }
        .footer-col a:hover { color: white; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.07); }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.3); }
        .footer-social { display: flex; gap: 16px; }
        .footer-social a { font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
        .footer-social a:hover { color: white; }

        /* REVEAL ANIMATIONS */
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }
        .reveal-d5 { transition-delay: 0.5s; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .ps-grid, .hl-grid { grid-template-columns: 1fr; }
          .uc-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .steps-track { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .steps-track::before { display: none; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .features-grid, .testi-grid, .pricing-grid, .uc-grid { grid-template-columns: 1fr; }
          .mock-sidebar { display: none; }
          .mock-cards { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr; }
          .steps-track { grid-template-columns: 1fr 1fr; }
          .metrics-grid { grid-template-columns: 1fr; gap: 32px; }
          .metric-divider { border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 32px; }
        }
        @media (max-width: 480px) {
          .steps-track { grid-template-columns: 1fr; }
          .final-cta h2 { font-size: 28px; }
        }

        /* DEV RIBBON */
        .dev-ribbon {
          position: fixed;
          top: 40px;
          right: -40px;
          width: 200px;
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: white;
          padding: 6px 0;
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transform: rotate(45deg);
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          pointer-events: none;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset;
        }

        .scrolling-credits{
          margin: 0 !important;
          border-top: none !important;
          border-bottom: 1px solid var(--border);
          background: white;
          height: 40px !important;
        }
      `}</style>

            <div className="lp">
                <ScrollingCredits className="scrolling-credits" />
                <div className="dev-ribbon">Under Development</div>
                {/* NAV */}
                <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
                    <div className="nav-inner">
                        <a href="#" className="logo">
                            <div className="logo-mark">
                                <img src="/ForgeGrid.svg" alt="FG" className="logo-img" />
                            </div>
                            <span className="logo-name">FGROW</span>
                        </a>
                        <div className="nav-links">
                            <a href="#features">Features</a>
                            <a href="#workflow">Workflow</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#faq">FAQs</a>
                        </div>
                        <div className="nav-actions">
                            <a href="/login" className="btn-ghost">Login</a>
                            <a href={user ? "/subscription" : "/register"} className="btn-cta">Book a Demo →</a>
                        </div>
                    </div>
                </nav>

                {/* HERO */}
                <section className="hero">
                    <div className="wrap">
                        <div className="hero-inner">
                            <div className="badge">
                                <div className="badge-dot" style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ color: "white", fontSize: 9 }}>✦</span>
                                </div>
                                Multi-tenant CRM built for compliance teams
                            </div>
                            <h1 className="h1">
                                Run Your Entire Consultancy<br />
                                in <em>One Unified Platform</em>
                            </h1>
                            <p className="hero-sub">
                                Manage clients, services, tasks, billing, approvals, and recurring workflows — all in one secure, role-based CRM built for CA, CS, and compliance teams.
                            </p>
                            <div className="hero-ctas">
                                <a href={user ? "/subscription" : "/register"} className="btn-cta large">Start 30-Day Trial (₹1) →</a>
                                <a href="/login" className="btn-outline-cta">Login</a>
                            </div>
                            <div className="trust-row">
                                <span className="trust-item"><span className="check">✓</span> Multi-tenant architecture</span>
                                <span className="trust-item"><span className="check">✓</span> Role-based access</span>
                                <span className="trust-item"><span className="check">✓</span> Approval-based onboarding</span>
                            </div>

                            {/* Dashboard Mockup */}
                            <div className="mockup-wrap">
                                <div className="mock-bar">
                                    <div className="dot-r"></div>
                                    <div className="dot-y"></div>
                                    <div className="dot-g"></div>
                                    <div className="mock-url">https://fgrow.forgegrid.in/dashboard</div>
                                </div>
                                <div className="mock-body">
                                    <div className="mock-sidebar">
                                        <div className="mock-logo-area">
                                            <div className="mock-logo-sq"></div>
                                            <div className="mock-logo-txt"></div>
                                        </div>
                                        {[
                                            { active: true, color: "#3b82f6" },
                                            { active: false, color: "rgba(255,255,255,0.1)" },
                                            { active: false, color: "rgba(255,255,255,0.1)" },
                                            { active: false, color: "rgba(255,255,255,0.1)" },
                                            { active: false, color: "rgba(255,255,255,0.1)" },
                                        ].map((n, i) => (
                                            <div className={`mock-nav-item ${n.active ? "active" : ""}`} key={i}>
                                                <div className="mock-nav-sq" style={{ background: n.color, opacity: n.active ? 1 : 0.5 }}></div>
                                                <div className="mock-nav-txt" style={{ background: n.active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)", width: ["70%", "55%", "65%", "50%", "60%"][i] }}></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mock-main">
                                        <div className="mock-header-row">
                                            <div className="mock-h-txt"></div>
                                            <div className="mock-h-btn"></div>
                                        </div>
                                        <div className="mock-cards">
                                            {[
                                                { color: "#dbeafe", val: "#1d4ed8", badge: "#bfdbfe" },
                                                { color: "#d1fae5", val: "#065f46", badge: "#a7f3d0" },
                                                { color: "#ede9fe", val: "#5b21b6", badge: "#ddd6fe" },
                                            ].map((c, i) => (
                                                <div className="mock-card" key={i}>
                                                    <div className="mc-label"></div>
                                                    <div className="mc-value" style={{ background: c.val, opacity: 0.8 }}></div>
                                                    <div className="mc-badge" style={{ background: c.badge }}></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mock-table">
                                            <div className="mt-head">
                                                {[60, 100, 80, 60].map((w, i) => (
                                                    <div key={i} className="mt-hcell" style={{ width: w, marginRight: 20 }}></div>
                                                ))}
                                            </div>
                                            {[
                                                ["#e2e8f0", "#e2e8f0", "#dcfce7", "#4ade80", "#166534"],
                                                ["#e2e8f0", "#e2e8f0", "#fef3c7", "#fbbf24", "#92400e"],
                                                ["#e2e8f0", "#e2e8f0", "#dbeafe", "#93c5fd", "#1e40af"],
                                            ].map((row, ri) => (
                                                <div className="mt-row" key={ri}>
                                                    <div className="mt-cell" style={{ width: 60, background: row[0], height: 10, borderRadius: 3, marginRight: 20 }}></div>
                                                    <div className="mt-cell" style={{ flex: 1, background: row[1], height: 10, borderRadius: 3, marginRight: 20 }}></div>
                                                    <div className="mt-badge" style={{ width: 80, background: row[2], borderRadius: 20, marginRight: 20 }}>
                                                        <div style={{ height: 8, width: "60%", margin: "0 auto", background: row[3], borderRadius: 4 }}></div>
                                                    </div>
                                                    <div className="mt-cell" style={{ width: 60, background: row[1], height: 10, borderRadius: 3 }}></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* METRICS */}
                <div className="metrics">
                    <div className="wrap">
                        <div className="metrics-grid">
                            <div className="metric-divider" style={{ padding: "0 40px 0 0" }}>
                                <span className="metric-num">40%</span>
                                <span className="metric-lbl">Faster Client Onboarding</span>
                            </div>
                            <div className="metric-divider" style={{ padding: "0 40px", textAlign: "center" }}>
                                <span className="metric-num">60%</span>
                                <span className="metric-lbl">Reduction in Manual Work</span>
                            </div>
                            <div style={{ padding: "0 0 0 40px", textAlign: "right" }}>
                                <span className="metric-num">100%</span>
                                <span className="metric-lbl">Centralized Operations</span>
                            </div>
                        </div>
                        <div className="trusted-by">
                            <p className="trusted-label">Trusted by firms across India</p>
                            <div className="logos-row">
                                {["ComplianceFirst", "AuditHub", "FinServe", "StartOps", "LegalEdge"].map(l => (
                                    <span key={l} className="logo-pill">{l}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PROBLEM SOLUTION */}
                <section className="ps-section" id="about">
                    <div className="wrap">
                        <div className="ps-grid">
                            <div className="ps-card reveal">
                                <span className="ps-tag prob">The Problem</span>
                                <h2 className="ps-h2">Manual chaos is slowing your firm down</h2>
                                <ul className="pain-list">
                                    {[
                                        "Scattered client data across spreadsheets and emails",
                                        "Manual follow-ups causing delays and missed deadlines",
                                        "Recurring compliance tasks that fall through the cracks",
                                        "Lengthy approval and onboarding friction",
                                        "Confusing, disconnected billing and invoice tracking",
                                    ].map((p, i) => (
                                        <li className="pain-item" key={i}>
                                            <div className="pain-dot"></div>
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="ps-card sol reveal reveal-d2">
                                <span className="ps-tag sol">The Solution</span>
                                <h2 className="ps-h2">One unified workflow for your entire firm</h2>
                                <p className="sol-p">
                                    FG GROW brings every client, task, service, and invoice into a single source of truth. Automated, secure, and designed to scale with your consultancy.
                                </p>
                                <p className="sol-p">
                                    With role-based access and multi-tenant isolation, your team sees exactly what they need — nothing more, nothing less.
                                </p>
                                <a href={user ? "/subscription" : "/register"} className="sol-link">See how it works →</a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section className="features-section" id="features" >
                    <div className="wrap">
                        <div className="reveal">
                            <span className="section-tag">Core Features</span>
                            <h2 className="section-h2">Everything your firm needs, built in</h2>
                            <p className="section-sub">No patchwork of tools. FG GROW is purpose-built for consultancy and compliance operations from day one.</p>
                        </div>
                        <div className="features-grid">
                            {features.map((f, i) => (
                                <div className={`feat-card reveal reveal-d${(i % 3) + 1}`} key={i}>
                                    <div className="feat-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                                    <h3 className="feat-h">{f.title}</h3>
                                    <p className="feat-p">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* WORKFLOW */}
                <section className="workflow-section" id="workflow" >
                    <div className="wrap">
                        <div className="reveal" style={{ textAlign: "center" }}>
                            <span className="section-tag">How It Works</span>
                            <h2 className="section-h2">Up and running in 4 simple steps</h2>
                            <p className="section-sub" style={{ margin: "0 auto 64px" }}>No complex setup. No long onboarding. Just a clear path to better operations.</p>
                        </div>
                        <div className="steps-track">
                            {steps.map((s, i) => (
                                <div className={`step reveal reveal-d${i + 1}`} key={i}>
                                    <div className="step-circle">{s.num}</div>
                                    <h4 className="step-h">{s.title}</h4>
                                    <p className="step-p">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* HIGHLIGHTS */}
                <section className="highlights" >
                    <div className="wrap">
                        <div className="hl-grid">
                            <div className="reveal">
                                <span className="hl-tag">Built to Scale</span>
                                <h2 className="hl-h2">Enterprise-grade security and flexibility</h2>
                                <ul className="hl-list">
                                    {[
                                        { icon: <FaShieldAlt />, title: "Secure Multi-Tenant Access", desc: "Your data is completely isolated, encrypted at rest, and accessible only to authorized users." },
                                        { icon: <FaCogs />, title: "Configurable Service Templates", desc: "Standardize your operations with reusable service frameworks tailored to each client type." },
                                        { icon: <FaChartBar />, title: "Role-Based Dashboards", desc: "Every team member sees exactly what they need — admins, managers, and staff have distinct views." },
                                    ].map((item, i) => (
                                        <li className="hl-item" key={i}>
                                            <div className="hl-icon-wrap">{item.icon}</div>
                                            <div>
                                                <div className="hl-item-h">{item.title}</div>
                                                <div className="hl-item-p">{item.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="hl-visual reveal reveal-d2">
                                <div className="mini-dashboard">
                                    <div className="mini-card">
                                        <div className="mini-row">
                                            <span className="mini-label">Active Clients</span>
                                            <div className="mini-status-row">
                                                <span className="status-chip" style={{ background: "#dcfce7", color: "#15803d" }}>↑ 12%</span>
                                            </div>
                                        </div>
                                        <div className="mini-val" style={{ color: "#1d4ed8" }}>247</div>
                                        <div style={{ marginTop: 12 }}>
                                            <div className="mini-bar-wrap"><div className="mini-bar" style={{ width: "72%", background: "#3b82f6" }}></div></div>
                                        </div>
                                    </div>
                                    <div className="mini-card">
                                        <div className="mini-row">
                                            <span className="mini-label">Pending Tasks</span>
                                            <div className="mini-status-row">
                                                <span className="status-chip" style={{ background: "#fef3c7", color: "#92400e" }}>14 due today</span>
                                            </div>
                                        </div>
                                        <div className="mini-val" style={{ color: "#d97706" }}>38</div>
                                        <div style={{ marginTop: 12 }}>
                                            <div className="mini-bar-wrap"><div className="mini-bar" style={{ width: "38%", background: "#f59e0b" }}></div></div>
                                        </div>
                                    </div>
                                    <div className="mini-card">
                                        <div className="mini-row">
                                            <span className="mini-label">Billing This Month</span>
                                            <div className="mini-status-row">
                                                <span className="status-chip" style={{ background: "#dcfce7", color: "#15803d" }}>₹ 4.2L</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                            {[
                                                { label: "Invoiced", val: "₹3.8L", color: "#10b981" },
                                                { label: "Pending", val: "₹0.4L", color: "#f59e0b" },
                                            ].map((m, i) => (
                                                <div key={i} style={{ flex: 1, padding: "10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{m.label}</div>
                                                    <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* USE CASES */}
                <section className="usecase" >
                    <div className="wrap" style={{ textAlign: "center" }}>
                        <div className="reveal">
                            <span className="section-tag">Use Cases</span>
                            <h2 className="section-h2">One platform, every practice type</h2>
                            <p className="section-sub" style={{ margin: "0 auto 48px" }}>From solo practitioners to multi-partner firms, FG GROW adapts to your workflow.</p>
                        </div>
                        <div className="uc-grid">
                            {[
                                { num: "01", title: "CA & Audit Firms", desc: "Manage tax filings, statutory audits, and annual compliance cycles without missing a beat." },
                                { num: "02", title: "CS & Legal Teams", desc: "Track corporate secretarial tasks, ROC filings, and legal documentation with full audit trails." },
                                { num: "03", title: "Consultancy Businesses", desc: "Stay on top of client projects, service delivery timelines, and recurring retainers." },
                                { num: "04", title: "Operations Teams", desc: "Centralize internal approvals, staff onboarding, and cross-functional workflows." },
                            ].map((uc, i) => (
                                <div className={`uc-card reveal reveal-d${i + 1}`} key={i}>
                                    <span className="uc-num">{uc.num}</span>
                                    <h3 className="uc-h">{uc.title}</h3>
                                    <p className="uc-p">{uc.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className="testi" >
                    <div className="wrap" style={{ textAlign: "center" }}>
                        <div className="reveal">
                            <span className="section-tag">Wall of Love</span>
                            <h2 className="section-h2">Trusted by India's leading consultants</h2>
                            <p className="section-sub" style={{ margin: "0 auto 64px" }}>Real stories from firms that run their operations on FG GROW.</p>
                        </div>
                        <div className="testi-grid">
                            {testimonials.map((t, i) => (
                                <div className={`testi-card reveal reveal-d${i + 1}`} key={i}>
                                    <div className="testi-stars">{[1, 2, 3, 4, 5].map(s => <span key={s} className="star">★</span>)}</div>
                                    <p className="testi-q">"{t.quote}"</p>
                                    <div className="testi-author">
                                        <div className="testi-avatar">
                                            <FaUserCircle size={24} />
                                        </div>
                                        <div>
                                            <div className="testi-name">{t.name}</div>
                                            <div className="testi-role">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PRICING */}
                <section className="pricing" id="pricing" >
                    <div className="wrap" style={{ textAlign: "center" }}>
                        <div className="reveal">
                            <span className="section-tag">Pricing</span>
                            <h2 className="section-h2">Simple, transparent pricing</h2>
                            <p className="section-sub" style={{ margin: "0 auto 64px" }}>Start free. Scale as you grow. No hidden fees, no surprises.</p>
                        </div>
                        <div className="pricing-grid">
                            <div className="price-card reveal">
                                <div className="price-tier">Starter</div>
                                <div className="price-amount">₹0<span>/mo</span></div>
                                <p className="price-desc">Perfect for testing the waters</p>
                                <ul className="price-features">
                                    {["Up to 10 Clients", "5 Staff Members", "Basic Task Tracking", "Community Support"].map(f => (
                                        <li className="price-feat" key={f}><span className="pf-check">✓</span>{f}</li>
                                    ))}
                                </ul>
                                <a href={user ? "/subscription" : "/register"} className="price-btn price-btn-outline">Get Started</a>
                            </div>
                            <div className="price-card featured reveal reveal-d2">
                                <div className="popular">Limited Offer</div>
                                <div className="price-tier">Pro Trial</div>
                                <div className="price-amount">₹1<span>/30 days</span></div>
                                <p className="price-desc">Experience the full power of FGROW</p>
                                <ul className="price-features">
                                    {["Unlimited Clients", "Up to 50 Staff Members", "Recurring Task Automation", "Full Invoicing & Billing", "Priority Support"].map(f => (
                                        <li className="price-feat" key={f}><span className="pf-check">✓</span>{f}</li>
                                    ))}
                                </ul>
                                <a href={user ? "/subscription" : "/register"} className="price-btn price-btn-solid">Start 30-Day Trial</a>
                            </div>
                            <div className="price-card reveal reveal-d3">
                                <div className="price-tier">Enterprise</div>
                                <div className="price-amount" style={{ fontSize: 36 }}>Custom</div>
                                <p className="price-desc">For large-scale operations</p>
                                <ul className="price-features">
                                    {["Unlimited Everything", "Custom Approval Workflows", "Advanced API Access", "Dedicated Success Manager", "SLA Guarantees"].map(f => (
                                        <li className="price-feat" key={f}><span className="pf-check">✓</span>{f}</li>
                                    ))}
                                </ul>
                                <a href="/register" className="price-btn price-btn-outline">Contact Sales</a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="faq" id="faq" >
                    <div className="wrap" style={{ textAlign: "center" }}>
                        <div className="reveal">
                            <span className="section-tag">FAQs</span>
                            <h2 className="section-h2">Questions? We've got answers.</h2>
                        </div>
                        <div className="faq-wrap" style={{ marginTop: 48 }}>
                            {faqs.map((f, i) => (
                                <div
                                    key={i}
                                    className={`faq-item reveal ${activeFaq === i ? "open" : ""}`}
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                >
                                    <div className="faq-q">
                                        <span>{f.q}</span>
                                        <div className="faq-chevron">▾</div>
                                    </div>
                                    {activeFaq === i && <div className="faq-a">{f.a}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="final-cta" >
                    <div className="wrap">
                        <h2>Ready to streamline your client operations?</h2>
                        <p>Join hundreds of firms growing smarter with FG GROW.</p>
                        <div className="final-ctas">
                            <a href={user ? "/subscription" : "/register"} className="btn-white">Start 30-Day Trial (₹1) →</a>
                            <a href="/login" className="btn-ghost-white">Existing User? Login</a>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                < footer className="footer" >
                    <div className="wrap">
                        <div className="footer-grid">
                            <div>
                                <div className="logo">
                                    <div className="logo-mark">
                                        <img src="/ForgeGrid.svg" alt="FG" className="logo-img" />
                                    </div>
                                    <span className="logo-name" style={{ color: "white" }}>FGROW</span>
                                </div>
                                <p className="footer-brand-p">Consolidating consultancy operations into a seamless, secure digital workflow.</p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '12px', fontStyle: 'italic' }}>
                                    Notice: Content on this landing page are placeholders right now.
                                </p>
                            </div>
                            <div className="footer-col">
                                <h4>Product</h4>
                                <a href="#features">Features</a>
                                <a href="#pricing">Pricing</a>
                                <a href="#workflow">How it Works</a>
                                <a href="/login">Login</a>
                            </div>
                            <div className="footer-col">
                                <h4>Company</h4>
                                <a href="#">About Us</a>
                                <a href="#">Contact</a>
                                <a href="#">Careers</a>
                                <a href="#">Blog</a>
                            </div>
                            <div className="footer-col">
                                <h4>Legal</h4>
                                <a href="#">Privacy Policy</a>
                                <a href="#">Terms of Service</a>
                                <a href="#">Security</a>
                                <a href="#">Cookie Policy</a>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            <span className="footer-copy">© {new Date().getFullYear()} ForgeGrid. All rights reserved.</span>
                            <div className="footer-social">
                                <a href="https://www.linkedin.com/in/sukeshd/">LinkedIn</a>
                                <a href="#">Twitter</a>
                                <a href="#">support@fgrow.in</a>
                            </div>
                        </div>
                    </div>
                </footer >
            </div>
        </>
    );
};

export default LandingPage;