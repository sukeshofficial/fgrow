import React from 'react';
import './skeleton.css';

/**
 * Reusable animated skeleton block.
 * @param {string} width - e.g. "100%", "200px", "4rem"
 * @param {string} height - e.g. "1rem", "100%", "20px"
 * @param {string} borderRadius - e.g. "4px", "50%"
 * @param {string} className - extra classes
 */
const BaseSkeleton = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`skeleton-base ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

export default BaseSkeleton;
