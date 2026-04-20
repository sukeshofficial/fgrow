import React, { useState, useEffect, useRef } from "react";
import { FaShieldAlt, FaCogs, FaChartBar, FaUserCircle, FaInfoCircle, FaMoon, FaSun } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth";
import ScrollingCredits from "../components/dashboard/ScrollingCredits";
import { Link } from "react-router-dom";
import { PopupModal } from "react-calendly";
import Toast from "../components/ui/Toast";
import { api } from "../api/api";
import { checkAuth } from "../features/auth/auth.actions";

const PlaceholderNotice = ({ className = "" }) => (
    <span className={`placeholder-tooltip ${className}`}>
        <FaInfoCircle size={14} />
        <span className="tooltip-text">
            Notice: Content on this landing page are placeholders right now.
        </span>
    </span>
);

const LandingPage = () => {
    const { user, avatar, dispatch } = useAuth();
    const isStaff = user?.tenant_role === "staff";
    const [activeFaq, setActiveFaq] = useState(null);
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("fg-dark-mode") === "true" ||
                window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    const [processing, setProcessing] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };



    /**
     * Fetch billing status using TanStack Query
     */
    const { data: billingStatus } = useQuery({
        queryKey: ["billing-status", user?._id],
        queryFn: async () => {
            const response = await api.get("/billing/status");
            return response.data;
        },
        enabled: !!user && !isStaff,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });


    useEffect(() => {
        localStorage.setItem("fg-dark-mode", darkMode);
        document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode((d) => !d);


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
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) throw new Error("Razorpay SDK failed to load.");
            const orderResponse = await api.post("/billing/create-order", { planId: "pro_plan_id" });
            const { order_id, amount, currency, key_id } = orderResponse.data;
            const options = {
                key: key_id,
                amount,
                currency,
                name: "ForgeGrid",
                description: "Pro Subscription",
                image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3wAAAEPSURBVHhe7dAxAQAADMCg+TfdwR+GIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAQhCEEIAhCEIAd9f9fAAAABJRU5ErkJggg==",
                order_id,
                handler: async (response) => {
                    try {
                        setProcessing(true);
                        await api.post("/billing/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        await fetchBillingStatus();
                        await checkAuth(dispatch);
                        addToast("Payment successful! Your Pro plan is active.", "success");
                    } catch (err) {
                        console.error("Verification failed:", err);
                        addToast("Payment verification failed. Please contact support.", "error");
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: { name: user?.name, email: user?.email, contact: user?.phone },
                notes: { tenant_id: user?.tenant_id },
                theme: { color: "#2563eb" },
                modal: {
                    ondismiss: () => { setProcessing(false); addToast("Payment cancelled", "error"); },
                    confirm_close: true,
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment initiation failed:", err);
            addToast("Payment initiation failed. Please check your connection.", "error");
        } finally {
            setProcessing(false);
        }
    };

    const [scrolled, setScrolled] = useState(false);
    const observerRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.querySelectorAll(".reveal").forEach((el) => {
            if (el.dataset.revealed === "true") el.classList.add("visible");
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
        const observe = () => document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        observe();
        const timer = setTimeout(observe, 500);
        return () => { observer.disconnect(); clearTimeout(timer); };
    }, []);

    const features = [
        { icon: "⬡", title: "Client Master & Tags", desc: "Organize clients with custom tags, searchable metadata, and rich profiles for instant access.", color: "#1a56db", bg: "#eff6ff", darkColor: "#93c5fd", darkBg: "#1e3a5f" },
        { icon: "◫", title: "Services & Checklists", desc: "Define subtasks, checklists, and attach files to every deliverable with full traceability.", color: "#059669", bg: "#ecfdf5", darkColor: "#6ee7b7", darkBg: "#064e3b" },
        { icon: "↻", title: "Recurring Automation", desc: "Schedule monthly, quarterly, and annual compliance tasks that auto-generate on time.", color: "#7c3aed", bg: "#f5f3ff", darkColor: "#c4b5fd", darkBg: "#2e1065" },
        { icon: "◈", title: "Invoice & Billing", desc: "Generate invoices tied directly to completed tasks and billable services in one click.", color: "#b45309", bg: "#fffbeb", darkColor: "#fcd34d", darkBg: "#451a03" },
        { icon: "⊛", title: "Approval Workflows", desc: "Multi-step invitation and approval flow for airtight, secure team onboarding.", color: "#0d9488", bg: "#f0fdfa", darkColor: "#5eead4", darkBg: "#042f2e" },
        { icon: "≋", title: "Team Visibility", desc: "Real-time dashboards on task status, billing health, and individual team performance.", color: "#4f46e5", bg: "#eef2ff", darkColor: "#a5b4fc", darkBg: "#1e1b4b" },
    ];

    const steps = [
        { num: "01", title: "Create Tenant", desc: "Set up your secure, isolated workspace for your firm in minutes." },
        { num: "02", title: "Verify & Approve", desc: "Admins verify workspace details for compliance and security." },
        { num: "03", title: "Invite Staff", desc: "Onboard your team members with granular role-based permissions." },
        { num: "04", title: "Manage Operations", desc: "Track clients, services, tasks, billing — all in one place." },
    ];

    const testimonials = [
        { quote: "FG GROW has completely transformed how we manage tax filings. Missed deadlines are a thing of the past.", name: "Rajesh Kumar", role: "Managing Partner, RK Consulting" },
        { quote: "The approval-based invitation flow gives us total peace of mind when dealing with sensitive client data.", name: "Sneha Mehta", role: "Operations Lead, ComplianceFirst India" },
        { quote: "Standardizing our services into templates has doubled our team's output. Nothing falls through the cracks now.", name: "Arjun Sharma", role: "Director, FinServe Solutions" },
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
            <PopupModal
                url="https://calendly.com/sukesh-official-2006"
                onModalClose={() => setIsCalendlyOpen(false)}
                open={isCalendlyOpen}
                rootElement={document.getElementById("root")}
            />
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── LIGHT MODE TOKENS ── */
        :root,
        [data-theme="light"] {
          --navy: #0a0f1e;
          --navy-2: #111827;
          --navy-3: #1e2a3b;
          --blue: #2563eb;
          --blue-light: #3b82f6;
          --blue-pale: #eff6ff;
          --teal: #0d9488;
          --teal-pale: #f0fdfa;

          --bg-page: #ffffff;
          --bg-off: #f8fafc;
          --bg-section-alt: #f8fafc;
          --bg-card: #ffffff;
          --bg-nav: rgba(255,255,255,0.66);

          --text-primary: #0f172a;
          --text-muted: #475569;
          --text-lighter: #94a3b8;

          --border: #e2e8f0;
          --border-2: rgba(0,0,0,0.06);

          --shadow-sm: 0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);
          --shadow: 0 4px 16px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.05);
          --shadow-lg: 0 20px 40px rgba(0,0,0,0.1),0 8px 16px rgba(0,0,0,0.06);

          --mockup-sidebar: #0a0f1e;
          --mockup-main: #f8fafc;
          --mockup-bar: #f1f5f9;

          --workflow-bg: #0a0f1e;
          --workflow-text: #ffffff;
          --workflow-sub: rgba(255,255,255,0.5);
          --workflow-tag-bg: rgba(37,99,235,0.2);
          --workflow-tag-color: #93c5fd;
          --step-circle-bg: rgba(255,255,255,0.04);
          --step-circle-border: rgba(255,255,255,0.1);
          --step-circle-color: rgba(255,255,255,0.4);
          --step-h-color: #ffffff;
          --step-p-color: rgba(255,255,255,0.45);

          --final-cta-bg: linear-gradient(135deg,#0a0f1e 0%,#1e1b4b 100%);
          --final-cta-text: #ffffff;
          --final-cta-sub: rgba(255,255,255,0.55);

          --footer-bg: #0a0f1e;
          --footer-text: rgba(255,255,255,0.55);
          --footer-label: rgba(255,255,255,0.3);
          --footer-border: rgba(255,255,255,0.07);

          --toggle-bg: #e2e8f0;
          --toggle-icon: #475569;
        }

        /* ── DARK MODE TOKENS ── */
        [data-theme="dark"] {
          --navy: #0d1117;
          --navy-2: #161b22;
          --navy-3: #21262d;
          --blue: #3b82f6;
          --blue-light: #60a5fa;
          --blue-pale: #1e3a5f;
          --teal: #2dd4bf;
          --teal-pale: #042f2e;

          --bg-page: #0d1117;
          --bg-off: #161b22;
          --bg-section-alt: #161b22;
          --bg-card: #1c2128;
          --bg-nav: rgba(13,17,23,0.85);

          --text-primary: #e6edf3;
          --text-muted: #8b949e;
          --text-lighter: #484f58;

          --border: #30363d;
          --border-2: rgba(255,255,255,0.06);

          --shadow-sm: 0 1px 3px rgba(0,0,0,0.3),0 1px 2px rgba(0,0,0,0.2);
          --shadow: 0 4px 16px rgba(0,0,0,0.3),0 2px 8px rgba(0,0,0,0.2);
          --shadow-lg: 0 20px 40px rgba(0,0,0,0.4),0 8px 16px rgba(0,0,0,0.25);

          --mockup-sidebar: #010409;
          --mockup-main: #161b22;
          --mockup-bar: #21262d;

          --workflow-bg: #010409;
          --workflow-text: #e6edf3;
          --workflow-sub: rgba(230,237,243,0.45);
          --workflow-tag-bg: rgba(59,130,246,0.2);
          --workflow-tag-color: #93c5fd;
          --step-circle-bg: rgba(230,237,243,0.04);
          --step-circle-border: rgba(230,237,243,0.1);
          --step-circle-color: rgba(230,237,243,0.35);
          --step-h-color: #e6edf3;
          --step-p-color: rgba(230,237,243,0.45);

          --final-cta-bg: linear-gradient(135deg,#010409 0%,#0d1b2e 100%);
          --final-cta-text: #e6edf3;
          --final-cta-sub: rgba(230,237,243,0.5);

          --footer-bg: #010409;
          --footer-text: rgba(230,237,243,0.5);
          --footer-label: rgba(230,237,243,0.25);
          --footer-border: rgba(230,237,243,0.07);

          --toggle-bg: #21262d;
          --toggle-icon: #e6edf3;
        }

        html { scroll-behavior: smooth; }
        body { font-family: 'Sora',system-ui,sans-serif; color: var(--text-primary); background: var(--bg-page); overflow-x: hidden; transition: background 0.3s, color 0.3s; }

        .lp { background: var(--bg-page); }
        .wrap { max-width: 1180px; margin: 0 auto; padding: 0 28px; }

        /* NAV */
        .nav {
          position: sticky; top: 0; left: 0; width: 100%; z-index: 999;
          height: 72px; display: flex; align-items: center;
          transition: all 0.3s; border-bottom: 1px solid transparent;
        }
        .nav.scrolled {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 999;
          background: var(--bg-nav);
          backdrop-filter: blur(16px);
          border-color: var(--border);
        }
        .nav-inner { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 28px; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark { width: 36px; height: 36px; border-radius: 9px; background: var(--navy-2); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px; }
        .logo-img { width: 100%; height: 100%; object-fit: contain; }
        .logo-name { font-weight: 800; font-size: 20px; letter-spacing: -0.5px; color: var(--text-primary); }
        .nav-links { display: flex; gap: 36px; }
        .nav-links a { text-decoration: none; color: var(--text-muted); font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text-primary); }
        .nav-actions { display: flex; align-items: center; gap: 12px; }

        /* Dark mode toggle */
        .dark-toggle {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--toggle-bg); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--toggle-icon);
          transition: all 0.2s; flex-shrink: 0;
        }
        .dark-toggle:hover { transform: scale(1.08); border-color: var(--blue); color: var(--blue); }

        .btn-ghost { background: none; border: none; cursor: pointer; color: var(--text-muted); font-family: 'Sora',sans-serif; font-size: 14px; font-weight: 500; padding: 8px 16px; border-radius: 8px; text-decoration: none; transition: all 0.2s; }
        .btn-ghost:hover { color: var(--text-primary); background: var(--bg-off); }
        .btn-cta { background: var(--blue); color: white; border: none; cursor: pointer; font-family: 'Sora',sans-serif; font-size: 14px; font-weight: 600; padding: 10px 22px; border-radius: 999px; text-decoration: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(37,99,235,0.3); }
        .btn-cta:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.35); }
        .btn-cta.large { padding: 14px 30px; font-size: 16px; border-radius: 999px; }
        .btn-outline-cta { background: var(--bg-card); color: var(--text-primary); border: 1.5px solid var(--border); cursor: pointer; font-family: 'Sora',sans-serif; font-size: 16px; font-weight: 600; padding: 13px 28px; border-radius: 999px; text-decoration: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .btn-outline-cta:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-pale); }

        /* HERO */
        .hero {
          padding: 100px 0 80px;
          background: var(--bg-page);
          position: relative; overflow: hidden;
        }
        [data-theme="light"] .hero { background: radial-gradient(ellipse 80% 60% at 50% -10%,#dbeafe 0%,transparent 60%); }
        [data-theme="dark"] .hero { background: radial-gradient(ellipse 80% 60% at 50% -10%,rgba(37,99,235,0.12) 0%,transparent 60%); }
        .hero::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        .hero-inner { text-align: center; position: relative; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); padding: 6px 16px 6px 8px; border-radius: 100px; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 36px; box-shadow: var(--shadow-sm); }
        .badge-dot { width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg,#3b82f6,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 10px; }
        .h1 { font-size: clamp(40px,6vw,68px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.08; color: var(--text-primary); margin-bottom: 24px; }
        .h1 em { font-style: normal; background: linear-gradient(135deg,#2563eb 0%,#7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { margin: 0 auto 40px; max-width: 760px; font-size: clamp(15px,1.5vw,18px); color: var(--text-muted); font-weight: 400; line-height: 1.6; }
        .hero-ctas { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 52px; }
        .trust-row { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; color: var(--text-muted); font-size: 13px; font-weight: 500; margin-bottom: 72px; }
        .trust-item { display: flex; align-items: center; gap: 8px; }
        .check { width: 20px; height: 20px; border-radius: 50%; background: #10b981; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(16,185,129,0.2); }

        /* Dashboard Mockup */
        .mockup-wrap { max-width: 860px; margin: 0 auto; background: var(--bg-card); border-radius: 20px; box-shadow: 0 32px 64px rgba(0,0,0,0.16),0 0 0 1px var(--border-2); overflow: hidden; }
        .mock-bar { height: 44px; background: var(--mockup-bar); display: flex; align-items: center; padding: 0 16px; gap: 8px; border-bottom: 1px solid var(--border); }
        .dot-r { width: 12px; height: 12px; border-radius: 50%; background: #f87171; }
        .dot-y { width: 12px; height: 12px; border-radius: 50%; background: #fbbf24; }
        .dot-g { width: 12px; height: 12px; border-radius: 50%; background: #34d399; }
        .mock-url { flex: 1; margin-left: 12px; background: var(--bg-off); border-radius: 6px; height: 26px; display: flex; align-items: center; padding: 0 12px; font-size: 12px; color: var(--text-lighter); font-family: 'JetBrains Mono',monospace; max-width: 340px; }
        .mock-body { display: flex; height: 400px; }
        .mock-sidebar { width: 220px; flex-shrink: 0; background: var(--mockup-sidebar); padding: 20px 0; }
        .mock-logo-area { padding: 0 20px 20px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 16px; }
        .mock-logo-sq { width: 28px; height: 28px; background: var(--blue); border-radius: 7px; }
        .mock-logo-txt { height: 12px; width: 60px; background: rgba(255,255,255,0.3); border-radius: 4px; }
        .mock-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; margin: 2px 8px; border-radius: 8px; }
        .mock-nav-item.active { background: rgba(255,255,255,0.08); }
        .mock-nav-sq { width: 16px; height: 16px; border-radius: 4px; }
        .mock-nav-txt { height: 10px; border-radius: 4px; flex: 1; }
        .mock-main { flex: 1; background: var(--mockup-main); padding: 24px; overflow: hidden; }
        .mock-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .mock-h-txt { height: 18px; width: 160px; background: var(--border); border-radius: 5px; }
        .mock-h-btn { height: 30px; width: 100px; background: var(--blue); border-radius: 6px; }
        .mock-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 20px; }
        .mock-card { background: var(--bg-card); border-radius: 10px; padding: 16px; border: 1px solid var(--border); }
        .mc-label { height: 9px; width: 70%; border-radius: 3px; background: var(--border); margin-bottom: 10px; }
        .mc-value { height: 22px; width: 55%; border-radius: 4px; }
        .mc-badge { height: 14px; width: 40%; border-radius: 20px; margin-top: 10px; }
        .mock-table { background: var(--bg-card); border-radius: 10px; border: 1px solid var(--border); overflow: hidden; }
        .mt-head { display: flex; padding: 12px 16px; background: var(--bg-off); border-bottom: 1px solid var(--border); }
        .mt-hcell { height: 9px; border-radius: 3px; background: var(--border); }
        .mt-row { display: flex; padding: 12px 16px; border-bottom: 1px solid var(--bg-off); align-items: center; }
        .mt-cell { height: 10px; border-radius: 3px; }
        .mt-badge { height: 18px; border-radius: 20px; display: flex; align-items: center; }

        /* METRICS */
        .metrics { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 56px 0; background: var(--bg-page); }
        .metrics-grid { display: grid; grid-template-columns: repeat(3,1fr); text-align: center; }
        .metric-divider { border-right: 1px solid var(--border); }
        .metric-num { font-size: 54px; font-weight: 800; letter-spacing: -0.03em; color: var(--blue); display: block; line-height: 1; margin-bottom: 8px; }
        .metric-lbl { font-size: 14px; color: var(--text-muted); font-weight: 500; }
        .trusted-by { margin-top: 40px; text-align: center; }
        .trusted-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-lighter); font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .logos-row { display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; }
        .logo-pill { font-family: 'JetBrains Mono',monospace; font-size: 14px; font-weight: 500; color: var(--text-lighter); letter-spacing: 0.05em; }

        /* PROBLEM SOLUTION */
        .ps-section { background: var(--bg-section-alt); padding: 100px 0; }
        .ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .ps-card { padding: 48px; border-radius: 14px; background: var(--bg-card); border: 1px solid var(--border); }
        .ps-card.sol { background: var(--bg-card); border-color: rgba(37,99,235,0.2); }
        [data-theme="light"] .ps-card.sol { background: linear-gradient(145deg,white,#eff6ff); }
        [data-theme="dark"] .ps-card.sol { background: linear-gradient(145deg,#1c2128,#1e3a5f22); }
        .ps-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 100px; display: inline-block; margin-bottom: 20px; }
        .ps-tag.prob { background: #fef2f2; color: #dc2626; }
        [data-theme="dark"] .ps-tag.prob { background: rgba(220,38,38,0.15); color: #fca5a5; }
        .ps-tag.sol { background: var(--blue-pale); color: var(--blue); }
        .ps-h2 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 24px; line-height: 1.2; color: var(--text-primary); }
        .pain-list { list-style: none; }
        .pain-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 15px; color: var(--text-muted); }
        .pain-item:last-child { border-bottom: none; }
        .pain-dot { width: 8px; height: 8px; border-radius: 50%; background: #fca5a5; flex-shrink: 0; margin-top: 6px; }
        .sol-p { font-size: 16px; color: var(--text-muted); line-height: 1.7; margin-bottom: 24px; }
        .sol-link { display: inline-flex; align-items: center; gap: 8px; color: var(--blue); font-weight: 600; text-decoration: none; font-size: 15px; transition: gap 0.2s; }
        .sol-link:hover { gap: 12px; }

        /* FEATURES */
        .features-section { padding: 100px 0; background: var(--bg-page); }
        .section-tag { display: inline-block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--blue); background: var(--blue-pale); padding: 4px 14px; border-radius: 100px; margin-bottom: 16px; }
        .section-h2 { font-size: clamp(28px,4vw,40px); font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 16px; color: var(--text-primary); }
        .section-sub { font-size: 17px; color: var(--text-muted); max-width: 540px; line-height: 1.6; margin-bottom: 64px; }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .feat-card { padding: 32px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-card); transition: all 0.25s; cursor: default; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: rgba(37,99,235,0.2); }
        .feat-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 18px; }
        .feat-h { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 10px; color: var(--text-primary); }
        .feat-p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

        /* WORKFLOW */
        .workflow-section { background: var(--workflow-bg); padding: 100px 0; }
        .workflow-section .section-tag { background: var(--workflow-tag-bg); color: var(--workflow-tag-color); }
        .workflow-section .section-h2 { color: var(--workflow-text); }
        .workflow-section .section-sub { color: var(--workflow-sub); }
        .steps-track { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; position: relative; margin-top: 20px; }
        .steps-track::before { content: ''; position: absolute; top: 32px; left: calc(12.5%); right: calc(12.5%); height: 1px; background: linear-gradient(90deg,rgba(255,255,255,0.07) 0%,rgba(37,99,235,0.4) 50%,rgba(255,255,255,0.07) 100%); z-index: 0; }
        .step { text-align: center; padding: 0 16px; position: relative; z-index: 1; }
        .step-circle { width: 64px; height: 64px; border-radius: 50%; border: 1px solid var(--step-circle-border); background: var(--step-circle-bg); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono',monospace; font-size: 16px; font-weight: 500; color: var(--step-circle-color); margin: 0 auto 24px; transition: all 0.3s; }
        .step:hover .step-circle { background: var(--blue); border-color: var(--blue); color: white; box-shadow: 0 0 24px rgba(37,99,235,0.4); }
        .step-h { font-size: 15px; font-weight: 700; color: var(--step-h-color); margin-bottom: 10px; }
        .step-p { font-size: 13px; color: var(--step-p-color); line-height: 1.6; }

        /* HIGHLIGHTS */
        .highlights { padding: 100px 0; background: var(--bg-page); }
        .hl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hl-tag { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--teal); margin-bottom: 16px; display: block; }
        .hl-h2 { font-size: 34px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 36px; color: var(--text-primary); }
        .hl-list { list-style: none; display: flex; flex-direction: column; gap: 28px; }
        .hl-item { display: flex; gap: 18px; }
        .hl-icon-wrap { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: var(--bg-off); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-muted); }
        .hl-item-h { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: var(--text-primary); }
        .hl-item-p { font-size: 14px; color: var(--text-muted); line-height: 1.5; }
        .hl-visual { background: var(--bg-off); border-radius: 20px; padding: 32px; border: 1px solid var(--border); position: relative; overflow: hidden; }
        [data-theme="light"] .hl-visual { background: linear-gradient(145deg,#f8fafc,#eff6ff); }
        [data-theme="dark"] .hl-visual { background: linear-gradient(145deg,#161b22,#1e3a5f22); }
        .hl-visual::before { content: ''; position: absolute; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%); top: -50px; right: -50px; }
        .mini-dashboard { display: flex; flex-direction: column; gap: 12px; }
        .mini-card { background: var(--bg-card); border-radius: 10px; border: 1px solid var(--border); padding: 16px; }
        .mini-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .mini-label { font-size: 12px; color: var(--text-lighter); font-weight: 500; }
        .mini-val { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .mini-bar-wrap { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .mini-bar { height: 100%; border-radius: 3px; }
        .mini-status-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .status-chip { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }

        /* USE CASE */
        .usecase { background: var(--bg-section-alt); padding: 100px 0; }
        .uc-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        .uc-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); padding: 32px 28px; transition: all 0.25s; cursor: default; }
        .uc-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: rgba(37,99,235,0.2); }
        .uc-num { font-family: 'JetBrains Mono',monospace; font-size: 11px; color: var(--text-lighter); margin-bottom: 20px; display: block; }
        .uc-h { font-size: 16px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.01em; color: var(--text-primary); }
        .uc-p { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

        /* TESTIMONIALS */
        .testi { padding: 100px 0; background: var(--bg-page); }
        .testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .testi-card { background: var(--bg-section-alt); border-radius: 14px; border: 1px solid var(--border); padding: 36px; transition: all 0.25s; }
        .testi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); background: var(--bg-card); }
        .testi-stars { display: flex; gap: 3px; margin-bottom: 20px; }
        .star { color: #f59e0b; font-size: 14px; }
        .testi-q { font-size: 15px; line-height: 1.65; color: var(--text-primary); margin-bottom: 28px; font-style: italic; }
        .testi-author { display: flex; align-items: center; gap: 12px; }
        .testi-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,var(--blue),#7c3aed); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .testi-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .testi-role { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

        /* PRICING */
        .pricing { padding: 100px 0; background: var(--bg-section-alt); }
        .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; max-width: 1000px; margin: 0 auto; }
        .price-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); padding: 40px; position: relative; transition: all 0.25s; }
        .price-card.featured { border-color: var(--blue); border-width: 2px; box-shadow: 0 0 0 4px rgba(37,99,235,0.08),var(--shadow-lg); }
        .popular { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--blue); color: white; font-size: 11px; font-weight: 700; padding: 4px 16px; border-radius: 100px; white-space: nowrap; letter-spacing: 0.05em; text-transform: uppercase; }
        .price-tier { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 8px; }
        .price-amount { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4px; color: var(--text-primary); }
        .price-amount span { font-size: 16px; font-weight: 400; color: var(--text-muted); }
        .price-desc { font-size: 14px; color: var(--text-muted); margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
        .price-features { list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; }
        .price-feat { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-muted); }
        .pf-check { width: 18px; height: 18px; border-radius: 50%; background: #10b981; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
        .price-btn { display: block; text-align: center; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s; cursor: pointer; border: none; font-family: 'Sora',sans-serif; width: 100%; }
        .price-btn-outline { background: var(--bg-off); color: var(--text-primary); border: 1px solid var(--border); }
        .price-btn-outline:hover { background: var(--bg-section-alt); }
        .price-btn-solid { background: var(--blue); color: white; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
        .price-btn-solid:hover { background: #1d4ed8; }

        /* FAQ */
        .faq { padding: 100px 0; background: var(--bg-page); }
        .faq-wrap { max-width: 720px; margin: 0 auto; }
        .faq-item { border: 1px solid var(--border); background: var(--bg-card); border-radius: 8px; margin-bottom: 12px; overflow: hidden; transition: all 0.2s; cursor: pointer; }
        .faq-item.open { border-color: rgba(37,99,235,0.3); box-shadow: 0 0 0 3px rgba(37,99,235,0.06); }
        .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; font-weight: 600; font-size: 15px; gap: 16px; color: var(--text-primary); }
        .faq-chevron { width: 20px; height: 20px; border-radius: 50%; background: var(--bg-off); display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; transition: transform 0.3s; color: var(--text-muted); }
        .faq-item.open .faq-chevron { transform: rotate(180deg); background: var(--blue-pale); color: var(--blue); }
        .faq-a { padding: 0 24px 18px; font-size: 14px; color: var(--text-muted); line-height: 1.7; }

        /* TOOLTIP */
        .placeholder-tooltip { position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: help; color: var(--text-lighter); transition: color 0.2s; }
        .placeholder-tooltip:hover { color: var(--blue); }
        .tooltip-text { visibility: hidden; opacity: 0; width: max-content; max-width: 220px; background: var(--navy); color: white; text-align: center; border-radius: 6px; padding: 6px 10px; position: absolute; z-index: 1000; bottom: 140%; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: 500; font-family: 'Sora',sans-serif; letter-spacing: normal; text-transform: none; line-height: 1.4; box-shadow: var(--shadow-lg); transition: opacity 0.2s,bottom 0.2s; white-space: normal; }
        .tooltip-text::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: var(--navy) transparent transparent transparent; }
        .placeholder-tooltip:hover .tooltip-text { visibility: visible; opacity: 1; bottom: 150%; }
        .tooltip-wall-of-love { color: var(--blue) !important; }

        /* FINAL CTA */
        .final-cta { background: var(--final-cta-bg); padding: 120px 0; text-align: center; position: relative; overflow: hidden; }
        .final-cta::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle,rgba(37,99,235,0.15) 0%,transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
        .final-cta h2 { font-size: clamp(32px,5vw,52px); color: var(--final-cta-text); font-weight: 800; letter-spacing: -0.025em; margin-bottom: 16px; position: relative; }
        .final-cta p { font-size: 18px; color: var(--final-cta-sub); margin-bottom: 44px; position: relative; }
        .final-ctas { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; position: relative; }
        .btn-white { background: white; color: #0f172a; font-family: 'Sora',sans-serif; font-size: 16px; font-weight: 600; padding: 14px 30px; border-radius: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        [data-theme="dark"] .btn-white { background: var(--bg-card); color: var(--text-primary); }
        .btn-ghost-white { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; font-family: 'Sora',sans-serif; font-size: 16px; font-weight: 600; padding: 14px 30px; border-radius: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; cursor: pointer; }
        .btn-ghost-white:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.3); }

        /* FOOTER */
        .footer { background: var(--footer-bg); padding: 80px 0 40px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 56px; }
        .footer-brand-p { color: var(--footer-text); font-size: 14px; line-height: 1.7; margin-top: 16px; max-width: 280px; }
        .footer-col h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--footer-label); margin-bottom: 20px; }
        .footer-col a { display: block; color: var(--footer-text); text-decoration: none; font-size: 14px; margin-bottom: 12px; transition: color 0.2s; }
        .footer-col a:hover { color: white; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 32px; border-top: 1px solid var(--footer-border); }
        .footer-copy { font-size: 13px; color: var(--footer-label); }
        .footer-social { display: flex; gap: 16px; }
        .footer-social a { font-size: 13px; color: var(--footer-text); text-decoration: none; transition: color 0.2s; }
        .footer-social a:hover { color: white; }

        /* REVEAL */
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease,transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }
        .reveal-d5 { transition-delay: 0.5s; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .ps-grid,.hl-grid { grid-template-columns: 1fr; }
          .uc-grid { grid-template-columns: repeat(2,1fr); }
          .features-grid { grid-template-columns: repeat(2,1fr); }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .steps-track { grid-template-columns: repeat(2,1fr); gap: 40px; }
          .steps-track::before { display: none; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .features-grid,.testi-grid,.pricing-grid,.uc-grid { grid-template-columns: 1fr; }
          .mock-sidebar { display: none; }
          .mock-cards { grid-template-columns: repeat(2,1fr); }
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
        .dev-ribbon { position: fixed; top: 40px; right: -40px; width: 200px; background: linear-gradient(135deg,#f59e0b,#ea580c); color: white; padding: 6px 0; text-align: center; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; transform: rotate(45deg); z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); pointer-events: none; }

        .scrolling-credits { margin: 0 !important; border-top: none !important; border-bottom: 1px solid var(--border); background: var(--bg-page); height: 40px !important; }
      `}</style>

            <div className="lp" data-theme={darkMode ? "dark" : "light"}>
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
                            <button className="dark-toggle" onClick={toggleDarkMode} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                                {darkMode ? <FaSun size={15} /> : <FaMoon size={15} />}
                            </button>
                            {user ? (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px", color: "var(--text-primary)", fontWeight: 500, fontSize: "14px", padding: "5px 10px 5px 5px", borderRadius: "999px", border: "1px solid var(--border)" }}>
                                        {avatar ? (
                                            <img src={avatar} alt="Profile" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                        ) : (
                                            <FaUserCircle size={24} style={{ color: "var(--text-muted)" }} />
                                        )}
                                        <span>{user.name || "User"}</span>
                                    </div>
                                    {isStaff ? (
                                        <button className="btn-cta" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>Book a Demo →</button>
                                    ) : (
                                        <button onClick={() => setIsCalendlyOpen(true)} className="btn-cta">Book a Demo →</button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-ghost">Login</Link>
                                    <button onClick={() => setIsCalendlyOpen(true)} className="btn-cta">Book a Demo →</button>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* HERO */}
                <section className="hero">
                    <div className="wrap">
                        <div className="hero-inner">
                            <div className="badge">
                                <div className="badge-dot" style={{ background: "linear-gradient(135deg,#3b82f6,#7c3aed)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ color: "white", fontSize: 9 }}>✦</span>
                                </div>
                                Multi-tenant CRM built for compliance teams
                            </div>
                            <h1 className="h1">
                                Run Your Entire Consultancy<br />
                                in <em>One Unified Platform</em>
                            </h1>
                            <p className="hero-sub">
                                Manage clients, services, tasks, billing, approvals, and recurring workflows - all in one secure, role-based CRM built for CA, CS, and compliance teams.
                            </p>
                            <div className="hero-ctas">
                                {isStaff ? (
                                    <button className="btn-cta large" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>Start 30-Day Trial (₹1) →</button>
                                ) : !user ? (
                                    <Link to="/subscription" className="btn-cta large">Start 30-Day Trial (₹1) →</Link>
                                ) : billingStatus?.plan === "pro" ? (
                                    <button onClick={handlePayment} disabled={processing} className="btn-cta large">{processing ? "Processing..." : "Upgrade to Pro →"}</button>
                                ) : billingStatus?.trialUsed ? (
                                    <button onClick={handlePayment} disabled={processing} className="btn-cta large">{processing ? "Processing..." : "Upgrade to Pro →"}</button>
                                ) : (
                                    <button onClick={handlePayment} disabled={processing} className="btn-cta large">{processing ? "Processing..." : "Start 30-Day Trial (₹1) →"}</button>
                                )}
                                {user ? (
                                    <Link to="/dashboard" className="btn-outline-cta">Get Started</Link>
                                ) : (
                                    <Link to="/login" className="btn-outline-cta">Login</Link>
                                )}
                            </div>
                            <div className="trust-row">
                                <span className="trust-item"><span className="check">✓</span> Multi-tenant architecture</span>
                                <span className="trust-item"><span className="check">✓</span> Role-based access</span>
                                <span className="trust-item"><span className="check">✓</span> Approval-based onboarding</span>
                            </div>

                            <div style={{ marginBottom: "52px", display: "flex", justifyContent: "center" }}>
                                <a href="https://www.producthunt.com/products/fgrow?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-fgrow" target="_blank" rel="noopener noreferrer">
                                    <img
                                        alt="FGrow - One secure hub for clients, tasks, and invoices. | Product Hunt"
                                        width="250"
                                        height="54"
                                        src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1121746&theme=${darkMode ? 'dark' : 'light'}&t=1775985927839`}
                                    />
                                </a>
                            </div>



                            {/* Dashboard Mockup */}
                            <div className="mockup-wrap">
                                <div className="mock-bar">
                                    <div className="dot-r"></div>
                                    <div className="dot-y"></div>
                                    <div className="dot-g"></div>
                                    <div className="mock-url" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>https://fgrow.forgegrid.in/dashboard</span>
                                        <PlaceholderNotice />
                                    </div>
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
                            <p className="trusted-label">
                                Trusted by firms across India <PlaceholderNotice />
                            </p>
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
                                        <li className="pain-item" key={i}><div className="pain-dot"></div>{p}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="ps-card sol reveal reveal-d2">
                                <span className="ps-tag sol">The Solution</span>
                                <h2 className="ps-h2">One unified workflow for your entire firm</h2>
                                <p className="sol-p">FG GROW brings every client, task, service, and invoice into a single source of truth. Automated, secure, and designed to scale with your consultancy.</p>
                                <p className="sol-p">With role-based access and multi-tenant isolation, your team sees exactly what they need - nothing more, nothing less.</p>
                                <Link to={user ? "/subscription" : "/register"} className="sol-link">See how it works →</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section className="features-section" id="features">
                    <div className="wrap">
                        <div className="reveal">
                            <span className="section-tag">Core Features</span>
                            <h2 className="section-h2">Everything your firm needs, built in</h2>
                            <p className="section-sub">No patchwork of tools. FG GROW is purpose-built for consultancy and compliance operations from day one.</p>
                        </div>
                        <div className="features-grid">
                            {features.map((f, i) => (
                                <div className={`feat-card reveal reveal-d${(i % 3) + 1}`} key={i}>
                                    <div
                                        className="feat-icon"
                                        style={{
                                            background: darkMode ? f.darkBg : f.bg,
                                            color: darkMode ? f.darkColor : f.color,
                                        }}
                                    >
                                        {f.icon}
                                    </div>
                                    <h3 className="feat-h">{f.title}</h3>
                                    <p className="feat-p">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* WORKFLOW */}
                <section className="workflow-section" id="workflow">
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
                <section className="highlights">
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
                                                <span className="status-chip" style={{ background: darkMode ? "rgba(16,185,129,0.15)" : "#dcfce7", color: darkMode ? "#6ee7b7" : "#15803d" }}>↑ 12%</span>
                                            </div>
                                        </div>
                                        <div className="mini-val" style={{ color: "#3b82f6" }}>247</div>
                                        <div style={{ marginTop: 12 }}>
                                            <div className="mini-bar-wrap"><div className="mini-bar" style={{ width: "72%", background: "#3b82f6" }}></div></div>
                                        </div>
                                    </div>
                                    <div className="mini-card">
                                        <div className="mini-row">
                                            <span className="mini-label">Pending Tasks</span>
                                            <div className="mini-status-row">
                                                <span className="status-chip" style={{ background: darkMode ? "rgba(251,191,36,0.15)" : "#fef3c7", color: darkMode ? "#fcd34d" : "#92400e" }}>14 due today</span>
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
                                                <span className="status-chip" style={{ background: darkMode ? "rgba(16,185,129,0.15)" : "#dcfce7", color: darkMode ? "#6ee7b7" : "#15803d" }}>₹ 4.2L</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                            {[
                                                { label: "Invoiced", val: "₹3.8L", color: "#10b981" },
                                                { label: "Pending", val: "₹0.4L", color: "#f59e0b" },
                                            ].map((m, i) => (
                                                <div key={i} style={{ flex: 1, padding: "10px", background: "var(--bg-off)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                                    <div style={{ fontSize: 11, color: "var(--text-lighter)", marginBottom: 4 }}>{m.label}</div>
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
                <section className="usecase">
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
                <section className="testi">
                    <div className="wrap" style={{ textAlign: "center" }}>
                        <div className="reveal">
                            <span
                                className="section-tag"
                                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                            >
                                Wall of Love
                                <PlaceholderNotice className="tooltip-wall-of-love" />
                            </span>                            <h2 className="section-h2">Trusted by India's leading consultants</h2>
                            <p className="section-sub" style={{ margin: "0 auto 64px" }}>Real stories from firms that run their operations on FG GROW.</p>
                        </div>
                        <div className="testi-grid">
                            {testimonials.map((t, i) => (
                                <div className={`testi-card reveal reveal-d${i + 1}`} key={i}>
                                    <div className="testi-stars">{[1, 2, 3, 4, 5].map(s => <span key={s} className="star">★</span>)}</div>
                                    <p className="testi-q">"{t.quote}"</p>
                                    <div className="testi-author">
                                        <div className="testi-avatar"><FaUserCircle size={24} /></div>
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
                <section className="pricing" id="pricing">
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
                                {isStaff ? (
                                    <button className="price-btn price-btn-outline" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>Get Started</button>
                                ) : (
                                    <Link to={user ? "/dashboard" : "/register"} className="price-btn price-btn-outline">Get Started</Link>
                                )}
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
                                {isStaff ? (
                                    <button className="price-btn price-btn-solid" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>Start 30-Day Trial</button>
                                ) : (
                                    <Link to={user ? "/subscription" : "/register"} className="price-btn price-btn-solid">Start 30-Day Trial</Link>
                                )}
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
                                {isStaff ? (
                                    <button className="price-btn price-btn-outline" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>Contact Sales</button>
                                ) : (
                                    <button onClick={() => setIsCalendlyOpen(true)} className="price-btn price-btn-outline">Contact Sales</button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="faq" id="faq">
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
                <section className="final-cta">
                    <div className="wrap">
                        <h2>Ready to streamline your client operations?</h2>
                        <p>Join hundreds of firms growing smarter with FG GROW.</p>
                        <div className="final-ctas">
                            {isStaff ? (
                                <button className="btn-white" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>Start 30-Day Trial (₹1) →</button>
                            ) : (
                                <Link to={user ? "/subscription" : "/register"} className="btn-white">Start 30-Day Trial (₹1) →</Link>
                            )}
                            {user ? (
                                <Link to="/dashboard" className="btn-ghost-white">Get Started</Link>
                            ) : (
                                <Link to="/login" className="btn-ghost-white">Existing User? Login</Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="footer">
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
                                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "12px", fontStyle: "italic" }}>
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
                                <a href="mailto:sukesh.official.2006@gmail.com">support@fgrow.in</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <div className="toast-container" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 10000, display: "flex", flexDirection: "column", gap: "10px" }}>
                {toasts.map((t) => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </>
    );
};

export default LandingPage;