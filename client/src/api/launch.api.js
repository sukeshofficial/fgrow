import { api } from "./api";

/**
 * Get all launch subscribers
 */
export const getSubscribers = () => api.get("/launch/subscribers");

/**
 * Trigger launch announcement manually
 */
export const triggerLaunchAnnouncement = () => api.post("/launch/trigger");
