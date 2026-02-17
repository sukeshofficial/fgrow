// src/components/auth/AvatarUpload.jsx
import React, { useCallback, useRef, useState } from "react";

/**
 * Avatar upload constraints
 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * AvatarUpload
 *
 * Reusable component for uploading and previewing user avatar images.
 * Supports click-to-upload, drag-and-drop, validation, and preview rendering.
 */
export default function AvatarUpload({
  onFileChange,
  initialUrl = null,
  size = 96,
}) {
  /**
   * Component state
   */
  const [preview, setPreview] = useState(initialUrl);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * Hidden file input reference
   */
  const inputRef = useRef(null);

  /**
   * Validates file, generates preview, and emits file to parent
   */
  const emitFile = useCallback(
    (file) => {
      setError("");

      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPG / PNG / WEBP allowed");
        return;
      }

      if (file.size > MAX_BYTES) {
        setError("File too large (max 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      onFileChange?.(file);
    },
    [onFileChange],
  );

  /**
   * Input file selection handler
   */
  const handleFileInput = (e) => {
    emitFile(e.target.files?.[0]);
  };

  /**
   * Drag-and-drop handler
   */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    emitFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      className="avatar-upload-root"
      style={{ "--avatar-size": `${size}px` }}
    >
      {/* Upload dropzone */}
      <div
        className={`avatar-dropzone ${isDragOver ? "drag-over" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload profile picture"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            inputRef.current?.click();
          }
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar preview"
            className="avatar-preview"
          />
        ) : (
          <div className="avatar-placeholder">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 12a4 4 0 100-8 4 4 0 000 8z"
                stroke="#9CA3AF"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 21a8 8 0 10-16 0"
                stroke="#E5E7EB"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="avatar-placeholder-text">Upload</div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={handleFileInput}
      />

      {/* Action buttons */}
      <div className="avatar-controls">
        <button
          type="button"
          className="avatar-btn"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </button>

        <button
          type="button"
          className="avatar-btn clear"
          onClick={() => {
            setPreview(null);
            setError("");
            onFileChange?.(null);
          }}
        >
          Remove
        </button>
      </div>

      {/* Validation error */}
      {error && <div className="avatar-error">{error}</div>}

      {/* File requirements hint */}
      <div className="avatar-hint">JPG/PNG/WEBP • max 5MB</div>
    </div>
  );
}
