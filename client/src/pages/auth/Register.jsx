import { useNavigate } from "react-router-dom";
import { useState } from "react";

import RegisterForm from "../../components/auth/RegisterForm";
import OtpModal from "../../components/auth/OtpModal";
import illustration from "../../assets/auth-illustration.png";

const Register = () => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const navigate = useNavigate();

  const handleRegisterSuccess = (email) => {
    setRegisteredEmail(email);
    setShowOtpModal(true);
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img
          src={illustration}
          alt="Register illustration"
          className="illustration"
        />
      </div>

      <div className="auth-right">
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </div>

      {showOtpModal && (
        <OtpModal
          open={showOtpModal}
          email={registeredEmail}
          onClose={() => setShowOtpModal(false)}
          onVerify={(code) => {
            console.log("OTP entered:", code);
            handleOtpSuccess();
          }}
          onResend={() => {
            console.log("Resend OTP");
          }}
        />
      )}
    </div>
  );
};

export default Register;
