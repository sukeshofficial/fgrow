import React, { useEffect, useRef, useState } from "react";
import warning from "../../assets/warning.svg";
/**
 * Configuration
 */
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const RESEND_LOCK_SECONDS = 30;


/**
 * OtpModal
 *
 * Modal component for email OTP verification.
 * Handles digit input, keyboard navigation, paste support,
 * and verification flow.
 */
const OtpModal = ({
  open,
  onClose,
  onVerify,
  onResend,
  email,
  isLoading = false,
  error = "",
}) => {
  /**
   * OTP values and input refs
   */
  const [vals, setVals] = useState(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const hasAutoResentRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendLock, setResendLock] = useState(RESEND_LOCK_SECONDS);


  /**
   * Reset OTP state and focus first input when modal opens
   */
  useEffect(() => {
    if (!open) return;

    setVals(Array(OTP_LENGTH).fill(""));

    const timer = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open]);

  /**
   * Do not close modal on ESC key
   */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    setTimeLeft(OTP_EXPIRY_SECONDS);
    setResendLock(RESEND_LOCK_SECONDS);
    hasAutoResentRef.current = false;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
      setResendLock((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);


  useEffect(() => {
    if (!open) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (timeLeft === 0 && !hasAutoResentRef.current) {
      hasAutoResentRef.current = true;

      onResend(); // ✅ SAFE here
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setResendLock(RESEND_LOCK_SECONDS);
    }
  }, [timeLeft, open, onResend]);

  if (!open) return null;

  /**
   * Handle single digit input and auto-focus next field
   */
  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
    if (!digit) return;

    const next = [...vals];
    next[index] = digit;
    setVals(next);

    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /**
   * Handle backspace navigation and deletion
   */
  const handleKeyDown = (index, e) => {
    if (e.key !== "Backspace") return;

    e.preventDefault();
    const next = [...vals];

    if (next[index]) {
      next[index] = "";
      setVals(next);
      return;
    }

    if (index > 0) {
      inputsRef.current[index - 1]?.focus();
      next[index - 1] = "";
      setVals(next);
    }
  };

  /**
   * Handle full OTP paste
   */
  const handlePaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!paste) return;

    const next = Array(OTP_LENGTH).fill("");
    paste.split("").forEach((digit, i) => {
      next[i] = digit;
    });

    setVals(next);

    setTimeout(() => {
      inputsRef.current[
        Math.min(paste.length, OTP_LENGTH - 1)
      ]?.focus();
    }, 50);

    e.preventDefault();
  };

  /**
   * Format time left as MM:SS
   */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };


  /**
   * Submit OTP for verification
   */
  const submit = () => {
    const code = vals.join("");
    if (code.length !== OTP_LENGTH) return;
    onVerify(code);
  };

  return (
    <div
      className="otp-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className="otp-modal"
        onClick={(e) => { e.stopPropagation() }}
      >
        <h3>Verify your email</h3>

        <p className="otp-timer">
          Code expires in <strong>{formatTime(timeLeft)}</strong>
        </p>


        <p className="muted">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        {/* Error message */}
        {error && (
          <div role="alert" className="form-error">
            {error}
          </div>
        )}

        {/* OTP input fields */}
        <div className="otp-inputs" onPaste={handlePaste}>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className="otp-cell"
              value={vals[index]}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <div className="otp-alert otp-alert--error" role="alert">
          <div className="otp-alert__icon"><img src={warning} alt="Warning icon" /></div>
          <div className="otp-alert__content">
            <div className="otp-alert__title">Verification required</div>
            <div className="otp-alert__message">
              Do not close this tab. If verification is not completed,
              <strong> you will need to restart the registration process</strong>.
            </div>

          </div>
        </div>

        <div className="row-between small-gap">
          <button
            type="button"
            className="link-btn"
            onClick={onResend}
            disabled={isLoading || resendLock > 0}
          >
            {resendLock > 0
              ? `Resend in ${resendLock}s`
              : isLoading
                ? "Sending..."
                : "Resend code"}
          </button>

          <div className="otp-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={submit}
              disabled={
                vals.some((v) => !v) ||
                isLoading ||
                timeLeft === 0
              }
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OtpModal;
