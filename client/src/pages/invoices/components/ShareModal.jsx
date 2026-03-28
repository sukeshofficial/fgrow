import React, { useState, useEffect } from "react";
import { FiX, FiSend, FiMail, FiMessageSquare, FiType } from "react-icons/fi";
import "./ShareModal.css";

const ShareModal = ({ isOpen, onClose, onSend, initialEmail, businessName, loading }) => {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("Please find the attached invoice for your reference.");

  useEffect(() => {
    if (isOpen) {
      setEmails(initialEmail ? [initialEmail] : []);
      setSubject(`Invoice from ${businessName || "Your Company"}`);
      setInputValue("");
    }
  }, [isOpen, initialEmail, businessName]);

  if (!isOpen) return null;

  const addEmail = (val) => {
    const trimmed = val.trim().replace(/,$/, "");
    if (trimmed && !emails.includes(trimmed)) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      if (isValid) {
        setEmails([...emails, trimmed]);
        setInputValue("");
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (["Enter", "Tab", ",", " "].includes(e.key)) {
      if (e.key === "," || e.key === " ") e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const parts = paste.split(/[,\s\n]+/);
    const newEmails = [...emails];
    parts.forEach(p => {
      const trimmed = p.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      if (trimmed && isValid && !newEmails.includes(trimmed)) {
        newEmails.push(trimmed);
      }
    });
    setEmails(newEmails);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const toSend = [...emails];
    if (inputValue.trim()) {
      const trimmed = inputValue.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      if (isValid && !toSend.includes(trimmed)) {
        toSend.push(trimmed);
      }
    }

    if (toSend.length === 0) return;
    onSend({ to: toSend.join(", "), subject, message });
  };

  return (
    <div className="share-modal-overlay">
      <div className="share-modal-content">
        <div className="share-modal-header">
          <button className="share-modal-close" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="share-modal-icon-wrapper">
              <FiMail size={24} />
            </div>
            <div>
              <h2 className="share-modal-title-title">Share via Email</h2>
              <p className="share-modal-subtitle">Send this invoice directly to your client</p>
            </div>
          </div>
        </div>

        <form className="share-modal-form" onSubmit={handleSubmit}>
          <div className="share-modal-field">
            <label className="share-modal-label">
              <FiMail size={14} /> Recipient Email
            </label>

            <div className="email-chips-container" onClick={() => document.getElementById('email-chip-input-id').focus()}>
              {emails.map((email, index) => (
                <div key={index} className="email-chip">
                  {email}
                  <button
                    type="button"
                    className="email-chip-remove"
                    onClick={(e) => { e.stopPropagation(); removeEmail(index); }}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
              <input
                id="email-chip-input-id"
                type="text"
                className="email-chip-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={emails.length === 0 ? "e.g. client@example.com" : ""}
                autoComplete="off"
              />
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Press comma, enter, or tab to add an email address
            </span>
          </div>

          <div className="share-modal-field">
            <label className="share-modal-label">
              <FiType size={14} /> Subject Line
            </label>
            <input
              type="text"
              className="share-modal-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Enter subject..."
            />
          </div>

          <div className="share-modal-field">
            <label className="share-modal-label">
              <FiMessageSquare size={14} /> Message Body
            </label>
            <textarea
              className="share-modal-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ height: '120px', resize: 'none', padding: '16px' }}
              placeholder="Add a personalized note..."
            />
          </div>

          <div className="share-modal-footer">
            <button
              type="button"
              className="share-modal-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="share-modal-btn-primary"
              disabled={loading || (emails.length === 0 && !inputValue.trim())}
            >
              {loading ? (
                <div className="share-spinner"></div>
              ) : (
                <><FiSend size={18} /> Send Invoice</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
