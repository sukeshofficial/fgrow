import React from 'react';
import BaseSkeleton from './BaseSkeleton';

/**
 * Skeleton designed for typical 5-7 column structured tables.
 */
const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <BaseSkeleton height="1rem" width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  {colIndex === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <BaseSkeleton width="32px" height="32px" borderRadius="50%" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <BaseSkeleton width="80%" height="0.9rem" />
                        <BaseSkeleton width="40%" height="0.7rem" />
                      </div>
                    </div>
                  ) : (
                    <BaseSkeleton height="1rem" width={Math.random() > 0.5 ? '80%' : '50%'} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;
