import { WelcomeCard } from "./WelcomeCard";
import "../../styles/welcome.css";

export const WelcomeModal = ({
  open,
  onClose,
  onCreateTenant,
  onJoinAsStaff,
}) => {
  if (!open) return null;

  return (
    <div
      className="welcome-modal-overlay"
      aria-modal="true"
      role="dialog"
      aria-labelledby="welcome-modal-title"
    >
      <div className="welcome-modal">
        <button
          type="button"
          className="welcome-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <WelcomeCard
          onCreateTenant={onCreateTenant}
          onJoinAsStaff={onJoinAsStaff}
        />
      </div>
    </div>
  );
};

export default WelcomeModal;
