import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import "../../styles/welcome.css";

export const WelcomeCard = ({ onCreateTenant, onJoinAsStaff }) => {
  return (
    <Card className="welcome-action-card">
      <h2 className="welcome-card-title">Welcome to FGrow</h2>
      <p className="welcome-card-subtitle">
        Please select an option to get started
      </p>

      <div className="welcome-card-actions">
        <Button variant="primary" size="lg" onClick={onCreateTenant}>
          Create Tenant
        </Button>
        <Button variant="secondary" size="lg" onClick={onJoinAsStaff}>
          Join as Staff
        </Button>
      </div>
    </Card>
  );
};

export default WelcomeCard;
