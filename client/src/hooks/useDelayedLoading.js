import { useState, useEffect } from 'react';

/**
 * Hook to delay showing a loading indicator for very fast requests
 * @param {boolean} isLoading - The raw loading state
 * @param {number} delay - Time in ms to wait before showing the loader
 * @returns {boolean}
 */
export function useDelayedLoading(isLoading, delay = 250) {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setShowLoading(true), delay);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return showLoading;
}
