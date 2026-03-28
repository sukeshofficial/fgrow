import { useState } from "react";
import { inviteUser } from "../../api/invitation.api";
import { Button } from "../ui/Button";
import "../../styles/welcome.css";

const InviteUserModal = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await inviteUser({ email, tenant_role: role });
      setSuccess(`Invitation sent to ${email} successfully!`);
      setEmail("");
      // Refresh the list immediately
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal">
        <button className="welcome-modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 className="welcome-card-title">Invite New Member</h2>
        <p className="welcome-card-subtitle">
          Send an invitation link to a colleague to join your organization.
        </p>

        {error && <div className="tenant-form-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        {success && <div className="tenant-form-success" style={{ marginBottom: "1rem", color: "#166534", backgroundColor: "#dcfce7", padding: "0.75rem", borderRadius: "8px" }}>{success}</div>}

        <form onSubmit={handleSubmit} className="tenant-form">
          <div className="tenant-form-fields">
            <label className="tenant-label">
              <span>
                Email Address <span className="tenant-required">*</span>
              </span>
              <input
                type="email"
                className="tenant-input"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="tenant-label">
              <span> Assign Role <span className="tenant-required">*</span> </span>
              <select
                className="tenant-input"
                value={role}
                disabled
                style={{ cursor: "not-allowed", opacity: 0.7 }}
              >
                <option value="staff">Staff</option>
              </select>
            </label>
          </div>

          <div className="tenant-actions" style={{ marginTop: "1.5rem" }}>
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
