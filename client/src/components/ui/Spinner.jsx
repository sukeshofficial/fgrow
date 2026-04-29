import React, { useState, useEffect } from 'react';

/**
 * Premium, production-ready orbital loading spinner.
 * Supports customization of size, color, text, and speed.
 */
export const Spinner = ({
  size = 'md',
  color = '#3498db',
  text = 'Loading',
  speed = '1.5s',
  className = '',
  showTimer = true,
  fullScreen = false,
  centered = true,
}) => {


  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!showTimer) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 10);
    return () => clearInterval(interval);
  }, [showTimer]);


  const sizeMap = {
    sm: '32px',
    md: '48px',
    lg: '64px',
    xl: '96px',
  };

  const spinnerSize = sizeMap[size] || size;

  return (
    <div
      className={`premium-spinner-container ${fullScreen ? 'full-screen' : ''} ${centered ? 'centered' : ''} ${className}`}


      role="status"
      aria-label={`${text}${showTimer ? ` elapsed ${seconds} seconds` : ''}`}
      style={{
        '--spinner-size': spinnerSize,
        '--spinner-color': color,
        '--spinner-speed': speed,
      }}
    >
      <div className="spinner-orbital-wrapper">
        <div className="orbital-ring ring-1" />
        <div className="orbital-ring ring-2" />
        <div className="orbital-ring ring-3" />
        <div className="spinner-core">
          <div className="core-glow" />
        </div>
      </div>

      {(text || showTimer) && (
        <div className="spinner-info">
          {text && <span className="spinner-text">{text}</span>}
          {showTimer && (
            <div className="loading-timer-chip">
              {(seconds / 100).toFixed(2)}s
            </div>
          )}

        </div>
      )}
    </div>
  );
};



