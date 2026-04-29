import React, { useState, useEffect } from 'react';

export const Spinner = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="spinner-container">
      <div className="spinner" />
      <div className="loading-timer-chip">
        {seconds}s
      </div>
    </div>
  );
};

