import React from 'react';
import BaseSkeleton from './BaseSkeleton';

/**
 * Skeleton for form inputs and wizards.
 */
const FormSkeleton = ({ fields = 4 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '600px' }}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <BaseSkeleton width="120px" height="0.9rem" />
          <BaseSkeleton width="100%" height="40px" borderRadius="6px" />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <BaseSkeleton width="120px" height="40px" borderRadius="6px" />
      </div>
    </div>
  );
};

export default FormSkeleton;
