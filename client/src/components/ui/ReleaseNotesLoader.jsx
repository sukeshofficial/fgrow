import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import ReleaseNotesModal from "./ReleaseNotesModal";

const ReleaseNotesLoader = () => {
    const { user } = useAuth();
    const [latestRelease, setLatestRelease] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (user) {
            checkReleaseNotes();
        }
    }, [user]);

    const checkReleaseNotes = async () => {
        try {
            // Initial app-settle delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const res = await api.get("/release-notes/latest");
            const release = res.data;

            // Robust version comparison: normalize strings by stripping 'v', whitespace, and case
            const normalizeVersion = (v) => v ? v.toString().toLowerCase().replace(/^v\s*/, '').replace(/\s+/g, '').trim() : "";
            const currentVersion = normalizeVersion(release?.version);
            const userSeenVersion = normalizeVersion(user?.last_seen_version);

            if (release && currentVersion !== userSeenVersion) {
                if (!release.showAsModal) return;

                if (release.autoOpenDelaySeconds > 0) {
                    await new Promise(resolve => setTimeout(resolve, release.autoOpenDelaySeconds * 1000));
                }

                setLatestRelease(release);
                setShowModal(true);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error("Error checking release notes:", err);
            }
        }
    };

    const handleClose = async () => {
        try {
            await api.post("/release-notes/mark-seen", { version: latestRelease.version });
            setShowModal(false);
        } catch (err) {
            console.error("Failed to mark release as seen:", err);
            setShowModal(false); // Close anyway to not block user
        }
    };

    if (!showModal || !latestRelease) return null;

    return <ReleaseNotesModal release={latestRelease} onClose={handleClose} />;
};

export default ReleaseNotesLoader;
