import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import ReleaseNotesModal from "./ReleaseNotesModal";

const ReleaseNotesLoader = () => {
    const { user } = useAuth();
    const [releases, setReleases] = useState([]);
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

            const res = await api.get("/release-notes/history");
            const fetchedReleases = res.data;

            if (!fetchedReleases || fetchedReleases.length === 0) return;

            const latest = fetchedReleases[0];

            // Robust version comparison: normalize strings by stripping 'v', whitespace, and case
            const normalizeVersion = (v) => v ? v.toString().toLowerCase().replace(/^v\s*/, '').replace(/\s+/g, '').trim() : "";
            const currentVersion = normalizeVersion(latest?.version);
            const userSeenVersion = normalizeVersion(user?.last_seen_version);

            if (latest && currentVersion !== userSeenVersion) {
                if (!latest.showAsModal) return;

                if (latest.autoOpenDelaySeconds > 0) {
                    await new Promise(resolve => setTimeout(resolve, latest.autoOpenDelaySeconds * 1000));
                }

                setReleases(fetchedReleases);
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
            if (releases.length > 0) {
                await api.post("/release-notes/mark-seen", { version: releases[0].version });
            }
            setShowModal(false);
        } catch (err) {
            console.error("Failed to mark release as seen:", err);
            setShowModal(false); // Close anyway to not block user
        }
    };

    if (!showModal || releases.length === 0) return null;

    return <ReleaseNotesModal releases={releases} onClose={handleClose} />;
};

export default ReleaseNotesLoader;
