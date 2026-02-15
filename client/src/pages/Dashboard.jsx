import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>

      {user && (
        <div className="dashboard-user">
          <p>
            Welcome, <strong>{user.name}</strong>
          </p>
          <p>Email: {user.email}</p>
        </div>
      )}

      <button type="button" className="dashboard-logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
