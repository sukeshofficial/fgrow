// client/src/components/blog/TableOfContents/TableOfContents.jsx
import React, { useState, useEffect } from "react";
import "./TableOfContents.css";

const TableOfContents = ({ content }) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState("");

    useEffect(() => {
        const regex = /^(#{1,3})\s+(.+)$/gm;
        const matches = Array.from(content.matchAll(regex));
        const extracted = matches.map((m) => {
            const level = m[1].length;
            const text = m[2];
            const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
            return { id, text, level };
        });
        setHeadings(extracted);
    }, [content]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                });
            },
            { rootMargin: "-20px 0px -60% 0px", threshold: 0.1 }
        );

        headings.forEach((h) => {
            const el = document.getElementById(h.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    const handleClick = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <aside className="toc-aside">
            <div className="toc-heading">On this page</div>
            <ul className="toc-list">
                {headings.map((h) => (
                    <li key={h.id}>
                        <a
                            href={`#${h.id}`}
                            className={[
                                "toc-link",
                                h.level === 1 ? "h1" : h.level === 3 ? "h3" : "",
                                activeId === h.id ? "active" : "",
                            ].filter(Boolean).join(" ")}
                            onClick={(e) => handleClick(e, h.id)}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default TableOfContents;
