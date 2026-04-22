import React from 'react';

/**
 * A lightweight markdown renderer that handles:
 * - **bold**
 * - *italic*
 * - `code`
 * - [link text](url)
 */
const MarkdownText = ({ text, style }) => {
    if (!text) return null;

    // Regex patterns
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    const codeRegex = /`(.*?)`/g;
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;

    // Split and map function to handle multiple patterns
    // We'll use a simple multi-pass replacement for common patterns
    const parseMarkdown = (input) => {
        let parts = [{ type: 'text', content: input }];

        // Handle Links
        parts = parts.flatMap(part => {
            if (part.type !== 'text') return part;
            const subParts = [];
            let lastIndex = 0;
            let match;
            while ((match = linkRegex.exec(part.content)) !== null) {
                if (match.index > lastIndex) {
                    subParts.push({ type: 'text', content: part.content.substring(lastIndex, match.index) });
                }
                subParts.push({ type: 'link', text: match[1], url: match[2] });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < part.content.length) {
                subParts.push({ type: 'text', content: part.content.substring(lastIndex) });
            }
            linkRegex.lastIndex = 0; // reset
            return subParts.length > 0 ? subParts : part;
        });

        // Handle Bold
        parts = parts.flatMap(part => {
            if (part.type !== 'text') return part;
            const subParts = [];
            let lastIndex = 0;
            let match;
            while ((match = boldRegex.exec(part.content)) !== null) {
                if (match.index > lastIndex) {
                    subParts.push({ type: 'text', content: part.content.substring(lastIndex, match.index) });
                }
                subParts.push({ type: 'bold', content: match[1] });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < part.content.length) {
                subParts.push({ type: 'text', content: part.content.substring(lastIndex) });
            }
            boldRegex.lastIndex = 0;
            return subParts.length > 0 ? subParts : part;
        });

        // Handle Italic
        parts = parts.flatMap(part => {
            if (part.type !== 'text') return part;
            const subParts = [];
            let lastIndex = 0;
            let match;
            while ((match = italicRegex.exec(part.content)) !== null) {
                if (match.index > lastIndex) {
                    subParts.push({ type: 'text', content: part.content.substring(lastIndex, match.index) });
                }
                subParts.push({ type: 'italic', content: match[1] });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < part.content.length) {
                subParts.push({ type: 'text', content: part.content.substring(lastIndex) });
            }
            italicRegex.lastIndex = 0;
            return subParts.length > 0 ? subParts : part;
        });

        // Handle Code
        parts = parts.flatMap(part => {
            if (part.type !== 'text') return part;
            const subParts = [];
            let lastIndex = 0;
            let match;
            while ((match = codeRegex.exec(part.content)) !== null) {
                if (match.index > lastIndex) {
                    subParts.push({ type: 'text', content: part.content.substring(lastIndex, match.index) });
                }
                subParts.push({ type: 'code', content: match[1] });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < part.content.length) {
                subParts.push({ type: 'text', content: part.content.substring(lastIndex) });
            }
            codeRegex.lastIndex = 0;
            return subParts.length > 0 ? subParts : part;
        });

        return parts;
    };

    const renderedParts = parseMarkdown(text);

    return (
        <span style={style}>
            {renderedParts.map((part, i) => {
                switch (part.type) {
                    case 'bold':
                        return <strong key={i} style={{ fontWeight: 800, color: '#0f172a' }}>{part.content}</strong>;
                    case 'italic':
                        return <em key={i} style={{ fontStyle: 'italic' }}>{part.content}</em>;
                    case 'code':
                        return (
                            <code key={i} style={{
                                background: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.85em',
                                fontFamily: 'monospace',
                                color: '#ef4444'
                            }}>
                                {part.content}
                            </code>
                        );
                    case 'link':
                        return (
                            <a
                                key={i}
                                href={part.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}
                            >
                                {part.text}
                            </a>
                        );
                    default:
                        return <span key={i}>{part.content}</span>;
                }
            })}
        </span>
    );
};

export default MarkdownText;
