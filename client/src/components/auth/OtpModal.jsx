import React, { useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;

const OtpModal = ({ open, onClose, onVerify, onResend, email, isLoading = false, error = "" }) => {
  const [vals, setVals] = useState(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    if (open) {
      setVals(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

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

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...vals];

      if (next[index]) {
        next[index] = "";
        setVals(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        next[index - 1] = "";
        setVals(next);
      }
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!paste) return;

    const next = Array(OTP_LENGTH).fill("");
    paste.split("").forEach((d, i) => (next[i] = d));
    setVals(next);

    setTimeout(
      () => inputsRef.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus(),
      50,
    );

    e.preventDefault();
  };

  const submit = () => {
    const code = vals.join("");
    if (code.length !== OTP_LENGTH) return;
    onVerify(code);
  };

  return (
    <div className="otp-overlay" role="dialog" aria-modal="true">
      <div className="otp-modal">
        <h3>Verify your email</h3>

        <p className="muted">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        {error && (
          <div role="alert" className="form-error">
            {error}
          </div>
        )}

        <div className="otp-inputs" onPaste={handlePaste}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className="otp-cell"
              value={vals[i]}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`OTP digit ${i + 1}`}
            />
          ))}
        </div>

        <div className="row-between small-gap">
          <button type="button" className="link-btn" onClick={onResend}>
            Resend code
          </button>

          <div className="otp-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={submit}
              disabled={vals.some((v) => !v) || isLoading}
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
