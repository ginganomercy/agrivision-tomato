import React from 'react';

export interface LootToastItem {
  id: number;
  name: string;
  icon: string;
  qty: number;
}

export interface LootToastContainerProps {
  lootToasts: LootToastItem[];
  isMobileLandscape: boolean;
}

export const LootToastContainer: React.FC<LootToastContainerProps> = ({
  lootToasts,
  isMobileLandscape,
}) => {
  if (lootToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: isMobileLandscape ? 84 : 96,
        left: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 35,
        pointerEvents: 'none',
      }}
    >
      {lootToasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(52, 211, 153, 0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '6px 12px',
            color: '#F8FAFC',
            fontSize: 11,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
          }}
        >
          <span style={{ fontSize: 16 }}>{toast.icon}</span>
          <span>
            +{toast.qty} <strong style={{ color: '#34D399' }}>{toast.name}</strong> masuk ke tas!
          </span>
        </div>
      ))}
    </div>
  );
};
