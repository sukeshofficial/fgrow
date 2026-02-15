import { useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import illustration from "../../assets/auth-illustration.png";

import "../../styles/auth.css";

const Login = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img
          src={illustration}
          alt="Login illustration"
          className="illustration"
        />
      </div>

      <div className="auth-right">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};

export default Login;
