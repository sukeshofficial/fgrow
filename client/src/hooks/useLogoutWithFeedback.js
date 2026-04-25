import { useAuth } from "./useAuth.js";
import { useModal } from "../context/ModalContext.jsx";
import { api } from "../api/api.js";

export const useLogoutWithFeedback = () => {
    const { logout, user } = useAuth();
    const { openFeedbackModal } = useModal();

    const handleLogoutWithFeedback = async (e) => {
        if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        if (user) {
            const countKey = `fgrow_logout_count_${user._id}`;
            const count = parseInt(localStorage.getItem(countKey) || "0", 10);

            let interval = 10;
            try {
                const res = await api.get("/system/settings/public");
                if (res.data?.data?.feedback_logout_interval !== undefined) {
                    interval = res.data.data.feedback_logout_interval;
                }
            } catch (err) {
                // Fallback to 10 if network fails to avoid blocking the logout
            }

            // Show feedback on 1st logout (count === 0), and then every Nth time
            if (count === 0 || (count > 0 && interval > 0 && count % interval === 0)) {
                await openFeedbackModal();
            }

            localStorage.setItem(countKey, (count + 1).toString());
        }

        await logout();
    };

    return handleLogoutWithFeedback;
};
