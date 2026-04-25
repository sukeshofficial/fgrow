import { useAuth } from "./useAuth.js";
import { useModal } from "../context/ModalContext.jsx";
import { api } from "../api/api.js";

export const useLogoutWithFeedback = () => {
    const { logout, user, meState, tenant } = useAuth();
    const { openFeedbackModal } = useModal();

    const handleLogoutWithFeedback = async (e) => {
        if (e && typeof e.preventDefault === "function") {
            try { e.preventDefault(); } catch (ex) { }
        }

        try {
            const isUnverified = meState === "PENDING_VERIFICATION" ||
                meState === "NO_TENANT" ||
                meState === "TENANT_MISSING" ||
                meState === "REJECTED_VERIFICATION" ||
                tenant?.verificationStatus === "pending" ||
                tenant?.verificationStatus === "rejected";

            if (user && !isUnverified) {
                const countKey = `fgrow_logout_count_${user._id || user.id || "guest"}`;
                const countStr = localStorage.getItem(countKey);
                const count = countStr ? parseInt(countStr, 10) : 0;

                let interval = 10;
                try {
                    const res = await api.get("/system/settings/public");
                    if (res.data?.data?.feedback_logout_interval !== undefined) {
                        interval = parseInt(res.data.data.feedback_logout_interval, 10) || 10;
                    }
                } catch (err) {
                    console.error("Logout config fetch failed (fallback to 10)", err.message);
                }

                if (count === 0 || (count > 0 && interval > 0 && count % interval === 0)) {
                    if (typeof openFeedbackModal === 'function') {
                        try {
                            const result = await openFeedbackModal();
                        } catch (ex) {
                            console.error("Modal execution failure", ex);
                        }
                    }
                }

                localStorage.setItem(countKey, (count + 1).toString());
            }
        } catch (error) {
            console.error("Feedback interceptor failed unexpectedly:", error);
        } finally {
            // ALWAYS execute standard logout process so the user is never stuck
            await logout();
        }
    };

    return handleLogoutWithFeedback;
};
