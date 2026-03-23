import React from 'react';
import BaseSkeleton from './BaseSkeleton';

/**
 * Skeleton for the tenant info dashboard section.
 */
const DashboardSkeleton = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '24px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        gap: '24px',
        marginBottom: '24px'
      }}
    >
      <BaseSkeleton width="80px" height="80px" borderRadius="16px" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <BaseSkeleton width="250px" height="2rem" />
        <BaseSkeleton width="200px" height="1rem" />
        <BaseSkeleton width="100px" height="24px" borderRadius="12px" />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
