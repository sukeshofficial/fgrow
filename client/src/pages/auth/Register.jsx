import { useNavigate } from "react-router-dom";
import { useState } from "react";

import RegisterForm from "../../components/auth/RegisterForm";
import OtpModal from "../../components/auth/OtpModal";
import illustration from "../../assets/auth-illustration.png";
import { useAuth } from "../../hooks/useAuth.js";
import { verifyOtp } from "../../features/auth/auth.actions.js";

const Register = () => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();
  const { dispatch } = useAuth();

  const handleRegisterSuccess = (email) => {
    setRegisteredEmail(email);
    setShowOtpModal(true);
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    navigate("/dashboard");
  };

  const handleOtpVerify = async (code) => {
    setOtpLoading(true);
    setOtpError("");
    try {
      await verifyOtp(dispatch, { email: registeredEmail, otp: code });
      handleOtpSuccess();
    } catch (err) {
      setOtpError(
        err.response?.data?.message || "OTP verification failed. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
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
          onVerify={handleOtpVerify}
          onResend={() => {
            console.log("Resend OTP");
          }}
          isLoading={otpLoading}
          error={otpError}
        />
      )}
    </div>
  );
};

export default Register;
