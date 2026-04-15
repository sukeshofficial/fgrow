import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaLinkedin, FaMusic } from "react-icons/fa";
import "../styles/launch-timer.css";

const LAUNCH_DATE = new Date("2026-04-20T18:00:00+05:30");

const TRACKS = [
    { title: "Nee Paartha Vizhigal - 3", src: "/music/nee-paartha-vizhigal.mp3" },
    { title: "Kanave Kanave - David", src: "/music/kanave-kanave.mp3" },
    { title: "Kanave Nee Nan - Kannum Kannum Kollaiyadithaal", src: "/music/kanave-nee-naan.mp3" },
    { title: "No Time for Caution - Interstellar", src: "/music/interstellar.mp3" },
    { title: "Shape of You", src: "/music/shape-of-you.mp3" },
    { title: "Avengers Theme", src: "/music/avengers.mp3" }
];

function calculateTimeLeft() {
    const difference = +LAUNCH_DATE - +new Date();
    if (difference > 0) {
        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
}

const LaunchTimer = () => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [clickCount, setClickCount] = useState(0);

    // Music Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [showMusicTooltip, setShowMusicTooltip] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);
    const playerRef = useRef(null);

    // Initial interaction for autoplay
    useEffect(() => {
        const handleFirstInteraction = () => {
            if (audioRef.current && !isPlaying) {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
            }
            window.removeEventListener("click", handleFirstInteraction);
            window.removeEventListener("keydown", handleFirstInteraction);
        };
        window.addEventListener("click", handleFirstInteraction);
        window.addEventListener("keydown", handleFirstInteraction);
        return () => {
            window.removeEventListener("click", handleFirstInteraction);
            window.removeEventListener("keydown", handleFirstInteraction);
        };
    }, [isPlaying]);

    // Close tooltip on outside click (mobile)
    useEffect(() => {
        if (!showTooltip) return;
        const handleOutside = (e) => {
            if (playerRef.current && !playerRef.current.contains(e.target)) {
                setShowTooltip(false);
            }
        };
        document.addEventListener("click", handleOutside);
        return () => document.removeEventListener("click", handleOutside);
    }, [showTooltip]);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const val = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(val || 0);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            audioRef.current.currentTime = percentage * audioRef.current.duration;
        }
    };

    const handleTrackEnd = () => {
        const next = (currentTrack + 1) % TRACKS.length;
        setCurrentTrack(next);
        // Using timeout to ensure source is updated
        setTimeout(() => {
            audioRef.current.play();
            setIsPlaying(true);
        }, 100);
    };

    const handlePillClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 10) {
            localStorage.setItem("launchBypass", "true");
            window.location.href = "/login";
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num) => String(num).padStart(2, "0");

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }
        setStatus("loading");
        try {
            // Trim trailing slash from base URL to prevent double slashes (e.g., //launch)
            const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");
            const res = await axios.post(
                `${baseUrl}/launch/subscribe`,
                { email },
                { withCredentials: true }
            );
            setStatus("success");
            setMessage(res.data.message || "You're on the list! We'll notify you at launch. 🚀");
            setEmail("");
        } catch (err) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="launch-gate">
            {/* Animated background elements */}
            <div className="launch-bg">
                <div className="launch-orb launch-orb-1"></div>
                <div className="launch-orb launch-orb-2"></div>
                <div className="launch-orb launch-orb-3"></div>
                <div className="launch-grid"></div>
            </div>


            <div className="launch-content">
                {/* Logo */}
                <div className="launch-brand">
                    <div className="launch-brand-icon">
                        <img src="/logo-transparent.png" alt="FGrow logo" style={{ width: 30, height: 30, objectFit: "contain" }} />
                    </div>
                    <span className="launch-logo-text">FGROW</span>
                </div>

                {/* Headline */}
                <h1 className="launch-headline">
                    The Future of Consultancy<br />
                    <span className="launch-headline-accent">is Almost Here.</span>
                </h1>

                {/* Live pill (Secured Admin Bypass) */}
                <div
                    className="launch-live-pill"
                    onClick={handlePillClick}
                    style={{ cursor: "pointer", userSelect: "none" }}
                >
                    <span className="launch-live-dot"></span>
                    Launching April 20, 2026
                </div>

                <p className="launch-desc">
                    A powerful self-hosted CRM built for CA, CS & compliance teams. Be the first to get access when we go live at&nbsp;
                    <strong>6:00 PM IST.</strong>
                </p>

                {/* Countdown */}
                <div className="timer-grid">
                    {[
                        { val: timeLeft.days, label: "Days" },
                        { val: timeLeft.hours, label: "Hours" },
                        { val: timeLeft.minutes, label: "Minutes" },
                        { val: timeLeft.seconds, label: "Seconds" },
                    ].map(({ val, label }, i) => (
                        <div className="timer-unit" key={i}>
                            <span className="timer-val">{formatNumber(val)}</span>
                            <span className="timer-label">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="launch-divider"></div>

                {/* Email form */}
                {status === "success" ? (
                    <div className="notify-success">
                        <div className="notify-success-icon">✓</div>
                        <span>{message}</span>
                    </div>
                ) : (
                    <>
                        <p className="launch-cta-label">Get notified the moment we launch</p>
                        <form className="notify-form" onSubmit={handleSubscribe} noValidate>
                            <div className={`notify-input-wrap ${status === "error" ? "error" : ""}`}>
                                <svg className="notify-mail-icon" viewBox="0 0 20 20" fill="none">
                                    <path d="M2 5.5A1.5 1.5 0 013.5 4h13A1.5 1.5 0 0118 5.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 14.5v-9z" stroke="currentColor" strokeWidth="1.4" />
                                    <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                </svg>
                                <input
                                    type="email"
                                    className="notify-input"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (status === "error") setStatus("idle");
                                    }}
                                    disabled={status === "loading"}
                                />
                                <button type="submit" className="notify-btn" disabled={status === "loading"}>
                                    {status === "loading" ? (
                                        <span className="notify-spinner"></span>
                                    ) : (
                                        <>Notify Me <span>→</span></>
                                    )}
                                </button>
                            </div>
                            {status === "error" && (
                                <p className="notify-error">⚠ {message}</p>
                            )}
                        </form>
                    </>
                )}

                {/* Footer */}
                <div className="launch-footer">
                    <div className="launch-footer-main">
                        <span>Powered by</span>
                        <span className="launch-footer-brand">ForgeGrid</span>
                        <span className="launch-footer-dot">·</span>
                        <span>No spam, ever.</span>
                    </div>
                    <div className="launch-team-credits">
                        {/* Lead / Primary Row */}
                        <div className="team-member team-member-special">
                            <span className="team-role">Dev, Design, Test:</span>
                            <a href="https://www.linkedin.com/in/sukeshd" target="_blank" rel="noopener noreferrer" className="team-name">
                                SUKESH <FaLinkedin className="team-li-icon" size={14} />
                            </a>
                        </div>

                        {/* Secondary Row */}
                        <div className="team-credits-secondary">
                            <div className="team-member team-member-special">
                                <span className="team-role">Designer:</span>
                                <a href="https://www.linkedin.com/in/j-n-prithiviraaj-v3706" target="_blank" rel="noopener noreferrer" className="team-name">
                                    PRITHIVIRAAJ <FaLinkedin className="team-li-icon" size={14} />
                                </a>
                            </div>
                            <div className="team-member team-member-special">
                                <span className="team-role">Tester:</span>
                                <a href="https://www.linkedin.com/in/nveraadithya-2006v" target="_blank" rel="noopener noreferrer" className="team-name">
                                    VERAADITHYA <FaLinkedin className="team-li-icon" size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Music Player */}
            <div
                ref={playerRef}
                className={`launch-music-player ${isPlaying ? "is-playing" : ""}`}
                onClick={(e) => {
                    // toggle play/pause
                    togglePlay(e);
                    // on mobile, also toggle tooltip
                    if (window.innerWidth <= 640) {
                        e.stopPropagation();
                        setShowTooltip(prev => !prev);
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleTrackEnd();
                }}
                aria-label={isPlaying ? "Pause music" : "Play music"}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        togglePlay();
                    }
                }}
            >
                <div className="vinyl-disk-wrapper">
                    <img src="/vinyl.png" alt="Vinyl record" className="vinyl-disk" />
                </div>
                <div className={`music-tooltip${showTooltip ? " tooltip-mobile-visible" : ""}`}>
                    <span className="tooltip-title">Now Playing:</span>
                    <span className="tooltip-track tooltip-track-truncated">{TRACKS[currentTrack].title}</span>
                    <div className="music-progress-container" onClick={handleSeek}>
                        <div
                            className="music-progress-bar"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <audio
                    ref={audioRef}
                    src={TRACKS[currentTrack].src}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleTrackEnd}
                />
            </div>
        </div>
    );
};

export default LaunchTimer;
