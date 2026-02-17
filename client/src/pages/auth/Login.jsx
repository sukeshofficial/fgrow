import { useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import illustration from "../../assets/auth-illustration.png";

import "../../styles/auth.css";

/**
 * Login page
 *
 * Renders the login layout and handles post-login navigation.
 */
const Login = () => {
  /**
   * Router navigation
   */
  const navigate = useNavigate();

  /**
   * Redirect user after successful login
   */
  const handleLoginSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-page">
      {/* Left illustration section */}
      <div className="auth-left">
        <img
          src={illustration}
          alt="Login illustration"
          className="illustration"
        />
      </div>

      {/* Right form section */}
      <div className="auth-right">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};

export default Login;
