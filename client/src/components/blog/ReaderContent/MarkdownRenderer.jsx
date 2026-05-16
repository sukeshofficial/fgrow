import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Maximize2 } from "lucide-react";
import "./MarkdownRenderer.css";

const SafeImage = ({ src, alt, ...props }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [zoom, setZoom] = useState(false);

    const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000";

    return (
        <div
            className={`mr-img-container ${zoom ? 'mr-img-zoom' : ''}`}
            onClick={() => setZoom(!zoom)}
        >
            {loading && <div className="blog-skeleton mr-img-skeleton" />}
            <img
                src={error ? FALLBACK_IMAGE : src}
                alt={alt}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
                style={{ display: loading ? 'none' : 'block' }}
                {...props}
            />
            {!loading && !error && !zoom && (
                <div className="mr-img-overlay">
                    <Maximize2 size={18} />
                </div>
            )}
        </div>
    );
};

const MarkdownRenderer = ({ content }) => {
    const toId = (str) =>
        String(str).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

    return (
        <div className="blog-reader">
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                    borderRadius: "12px",
                                    margin: "1.5em 0",
                                    background: "#0d1117",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                                {...props}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    h2({ children }) {
                        const id = toId(children);
                        return <h2 id={id}>{children}</h2>;
                    },
                    h3({ children }) {
                        const id = toId(children);
                        return <h3 id={id}>{children}</h3>;
                    },
                    h1({ children }) {
                        const id = toId(children);
                        return <h1 id={id}>{children}</h1>;
                    },
                    img(props) {
                        return <SafeImage {...props} />;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
