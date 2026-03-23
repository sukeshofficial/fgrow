import React from 'react';
import BaseSkeleton from './BaseSkeleton';

/**
 * Skeleton for generic dashboard cards.
 */
const CardSkeleton = ({ rows = 3, className = '' }) => {
  return (
    <div
      className={`card-skeleton ${className}`}
      style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BaseSkeleton width="48px" height="48px" borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <BaseSkeleton width="60%" height="1.2rem" />
          <BaseSkeleton width="40%" height="0.8rem" />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <BaseSkeleton key={i} width={i === rows - 1 ? '70%' : '100%'} height="1rem" />
        ))}
      </div>
    </div>
  );
};

export default CardSkeleton;
