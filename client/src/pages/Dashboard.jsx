import { useAuth } from "../hooks/useAuth";

import Navbar from "../components/NavBar";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <Navbar />
      <div className="dashboard"></div>
    </>
  );
};

export default Dashboard;
