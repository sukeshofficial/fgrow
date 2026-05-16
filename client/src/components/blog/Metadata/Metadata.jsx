// client/src/components/blog/Metadata/Metadata.jsx
import { useEffect } from "react";

/**
 * Metadata component to dynamically update page title and meta tags.
 * Supports: title, description, keywords, og:image, og:title
 */
const Metadata = ({ title, description, keywords, ogImage, ogTitle }) => {
    useEffect(() => {
        // Update Title
        if (title) {
            document.title = `${title} | Insights Hub`;
        }

        // Helper to update or create meta tags
        const updateMeta = (name, content, isProperty = false) => {
            if (!content) return;
            const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement("meta");
                if (isProperty) el.setAttribute("property", name);
                else el.setAttribute("name", name);
                document.head.appendChild(el);
            }
            el.setAttribute("content", content);
        };

        updateMeta("description", description);
        updateMeta("keywords", keywords);
        updateMeta("og:title", ogTitle || title, true);
        updateMeta("og:description", description, true);
        updateMeta("og:image", ogImage, true);
        updateMeta("og:type", "article", true);
        updateMeta("twitter:card", "summary_large_image");

        // Optional: Clean up if needed (though usually we just let the next page overwrite)
    }, [title, description, keywords, ogImage, ogTitle]);

    return null; // This component doesn't render anything
};

export default Metadata;
